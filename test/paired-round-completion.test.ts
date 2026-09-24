import { describe, expect, it } from "vitest";
import {
  OPEN_STALL_MS,
  PEAK_SCALE,
  QUIET_AFTER_SPEECH_MS,
  RMS_SCALE,
  STALL_MS,
  createRoundTracker,
  type RoundProgress,
  type RoundTracker,
} from "../src/lib/paired-round/completion";
import type { Point } from "../src/lib/paired-round/transcript";

const PATH: Point[] = [
  { x: 200, y: 800 },
  { x: 200, y: 200 },
  { x: 800, y: 800 },
  { x: 800, y: 200 },
];

const QUIET = 0.003;
const SPEECH = 0.08;
const READING_MS = 85;

/** Feeds readings at the SDK's buffer cadence and returns the last progress and the clock. */
function feed(tracker: RoundTracker, level: number, durationMs: number, from: number) {
  let now = from;
  let progress: RoundProgress = "open";
  const seen: RoundProgress[] = [];
  for (let elapsed = 0; elapsed < durationMs; elapsed += READING_MS) {
    now += READING_MS;
    progress = tracker.hear(level, now);
    seen.push(progress);
  }
  return { progress, now, seen };
}

function traceAll(tracker: RoundTracker, path: Point[]) {
  for (const point of path) tracker.reach({ x: point.x + 30, y: point.y - 30 });
}

