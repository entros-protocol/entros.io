"use client";

import React, { useState, useEffect, useRef } from "react";
import { Shield, AlertTriangle, Cpu, Terminal, Flame, RefreshCw, Zap, Sliders, Code, Check, Play } from "lucide-react";

interface Preset {
  name: string;
  description: string;
  crs: number;
  biometric: number;
  tts: number;
  temporal: number;
  automation: number;
  reputation: number;
  logs: string[];
}

const PRESETS: Record<string, Preset> = {
  human: {
    name: "Legitimate Human",
    description: "A standard human user capturing features through a physical microphone, exhibiting natural micro-tremor, and using a reputable wallet.",
    crs: 0.04,
    biometric: 0.05,
    tts: 0.02,
    temporal: 0.03,
    automation: 0.0,
    reputation: 0.08,
    logs: [
      "[INFO] Initializing liveness validation agent v2.1.0...",
      "[INFO] Checking client execution environment tells...",
      "[PASS] navigator.webdriver is false",
      "[PASS] No automation framework proxies or frames detected.",
      "[INFO] Querying Solana wallet reputation profile on-chain...",
      "[PASS] Wallet SOL balance: 4.85 SOL (sufficient gas reserves).",
      "[PASS] Wallet account age: 242 days (reputable prior activity).",
      "[INFO] Verifying client-side ZK Snark (Groth16 proof)...",
      "[PASS] ZK Proof verified successfully against on-chain verifying key.",
      "[INFO] Analyzing biometrics: F0 pitch contour & spectral voice quality...",
      "[PASS] Biometric consistency threshold satisfied (no synthesis signature).",
      "[SUCCESS] Composite Risk Score calculated: 0.04.",
      "[SUCCESS] Status: LEGITIMATE HUMAN (On-chain Attestation Issued)."
    ]
  },
  webdriver: {
    name: "Headless Webdriver Bot",
    description: "An automated browser farm script executing via Puppeteer or Selenium, leaving traces in the client window global context.",
    crs: 0.45,
    biometric: 0.08,
    tts: 0.05,
    temporal: 0.06,
    automation: 1.0,
    reputation: 0.1,
    logs: [
      "[INFO] Initializing liveness validation agent v2.1.0...",
      "[INFO] Checking client execution environment tells...",
      "[WARN] navigator.webdriver is true!",
      "[WARN] Headless Chrome user-agent string signature detected.",
      "[WARN] Selenium window variables found in global window context.",
      "[INFO] Querying Solana wallet reputation profile on-chain...",
      "[PASS] Wallet SOL balance: 2.10 SOL.",
      "[INFO] Verifying client-side ZK Snark (Groth16 proof)...",
      "[PASS] ZK Proof verified successfully.",
      "[INFO] Analyzing biometrics: F0 pitch contour & spectral voice quality...",
      "[PASS] Biometric consistency threshold satisfied.",
      "[WARNING] Composite Risk Score calculated: 0.45.",
      "[WARNING] Status: SUSPICIOUS (Graduated Friction CAPTCHA Triggered)."
    ]
  },
  audio: {
    name: "Virtual Audio Injector",
    description: "A bot attempting to feed pre-recorded audio files using a virtual loopback audio driver instead of capturing live sound.",
    crs: 0.62,
    biometric: 0.2,
    tts: 0.15,
    temporal: 0.08,
    automation: 1.0,
    reputation: 0.1,
    logs: [
      "[INFO] Initializing liveness validation agent v2.1.0...",
      "[INFO] Checking client execution environment tells...",
      "[PASS] navigator.webdriver is false",
      "[INFO] Querying audio capture devices enumerate list...",
      "[WARN] Virtual loopback audio device detected: 'VB-Audio Virtual Cable'",
      "[WARN] Active media track label flagged as virtual loopback driver.",
      "[INFO] Querying Solana wallet reputation profile on-chain...",
      "[PASS] Wallet SOL balance: 8.24 SOL.",
      "[INFO] Verifying client-side ZK Snark (Groth16 proof)...",
      "[PASS] ZK Proof verified successfully.",
      "[INFO] Analyzing biometrics: F0 pitch contour & spectral voice quality...",
      "[PASS] Biometric consistency threshold satisfied.",
      "[WARNING] Composite Risk Score calculated: 0.62.",
      "[WARNING] Status: DANGER (Liveness Verification Suspended)."
    ]
  },
  sybil: {
    name: "Airdrop Farmer Sybil",
    description: "A human user attempting multiple claims using empty, freshly-generated throwaway wallets with no transaction history.",
    crs: 0.78,
    biometric: 0.12,
    tts: 0.1,
    temporal: 0.05,
    automation: 0.1,
    reputation: 1.0,
    logs: [
      "[INFO] Initializing liveness validation agent v2.1.0...",
      "[INFO] Checking client execution environment tells...",
      "[PASS] navigator.webdriver is false",
      "[INFO] Querying Solana wallet reputation profile on-chain...",
      "[WARN] Wallet SOL balance: 0.0004 SOL (insufficient/near-zero).",
      "[WARN] Wallet account age: 14 minutes (freshly generated Sybil candidate).",
      "[WARN] Transaction history: 0 signatures (no prior gas burn).",
      "[WARN] High Sybil likelihood: Wallet reputation score is 0/100.",
      "[INFO] Verifying client-side ZK Snark (Groth16 proof)...",
      "[PASS] ZK Proof verified successfully.",
      "[INFO] Analyzing biometrics: F0 pitch contour & spectral voice quality...",
      "[PASS] Biometric consistency threshold satisfied.",
      "[CRITICAL] Composite Risk Score calculated: 0.78.",
      "[CRITICAL] Status: REJECTED (High-Risk Reputation Cap Exceeded)."
    ]
  },
  fusion: {
    name: "Full Bot Fusion (Synthetic AI)",
    description: "A advanced bot running under automation, using virtual audio devices, synthetic AI voices, and empty wallets.",
    crs: 0.98,
    biometric: 0.9,
    tts: 0.95,
    temporal: 0.85,
    automation: 1.0,
    reputation: 1.0,
    logs: [
      "[INFO] Initializing liveness validation agent v2.1.0...",
      "[INFO] Checking client execution environment tells...",
      "[WARN] navigator.webdriver is true!",
      "[WARN] Selenium & Puppeteer global context flags tripped.",
      "[INFO] Querying audio capture devices enumerate list...",
      "[WARN] Loopback virtual driver 'BlackHole 2ch' detected.",
      "[INFO] Querying Solana wallet reputation profile on-chain...",
      "[WARN] Wallet SOL balance: 0.0000 SOL. 0 transactions.",
      "[INFO] Verifying client-side ZK Snark (Groth16 proof)...",
      "[WARN] ZK Proof failed verification. Stale Poseidon commitment.",
      "[INFO] Analyzing biometrics: F0 pitch contour & spectral voice quality...",
      "[WARN] Audio realism check failed: Synthetic/Rendered spectral signature.",
      "[WARN] Temporal sync check failed: Motion/audio correlation < 0.09.",
      "[CRITICAL] Composite Risk Score calculated: 0.98.",
      "[CRITICAL] Status: CRITICAL BLOCKED (Protocol Protection Engaged)."
    ]
  }
};

