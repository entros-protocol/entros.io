"use client";

/**
 * Measures how far a segmented capture moves the identity feature vector.
 *
 * It records three captures from one person on one device: the current style twice, and the
 * paired-round style once. The repeat gives the same-person same-style drift, which is the
 * reference the style drift has to be read against. Without it a large distance between the two
 * styles proves nothing, because two captures of the same style are not identical either.
 *
 * Every capture runs through the SDK's own extraction path, so the numbers describe the live
 * pipeline rather than a reconstruction of it. Nothing is submitted, no wallet is involved, and
 * no proof is generated. Raw audio, motion and touch never leave the browser: the export holds
 * derived feature vectors and the comparisons between them.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import {
  CANONICAL_SAMPLE_RATE,
  MAX_TRANSMITTED_CAPTURE_MS,
  PulseSDK,
  extractFeatures,
  fetchProjectionPolicy,
  generateLissajousPoints,
  hammingDistance,
  randomLissajousParams,
  simhash,
  type MotionSample,
  type PulseSession,
  type TouchSample,
} from "@entros/pulse-sdk";
import {
  compareVectors,
  featureMoves,
  MIN_ACCEPTED_COSINE,
  type VectorComparison,
} from "@/lib/lab/capture-drift";
import { COORDINATE_MAX, randomPath, realWords } from "@/lib/lab/challenge-material";

/** Current-style capture length. Mirrors the SDK default so the comparison is fair. */
const CURRENT_STYLE_MS = 12_000;

/** Rounds in a paired capture. Mirrors the prototype. */
const PAIRED_ROUNDS = 3;

type RunId = "current-a" | "current-b" | "paired";

interface RunPlan {
  id: RunId;
  style: "current" | "paired";
  title: string;
  instruction: string;
}

const RUNS: RunPlan[] = [
  {
    id: "current-a",
    style: "current",
    title: "Current style, first capture",
    instruction: "Read the phrase out loud while you trace the curve. It runs for 12 seconds.",
  },
  {
    id: "current-b",
    style: "current",
    title: "Current style, repeat",
    instruction:
      "Same again, with a new phrase and curve. This pair sets the drift a normal repeat produces.",
  },
  {
    id: "paired",
    style: "paired",
    title: "Paired rounds",
    instruction:
      "Three rounds. Say the word, trace the short path, then move to the next round. No timer.",
  },
];

/** Transmitted-audio ceiling in samples. The SDK trims to this and the validator truncates past it. */
const MAX_TRANSMITTED_SAMPLES = (MAX_TRANSMITTED_CAPTURE_MS / 1000) * CANONICAL_SAMPLE_RATE;

interface RunResult {
  id: RunId;
  style: "current" | "paired";
  /** Z-scored vector. This is what the fingerprint projects. */
  normalized: number[];
  /** Physical-unit vector, kept so a moved feature can be read in its own units. */
  raw: number[];
  fingerprint: number[];
  durationMs: number;
  audioSamples: number;
  motionSamples: number;
  touchSamples: number;
}

type Stage =
  | { name: "idle" }
  | { name: "arming"; run: RunPlan }
  | { name: "capturing"; run: RunPlan; round: number }
  | { name: "extracting"; run: RunPlan }
  | { name: "failed"; message: string };

