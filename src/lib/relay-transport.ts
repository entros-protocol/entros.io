export interface RelayerTransportInput {
  isDevelopment: boolean;
  localProxyEnabled: boolean;
  browserOrigin?: string;
  publicRelayerUrl?: string;
  publicRelayerApiKey?: string;
}

export interface RelayerTransport {
  relayerUrl?: string;
  relayerApiKey?: string;
}

export function isLocalExecutorProxyEnabled(
  nodeEnv: string | undefined,
  localPreview: string | undefined,
): boolean {
  return nodeEnv === "development" && localPreview === "1";
}

export function resolveRelayerTransport(
  input: RelayerTransportInput,
): RelayerTransport {
  if (input.isDevelopment && input.localProxyEnabled && input.browserOrigin) {
    return { relayerUrl: input.browserOrigin };
  }
  return {
    relayerUrl: input.publicRelayerUrl,
    relayerApiKey: input.publicRelayerApiKey,
  };
}
