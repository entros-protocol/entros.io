export interface PrimarySource {
  label: string;
  href: string;
  external?: boolean;
}

export interface ModalityRow {
  id: string;
  name: string;
  examples: string;
  freshResult: string;
  continuity: string;
  uniquenessStatus: string;
  assuranceTier: string;
  limit: string;
  highlight?: boolean;
}

export interface PolicyBoundaryItem {
  id: string;
  name: string;
  question: string;
  detail: string;
}

export interface VendorScopeRow {
  id: string;
  name: string;
  modality: string;
  checked: string;
  scope: string;
  boundary: string;
  sources: PrimarySource[];
  highlight?: boolean;
}

export interface ComparisonExplainer {
  id: string;
  title: string;
  body: string[];
  link?: {
    label: string;
    href: string;
  };
}

export const COMPARISON_UPDATED = "2026-11-19";

export const MODALITY_ROWS: ModalityRow[] = [
  {
    id: "modality-anatomical",
    name: "Anatomical",
    examples: "Iris, face, palm (World, Alien, Civic, Humanity Protocol)",
    freshResult:
      "Hardware scan, phone selfie, or device-camera liveness proof issued under provider rules.",
    continuity:
      "Supported through returning session proofs, wallet-to-session links, or repeat liveness checks depending on provider.",
    uniquenessStatus:
      "Targets one-person uniqueness against a biometric enrollment set. Enforcement depends on provider matching infrastructure.",
    assuranceTier:
      "Dedicated capture hardware, TEE pipelines, or mobile liveness SDKs depending on system.",
    limit:
      "Leaked anatomical templates cannot be rotated. Hardware enrollment depends on regional availability and operator-run matching.",
  },
  {
    id: "modality-credential",
    name: "Credential",
    examples: "Passkeys, WebAuthn, social accounts, on-chain history",
    freshResult:
      "Cryptographic assertion or issuer attestation showing control of a key or existing account.",
    continuity:
      "Strong key or account persistence across sessions while the holder keeps the credential.",
    uniquenessStatus:
      "Unmeasured for human uniqueness. One person can create or buy multiple accounts and keys.",
    assuranceTier:
      "Platform key or issuer signature. Confirms key control without physical sensor origin.",
    limit:
      "Credentials show key possession or account history. They do not verify that a human operates the key or holds one account.",
  },
  {
    id: "modality-kyc",
    name: "KYC",
    examples:
      "Government ID and legal-name checks (Civic document passes, regulated vendors)",
    freshResult:
      "Issuer attestation that a government document and liveness check passed at verification time.",
    continuity:
      "Tied to a legal identity record and issuer renewal or revocation policies.",
    uniquenessStatus:
      "Bounded by document issuance within supported jurisdictions. Depends on issuer deduplication.",
    assuranceTier:
      "Document-backed issuer review governed by the vendor's storage and audit controls.",
    limit:
      "Requires legal identity disclosure, excludes people without supported documents, and relies on vendor PII retention.",
  },
  {
    id: "modality-behavioral",
    name: "Behavioral",
    examples: "Voice, touch, motion, and interaction gestures (Entros, Proof of Human)",
    freshResult:
      "Paired browser rounds check spoken words, traced paths, and derived features against current policy before anchoring.",
    continuity:
      "Entros tracks returning verifications through a wallet's Trust Score, verification count, and last verification timestamp.",
    uniquenessStatus:
      "Unmeasured in Entros. Population uniqueness has no measured EER or ROC study result.",
    assuranceTier:
      "Entros issues browser_unattested policy evidence with no trusted sensor provenance.",
    limit:
      "Entros runs on Solana devnet only (trusted-setup ceremony and external audit open), carries browser_unattested evidence without trusted sensor provenance, and has unmeasured population uniqueness.",
    highlight: true,
  },
];

export const POLICY_BOUNDARIES: PolicyBoundaryItem[] = [
  {
    id: "boundary-authentication",
    name: "Authentication",
    question: "Who controls this wallet now?",
    detail:
      "Verify a fresh wallet-signed challenge scoped to your action, audience, nonce, and expiry. On-chain attestations do not authenticate a request.",
  },
  {
    id: "boundary-operator-approval",
    name: "Operator approval",
    question: "Did the wallet owner approve this specific action?",
    detail:
      "Require an owner signature or single-use Agent Operator Permit for delegated execution. Approval grants authority for one action and does not certify live presence when it runs.",
  },
  {
    id: "boundary-payment",
    name: "Payment",
    question: "Who paid for verification or access?",
    detail:
      "Entros charges a SOL-denominated protocol fee at verification time and lets apps read state for free. Detection decides whether a capture passes, and the fee bounds attempt volume.",
  },
  {
    id: "boundary-trusted-capture",
    name: "Trusted capture",
    question: "Did hardware attest the sensors?",
    detail:
      "Browser capture operates under browser_unattested assurance without hardware sensor attestation. Native mobile attestation remains roadmap work.",
  },
  {
    id: "boundary-population-uniqueness",
    name: "Population uniqueness",
    question: "Does one record map to one person?",
    detail:
      "Keep uniqueness separate from continuity and freshness. Entros reports uniquenessStatus as unmeasured and publishes no EER or population Sybil guarantee.",
  },
];

