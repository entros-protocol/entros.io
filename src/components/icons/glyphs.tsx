import type { ReactNode, SVGProps } from "react";

/**
 * Entros line glyphs. One geometric outline per concept on a 24-unit grid,
 * square caps and mitred joins to match the square UI, and one small dot
 * that always renders in the brand cyan. Lines take `currentColor`, so a
 * caller sets the line tone with a text colour and the dot stays cyan.
 *
 * Strokes do not scale with the icon size, so a 20px glyph and a 40px
 * glyph share the same hairline weight.
 */
export type GlyphProps = SVGProps<SVGSVGElement> & { strokeWidth?: number };

function Glyph({
  children,
  className,
  strokeWidth = 1.5,
  ...props
}: GlyphProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      className={className ? `entros-glyph ${className}` : "entros-glyph"}
      {...props}
    >
      {children}
    </svg>
  );
}

function Dot({ cx, cy, r = 1.4 }: { cx: number; cy: number; r?: number }) {
  return <circle cx={cx} cy={cy} r={r} stroke="none" style={{ fill: "var(--color-cyan)" }} />;
}

/** Voice, touch and motion: one signal line. */
export function SignalGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M3 12h3.5l2-5 3 10 3-8 1.5 3H19" />
      <Dot cx={20.5} cy={12} />
    </Glyph>
  );
}

/** Two sessions that overlap within bounds. */
export function ProofGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="3.5" y="3.5" width="11" height="11" />
      <rect x="9.5" y="9.5" width="11" height="11" />
      <Dot cx={12} cy={12} />
    </Glyph>
  );
}

/** A badge that stays with the wallet. */
export function AnchorGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="5" y="3.5" width="14" height="12" />
      <path d="M8.5 15.5v5l3.5-2 3.5 2v-5" />
      <Dot cx={12} cy={9.5} />
    </Glyph>
  );
}

/** Fingerprint drawn as nested square loops. */
export function PersonGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4 20V4h16v16" />
      <path d="M8 20V8h8v12" />
      <path d="M12 20v-6" />
      <Dot cx={12} cy={11.5} />
    </Glyph>
  );
}

export function ServerGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="4" y="4" width="16" height="7" />
      <rect x="4" y="13" width="16" height="7" />
      <path d="M13.5 7.5h3M13.5 16.5h3M7.5 16.5h.5" />
      <Dot cx={7.75} cy={7.5} r={1.2} />
    </Glyph>
  );
}

export function ShieldGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M12 3l8 3v7l-8 8-8-8V6z" />
      <Dot cx={12} cy={11} />
    </Glyph>
  );
}

export function DeviceGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="6.5" y="3" width="11" height="18" />
      <path d="M10.5 6h3" />
      <Dot cx={12} cy={17.5} r={1.2} />
    </Glyph>
  );
}

/** Nothing written to storage. */
export function StoreGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="4.5" y="4" width="15" height="16" />
      <path d="M4.5 9.5h15M4.5 14.5h15" />
      <Dot cx={8} cy={6.75} r={1.1} />
    </Glyph>
  );
}

/** A sealed file. */
export function SealedGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M5.5 3h9l4 4v14h-13z" />
      <path d="M14.5 3v4h4" />
      <rect x="9" y="12.5" width="6" height="5" />
      <path d="M10.5 12.5V10h3v2.5" />
      <Dot cx={12} cy={15} r={1.1} />
    </Glyph>
  );
}

export function HiddenGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M3 12l5-5h8l5 5-5 5H8z" />
      <path d="M4.5 19.5l15-15" />
      <Dot cx={12} cy={12} />
    </Glyph>
  );
}

export function LockGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="5" y="10" width="14" height="10.5" />
      <path d="M8 10V4.5h8V10" />
      <Dot cx={12} cy={15.25} />
    </Glyph>
  );
}

/** A fair share dropping to one wallet. */
export function DistributionGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M3.5 10L12 4l8.5 6z" />
      <path d="M3.5 10l6.5 7M20.5 10L14 17M12 10v7" />
      <rect x="9.5" y="17" width="5" height="4" />
      <Dot cx={12} cy={4} r={1.2} />
    </Glyph>
  );
}

