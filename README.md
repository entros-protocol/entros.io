<div align="center">

<img src="public/logos/wordmark.svg" alt="entros" height="72" />

**Behavioral proof-of-personhood research and infrastructure on Solana.**

Designed to prove humanness through a behavioral capture. Link AI agents to the wallet that operates them.<br />
Build Trust. Gate any Solana dApp.

[Home](https://entros.io) · [Demo](https://entros.io/verify) · [Paper](https://entros.io/paper) · [Docs](https://entros.io/docs) · [Security](https://entros.io/security)

</div>

---

## What

Speak a server-issued challenge phrase while tracing its curve. The Pulse SDK captures voice, motion, and touch dynamics, then extracts a 308-feature summary on-device. Audio contributes 170 features, motion contributes 81, and touch contributes 57. SimHash projects the summary into a fingerprint. Poseidon commits to that fingerprint and a salt. The first verification registers the baseline and mints a non-transferable Token-2022 Anchor. Each re-verification proves that the previous and new commitments open correctly and satisfy the circuit's distance range.

**Raw motion and full-resolution touch never leave the device.** The validation path receives the feature summary, selected F0 and acceleration series, wallet address, phrase audio, capture timing, client signals, a coarse curve outline, commitment data, and receipt intent. The service processes phrase audio in memory without writing the waveform to logs or persistent storage. The wallet flow submits commitments, proofs, public inputs, and encrypted baseline material on-chain when available.

## Who

- **dApps** gating real humans: airdrops, DAOs, fee discounts, content access
- **AI agents** linking to the wallet that completed Entros verification on the Solana Agent Registry
- **Users** wanting one verification readable by every dApp on Solana, with no API keys and no billing relationship

## How a capture is checked

Every capture, first or repeat, runs through server-side checks before it reaches your wallet:

- **Phrase binding.** Audio is transcribed by Whisper and word-distance-matched against the server-issued challenge phrase. A capture that doesn't speak the issued phrase fails the match.
- **Entropy and variance analysis.** Per-modality Shannon entropy and variance floors reject constant or low-information feature vectors.
- **Voice synthesis analysis.** The private validator examines acoustic and feature-distribution evidence for synthetic artifacts.
- **Cross-signal temporal analysis.** The validator measures time-series relationships between speech and motion submitted during one capture. Entros is testing whether they add reliable discrimination across human users, consumer devices, and adaptive synthesis.
- **Cross-wallet similarity.** The private registry compares submitted fingerprints across wallets. Population-level uniqueness remains an active research question.
- **Adaptive attack controls.** The private stack limits repeated probing and keeps operational detector policy outside public clients.

T1 through T3: 16,000 adversarial attempts, none passed. T4a paired pre-recorded human voice with procedural motion and moved from a 100% pass counterfactual to 0% across four progressive defense waves. T4b ran real-time synthesized voice across two TTS model families and 58 synthetic voices speaking the issued phrase, and 0% reached the chain across 200 attempts. T5 remains open. T6 is blocked on T5 closure. T7 and T8 remain queued.

**Re-verification adds a bounded continuity proof.** Each subsequent capture produces a Poseidon commitment. The Groth16 circuit proves that both commitments open correctly and that their Hamming distance is below the maximum and at or above the replay floor. The circuit proves relationships between supplied fingerprints. It does not prove capture provenance or personhood by itself. Trust Score starts at zero and recalculates from active weekly bins and account age.

Each campaign targets a defined failure mode. The public [security page](https://entros.io/security) reports scoped aggregate results.

## Economics

Wallet-connected transactions read `verification_fee` from the on-chain protocol config. Initialization uses a 0.005 SOL default. The authority can update the live value.

First verification also funds rent for the Anchor mint, associated token account, and `IdentityState`. Re-verification funds temporary proof accounts. Clients must query the target cluster and show the final wallet transaction before approval.

Detection decides whether a capture passes. The fee and rate limits only bound request volume.

Integrators read verified state from the on-chain Anchor PDA for free. No API keys, no billing relationship, no permission to read. The protocol monetizes the write side; the read side is composable Solana state.

$ENTROS is a standard SPL mint launched through a public fair launch on EasyA Kickstart, with mint and freeze authority revoked. It is a standalone mint today, with no coupling to live verification. Validator staking, governance over protocol parameters, and the multi-validator network they would serve are roadmap, not current behaviour.

---

## The stack

This repo (`entros.io`) is the website, the verification dApp, and the documentation. The full protocol is a multi-repo organization. Every component is open source unless noted.

### Repositories

| Repo | Purpose |
|---|---|
| [`entros.io`](https://github.com/entros-protocol/entros.io) | **This repo**: website, verification dApp, docs, paper |
| [`protocol-core`](https://github.com/entros-protocol/protocol-core) | Three Anchor programs: identity mint, ZK verifier, registry |
| [`circuits`](https://github.com/entros-protocol/circuits) | Groth16 commitment-opening and bounded Hamming-distance circuit. Current source is an unpublished successor to deployed artifacts. |
| [`pulse-sdk`](https://github.com/entros-protocol/pulse-sdk) | Client SDK: capture → fingerprint → prove → submit. npm [`@entros/pulse-sdk`](https://www.npmjs.com/package/@entros/pulse-sdk) |
| [`entros-verify`](https://github.com/entros-protocol/entros-verify) | Drop-in popup component. npm [`@entros/verify`](https://www.npmjs.com/package/@entros/verify) |
| [`executor-node`](https://github.com/entros-protocol/executor-node) | Public gateway: challenges, integrator auth, quotas, validator forwarding, SAS requests, and on-chain relay |
| `entros-validation` | Behavioral validator, running as the relayer's validation backend (proprietary) |
| `entros-redteam` | Private adversarial harness for completed campaigns, research prototypes, telemetry, and regression coverage. T5 remains open. Later tiers remain planned. |
| [`entros-mobile`](https://github.com/entros-protocol/entros-mobile) | Mobile app, in development: capture, native ZK proving via mopro, on-chain submit via Mobile Wallet Adapter |
| [`entros-mopro`](https://github.com/entros-protocol/entros-mopro) | Native Groth16 prover bindings consumed by `entros-mobile`. Native proof smoke coverage remains planned. |
| [`entros-governance-plugin`](https://github.com/entros-protocol/entros-governance-plugin) | Devnet voter-weight program. Realms client integration remains planned. |
| [`token-contracts`](https://github.com/entros-protocol/token-contracts) | No code. Maps where $ENTROS utility lives; the mint itself comes from a public launchpad. Staking and incentive wiring are roadmap. |

### On-chain

| Program | Program ID |
|---|---|
| `entros-anchor` | `GZYwTp2ozeuRA5Gof9vs4ya961aANcJBdUzB7LN6q4b2` |
| `entros-verifier` | `4F97jNoxQzT2qRbkWpW3ztC3Nz2TtKj3rnKG8ExgnrfV` |
| `entros-registry` | `6VBs3zr9KrfFPGd6j7aGBPQWwZa5tajVfA7HN6MMV9VW` |
| `entros-governance-plugin` | `99nwXzcugse3x8kxE9v6mxZiq8T9gHDoznaaG6qcw534` |

---

## Integrate

> Current support is devnet-only. Mainnet remains gated on hardening, a coordinated artifact ceremony, external audit, and operational readiness.

Three tiers, depending on how much UX control the integrator wants.

### Tier 1: drop-in popup

Five lines of JSX.

```tsx
import { EntrosVerify } from "@entros/verify";

<EntrosVerify
  integratorKey="my-app"
  onVerified={(result) => grantAccess(result.walletPubkey)}
/>
```

### Tier 2: programmatic SDK

Integrator owns the capture UX, branding, error states. Install the standard Solana peers alongside: `npm install @solana/web3.js @solana/wallet-adapter-base`.

```ts
import { PulseSDK } from "@entros/pulse-sdk";

const sdk = new PulseSDK({
  cluster: "devnet",
  rpcEndpoint: rpcUrl,
  relayerUrl,
});
const result = await sdk.verify(captureDiv, walletAdapter, connection);
```

### Tier 3: read-only on-chain

No verification flow in the integrator app. Pure PDA read. Free, composable, no API keys.

```ts
import { verifyEntrosAttestation } from "@entros/pulse-sdk";

const attestation = await verifyEntrosAttestation(walletAddress, connection);
const isVerified = attestation?.isHuman && !attestation.expired;
```

---

## Integrations

| Integration | What it does | Where |
|---|---|---|
| **SAS issuer** | The SDK attempts a wallet-bound SAS attestation after successful verification. Issuance is separate and best-effort. | [`executor-node`](https://github.com/entros-protocol/executor-node) `/attest` |
| **Agent Anchor** | A wallet that completed Entros verification can link registered AI agents through Solana Agent Registry metadata. | [`pulse-sdk`](https://github.com/entros-protocol/pulse-sdk) · [entros.io/agents](https://entros.io/agents) |
| **Realms plugin** | On-chain voter-weight prototype deployed on devnet. The Realms JavaScript client and plugin chaining remain planned. | [`entros-governance-plugin`](https://github.com/entros-protocol/entros-governance-plugin) |

---

## Documentation

| Surface | URL |
|---|---|
| Research paper | [entros.io/paper](https://entros.io/paper) |
| How it works | [entros.io/technology](https://entros.io/technology) |
| Integrate | [entros.io/integrate](https://entros.io/integrate) |
| Security program | [entros.io/security](https://entros.io/security) |
| Live verification demo | [entros.io/verify](https://entros.io/verify) |
| On-chain stats | [entros.io/stats](https://entros.io/stats) |
| Public security ledger | [`AUDIT.md`](./AUDIT.md) |

---

## Security

The security taxonomy covers T1 through T8. Public aggregate results currently cover T1 through T4b. T5 remains open. Responsible disclosure: contact@entros.io.

---

## License

MIT for each open repository in the organization, subject to its `LICENSE`. The private validation service runs behind the hosted devnet flow and is not published.