export function DriftRunner() {
  const [stage, setStage] = useState<Stage>({ name: "idle" });
  const [results, setResults] = useState<RunResult[]>([]);
  const [phrase, setPhrase] = useState("");
  const [curve, setCurve] = useState<{ x: number; y: number }[]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [waypoints, setWaypoints] = useState<{ x: number; y: number }[]>([]);
  const [level, setLevel] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);
  /**
   * Projection version read from the chain, not the highest the client supports. The two
   * differ, and extracting under the wrong one measures a pipeline no verification runs.
   */
  const [projectionVersion, setProjectionVersion] = useState<number | null>(null);

  const sdkRef = useRef<PulseSDK | null>(null);
  const sessionRef = useRef<PulseSession | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const strokeRef = useRef<SVGPolylineElement | null>(null);
  const tickRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const projectionRef = useRef<number | null>(null);
  const pointsRef = useRef<string[]>([]);

  const done = results.length === RUNS.length;
  const nextRun = RUNS[results.length];

  const sdk = useCallback(() => {
    sdkRef.current ??= new PulseSDK({ cluster: "devnet" });
    return sdkRef.current;
  }, []);

  const clearStroke = useCallback(() => {
    pointsRef.current = [];
    strokeRef.current?.setAttribute("points", "");
  }, []);

  const trackPoint = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const surface = surfaceRef.current?.getBoundingClientRect();
    const stroke = strokeRef.current;
    if (!surface || !stroke) return;
    const x = ((event.clientX - surface.left) / surface.width) * COORDINATE_MAX;
    const y = ((event.clientY - surface.top) / surface.height) * COORDINATE_MAX;
    pointsRef.current.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    stroke.setAttribute("points", pointsRef.current.join(" "));
  }, []);

  const stopTicking = useCallback(() => {
    if (tickRef.current !== null) window.clearInterval(tickRef.current);
    tickRef.current = null;
  }, []);

  const finish = useCallback(
    async (run: RunPlan) => {
      stopTicking();
      const session = sessionRef.current;
      if (!session) return;
      // Read before the sensors stop and extraction runs, which take seconds on their own.
      const durationMs = Math.round(performance.now() - startedAtRef.current);
      setStage({ name: "extracting", run });

      const version = projectionRef.current;
      if (version === null) {
        setStage({ name: "failed", message: "The projection policy was never read" });
        return;
      }

      let audio: Awaited<ReturnType<PulseSession["stopAudio"]>> = null;
      let motion: MotionSample[] = [];
      let touch: TouchSample[] = [];
      try {
        audio = await session.stopAudio();
      } catch {
        // Audio never started. The extractor rejects the capture below.
      }
      try {
        motion = await session.stopMotion();
      } catch {
        motion = [];
      }
      try {
        touch = await session.stopTouch();
      } catch {
        touch = [];
      }
      sessionRef.current = null;

      if (!audio) {
        setStage({ name: "failed", message: "No audio was recorded. Check the microphone." });
        return;
      }

      try {
        const extracted = await extractFeatures(
          {
            audio,
            motion,
            touch,
            modalities: { audio: true, motion: motion.length > 0, touch: touch.length > 0 },
          },
          version,
        );
        setResults((current) => [
          ...current,
          {
            id: run.id,
            style: run.style,
            normalized: extracted.normalized,
            raw: extracted.raw,
            fingerprint: simhash(extracted.normalized, version),
            durationMs,
            audioSamples: audio.samples.length,
            motionSamples: motion.length,
            touchSamples: touch.length,
          },
        ]);
        setStage({ name: "idle" });
      } catch (error) {
        setStage({
          name: "failed",
          message: error instanceof Error ? error.message : "Feature extraction failed",
        });
      }
    },
    [stopTicking],
  );

  const start = useCallback(
    async (run: RunPlan) => {
      setStage({ name: "arming", run });
      clearStroke();

      if (projectionRef.current === null) {
        try {
          const policy = await fetchProjectionPolicy(
            new Connection(clusterApiUrl("devnet"), "confirmed"),
          );
          projectionRef.current = policy.current;
          setProjectionVersion(policy.current);
        } catch {
          setStage({ name: "failed", message: "Could not read the projection policy from devnet" });
          return;
        }
      }

      if (run.style === "current") {
        setPhrase(realWords(5).join(" "));
        const params = randomLissajousParams();
        setCurve(
          generateLissajousPoints(params).map((point) => ({
            x: ((point.x + 1) / 2) * COORDINATE_MAX,
            y: ((point.y + 1) / 2) * COORDINATE_MAX,
          })),
        );
      } else {
        setWords(realWords(PAIRED_ROUNDS));
        setWaypoints(randomPath());
      }

      // The surface renders for the arming stage, but the state change above has not painted
      // yet, so the ref is still empty on this tick. Wait for the frame that mounts it and the
      // frame that lays it out, because the SDK reads its box to map pointer coordinates.
      await nextPaint();
      await nextPaint();

      const surface = surfaceRef.current;
      if (!surface) {
        setStage({ name: "failed", message: "The trace surface is not mounted" });
        return;
      }

      const session = sdk().createSession();
      sessionRef.current = session;

      // Motion first. iOS grants motion only inside a user gesture, and the microphone prompt
      // consumes that gesture.
      try {
        await session.startMotion();
      } catch {
        session.skipMotion();
      }

      try {
        await session.startAudio((rms) => setLevel(rms));
      } catch {
        sessionRef.current = null;
        setStage({ name: "failed", message: "Microphone access was denied" });
        return;
      }

      try {
        await session.startTouch({ eventTarget: surface, coordinateSurface: surface });
      } catch {
        session.skipTouch();
      }

      session.markCaptureStart();
      const startedAt = performance.now();
      startedAtRef.current = startedAt;
      setStage({ name: "capturing", run, round: 0 });

      if (run.style === "current") {
        setRemainingMs(CURRENT_STYLE_MS);
        tickRef.current = window.setInterval(() => {
          const elapsed = performance.now() - startedAt;
          setRemainingMs(Math.max(0, CURRENT_STYLE_MS - elapsed));
          if (elapsed >= CURRENT_STYLE_MS) void finish(run);
        }, 100);
      }
    },
    [clearStroke, finish, sdk],
  );

  const advanceRound = useCallback(
    (run: RunPlan, round: number) => {
      clearStroke();
      if (round + 1 >= PAIRED_ROUNDS) {
        void finish(run);
        return;
      }
      setWaypoints(randomPath());
      setStage({ name: "capturing", run, round: round + 1 });
    },
    [clearStroke, finish],
  );

  const report = useMemo(
    () => (done && projectionVersion !== null ? buildReport(results, projectionVersion) : null),
    [done, projectionVersion, results],
  );

  return (
    <div>
      <ol className="space-y-2">
        {RUNS.map((run, index) => {
          const result = results.find((entry) => entry.id === run.id);
          return (
            <li
              key={run.id}
              className="flex items-baseline justify-between gap-4 rounded-lg border border-border px-4 py-3"
            >
              <span className="font-mono text-sm text-foreground">
                {index + 1}. {run.title}
              </span>
              <span className="font-mono text-xs text-muted">
                {result
                  ? `${(result.durationMs / 1000).toFixed(1)} s, ${result.audioSamples} samples${
                      result.audioSamples >= MAX_TRANSMITTED_SAMPLES
                        ? `, first ${MAX_TRANSMITTED_CAPTURE_MS / 1000} s measured`
                        : ""
                    }`
                  : "not recorded"}
              </span>
            </li>
          );
        })}
      </ol>

      {stage.name === "failed" && (
        <p className="mt-6 rounded-lg border border-danger/40 px-4 py-3 font-mono text-sm text-danger">
          {stage.message}
        </p>
      )}

      {stage.name === "idle" && nextRun && (
        <div className="mt-8">
          <p className="max-w-prose text-sm text-muted">{nextRun.instruction}</p>
          <button
            type="button"
            onClick={() => void start(nextRun)}
            className="mt-4 rounded-lg border border-cyan px-5 py-2.5 font-mono text-sm text-cyan hover:bg-cyan/10"
          >
            Start {nextRun.title.toLowerCase()}
          </button>
        </div>
      )}

      {stage.name === "extracting" && (
        <p className="mt-8 font-mono text-sm text-muted">Extracting features.</p>
      )}

      {(stage.name === "arming" || stage.name === "capturing") && (
        <CapturePanel
          run={stage.run}
          round={stage.name === "capturing" ? stage.round : null}
          phrase={phrase}
          words={words}
          curve={curve}
          waypoints={waypoints}
          remainingMs={remainingMs}
          level={level}
          surfaceRef={surfaceRef}
          strokeRef={strokeRef}
          trackPoint={trackPoint}
          onAdvance={advanceRound}
        />
      )}

      {report && <Report report={report} results={results} />}
    </div>
  );
}