export const VENDOR_SCOPE_ROWS: VendorScopeRow[] = [
  {
    id: "vendor-entros",
    name: "Entros Protocol",
    modality: "Behavioral (voice, touch, motion)",
    checked: "2026-11-19",
    scope:
      "Solana devnet Anchor (Token-2022 NonTransferable), IdentityState PDA (Trust Score, count, last verification time), SAS attestation, Integrator Policy v1, owner-signed single-use Agent Operator Permits on devnet, and Realms entros-voter-weight plugin on devnet. Apps read on-chain state for free through verifyEntrosAttestation, and users pay a SOL-denominated protocol fee at verification time.",
    boundary:
      "Solana devnet only (no mainnet programs, trusted-setup ceremony and external audit open). Browser evidence carries browser_unattested assurance without trusted sensor provenance. Population uniqueness is unmeasured with no published EER.",
    sources: [
      { label: "Policy v1 docs", href: "/docs/integrate/verification-flow" },
      { label: "Privacy notice", href: "/privacy" },
      { label: "Security program", href: "/security" },
    ],
    highlight: true,
  },
  {
    id: "vendor-world",
    name: "World",
    modality: "Anatomical (iris and device-camera)",
    checked: "2026-11-01 / 2026-11-13",
    scope:
      "World ID 4.0 documents returning-user session proofs with session_id continuity and per-proof session_nullifier. Proof of Presence documents device-camera liveness and facial similarity with a 90-day inactivity window, sybil_score risk signal, and no Orb or passport prerequisite. World ID for Zoom documents Orb-backed World ID with live-selfie matching and a configurable verification window (24h default, or 7d, 15d, and 30d options). Governance drafts (not live pricing or shipped behavior): WIP-107 ($0.01 per verified user per month) and WIP-202 (agent delegation).",
    boundary:
      "Vendor documentation scope with no Entros accuracy comparison. World documents sybil_score as a risk signal, not a uniqueness verdict. WIP-107 and WIP-202 remain governance drafts. This table excludes unshipped repository pull requests.",
    sources: [
      {
        label: "World ID 4.0 migration",
        href: "https://docs.world.org/world-id/4-0-migration",
        external: true,
      },
      {
        label: "Proof of Presence",
        href: "https://docs.world.org/world-id/credentials/11",
        external: true,
      },
      {
        label: "World ID for Zoom",
        href: "https://world-id.support.world.org/hc/en-us/articles/51682774473107-How-do-I-use-World-ID-for-Zoom",
        external: true,
      },
      {
        label: "WIP-202 draft",
        href: "https://trustedagentdelegation.org",
        external: true,
      },
      {
        label: "World docs",
        href: "https://docs.world.org",
        external: true,
      },
    ],
  },
  {
    id: "vendor-alien",
    name: "Alien",
    modality: "Anatomical (phone face verification) + Solana SAS",
    checked: "2026-10-31",
    scope:
      "Phone-app enrollment with face verification and Solana wallet-to-session linking through SAS (alien_session_schema with session_address). Alien documents reusable sessions, user revocation, wallet-signed close_attestation before re-linking, and Agent ID keys with per-request DPoP proofs. Alien states: \"Linking is not authentication.\"",
    boundary:
      "Requires the phone app for enrollment and linking. Apps must verify a separate fresh wallet signature to authenticate a visitor. Public docs reviewed on 2026-10-31 listed no integrator pricing. This table makes no accuracy comparison.",
    sources: [
      {
        label: "Solana SSO guide",
        href: "https://docs.alien.org/solana-sso-guide/introduction.md",
        external: true,
      },
      {
        label: "Solana core API",
        href: "https://docs.alien.org/solana-sso-api-reference/api-reference-core.md",
        external: true,
      },
      {
        label: "Alien sessions",
        href: "https://docs.alien.org/what-is-alien-session.md",
        external: true,
      },
      {
        label: "Agent ID guide",
        href: "https://docs.alien.org/agent-id-guide/introduction.md",
        external: true,
      },
    ],
  },
  {
    id: "vendor-poh",
    name: "Proof of Human (poh.org)",
    modality: "Behavioral (touch gestures and interaction telemetry)",
    checked: "2026-11-18",
    scope:
      "Documents 100,000 free monthly sessions on its Community tier and $0.25 per session on Base. Documents touch gestures and server-streamed interaction telemetry.",
    boundary:
      "Vendor documentation scope reviewed on 2026-11-18. Cited docs publish no human false-rejection rate (FRR). This table makes no accuracy ranking.",
    sources: [
      { label: "poh.org", href: "https://poh.org", external: true },
      { label: "Plans", href: "https://docs.poh.org/plans.md", external: true },
      {
        label: "How it works",
        href: "https://docs.poh.org/how-it-works.md",
        external: true,
      },
    ],
  },
  {
    id: "vendor-civic",
    name: "Civic (Civic Pass)",
    modality: "KYC and anatomical gateway (Solana)",
    checked: "2026-05-11",
    scope:
      "Solana attestation gateway issuing pass tokens backed by document KYC, face liveness, or CAPTCHA networks chosen by the integrator.",
    boundary:
      "Document and face passes depend on server-side verification and issuer retention terms. Teams with legal-ID requirements can pair a Civic pass with optional Entros behavioral evidence.",
    sources: [
      { label: "civic.com", href: "https://www.civic.com", external: true },
      { label: "Civic docs", href: "https://docs.civic.com", external: true },
    ],
  },
  {
    id: "vendor-humanity",
    name: "Humanity Protocol",
    modality: "Anatomical (palm biometric + ZK credentials)",
    checked: "2026-05-11",
    scope:
      "Documents palm biometric template enrollment paired with zero-knowledge credential presentations across operator nodes.",
    boundary:
      "Requires palm enrollment support and operator-node verification. Cited from public whitepaper documentation with no accuracy comparison or ranking.",
    sources: [
      { label: "humanity.org", href: "https://www.humanity.org", external: true },
      {
        label: "Whitepaper",
        href: "https://docs.humanity.org/whitepaper",
        external: true,
      },
    ],
  },
];

