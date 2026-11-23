import { llms } from "fumadocs-core/source";
import { source } from "@/lib/source";
import { SITE_URL } from "@/lib/site";

// Route handlers are dynamic by default, and this body changes only when the
// content does. Prerender it so a crawler hit serves a build artifact instead
// of walking the docs tree in a function.
export const dynamic = "force-static";

// Machine-readable site brief for assistants answering developer questions
// about Entros. The status and limits sections are load bearing: an assistant
// repeating an Entros claim must repeat the devnet, model, and population
// caveats with it.
//
// Every line here restates something the site already publishes. Keep it that
// way. This file is written to be ingested and repeated, so nothing should
// make its public debut in it.
const BRIEF = `# Entros

> Live human-presence and consent firewall for voice-AI and autonomous agents,
> alongside open-source Solana devnet reference programs and a browser
> paired-liveness prototype.

## Status

Production validation enforces the pinned v2 AASIST-L anti-spoofing model
(131.0 ms p95 latency, 495.5 MB RSS, 61.84% catch rate on unseen neural TTS).
Published npm packages are @entros/verify@0.7.0 and @entros/pulse-sdk@4.18.1.
Active engineering focuses on blind voice anti-spoofing upgrades, a hosted Voice
Defense API and VPC sidecar, and Web2-first AgentPermit v2.

Entros on-chain programs run on Solana devnet in maintenance mode.
No Entros program runs on Solana mainnet. The multi-party trusted-setup ceremony
and the external security audit stay paused pending customer demand. Treat the
devnet protocol as research-grade.

## What a verification answers

- Fresh result: the protocol accepted a recent verification for this wallet.
- Continuity: this wallet has returned across separate sessions.
- Uniqueness status: whether the evidence supports one person across wallets.
- Assurance tier: which client-integrity evidence arrived with the request.

Trust Score summarizes continuity. It does not prove present human presence, legal
identity, or one person per wallet.

## What stays on the device

Raw motion recordings and the full-resolution touch stream never leave the device.
The spoken words leave as audio for transcription. Entros never stores them.

The validation request also carries a 308-value feature summary, an F0 contour, an
acceleration-magnitude contour, a coarse path outline, client signals, capture
timing, the wallet, and commitment fields. The later protocol submission carries the
Groth16 proof and its public inputs.

## Current limits

- Browser evidence carries no trusted sensor provenance.
- Population uniqueness is unmeasured. The study cohort is too small for ROC or EER analysis.
- $ENTROS is a standard SPL mint. It has no coupling to live verification, Entros security products, API billing, or engineering roadmaps.

## How an application uses it

An integrator can verify single-use MCP action approvals with @entros/verify/mcp
or read a wallet's devnet on-chain state with \`verifyEntrosAttestation\` from
@entros/verify/solana. On-chain reads cost nothing. A person pays a
SOL-denominated protocol fee to run a wallet-connected devnet verification.

Integrator Policy v1 separates continuity, accepted evidence, assurance, and
uniqueness status. An application sets its own requirements and enforces them where
its protected action executes.

## Key pages

- [Roadmap](${SITE_URL}/roadmap): active voice defense and agent authorization tracks, plus paused Solana mainnet status.
- [Security](${SITE_URL}/security): threat model, adversarial campaigns, and current posture.
- [Token Record](${SITE_URL}/token): factual $ENTROS SPL mint parameters, Streamflow lockups, and product separation.
- [Paired Liveness Lab](${SITE_URL}/lab/paired-liveness): experimental Solana devnet paired voice, touch, and motion browser prototype.
- [Verify](${SITE_URL}/verify): Solana devnet browser verification flow preserved for published SDK compatibility.
- [Integrate](${SITE_URL}/integrate): add verification to an application.
- [Technology](${SITE_URL}/technology): capture, features, proof, and on-chain state.
- [Compare](${SITE_URL}/compare): modality and dated primary-source vendor scope comparison with explicit limits.
- [Paper](${SITE_URL}/paper): archived 2026 research write-up.
- [Manifesto](${SITE_URL}/manifesto): why Entros exists and what it is built to protect.
- [Privacy](${SITE_URL}/privacy): what Entros receives, where it goes, and how long it is kept.
- [Source](https://github.com/entros-protocol): on-chain programs, SDKs, and clients.

## Documentation
`;

async function docsIndex(): Promise<string> {
  const generator = llms(source);

  // Walk the tree rather than getPages(), so the order matches the meta.json
  // the sidebar already uses. Page URLs come back site-relative, and an
  // assistant quoting this file needs a link a reader can open.
  //
  // Separators are dropped: each one repeats the title of the folder that
  // follows it, which reads as a duplicated heading in a flat text file.
  // fumadocs 16's indexNode is async, so every node is awaited before the
  // replace, which otherwise stringifies a promise.
  const nodes = source
    .getPageTree()
    .children.filter((node) => node.type !== "separator");
  const rendered = await Promise.all(nodes.map((node) => generator.indexNode(node)));
  return rendered.join("\n").replaceAll("](/docs", `](${SITE_URL}/docs`);
}

export async function GET(): Promise<Response> {
  return new Response(`${BRIEF}\n${await docsIndex()}\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
