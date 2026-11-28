import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

let cachedFonts: [ArrayBuffer, ArrayBuffer] | null = null;
let inFlightFonts: Promise<[ArrayBuffer, ArrayBuffer]> | null = null;

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  const copy = new Uint8Array(buffer.byteLength);
  copy.set(buffer);
  return copy.buffer;
}

// Reads traced TTF assets once per warm instance and deduplicates concurrent cold starts.
// Failures clear the in-flight slot so subsequent requests retry cleanly.
export async function loadOgFonts(): Promise<[ArrayBuffer, ArrayBuffer]> {
  if (cachedFonts) return cachedFonts;
  if (!inFlightFonts) {
    const fontsDir = path.join(process.cwd(), "public", "fonts");
    inFlightFonts = Promise.all([
      readFile(path.join(fontsDir, "Geist-Regular.ttf")),
      readFile(path.join(fontsDir, "JetBrainsMono-Regular.ttf")),
    ])
      .then(([geist, mono]): [ArrayBuffer, ArrayBuffer] => {
        cachedFonts = [toArrayBuffer(geist), toArrayBuffer(mono)];
        return cachedFonts;
      })
      .finally(() => {
        inFlightFonts = null;
      });
  }
  return inFlightFonts;
}
