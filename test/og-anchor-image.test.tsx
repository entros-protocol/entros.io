import { isValidElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  identity: vi.fn<(wallet: string, connection: unknown) => Promise<unknown>>(),
}));

vi.mock("next/og", () => ({
  ImageResponse: class {
    readonly element: ReactNode;
    readonly headers: Headers;
    constructor(element: ReactNode, init: { headers?: Record<string, string> }) {
      this.element = element;
      this.headers = new Headers(init.headers);
    }
  },
}));

vi.mock("@entros/pulse-sdk", () => ({
  fetchIdentityState: harness.identity,
}));

const WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

type RenderedImage = { element: ReactNode; headers: Headers };

function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

let fontFetch: ReturnType<typeof vi.fn<typeof fetch>>;

async function render(query: string): Promise<string> {
  const { GET } = await import("../src/app/api/og/anchor/route");
  const response = (await GET(new Request(`https://entros.test/api/og/anchor?${query}`))) as unknown as RenderedImage;
  return textOf(response.element);
}

beforeEach(() => {
  vi.resetModules();
  harness.identity.mockReset();
  fontFetch = vi.fn<typeof fetch>(async () => new Response(new Uint8Array(8), { status: 200 }));
  vi.stubGlobal("fetch", fontFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("share image", () => {
  it("renders the chain score, never the score in the link", async () => {
    harness.identity.mockResolvedValue({ owner: WALLET, trustScore: 42 });

    const text = await render(`wallet=${WALLET}&score=999`);

    expect(harness.identity).toHaveBeenCalledWith(WALLET, expect.anything());
    expect(text).toContain("Verified human");
    expect(text).toContain("42");
    expect(text).not.toContain("999");
  });

  it("renders a neutral image for a wallet with no identity", async () => {
    harness.identity.mockResolvedValue(null);

    const text = await render(`wallet=${WALLET}&score=999`);

    expect(text).not.toContain("Verified human");
    expect(text).not.toContain("999");
    expect(text).not.toContain(WALLET);
  });

  it("renders a neutral image when the chain read fails", async () => {
    harness.identity.mockRejectedValue(new Error("rpc unavailable"));

    const text = await render(`wallet=${WALLET}&score=999`);

    expect(text).not.toContain("Verified human");
    expect(text).not.toContain("999");
  });

  it("renders a neutral image without a wallet", async () => {
    const text = await render("score=999");

    expect(harness.identity).not.toHaveBeenCalled();
    expect(text).not.toContain("Verified human");
    expect(text).not.toContain("999");
  });

  it("does not keep a font from a failed response", async () => {
    harness.identity.mockResolvedValue(null);
    fontFetch.mockResolvedValueOnce(new Response("missing", { status: 404 }));

    await expect(render(`wallet=${WALLET}`)).rejects.toThrow();
    const callsAfterFailure = fontFetch.mock.calls.length;

    await render(`wallet=${WALLET}`);
    expect(fontFetch.mock.calls.length).toBeGreaterThan(callsAfterFailure);
  });
});