export function BallotGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M9 11V3.5h6V11" />
      <rect x="4" y="11" width="16" height="9.5" />
      <path d="M7.5 11h9" />
      <Dot cx={12} cy={15.75} />
    </Glyph>
  );
}

export function AgentGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="4.5" y="8" width="15" height="12" />
      <path d="M12 8V5" />
      <path d="M9 12.5v2.5M15 12.5v2.5" />
      <Dot cx={12} cy={3.5} />
    </Glyph>
  );
}

export function GameGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="3" y="7.5" width="18" height="10" />
      <path d="M6.5 12.5h4M8.5 10.5v4" />
      <Dot cx={16} cy={12.5} />
    </Glyph>
  );
}

/** A framed work: creators and collections. */
export function WorkGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" />
      <path d="M3.5 17l6-6 4 4 2-2 5 5" />
      <Dot cx={15.5} cy={8.5} />
    </Glyph>
  );
}

export function VoiceGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="9" y="3" width="6" height="11" />
      <path d="M5.5 10.5v3.5L9 17.5h6l3.5-3.5v-3.5" />
      <path d="M12 17.5V21M9 21h6" />
      <Dot cx={12} cy={7} r={1.1} />
    </Glyph>
  );
}

/** Three motion axes from one point. */
export function MotionGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M12 12V3.5M12 12l7.5 4.5M12 12l-7.5 4.5" />
      <path d="M17 3.5h2.5V6" />
      <Dot cx={12} cy={12} />
    </Glyph>
  );
}

export function ExtractGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
      <path d="M7.5 12h7" />
      <Dot cx={17} cy={12} />
    </Glyph>
  );
}

export function HashGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M9 4v16M15 4v16M4 9h16M4 15h16" />
      <Dot cx={12} cy={12} />
    </Glyph>
  );
}

export function VerifiedGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="4" y="4" width="16" height="16" />
      <path d="M8 12.5l3 3 5-6" />
      <Dot cx={20} cy={4} r={1.2} />
    </Glyph>
  );
}

export function NetworkGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M12 5.5L6 17.5M12 5.5l6 12M7.5 19h9" />
      <rect x="4.5" y="17.5" width="3" height="3" />
      <rect x="16.5" y="17.5" width="3" height="3" />
      <Dot cx={12} cy={5} r={1.6} />
    </Glyph>
  );
}

export function ChartGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4 4v16h16" />
      <path d="M9 17v-4M13 17v-7M17 17V9" />
      <Dot cx={17} cy={5.5} r={1.2} />
    </Glyph>
  );
}

export function PeopleGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="5" y="4.5" width="5" height="5" />
      <path d="M3 19.5v-5h9v5" />
      <rect x="14.5" y="7" width="4" height="4" />
      <path d="M15 15h6v4.5" />
      <Dot cx={7.5} cy={7} r={1.1} />
    </Glyph>
  );
}

export function SourceGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M7 3.5v17" />
      <path d="M7 15l10-6V5.5" />
      <rect x="5.5" y="18.5" width="3" height="3" />
      <Dot cx={17} cy={4.5} r={1.4} />
    </Glyph>
  );
}

export function LiveGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="8" y="8" width="8" height="8" />
      <rect x="3.5" y="3.5" width="17" height="17" strokeDasharray="2 2.5" />
      <Dot cx={12} cy={12} />
    </Glyph>
  );
}

export function CodeGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M8 6.5L3 12l5 5.5M16 6.5l5 5.5-5 5.5" />
      <Dot cx={12} cy={12} />
    </Glyph>
  );
}

/** Fees landing in one place. */
export function FeeGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M9.5 11H4v9.5h16V11h-5.5" />
      <path d="M8 15.5h8" />
      <Dot cx={12} cy={5} />
    </Glyph>
  );
}

