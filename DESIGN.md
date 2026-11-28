---
version: alpha
name: Entros
description: Public B2B security storefront, developer documentation, and verification reference surfaces for Entros.
colors:
  primary: "#1A1A1F"
  field: "#FAFAF8"
  surface: "#F0F0EC"
  ink: "#1A1A1F"
  ink-muted: "#5A5A6A"
  accent-ink: "#007888"
  status-success: "#047857"
  status-warning: "#9A4D00"
  status-danger: "#B91C1C"
  dark-field: "#000000"
  dark-surface: "#121218"
  dark-ink: "#E8E6E0"
  dark-ink-muted: "#858595"
  dark-accent: "#22D3E6"
  dark-status-success: "#14F195"
  dark-status-warning: "#FFB800"
  dark-status-danger: "#FF3B3B"
  brand-mark: "#00E7FE"
typography:
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  heading:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: -0.02em
  code:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  none: 0px
spacing:
  unit: 4px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.field}"
    rounded: "{rounded.none}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
  body-text:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
  muted-text:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink-muted}"
  surface-muted:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-muted}"
  link:
    backgroundColor: "{colors.field}"
    textColor: "{colors.accent-ink}"
  surface-link:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.accent-ink}"
  light-success-text:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.status-success}"
  light-warning-text:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.status-warning}"
  light-danger-text:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.status-danger}"
  dark-button-primary:
    backgroundColor: "{colors.dark-ink}"
    textColor: "{colors.dark-field}"
    rounded: "{rounded.none}"
  dark-button-secondary:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-ink}"
    rounded: "{rounded.none}"
  dark-body-text:
    backgroundColor: "{colors.dark-field}"
    textColor: "{colors.dark-ink}"
  dark-muted-text:
    backgroundColor: "{colors.dark-field}"
    textColor: "{colors.dark-ink-muted}"
  dark-surface-muted:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-ink-muted}"
  dark-link:
    backgroundColor: "{colors.dark-field}"
    textColor: "{colors.dark-accent}"
  dark-surface-link:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-accent}"
  dark-success-text:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-status-success}"
  dark-warning-text:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-status-warning}"
  dark-danger-text:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-status-danger}"
  brand-signal:
    backgroundColor: "{colors.dark-field}"
    textColor: "{colors.brand-mark}"
---

## Overview

Register: Site. Reason: Engineering teams, CISOs, and integrators evaluate Entros voice-liveness infrastructure, inspect empirical benchmarks, and copy SDK quickstarts across marketing pages, documentation, and reference routes.

Thesis: The referent is a calibrated acoustic analyzer and hardware security front panel. The bold move is unrounded monochrome planes anchored by an 18 px pixel-grid mark, one active signal accent, and a single generative hex-profile hero waveform. The design refuses crypto-casino visual clutter, glowing text halos, decorative card borders, button outlines, drop shadows, gradients, and promotional hype.

Direction: Instrument. Reason: Monochrome square geometry, hairline glyphs, and tabular technical readouts communicate calibrated security instrumentation for B2B engineering buyers.

