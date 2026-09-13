"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { appendBoundedPoint } from "@/lib/bounded-trace";
import {
  deviceClass,
  startContinuousCapture,
  type ContinuousCapture,
} from "@/lib/paired-round/capture";
import {
  buildCommit,
  bytesToBase64,
  encodePcm16,
  initialCommitment,
  randomIdempotencyKey,
  revealMatchesItsDigest,
  type CommitDto,
  type RevealDto,
  type SessionDto,
} from "@/lib/paired-round/client";
import {
  COARSE_PATH_POINTS,
  decodePathTarget,
  toCoarsePath,
  type RawPoint,
} from "@/lib/paired-round/coarse-path";
import {
  PAIRED_ROUND_CONSENT_PARAGRAPHS,
  PAIRED_ROUND_CONSENT_VERSION,
  pairedRoundConsentHash,
} from "@/lib/paired-round/consent";
import { COORDINATE_MAX, fromHex, toHex, type Point, type Tier } from "@/lib/paired-round/transcript";

type Stage = "consent" | "opening" | "round" | "sending" | "complete" | "stopped";

interface PendingSegment {
  round_index: number;
  audio_base64: string;
  coarse_path: string;
}

const RAW_POINT_LIMIT = 512;
const LEVEL_POLL_MS = 100;

const NOT_CLAIMED: readonly string[] = [
  "It does not prove that a human is present. It shows an ordered, progressively committed challenge response and nothing beyond that.",
  "It establishes no sensor provenance. Every committed segment is still authored by your browser.",
  "It gives no resistance to live synthesis. Software generating each round in real time satisfies every rule here.",
  "It does not stop a prerecorded library of words or paths.",
  "It proves no physiological coupling, and it supplies no evidence about uniqueness.",
];

function describeError(code: string): string {
  switch (code) {
    case "participant_unknown":
      return "That code is not on the list. Check it and try again.";
    case "session_active":
      return "A session is already running for this code. Wait for it to expire, then start again.";
    case "capacity_reached":
      return "Too many sessions are running right now. Try again in a few minutes.";
    case "consent_mismatch":
      return "The consent text changed since this page loaded. Reload and read it again.";
    case "round_expired":
      return "That round ran out of time. Start a new session when you are ready.";
    case "session_expired":
      return "The session ran out of time. Start a new one when you are ready.";
    case "prototype_unconfigured":
    case "prototype_unavailable":
    case "storage_unavailable":
      return "The prototype is not reachable. Nothing was recorded.";
    default:
      return "Something went wrong and the session stopped. Nothing was recorded.";
  }
}

async function post(path: string, code: string, body: unknown): Promise<unknown> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-paired-round-code": code },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(typeof payload.error === "string" ? payload.error : "unavailable");
  }
  return payload;
}

