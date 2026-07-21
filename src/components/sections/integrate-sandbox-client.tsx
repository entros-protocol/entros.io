"use client";

import React, { useState } from "react";
import { Shield, Code, Settings, Copy, Check, Info, Sparkles, ExternalLink } from "lucide-react";

type ThemeColor = "cyan" | "indigo" | "emerald" | "purple" | "pink";
type PaymentMode = "user-pays" | "walletless";

export function generateAnchorCode(riskCeiling: number = 0.75): string {
  return `use anchor_lang::prelude::*;
use entros_registry::state::IdentityState;

#[program]
pub mod my_airdrop {
    use super::*;

    pub fn claim_tokens(ctx: Context<ClaimTokens>) -> Result<()> {
        let identity = &ctx.accounts.identity_state;
        let clock = Clock::get()?;

        // Verify the attestation was issued within the last 24 hours
        require!(
            identity.last_verification_timestamp >= clock.unix_timestamp - 86400,
            AirdropError::AttestationExpired
        );

        // Enforce the custom trust score threshold configured in your sandbox
        require!(
            identity.trust_score >= ${Math.round((1 - riskCeiling) * 100)},
            AirdropError::InsufficientTrustScore
        );

        // Execute token distribution
        Ok(())
    }
}

#[derive(Accounts)]
pub struct ClaimTokens<'info> {
    #[account(mut)]
    pub claimant: Signer<'info>,

    /// CHECK: Evaluated Sync PDA derived from claimant's pubkey
    #[account(
        seeds = [b"identity", claimant.key().as_ref()],
        bump,
        seeds::program = entros_registry::ID,
    )]
    pub identity_state: Account<'info, IdentityState>,
    
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum AirdropError {
    #[msg("Validation attestation has expired. Re-verify liveness.")]
    AttestationExpired,
    #[msg("Composite risk score is too high to claim tokens.")]
    InsufficientTrustScore,
}`;
}

