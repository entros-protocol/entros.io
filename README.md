<div align="center">

<img src="public/logos/wordmark.svg" alt="entros" height="72" />

**Behavioral proof-of-personhood on Solana.**

Prove you're human in 12 seconds, on your device. Vouch for the AI agents you operate.<br />
Build Trust. Gate any Solana dApp.

[Home](https://entros.io) · [Demo](https://entros.io/verify) · [Paper](https://entros.io/paper) · [Docs](https://entros.io/docs) · [Security](https://entros.io/security)

</div>

---

## What

Speak a server-issued challenge phrase—five words drawn at random from a curated 1,357-word dictionary (1,357⁵ ≈ 4.6 × 10¹⁵ possible combinations, fresh on every verification). The Pulse SDK captures your voice prosody and the involuntary motion of your input device—mouse, trackpad, touchscreen, or gyroscope—for twelve seconds. It extracts a 308-feature statistical signature locally (170 audio—F0 statistics, jitter, shimmer, HNR, MFCCs and delta-MFCCs, LPC coefficients, formant trajectories, voice-quality metrics, pitch-contour DCT, LTAS; 81 motion; 57 touch) and hashes it into a Poseidon commitment. Your first verification registers that commitment as your baseline; an Entros Anchor—a non-transferable Token-2022—mints to your wallet. Every re-verification generates a Groth16 ZK proof binding the new commitment to your previous one. **Raw biometric data is never stored or logged.** Only the proof and the statistical summary persist.

## Who

- **dApps** gating real humans—airdrops, DAOs, fee discounts, content access
- **AI agents** binding to a verifiable human operator on the Solana Agent Registry
- **Users** wanting one verification readable by every dApp on Solana—no API keys, no billing relationship

## Why this isn't broken by bots

The first verification is fully hardened on its own. Every capture, first or repeat, runs through a layered server-side gauntlet before it ever touches your wallet:

- **Phrase binding.** Audio is transcribed by Whisper and word-distance-matched against the server-issued challenge phrase. Wrong words, wrong phrase, fail.
- **Entropy and variance analysis.** Per-modality Shannon entropy and variance floors reject constant or low-information feature vectors. Zeros, noise, flat streams fail the math.
- **Voice synthesis fingerprinting.** Jitter and shimmer floors/ceilings, HNR bounds, voicing-ratio bounds, F0 delta variance—measured on every dimension where synthesized speech is statistically distinct from a human larynx.
- **Cross-modal temporal coupling.** Voice F0 and hand acceleration are causally coupled within a tight temporal window in real humans. A bot stitching audio onto procedural motion fails the cross-correlation peak.
- **Sybil registry scan.** Your fingerprint is checked against every other verified user's, regardless of wallet. Biological collisions across wallets are caught.
- **Calibration-attack noise.** Controlled noise on borderline outcomes near every threshold check, designed to defeat attackers probing for boundary-crafted inputs.

T1–T3: 16,000+ adversarial attempts, 0% pass rate. T4a (pre-recorded human voice + procedural motion): 100% pass counterfactual → 0% pass after four progressive defense waves. T4b through T8 queued for the continuous red team program.

**Re-verification adds temporal consistency.** Every subsequent capture produces a Poseidon commitment; a Groth16 ZK circuit proves the Hamming distance to your previous on-chain commitment is below a threshold (similar enough to be you) AND above a floor (different enough to be fresh, not a replay). A bot that perfectly cloned your one capture still fails: the next capture has to drift naturally—not be identical, not be wildly different. Trust Score starts at zero on first verification—the baseline is registered, not trusted—and accrues with each successful re-verification. Integrators gate on Trust Score, not on the binary "verified" flag.

Replay, synthesis, and stitching each fail at least one of these checks. Defense is layered, measurable, and continuously red-teamed (see [security](https://entros.io/security)).

## Economics

Users pay a small protocol fee (currently ~0.005 SOL, tunable as Solana economics evolve) per verification—deducted atomically inside the on-chain mint transaction, accrued to the protocol treasury, publicly auditable on Solana Explorer. Trivial cost for any human user. Real cost for bot farms at scale.

**Total user cost per verification:**

| Action | Protocol fee (non-refundable) | One-time account rent | Total upfront |
|---|---|---|---|
| First verification | 0.005 SOL | ~0.013 SOL | ~0.018 SOL |
| Each re-verification | 0.005 SOL | ~0.002 SOL (new VerificationResult) | ~0.007 SOL |

The one-time rent funds the user's on-chain Identity Anchor (Token-2022 mint with metadata extensions, Associated Token Account, IdentityState PDA, verification record). Solana account rent is held by the network and recoverable when the user closes the accounts (e.g. via `migrate_identity` for the IdentityState, or `close_verification_result` for verification records). Only the protocol fee is non-refundable.

Integrators read verified state from the on-chain Anchor PDA for free. No API keys, no billing relationship, no permission to read. The protocol monetizes the write side; the read side is composable Solana state.

The Entros utility token (SPL Token-2022 with Confidential Balances) underwrites validator staking, governance over protocol parameters, and aligned incentives across the multi-validator network.

---

## The stack

This repo (`entros.io`) is the website, the verification dApp, and the documentation. The full protocol is a multi-repo organization. Every component is open source unless noted.

### Repositories

| Repo | Purpose |
|---|---|
| [`entros.io`](https://github.com/entros-protocol/entros.io) | **This repo**—website, verification dApp, docs, paper |
| [`protocol-core`](https://github.com/entros-protocol/protocol-core) | Three Anchor programs: identity mint, ZK verifier, registry |
| [`circuits`](https://github.com/entros-protocol/circuits) | Groth16 Hamming-distance circuit (~2,010 constraints) |
| [`pulse-sdk`](https://github.com/entros-protocol/pulse-sdk) | Client SDK: capture → fingerprint → prove → submit. npm [`@entros/pulse-sdk`](https://www.npmjs.com/package/@entros/pulse-sdk) |
| [`entros-verify`](https://github.com/entros-protocol/entros-verify) | Drop-in popup component. npm [`@entros/verify`](https://www.npmjs.com/package/@entros/verify) |
| [`executor-node`](https://github.com/entros-protocol/executor-node) | Off-chain relayer: feature validation, SAS attestation, on-chain submit |
| `entros-validation` | Behavioral validator—runs as the relayer's validation backend (proprietary) |
| `entros-redteam` | Adversarial test harness—T1–T8 attack synthesis, telemetry, regression coverage (proprietary) |
| [`entros-mobile`](https://github.com/entros-protocol/entros-mobile) | Mobile app: capture, native ZK proving via mopro, on-chain submit via Mobile Wallet Adapter |
| [`entros-mopro`](https://github.com/entros-protocol/entros-mopro) | Native Groth16 prover bindings (UniFFI `.so` + Swift / Kotlin) consumed by `entros-mobile` |
| [`entros-governance-plugin`](https://github.com/entros-protocol/entros-governance-plugin) | Realms DAO voter-weight plugin |
| [`token-contracts`](https://github.com/entros-protocol/token-contracts) | Entros utility token (SPL Token-2022 with Confidential Balances) for validator staking and aligned incentives |

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

### Tier 1—drop-in popup

Five lines of JSX.

```tsx
import { EntrosVerify } from "@entros/verify";

<EntrosVerify
  integratorKey="my-app"
  onVerified={(result) => grantAccess(result.walletPubkey)}
/>
```

### Tier 2—programmatic SDK

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

### Tier 3—read-only on-chain

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
| **Realms plugin** | Optional behavioral gate for DAO voting—Trust Score + recency threshold. Drops in via the standard voter-weight addin interface. | [`entros-governance-plugin`](https://github.com/entros-protocol/entros-governance-plugin) |

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

Continuous adversarial testing across T1–T8 attack tiers. Public methodology, private parameter values. Responsible disclosure: contact@entros.io.

---

## License

MIT for every open repo in the org (per each repo's `LICENSE`). The behavioral validation service is proprietary; it runs as the production relayer's validation backend and is not published.
