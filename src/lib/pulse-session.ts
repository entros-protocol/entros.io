import type { PulseSession } from "@entros/pulse-sdk";
import {
  challengeCanStartCapture,
  type ChallengeResponse,
} from "./relay-challenge";

export function bindPulseValidationChallenge(
  session: Pick<PulseSession, "bindValidationChallenge">,
  challenge: ChallengeResponse,
  nowMs = performance.now(),
): void {
  if (!challengeCanStartCapture(challenge, nowMs)) {
    throw new Error("The verification challenge expired during setup");
  }
  session.bindValidationChallenge(challenge.nonce, challenge.expiresAtMs);
}

export async function stopPulseCapture(session: PulseSession): Promise<void> {
  await Promise.allSettled([
    session.stopAudio(),
    session.stopMotion(),
    session.stopTouch(),
  ]);
}
