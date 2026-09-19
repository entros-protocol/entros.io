import { llms } from "fumadocs-core/source";
import { source } from "@/lib/source";
import { SITE_URL } from "@/lib/site";

// Machine-readable site brief for assistants that answer developer questions
// about proof of personhood on Solana. The status and limits sections are load
// bearing: an assistant that repeats an Entros claim must repeat the devnet and
// population caveats with it.
const BRIEF = `# Entros Protocol

> Proof of personhood on Solana. A person completes a short voice, motion and touch
> capture in the browser. The device derives features locally. The protocol anchors
> the accepted result to a wallet on chain.

## Status

Entros runs on Solana devnet. No Entros program runs on Solana mainnet. The
trusted-setup ceremony and the external security audit are open. Treat the protocol
as research-grade.

## What a verification answers

- Fresh result: the protocol accepted a recent verification for this wallet.
- Continuity: this wallet has returned across separate sessions.
- Uniqueness status: whether the evidence supports one person across wallets.
- Assurance tier: which client-integrity evidence arrived with the request.

Trust Score summarizes continuity. It does not prove present human presence, legal
identity, or one person per wallet.

## What stays on the device

Raw motion recordings and the full-resolution touch stream never leave the device.
The spoken phrase leaves as audio for transcription. Entros never stores it.

The validation request also carries a 308-value feature summary, an F0 contour, an
acceleration-magnitude contour, a coarse path outline, client signals, capture
timing, the wallet, and commitment fields. The later protocol submission carries the
Groth16 proof and its public inputs.

## Current limits

- Browser evidence carries no trusted sensor provenance.
- Population uniqueness is unmeasured. The study cohort is too small for ROC or EER analysis.
- $ENTROS is a standard SPL mint. It has no coupling to live verification.

## How an application uses it

An integrator reads on-chain state through \`verifyEntrosAttestation\` and pays
nothing to read. A person pays a SOL-denominated protocol fee for a
wallet-connected verification. Integrator Policy v1 pins a policy version so an
application can recheck state when its action settles.

## Key pages

- [Verify](${SITE_URL}/verify): run the live devnet verification flow.
- [Integrate](${SITE_URL}/integrate): add verification to an application.
- [Technology](${SITE_URL}/technology): capture, features, proof, and on-chain state.
- [Security](${SITE_URL}/security): threat model and current posture.
- [Paper](${SITE_URL}/paper): the research write-up.
- [Roadmap](${SITE_URL}/roadmap): what is live and what is planned.
- [Token](${SITE_URL}/token): $ENTROS status and lock records.
- [Source](https://github.com/entros-protocol): on-chain programs, SDK, and clients.

## Documentation
`;

function docsIndex(): string {
  const generator = llms(source);

  // Walk the tree rather than getPages(), so the order matches the meta.json
  // the sidebar already uses. Page URLs come back site-relative, and an
  // assistant quoting this file needs a link a reader can open.
  //
  // Separators are dropped: each one repeats the title of the folder that
  // follows it, which reads as a duplicated heading in a flat text file.
  return source
    .getPageTree()
    .children.filter((node) => node.type !== "separator")
    .map((node) => generator.indexNode(node))
    .join("\n")
    .replaceAll("](/docs", `](${SITE_URL}/docs`);
}

export function GET(): Response {
  return new Response(`${BRIEF}\n${docsIndex()}\n`, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
