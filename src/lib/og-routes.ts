import {
  normalizeOgCardContent,
  OG_DEFAULT_DESCRIPTION,
  OG_DEFAULT_TITLE,
  sanitizeOgPath,
  type OgCardContent,
} from "./og-card";

export interface StaticOgRouteEntry {
  title: string;
  description: string;
}

/**
 * Canonical server-side catalog of every marketing and app route's Open Graph
 * card content. `/api/og` resolves cards exclusively from this catalog and the
 * compiled Fumadocs tree so untrusted query strings cannot mint spoofed cards.
 */
export const STATIC_OG_ROUTES: Readonly<Record<string, StaticOgRouteEntry>> = {
  "/solutions": {
    title: "Solutions",
    description:
      "Entros use cases: sybil-resistant airdrops, verified governance, fair mints, creator verification, bot prevention.",
  },
  "/technology": {
    title: "Technology",
    description:
      "Three paired rounds of speech and tracing, client-side proving, and the on-chain Entros Anchor. Raw motion and touch stay on the device; phrase audio leaves for transcription, never stored.",
  },
  "/security": {
    title: "Security Program",
    description:
      "Scoped adversarial campaigns against the verification pipeline, with attack classes, denominators, and observed results.",
  },
  "/compare": {
    title: "Compare Modalities",
    description:
      "Compare anatomical, credential, KYC, and behavioral human verification with dated primary sources and explicit limits.",
  },
  "/paper": {
    title: "Research Paper",
    description:
      "Entros Protocol: Proof-of-Personhood through Temporal Biometric Consistency. Threat model, ZK circuit, on-chain anchoring, and security analysis.",
  },
  "/token": {
    title: "Token",
    description:
      "Current protocol fees, fair-launch details, and the planned $ENTROS utility roadmap.",
  },
  "/integrate": {
    title: "Integrate",
    description:
      "Drop the EntrosVerify component into any Solana app in five lines, or wire the Pulse SDK for custom UX. On-chain reads are free.",
  },
  "/verify": {
    title: "Verify",
    description:
      "Verify your wallet on Solana devnet: three short rounds of voice, touch and motion, then one on-chain transaction.",
  },
  "/dashboard": {
    title: "Dashboard",
    description:
      "Your Entros Anchor details, Trust Score, verification history, and the agents registered to your wallet.",
  },
  "/agents": {
    title: "Agent Operator Permit",
    description:
      "An Agent Operator Permit lets an app say yes to your agent for one action. You sign it with the owning wallet, and the app checks it and your Entros verification on devnet.",
  },
  "/governance": {
    title: "Governance Plugin",
    description:
      "Human-verified governance for Solana DAOs. A Realms voter-weight plugin gates votes on Entros verification, designed to keep bots, scripts, and dormant wallets out.",
  },
  "/roadmap": {
    title: "Roadmap",
    description:
      "Live on devnet with a shipped SDK and red-team results. The token funds the path to mainnet: hardening, a trusted-setup ceremony, and an external audit.",
  },
  "/press": {
    title: "Press Kit",
    description:
      "Press kit for Entros Protocol. Logos, descriptions, and public artifacts for journalists, podcasters, and ecosystem partners.",
  },
  "/manifesto": {
    title: "Manifesto",
    description:
      "Why Entros exists: proof that a live person stands behind a wallet, with your body kept yours, agents tied to the people who direct them, and the work shown in public.",
  },
  "/privacy": {
    title: "Privacy",
    description:
      "What Entros receives when you use entros.io, where it goes, how long it is kept, and what stays on your device.",
  },
  "/case-studies/realms": {
    title: "Realms Case Study",
    description:
      "Design study for Entros voter weight on Realms, from the devnet prototype and planned client integration.",
  },
  "/stats": {
    title: "Protocol Stats",
    description:
      "Live on-chain metrics for the Entros Protocol. Total anchors minted, trust scores, and verification activity, queried directly from Solana devnet.",
  },
};

export interface DocPageLookupResult {
  data: {
    title: string;
    description?: string;
  };
}

export type DocPageLookup = (slug: string[]) => DocPageLookupResult | undefined;

export interface ResolvedOgCard {
  matched: boolean;
  card: OgCardContent;
}

const DEFAULT_CARD: OgCardContent = {
  title: OG_DEFAULT_TITLE,
  description: OG_DEFAULT_DESCRIPTION,
  path: null,
};

/**
 * Resolve canonical OG card content from request query parameters.
 *
 * Only the `path` parameter is accepted. Any other query parameter (such as
 * `title` or `description`), duplicate `path`, or unrecognized path returns the
 * neutral default `entros.io` card with `matched: false` so spoofed links
 * cannot render attacker-chosen text or paths.
 */
export function resolveCanonicalOgCard(
  searchParams: URLSearchParams,
  lookupDocPage: DocPageLookup,
): ResolvedOgCard {
  const keys = [...searchParams.keys()];
  if (keys.some((key) => key !== "path") || searchParams.getAll("path").length > 1) {
    return { matched: false, card: DEFAULT_CARD };
  }

  const rawPath = searchParams.get("path");
  if (rawPath === null || rawPath === "" || rawPath === "/") {
    return { matched: true, card: DEFAULT_CARD };
  }

  const safePath = sanitizeOgPath(rawPath);
  if (!safePath) {
    return { matched: false, card: DEFAULT_CARD };
  }

  const staticEntry = STATIC_OG_ROUTES[safePath];
  if (staticEntry) {
    return {
      matched: true,
      card: normalizeOgCardContent({
        title: staticEntry.title,
        description: staticEntry.description,
        path: safePath,
      }),
    };
  }

  if (safePath === "/docs" || safePath.startsWith("/docs/")) {
    const slug =
      safePath === "/docs"
        ? []
        : safePath.slice("/docs/".length).split("/").filter(Boolean);
    const doc = lookupDocPage(slug);
    if (doc) {
      return {
        matched: true,
        card: normalizeOgCardContent({
          title: doc.data.title,
          description: doc.data.description ?? OG_DEFAULT_DESCRIPTION,
          path: safePath,
        }),
      };
    }
  }

  return { matched: false, card: DEFAULT_CARD };
}
