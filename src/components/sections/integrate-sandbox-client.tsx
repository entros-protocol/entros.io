"use client";

import { useState } from "react";
import { Check, Copy, Settings, Shield } from "lucide-react";

type SandboxTab = "react" | "anchor" | "sdk";

const SANDBOX_TABS: ReadonlyArray<{ id: SandboxTab; label: string }> = [
  { id: "react", label: "React component" },
  { id: "anchor", label: "Anchor program" },
  { id: "sdk", label: "SDK read" },
];

export function generateAnchorCode(
  minTrustScore: number = 250,
  maxVerificationAge: number = 3600,
): string {
  return `use anchor_lang::prelude::*;
use entros_anchor::IdentityState;

#[program]
pub mod my_airdrop {
    use super::*;

    pub fn claim_tokens(ctx: Context<ClaimTokens>) -> Result<()> {
        let identity = &ctx.accounts.identity_state;
        let now = Clock::get()?.unix_timestamp;

        require!(
            identity.last_verification_timestamp >= now - ${maxVerificationAge},
            AirdropError::VerificationExpired
        );
        require!(
            identity.trust_score >= ${minTrustScore},
            AirdropError::InsufficientTrustScore
        );

        Ok(())
    }
}

#[derive(Accounts)]
pub struct ClaimTokens<'info> {
    pub claimant: Signer<'info>,

    #[account(
        seeds = [b"identity", claimant.key().as_ref()],
        bump,
        seeds::program = entros_anchor::ID,
        constraint = identity_state.owner == claimant.key()
    )]
    pub identity_state: Account<'info, IdentityState>,
}

#[error_code]
pub enum AirdropError {
    #[msg("Entros verification is too old")]
    VerificationExpired,
    #[msg("Entros Trust Score is below this gate")]
    InsufficientTrustScore,
}`;
}

