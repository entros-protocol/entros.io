import { forwardToPrototype } from "@/lib/server/paired-round-proxy";

const MAX_BODY_BYTES = 2_048;

export async function POST(request: Request) {
  return forwardToPrototype("/round/commit", request, MAX_BODY_BYTES);
}
