# Entros Protocol — Security & Quality Audit Tracker

Last updated: 2026-05-20

**Recent activity (2026-05-20):** Server-side verification-freshness gate
added on `/attest`. The executor now reads the wallet's on-chain
`IdentityState.last_verification_timestamp` and rejects attestation
requests when the timestamp is older than the configured freshness
window (or implausibly far in the future — clock-skew guard). The
pulse-sdk already enforced the same gate client-side via the wallet-
confirmation handler; this lands the check at the executor boundary so
it holds regardless of the caller. The SAS attestation contract is
unchanged — same request format, same response format, same `verifiedAt`
semantics. No public-API or wire-protocol breaking changes.

**Recent activity (2026-05-03, late):** Cross-wallet Sybil registry
retention extended to 30 days. The registry is the real-time short-window
detection layer of the Sybil defense; long-term Sybil resistance is
provided by the permanent on-chain `IdentityState` account (every verified
wallet's record is persisted forever in Solana state), the per-verification
protocol fee, and the age-weighted Trust Score that integrators gate on.
The retention extension is operationally cheap (Postgres rows, low daily
verification volume) and meaningfully widens the rapid-Sybil detection
window without changing the architecture.

**Recent activity (2026-05-03):** Added a per-source request-rate cap on
verification endpoints, layering on top of the existing per-account limits
to bound throughput from a single network origin. Verify-flow UI updated
to route the new cap's response to the existing cooldown surface so users
who hit it see a clear retry message rather than a generic failure page.

**Recent activity (2026-05-02):** Cross-stack dependency cleanup pass.
Dependabot advisories closed across pulse-sdk, protocol-core, and circuits
via transitive overrides; build-tool and library upgrades brought all four
target packages (vite, uuid, brace-expansion, picomatch) to their patched
versions. Pulse SDK published as **1.5.3** with audio capture refinements
(OS-level voice isolation request added to `getUserMedia` constraints,
supported on Chrome/ChromeOS and Safari macOS Sonoma+/iOS 17+) alongside
the dependency cleanup. Internal `cargo audit` on the validator returned a
single advisory (rsa transitive via sqlx-mysql) which doesn't apply to
this build because the mysql feature is not enabled (sqlx is configured
with `default-features = false` plus only the postgres-related features);
documented and ignored with rationale in `.cargo/audit.toml`. No
public-API or wire-protocol breaking changes.

**Recent activity (2026-05-01):** Persistent SimHash Sybil registry deployed
to production. Cross-wallet fingerprint storage migrated from in-memory to a
Postgres backend abstracted behind a `RegistryBackend` async trait, with two
implementations (in-memory + Postgres) selected at startup based on
`DATABASE_URL`. Atomic check-and-register enforced by SERIALIZABLE isolation
with bounded retry on serialization-failure errors. Per-fingerprint TTL
eviction replaces the prior per-wallet last-seen bookkeeping, producing a
tighter eviction window aligned with the row-level storage model. Production
validator now gates startup on `DATABASE_URL` and refuses to boot in
production mode without it; the prior soft-config silently fell back to
in-memory storage that was wiped on every service restart. Wire format
byte-identical to the previous deployment — no SDK bump, no executor change,
no on-chain impact.

**Layered Sybil defense (clarification).** The SimHash registry is the
real-time cross-wallet biological-similarity detection layer. It catches
rapid same-biology-different-wallet attempts within the configured
retention window. Long-term Sybil resistance is structurally separate:
every verified wallet creates a permanent `IdentityState` account on
Solana that never expires, the per-verification protocol fee imposes
real bot-farm cost, and the Trust Score's age-weighted scoring means
fresh wallets visibly differ from long-tenured ones to integrators
gating downstream access. The registry retention is an operational
parameter (currently 30 days; env-tunable per deployment), not the sole
Sybil barrier.

**Recent activity (2026-04-30):** Mint-receipt binding promoted from log-only
to enforced on devnet. Every first-verify mint now requires a fresh
verification-service signature on the (wallet, commitment, timestamp) tuple.
Attestation requests at the off-chain endpoint now require an explicit wallet
ownership proof on every call, closing a path where a caller could issue
attestations against an arbitrary target wallet. Client SDK published as 1.4.2
with the matching changes; site updated to consume it. No public-API or
wire-protocol breaking changes.

**Recent activity (2026-04-29):** First-mint receipt binding shipped to
devnet in log-only mode. The on-chain identity program now inspects the
preceding instruction in any mint transaction to validate the
verification-service signature on a (wallet, commitment, timestamp)
receipt. Enforcement flip pending an SDK release + a soak window. No
public API or wire-protocol breaking changes.

**Recent activity (2026-04-28/29):** Cross-repo internal hardening pass shipped
across all six active program / service / SDK repositories (validator, executor,
circuits, governance plugin, client SDK, on-chain protocol). Improvements:
tighter HTTP-boundary input validation, constant-time API-key comparison aligned
across services, hardened error reporting paths, resource-cleanup hygiene in
client sensor capture, stricter type guards on local storage, defense-in-depth
cross-program account validation on the on-chain identity program, future-dated
attestation rejection, and a new layout-drift regression test for the on-chain
config account. On-chain programs redeployed in-place (program IDs unchanged,
all existing state preserved). No public-API breaking changes.

Running log of resolved bugs, hardening items, and known limitations across
the protocol's repositories.

**Continuous adversarial testing methodology and current aggregate results**
are published at [entros.io/security](https://entros.io/security).

**Vulnerability reports:** contact@entros.io (see Responsible Disclosure
below).

---

## Pulse SDK (`@entros/pulse-sdk`)

### Critical

- [x] **Audio extraction replaced** — MFCCs removed. New speaker feature extractor (F0, jitter, shimmer, HNR, formant ratios, LTAS) produces 44 content-independent features. Fixed 2026-03-23.
- [x] **Audio fallback vector length** — Consistent 44-element zero vector on fallback. Fixed 2026-03-23.
- [x] **Empty wasmUrl/zkeyUrl crashes snarkjs** — Added validation before proof generation. Fixed 2026-03-23.
- [x] **Proof serializer missing public signal count check** — Added validation. Fixed 2026-03-23.
- [x] **Relayer submission no timeout** — Added 30s AbortController timeout. Fixed 2026-03-23.
- [x] **Relayer submission trusts `success` field loosely** — Changed to strict `result.success === true`. Fixed 2026-03-23.
- [x] **`verify()` method doesn't await stop promises** — Stop promises now properly chained. Fixed 2026-03-23.
- [x] **Wallet submission returns success when anchor IDL fetch fails** — Added explicit error return when `anchorIdl` is null. Fixed 2026-03-23.
- [x] **Reconstructed previousTBH has dummy `commitmentBytes`** — Now uses `bigintToBytes32()` for proper reconstruction. Fixed 2026-03-23.
- [x] **localStorage stores raw fingerprint in plaintext** — Encrypted with AES-256-GCM via Web Crypto API. Non-extractable CryptoKey stored in IndexedDB. Plaintext fallback with warning when crypto APIs unavailable. Automatic migration of legacy plaintext data. Fixed 2026-03-25.

### High

- [x] **`extractFeatures` zero-fills for missing audio** — Now throws error since audio is mandatory. Fixed 2026-03-23.
- [x] **SimHash hyperplane cache dimension mismatch** — Added warning when feature vector dimension differs from expected 134. Fixed 2026-03-23.
- [x] **`ctx.sampleRate` read after `ctx.close()`** — Captured sampleRate early before async operations. Fixed 2026-03-23.
- [x] **Challenge randomness upgraded to `crypto.getRandomValues()`** — Earlier use of `Math.random()` in phrase and lissajous challenge generators replaced with cryptographic PRNG. Devnet-only exposure. Fixed 2026-03-23.

### Medium

- [x] **Re-verification sends 3 separate transactions** — Batched all 3 into a single atomic transaction with 250K CU budget using `.instruction()` + `wallet.sendTransaction`. One prompt, atomic revert on failure. Fixed 2026-04-10.
- [x] **`any` types for wallet and connection — DECIDED AGAINST 2026-04-27.** Reviewed: refactoring `wallet: any` and `connection: any` to local `WalletLike` / `ConnectionLike` interfaces would (a) force `as any` casts at every `AnchorProvider` constructor call site (Anchor's Wallet type is structurally specific), (b) break consumers that pass non-fully-conformant wallet objects (entros.io passes `wallet?.adapter` paths that don't perfectly match Anchor's Wallet shape), (c) trade real maintenance burden for marginal type-safety gain that the existing `eslint-disable @typescript-eslint/no-explicit-any` already acknowledges and documents. Real fix path is v1.5/v2.0 when pulse-sdk migrates to `@solana/kit` (web3.js v2) — that migration redefines the wallet/connection surface anyway, making the local-interface refactor a wasted intermediate step. Audit accepts the eslint-disable as adequate documentation. Watch item: re-evaluate when planning the @solana/kit migration.
- [x] **`verifyProofLocally` uses Node.js `fs` in browser bundle** — Changed to accept VK object directly, no fs import. Fixed 2026-03-23.
- [x] **`Buffer.from()` in browser-targeted code** — Replaced with `TextEncoder.encode()` and `Uint8Array`. Fixed 2026-03-23.
- [x] **`@solana/spl-token` missing from peerDependencies** — Added as optional peer dependency. Fixed 2026-03-23.
- [x] **`Math.min(...values)` stack overflow for large arrays** — Replaced spread with loop in entropy(). Fixed 2026-03-23.
- [x] **`skipAudio()` API contradicts mandatory audio requirement** — Removed skipAudio(). Audio failure now throws. Fixed 2026-03-23.

### Low

- [x] **No tests for extraction, submission, session, or sensor modules** — Added extraction tests (speaker, motion, touch, mouse dynamics, fusion). Full test suite on pulse-sdk passing. Fixed 2026-03-25.
- [x] **ScriptProcessorNode deprecated** — Documented in audio.ts with migration note for v1.0. All current browsers support it. Fixed 2026-03-25.
- [x] **In-memory localStorage fallback lost on page reload** — Documented in anchor.ts. Private browsing users must re-enroll each session. Fixed 2026-03-25.

### SDK Error Message Quality (added 2026-04-16)

- [x] **SDK error messages lacked actionable guidance for integrators** — 24 error messages rewritten to include the action the integrator should take next (e.g. "Call stopAudio() before starting a new capture"). Session state-machine errors, audio capture failures, IDL fetch errors, relayer errors, and agent attestation errors all now name the expected next call. Diagnostic context preserved where useful. Shipped in 0.7.12. Fixed 2026-04-16.

### Tier 2 Hardening (added 2026-04-16)

- [x] **Additional server-side verification signal live** — pulse-sdk 0.7.12+ surfaces extra sensor data alongside the 134-feature vector. Validation service computes a per-verification metric, empirically calibrated and enforced at the validation gate. Backward-compat with older SDK versions verified. Fail-closed coverage (non-finite inputs, short captures) in place. Enabled 2026-04-20.

### Baseline Reset Flow (added 2026-04-21)

- [x] **Self-service recovery for users with a lost local baseline** — When a wallet has an on-chain Entros Anchor but the device's encrypted baseline is unrecoverable, re-verification previously had no recovery path short of using a different wallet (losing trust score history). Resolution: new on-chain recovery instruction with a 7-day cooldown, wallet-owner-signed, preserves the Anchor token and anchor creation date while rotating the commitment to a fresh fingerprint and resetting verification counters. Humanness is re-asserted via the same Tier 1 validation pipeline used for normal verification. The `/verify` flow detects the missing-baseline state, surfaces a consequence-explicit confirmation dialog, and runs the reset on confirm. Shipped in pulse-sdk 0.9.0 + entros.io 2026-04-21.

---

## Protocol Core (`protocol-core`)

### Critical — VERIFICATION PIPELINE (requires coordinated cross-repo changes)

These items directly affect the on-chain verification flow. Fixing any one of
them requires rebuilding and redeploying the Anchor programs to devnet,
updating the executor node's instruction builders and PDA derivation if
account contexts change, potentially updating the SDK's wallet submission
path, and regenerating the test fixture. All changes must be tested
end-to-end (browser → SDK → executor → Solana devnet) after deployment. Do
not fix these in isolation.

- [x] **`update_anchor` did not enforce cross-program binding to `verify_proof`** — The client SDK bundled `create_challenge + verify_proof + update_anchor` atomically, but the programs had no internal cross-reference. A direct Solana client could call `update_anchor` alone with any commitment and any nonce, incrementing Trust Score for only the protocol fee. Patched by extending `VerificationResult` with `commitment_new`, `commitment_prev`, `threshold`, `min_distance` (bound-checked in `verify_proof` with high-byte-zero field-element safety). `update_anchor` now requires a matching `VerificationResult` PDA (verifier = authority, freshness, commitment_new matches submitted, commitment_prev matches stored) plus defense-in-depth discriminator + owner checks. Single-use enforced by commitment rotation. pulse-sdk 0.8.0 threads the new account + nonce through the wallet submission path. Fixed 2026-04-20.
- [x] **`update_anchor` lacked ownership constraint** — Added `constraint = identity_state.owner == authority.key() @ EntrosAnchorError::Unauthorized` to UpdateAnchor context. Fixed 2026-03-23.
- [x] **`compute_trust_score` writes nothing on-chain** — Moved trust score computation into `update_anchor` (entros-anchor). Trust score auto-computed from verification history and protocol config on every update. `update_anchor` reads ProtocolConfig via cross-program PDA. Removed `new_trust_score` parameter. `compute_trust_score` in entros-registry remains as a read-only preview instruction. Fixed 2026-03-23.
- [x] **Failed proofs don't revert transaction** — Replaced `.is_ok()` with `?` in verify_proof. Invalid proofs now revert the entire transaction — challenge nonce preserved, no VerificationResult PDA created, no SOL wasted. Executor simplified: tx confirmation implies proof validity. Fixed 2026-03-23.
- [x] **Verification key conversion needs manual verification** — Manual byte-by-byte audit confirmed: all G1 points, G2 points with reversed coordinate ordering, and nr_pubinputs=4 match exactly between verification_key.json and verifying_key.rs. Conversion script is correct. Verified 2026-03-22.

### High

- [x] **Proof hash audit-trail collision resistance strengthened** — XOR fold accumulator replaced with rotate-and-XOR hash. `proof_hash` is used for on-chain audit trail (not proof validation) — collision resistance ensures distinct verifications produce distinct audit entries. Fixed 2026-03-23.
- [x] **Test-only mock verifier module exposed in production builds** — `mock_verifier.rs` (used only by unit tests) was included in release binaries because it lacked a `#[cfg(test)]` gate. Added the gate; production verification path was unaffected throughout. Fixed 2026-03-23.
- [x] **`f64::sqrt()` in trust score is non-deterministic on-chain** — Replaced with deterministic integer sqrt (Newton's method). Fixed 2026-03-23.
- [x] **`Vec::new()` heap allocation in trust score** — Replaced with fixed `[i64; 9]` array. Fixed 2026-03-23.
- [x] **Vault PDA has no unstake instruction** — Added `unstake_validator` instruction. Transfers staked SOL from vault back to validator via System Program CPI with PDA signing. Closes ValidatorState account (returns rent, allows re-registration). Authority constraint prevents unauthorized unstaking. Fixed 2026-03-25.
- [x] **Trust score rewarded burst over consistency** — Same-day verifications inflated recency score linearly. Fixed by deduplicating `recent_timestamps` by calendar day before computing recency and regularity scores. Fixed 2026-04-10.
- [x] **`create_challenge` accepts zero nonces** — Added `require!(nonce != [0u8; 32])` check matching the commitment validation pattern in entros-anchor. Fixed 2026-04-10.
- [x] **No integration tests for trust score or nonce validation — Closed 2026-04-21.** Trust score deduplication covered in Pluto's PR #24 (same-day case, asserts `trustScore == trustScorePrev` after a 3rd same-day verification) and PR #28 (cross-day case via LiteSVM clock warp, trust score 100 → 198 → 311 across unique days). Nonce zero-check covered in PR #25 (asserts error 6006 `InvalidNonce` on `create_challenge` with `new Array(32).fill(0)`).
- [x] **3 entros-registry tests failing due to test ordering** — `initializes protocol config` wrapped in try/catch for idempotent initialization. Trust score tests updated to match current instruction signature. Fixed 2026-03-25.

### Medium

- [x] **Recency score integer truncation** — Reordered arithmetic to preserve precision. Fixed 2026-04-10.
- [x] **`challenge_expiry` enforced server-side** — ChallengeNonceRegistry on executor enforces configurable TTL (default 60s, `CHALLENGE_TTL_SECS` env var). On-chain 300s `DEFAULT_CHALLENGE_EXPIRY` retained as outer safety bound. Fixed 2026-04-15.
- [x] **`recent_timestamps` capped at 10 entries** — Expanded to 52 timestamp slots with transparent migration for existing accounts. Dashboard updated to read all 52 slots. Fixed 2026-04-12.
- [x] **No `close` instructions for Challenge/VerificationResult accounts** — Added close_challenge and close_verification_result with ownership validation. Fixed 2026-03-23.

---

## Circuits (`circuits`)

### High

- [ ] **Single-contributor trusted setup ceremony — required before mainnet, deferred until post-demo + integrator outreach** — The Hamming-distance circuit currently has a Phase 2 (per-circuit) trusted setup with a single contributor. Phase 1 (Powers of Tau) uses public ceremonies (Hermez/Aztec/Perpetual PoT) and is not the concern. Phase 2 risk: if the single contributor's toxic waste leaked or was retained, a forger could fabricate liveness proofs and produce false anchors. Standard mitigation: a fresh multi-party Phase 2 with 3+ independent contributors from different orgs (Anza engineer, Light Protocol engineer, an academic — anyone non-conflicted). Public ceremony writeup in this AUDIT.md and a one-line summary on `entros.io/security` documenting participants, contribution hashes, attestations, and toxic-waste destruction proofs. Acceptable for devnet pilot. **Deferred** until post-demo product delivery + protocol contributors + integrator outreach establishing relationships with credible non-conflicted Phase 2 contributors. Same library (`groth16-solana@0.2.0`) is used by SP1, RISC Zero, Bonsol, and Light Protocol's ZK Compression — so the trusted-setup risk profile is the standard ZK-on-Solana profile, not Entros-specific. Full ZK-stack analysis: `docs/research/2026-04-26-light-protocol-vs-groth16.md`.
- [x] **No verification that ptau is large enough** — setup.sh now verifies constraint count fits within the configured ptau level and exits with error if exceeded. Fixed 2026-03-25.

### Medium

- [x] **Test randomness non-reproducible** — Replaced Math.random/crypto.getRandomValues with seeded Mulberry32 PRNG (SHA-256 of label). All test vectors are deterministic and reproducible across runs. Fixed 2026-03-25.
- [x] **`verifyProof` helper is dead code** — Removed from test_vectors.ts. Tests use snarkjs.groth16.verify directly. Fixed 2026-03-25.

### Low

- [x] **No negative-distance or boundary test cases** — Added tests for min_distance=0, impossible constraint range, and tight boundary. Fixed 2026-03-25.

---

## Executor Node (`executor-node`)

### Critical — VERIFICATION PIPELINE

- [x] **`is_first_verification` is client-controlled** — Server-side CommitmentRegistry tracks seen commitments per API key. If a commitment is already known, executor overrides `is_first_verification` to false regardless of client claim. First verification now returns `verified: null, registered: true`. Fixed 2026-03-23.

### High

- [x] **API key comparison not constant-time** — Replaced with `subtle::ConstantTimeEq`. Fixed 2026-03-23.
- [x] **`CorsLayer::permissive()` allows all origins** — CORS now configurable via `CORS_ORIGINS` env var. Permissive fallback when not configured (development). Fixed 2026-03-25.
- [x] **Rate limiter never evicts old entries** — Added timestamp-based eviction after 5 minutes of inactivity. Fixed 2026-03-23.
- [x] **`remaining_quota` in response is stale after refund** — Added `get_remaining()` method, response uses fresh value. Fixed 2026-03-23.
- [x] **No per-source request-rate cap on verification endpoints** — Added a per-source request-rate cap layered on top of the existing per-account limits. Checked before authentication and quota deduction so a single source cannot sustain unbounded throughput by rotating identities. Returns the standard rate-limit response with a wait hint; the existing verify-flow UI already routes it to the cooldown surface. Fixed 2026-05-03.

### Medium

- [x] **`is_valid` byte offset 80 is a magic number** — Extracted to named constant with length validation. Fixed 2026-03-23.
- [x] **Event monitor log parsing is fragile** — Added verifier program ID filter before matching event names. Fixed 2026-03-23.
- [x] **No transaction retry logic** — Added exponential backoff retry (3 attempts) with fresh blockhash per attempt. Fixed 2026-03-23.

### Challenge Security (added 2026-04-15)

- [x] **Server-generated challenges prevent pre-computation** — New `GET /challenge` endpoint issues server-side nonces stored in `ChallengeNonceRegistry` (DashMap, atomic validate-and-consume). SDK fetches nonce before building wallet transaction, falls back to client-generated nonce if executor unreachable. Attestation validates nonce was server-issued and within TTL. Unit tested. Fixed 2026-04-15.

### SAS Integration (added 2026-04-06)

- [x] **`/attest` endpoint verifies wallet ownership** — SDK signs a timestamped attestation message with the connected wallet. Executor verifies ed25519 signature, validates message format and 60-second timestamp window before issuing attestation. Wallets without `signMessage` support fall back to current behavior. Fixed 2026-04-15.
- [x] **SAS credential authority separable from relayer** — Executor supports a dedicated `SAS_AUTHORITY_KEYPAIR` env var, with fallback to the relayer keypair for devnet operation. Production deployment uses a separate authority keypair stored in an HSM or secrets manager; rotation is an operational deployment step rather than a code change. Fixed 2026-04-15.
- [x] **Agent Anchor hardcodes devnet program ID** — Both `attestAgentOperator` and `getAgentHumanOperator` now accept optional `cluster` parameter and select program ID accordingly. Defaults to devnet for backward compatibility. Fixed 2026-04-15.
- [x] **No rate limiting specific to `/attest`** — Attestation endpoint now has its own rate limiter at 10 requests/min per API key, separate from the general 60/min limit. Fixed 2026-04-15.

### Status Endpoint

- [x] **`/status` endpoint exposes relayer SOL balance publicly** — Unauthenticated requests now return only `{"status": "ok"}`. Full metrics require valid API key. Fixed 2026-04-15.
- [x] **`/status` makes an RPC call on every request** — Balance cached with 30-second TTL. Fixed 2026-04-09.
- [x] **`.unwrap()` in StatusMetrics::new()** — Replaced with `.unwrap_or_default()`. Audited 2026-04-21.

### Body Limit (added 2026-04-16)

- [x] **Request body limit raised from 4KB to 256KB** — Accommodates extended sensor time-series payloads. Rate limiting (60/min per API key, 10/min for /attest) bounds DoS exposure regardless of body size. Fixed 2026-04-16.

---

## entros-validation (private service)

Closed-source server-side validation microservice on Railway. Receives the
308-dimensional feature vector plus cross-modal sensor data from the
executor and applies Tier 1 statistical checks and Tier 2 coupling
signals. Attack code, specific checks, thresholds, and per-check logic are
kept private per responsible-disclosure convention.

### High

- [x] **Statistical gap surfaced during T3b campaign** — Feature-space optimization against the server-side validation pipeline found a narrow exploitable seam across a small subset of probes. Hardened via an additional consistency constraint in the validation service; subsequent campaign attempts rejected. Attack mechanism and specific constraint kept private. Fixed 2026-04-18.
- [x] **Cross-modality correlation check removed** — Discovered 2026-04-20 during T4a Wave 1 log analysis: the check correlated feature-vector statistical summaries at matching index positions across modalities, which is a category error (correlating mean F0 in Hz against mean jerk in m/s³ has no semantic grounding). Observed range on unrelated inputs 0.004–0.881, threshold 0.01 was below noise floor — zero defense value. Removed in entros-validation 2026-04-21. Sound cross-modal defense remains via the temporal coupling check (Pearson on F0 contour × accel magnitude time-series, same-unit same-time). Semantic replacement checks deferred pending human-baseline calibration data.
- [x] **Phrase content binding shipped** — Tier 1 validation now verifies that the audio content matches the server-issued challenge phrase, not just voice texture. Closes the pre-recorded-arbitrary-content attack class (T4a Wave 1 baseline). Combinatorial defense ≈ 4.7 × 10¹⁵ unique phrases per session via random sampling from a curated neutral-vocabulary dictionary, reducing precomputation feasibility to negligible. Calibrated to consistently distinguish correct from incorrect phrase content while accommodating natural transcription variance. Fixed 2026-04-25.

---

## Website (`entros.io`)

### High

- [x] **Wallet flow dispatches PROOF_COMPLETE on blind 2s timer** — Now dispatches after actual proof generation. Fixed 2026-03-23.
- [x] **Walletless flow has no timeout on `session.complete()`** — Added 60s timeout via Promise.race. Fixed 2026-03-23.
- [x] **`preparing` state is vestigial** — Removed dead state and conditional. Fixed 2026-03-23.

### Medium

- [x] **No error boundary around PulseChallenge** — Added VerifyErrorBoundary with reset handler. Fixed 2026-03-23.
- [x] **`touchRef` forwarding uses `as any` cast** — Replaced with MutableRefObject type and dependency array. Fixed 2026-03-23.
- [x] **Audio level callback causes ~60 re-renders/sec** — Throttled to every 6th frame (~10/sec). Fixed 2026-03-23.
- [x] **`VERIFICATION_FAILED` has no state guard** — Added guard: won't override verified state. Fixed 2026-03-23.
- [x] **Desktop verification flow broken by double-click race** — Added startingRef re-entry guard and requesting state to handleStart(). Button shows "Requesting access..." during permission dialog. Fixed 2026-03-26.
- [x] **Wallet-connected flow has no timeout on session.complete()** — Added 60s Promise.race timeout matching walletless flow. Fixed 2026-03-26.

---

## Dependency Versions (audited 2026-03-25)

### Actionable Now

- [x] **Website `@coral-xyz/anchor` 0.30.1 behind org standard 0.32.1** — Updated to 0.32.1. Fixed.
- [x] **Website `lucide-react` 0.577 behind v1.x** — Updated to 1.6.0. Fixed.
- [x] **TypeScript 5.x behind 6.0 across all JS/TS repos** — Updated to 6.0 across pulse-sdk, circuits, protocol-core, token-contracts, website. All compile clean. Fixed.
- [ ] **Executor `solana-client`/`solana-sdk` 2.2 behind latest** — As of 2026-04-27: latest stable is **3.1.14**, latest beta is **4.0.0-beta.7**. We're intentionally on 2.2 because (a) 4.0 still beta — using beta in production is worse than stable; (b) jumping 2.2 → 3.1.14 is a non-trivial migration with breaking changes at the SDK level; (c) RPC protocol is backward compatible across the gap, no client-side urgency. Upgrade trigger: 4.0 stable release, OR a 2.2-specific bug surfaces. Re-checked 2026-04-27.
- [x] **`mocha` 10.x behind 11.x in protocol-core, token-contracts, circuits** — Updated to 11.x across all three repos. Fixed.

### Blocked (Anchor 0.32.1 dependency tree)

- [x] **`spl-token-2022` crate 8.x behind v10.0** — Upgraded to v9 (max compatible with Anchor 0.32.1). Fixed.

### Watch (not actionable yet)

- [ ] **Anchor 1.0.1 stable released — migration deferred** — As of 2026-04-27: Anchor **1.0.1 stable** is on crates.io. All five on-chain programs (entros-anchor, entros-verifier, entros-registry, entros-token, entros-voter-weight) are aligned on **0.32.1**. Migration from 0.32.x → 1.0 is significant (account structure changes, IDL format, error types, breaking API changes). Deferred until post-hackathon: no in-flight Anchor program work in the next 2 weeks would benefit from the upgrade, and migration risk is high without integration test coverage on the new version. Trigger to action: next major work on the on-chain programs where 1.0 features outweigh the migration cost.

- [x] **entros-governance-plugin Anchor version aligned to org standard 0.32.1** — Identified 2026-04-27, resolved same day. The voter weight plugin previously pinned one minor version behind the rest of the on-chain programs. Aligned to org standard via in-place devnet upgrade: program ID `99nwXz...` unchanged, all live state preserved, 38/38 tests pass. Standalone runtime was not affected during the drift period (raw-byte account reading, no Anchor CPI), and the plugin had no production integrators using its IDL.

- [ ] **`@solana/kit` (web3.js v2) 6.8.0 latest** — Stays as a "monitor for ecosystem adoption" item. As of 2026-04-27: 6.8.0 published, but `@solana/web3.js` v1.x is still the dominant ecosystem dep (wallet adapter, Anchor 0.31.x, most integrators). Migrating pulse-sdk would force every consumer to also migrate or stay pinned to an older version. Defer until `@solana/wallet-adapter-base` and Anchor publish kit-compatible majors. Re-checked 2026-04-27.

### Current (no action needed)

- `groth16-solana` 0.2.0, `snarkjs` 0.7.6, `circomlib` 2.0.5, `circomlibjs` 0.1.7 — all latest
- `meyda` 5.6.3, `pitchfinder` 2.3.4 — latest
- `axum` 0.8, `tower-http` 0.6, `tokio` 1.x, `dashmap` 6 — current major versions
- `react` 19.2.4, `next` 16.2.0, `tailwindcss` v4 — latest
- Rust 1.92, Solana CLI 3.0.13, Node 24, Circom 2.2.3 — all current

---

## Scaling roadmap

Items tracking the protocol's progression from devnet pilot to ecosystem-scale
production. Each has been advanced significantly in recent work; the third
remains in active design as a future architectural improvement.

- [x] **Persistent cross-wallet registry** — Sybil fingerprint registry runs on Postgres in production with row-level TTL eviction, atomic check-and-register via SERIALIZABLE isolation, and bounded retry on serialization-failure errors. Survives service restarts and seed rotations. Production validator gates startup on `DATABASE_URL` and refuses to boot without it. Shipped 2026-05-01.
- [x] **On-chain identity migration** — `migrate_identity` instruction in `entros_anchor` lets a user move an established identity (Trust Score, verification history, recent timestamps) to a new wallet via a two-signer authorization pattern. Deployed on devnet alongside the rest of the identity program; the policy layer around it (cooldowns, score-laundering protections) is covered in the [public roadmap](https://entros.io/docs/roadmap/medium-term#reputation-portability).
- [~] **Population-scale Sybil scoring** — The current Hamming-distance gate works correctly at the devnet pilot scale. Scaling to ecosystem populations introduces the 1:N false-match-rate challenge that every behavioral biometric system faces; the planned approach moves from a binary gate to probabilistic scoring with scoped comparison and ensemble signals across behavioral, attestation, and cross-protocol data. Roadmap detail in the [medium-term scaling considerations](https://entros.io/docs/roadmap/medium-term#scaling-considerations).

The protocol fee (`verification_fee` field on `ProtocolConfig`) is updateable by the protocol authority via `update_protocol_config` and can be recalibrated as SOL economics evolve, without program redeploy or governance changes.

---

## Security Program

Continuous adversarial testing against the verification pipeline is conducted
via an internal red team harness implementing multiple tiers of attack
sophistication, from baseline procedural synthesis through advanced
generative techniques. Attack code, per-attempt telemetry, and specific
parameter values are kept private per responsible-disclosure convention.

Public methodology, tier taxonomy, and current aggregate results are
published at [entros.io/security](https://entros.io/security).

A public baseline test suite at `pulse-sdk/test/pentest.test.ts` exercises
trivial attacker capability (procedural sine-wave synthesis) and is retained
for reproducibility. It is not representative of the full threat model the
private harness addresses.

---

## Responsible Disclosure

Report vulnerabilities to contact@entros.io. We aim to acknowledge within
48 hours and provide initial triage within 5 business days. Good-faith
security research is welcome within the scope of the security program. We do
not pursue legal action against researchers acting in good faith.

---

## Methodology

Findings are categorized as:

- **Critical**: will cause incorrect behavior, security failures, or data loss
- **High**: correctness issues, silent failures, fragile patterns
- **Medium**: type safety, code quality, maintainability
- **Low**: minor issues, test gaps, documentation
- **Scaling roadmap**: items tracking the protocol's progression from devnet pilot to ecosystem-scale production deployment

Items are checked off `[x]` when fixed and verified. Date of fix is noted in commit history.
