import { isValidElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  identity: vi.fn<(wallet: string, connection: unknown) => Promise<unknown>>(),
  readFile: vi.fn<(filePath: string) => Promise<Buffer>>(),
}));

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    readFile: (...args: Parameters<typeof actual.readFile>) =>
      harness.readFile(String(args[0])),
  };
});

vi.mock("next/og", () => ({
  ImageResponse: class {
    readonly element: ReactNode;
    readonly headers: Headers;
    readonly fonts: { name: string; data: ArrayBuffer }[];
    constructor(
      element: ReactNode,
      init: {
        headers?: Record<string, string>;
        fonts?: { name: string; data: ArrayBuffer }[];
      },
    ) {
      this.element = element;
      this.headers = new Headers(init.headers);
      this.fonts = init.fonts ?? [];
    }
  },
}));

vi.mock("@entros/pulse-sdk", () => ({
  fetchIdentityState: harness.identity,
}));

const WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

type RenderedImage = {
  element: ReactNode;
  headers: Headers;
  fonts: { name: string; data: ArrayBuffer }[];
};

function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

let fetchSpy: ReturnType<typeof vi.fn<typeof fetch>>;

async function renderResponse(query: string): Promise<RenderedImage> {
  const { GET } = await import("../src/app/api/og/anchor/route");
  return (await GET(
    new Request(`https://entros.test/api/og/anchor?${query}`),
  )) as unknown as RenderedImage;
}

async function render(query: string): Promise<string> {
  return textOf((await renderResponse(query)).element);
}

beforeEach(async () => {
  vi.resetModules();
  harness.identity.mockReset();
  const actualFs = await vi.importActual<typeof import("node:fs/promises")>(
    "node:fs/promises",
  );
  harness.readFile.mockReset();
  harness.readFile.mockImplementation((filePath) => actualFs.readFile(filePath));
  fetchSpy = vi.fn<typeof fetch>(async () => {
    throw new Error("unexpected network fetch");
  });
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("share image", () => {
  it("loads fonts from disk without calling fetch", async () => {
    harness.identity.mockResolvedValue({ owner: WALLET, trustScore: 42 });

    const rendered = await renderResponse(`wallet=${WALLET}`);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(harness.readFile).toHaveBeenCalledTimes(2);
    expect(rendered.fonts.map((font) => font.name)).toEqual([
      "Geist",
      "JetBrainsMono",
    ]);
    for (const font of rendered.fonts) {
      expect(font.data.byteLength).toBeGreaterThan(0);
    }
  });

  it("renders the chain score, never the score in the link", async () => {
    harness.identity.mockResolvedValue({ owner: WALLET, trustScore: 42 });

    const text = await render(`wallet=${WALLET}&score=999`);

    expect(harness.identity).toHaveBeenCalledWith(WALLET, expect.anything());
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(text).toContain("Verified human");
    expect(text).toContain("42");
    expect(text).not.toContain("999");
  });

  it("renders a neutral image for a wallet with no identity", async () => {
    harness.identity.mockResolvedValue(null);

    const text = await render(`wallet=${WALLET}&score=999`);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(text).not.toContain("Verified human");
    expect(text).not.toContain("999");
    expect(text).not.toContain(WALLET);
  });

  it("renders a neutral image when the chain read fails", async () => {
    harness.identity.mockRejectedValue(new Error("rpc unavailable"));

    const text = await render(`wallet=${WALLET}&score=999`);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(text).not.toContain("Verified human");
    expect(text).not.toContain("999");
  });

  it("renders a neutral image without a wallet", async () => {
    const text = await render("score=999");

    expect(harness.identity).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(text).not.toContain("Verified human");
    expect(text).not.toContain("999");
  });

  it("does not keep a font cache after a failed disk read", async () => {
    harness.identity.mockResolvedValue(null);
    harness.readFile.mockRejectedValueOnce(new Error("ENOENT"));

    await expect(render(`wallet=${WALLET}`)).rejects.toThrow("ENOENT");
    const callsAfterFailure = harness.readFile.mock.calls.length;

    await render(`wallet=${WALLET}`);
    expect(harness.readFile.mock.calls.length).toBeGreaterThan(callsAfterFailure);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
