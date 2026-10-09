import {
  isClientOriginReason,
  phaseChargesAttempt,
  type VerificationPhase,
} from "@entros/pulse-sdk";

export const MAX_CAPTURE_ATTEMPTS = 3;

export interface RetryBudget {
  verdict: number;
  transport: number;
  quality: number;
}

export const EMPTY_RETRY_BUDGET: Readonly<RetryBudget> = {
  verdict: 0,
  transport: 0,
  quality: 0,
};

/** A quality verdict has its own budget, independent of transport and detection. */
export function chargeRetryBudget(
  prior: Readonly<RetryBudget>,
  reason: string | undefined,
  failedAt: VerificationPhase | undefined,
): { budget: RetryBudget; used: number } {
  const budget = { ...prior };
  const quality = reason === "anchor_retry";
  const clientOrigin = isClientOriginReason(reason);
  const key = quality ? "quality" : clientOrigin ? "transport" : "verdict";
  if (clientOrigin || phaseChargesAttempt(failedAt)) budget[key] += 1;
  return { budget, used: budget[key] };
}
