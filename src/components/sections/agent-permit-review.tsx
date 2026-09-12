"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { isUserRejection } from "@entros/pulse-sdk";
import type { AgentPermitRequest } from "@entros/verify/agent-permit";
import { ArrowUpRight, Loader2, PenLine } from "lucide-react";
import { AgentPermitSummary } from "@/components/sections/agent-permit-summary";
import { AuthorizeCheckList } from "@/components/ui/authorize-check-list";
import { CopyBlock } from "@/components/ui/copy-block";
import { WalletConnectButton } from "@/components/ui/wallet-connect-button";
import { buildApproval, reviewPermitRequest, type PermitReview } from "@/lib/agent-permit-authorize";

const nowSeconds = () => Math.floor(Date.now() / 1000);

export function AgentPermitReview({
  request,
  message,
}: {
  request: AgentPermitRequest;
  message: string;
}) {
  const { connected, publicKey, signMessage } = useWallet();
  const { connection } = useConnection();
  const wallet = connected ? (publicKey?.toBase58() ?? null) : null;
  const reviewKey = wallet ? `${connection.rpcEndpoint}:${wallet}:${request.nonce}` : null;
  const [review, setReview] = useState<{ key: string; value: PermitReview } | null>(null);
  const [approval, setApproval] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (!wallet || !reviewKey) return;
    let cancelled = false;
    void reviewPermitRequest({ request, wallet, connection, nowSeconds }).then(
      (value) => {
        if (!cancelled) setReview({ key: reviewKey, value });
      },
      () => {
        if (!cancelled) setError("Could not read devnet. Reload the page to try again.");
      },
    );
    return () => {
      cancelled = true;
    };
  }, [connection, request, reviewKey, wallet]);

  const current = review?.key === reviewKey ? review.value : null;

  async function sign() {
    if (!current?.canSign || !current.verifiedTransaction || !signMessage) return;
    if (nowSeconds() >= request.expiresAt) {
      setError("The request expired while this page was open. Ask the agent for a new one.");
      return;
    }
    setError(null);
    setSigning(true);
    try {
      const signature = await signMessage(new TextEncoder().encode(message));
      setApproval(buildApproval({ request, signature, verifiedTransaction: current.verifiedTransaction }));
    } catch (cause: unknown) {
      setError(
        isUserRejection(cause)
          ? "You declined the signature. Nothing was signed."
          : "Your wallet could not sign this text. Some hardware wallets cannot sign messages.",
      );
    } finally {
      setSigning(false);
    }
  }

  return (
    <div className="verification-surface p-6 md:p-10">
      <AgentPermitSummary request={request} />
      <p className="mt-8 border-l-2 border-cyan/40 pl-4 text-sm leading-relaxed text-foreground/70">
        Sign only if you asked this agent to do this at this application. Your signature authorizes
        one action, and only the agent wallet above can use it before it expires.
      </p>

      <div className="mt-10">
        {!wallet ? (
          <WalletConnectButton align="start" />
        ) : (
          <AuthorizeCheckList checks={current?.checks ?? null} loading={!current && !error} />
        )}
      </div>

      {current?.needsVerification && (
        <Link
          href="/verify"
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-6 inline-flex items-center gap-2 text-sm text-cyan transition-colors hover:text-foreground"
        >
          Verify with Entros in a new tab
          <ArrowUpRight
            className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      )}

      {error && <p className="mt-6 text-sm text-danger">{error}</p>}

      {wallet && !approval && (
        <button
          type="button"
          onClick={sign}
          disabled={!current?.canSign || signing || !signMessage}
          className="mt-8 inline-flex items-center justify-center gap-2 border border-foreground/20 bg-foreground px-6 py-3 font-mono text-sm text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {signing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <PenLine className="h-4 w-4" aria-hidden />}
          {signing ? "Waiting for your wallet…" : "Sign permit"}
        </button>
      )}

      {approval && (
        <div className="mt-10">
          <CopyBlock label="Approval for the agent" text={approval} />
          <p className="mt-3 text-xs leading-relaxed text-foreground/60">
            Give this approval to the agent. The agent adds its own signature and presents it to
            the application.
          </p>
        </div>
      )}
    </div>
  );
}
