import type { IntegrationSnippet } from "./types";

/**
 * Tier 1 — drop-in trigger via the `@entros/verify` package.
 *
 * Five lines of JSX. The component opens a popup to entros.io, runs the
 * full verification pipeline, posts the result back via postMessage, and
 * fires the `onVerified` callback. Wallet connection happens inside the
 * popup so the integrator never touches `@solana/wallet-adapter-react`.
 *
 * The example is copy-paste runnable. Nothing hidden behind unshown
 * function wrappers.
 */
export const verifyComponentSnippet = {
  title: "Drop-in component",
  description:
    "The fastest path. Render `<EntrosVerify>` as a button anywhere in your React tree—the component handles the wallet popup, the 12-second behavioral capture, the on-chain mint, and hands you a verified payload via callback. Five lines.",
  code: `import { EntrosVerify } from '@entros/verify';

<EntrosVerify
  integratorKey="my-app"
  onVerified={(result) => grantAccess(result.walletPubkey)}
/>`,
  installCommand: "npm install @entros/verify",
};

/**
 * Tier 2 — programmatic SDK via `@entros/pulse-sdk`.
 *
 * For apps that want to own the verification UX (custom capture canvas,
 * inline rather than popup, branded loading states). The snippet below
 * is inside React component context — top-level `await` is impossible
 * outside an async function or top-level ESM module, so we show the
 * realistic `useEffect` / event-handler shape an integrator would
 * actually write.
 */
export const integrationSnippets: IntegrationSnippet[] = [
  {
    mode: "wallet-connected",
    title: "Wallet-connected verification",
    description:
      "The user pays a small protocol fee (~0.005 SOL) and signs a single transaction. An on-chain Anchor is minted or updated, a SAS attestation is written, and the Trust Score recomputes—all from one wallet prompt. Your app reads results on-chain for free.",
    code: `"use client";
import { useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PulseSDK } from '@entros/pulse-sdk';

const pulse = new PulseSDK({ cluster: 'devnet' });

export function CustomVerify() {
  const touchRef = useRef<HTMLDivElement>(null);
  const { wallet } = useWallet();
  const { connection } = useConnection();

  async function handleVerify() {
    const result = await pulse.verify(
      touchRef.current,
      wallet?.adapter,
      connection,
    );
    if (result.success) grantAccess(result.commitment);
  }

  return (
    <>
      <div ref={touchRef} className="capture-canvas" />
      <button onClick={handleVerify}>Verify</button>
    </>
  );
}`,
  },
];

/**
 * Tier 3 — read-only patterns. No verification flow in your app; you're
 * just gating or displaying based on existing on-chain Anchors.
 *
 * `verifyEntrosAttestation` is exported from `@entros/pulse-sdk`, so the
 * import path here is real. `EntrosBadge` and `EntrosGate` are
 * copy-source components — paste them into your project and adjust the
 * import path to your own component tree. (Future: `@entros/react`
 * package consolidates them; until then, copy from entros.io's repo.)
 */
export const useCaseSnippets = [
  {
    title: "Read a wallet's attestation",
    description:
      "Read the SAS attestation from chain state. No verification UI in your app, no API call, no key. Right for display and for lower-stakes gates. Pair it with a verification at the action for anything that moves value.",
    code: `import { verifyEntrosAttestation } from '@entros/pulse-sdk';
import type { Connection } from '@solana/web3.js';

export async function hasVerifiedAnchor(
  walletAddress: string,
  connection: Connection,
): Promise<boolean> {
  const attestation = await verifyEntrosAttestation(walletAddress, connection);
  return Boolean(attestation?.isHuman && !attestation.expired);
}`,
  },
  {
    title: "Gate access on an Anchor",
    description:
      "Drop-in React component. Renders children only when the connected wallet has an Anchor above your Trust Score floor that verified inside your recency window. Source and live preview at /gate-demo, copy the file into your own components folder.",
    code: `// Copy the EntrosGate source from entros.io/components/ui/entros-gate.tsx
import { EntrosGate } from "./components/EntrosGate";

export function PremiumPage() {
  return (
    <EntrosGate minTrustScore={100}>
      {/* Renders only when the connected wallet has an Anchor
          with trust_score >= 100 on devnet */}
      <h1>Welcome, verified human.</h1>
    </EntrosGate>
  );
}`,
  },
  {
    title: "Display verification status",
    description:
      "Pill component for profiles, comments, leaderboards. Reads the Anchor PDA on each render and shows the current Trust Score. Copy the source from /badge-demo.",
    code: `// Copy the EntrosBadge source from entros.io/components/ui/entros-badge.tsx
import { EntrosBadge } from "./components/EntrosBadge";
import { useConnection } from "@solana/wallet-adapter-react";

export function ProfileHeader({ walletAddress }: { walletAddress: string }) {
  const { connection } = useConnection();
  return (
    <div className="flex items-center gap-4">
      <h2 className="text-xl font-bold">{walletAddress}</h2>
      <EntrosBadge walletAddress={walletAddress} connection={connection} />
    </div>
  );
}`,
  },
];
