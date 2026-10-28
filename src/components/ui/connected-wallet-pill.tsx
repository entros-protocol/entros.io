"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { X } from "lucide-react";

/**
 * Truncates a base58 wallet pubkey to the first/last 4 chars with an
 * ellipsis. Mirrors the convention WalletMultiButton uses but keeps it
 * out of the wallet-adapter render path so we control the layout.
 */
export function truncateWallet(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

type Size = "sm" | "md";

const SIZE: Record<
  Size,
  { pill: string; dot: string; text: string; button: string; icon: number }
> = {
  sm: {
    pill: "h-7",
    dot: "h-1.5 w-1.5",
    text: "text-xs gap-1.5 px-2.5",
    button: "w-7",
    icon: 14,
  },
  md: {
    pill: "h-8",
    dot: "h-2 w-2",
    text: "text-sm gap-2 px-3",
    button: "w-8",
    icon: 16,
  },
};

/**
 * Connected-wallet pill. Renders only when a wallet is connected.
 * Single sharp-edged rectangle: cyan address section on the left, a
 * muted-red X button on the right joined by a divider — one unified
 * unit so the way to disconnect reads as part of the same control,
 * not a separate orphan button.
 *
 * Sizes: `sm` (h-7) for in-flow surfaces (verify, dashboard, popup,
 * gate-demo); `md` (h-8) for the navbar.
 */
export function ConnectedWalletPill({ size = "md" }: { size?: Size }) {
  const { publicKey, disconnect } = useWallet();

  if (!publicKey) return null;

  const address = publicKey.toBase58();
  const config = SIZE[size];

  return (
    <div
      className={`inline-flex items-stretch border border-cyan/40 bg-cyan/5 font-mono ${config.pill}`}
      title={address}
    >
      <div className={`inline-flex items-center text-cyan ${config.text}`}>
        <span
          className={`inline-block bg-cyan ${config.dot}`}
          aria-hidden="true"
        />
        <span>{truncateWallet(address)}</span>
      </div>
      <button
        type="button"
        onClick={() => {
          void disconnect();
        }}
        className={`inline-flex items-center justify-center border-l border-cyan/40 bg-red-500/5 text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/40 ${config.button}`}
        aria-label="Disconnect wallet"
      >
        <X size={config.icon} strokeWidth={2.5} />
      </button>
    </div>
  );
}
