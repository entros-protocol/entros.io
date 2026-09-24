/**
 * Decides when a paired round is finished, so the page moves on without a button.
 *
 * A round is finished once the stroke has reached every waypoint and the person has spoken and
 * then gone quiet. Either can happen first. The server never checks the word per round, so this
 * only paces the interaction. The single transcription at the end still judges every word.
 */

import type { Point } from "./transcript";

/** Distance in grid units within which a stroke counts as reaching a waypoint. */
export const WAYPOINT_REACH = 100;

/**
 * Continuous voicing a round needs before it counts as spoken. A short word runs about 250 ms.
 * Scattered clicks never add up to it, because each one starts a new run.
 */
export const MIN_VOICED_MS = 200;

/** Quiet after speech before the round ends. Long enough to bridge a pause inside a word. */
export const QUIET_AFTER_SPEECH_MS = 600;

/** How long a finished trace waits for speech before the page offers to continue anyway. */
export const STALL_MS = 4_000;

/** How long an unfinished round runs before the page offers to continue anyway. */
export const OPEN_STALL_MS = 15_000;

/** Longest quiet gap inside one word. Voicing separated by more starts a new run. */
const MAX_READING_GAP_MS = 250;

/** Speech has to stand this many times above the noise floor. */
const FLOOR_RATIO = 4;

/**
 * The noise floor is this low percentile of every reading so far. A percentile rather than the
 * minimum, so a few buffers of digital silence while the microphone opens do not set the floor.
 */
const FLOOR_PERCENTILE = 0.1;

/** Readings kept for the floor and for one round. About six minutes at the SDK buffer rate. */
const MAX_READINGS = 4_096;

/** Where speech starts on one input's level scale. */
export interface LevelScale {
  /** No reading below this counts as speech, however quiet the room. */
  minSpeech: number;
  /** Lowest noise floor assumed, so digital silence while the microphone opens sets no bar. */
  minFloor: number;
}

/** The SDK reports the RMS of each audio buffer. */
export const RMS_SCALE: LevelScale = { minSpeech: 0.01, minFloor: 0.002 };

/** The prototype capture reports the peak of each audio buffer. */
export const PEAK_SCALE: LevelScale = { minSpeech: 0.05, minFloor: 0.01 };

/**
 * `complete` is reported once per round. After it, the round reads as `stalled`, so a round
 * whose submission fails offers the manual continue rather than retrying on every reading.
 */
export type RoundProgress = "open" | "complete" | "stalled";

export interface RoundTracker {
  /** Starts a round. `traceRequired` is false for the speech-only route. */
  begin(waypoints: readonly Point[], traceRequired: boolean): void;
  /** Records one drawn point, in grid units. */
  reach(point: Point): void;
  /** Records one level reading and reports where the round stands. */
  hear(level: number, now: number): RoundProgress;
}

export function createRoundTracker(scale: LevelScale): RoundTracker {
  let waypoints: readonly Point[] = [];
  let traceRequired = true;
  let reached = new Set<number>();
  let startedAt: number | null = null;
  let tracedAt: number | null = null;
  let reported = false;
  // Levels carry across rounds so the floor keeps improving. Readings describe one round.
  const levels: number[] = [];
  let readings: { at: number; level: number }[] = [];

  return {
    begin(nextWaypoints, nextTraceRequired) {
      waypoints = nextWaypoints;
      traceRequired = nextTraceRequired;
      reached = new Set();
      startedAt = null;
      tracedAt = null;
      reported = false;
      readings = [];
    },

    reach(point) {
      waypoints.forEach((waypoint, index) => {
        if (Math.hypot(point.x - waypoint.x, point.y - waypoint.y) <= WAYPOINT_REACH) {
          reached.add(index);
        }
      });
    },

    hear(level, now) {
      pushBounded(levels, level);
      pushBounded(readings, { at: now, level });

      // Reclassify the whole round against the current floor. A word spoken before the room
      // was ever quiet reads as the floor at first, and counts once quieter readings arrive.
      const floor = Math.max(scale.minFloor, percentile(levels, FLOOR_PERCENTILE));
      const bar = Math.max(scale.minSpeech, floor * FLOOR_RATIO);
      let run = 0;
      let longestRun = 0;
      let lastVoicedAt: number | null = null;
      readings.forEach((reading, index) => {
        if (reading.level < bar) {
          if (lastVoicedAt !== null && reading.at - lastVoicedAt > MAX_READING_GAP_MS) run = 0;
          return;
        }
        const previous = readings[index - 1];
        if (previous) run += Math.min(reading.at - previous.at, MAX_READING_GAP_MS);
        longestRun = Math.max(longestRun, run);
        lastVoicedAt = reading.at;
      });

      startedAt ??= now;
      const traced = !traceRequired || (waypoints.length > 0 && reached.size === waypoints.length);
      if (!traced) return now - startedAt >= OPEN_STALL_MS ? "stalled" : "open";
      tracedAt ??= now;

      const spokeThenQuiet =
        longestRun >= MIN_VOICED_MS &&
        lastVoicedAt !== null &&
        now - lastVoicedAt >= QUIET_AFTER_SPEECH_MS;
      if (spokeThenQuiet && !reported) {
        reported = true;
        return "complete";
      }
      return reported || now - tracedAt >= STALL_MS ? "stalled" : "open";
    },
  };
}

function pushBounded<T>(values: T[], value: T): void {
  values.push(value);
  if (values.length > MAX_READINGS) values.shift();
}

function percentile(values: readonly number[], fraction: number): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(fraction * (sorted.length - 1))] ?? 0;
}
