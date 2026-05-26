import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Code2, Download, Mail } from "lucide-react";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Press Kit",
  description:
    "Press kit for Entros Protocol. Logos, defensible numbers, descriptions, and public artifacts for journalists, podcasters, and ecosystem partners.",
  path: "/press",
});

const stats = [
  { value: "12s", label: "Verification time" },
  { value: "3", label: "Liveness signals" },
  { value: "On-chain", label: "Free dApp read" },
  { value: "Solana", label: "Native" },
];

const assets = [
  {
    name: "Primary mark",
    file: "/logos/Entros.png",
    format: "PNG · 500 × 500",
    note: "Used as the social card and favicon source. Solid background versions for light and dark in the same file.",
    previewClass: "bg-foreground/[0.04]",
  },
  {
    name: "Wordmark",
    file: "/logos/wordmark.svg",
    format: "SVG · scalable",
    note: "Text wordmark. Inherits currentColor — drop it on any background and set the parent text color.",
    previewClass: "bg-foreground/[0.04]",
  },
  {
    name: "Social card",
    file: "/logos/og-card.png",
    format: "PNG · 1200 × 630",
    note: "Open Graph card for sharing the project on X, LinkedIn, and link-preview platforms.",
    previewClass: "bg-foreground/[0.04]",
  },
];

const blurbs = [
  {
    length: "Short",
    chars: "1 line · 130 chars",
    text: "Entros is the temporal identity layer for Solana. Twelve seconds of voice, motion, and touch prove a returning human on any device.",
  },
  {
    length: "Medium",
    chars: "2 sentences · 290 chars",
    text: "Entros is the temporal identity layer for Solana. Voice, motion, and touch run through a zero-knowledge proof on the user's device; the resulting attestation lands on-chain in twelve seconds and any Solana app reads it for free.",
  },
  {
    length: "Long",
    chars: "3 sentences · 520 chars",
    text: "Entros is the temporal identity layer for Solana. The user proves they are a returning human through twelve seconds of voice, motion, and touch captured on-device, with raw biometric data never persisted and a zero-knowledge proof landing on-chain. The user's Trust Score compounds across re-verifications, and Agent Anchor binds AI operators on the 8004 registry to the verified humans behind them.",
  },
];

const artifacts = [
  {
    label: "GitHub organization",
    value: "github.com/entros-protocol",
    href: "https://github.com/entros-protocol",
  },
  {
    label: "SDK on npm",
    value: "@entros/pulse-sdk · @entros/verify",
    href: "https://www.npmjs.com/org/entros",
  },
  {
    label: "Devnet pilot",
    value: "entros.io/verify",
    href: "/verify",
  },
  {
    label: "Live protocol stats",
    value: "entros.io/stats",
    href: "/stats",
  },
  {
    label: "Security program",
    value: "entros.io/security",
    href: "/security",
  },
];

