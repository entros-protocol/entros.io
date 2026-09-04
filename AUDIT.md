# Entros Protocol - Public Security and Quality Record

Last reviewed: 2026-09-04

This file publishes the current security posture and selected resolved work.
It does not mirror the private audit tracker.

Private findings stay private until a fix has shipped and disclosure is safe.
The public record omits attack procedures, detector thresholds, scoring weights, and unresolved weaknesses.

## Current status

- Entros is a research-grade proof-of-personhood protocol running on Solana devnet.
- Three core programs and the Realms voter-weight prototype run on devnet.
- `@entros/pulse-sdk` `4.9.2` is the current browser SDK release.
- `@entros/verify` `0.1.1` is the current React integration release.
- The core programs use Anchor `1.1.2`.
- The Realms voter-weight program uses Anchor `0.32.1`.
- The validator reports projection current `1` and minimum supported `0`.
- Mainnet remains gated on hardening, ceremony, external audit, and operational readiness.

The owner completed one hosted verification after the latest validator release.
The service path and devnet transaction succeeded.

That result proves one accepted flow.
It does not establish capacity, physical-device parity, population accuracy, or mainnet readiness.

## Evidence boundary

The browser path evaluates evidence supplied by the browser client.
It has no trusted sensor provenance.

The current vector contains 308 derived features across voice, motion, and touch.
Raw motion and full-resolution touch samples stay on the device.

Phrase audio reaches the validator for transient transcription and acoustic checks.
The validator does not persist phrase audio.

The browser wallet flow can store an encrypted continuity baseline on chain.
The chain stores commitments, proofs, public inputs, and encrypted baseline material when available.

The proof establishes the circuit statement for its public inputs.
It does not prove capture provenance or human presence by itself.

Population uniqueness remains unproven.
Native device and application integrity evidence remains roadmap work.

## Selected resolved work

### Protocol programs

- The identity update path binds each state change to an accepted verifier result.
- Validator receipts bind their purpose, projection version, wallet, commitment, and issue time.
- Program accounts validate ownership, derivation, and expected relationships.
- Identity recovery preserves the Anchor while resetting continuity state under explicit authorization.
- Projection versions are stored with identity state and checked during updates.

### Browser SDK and website

- The SDK validates feature shape, numeric bounds, and projection compatibility before submission.
- Sensor cleanup releases capture resources after completion, cancellation, and failure.
- Wallet-scoped storage prevents one wallet from overwriting another wallet's local baseline.
- Supported wallet flows can recover an encrypted baseline through a wallet-derived key.
- Verification waits follow active upload progress within the challenge lifetime.
- Public errors omit private detector details.

### Executor and validation services

- Signed requests bind wallet authorization to the active challenge and request body.
- Challenge records enforce expiry and single-use behavior.
- Service startup checks required production configuration and database state.
- The validator stores operational similarity records in PostgreSQL.
- Logs redact sensitive feature values and authorization material.
- Attestation signing uses a dedicated authority in the current hosted environment.

### Adversarial testing

Entros tests bounded attack classes with a private harness.
The public security page reports aggregate results after fixes ship.

Published results apply only to their recorded models, fixtures, projection, and configuration.
They do not support a general claim that every bot or synthetic input fails.

## Open release gates

- Complete a multi-party circuit ceremony before mainnet.
- Complete an external security audit before mainnet.
- Derive population claims from a representative labelled cohort.
- Validate the independent mobile client on supported physical devices.
- Validate future capture-provenance claims with evidence specific to sensor origin.
- Define a versioned integrator policy contract for score, freshness, assurance, uniqueness, and attestation state.
- Build and test the decentralized validator lifecycle before claiming a live validator network.

The `$ENTROS` token is a standard SPL mint.
It is not connected to current verification programs.

## Public evidence

- [Security program](https://entros.io/security)
- [Research paper](https://entros.io/paper)
- [Protocol source](https://github.com/entros-protocol)
- [Pulse SDK on npm](https://www.npmjs.com/package/@entros/pulse-sdk)
- [Verify package on npm](https://www.npmjs.com/package/@entros/verify)
- [Entros Anchor on devnet](https://explorer.solana.com/address/GZYwTp2ozeuRA5Gof9vs4ya961aANcJBdUzB7LN6q4b2?cluster=devnet)

## Responsible disclosure

Follow the repository's [security policy](https://github.com/entros-protocol/entros.io/blob/main/SECURITY.md)
for private reporting channels, scope, and response expectations.

## Method

Repository gates include formatting, lint, type checks, tests, and release builds.
Relevant releases also use hosted CI, devnet transaction checks, and bounded owner acceptance.

The private audit tracks unresolved findings and exact reproduction evidence.
This public file records posture and safe summaries after remediation.
