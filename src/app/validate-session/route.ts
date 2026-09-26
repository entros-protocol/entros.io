import "server-only";
import { proxyExecutorRequest } from "@/lib/executor-proxy";
import { isLocalExecutorProxyEnabled } from "@/lib/relay-transport";
import { pairedVerifyEnabled } from "@/lib/server/paired-verify";

const MAX_SESSION_BYTES = 2_097_152;

export async function POST(request: Request) {
  return proxyExecutorRequest(
    request,
    {
      path: "/validate-session",
      method: "POST",
      timeoutMs: 125_000,
      maxRequestBytes: MAX_SESSION_BYTES,
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
