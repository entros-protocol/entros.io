<div align="center">

<img src="public/logos/wordmark.svg" alt="entros" height="72" />

**Behavioral proof-of-personhood on Solana.**

Prove you're human with a twelve-second capture on your device. Vouch for the AI agents you operate.<br />
Build Trust. Gate any Solana dApp.

[Home](https://entros.io) · [Demo](https://entros.io/verify) · [Paper](https://entros.io/paper) · [Docs](https://entros.io/docs) · [Security](https://entros.io/security)

</div>

---

## What

Speak a server-issued challenge phrase: five words drawn at random from a curated 1,357-word dictionary, about 4.6 × 10¹⁵ combinations, fresh on every verification. For twelve seconds the Pulse SDK captures your voice prosody and the involuntary motion of your input device, whether that's a mouse, trackpad, touchscreen, or gyroscope. It extracts a 308-feature statistical signature on-device (170 audio: F0 statistics, jitter, shimmer, HNR, MFCCs and delta-MFCCs, LPC coefficients, formant trajectories, voice-quality metrics, pitch-contour DCT, LTAS; 81 motion; 57 touch) and hashes it into a Poseidon commitment. Your first verification registers that commitment as your baseline, and an Entros Anchor, a non-transferable Token-2022, mints to your wallet. Every re-verification generates a Groth16 ZK proof binding the new commitment to your previous one.

**Raw motion and touch never leave your device.** They are reduced to features on-device and discarded. What leaves is the ZK proof, the statistical summary, a coarse outline of the traced challenge curve, and the phrase audio, which the validator transcribes and discards without storing.

## Who

- **dApps** gating real humans: airdrops, DAOs, fee discounts, content access
- **AI agents** binding to a verifiable human operator on the Solana Agent Registry
- **Users** wanting one verification readable by every dApp on Solana, with no API keys and no billing relationship

## How a capture is checked

Every capture, first or repeat, runs through server-side checks before it reaches your wallet:

- **Phrase binding.** Audio is transcribed by Whisper and word-distance-matched against the server-issued challenge phrase. A capture that doesn't speak the issued phrase fails the match.
- **Entropy and variance analysis.** Per-modality Shannon entropy and variance floors reject constant or low-information feature vectors.
- **Voice synthesis fingerprinting.** Jitter and shimmer floors/ceilings, HNR bounds, voicing-ratio bounds, F0 delta variance, measured on the dimensions where synthesized speech is statistically distinct from a human larynx.
- **Cross-modal temporal coupling.** Voice F0 and hand acceleration are causally coupled within a tight temporal window in real humans. A bot stitching audio onto procedural motion fails the cross-correlation peak.
- **Sybil registry scan.** Your fingerprint is checked against every other verified user's, regardless of wallet. Biological collisions across wallets are caught.
- **Calibration-attack noise.** Controlled noise on borderline outcomes near every threshold check, designed to defeat attackers probing for boundary-crafted inputs.

T1 through T3: 16,000 adversarial attempts, none passed. T4a paired pre-recorded human voice with procedural motion and moved from a 100% pass counterfactual to 0% across four progressive defense waves. T4b ran real-time synthesized voice across two TTS model families and 58 synthetic voices speaking the issued phrase, and 0% reached the chain across 200 attempts. T5 through T8 are queued.

**Re-verification adds temporal consistency.** Every subsequent capture produces a Poseidon commitment; a Groth16 ZK circuit proves the Hamming distance to your previous on-chain commitment is below a threshold (similar enough to be you) AND above a floor (different enough to be fresh, not a replay). A cloned capture doesn't survive the next round, because the following capture has to drift the way a person's does: close enough to match, different enough to be new. Trust Score starts at zero on first verification, since the baseline is registered rather than trusted, and accrues with each successful re-verification. Integrators gate on Trust Score rather than the binary verified flag.

Each layer targets a different failure mode, and the red team publishes what it measures against each one (see [security](https://entros.io/security)).

## Economics

Users pay a small protocol fee per verification, currently about 0.005 SOL and tunable as Solana economics evolve. It is deducted inside the on-chain mint transaction, accrues to the protocol treasury, and is auditable on Solana Explorer.

**Total user cost per verification:**

| Action | Protocol fee (non-refundable) | One-time account rent | Total upfront |
|---|---|---|---|
| First verification | 0.005 SOL | ~0.011 SOL | ~0.016 SOL |
| Each re-verification | 0.005 SOL | ~0.004 SOL (Challenge + VerificationResult) | ~0.009 SOL |

The one-time rent funds the user's on-chain Identity Anchor: a Token-2022 mint with metadata extensions, an Associated Token Account, and the IdentityState PDA. Solana holds account rent rather than spending it, and the two per-attempt accounts are recoverable through `close_challenge` and `close_verification_result`. The persistent accounts stay funded while the identity is active. Only the protocol fee is non-refundable.

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
| [`circuits`](https://github.com/entros-protocol/circuits) | Groth16 Hamming-distance circuit (~2,010 constraints) |
| [`pulse-sdk`](https://github.com/entros-protocol/pulse-sdk) | Client SDK: capture → fingerprint → prove → submit. npm [`@entros/pulse-sdk`](https://www.npmjs.com/package/@entros/pulse-sdk) |
| [`entros-verify`](https://github.com/entros-protocol/entros-verify) | Drop-in popup component. npm [`@entros/verify`](https://www.npmjs.com/package/@entros/verify) |
| [`executor-node`](https://github.com/entros-protocol/executor-node) | Off-chain relayer: feature validation, SAS attestation, on-chain submit |
| `entros-validation` | Behavioral validator, running as the relayer's validation backend (proprietary) |
| `entros-redteam` | Adversarial test harness: T1 through T8 attack synthesis, telemetry, regression coverage (proprietary) |
| [`entros-mobile`](https://github.com/entros-protocol/entros-mobile) | Mobile app, in development: capture, native ZK proving via mopro, on-chain submit via Mobile Wallet Adapter |
| [`entros-mopro`](https://github.com/entros-protocol/entros-mopro) | Native Groth16 prover bindings (UniFFI `.so` + Swift / Kotlin) consumed by `entros-mobile` |
| [`entros-governance-plugin`](https://github.com/entros-protocol/entros-governance-plugin) | Realms DAO voter-weight plugin |
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

> Currently devnet; mainnet in preparation after the integrator pilot.

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
| **SAS issuer** | Every successful verification triggers a Solana Attestation Service attestation on the user's wallet. Any dApp reads it without integrating Entros directly. | [`executor-node`](https://github.com/entros-protocol/executor-node) `/attest` |
| **Agent Anchor** | Verified human binds to a registered AI agent via metadata on the Solana Agent Registry. One human, one anchor, one or more agents. | [`pulse-sdk`](https://github.com/entros-protocol/pulse-sdk) · [entros.io/agents](https://entros.io/agents) |
| **Realms plugin** | Optional behavioral gate for DAO voting, using a Trust Score and recency threshold. Drops in via the standard voter-weight addin interface. | [`entros-governance-plugin`](https://github.com/entros-protocol/entros-governance-plugin) |

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

Continuous adversarial testing across the T1 through T8 attack tiers. Public methodology, private parameter values. Responsible disclosure: contact@entros.io.

---

## License

MIT for every open repo in the org (per each repo's `LICENSE`). The behavioral validation service is proprietary; it runs as the production relayer's validation backend and is not published.
