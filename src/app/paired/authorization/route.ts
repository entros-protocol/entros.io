import "server-only";
import { proxyExecutorRequest } from "@/lib/executor-proxy";
import { isLocalExecutorProxyEnabled } from "@/lib/relay-transport";
import { pairedVerifyEnabled } from "@/lib/server/paired-verify";

const WALLET = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export async function GET(request: Request) {
  return proxyExecutorRequest(
    request,
    {
      path: "/paired/authorization",
      method: "GET",
      timeoutMs: 10_000,
      query: { wallet: WALLET },
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
