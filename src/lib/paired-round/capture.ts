/**
 * One continuous microphone stream for a whole session.
 *
 * The interaction stays continuous, so the stream opens once and each round is a range of
 * sample indices inside it. Opening a new stream for each round would put a permission
 * prompt and a device warm-up between rounds, which is not the interaction under test.
 *
 * Nothing here extracts features. It records the samples the round runner slices, and the
 * runner discards them once the finalize request returns.
 */

const PROCESSOR_BUFFER = 4096;

/**
 * The one rate the transcript accepts. Declared here rather than imported from the SDK: the
 * SDK's entry point re-exports feature extraction and proving, and pulling one constant
 * through it drags that whole graph into a route that must not carry it.
 */
const SAMPLE_RATE = 16_000;

/**
 * The prototype asks for a plain mono stream at the canonical rate. It runs no feature
 * extraction, so it needs none of the projection-dependent constraint selection the
 * identity capture applies. Browser processing stays off, because gain control moving
 * between rounds would show up in the loudness buckets.
 */
const CAPTURE_CONSTRAINTS: MediaTrackConstraints = {
  sampleRate: SAMPLE_RATE,
  channelCount: 1,
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
};

export interface ContinuousCapture {
  /** Sample index at this moment. Marks the boundary between rounds. */
  mark(): number;
  slice(from: number, to: number): Float32Array;
  /** Latest input level in [0, 1], for the level meter. */
  level(): number;
  stop(): void;
}

export async function startContinuousCapture(): Promise<ContinuousCapture> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: CAPTURE_CONSTRAINTS,
  });

  let context: AudioContext;
  let source: MediaStreamAudioSourceNode;
  try {
    context = new AudioContext({ sampleRate: SAMPLE_RATE });
    // iOS suspends a context created outside a user gesture.
    await context.resume();
    source = context.createMediaStreamSource(stream);
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    throw error;
  }

  const chunks: Float32Array[] = [];
  let total = 0;
  let latestLevel = 0;
  let stopped = false;

  const processor = context.createScriptProcessor(PROCESSOR_BUFFER, 1, 1);
  processor.onaudioprocess = (event) => {
    if (stopped) return;
    const input = event.inputBuffer.getChannelData(0);
    const copy = new Float32Array(input.length);
    copy.set(input);
    chunks.push(copy);
    total += copy.length;
    let peak = 0;
    for (let index = 0; index < copy.length; index += 16) {
      const value = Math.abs(copy[index] ?? 0);
      if (value > peak) peak = value;
    }
    latestLevel = peak;
  };
  source.connect(processor);
  // A ScriptProcessor only fires while it is connected to a destination. The gain node sits
  // at zero so nothing plays back through the speakers.
  const silence = context.createGain();
  silence.gain.value = 0;
  processor.connect(silence);
  silence.connect(context.destination);

  return {
    mark: () => total,
    level: () => latestLevel,
    slice(from: number, to: number): Float32Array {
      const start = Math.max(0, Math.min(from, total));
      const end = Math.max(start, Math.min(to, total));
      const out = new Float32Array(end - start);
      let offset = 0;
      let position = 0;
      for (const chunk of chunks) {
        const chunkStart = position;
        const chunkEnd = position + chunk.length;
        position = chunkEnd;
        if (chunkEnd <= start) continue;
        if (chunkStart >= end) break;
        const sliceStart = Math.max(0, start - chunkStart);
        const sliceEnd = Math.min(chunk.length, end - chunkStart);
        out.set(chunk.subarray(sliceStart, sliceEnd), offset);
        offset += sliceEnd - sliceStart;
      }
      return out;
    },
    stop() {
      if (stopped) return;
      stopped = true;
      processor.onaudioprocess = null;
      try {
        processor.disconnect();
        silence.disconnect();
        source.disconnect();
      } catch {
        // A closed context throws here. Nothing left to release.
      }
      stream.getTracks().forEach((track) => track.stop());
      void context.close().catch(() => undefined);
      chunks.length = 0;
    },
  };
}

/** Coarse label from the pointer and viewport. No user agent string is sent. */
export function deviceClass(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  const width = window.innerWidth;
  if (!coarsePointer) return "desktop";
  return width >= 768 ? "tablet" : "mobile";
}