export const COMPARISON_EXPLAINERS: ComparisonExplainer[] = [
  {
    id: "attestation-vs-authentication",
    title: "Attestation versus authentication",
    body: [
      "Reading an Entros Anchor or SAS attestation reports prior verification history for a wallet. It does not prove who controls the private key during the current request.",
      "Applications authenticate wallet control with a fresh wallet-signed challenge bound to the action, audience, nonce, and expiry, then evaluate chain state on the server or inside the settling program.",
    ],
    link: {
      label: "Read Integrator Policy v1",
      href: "/docs/integrate/verification-flow",
    },
  },
  {
    id: "warm-evidence-reuse",
    title: "Warm evidence reuse and original verifiedAt",
    body: [
      "When a wallet already holds devnet evidence that satisfies your minTrustScore and maxVerificationAgeSeconds rules, a warm policy check passes at 0 SOL and zero capture rounds.",
      "Warm reuse preserves the original on-chain verifiedAt timestamp and never resets evidence age. When the window expires or the identity resets, the app routes the user back to capture.",
    ],
    link: {
      label: "Inspect protected-action checks",
      href: "/docs/integrate/protected-action",
    },
  },
  {
    id: "agent-operator-permits",
    title: "Agent Operator Permit consumption",
    body: [
      "On Solana devnet, an owner binds an agent key in the Solana Agent Registry and signs a single-use permit for a specific action. The consuming service checks current ownership, the presenting agent key, and the owner's verification policy, then consumes the permit nonce once at settlement.",
      "A permit authorizes one later agent action. It does not certify that a human is present when the agent executes.",
    ],
    link: {
      label: "Explore Agent Permits",
      href: "/agents",
    },
  },
  {
    id: "device-data-boundaries",
    title: "Device data boundaries",
    body: [
      "Raw motion recordings and the full-resolution touch stream stay on the device. Spoken phrase audio crosses the network for transient transcription and checks, and Entros never stores it.",
      "Validation also receives a 308-value feature summary, F0 and acceleration-magnitude contours, a coarse 64-point path outline, client signals, capture timing, wallet, and commitment fields. The later protocol submission carries the Groth16 proof and public inputs.",
    ],
    link: {
      label: "Read the Privacy notice",
      href: "/privacy",
    },
  },
];

export const REGULATORY_DESIGN_CONTEXT = {
  id: "context-anatomical-storage",
  title: "Structural design context on centralized anatomical storage",
  checked: "2026-11-13",
  body:
    "European data-protection guidance from Spain's AEPD regarding GDPR Article 9 highlights the structural risk of centralized anatomical biometric storage. Entros keeps raw motion and full-resolution touch on the device and avoids collecting iris, face, or government-ID records.",
  disclaimer:
    "This note provides architectural design context only. It is not legal advice and makes no regulatory compliance or equivalence claim for Entros or any other system.",
  source: {
    label: "Spain AEPD guidance",
    href: "https://www.aepd.es",
    external: true,
  } satisfies PrimarySource,
};
