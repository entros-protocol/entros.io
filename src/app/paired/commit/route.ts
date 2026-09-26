import "server-only";
import { proxyExecutorRequest } from "@/lib/executor-proxy";
import { isLocalExecutorProxyEnabled } from "@/lib/relay-transport";
import { pairedVerifyEnabled } from "@/lib/server/paired-verify";

const MAX_COMMIT_BYTES = 8_192;

export async function POST(request: Request) {
  return proxyExecutorRequest(
    request,
    {
      path: "/paired/commit",
      method: "POST",
      timeoutMs: 10_000,
      maxRequestBytes: MAX_COMMIT_BYTES,
    },
    {
      enabled:
        pairedVerifyEnabled() &&
        isLocalExecutorProxyEnabled(
          process.env.NODE_ENV,
          process.env.ENTROS_STUDY_LOCAL_PREVIEW,
        ),
      relayerUrl: process.env.RELAYER_URL,
      relayerApiKey: process.env.RELAYER_API_KEY,
    },
  );
}