export default function Press() {
  return (
    <>
      {/* Hero — asymmetric: editorial left, stats panel right */}
      <section>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pt-32 pb-20 md:pt-40 md:pb-28 lg:grid-cols-9 lg:items-center lg:gap-10">
          <div className="lg:col-span-5">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/55">
              // PRESS KIT
            </span>

            <h1 className="mt-6 font-display text-5xl font-medium leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
              Direct answers<span className="text-cyan">.</span>
              <br />
              Downloadable assets<span className="text-cyan">.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-foreground/70 md:mt-8 md:text-lg">
              Brand marks, ready-to-paste descriptions of the protocol,
              and direct links to the live devnet, the source, and the
              security program. Built so a writer reaches the underlying
              truth in one click.
            </p>

            <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link
                href="#assets"
                className="
                  group inline-flex items-center justify-center gap-2
                  rounded-full bg-foreground px-6 py-3
                  text-sm font-medium text-background
                  transition-colors hover:bg-foreground/90
                "
              >
                Download assets
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="mailto:contact@entros.io"
                className="
                  group inline-flex items-center justify-center gap-2
                  rounded-full border border-foreground/20 px-6 py-3
                  text-sm font-medium text-foreground
                  transition-colors hover:border-foreground/40 hover:bg-foreground/5
                "
              >
                contact@entros.io
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Stat panel — 2×2 hairline grid */}
          <div className="lg:col-span-4">
            <div className="grid grid-cols-2 gap-px border border-border bg-border">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col justify-end bg-background p-7 md:p-10"
                >
                  <div className="font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl lg:text-6xl">
                    {stat.value}
                  </div>
                  <p className="mt-3 font-mono text-xs uppercase tracking-[0.15em] text-foreground/65">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Descriptions — short / medium / long for journalists to paste */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/55">
            // DESCRIPTIONS
          </span>

          <h2 className="mt-6 max-w-2xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Pick a length, paste it in<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
            Each description reads against the live devnet pilot. The
            numbers verify on Solana Explorer.
          </p>

          <div className="mt-16 space-y-px bg-border border-y border-border">
            {blurbs.map((blurb) => (
              <div
                key={blurb.length}
                className="grid grid-cols-1 gap-x-12 gap-y-4 bg-background p-8 md:grid-cols-[14rem_1fr] md:p-10"
              >
                <div>
                  <p className="font-display text-lg font-medium tracking-tight text-foreground md:text-xl">
                    {blurb.length}
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/65">
                    {blurb.chars}
                  </p>
                </div>
                <p className="text-base leading-relaxed text-foreground/70 md:text-lg">
                  {blurb.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Logo assets — preview cards with download links */}
      <section id="assets" className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/55">
            // BRAND ASSETS
          </span>

          <h2 className="mt-6 max-w-2xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Logos and marks<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
            Hold the wordmark&apos;s aspect ratio. Pair the cyan accent
            (#22D3E6) with the void or the cream from the site palette.
            Skip colored or photographic backgrounds.
          </p>

          <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-3">
            {assets.map((asset) => (
              <div
                key={asset.name}
                className="flex flex-col bg-background p-6 md:p-8"
              >
                <div
                  className={`flex h-48 items-center justify-center border border-border ${asset.previewClass}`}
                >
                  <Image
                    src={asset.file}
                    alt={asset.name}
                    width={140}
                    height={140}
                    className="max-h-[60%] max-w-[60%] object-contain"
                  />
                </div>

                <h3 className="mt-8 font-display text-xl font-medium tracking-tight text-foreground">
                  {asset.name}
                </h3>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/65">
                  {asset.format}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-foreground/60">
                  {asset.note}
                </p>

                <a
                  href={asset.file}
                  download
                  className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.15em] text-cyan transition-colors hover:text-foreground"
                >
                  Download
                  <Download className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Public artifacts */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/55">
            // PUBLIC ARTIFACTS
          </span>

          <h2 className="mt-6 max-w-2xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Verify the claims directly<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
            Source, packages, the live devnet, and the protocol stats are
            all open. A writer can run the demo, read the code, and read
            the on-chain state without asking us for access.
          </p>

          <ul className="mt-16 border border-border">
            {artifacts.map((artifact, i) => (
              <li
                key={artifact.label}
                className={`grid grid-cols-1 items-center gap-x-12 gap-y-3 px-6 py-6 md:grid-cols-[14rem_1fr_auto] md:px-8 ${
                  i < artifacts.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <p className="font-mono text-xs uppercase tracking-[0.15em] text-foreground/65">
                  {artifact.label}
                </p>
                <p className="font-mono text-sm text-foreground/80 md:text-base">
                  {artifact.value}
                </p>
                <a
                  href={artifact.href}
                  target={artifact.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    artifact.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.15em] text-cyan transition-colors hover:text-foreground"
                >
                  Open
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Contact */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5 lg:flex lg:flex-col lg:justify-center">
              <div className="lg:relative">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/55 lg:absolute lg:bottom-full lg:left-0 lg:mb-6 lg:whitespace-nowrap">
                  // CONTACT
                </span>

                <h2 className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05] lg:mt-0">
                  Reach the team<span className="text-cyan">.</span>
                </h2>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="border border-border">
                <div className="grid grid-cols-1 gap-4 border-b border-border p-6 md:grid-cols-[auto_1fr] md:gap-8 md:p-8">
                  <Mail
                    className="h-5 w-5 text-cyan"
                    strokeWidth={1.5}
                  />
                  <div>
                    <p className="font-display text-base font-medium tracking-tight text-foreground md:text-lg">
                      Press inquiries
                    </p>
                    <div className="mt-2">
                      <a
                        href="mailto:contact@entros.io"
                        className="font-mono text-sm text-cyan transition-colors hover:text-foreground md:text-base"
                      >
                        contact@entros.io
                      </a>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-[auto_1fr] md:gap-8 md:p-8">
                  <Code2
                    className="h-5 w-5 text-cyan"
                    strokeWidth={1.5}
                  />
                  <div>
                    <p className="font-display text-base font-medium tracking-tight text-foreground md:text-lg">
                      Engineering
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/65 md:text-base">
                      File issues, ask code questions, and start
                      integration conversations on GitHub. Every repo
                      under the org is public.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-32 text-center md:py-40">
          <h2 className="font-display text-4xl font-medium tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            Run the demo<span className="text-cyan">.</span>
            <br />
            Watch the chain<span className="text-cyan">.</span>
          </h2>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/verify"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full bg-foreground px-6 py-3
                text-sm font-medium text-background
                transition-colors hover:bg-foreground/90
              "
            >
              Try the demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/stats"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full border border-foreground/20 px-6 py-3
                text-sm font-medium text-foreground
                transition-colors hover:border-foreground/40 hover:bg-foreground/5
              "
            >
              Live protocol stats
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