export function IntegrateSandboxClient() {
  const [minTrustScore, setMinTrustScore] = useState(250);
  const [maxVerificationAge, setMaxVerificationAge] = useState(3600);
  const [activeTab, setActiveTab] = useState<SandboxTab>("react");
  const [copied, setCopied] = useState(false);
  const [previewState, setPreviewState] = useState<
    "idle" | "checking" | "passed"
  >("idle");

  const getReactCode = () => `import { EntrosVerify } from "@entros/verify";

export function AirdropClaim() {
  return (
    <EntrosVerify
      integratorKey="your-integrator-key"
      cluster="devnet"
      policy={{
        id: "claim-access", version: 1,
        minTrustScore: ${minTrustScore},
        maxVerificationAgeSeconds: ${maxVerificationAge},
        maxEvaluationAgeSeconds: 90,
        requiredAssurance: "browser_unattested",
        uniquenessRequirement: "allow_unmeasured",
        requireAttestation: false, cluster: "devnet",
      }}
      onVerified={(result) => {
        console.log("Verification transaction:", result.txSig);
        // Submit the claim and re-check score plus recency where it settles.
      }}
      onError={(error) => console.error(error.reason)}
    >
      Verify to claim
    </EntrosVerify>
  );
}`;

  const getSdkCode = () => `import { Connection } from "@solana/web3.js";
import { readIntegratorEvidence } from "@entros/pulse-sdk";
import { evaluatePolicy, normalizePolicyRequest } from "@entros/verify/policy";

const connection = new Connection("https://api.devnet.solana.com");
const policy = normalizePolicyRequest({
  id: "claim-access", version: 1, minTrustScore: ${minTrustScore},
  maxVerificationAgeSeconds: ${maxVerificationAge},
  requiredAssurance: "browser_unattested",
  uniquenessRequirement: "allow_unmeasured", cluster: "devnet",
});
const observation = await readIntegratorEvidence({
  connection,
  walletPubkey: "AUTHENTICATED_WALLET",
  transactionSignature: "VERIFICATION_TRANSACTION",
  nowSeconds: Math.floor(Date.now() / 1000),
});
const result = evaluatePolicy(policy, observation, Math.floor(Date.now() / 1000));
console.log(result.decision);
// Authorize the signed action and consume its nonce where the action executes.`;

  const getActiveCode = () => {
    if (activeTab === "react") return getReactCode();
    if (activeTab === "anchor") {
      return generateAnchorCode(minTrustScore, maxVerificationAge);
    }
    return getSdkCode();
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const runIllustration = () => {
    if (previewState !== "idle") return;
    setPreviewState("checking");
    setTimeout(() => setPreviewState("passed"), 900);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 md:pb-32">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className="flex flex-col gap-7 border border-border bg-surface p-6 md:p-8">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <Settings className="h-4 w-4 text-cyan" />
              <h3 className="font-display text-lg font-medium text-foreground">
                Application policy
              </h3>
            </div>

            <label className="flex flex-col gap-2">
              <span className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-foreground/50">
                Minimum Trust Score
                <strong className="text-sm text-cyan">{minTrustScore}</strong>
              </span>
              <input
                type="range"
                min="0"
                max="10000"
                step="50"
                value={minTrustScore}
                onChange={(event) => setMinTrustScore(Number(event.target.value))}
                className="h-1 w-full accent-cyan"
              />
              <span className="text-xs leading-relaxed text-foreground/45">
                Set the on-chain history floor for this application action.
              </span>
            </label>

            <label className="flex flex-col gap-2">
              <span className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-foreground/50">
                Maximum verification age
                <strong className="text-sm text-cyan">
                  {Math.round(maxVerificationAge / 3600)}h
                </strong>
              </span>
              <input
                type="range"
                min="3600"
                max="604800"
                step="3600"
                value={maxVerificationAge}
                onChange={(event) =>
                  setMaxVerificationAge(Number(event.target.value))
                }
                className="h-1 w-full accent-cyan"
              />
              <span className="text-xs leading-relaxed text-foreground/45">
                Require a recent result for actions that need fresher evidence.
              </span>
            </label>

            <p className="border-t border-border pt-5 text-xs leading-relaxed text-foreground/50">
              Detector policy stays inside Entros. Integrators configure only
              public on-chain score and recency gates.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:col-span-7">
          <div className="relative flex min-h-48 flex-col items-center justify-center overflow-hidden border border-border bg-surface p-6 md:p-8">
            <span className="absolute left-4 top-4 font-mono text-[9px] uppercase tracking-wider text-foreground/30">
              // Interface illustration
            </span>

            {previewState === "idle" && (
              <button
                type="button"
                onClick={runIllustration}
                className="flex items-center gap-2 rounded-full border border-cyan px-6 py-3 font-display text-sm font-medium text-cyan transition-colors hover:bg-cyan/5"
              >
                <Shield className="h-4 w-4" />
                Preview policy result
              </button>
            )}

            {previewState === "checking" && (
              <p className="font-mono text-xs text-foreground/60">
                Reading devnet Anchor fields...
              </p>
            )}

            {previewState === "passed" && (
              <div className="flex max-w-sm flex-col items-center gap-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                  <Check className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-medium text-foreground">
                    Illustrative policy pass
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-foreground/45">
                    This preview does not run verification or issue an
                    attestation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewState("idle")}
                  className="font-mono text-xs text-cyan hover:underline"
                >
                  Reset preview
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-foreground/[0.06]">
            <p className="border-b border-border px-5 py-3 text-xs leading-relaxed text-foreground/60">
              {activeTab === "anchor"
                ? "Basic on-chain score and recency example. This does not implement the full Integrator Policy v1 contract."
                : "These policy examples use Verify 0.2.0 and Pulse 4.10.0. Recheck the policy where the protected action executes."}
            </p>
            <div className="flex overflow-x-auto border-b border-border bg-background/50">
              {SANDBOX_TABS.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`border-r border-border px-5 py-3.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2 border-b-cyan bg-[#070b0e] text-cyan"
                      : "text-foreground/40 hover:text-foreground/75"
                  }`}
                >
                  {tab.label}
                </button>
              ))}

              <button
                type="button"
                onClick={copyToClipboard}
                className="ml-auto flex items-center gap-2 px-5 py-3.5 font-mono text-xs uppercase tracking-wider text-cyan transition-colors hover:text-foreground"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="max-h-[24rem] select-all overflow-auto whitespace-pre bg-[#070b0e] p-6 font-mono text-xs leading-relaxed text-cyan/85">
              {getActiveCode()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
