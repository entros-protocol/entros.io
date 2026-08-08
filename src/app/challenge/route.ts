import "server-only";
import { proxyExecutorRequest } from "@/lib/executor-proxy";
import { isLocalExecutorProxyEnabled } from "@/lib/relay-transport";

export async function GET(request: Request) {
  return proxyExecutorRequest(
    request,
    { path: "/challenge", method: "GET", timeoutMs: 5_000 },
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