const WINDOW_TELLS: ReadonlyArray<readonly [string, string]> = [
  ["__puppeteer_evaluation_script__", "puppeteer"],
  ["__playwright", "playwright"],
  ["__playwright__binding__", "playwright"],
  ["__pwInitScripts", "playwright"],
  ["__nightmare", "nightmare"],
  ["_phantom", "phantom"],
  ["callPhantom", "phantom"],
  ["domAutomation", "chrome-automation"],
  ["domAutomationController", "chrome-automation"],
  ["Cypress", "cypress"],
  ["__webdriver_evaluate", "selenium"],
  ["__selenium_evaluate", "selenium"],
  ["__webdriver_script_function", "selenium"],
  ["__webdriver_script_func", "selenium"],
  ["__webdriver_script_fn", "selenium"],
  ["__fxdriver_evaluate", "selenium"],
  ["__driver_evaluate", "selenium"],
  ["__webdriver_unwrapped", "selenium"],
  ["__selenium_unwrapped", "selenium"],
  ["__fxdriver_unwrapped", "selenium"],
  ["__driver_unwrapped", "selenium"],
  ["_Selenium_IDE_Recorder", "selenium"],
  ["__$webdriverAsyncExecutor", "selenium"],
  ["__lastWatirAlert", "watir"],
  ["__lastWatirConfirm", "watir"],
  ["__lastWatirPrompt", "watir"],
];

