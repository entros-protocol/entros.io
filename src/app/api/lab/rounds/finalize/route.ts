import { forwardToPrototype } from "@/lib/server/paired-round-proxy";

/**
 * One session submits at most 960,000 samples, which is 1,920,000 bytes before base64. The
 * limit leaves room for the JSON envelope and the three coarse paths.
 */
const MAX_BODY_BYTES = 3_000_000;

export async function POST(request: Request) {
  return forwardToPrototype("/session/finalize", request, MAX_BODY_BYTES);
}