describe("createRoundTracker", () => {
  it("finishes when the word comes first and the trace completes after it", () => {
    const tracker = createRoundTracker(RMS_SCALE);
    tracker.begin(PATH, true);
    let clock = feed(tracker, QUIET, 500, 0);
    clock = feed(tracker, SPEECH, 400, clock.now);
    clock = feed(tracker, QUIET, 2_000, clock.now);
    expect(clock.progress).toBe("open");

    traceAll(tracker, PATH);
    expect(tracker.hear(QUIET, clock.now + READING_MS)).toBe("complete");
  });

  it("waits for quiet when the trace completes first", () => {
    const tracker = createRoundTracker(RMS_SCALE);
    tracker.begin(PATH, true);
    let clock = feed(tracker, QUIET, 500, 0);
    traceAll(tracker, PATH);
    clock = feed(tracker, SPEECH, 400, clock.now);
    expect(clock.progress).toBe("open");

    clock = feed(tracker, QUIET, QUIET_AFTER_SPEECH_MS - 100, clock.now);
    expect(clock.progress).toBe("open");
    clock = feed(tracker, QUIET, 200, clock.now);
    expect(clock.seen).toContain("complete");
  });

  it("does not end a round inside a short pause between syllables", () => {
    const tracker = createRoundTracker(RMS_SCALE);
    tracker.begin(PATH, true);
    let clock = feed(tracker, QUIET, 500, 0);
    traceAll(tracker, PATH);
    clock = feed(tracker, SPEECH, 250, clock.now);
    clock = feed(tracker, QUIET, 300, clock.now);
    expect(clock.seen).not.toContain("complete");
    clock = feed(tracker, SPEECH, 250, clock.now);
    expect(clock.seen).not.toContain("complete");
  });

  it("ignores a click too short to be a word", () => {
    const tracker = createRoundTracker(RMS_SCALE);
    tracker.begin(PATH, true);
    let clock = feed(tracker, QUIET, 500, 0);
    traceAll(tracker, PATH);
    clock = feed(tracker, SPEECH, READING_MS, clock.now);
    clock = feed(tracker, QUIET, 1_500, clock.now);
    expect(clock.seen).not.toContain("complete");
  });

  it("offers to continue when the trace never reaches every waypoint", () => {
    const tracker = createRoundTracker(RMS_SCALE);
    tracker.begin(PATH, true);
    tracker.reach(PATH[0]!);
    let clock = feed(tracker, QUIET, 500, 0);
    clock = feed(tracker, SPEECH, 400, clock.now);
    clock = feed(tracker, QUIET, OPEN_STALL_MS - 1_200, clock.now);
    expect(clock.progress).toBe("open");
    clock = feed(tracker, QUIET, 400, clock.now);
    expect(clock.progress).toBe("stalled");
    expect(clock.seen).not.toContain("complete");
  });

  it("does not add scattered clicks up into a word", () => {
    const tracker = createRoundTracker(RMS_SCALE);
    tracker.begin(PATH, true);
    let clock = feed(tracker, QUIET, 500, 0);
    traceAll(tracker, PATH);
    const seen: RoundProgress[] = [];
    for (let click = 0; click < 12; click += 1) {
      clock = feed(tracker, SPEECH, READING_MS, clock.now);
      seen.push(...clock.seen);
      clock = feed(tracker, QUIET, 800, clock.now);
      seen.push(...clock.seen);
    }
    expect(seen).not.toContain("complete");
    expect(clock.progress).toBe("stalled");
  });

  it("needs every waypoint, not the last one alone", () => {
    const tracker = createRoundTracker(RMS_SCALE);
    tracker.begin(PATH, true);
    let clock = feed(tracker, QUIET, 500, 0);
    tracker.reach(PATH[3]!);
    clock = feed(tracker, SPEECH, 400, clock.now);
    clock = feed(tracker, QUIET, 1_500, clock.now);
    expect(clock.seen).not.toContain("complete");
  });

  it("finishes a speech-only round without a trace", () => {
    const tracker = createRoundTracker(PEAK_SCALE);
    tracker.begin([], false);
    let clock = feed(tracker, 0.02, 500, 0);
    clock = feed(tracker, 0.4, 400, clock.now);
    clock = feed(tracker, 0.02, 800, clock.now);
    expect(clock.seen).toContain("complete");
  });

  it("counts speech that starts on the first reading", () => {
    const tracker = createRoundTracker(RMS_SCALE);
    tracker.begin(PATH, true);
    traceAll(tracker, PATH);
    let clock = feed(tracker, SPEECH, 400, 0);
    clock = feed(tracker, QUIET, 800, clock.now);
    expect(clock.seen).toContain("complete");
  });

  it("raises the bar in a noisy room, then offers to continue when nothing clears it", () => {
    const tracker = createRoundTracker(RMS_SCALE);
    tracker.begin(PATH, true);
    // A room at 0.02 RMS would pass the absolute bar alone. The floor keeps it from reading
    // as speech, so the round stalls instead of finishing on noise.
    let clock = feed(tracker, 0.02, 1_000, 0);
    traceAll(tracker, PATH);
    clock = feed(tracker, 0.02, STALL_MS - 200, clock.now);
    expect(clock.seen).not.toContain("complete");
    expect(clock.progress).toBe("open");
    clock = feed(tracker, 0.02, 400, clock.now);
    expect(clock.progress).toBe("stalled");
  });

  it("reports complete once, then stalled, so a failed submission is not retried on every reading", () => {
    const tracker = createRoundTracker(RMS_SCALE);
    tracker.begin(PATH, true);
    let clock = feed(tracker, QUIET, 500, 0);
    traceAll(tracker, PATH);
    clock = feed(tracker, SPEECH, 400, clock.now);
    clock = feed(tracker, QUIET, 1_000, clock.now);
    expect(clock.seen.filter((progress) => progress === "complete")).toHaveLength(1);
    expect(clock.progress).toBe("stalled");
  });

  it("starts each round with no speech carried over", () => {
    const tracker = createRoundTracker(RMS_SCALE);
    tracker.begin(PATH, true);
    let clock = feed(tracker, QUIET, 500, 0);
    traceAll(tracker, PATH);
    clock = feed(tracker, SPEECH, 400, clock.now);
    clock = feed(tracker, QUIET, 800, clock.now);
    expect(clock.seen).toContain("complete");

    tracker.begin(PATH, true);
    traceAll(tracker, PATH);
    clock = feed(tracker, QUIET, 1_500, clock.now);
    expect(clock.seen).not.toContain("complete");
  });

  it("ignores digital silence while the microphone opens", () => {
    const tracker = createRoundTracker(RMS_SCALE);
    tracker.begin(PATH, true);
    let clock = feed(tracker, 0, 300, 0);
    clock = feed(tracker, 0.02, 3_000, clock.now);
    traceAll(tracker, PATH);
    clock = feed(tracker, 0.02, 1_500, clock.now);
    expect(clock.seen).not.toContain("complete");
  });
});