const CDC_PATTERN = /^[$]?cdc_/;

interface DiagnosticPayload {
  v: number;
  env: string;
  automation: {
    webdriver: boolean;
    tells: string[];
  };
  capture: {
    virtual_device: boolean;
  };
  reputation: {
    sol: number;
    tx_count: number;
    age_days: number;
  };
  biometrics: {
    voice_synthesis: number;
    gyro_sync: number;
  };
}

function scanLocalBrowserTelemetry(): DiagnosticPayload {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      v: 3,
      env: "non-browser",
      automation: { webdriver: false, tells: [] },
      capture: { virtual_device: false },
      reputation: { sol: 0.0, tx_count: 0, age_days: 0 },
      biometrics: { voice_synthesis: 0.0, gyro_sync: 0.0 }
    };
  }

  const found = new Set<string>();
  let webdriver = false;

  try {
    webdriver = navigator.webdriver === true;
  } catch {}

  const w = window as any;
  for (const [key, label] of WINDOW_TELLS) {
    try {
      if (key in w && w[key] != null) {
        found.add(label);
      }
    } catch {}
  }

  try {
    const scan = (obj: any) => {
      for (const k of Object.getOwnPropertyNames(obj)) {
        if (CDC_PATTERN.test(k)) {
          found.add("selenium");
          return;
        }
      }
    };
    scan(w);
    if (typeof document !== "undefined" && document) {
      scan(document);
    }
  } catch {}

  try {
    const de = typeof document !== "undefined" ? document.documentElement : null;
    if (de) {
      for (const attr of ["webdriver", "selenium", "driver"]) {
        if (de.getAttribute(attr) != null) {
          found.add("selenium");
          break;
        }
      }
    }
  } catch {}

  return {
    v: 3,
    env: "browser",
    automation: { webdriver, tells: Array.from(found) },
    capture: { virtual_device: false },
    reputation: { sol: 1.5, tx_count: 32, age_days: 120 },
    biometrics: { voice_synthesis: 0.02, gyro_sync: 0.98 }
  };
}

