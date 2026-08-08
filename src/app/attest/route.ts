import "server-only";
import { proxyExecutorRequest } from "@/lib/executor-proxy";
import { isLocalExecutorProxyEnabled } from "@/lib/relay-transport";

const MAX_ATTESTATION_BYTES = 8_192;

export async function POST(request: Request) {
  return proxyExecutorRequest(
    request,
    {
      path: "/attest",
      method: "POST",
      timeoutMs: 20_000,
      maxRequestBytes: MAX_ATTESTATION_BYTES,
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
