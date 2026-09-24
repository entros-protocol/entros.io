/**
 * Consent for the paired-round usability prototype.
 *
 * The service holds the SHA-256 of this document. A session starts only when the version
 * and the hash the browser sends both match, so a changed document cannot pass as the one a
 * tester read.
 */

import { sha256, toHex } from "./transcript";

export const PAIRED_ROUND_CONSENT_VERSION = "paired-round-usability-v1-2026-09-13";

export const PAIRED_ROUND_CONSENT_PARAGRAPHS: readonly string[] = [
  "This is a research prototype. It tests whether one word and one short path per round is a usable way to answer a challenge. It runs no verification, mints nothing, and touches no wallet.",
  "You speak a word and, on the tracing route, trace a short shape. Your browser sends the recorded audio and a coarse outline of the path when the session ends.",
  "The audio is transcribed once, in memory, and discarded in the same request. No recording is written to disk or to a database. The path outline carries integer coordinates only, with no timing and no pressure.",
  "What is kept: how long each round took, whether you finished, where you stopped, which route you chose, a coarse device label, a loudness bucket for each round, and whether the spoken word landed inside its own round.",
  "What is not kept: your name, your email, your wallet, your IP address, your browser's user agent, and anything you tell us about yourself. You are identified only by the code you were given.",
  "Nothing here proves that a human is present, that speech is live, or that a recording came from a real microphone. The prototype tests the interaction, and its results decide whether Entros builds this into the product at all.",
  "Stop whenever you want. Close the tab and the session expires on its own. Ask for your records to be deleted and they will be.",
];

export function pairedRoundConsentDocument(): string {
  return PAIRED_ROUND_CONSENT_PARAGRAPHS.join("\n");
}

export async function pairedRoundConsentHash(): Promise<string> {
  return toHex(await sha256(new TextEncoder().encode(pairedRoundConsentDocument())));
}
