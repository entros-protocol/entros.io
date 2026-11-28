<div align="center">

<img src="public/logos/wordmark.svg" alt="Entros" height="72" />

**Entros: The Live Human-Presence and Consent Firewall for Voice-AI and Autonomous Agents.**

Real-time zero-retention voice liveness bound to single-use cryptographic action permits and zero-ID Passkey step-up.

[Home](https://entros.io) · [Technology](https://entros.io/technology) · [Docs](https://entros.io/docs) · [Security](https://entros.io/security) · [Paper](https://entros.io/paper)

</div>

---

## Overview

This repository hosts the `entros.io` web application, documentation, research paper, and secondary browser demo routes.

Entros verifies live human presence and cryptographic consent when a Voice-AI agent or autonomous MCP agent calls a privileged tool. The firewall operates without government IDs, face databases, iris scans, or persistent voiceprint vaults.

Entros separates active infrastructure from maintenance surfaces:

- **Active product core:** Private real-time voice liveness engine (`entros-validation`), blind red-team evaluation harness (`entros-redteam`), pure-MIT verification SDK (`@entros/verify`), and this website (`entros.io`).
- **Secondary R&D surface:** One-shot browser paired-liveness capture (`/lab/paired-liveness`, `/verify`, `/embed/verify-popup`, and `@entros/pulse-sdk`).
- **Maintenance devnet surface:** Solana devnet Anchor contracts, Circom Groth16 circuits, `executor-node`, and the devnet Realms voter-weight plugin. On-chain mainnet deployment stays paused pending customer demand, a multi-party trusted-setup ceremony, and an external security audit.

## Architecture and Live Posture

### Active Voice and Consent Firewall

1. **Real-time voice liveness:** The private validator scores raw un-denoised audio in RAM with zero disk persistence and zero default voiceprint database. Live production enforces the pinned `v2 AASIST-L` anti-spoofing stage. The `entros-validation` `develop` branch implements the streaming and REST Firewall API (`/v1/voice/analyze`, `/v1/voice/stream`, Tier-B CPU sidecar). Those endpoints stay unreleased until blind-bank gates pass.
2. **Action-bound permits (`AgentPermit`):** `@entros/verify@0.7.0` ships pure-MIT `@entros/verify/mcp` (canonical action hashing, atomic `McpNonceStore`, OpenAI Responses and HumanLayer adapters) and `@entros/verify/solana` on npm. The `develop` branches of `entros-validation` and `entros-verify` implement Web2-first `AgentPermit` v2 (Ed25519 JWS, `RFC 8785` JCS, `WebAuthn UV` step-up, `MCP 2026-07-28` MRTR, `SEP-1036`, OpenID CIBA, and `IETF SCITT` `RFC 9943` receipts). Neither npm nor PyPI publishes `v2` yet.
3. **Privacy boundary:** The voice engine clears audio buffers from RAM after scoring. Audit logs record metadata only (`request_id`, timestamp, `model_version`, verdict, signal quality, latency). In the secondary browser paired-liveness flow, raw motion and full-resolution touch stay on device. Phrase audio leaves transiently for verification and never persists.

### Security Testing and Claims Scope

Public aggregate test results cover campaigns T1 through T4b on the browser pipeline. T1 through T3 recorded 0% pass across 16,000+ naive procedural attempts. T4a and T4b tested pre-recorded voice and frozen-scope synthesis on the legacy paired flow. On held-out unseen neural TTS benchmarks, the pinned `v2 AASIST-L` model claims no general synthesis rejection. T5 stays open, and `8 kHz` telephony and live voice-conversion rates stay unmeasured until preregistered blind-bank evaluations finish.

The public [security page](https://entros.io/security) and [`AUDIT.md`](./AUDIT.md) publish curated posture summaries.

## Repositories

| Repo | Status | Purpose |
|---|---|---|
| [`entros.io`](https://github.com/entros-protocol/entros.io) | Active (Public) | Website, documentation, research paper, and secondary `/lab/paired-liveness` routes |
| [`entros-verify`](https://github.com/entros-protocol/entros-verify) | Active (Public) | Pure-MIT `@entros/verify` SDK (TypeScript on npm, Python `entros-verify` on `develop`) |
| `entros-validation` | Active (Private) | Voice anti-spoofing ONNX runtime, `AgentPermit` v2 issuer, and Firewall API |
| `entros-redteam` | Active (Private) | Sealed Adversarial Blind Bank, model distillation, and red-team suites |
| [`pulse-sdk`](https://github.com/entros-protocol/pulse-sdk) | Secondary R&D (Public) | Browser paired-liveness capture and proving SDK (`@entros/pulse-sdk` on npm) |
| [`protocol-core`](https://github.com/entros-protocol/protocol-core) | Maintenance (Public) | Solana devnet Anchor programs (`entros-anchor`, `entros-verifier`, `entros-registry`) |
| [`circuits`](https://github.com/entros-protocol/circuits) | Maintenance (Public) | Groth16 commitment-opening and bounded Hamming-distance circuit |
| [`executor-node`](https://github.com/entros-protocol/executor-node) | Maintenance (Public) | Legacy devnet gateway for paired sessions and SAS attestation requests |
| [`entros-governance-plugin`](https://github.com/entros-protocol/entros-governance-plugin) | Maintenance (Public) | Solana devnet Realms voter-weight plugin |
| [`token-contracts`](https://github.com/entros-protocol/token-contracts) | Reference (Public) | Factual SPL token and lockup record (`$ENTROS` is decoupled from verification) |
| [`entros-mobile`](https://github.com/entros-protocol/entros-mobile) | Secondary R&D (Paused) | React Native prototype for mobile capture and native proving |
| [`entros-mopro`](https://github.com/entros-protocol/entros-mopro) | Secondary R&D (Paused) | Native Groth16 prover bindings for mobile builds |

## Integrate

### Pure-MIT MCP Verification SDK (`@entros/verify@0.7.0`)

Install `@entros/verify` with zero GPL dependencies:

```bash
npm install @entros/verify
```

```ts
import {
  createMcpApprovalGate,
  createInMemoryMcpNonceStore,
} from "@entros/verify/mcp";
```

See the [MCP quickstart](https://entros.io/docs/quickstart/mcp-approval) for full examples.

### Legacy Devnet Surfaces

The secondary browser popup (`@entros/verify`), `@entros/pulse-sdk`, and Solana devnet chain readers (`@entros/verify/solana`) remain functional for existing devnet integrators. Wallet-connected devnet verification uses the configurable on-chain SOL fee (default `0.005 SOL`). Read-only chain queries require no transaction and no fee.

| Devnet Program | Program ID |
|---|---|
| `entros-anchor` | `GZYwTp2ozeuRA5Gof9vs4ya961aANcJBdUzB7LN6q4b2` |
| `entros-verifier` | `4F97jNoxQzT2qRbkWpW3ztC3Nz2TtKj3rnKG8ExgnrfV` |
| `entros-registry` | `6VBs3zr9KrfFPGd6j7aGBPQWwZa5tajVfA7HN6MMV9VW` |
| `entros-governance-plugin` | `99nwXzcugse3x8kxE9v6mxZiq8T9gHDoznaaG6qcw534` |

## Commercial Billing and `$ENTROS` Boundary

Entros operates on standard B2B API and enterprise billing for the Voice and Consent Firewall, with no mandatory wallets or token requirements.

`$ENTROS` is a standard SPL mint launched on a public launchpad, with mint and freeze authority revoked. It has zero coupling to Entros verification products, API billing, or engineering roadmaps. See [`entros.io/token`](https://entros.io/token) for the factual on-chain lockup record.

## Local Development

Use the Node version pinned in `.nvmrc`.

1. Install dependencies: `npm ci`
2. Run lint checks: `npm run lint -- --max-warnings 0`
3. Run type checks: `npm run typecheck`
4. Run unit tests: `npm test`
5. Build production output: `npm run build`

## Documentation

| Surface | URL |
|---|---|
| Home | [entros.io](https://entros.io) |
| Technology | [entros.io/technology](https://entros.io/technology) |
| Documentation | [entros.io/docs](https://entros.io/docs) |
| Security program | [entros.io/security](https://entros.io/security) |
| Research paper | [entros.io/paper](https://entros.io/paper) |
| Secondary browser lab | [entros.io/lab/paired-liveness](https://entros.io/lab/paired-liveness) |
| Public security ledger | [`AUDIT.md`](./AUDIT.md) |

## Security

Report security vulnerabilities privately to `contact@entros.io`.

## License

Entros-authored source across public repositories carries the MIT License (`LICENSE`). Compiled `circuits` artifacts include `circomlib` (`GPL-3.0`) templates, and circuit build tooling uses `snarkjs` and `circom` (`GPL-3.0`). `@entros/pulse-sdk` loads `snarkjs` and `pitchfinder` (`GPL-3.0`) via runtime dynamic `import()` without bundling them into `dist/`. `@entros/verify` uses strictly permissive MIT dependencies with zero `GPL-3.0` dependencies. The private `entros-validation` and `entros-redteam` repositories stay closed.