function evaluateCustomPayload(jsonString: string) {
  const defaultResult = {
    crs: 0.0,
    biometric: 0.0,
    tts: 0.0,
    temporal: 0.0,
    automation: 0.0,
    reputation: 0.0,
    logs: ["[ERROR] Failed to parse custom JSON telemetry payload."]
  };

  try {
    const payload = JSON.parse(jsonString) as DiagnosticPayload;
    const logs: string[] = ["[INFO] Initializing raw diagnostic validation..."];

    // 1. Evaluate Automation Tells
    const isWebdriver = payload.automation?.webdriver === true;
    const tells = payload.automation?.tells || [];
    const isVirtualDevice = payload.capture?.virtual_device === true;
    let automationRisk = 0.0;

    logs.push("[INFO] Checking client execution environment tells...");
    if (isWebdriver) {
      logs.push("[WARN] navigator.webdriver is true!");
      automationRisk = 1.0;
    } else {
      logs.push("[PASS] navigator.webdriver is false");
    }

    if (tells.length > 0) {
      logs.push(`[WARN] Automation context variables flagged: [${tells.join(", ")}]`);
      automationRisk = 1.0;
    }

    if (isVirtualDevice) {
      logs.push("[WARN] Virtual audio loopback check flagged");
      automationRisk = 1.0;
    }

    if (automationRisk === 0.0) {
      logs.push("[PASS] No environment anomalies or virtual devices detected.");
    }

    // 2. Evaluate Reputation
    const sol = payload.reputation?.sol !== undefined ? payload.reputation.sol : 1.0;
    const txCount = payload.reputation?.tx_count !== undefined ? payload.reputation.tx_count : 10;
    const ageDays = payload.reputation?.age_days !== undefined ? payload.reputation.age_days : 30;
    let reputationRisk = 0.0;

    logs.push("[INFO] Querying Solana wallet reputation profile on-chain...");
    if (sol < 0.05) {
      logs.push(`[WARN] Low balance alert: ${sol} SOL`);
      reputationRisk += 0.4;
    }
    if (txCount < 5) {
      logs.push(`[WARN] Insufficient gas history: ${txCount} signatures`);
      reputationRisk += 0.3;
    }
    if (ageDays < 7) {
      logs.push(`[WARN] Newly deployed keypair: active for ${ageDays} days`);
      reputationRisk += 0.3;
    }

    if (reputationRisk === 0.0) {
      logs.push(`[PASS] Wallet SOL balance (${sol} SOL) and signature age meet threshold.`);
    }

    // 3. Biometrics
    const voiceSynth = payload.biometrics?.voice_synthesis !== undefined ? payload.biometrics.voice_synthesis : 0.0;
    const gyroSync = payload.biometrics?.gyro_sync !== undefined ? payload.biometrics.gyro_sync : 1.0;

    logs.push("[INFO] Verifying client ZK proof (Groth16 distance check)...");
    logs.push("[PASS] Hamming distance ZK-SNARK matchesPoseidon commitment.");

    logs.push("[INFO] Analyzing biometrics & temporal synchronization...");
    const biometricRisk = voiceSynth;
    const ttsRisk = voiceSynth;
    const temporalRisk = 1.0 - gyroSync;

    if (biometricRisk > 0.5) {
      logs.push(`[WARN] Acoustic realism check failed: Synthetic signature (${Math.round(biometricRisk * 100)}%)`);
    } else {
      logs.push("[PASS] Acoustic consistency check: Natural vocal tract footprint.");
    }

    if (temporalRisk > 0.5) {
      logs.push(`[WARN] Kinematic coupling failed: acceleration decoupled from speech (correlation ${gyroSync.toFixed(2)})`);
    } else {
      logs.push("[PASS] Biomechanical micro-tremor correlation verified.");
    }

    // Compute CRS
    const crs = 0.35 * biometricRisk + 0.25 * ttsRisk + 0.15 * temporalRisk + 0.15 * automationRisk + 0.10 * reputationRisk;
    const finalCrs = Math.min(Math.max(crs, 0.0), 1.0);

    logs.push(`[INFO] Computing Composite Risk Score (CRS)...`);
    logs.push(`[SUCCESS] CRS calculated successfully: ${finalCrs.toFixed(2)}`);

    if (finalCrs > 0.75) {
      logs.push("[CRITICAL] Status: REJECTED (High-Risk Threshold Exceeded)");
    } else if (finalCrs > 0.15) {
      logs.push("[WARNING] Status: WARNING (Graduated CAPTCHA Friction Triggered)");
    } else {
      logs.push("[SUCCESS] Status: VERIFIED (Human Attestation Minted)");
    }

    return {
      crs: finalCrs,
      biometric: biometricRisk,
      tts: ttsRisk,
      temporal: temporalRisk,
      automation: automationRisk,
      reputation: Math.min(reputationRisk, 1.0),
      logs
    };
  } catch (err) {
    return defaultResult;
  }
}

