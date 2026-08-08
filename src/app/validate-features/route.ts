import "server-only";
import { proxyExecutorRequest } from "@/lib/executor-proxy";
import { isLocalExecutorProxyEnabled } from "@/lib/relay-transport";

const MAX_VALIDATION_BYTES = 1_048_576;

export async function POST(request: Request) {
  return proxyExecutorRequest(
    request,
    {
      path: "/validate-features",
      method: "POST",
      timeoutMs: 125_000,
      maxRequestBytes: MAX_VALIDATION_BYTES,
    },
    {
      enabled: isLocalExecutorProxyEnabled(
        process.env.NODE_ENV,
        process.env.ENTROS_STUDY_LOCAL_PREVIEW,
      ),
      relayerUrl: process.env.RELAYER_URL,
      relayerApiKey: process.env.RELAYER_API_KEY,
    },
  );
}
