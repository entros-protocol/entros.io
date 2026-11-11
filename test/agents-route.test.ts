import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "../src/app/api/agents/route";

const OWNER = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
const ASSET = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

let indexer: ReturnType<typeof vi.fn<typeof fetch>>;

function respond(body: unknown) {
  indexer.mockResolvedValueOnce(
    new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } }),
  );
}

async function agents(): Promise<Response> {
  return GET(new Request(`https://entros.test/api/agents?owner=${OWNER}`));
}

beforeEach(() => {
  indexer = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", indexer);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("agents route", () => {
  it("returns only the fields of well-formed rows", async () => {
    respond([
      { asset: ASSET, agent_uri: "https://agent.example/card.json", nft_name: "Scout", owner: OWNER, extra: "x" },
      { asset: "not-an-address", agent_uri: "https://agent.example", nft_name: null },
      { asset: ASSET, agent_uri: 42, nft_name: null },
      { asset: ASSET, agent_uri: "https://agent.example", nft_name: { name: "x" } },
      null,
      "row",
    ]);

    const response = await agents();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { asset: ASSET, agent_uri: "https://agent.example/card.json", nft_name: "Scout" },
    ]);
  });

  it("keeps an agent that has no URI", async () => {
    respond([{ asset: ASSET, agent_uri: null, nft_name: null }]);

    const response = await agents();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ asset: ASSET, agent_uri: null, nft_name: null }]);
  });

  it("asks the indexer for the three columns the page uses", async () => {
    respond([]);

    await agents();

    const upstream = new URL(String(indexer.mock.calls[0]![0]));
    expect(upstream.searchParams.get("select")).toBe("asset,agent_uri,nft_name");
    expect(upstream.searchParams.get("owner")).toBe(`eq.${OWNER}`);
    expect(upstream.searchParams.get("limit")).toBe("100");
  });

  it("caps the list at 100 rows", async () => {
    respond(Array.from({ length: 250 }, () => ({ asset: ASSET, agent_uri: "https://agent.example", nft_name: null })));

    const rows: unknown[] = await (await agents()).json();

    expect(rows).toHaveLength(100);
  });

  it("rejects a response that is not a list", async () => {
    respond({ asset: ASSET, agent_uri: "https://agent.example", nft_name: null });

    const response = await agents();

    expect(response.status).toBe(502);
  });

  it("answers 502 for a body larger than a page of agents", async () => {
    const row = { asset: ASSET, agent_uri: "https://agent.example", nft_name: null, padding: "x".repeat(8_192) };
    respond(Array.from({ length: 100 }, () => row));

    const response = await agents();

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Indexer response too large" });
  });

  it("answers 502 for a declared length larger than a page of agents, without reading the body", async () => {
    const body = new ReadableStream<Uint8Array>({
      pull() {
        throw new Error("The body was read");
      },
    });
    indexer.mockResolvedValueOnce(
      new Response(body, {
        status: 200,
        headers: { "Content-Type": "application/json", "Content-Length": String(10 * 1024 * 1024) },
      }),
    );

    const response = await agents();

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Indexer response too large" });
  });

  it("answers 502 for a body that is not JSON", async () => {
    indexer.mockResolvedValueOnce(new Response("<html>", { status: 200 }));

    const response = await agents();

    expect(response.status).toBe(502);
  });

  it("drops rows whose text fields run past their limits", async () => {
    respond([
      { asset: ASSET, agent_uri: `https://agent.example/${"a".repeat(2_048)}`, nft_name: null },
      { asset: ASSET, agent_uri: "https://agent.example", nft_name: "n".repeat(129) },
      { asset: ASSET, agent_uri: `https://agent.example/${"a".repeat(2_000)}`, nft_name: "n".repeat(128) },
    ]);

    const rows: { agent_uri: string; nft_name: string | null }[] = await (await agents()).json();

    expect(rows).toHaveLength(1);
    expect(rows[0]!.nft_name).toHaveLength(128);
  });
});