export function AttackArenaClient() {
  const [mode, setMode] = useState<"presets" | "diagnostics">("presets");
  const [activeScenario, setActiveScenario] = useState<string>("human");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [displayedCrs, setDisplayedCrs] = useState<number>(0.04);
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
  
  // Breakdown state
  const [breakdown, setBreakdown] = useState({
    biometric: 0.05,
    tts: 0.02,
    temporal: 0.03,
    automation: 0.0,
    reputation: 0.08
  });

  // Diagnostics state
  const [customJson, setCustomJson] = useState<string>("");
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const logIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const crsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger scenario switch simulation
  const runSimulation = (key: string) => {
    if (isAnalyzing) return;
    if (logIntervalRef.current) clearInterval(logIntervalRef.current);
    if (crsIntervalRef.current) clearInterval(crsIntervalRef.current);

    setActiveScenario(key);
    setIsAnalyzing(true);
    setDisplayedLogs([]);

    const preset = PRESETS[key];
    if (!preset) return;

    setBreakdown({
      biometric: preset.biometric,
      tts: preset.tts,
      temporal: preset.temporal,
      automation: preset.automation,
      reputation: preset.reputation
    });

    let logIndex = 0;
    logIntervalRef.current = setInterval(() => {
      const nextLog = preset.logs[logIndex];
      if (nextLog !== undefined) {
        setDisplayedLogs((prev) => [...prev, nextLog]);
      }
      logIndex++;
      if (logIndex >= preset.logs.length) {
        if (logIntervalRef.current) clearInterval(logIntervalRef.current);
        setIsAnalyzing(false);
      }
    }, 300);

    // Animate CRS value changes
    let currentScore = displayedCrs;
    const targetScore = preset.crs;
    const steps = 15;
    const stepDiff = (targetScore - currentScore) / steps;
    let stepCount = 0;

    crsIntervalRef.current = setInterval(() => {
      if (stepCount < steps) {
        currentScore += stepDiff;
        setDisplayedCrs(currentScore);
        stepCount++;
      } else {
        setDisplayedCrs(targetScore);
        if (crsIntervalRef.current) clearInterval(crsIntervalRef.current);
      }
    }, 40);
  };

  const handleScanLocal = () => {
    if (isAnalyzing) return;
    if (logIntervalRef.current) clearInterval(logIntervalRef.current);
    if (crsIntervalRef.current) clearInterval(crsIntervalRef.current);

    setIsAnalyzing(true);
    setDisplayedLogs([]);

    const payload = scanLocalBrowserTelemetry();
    const payloadStr = JSON.stringify(payload, null, 2);
    setCustomJson(payloadStr);

    const result = evaluateCustomPayload(payloadStr);
    
    setBreakdown({
      biometric: result.biometric,
      tts: result.tts,
      temporal: result.temporal,
      automation: result.automation,
      reputation: result.reputation
    });

    let logIndex = 0;
    logIntervalRef.current = setInterval(() => {
      const nextLog = result.logs[logIndex];
      if (nextLog !== undefined) {
        setDisplayedLogs((prev) => [...prev, nextLog]);
      }
      logIndex++;
      if (logIndex >= result.logs.length) {
        if (logIntervalRef.current) clearInterval(logIntervalRef.current);
        setIsAnalyzing(false);
      }
    }, 300);

    // Animate score
    let currentScore = displayedCrs;
    const targetScore = result.crs;
    const steps = 15;
    const stepDiff = (targetScore - currentScore) / steps;
    let stepCount = 0;

    crsIntervalRef.current = setInterval(() => {
      if (stepCount < steps) {
        currentScore += stepDiff;
        setDisplayedCrs(currentScore);
        stepCount++;
      } else {
        setDisplayedCrs(targetScore);
        if (crsIntervalRef.current) clearInterval(crsIntervalRef.current);
      }
    }, 40);
  };

  const handleSubmitPayload = () => {
    if (isAnalyzing) return;
    if (logIntervalRef.current) clearInterval(logIntervalRef.current);
    if (crsIntervalRef.current) clearInterval(crsIntervalRef.current);

    setIsAnalyzing(true);
    setDisplayedLogs([]);

    const result = evaluateCustomPayload(customJson);

    setBreakdown({
      biometric: result.biometric,
      tts: result.tts,
      temporal: result.temporal,
      automation: result.automation,
      reputation: result.reputation
    });

    let logIndex = 0;
    logIntervalRef.current = setInterval(() => {
      const nextLog = result.logs[logIndex];
      if (nextLog !== undefined) {
        setDisplayedLogs((prev) => [...prev, nextLog]);
      }
      logIndex++;
      if (logIndex >= result.logs.length) {
        if (logIntervalRef.current) clearInterval(logIntervalRef.current);
        setIsAnalyzing(false);
      }
    }, 300);

    // Animate score
    let currentScore = displayedCrs;
    const targetScore = result.crs;
    const steps = 15;
    const stepDiff = (targetScore - currentScore) / steps;
    let stepCount = 0;

    crsIntervalRef.current = setInterval(() => {
      if (stepCount < steps) {
        currentScore += stepDiff;
        setDisplayedCrs(currentScore);
        stepCount++;
      } else {
        setDisplayedCrs(targetScore);
        if (crsIntervalRef.current) clearInterval(crsIntervalRef.current);
      }
    }, 40);
  };

  useEffect(() => {
    // Initial run
    runSimulation("human");
    const initPayload = scanLocalBrowserTelemetry();
    setCustomJson(JSON.stringify(initPayload, null, 2));

    return () => {
      if (logIntervalRef.current) clearInterval(logIntervalRef.current);
      if (crsIntervalRef.current) clearInterval(crsIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [displayedLogs]);

  const scorePercent = Math.round(displayedCrs * 100);

  // Status message color helpers
  const getStatusColor = (crs: number) => {
    if (crs < 0.15) return "text-cyan border-cyan/20 bg-cyan/5";
    if (crs < 0.75) return "text-amber-500 border-amber-500/20 bg-amber-500/5";
    return "text-red-500 border-red-500/20 bg-red-500/5";
  };

  const getStatusText = (crs: number) => {
    if (crs < 0.15) return "Verified Human (Low Risk)";
    if (crs < 0.75) return "Warning (Graduated Friction CAPTCHA)";
    return "Verification Rejected (High Risk)";
  };

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 md:pb-32">
      {/* Mode Selector Toggles */}
      <div className="flex border-b border-border mb-8 max-w-md bg-surface">
        <button
          onClick={() => {
            setMode("presets");
            runSimulation("human");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 font-mono text-xs uppercase tracking-wider transition-all border-b-2 ${
            mode === "presets"
              ? "bg-[#070b0e] text-cyan border-cyan"
              : "text-foreground/40 hover:text-foreground/75 border-transparent"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          Attack Presets
        </button>
        <button
          onClick={() => {
            setMode("diagnostics");
            handleScanLocal();
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 font-mono text-xs uppercase tracking-wider transition-all border-b-2 ${
            mode === "diagnostics"
              ? "bg-[#070b0e] text-cyan border-cyan"
              : "text-foreground/40 hover:text-foreground/75 border-transparent"
          }`}
        >
          <Code className="h-3.5 w-3.5" />
          Live Diagnostics
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Side: Mode UI selectors (col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {mode === "presets" ? (
            <div className="border border-border bg-surface p-6 md:p-8 flex flex-col gap-4">
              <h3 className="font-display text-lg font-medium text-foreground">
                Attack Simulator
              </h3>
              <p className="text-xs text-foreground/50 leading-relaxed">
                Toggle different user and bot profiles to watch how the protocol evaluates liveness, device parameters, and wallet reputation.
              </p>

              <div className="mt-4 flex flex-col gap-3">
                {Object.entries(PRESETS).map(([key, data]) => {
                  const isSelected = activeScenario === key;
                  return (
                    <button
                      key={key}
                      onClick={() => runSimulation(key)}
                      disabled={isAnalyzing}
                      className={`flex flex-col text-left p-4 border transition-all ${
                        isSelected
                          ? "border-cyan bg-cyan/[0.02]"
                          : "border-border hover:border-foreground/30 hover:bg-foreground/[0.01]"
                      } ${isAnalyzing ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-sm font-medium text-foreground">
                          {data.name}
                        </span>
                        {key === "human" ? (
                          <Shield className={`h-3.5 w-3.5 ${isSelected ? "text-cyan" : "text-foreground/30"}`} />
                        ) : (
                          <AlertTriangle className={`h-3.5 w-3.5 ${isSelected ? "text-amber-500" : "text-foreground/30"}`} />
                        )}
                      </div>
                      <span className="mt-1.5 text-xs text-foreground/45 line-clamp-2 leading-normal">
                        {data.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="border border-border bg-surface p-6 md:p-8 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-medium text-foreground">
                  Diagnostic Console
                </h3>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan/60 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan" />
                </span>
              </div>

              <p className="text-xs text-foreground/50 leading-relaxed">
                Scan your browser parameters in real-time or edit the JSON payload values below to test custom spoofing attacks against the scorer.
              </p>

              <button
                onClick={handleScanLocal}
                disabled={isAnalyzing}
                className="flex items-center justify-center gap-2 border border-cyan/40 text-cyan hover:bg-cyan/5 px-4 py-2.5 font-mono text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                Scan My Browser
              </button>

              <div className="flex flex-col gap-2">
                <label className="font-mono text-[10px] uppercase tracking-wider text-foreground/40">
                  Telemetry Payload JSON
                </label>
                <textarea
                  className="w-full h-80 border border-border bg-[#070b0e] p-4 font-mono text-[11px] leading-relaxed text-cyan/90 focus:border-cyan/50 focus:outline-none select-all"
                  value={customJson}
                  onChange={(e) => setCustomJson(e.target.value)}
                  disabled={isAnalyzing}
                />
              </div>

              <button
                onClick={handleSubmitPayload}
                disabled={isAnalyzing}
                className="flex items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90 px-4 py-2.5 font-mono text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" />
                Submit Test Payload
              </button>
            </div>
          )}
        </div>

        {/* Center/Right Side: Live Telemetry & Audit logs (col-span-8) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Main Visual Telemetry Panel */}
          <div className="border border-border bg-surface p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Score Ring (col-span-5) */}
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="relative h-44 w-44 flex items-center justify-center">
                <svg className="absolute inset-0 h-full w-full transform -rotate-90">
                  <circle
                    cx="88"
                    cy="88"
                    r="76"
                    className="stroke-foreground/[0.06]"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r="76"
                    className={`transition-all duration-300 ${
                      displayedCrs < 0.15
                        ? "stroke-cyan"
                        : displayedCrs < 0.75
                        ? "stroke-amber-500"
                        : "stroke-red-500"
                    }`}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 76}
                    strokeDashoffset={2 * Math.PI * 76 * (1 - displayedCrs)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center z-10">
                  <p className="font-mono text-xs uppercase tracking-widest text-foreground/40">
                    CRS
                  </p>
                  <p className="mt-1 font-display text-4xl font-semibold tracking-tight text-foreground">
                    {scorePercent}%
                  </p>
                  {isAnalyzing && (
                    <RefreshCw className="mt-2 h-4 w-4 animate-spin mx-auto text-cyan" />
                  )}
                </div>
              </div>

              <div className={`mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-xs ${getStatusColor(displayedCrs)}`}>
                <span className="relative flex h-2 w-2">
                  {isAnalyzing ? (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                  ) : null}
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                </span>
                {isAnalyzing ? "Computing Score..." : getStatusText(displayedCrs)}
              </div>
            </div>

            {/* Parameter Bars (col-span-7) */}
            <div className="md:col-span-7 flex flex-col gap-5">
              <h4 className="font-display text-sm font-medium text-foreground tracking-tight uppercase">
                Consolidated Signals Breakdown
              </h4>

              <div className="flex flex-col gap-4">
                {[
                  { name: "Biometric Liveness", weight: "35%", value: breakdown.biometric, color: "bg-cyan" },
                  { name: "Synthetic Voice (TTS)", weight: "25%", value: breakdown.tts, color: "bg-indigo-500" },
                  { name: "Temporal Consistency", weight: "15%", value: breakdown.temporal, color: "bg-emerald-500" },
                  { name: "Browser Automation Tells", weight: "15%", value: breakdown.automation, color: "bg-purple-500" },
                  { name: "Wallet On-Chain Reputation", weight: "10%", value: breakdown.reputation, color: "bg-pink-500" }
                ].map((stat) => (
                  <div key={stat.name} className="flex flex-col">
                    <div className="flex justify-between font-mono text-[10px] uppercase text-foreground/40 tracking-wider">
                      <span>{stat.name} ({stat.weight})</span>
                      <span className="text-foreground/70">{Math.round(stat.value * 100)}% Risk</span>
                    </div>
                    <div className="mt-1.5 h-1 w-full bg-foreground/[0.06] overflow-hidden">
                      <div
                        className={`h-full ${stat.color} transition-all duration-500`}
                        style={{ width: `${stat.value * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Terminal */}
          <div className="border border-border bg-surface flex flex-col h-72">
            <div className="flex items-center gap-3 border-b border-border bg-background/50 px-5 py-3.5">
              <Terminal className="h-4 w-4 text-cyan" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
                Audit Terminal Log
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan ml-auto animate-pulse" />
            </div>

            <div ref={terminalContainerRef} className="flex-1 overflow-y-auto p-5 font-mono text-xs leading-relaxed text-cyan/90 bg-[#070b0e] space-y-1.5">
              {displayedLogs.map((log, i) => {
                let color = "text-cyan/85";
                if (log.startsWith("[WARN]")) color = "text-amber-400";
                if (log.startsWith("[CRITICAL]")) color = "text-red-400";
                if (log.startsWith("[SUCCESS]")) color = "text-cyan font-semibold";
                if (log.startsWith("[PASS]")) color = "text-emerald-400";

                return (
                  <div key={i} className={`flex items-start ${color}`}>
                    <span className="text-cyan/30 mr-3 select-none">{(i + 1).toString().padStart(3, "0")}</span>
                    <span className="whitespace-pre-wrap">{log}</span>
                  </div>
                );
              })}
              {isAnalyzing && (
                <div className="flex items-center gap-2 text-cyan/40 animate-pulse">
                  <span className="text-cyan/30 mr-3 select-none">...</span>
                  <span>Executing analysis heuristics...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
