import type { ReactNode } from "react";
import { EntrosMark } from "@/components/layout/entros-mark";
import type { ProvenanceMetadata, VisualTemplateKind } from "./provenance";
import {
  isWholePixelMarkSize,
  VISUAL_THEME_PALETTES,
  type VisualTheme,
  type WholePixelMarkSize,
} from "./tokens";

export interface TemplateFrameProps {
  readonly kind: VisualTemplateKind;
  readonly categoryLabel: string;
  readonly title: string;
  readonly subtitle: string;
  readonly provenance: ProvenanceMetadata;
  readonly altText: string;
  readonly theme?: VisualTheme;
  readonly markSize?: WholePixelMarkSize;
  readonly showVisibleCaption?: boolean;
  readonly children: ReactNode;
}

export function TemplateFrame({
  kind,
  categoryLabel,
  title,
  subtitle,
  provenance,
  altText,
  theme = "dark",
  markSize = 36,
  showVisibleCaption = false,
  children,
}: TemplateFrameProps) {
  if (!isWholePixelMarkSize(markSize)) {
    throw new Error(`EntrosMark size must be a positive whole multiple of 18px: ${markSize}`);
  }

  const palette = VISUAL_THEME_PALETTES[theme];

  return (
    <figure
      role="figure"
      aria-label={provenance.subject}
      data-template-kind={kind}
      data-template-theme={theme}
      data-mark-size={markSize}
      className="m-0 w-full font-sans antialiased"
      style={{
        backgroundColor: palette.canvas,
        color: palette.foreground,
        padding: "20px",
        borderRadius: 0,
      }}
    >
      <div
        className="relative flex w-full flex-col justify-between gap-6 border p-5 sm:p-8"
        style={{
          backgroundColor: palette.surface,
          borderColor: palette.border,
          borderRadius: 0,
        }}
      >
        {/* Top accent hairline aligned flush with the square panel border. */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -1,
            left: -1,
            width: 120,
            height: 3,
            backgroundColor: palette.accentFill,
          }}
        />

        {/* Header: whole-pixel mark, wordmark, category label, and cluster state. */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex shrink-0 items-center justify-center"
              style={{
                width: markSize,
                height: markSize,
                color: palette.markBarColor,
              }}
            >
              <EntrosMark className="h-full w-full" />
            </span>
            <span
              className="font-mono text-xl font-medium tracking-[-0.02em] sm:text-2xl"
              style={{ color: palette.foreground }}
            >
              Entros
            </span>
            <span
              aria-hidden="true"
              className="hidden h-4 w-px sm:inline-block"
              style={{ backgroundColor: palette.border }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: palette.muted }}
            >
              {categoryLabel}
            </span>
          </div>

          <div
            className="inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-xs"
            style={{
              backgroundColor: palette.canvas,
              borderColor: palette.border,
              color: palette.accentText,
              borderRadius: 0,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                backgroundColor: palette.accentFill,
              }}
            />
            <span>{provenance.cluster}</span>
          </div>
        </header>

        {/* Title block */}
        <div className="space-y-3">
          <h2
            className="font-display text-2xl font-normal leading-[1.1] tracking-[-0.02em] sm:text-3xl lg:text-4xl"
            style={{ color: palette.foreground }}
          >
            {title}
          </h2>
          <div
            aria-hidden="true"
            style={{
              width: 48,
              height: 2,
              backgroundColor: palette.accentFill,
            }}
          />
          <p
            className="max-w-4xl text-sm leading-relaxed sm:text-base"
            style={{ color: palette.muted }}
          >
            {subtitle}
          </p>
        </div>

        {/* Diagram / card content */}
        <div className="w-full">{children}</div>

        {/* Mandatory provenance strip */}
        <footer
          className="space-y-3 border-t pt-4"
          style={{ borderColor: palette.border }}
        >
          <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <dt
                className="text-xs font-medium"
                style={{ color: palette.muted }}
              >
                Subject
              </dt>
              <dd className="mt-1 font-sans text-xs" style={{ color: palette.foreground }}>
                {provenance.subject}
              </dd>
            </div>
            <div>
              <dt
                className="text-xs font-medium"
                style={{ color: palette.muted }}
              >
                Source record
              </dt>
              <dd
                className="mt-1 break-words font-mono text-xs"
                style={{ color: palette.foreground }}
              >
                {provenance.sourceRecord}
              </dd>
            </div>
            <div>
              <dt
                className="text-xs font-medium"
                style={{ color: palette.muted }}
              >
                Capture / version
              </dt>
              <dd
                className="mt-1 font-mono text-xs"
                style={{ color: palette.foreground }}
              >
                {provenance.captureVersion}
              </dd>
            </div>
            <div>
              <dt
                className="text-xs font-medium"
                style={{ color: palette.muted }}
              >
                Denominator
              </dt>
              <dd
                className="mt-1 font-mono text-xs"
                style={{ color: palette.accentText }}
              >
                {provenance.sampleDenominator}
              </dd>
            </div>
            <div>
              <dt
                className="text-xs font-medium"
                style={{ color: palette.muted }}
              >
                Recorded
              </dt>
              <dd
                className="mt-1 font-mono text-xs"
                style={{ color: palette.foreground }}
              >
                {provenance.recordedDate}
              </dd>
            </div>
          </dl>

          <p
            className="px-3 py-2 text-xs leading-relaxed"
            style={{
              backgroundColor: palette.canvas,
              color: palette.muted,
            }}
          >
            <strong style={{ color: palette.foreground }}>Scope limits: </strong>
            {provenance.limitsNote}
          </p>
        </footer>
      </div>

      <figcaption
        className={showVisibleCaption ? "mt-3 text-xs leading-relaxed" : "sr-only"}
        style={showVisibleCaption ? { color: palette.muted } : undefined}
      >
        {altText}
      </figcaption>
    </figure>
  );
}
