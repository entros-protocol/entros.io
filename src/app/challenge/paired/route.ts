import "server-only";
import { proxyExecutorRequest } from "@/lib/executor-proxy";
import { isLocalExecutorProxyEnabled } from "@/lib/relay-transport";
import { pairedVerifyEnabled } from "@/lib/server/paired-verify";

const MAX_OPEN_BYTES = 1_024;

export async function POST(request: Request) {
  return proxyExecutorRequest(
    request,
    {
      path: "/challenge/paired",
      method: "POST",
      timeoutMs: 15_000,
      maxRequestBytes: MAX_OPEN_BYTES,
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