/** Pieces that fit together. */
export function BuildGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="4" y="12" width="8" height="8" />
      <rect x="12" y="12" width="8" height="8" />
      <rect x="8" y="4" width="8" height="8" />
      <Dot cx={12} cy={8} r={1.2} />
    </Glyph>
  );
}

export function KeyGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="3.5" y="8.5" width="7" height="7" />
      <path d="M10.5 12H20.5v3.5M16.5 12v2.5" />
      <Dot cx={7} cy={12} r={1.2} />
    </Glyph>
  );
}

/** Stake held behind a validator. */
export function StakeGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4 20.5h16" />
      <rect x="6" y="15.5" width="12" height="5" />
      <rect x="8" y="10.5" width="8" height="5" />
      <path d="M12 3.5v4" />
      <Dot cx={12} cy={13} r={1.1} />
    </Glyph>
  );
}

/** Weight passed from one holder to another. */
export function DelegateGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="3.5" y="9" width="6" height="6" />
      <rect x="14.5" y="9" width="6" height="6" />
      <path d="M9.5 12h4M11.5 10l2 2-2 2" />
      <Dot cx={17.5} cy={12} r={1.1} />
    </Glyph>
  );
}

/** Stacked capacity bands. */
export function TierGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4 20h16M6 15.5h12M8 11h8M10 6.5h4" />
      <Dot cx={12} cy={3.5} r={1.2} />
    </Glyph>
  );
}

/** A known-answer task hidden in the queue. */
export function BenchmarkGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" />
      <rect x="13.5" y="3.5" width="7" height="7" />
      <rect x="3.5" y="13.5" width="7" height="7" />
      <rect x="13.5" y="13.5" width="7" height="7" />
      <Dot cx={17} cy={17} r={1.3} />
    </Glyph>
  );
}

/** A penalty taken from the stake. */
export function SlashGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="4" y="9" width="16" height="11" />
      <path d="M6.5 4L17.5 15" />
      <Dot cx={6} cy={3.5} r={1.2} />
    </Glyph>
  );
}

/** Several receipts agreeing on one verdict. */
export function QuorumGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="3.5" y="3.5" width="4" height="4" />
      <rect x="16.5" y="3.5" width="4" height="4" />
      <rect x="10" y="16.5" width="4" height="4" />
      <path d="M7.5 7.5L12 12l4.5-4.5M12 12v4.5" />
      <Dot cx={12} cy={12} />
    </Glyph>
  );
}

export function LaunchGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M4 20.5h16" />
      <path d="M12 3.5l4 5v8H8v-8z" />
      <Dot cx={12} cy={11} r={1.2} />
    </Glyph>
  );
}

export function TreasuryGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M3.5 8.5L12 4l8.5 4.5" />
      <path d="M3.5 8.5h17M3.5 20h17" />
      <path d="M6.5 11v6M10.5 11v6M13.5 11v6M17.5 11v6" />
      <Dot cx={12} cy={6.5} r={1.1} />
    </Glyph>
  );
}

export function GaugeGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <path d="M3.5 17.5a8.5 8.5 0 0 1 17 0" />
      <path d="M12 17.5l4-6" />
      <path d="M3.5 20.5h17" />
      <Dot cx={12} cy={17.5} />
    </Glyph>
  );
}

/**
 * The Solana mark, unmodified, inset on the glyph grid. A filled mark at
 * full bleed reads far heavier than the line glyphs beside it, so it takes
 * about half the box.
 */
export function SolanaGlyph({ className, ...props }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <svg x="5.5" y="6.9" width="13" height="10.2" viewBox="0 0 397.7 311.7">
        <path d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5 c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z" />
        <path d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5 c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z" />
        <path d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4 c5.8,0,8.7-7,4.6-11.1L333.1,120.1z" />
      </svg>
    </svg>
  );
}

export function ToolGlyph(props: GlyphProps) {
  return (
    <Glyph {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" />
      <path d="M10.5 10.5l9 9" />
      <path d="M14 20.5h6.5V14" />
      <Dot cx={7} cy={7} r={1.2} />
    </Glyph>
  );
}
