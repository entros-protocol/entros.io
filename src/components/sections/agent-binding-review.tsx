"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction } from "@solana/web3.js";
import {
  buildSetAgentWalletInstructions,
  isUserRejection,
  type AgentWalletBindingRequest,
} from "@entros/pulse-sdk";
import { ExternalLink, Link2, Loader2 } from "lucide-react";
import { AuthorizeCheckList } from "@/components/ui/authorize-check-list";
import { DetailField } from "@/components/ui/detail-field";
import { WalletConnectButton } from "@/components/ui/wallet-connect-button";
import { reviewBindingRequest, type BindingReview } from "@/lib/agent-permit-authorize";
import { explorerUrl } from "@/lib/explorer";

const nowSeconds = () => Math.floor(Date.now() / 1000);

export function AgentBindingReview({ binding }: { binding: AgentWalletBindingRequest }) {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const wallet = connected ? (publicKey?.toBase58() ?? null) : null;
  const [round, setRound] = useState(0);
  const reviewKey = wallet ? `${connection.rpcEndpoint}:${wallet}:${round}` : null;
  const [review, setReview] = useState<{ key: string; value: BindingReview } | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!wallet || !reviewKey) return;
    let cancelled = false;
    void reviewBindingRequest({ binding, wallet, connection, nowSeconds }).then(
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
  }, [binding, connection, reviewKey, wallet]);

  const current = review?.key === reviewKey ? review.value : null;

  async function send() {
    if (!current?.canSend || !publicKey) return;
    setError(null);
    setSending(true);
    try {
      const transaction = new Transaction().add(...(await buildSetAgentWalletInstructions(binding)));
      const latest = await connection.getLatestBlockhash("confirmed");
      transaction.feePayer = publicKey;
      transaction.recentBlockhash = latest.blockhash;
      const sent = await sendTransaction(transaction, connection);
      // web3.js resolves confirmation for a transaction that reverted, so read its error.
      const confirmation = await connection.confirmTransaction({ signature: sent, ...latest }, "confirmed");
      if (confirmation.value.err !== null) throw new Error("The registry rejected the binding");
      setSignature(sent);
      setRound((value) => value + 1);
    } catch (cause: unknown) {
      setError(
        isUserRejection(cause)
          ? "You declined the transaction. Nothing changed."
          : "The registry refused the transaction. If the deadline passed, ask the agent for a new request.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="verification-surface p-6 md:p-10">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">Bind agent wallet</p>
      <p className="mt-2 font-display text-2xl font-medium tracking-tight text-foreground">
        Let this key present permits for your agent
      </p>
      <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
        <DetailField label="Agent" value={binding.agent} wide />
        <DetailField label="Agent wallet" value={binding.agentWallet} wide />
        <DetailField label="Owner" value={binding.owner} wide />
        <DetailField
          label="Send before"
          value={new Date(binding.deadline * 1000).toISOString().replace(".000Z", " UTC").replace("T", " ")}
        />
      </dl>
      <p className="mt-8 border-l-2 border-cyan/40 pl-4 text-sm leading-relaxed text-foreground/70">
        This devnet transaction sets the agent wallet in the 8004 agent registry. Only that key can
        present the permits you sign. A transfer of the agent clears it.
      </p>

      <div className="mt-10">
        {!wallet ? (
          <WalletConnectButton align="start" />
        ) : (
          <AuthorizeCheckList checks={current?.checks ?? null} loading={!current && !error} />
        )}
      </div>
      {error && <p className="mt-6 text-sm text-danger">{error}</p>}
      {signature ? (
        <p className="mt-6 text-sm text-solana-green">
          Bound. The registry now holds this agent wallet.{" "}
          <a
            href={explorerUrl(signature, "tx")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-xs text-cyan transition-colors hover:text-foreground"
          >
            {signature.slice(0, 12)}… <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </p>
      ) : (
        current?.alreadyBound && (
          <p className="mt-6 text-sm text-solana-green">The registry already holds this agent wallet.</p>
        )
      )}
      {wallet && !current?.alreadyBound && (
        <button
          type="button"
          onClick={send}
          disabled={!current?.canSend || sending}
          className="mt-8 flex w-fit items-center justify-center gap-2 border border-foreground/20 bg-foreground px-6 py-3 font-mono text-sm text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
          {sending ? "Waiting for your wallet…" : "Bind agent wallet"}
        </button>
      )}
    </div>
  );
}