Global rules in force (from the owner's `design-md` skill, unless an exception below says otherwise):
- No shadows, gradients, glows, outlines or decorative glass on custom surfaces. Depth comes from surface steps and space. Keep visible borders strictly for user text inputs, internal table cell dividers, explicit selected-state outlines, keyboard focus rings and `forced-colors: active` fallbacks.
- No floating horizontal separator lines above footers or between sections. Separate with space or a surface step.
- No button outlines. Primary buttons take solid fill, and secondary buttons take a clean neutral surface step.
- Icons beside text align optically on the horizontal axis (even icon sizes plus `text-box: trim-both cap alphabetic` on single-line labels, verified by eye on rendered pixels).
- Reserve hover light-up effects strictly for clickable buttons, links and interactive controls. Never add hover highlights to static cards, panels, charts or non-interactive table rows.
- No eyebrows, kickers or announcement pills. Use sentence case. Allow all caps only for short codes of four characters or fewer.
- No em dashes in product copy. Keep interface text weight at 400 or more.
- Keep motion at 300ms or less, ease-out, two entrance groups at most, press scale 0.96, and a static version under reduced motion.
- Build mobile first from 320 to 2560px (web), in every theme the product ships. Meet WCAG 2.2 AA.

## Colors

Semantic colour tokens map to CSS custom properties in `src/app/globals.css`. Components consume semantic roles and never hard-code raw palette hex values or Tailwind hue classes such as `text-amber-500`.

- **Light theme:** Ground `{colors.field}`, stepped surface `{colors.surface}`, primary ink `{colors.ink}` (`16.59:1`), muted ink `{colors.ink-muted}` (`6.47:1` on ground, `5.92:1` on surface), and accent ink `{colors.accent-ink}` (`4.97:1` on ground, `4.55:1` on surface).
- **Dark theme:** Ground `{colors.dark-field}`, stepped surface `{colors.dark-surface}` (`#121218`, hover `#1B1B24`), primary ink `{colors.dark-ink}` (`16.83:1` on ground, `14.95:1` on surface), muted ink `{colors.dark-ink-muted}` (`5.79:1` on ground, `5.14:1` on surface), and accent `{colors.dark-accent}` (`11.53:1` on ground, `10.24:1` on surface).
- **Status text and icons:** Use `{colors.status-success}` (`5.25:1` / `4.80:1`), `{colors.status-warning}` (`5.85:1` / `5.35:1`), and `{colors.status-danger}` (`6.19:1` / `5.66:1`) in light mode. Use `{colors.dark-status-success}`, `{colors.dark-status-warning}`, and `{colors.dark-status-danger}` (`5.28:1` on `{colors.dark-surface}`) in dark mode. Pair every status colour with explicit text or a distinct glyph.
- **Brand signal:** Reserve `{colors.brand-mark}` strictly for the indicator square inside the `18 px` `EntrosMark` SVG. Never use `{colors.brand-mark}` or light `#0AADBC` (`2.60:1` on `{colors.field}`) for text, links, or status indicators that require `3:1` UI contrast.
- **Control borders (`>= 3:1` WCAG 1.4.11):** Decorative hairlines (`var(--color-border)`) fall below `1.2:1` and must never frame text inputs or interactive controls. Text inputs, selects, and table dividers require a dedicated control-border token (`--color-control-border`: `#767682` in light at `4.29:1` on `{colors.field}` and `3.92:1` on `{colors.surface}`, `#6E6E7D` in dark at `4.19:1` on `{colors.dark-field}` and `3.72:1` on `{colors.dark-surface}`).
- **High contrast and forced colours:** Support `@media (prefers-contrast: more)` by raising muted ink to primary ink, raising control borders above `4.5:1`, and thickening keyboard focus rings to `3px`. Support `@media (forced-colors: active)` with system borders (`ButtonText`, `CanvasText`) on all buttons, inputs, panels, and filled status blocks (`Highlight`).

## Typography

- **Display (`Geist`, `--font-geist`):** Page headlines and section titles at weight `400` to `500`, tight display leading (`1.02` to `1.15`), and `-0.02em` tracking from `24px` upward. Apply `text-wrap: balance` on every heading. Never chain `&nbsp;` tokens across words that overflow `320px` screens.
- **Body and UI (`Inter`, `--font-inter`):** Running prose, navigation links, buttons, and sentence-case labels at `14px` to `17px`, weight `400` to `500`, line height `1.5`. Keep body line length between `45` and `90` characters. Keep form input text at `16px` or larger on touch screens to prevent iOS zoom.
- **Monospace (`JetBrains Mono`, `--font-jetbrains`):** Code blocks, cryptographic hashes, contract addresses, program IDs, and tabular numeric readouts (`font-variant-numeric: tabular-nums`). The `Entros` wordmark uses `--font-wordmark` (`JetBrains Mono`, weight `500`) with a capital `E` and no trailing dot.
- **Floor, case, and weights:** Never render readable text below `12px`. Use sentence case everywhere. Allow all caps only for short technical acronyms of four characters or fewer (`SDK`, `MCP`, `API`, `SPL`, `SOL`, `PDF`, `DOI`, `RPC`). Never use font weights below `400`.

## Layout

- **Rhythm and scale:** Build on `{spacing.unit}` (`4px`) with an `8px` rhythm. Leave more whitespace outside a content group than inside it.
- **Containers and breakpoints:** Build mobile first from `320px` to `2560px` with zero horizontal page overflow or clipped text. Data tables and code blocks scroll inside their own keyboard-focusable containers (`tabIndex={0}` with `role="region"` and `aria-label`). Primary containers cap at `--wrap` (`1720px`) and `--wrap-narrow` (`1376px`) with fluid edge breathing `--breathe`. Desktop navigation transitions to the mobile sheet at the `navbar` breakpoint (`68.75rem`).
- **Sticky clearance:** Set `scroll-padding-top: 72px` on `html` so keyboard focus and anchor links never slide beneath the fixed floating navbar.
- **Section spacing:** Desktop vertical section padding runs `96px` to `208px`. Phone spacing scales to `48px` to `96px`.
- **Route isolation:** Marketing, documentation, `/token`, `/paper`, `/roadmap`, `/compare`, and `/case-studies/realms` stay outside `src/app/(app)/` and load zero Solana wallet-adapter or Pulse provider bundles.

## Elevation & Depth

- Separate sections, callouts, archival banners, and maintenance notices using tonal surface steps (`{colors.field}` to `{colors.surface}`, `{colors.dark-field}` to `{colors.dark-surface}`) and whitespace.
- Do not place box shadows, glows, gradients, floating `<hr>` / `border-t` section dividers, or decorative outlines around cards, panels, notices, or buttons.
- Floating overlays (navigation dropdowns, mobile sheets, dialogs) rise one surface step over an opaque dimmed backdrop without blurred glass (`backdrop-filter`).

## Shapes

- Every surface, button, callout, modal, input, and `fumadocs-ui` documentation control (including inline `<code>`, `<pre>`, and `<figure>` code blocks) uses `{rounded.none}` (`0px`).
- Never mix rounded pills, code chips, or cards with square controls in the same view.

## Motion & Micro-interaction

- **Timing:** Mechanical and immediate. Interactive state transitions run `120ms` to `160ms` on `cubic-bezier(0.23, 1, 0.32, 1)` and never exceed `300ms`. Never use `ease-in`, `transition: all`, or layout-property transitions (`letter-spacing`, `height`, `width`).
- **Load path and scroll:** Nothing on the load path waits for an animation. Render the `Entros` wordmark immediately without scramble delays. Never hide below-the-fold images at `opacity: 0` (`RiseIn`) or start numeric readouts at `0` (`Counter`).
- **Properties:** Animate `transform` and `opacity` for movement. Hover and focus may transition colour and background. Press scale is `0.96` where used.
- **Reduced motion:** Every animated element and icon nudge provides an immediate static fallback under `@media (prefers-reduced-motion: reduce)` (`motion-reduce:transition-none motion-reduce:transform-none`).
- **Signature moment:** `DriftWaveform` on `/` is the sole allowed signature moment on the site. It renders a static frame immediately under `prefers-reduced-motion: reduce` and never blocks input or first paint. All other routes carry no decorative motion loops.

## Voice & Content Strategy

- **Tone:** Empirical, direct, restrained.
- **Punctuation and grammar:** Active voice, sentence case, zero em dashes, zero promotional adjectives, and zero AI filler vocabulary.
- **Canonical naming:** Use one name per concept across every page (`Voice Liveness Verdict`, `AgentPermit`, `Adversarial Blind Bank`, `Entros Anchor`, `Token Record`, `Paired Liveness Lab`).
- **Tense discipline:** State present tense strictly for live, verified capabilities and on-chain facts. Frame unshipped models, hosted APIs, VPC sidecars, and scheduled transactions in future or in-progress tense.

## Components

- **Imagery stance:** Product UI, flat geometric line glyphs (`.entros-glyph` with `vector-effect: non-scaling-stroke`), and monochrome technical diagrams only. No lifestyle photography, stock art, or third-party promotional lockups.
- **Hero component:** `EntrosMark` drawn on an `18 px` grid (rendered at `18px` or whole-pixel multiples) with `currentColor` bars and the `{colors.brand-mark}` indicator block, paired on `/` with `DriftWaveform` and one solid-fill primary CTA.
- **Typographic signature:** Tabular monospace readouts (`JetBrains Mono`, `tabular-nums`) paired with sentence-case `Inter` labels and `Geist` display titles.
- **State signature:** A `2px` zero-blur keyboard `:focus-visible` ring (`{colors.accent-ink}` in light, `{colors.dark-accent}` in dark, `3px` under `prefers-contrast: more`) and flat square status cues always accompanied by text labels and `forced-colors` borders/fills.
- **Buttons:** One primary CTA per section using solid high-contrast fill (`{colors.primary}` with `{colors.field}` text in light, `{colors.dark-ink}` with `{colors.dark-field}` text in dark) plus `forced-colors:border forced-colors:border-[ButtonText]`. Secondary actions use a clean neutral surface step (`{colors.surface}` or `{colors.dark-surface}`) with zero borders or outlines. Minimum tap height is `44px` (`min-h-11`). Unify wallet connect buttons across `/verify` and `/dashboard` to one shared component style.
- **Forms:** Every field carries a visible label above it, `>= 16px` text on mobile, a `>= 3:1` control border, and a visible `:focus-visible` ring. Never disable submit buttons to signal empty input. Announce errors inline with `role="alert"`.
- **Documentation chrome (`/docs`):** Match `entros.io` identity (`EntrosMark` plus `Entros Docs`), inherit `globals.css` theme tokens and square `0px` code chips, keep sidebar section labels non-duplicated, show heading anchor buttons on keyboard focus and touch, and remove duplicate theme toggles.
- **Icons:** Use custom geometric line glyphs for domain concepts and `lucide-react` exclusively for interface controls (arrows, close, copy, menu). Align icons optically with single-line labels using even pixel sizes and `text-box: trim-both cap alphabetic`.

## Do's and Don'ts

- **Do** lead primary navigation and calls to action with B2B developer documentation, security proofs, and agent authorization workflows.
- **Do** keep archival and maintenance surfaces (`/token`, `/paper`, `/verify`, `/lab/paired-liveness`, devnet demos) reachable at HTTP `200` with calm surface-stepped status notices.
- **Don't** render crypto-casino visual clutter anywhere on `entros.io`: ban token flywheel diagrams, neon shimmer buttons, coin or ticker badges, glowing halos (`.text-glow-cyan`), animated hype backdrops, and co-branded launchpad lockups.
- **Don't** add borders around cards or buttons, shadows, `backdrop-blur-*` glass overlays, floating `<hr>` or `border-t` section dividers, eyebrow kickers, coloured side stripes (`border-l-2`/`border-l-4`), or hover highlights on static panels.
- **Exception (`three-typeface-split`):** `Geist` (display), `Inter` (body and UI), and `JetBrains Mono` (code, addresses, hashes, wordmark) provide a clear three-role typographic hierarchy inside the `Instrument` direction while keeping monospace strictly off prose and labels.
- **Exception (`square-geometry`):** All interactive controls, panels, inputs, and documentation code surfaces keep `{rounded.none}` (`0px`) to align with the `18 px` `EntrosMark` grid and the `Instrument` direction's square-key family.
- **Exception (`signature-moment`, `gradient`, `glow`):** `DriftWaveform` on `/` is permitted to use Canvas 2D linear washes and its subtle dark-mode contour bloom as the site's one signature generative visual, with an immediate static frame under `prefers-reduced-motion: reduce`. All other surfaces remain flat.
- **Exception (`functional-timer`, `long-duration`):** `.vc-close-timer` (`2500ms` linear drain bar on `/embed/verify-popup`) renders an active auto-close countdown rather than a UI transition, stops under `prefers-reduced-motion: reduce`, and is recorded in `.agents/design-check-baseline.json`.
- **Exception (`mobile-nav-menu`):** On the `Site` register below `1100px`, top-level navigation collapses into the `MobileNav` sheet instead of placing three to five links in a narrow `320px` floating header.
- **Exception (`verbatim-paper-archive`):** `src/content/paper.md` archives the 2026 paired-liveness research paper verbatim for Zenodo DOI citation integrity (`scripts/check-paper-sync.mjs`) and is recorded in `.agents/design-check-baseline.json`.