export function RoundRunner() {
  const [stage, setStage] = useState<Stage>("consent");
  const [code, setCode] = useState("");
  const [tier, setTier] = useState<Tier>("trace");
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [session, setSession] = useState<SessionDto | null>(null);
  const [reveal, setReveal] = useState<RevealDto | null>(null);
  const [level, setLevel] = useState(0);

  const captureRef = useRef<ContinuousCapture | null>(null);
  const previousRef = useRef<Uint8Array | null>(null);
  const startSampleRef = useRef(0);
  const rawPointsRef = useRef<RawPoint[]>([]);
  const segmentsRef = useRef<PendingSegment[]>([]);
  const surfaceRef = useRef<SVGSVGElement | null>(null);
  // A ref, not state. Pointer tracking changes nothing on screen, and a state write here
  // would leave the move handler reading a stale value until the next render.
  const tracingRef = useRef(false);

  const releaseCapture = useCallback(() => {
    captureRef.current?.stop();
    captureRef.current = null;
  }, []);

  useEffect(() => releaseCapture, [releaseCapture]);

  useEffect(() => {
    if (stage !== "round") return;
    const timer = window.setInterval(() => {
      setLevel(captureRef.current?.level() ?? 0);
    }, LEVEL_POLL_MS);
    return () => window.clearInterval(timer);
  }, [stage]);

  const stopWith = useCallback(
    (code: string) => {
      releaseCapture();
      segmentsRef.current = [];
      setMessage(describeError(code));
      setStage("stopped");
    },
    [releaseCapture],
  );

  const beginRound = useCallback((next: RevealDto) => {
    rawPointsRef.current = [];
    startSampleRef.current = captureRef.current?.mark() ?? 0;
    setReveal(next);
    setStage("round");
  }, []);

  const start = useCallback(async () => {
    setMessage(null);
    setStage("opening");
    let capture: ContinuousCapture;
    try {
      capture = await startContinuousCapture();
    } catch {
      setMessage("The microphone did not open. Allow access, then start again.");
      setStage("consent");
      return;
    }
    captureRef.current = capture;

    try {
      const created = (await post("/api/lab/rounds/session", code, {
        tier,
        consent_version: PAIRED_ROUND_CONSENT_VERSION,
        consent_sha256: await pairedRoundConsentHash(),
        device_class: deviceClass(),
      })) as SessionDto;

      if (!(await revealMatchesItsDigest(created.session_nonce, created.reveal))) {
        stopWith("challenge_mismatch");
        return;
      }
      previousRef.current = await initialCommitment(created);
      segmentsRef.current = [];
      setSession(created);
      beginRound(created.reveal);
    } catch (error) {
      stopWith(error instanceof Error ? error.message : "unavailable");
    }
  }, [beginRound, code, stopWith, tier]);

  const submitRound = useCallback(async () => {
    const capture = captureRef.current;
    const current = session;
    const currentReveal = reveal;
    const previous = previousRef.current;
    if (!capture || !current || !currentReveal || !previous) return;

    setStage("sending");
    const samples = capture.slice(startSampleRef.current, capture.mark());
    const audio = encodePcm16(samples);
    const surface = surfaceRef.current?.getBoundingClientRect();
    const points: Point[] =
      current.tier === "trace"
        ? toCoarsePath(
            rawPointsRef.current,
            { width: surface?.width ?? 1, height: surface?.height ?? 1 },
            COARSE_PATH_POINTS,
          )
        : [];

    if (current.tier === "trace" && points.length === 0) {
      setMessage("Trace the shape before moving on.");
      setStage("round");
      return;
    }
    if (audio.length === 0) {
      setMessage("No audio reached the page. Check the microphone, then try again.");
      setStage("round");
      return;
    }

    try {
      const built = await buildCommit({
        session: current,
        reveal: currentReveal,
        previous,
        evidence: { audio, points },
        idempotencyKey: randomIdempotencyKey(),
      });
      const response = (await post("/api/lab/rounds/commit", code, built.body)) as CommitDto;
      segmentsRef.current.push({
        round_index: currentReveal.round_index,
        audio_base64: bytesToBase64(audio),
        coarse_path: toHex(built.coarsePath),
      });
      previousRef.current = built.commitment;
      setMessage(null);

      if (response.reveal) {
        if (!(await revealMatchesItsDigest(current.session_nonce, response.reveal))) {
          stopWith("challenge_mismatch");
          return;
        }
        beginRound(response.reveal);
        return;
      }

      await post("/api/lab/rounds/finalize", code, {
        session_id: current.session_id,
        segments: segmentsRef.current,
      });
      releaseCapture();
      segmentsRef.current = [];
      setStage("complete");
    } catch (error) {
      stopWith(error instanceof Error ? error.message : "unavailable");
    }
  }, [beginRound, code, releaseCapture, reveal, session, stopWith]);

  const trackPoint = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    const surface = surfaceRef.current?.getBoundingClientRect();
    if (!surface) return;
    appendBoundedPoint(
      rawPointsRef.current,
      {
        x: event.clientX - surface.left,
        y: event.clientY - surface.top,
        t: performance.now(),
      },
      RAW_POINT_LIMIT,
    );
  }, []);

  if (stage === "consent" || stage === "opening") {
    return (
      <ConsentPanel
        code={code}
        onCode={setCode}
        tier={tier}
        onTier={setTier}
        accepted={accepted}
        onAccepted={setAccepted}
        message={message}
        busy={stage === "opening"}
        onStart={start}
      />
    );
  }

  if (stage === "complete") {
    return (
      <Panel>
        <h2 className="font-mono text-xl text-foreground">Session complete</h2>
        <p className="mt-3 max-w-prose text-sm text-muted">
          All rounds were recorded. You can close this tab. Tell the person running the study
          anything that felt awkward, unclear, or slow.
        </p>
      </Panel>
    );
  }

  if (stage === "stopped") {
    return (
      <Panel>
        <h2 className="font-mono text-xl text-foreground">Session stopped</h2>
        <p className="mt-3 max-w-prose text-sm text-muted">{message}</p>
        <Button
          className="mt-6"
          onClick={() => {
            setStage("consent");
            setMessage(null);
          }}
        >
          Start again
        </Button>
      </Panel>
    );
  }

  const waypoints = reveal ? decodePathTarget(fromHex(reveal.path_target)) : [];
  const isLast = session !== null && reveal !== null && reveal.round_index >= session.rounds;

  return (
    <Panel>
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        Round {reveal?.round_index} of {session?.rounds}
      </p>
      <h2 aria-live="polite" className="mt-4 font-mono text-4xl text-foreground">
        {reveal?.word}
      </h2>
      <p className="mt-3 max-w-prose text-sm text-muted">
        {session?.tier === "trace"
          ? "Say the word out loud while you trace the shape. Take as long as you like."
          : "Say the word out loud. Take as long as you like."}
      </p>

      {session?.tier === "trace" && (
        <svg
          ref={surfaceRef}
          role="application"
          aria-label={`Trace the shape for the word ${reveal?.word ?? ""}`}
          viewBox={`0 0 ${COORDINATE_MAX} ${COORDINATE_MAX}`}
          className="mt-6 aspect-square w-full max-w-sm touch-none rounded-lg border border-border bg-surface"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            tracingRef.current = true;
            trackPoint(event);
          }}
          onPointerMove={(event) => {
            if (!tracingRef.current) return;
            trackPoint(event);
          }}
          onPointerUp={() => {
            tracingRef.current = false;
          }}
          onPointerCancel={() => {
            tracingRef.current = false;
          }}
        >
          <polyline
            points={waypoints.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth={8}
            strokeDasharray="24 24"
            className="text-border-hover"
          />
          {waypoints.map((point, index) => (
            <circle
              key={`${point.x}-${point.y}-${index}`}
              cx={point.x}
              cy={point.y}
              r={18}
              className="fill-cyan/30"
            />
          ))}
        </svg>
      )}

      <div className="mt-6 flex items-center gap-3">
        <span className="font-mono text-xs uppercase tracking-widest text-muted">Mic</span>
        <span
          aria-hidden
          className="h-1.5 w-32 overflow-hidden rounded-full bg-surface-hover"
        >
          <span
            className="block h-full bg-cyan"
            style={{ width: `${Math.min(100, Math.round(level * 200))}%` }}
          />
        </span>
      </div>

      {message && <p className="mt-4 text-sm text-foreground">{message}</p>}

      <Button className="mt-6" disabled={stage === "sending"} onClick={submitRound}>
        {stage === "sending" ? "Sending" : isLast ? "Finish" : "Next round"}
      </Button>
    </Panel>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-6 sm:p-8">{children}</div>
  );
}