interface CapturePanelProps {
  run: RunPlan;
  /** Null while the microphone is still opening, so the surface mounts before capture starts. */
  round: number | null;
  phrase: string;
  words: string[];
  curve: { x: number; y: number }[];
  waypoints: { x: number; y: number }[];
  remainingMs: number;
  level: number;
  surfaceRef: React.RefObject<HTMLDivElement | null>;
  strokeRef: React.RefObject<SVGPolylineElement | null>;
  trackPoint: (event: React.PointerEvent<HTMLDivElement>) => void;
  onAdvance: (run: RunPlan, round: number) => void;
}

/**
 * The prompt, the trace surface and the level meter.
 *
 * It renders while the microphone is opening as well as during capture, because the SDK needs
 * the surface element before it can attach touch capture to it.
 */
function CapturePanel({
  run,
  round,
  phrase,
  words,
  curve,
  waypoints,
  remainingMs,
  level,
  surfaceRef,
  strokeRef,
  trackPoint,
  onAdvance,
}: CapturePanelProps) {
  const arming = round === null;
  const target = run.style === "current" ? curve : waypoints;

  return (
    <div className="mt-8">
      {arming ? (
        <p className="font-mono text-sm text-muted">Opening the microphone.</p>
      ) : run.style === "current" ? (
        <>
          <p className="font-mono text-xl text-foreground">{phrase}</p>
          <p className="mt-2 font-mono text-xs text-muted">
            {(remainingMs / 1000).toFixed(1)} s left
          </p>
        </>
      ) : (
        <>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            Round {round + 1} of {PAIRED_ROUNDS}
          </p>
          <p className="mt-2 font-mono text-xl text-foreground">{words[round]}</p>
        </>
      )}

      <div
        ref={surfaceRef}
        role="application"
        aria-label="Trace surface"
        className="mt-6 aspect-square w-full max-w-sm touch-none rounded-lg border border-border bg-surface"
        onPointerDown={(event) => {
          if (arming) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          trackPoint(event);
        }}
        onPointerMove={(event) => {
          // Read the button from the event itself. A flag set on press and cleared on release
          // stays set when the surface unmounts under a held button, and the next capture
          // then draws on hover.
          if (!arming && (event.buttons & 1) === 1) trackPoint(event);
        }}
      >
        <svg
          viewBox={`0 0 ${COORDINATE_MAX} ${COORDINATE_MAX}`}
          className="pointer-events-none h-full w-full"
        >
          <polyline
            points={target.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth={8}
            strokeDasharray={run.style === "current" ? undefined : "24 24"}
            className="text-border-hover"
          />
          <polyline
            ref={strokeRef}
            points=""
            fill="none"
            stroke="currentColor"
            strokeWidth={12}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-cyan"
          />
        </svg>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <span className="font-mono text-xs uppercase tracking-widest text-muted">Mic</span>
        <span aria-hidden className="h-1.5 w-32 overflow-hidden rounded-full bg-surface-hover">
          <span
            className="block h-full bg-cyan transition-[width] duration-100"
            style={{ width: `${Math.min(100, level * 400)}%` }}
          />
        </span>
      </div>

      {run.style === "paired" && round !== null && (
        <button
          type="button"
          onClick={() => onAdvance(run, round)}
          className="mt-6 rounded-lg border border-cyan px-5 py-2.5 font-mono text-sm text-cyan hover:bg-cyan/10"
        >
          {round + 1 >= PAIRED_ROUNDS ? "Finish capture" : "Next round"}
        </button>
      )}
    </div>
  );
}

/** Resolves after the browser paints, so a freshly rendered element has a box to read. */
function nextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

interface PairReport {
  label: string;
  comparison: VectorComparison;
  /** Distance the real client fingerprint produced, to check the prediction. */
  measuredDistance: number;
}

interface DriftReport {
  projectionVersion: number;
  pairs: PairReport[];
  topMoves: { index: number; delta: number; relative: number }[];
}

function buildReport(results: RunResult[], projectionVersion: number): DriftReport {
  const byId = new Map(results.map((result) => [result.id, result]));
  const a = byId.get("current-a");
  const b = byId.get("current-b");
  const paired = byId.get("paired");
  if (!a || !b || !paired) throw new Error("Report needs all three captures");

  const pair = (label: string, left: RunResult, right: RunResult): PairReport => ({
    label,
    comparison: compareVectors(left.normalized, right.normalized),
    measuredDistance: hammingDistance(left.fingerprint, right.fingerprint),
  });

  return {
    projectionVersion,
    pairs: [
      pair("current vs current (reference)", a, b),
      pair("current A vs paired", a, paired),
      pair("current B vs paired", b, paired),
    ],
    topMoves: featureMoves(a.normalized, paired.normalized)
      .slice(0, 20)
      .map(({ index, delta, relative }) => ({ index, delta, relative })),
  };
}

function Report({ report, results }: { report: DriftReport; results: RunResult[] }) {
  const download = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            recordedAt: new Date().toISOString(),
            note: "Derived feature vectors only. No audio, motion or touch samples.",
            minimumAcceptedCosine: MIN_ACCEPTED_COSINE,
            pairs: report.pairs,
            topMoves: report.topMoves,
            captures: results.map((result) => ({
              id: result.id,
              style: result.style,
              truncated: result.audioSamples >= MAX_TRANSMITTED_SAMPLES,
              durationMs: result.durationMs,
              audioSamples: result.audioSamples,
              motionSamples: result.motionSamples,
              touchSamples: result.touchSamples,
              normalized: result.normalized,
              raw: result.raw,
            })),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `capture-drift-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-10 border-t border-border pt-8">
      <h2 className="font-mono text-lg text-foreground">Result</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left font-mono text-sm">
          <thead className="text-xs uppercase tracking-widest text-muted">
            <tr>
              <th className="py-2 pr-4 font-normal">Pair</th>
              <th className="py-2 pr-4 font-normal">Cosine</th>
              <th className="py-2 pr-4 font-normal">Predicted</th>
              <th className="py-2 pr-4 font-normal">Measured</th>
              <th className="py-2 font-normal">Matches</th>
            </tr>
          </thead>
          <tbody className="text-foreground">
            {report.pairs.map((entry) => (
              <tr key={entry.label} className="border-t border-border">
                <td className="py-2 pr-4">{entry.label}</td>
                <td className="py-2 pr-4">{entry.comparison.cosine.toFixed(4)}</td>
                <td className="py-2 pr-4">
                  {entry.comparison.expectedDistance.toFixed(1)} &plusmn;{" "}
                  {entry.comparison.distanceStdDev.toFixed(1)}
                </td>
                <td className="py-2 pr-4">{entry.measuredDistance}</td>
                <td className="py-2">{entry.comparison.withinAcceptedBand ? "yes" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 max-w-prose text-sm text-muted">
        A pair matches when its distance falls inside the accepted band, which needs a cosine
        above {MIN_ACCEPTED_COSINE.toFixed(3)}. Read the two style rows against the reference
        row, not against zero.
      </p>
      {results.some((result) => result.audioSamples >= MAX_TRANSMITTED_SAMPLES) && (
        <p className="mt-4 max-w-prose text-sm text-muted">
          The SDK sends at most {MAX_TRANSMITTED_CAPTURE_MS / 1000} seconds of audio. The paired
          session ran longer, so its vector covers the first {MAX_TRANSMITTED_CAPTURE_MS / 1000}{" "}
          seconds and the rest was not measured. A paired pipeline has to carry the whole session,
          so this is a limit of the current pipeline, not of the capture.
        </p>
      )}
      <button
        type="button"
        onClick={download}
        className="mt-6 rounded-lg border border-cyan px-5 py-2.5 font-mono text-sm text-cyan hover:bg-cyan/10"
      >
        Download the measurements
      </button>
    </div>
  );
}
