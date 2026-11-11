/** Reads `body` whole, or throws a `RangeError` once it passes `maxBytes`. */
async function readBoundedStream(
  body: ReadableStream<Uint8Array>,
  maxBytes: number,
  tooLarge: string,
): Promise<Uint8Array> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        // Stops the transfer, so the rest of an oversized body is never received.
        await reader.cancel().catch(() => undefined);
        throw new RangeError(tooLarge);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

const decodeJson = (bytes: Uint8Array): unknown =>
  JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));

export async function readBoundedJson(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  if (!request.body) throw new Error("Request body is required");

  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const bytes = Number(declaredLength);
    if (!Number.isSafeInteger(bytes) || bytes < 0) {
      throw new Error("Content-Length is invalid");
    }
    if (bytes > maxBytes) throw new RangeError("Request body is too large");
  }

  return decodeJson(await readBoundedStream(request.body, maxBytes, "Request body is too large"));
}

/**
 * Reads the body of an upstream response, or throws a `RangeError` when it
 * declares or delivers more than `maxBytes`. A declared length is checked
 * before any byte is read.
 */
export async function readBoundedResponseBytes(
  response: Response,
  maxBytes: number,
): Promise<Uint8Array> {
  const declaredLength = response.headers.get("content-length");
  if (declaredLength) {
    const bytes = Number(declaredLength);
    if (!Number.isSafeInteger(bytes) || bytes < 0 || bytes > maxBytes) {
      await response.body?.cancel().catch(() => undefined);
      throw new RangeError("Upstream response is too large");
    }
  }
  if (!response.body) throw new Error("Upstream response is empty");
  return readBoundedStream(response.body, maxBytes, "Upstream response is too large");
}

/** Reads an upstream response as JSON within `maxBytes`. */
export async function readBoundedJsonResponse(
  response: Response,
  maxBytes: number,
): Promise<unknown> {
  return decodeJson(await readBoundedResponseBytes(response, maxBytes));
}