function ConsentPanel(props: {
  code: string;
  onCode: (value: string) => void;
  tier: Tier;
  onTier: (value: Tier) => void;
  accepted: boolean;
  onAccepted: (value: boolean) => void;
  message: string | null;
  busy: boolean;
  onStart: () => void;
}) {
  const ready = props.accepted && props.code.trim().length > 0 && !props.busy;
  return (
    <Panel>
      <h2 className="font-mono text-xl text-foreground">Before you start</h2>
      <div className="mt-4 space-y-3 text-sm text-muted">
        {PAIRED_ROUND_CONSENT_PARAGRAPHS.map((paragraph) => (
          <p key={paragraph.slice(0, 32)} className="max-w-prose">
            {paragraph}
          </p>
        ))}
      </div>

      <h3 className="mt-8 font-mono text-xs uppercase tracking-widest text-muted">
        What this does not claim
      </h3>
      <ul className="mt-3 space-y-2 text-sm text-muted">
        {NOT_CLAIMED.map((line) => (
          <li key={line.slice(0, 32)} className="max-w-prose">
            {line}
          </li>
        ))}
      </ul>

      <fieldset className="mt-8">
        <legend className="font-mono text-xs uppercase tracking-widest text-muted">Route</legend>
        <div className="mt-3 space-y-2">
          <label className="flex items-center gap-3 text-sm text-foreground">
            <input
              type="radio"
              name="tier"
              value="trace"
              checked={props.tier === "trace"}
              onChange={() => props.onTier("trace")}
            />
            Speak the word and trace a shape
          </label>
          <label className="flex items-center gap-3 text-sm text-foreground">
            <input
              type="radio"
              name="tier"
              value="speech_only"
              checked={props.tier === "speech_only"}
              onChange={() => props.onTier("speech_only")}
            />
            Speak the word only
          </label>
        </div>
      </fieldset>

      <label className="mt-8 block font-mono text-xs uppercase tracking-widest text-muted">
        Your code
        <input
          value={props.code}
          onChange={(event) => props.onCode(event.target.value.toUpperCase())}
          autoComplete="off"
          spellCheck={false}
          maxLength={64}
          className="mt-2 block w-full max-w-xs rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm normal-case tracking-normal text-foreground"
        />
      </label>

      <label className="mt-6 flex max-w-prose items-start gap-3 text-sm text-foreground">
        <input
          type="checkbox"
          checked={props.accepted}
          onChange={(event) => props.onAccepted(event.target.checked)}
          className="mt-1"
        />
        I read the text above and I agree to take part.
      </label>

      {props.message && <p className="mt-4 text-sm text-foreground">{props.message}</p>}

      <Button className="mt-6" disabled={!ready} onClick={props.onStart}>
        {props.busy ? "Opening the microphone" : "Start"}
      </Button>
    </Panel>
  );
}