export function IntegrateSandboxClient() {
  // Config state variables
  const [riskCeiling, setRiskCeiling] = useState<number>(0.75);
  const [reputationMinSol, setReputationMinSol] = useState<number>(0.5);
  const [enforceTemporal, setEnforceTemporal] = useState<boolean>(true);
  const [enforceAcoustic, setEnforceAcoustic] = useState<boolean>(true);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("user-pays");
  const [themeColor, setThemeColor] = useState<ThemeColor>("cyan");

  // Tab state
  const [activeTab, setActiveTab] = useState<"react" | "anchor" | "sdk">("react");
  const [copied, setCopied] = useState<boolean>(false);
  
  // Interactive preview state
  const [previewState, setPreviewState] = useState<"idle" | "scanning" | "success">("idle");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getThemeHex = (color: ThemeColor) => {
    switch (color) {
      case "cyan": return "#00f0ff";
      case "indigo": return "#6366f1";
      case "emerald": return "#10b981";
      case "purple": return "#a855f7";
      case "pink": return "#ec4899";
    }
  };

  const getThemeClass = (color: ThemeColor) => {
    switch (color) {
      case "cyan": return "border-cyan text-cyan hover:bg-cyan/5";
      case "indigo": return "border-indigo-500 text-indigo-500 hover:bg-indigo-500/5";
      case "emerald": return "border-emerald-500 text-emerald-500 hover:bg-emerald-500/5";
      case "purple": return "border-purple-500 text-purple-500 hover:bg-purple-500/5";
      case "pink": return "border-pink-500 text-pink-500 hover:bg-pink-500/5";
    }
  };

  const getThemeBgClass = (color: ThemeColor) => {
    switch (color) {
      case "cyan": return "bg-cyan";
      case "indigo": return "bg-indigo-500";
      case "emerald": return "bg-emerald-500";
      case "purple": return "bg-purple-500";
      case "pink": return "bg-pink-500";
    }
  };

  // Code templates generator
  const getReactCode = () => {
    return `import { EntrosVerify } from "@entros/verify";

export default function AirdropClaim() {
  return (
    <EntrosVerify
      riskCeiling={${riskCeiling.toFixed(2)}}
      reputationMinSol={${reputationMinSol.toFixed(2)}}
      enforceTemporal={${enforceTemporal}}
      enforceAcoustic={${enforceAcoustic}}
      paymentMode="${paymentMode}"
      theme="${themeColor}"
      onSuccess={(receipt) => {
        console.log("Validation attestation received:", receipt.attestationPda);
        // Trigger claim on-chain transaction here
      }}
      onError={(err) => {
        console.error("Verification failed:", err.message);
      }}
    />
  );
}`;
  };

  const getAnchorCode = () => generateAnchorCode(riskCeiling);

  const getSdkCode = () => {
    return `import { Connection, PublicKey } from "@solana/web3.js";
import { getIdentityStateSync } from "@entros/pulse-sdk";

const connection = new Connection("https://api.devnet.solana.com");
const claimant = new PublicKey("YOUR_USER_WALLET_PUBKEY");

try {
  const state = await getIdentityStateSync(connection, claimant);
  
  if (state.trustScore >= ${Math.round((1 - riskCeiling) * 100)}) {
    console.log(\`Verified Human! Trust Score: \${state.trustScore}/100\`);
  } else {
    console.warn("User flagged by Composite Risk Score heuristics.");
  }
} catch (error) {
  console.log("No attestation found on-chain for this wallet address.");
}`;
  };

  const getActiveCode = () => {
    if (activeTab === "react") return getReactCode();
    if (activeTab === "anchor") return getAnchorCode();
    return getSdkCode();
  };

  const simulateVerification = () => {
    if (previewState !== "idle") return;
    setPreviewState("scanning");
    setTimeout(() => {
      setPreviewState("success");
    }, 2500);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 md:pb-32">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Side: Parameters Customization (col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="border border-border bg-surface p-6 md:p-8 flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <Settings className="h-4 w-4 text-cyan" />
              <h3 className="font-display text-lg font-medium text-foreground">
                Configuration Settings
              </h3>
            </div>

            {/* Risk Ceiling Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                  Risk Score Ceiling
                </label>
                <span className="font-mono text-sm text-cyan font-medium">
                  {riskCeiling.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.95"
                step="0.05"
                className="w-full accent-cyan bg-foreground/[0.06] h-1 rounded"
                value={riskCeiling}
                onChange={(e) => setRiskCeiling(parseFloat(e.target.value))}
              />
              <span className="text-[10px] text-foreground/40 leading-normal">
                Verifications with a Composite Risk Score (CRS) above this limit are rejected.
              </span>
            </div>

            {/* Min SOL Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                  Min Wallet SOL Gate
                </label>
                <span className="font-mono text-sm text-cyan font-medium">
                  {reputationMinSol.toFixed(2)} SOL
                </span>
              </div>
              <input
                type="range"
                min="0.00"
                max="5.00"
                step="0.10"
                className="w-full accent-cyan bg-foreground/[0.06] h-1 rounded"
                value={reputationMinSol}
                onChange={(e) => setReputationMinSol(parseFloat(e.target.value))}
              />
              <span className="text-[10px] text-foreground/40 leading-normal">
                Checks public balance prior to capture. Contributes to Layer D1 Reputation scoring.
              </span>
            </div>

            {/* Liveness Checks */}
            <div className="flex flex-col gap-3">
              <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                Active Verification Layers
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-border text-cyan focus:ring-cyan bg-background"
                  checked={enforceTemporal}
                  onChange={(e) => setEnforceTemporal(e.target.checked)}
                />
                <span className="text-xs text-foreground/75 font-display">
                  Enforce Biomechanical Sync (Temporal check)
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-border text-cyan focus:ring-cyan bg-background"
                  checked={enforceAcoustic}
                  onChange={(e) => setEnforceAcoustic(e.target.checked)}
                />
                <span className="text-xs text-foreground/75 font-display">
                  Enforce Acoustic Consistency (Speech realism)
                </span>
              </label>
            </div>

            {/* Payment Mode */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                Verification Funding Model
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {(["user-pays", "walletless"] as PaymentMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    className={`px-3 py-2 text-xs border font-display tracking-tight transition-all ${
                      paymentMode === mode
                        ? "border-cyan bg-cyan/5 text-cyan"
                        : "border-border text-foreground/60 hover:border-foreground/30"
                    }`}
                  >
                    {mode === "user-pays" ? "User Pays (~0.005 SOL)" : "Walletless (Relayed)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Colors */}
            <div className="flex flex-col gap-2">
              <label className="font-mono text-xs uppercase tracking-wider text-foreground/50">
                Component Theme Styling
              </label>
              <div className="flex gap-3 mt-1.5">
                {(["cyan", "indigo", "emerald", "purple", "pink"] as ThemeColor[]).map((color) => {
                  const isSelected = themeColor === color;
                  return (
                    <button
                      key={color}
                      onClick={() => {
                        setThemeColor(color);
                        setPreviewState("idle");
                      }}
                      className={`h-6 w-6 rounded-full border-2 transition-all ${getThemeBgClass(color)} ${
                        isSelected ? "border-foreground scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                      title={color}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Component Preview & Dynamic Code (col-span-7) */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          {/* Button Interactive Sandbox Container */}
          <div className="border border-border bg-surface p-6 md:p-8 flex flex-col items-center justify-center min-h-[12rem] relative overflow-hidden">
            <span className="absolute left-4 top-4 font-mono text-[9px] uppercase tracking-wider text-foreground/30">
              // Live Interactive Preview
            </span>

            {previewState === "idle" && (
              <button
                onClick={simulateVerification}
                className={`flex items-center gap-2 border px-6 py-3 font-display text-sm font-medium rounded-full transition-all ${getThemeClass(themeColor)}`}
              >
                <Shield className="h-4 w-4" />
                Verify Humanness
              </button>
            )}

            {previewState === "scanning" && (
              <div className="flex flex-col items-center gap-3">
                <span className="relative flex h-8 w-8 items-center justify-center">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-30 ${getThemeBgClass(themeColor)}`} />
                  <span className={`relative inline-flex rounded-full h-4 w-4 ${getThemeBgClass(themeColor)}`} />
                </span>
                <span className="font-mono text-xs text-foreground/60 animate-pulse">
                  Analyzing Biometrics & Reputation...
                </span>
              </div>
            )}

            {previewState === "success" && (
              <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20`}>
                  <Check className="h-6 w-6 animate-bounce" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-medium text-foreground">
                    Simulated Attestation Issued
                  </h4>
                  <p className="mt-1 text-xs text-foreground/45 leading-normal">
                    Liveness verified successfully. On-chain registry PDA generated with target thresholds.
                  </p>
                </div>
                <button
                  onClick={() => setPreviewState("idle")}
                  className="text-xs font-mono text-cyan hover:underline"
                >
                  Reset Simulation
                </button>
              </div>
            )}
          </div>

          {/* Dynamic Code Generator Block */}
          <div className="border border-border bg-surface flex flex-col flex-1">
            <div className="flex border-b border-border bg-background/50 overflow-x-auto">
              {[
                { id: "react", label: "React Component" },
                { id: "anchor", label: "Solana Anchor (Rust)" },
                { id: "sdk", label: "Solana SDK (TS)" }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-5 py-3.5 font-mono text-xs uppercase tracking-wider border-r border-border transition-all ${
                      isActive
                        ? "bg-[#070b0e] text-cyan border-b-2 border-b-cyan"
                        : "text-foreground/40 hover:text-foreground/75"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}

              <button
                onClick={() => copyToClipboard(getActiveCode())}
                className="ml-auto flex items-center gap-2 px-5 py-3.5 font-mono text-xs uppercase tracking-wider text-cyan hover:text-foreground transition-all"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="p-6 font-mono text-xs leading-relaxed text-cyan/85 bg-[#070b0e] overflow-auto max-h-[22rem] whitespace-pre select-all">
              {getActiveCode()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
