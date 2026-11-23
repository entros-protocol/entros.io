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
  dark-field: "#000000"
  dark-surface: "#0A0A0F"
  dark-ink: "#E8E6E0"
  dark-ink-muted: "#858595"
  dark-accent: "#22D3E6"
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
  brand-signal:
    backgroundColor: "{colors.dark-field}"
    textColor: "{colors.brand-mark}"
---

## Overview

Register: Site. Reason: Engineers, CISOs, and integrators evaluate Entros voice-liveness infrastructure, inspect empirical benchmarks, and copy SDK quickstarts across marketing pages, documentation, and reference routes.

Thesis: The referent is a calibrated acoustic analyzer and hardware security front panel. The bold move is unrounded monochrome planes anchored by a single 18 px pixel-grid mark and one active signal accent. The design refuses crypto-casino visual clutter, glowing text halos, decorative borders, drop shadows, gradients, and promotional hype.

Direction: Instrument. Reason: Entros's settled monochrome square geometry, hairline glyphs, and tabular technical readouts read as precision security instrumentation for B2B engineering buyers.

Global rules in force (from the owner's `design-md` skill, unless an exception below says otherwise):
- No shadows, gradients, glows, outlines or decorative glass on custom surfaces. Depth comes from surface steps and space. Keep visible borders strictly for user text inputs, internal table cell dividers, explicit selected-state outlines, keyboard focus rings and `forced-colors: active` fallbacks.
- No floating horizontal separator lines above footers or between sections; separate with space or a surface step.
- No button outlines: primary buttons take solid fill, secondary buttons take a clean neutral surface step.
- Icons beside text align optically on the horizontal axis (even icon sizes + `text-box: trim-both cap alphabetic;` on single-line labels, verified by eye on rendered pixels).
- Reserve hover light-up effects strictly for clickable buttons, links and interactive controls; never add hover highlights to static cards, panels, charts or non-interactive table rows.
- No eyebrows, kickers or announcement pills. Sentence case. No all caps beyond short codes.
- No em dashes in product copy. Interface text weight 400 or more.
- Motion 300ms or less, ease-out, two entrance groups at most, press scale 0.96, a static version under reduced motion.
- Mobile first from 320 to 2560px (web), or adaptive by size class, container width and Dynamic Type across supported iPhone, iPhone Duo and iPad sizes (native), in every theme the product ships. WCAG 2.2 AA.

## Colors

Semantic colour tokens map to CSS custom properties in `src/app/globals.css`. Components consume semantic roles and never hard-code raw palette hex values.

- **Light theme:** Primary field `{colors.field}`, stepped surface `{colors.surface}`, primary ink `{colors.ink}`, muted ink `{colors.ink-muted}`, and readable accent ink `{colors.accent-ink}`. Every text and surface pair meets WCAG 2.2 AA (`>= 4.5:1`).
- **Dark theme (default):** Primary field `{colors.dark-field}`, stepped surface `{colors.dark-surface}`, primary ink `{colors.dark-ink}`, muted ink `{colors.dark-ink-muted}`, and readable accent `{colors.dark-accent}`.
- **Brand signal:** `{colors.brand-mark}` is reserved strictly for the indicator block inside the `18 px` `EntrosMark` SVG (paired against `{colors.dark-field}` or adjacent to `currentColor` bars). Never use `{colors.brand-mark}` as body text on `{colors.field}` or `{colors.surface}`.
- **Accent discipline:** Use `{colors.accent-ink}` (light) and `{colors.dark-accent}` (dark) only for links, keyboard focus rings, terminal display punctuation, and active state indicators. Control borders for text inputs and table grid lines maintain at least `3:1` contrast against their ground via `var(--color-border)` / `var(--verification-focus-ring)`.

## Typography

- **Display (`Geist`, `--font-geist`):** Page headlines and section titles at weight `400` to `500`, tight display leading (`1.02` to `1.15`), and `-0.02em` tracking from `24px` upward. Apply `text-wrap: balance` on headings.
- **Body and UI (`Inter`, `--font-inter`):** Running prose, navigation links, buttons, and sentence-case labels at `14px` to `17px`, weight `400` to `500`, line height `1.5`. Keep line length between `45` and `90` characters.
- **Monospace (`JetBrains Mono`, `--font-jetbrains`):** Code blocks, cryptographic hashes, contract addresses, program IDs, and tabular numeric readouts (`font-variant-numeric: tabular-nums`). The `Entros` wordmark uses `--font-wordmark` (`JetBrains Mono`, weight `500`) with a capital `E` and no trailing dot.
- **Case and weights:** Use sentence case everywhere. Allow all-caps only for short technical acronyms of four characters or fewer (such as `SDK`, `MCP`, `API`, `SPL`, `SOL`, `PDF`, `DOI`, `RPC`). Never use font weights below `400`.

## Layout

- **Rhythm and scale:** Build on `{spacing.unit}` (`4px`) with an `8px` rhythm. Leave more whitespace outside a content group than inside it.
- **Containers and breakpoints:** Mobile-first from `320px` to `2560px` with zero horizontal page overflow (data tables and code blocks scroll inside their own keyboard-focusable containers). Primary containers cap at `--wrap` (`1720px`) and `--wrap-narrow` (`1376px`) with fluid edge breathing `--breathe`. Desktop navigation transitions to the mobile sheet at the `navbar` breakpoint (`68.75rem`).
- **Section spacing:** Desktop vertical section padding runs `96px` to `208px`; phone spacing scales to roughly half (`48px` to `96px`).
- **Route isolation:** Marketing, documentation, `/token`, `/paper`, `/roadmap`, and `/case-studies/realms` stay outside `src/app/(app)/` and load zero Solana wallet-adapter or Pulse provider bundles.

## Elevation & Depth

- Separate sections, callouts, archival banners, and maintenance notices using surface steps (`{colors.field}` to `{colors.surface}`, `{colors.dark-field}` to `{colors.dark-surface}`) and whitespace.
- Do not place box shadows, glows, gradients, or decorative borders around cards, panels, notices, or buttons on new or edited components.
- Floating overlays (navigation dropdowns, mobile sheets, dialogs) rise one surface step over a dimmed backdrop without blurred glass (`backdrop-filter`).

## Shapes

- Every surface, button, callout, modal, input, and `fumadocs-ui` documentation control uses `{rounded.none}` (`0px`).
- Never mix rounded pills or cards with square controls in the same view.

## Motion & Micro-interaction

- **Timing:** Mechanical and immediate. Interactive state transitions run `120ms` to `160ms` on `cubic-bezier(0.23, 1, 0.32, 1)` and never exceed `300ms`. Never use `ease-in` or `transition: all`.
- **Properties:** Animate `transform` and `opacity` for movement; hover and focus may transition colour and background. Press scale is `0.96` where used.
- **Reduced motion:** Every animated element provides an immediate static fallback under `@media (prefers-reduced-motion: reduce)`.
- **Texture and signature moment:** None on marketing, token, roadmap, and documentation surfaces.

## Voice & Content Strategy

- **Tone:** Empirical, direct, restrained.
- **Punctuation and grammar:** Active voice, sentence case, zero em dashes, zero promotional adjectives, and zero AI filler vocabulary.
- **Canonical naming:** Use one name per concept across every page (`Voice Liveness Verdict`, `AgentPermit`, `Adversarial Blind Bank`, `Entros Anchor`, `Token Record`, `Paired Liveness Lab`).
- **Tense discipline:** State present tense strictly for live, verified capabilities and on-chain facts. Frame unshipped models, hosted APIs, VPC sidecars, and scheduled transactions in future or in-progress tense.

## Components

- **Imagery stance:** Product UI, flat geometric line glyphs (`.entros-glyph` with `vector-effect: non-scaling-stroke`), and monochrome technical diagrams only. No lifestyle photography, stock art, or third-party promotional lockups.
- **Hero component:** `EntrosMark` drawn on an `18 px` grid (rendered at `18px` or whole-pixel multiples) with `currentColor` bars and the `{colors.brand-mark}` indicator block, paired with solid-fill primary actions.
- **Typographic signature:** Tabular monospace readouts (`JetBrains Mono`, `tabular-nums`) paired with sentence-case `Inter` labels and `Geist` display titles.
- **State signature:** A `2px` zero-blur keyboard `:focus-visible` ring (`{colors.accent-ink}` in light, `{colors.dark-accent}` in dark) and flat square status cues always accompanied by explicit text labels.
- **Buttons:** One primary CTA per section using solid high-contrast fill (`{colors.primary}` with `{colors.field}` text in light; `{colors.dark-ink}` with `{colors.dark-field}` text in dark). Secondary actions use a clean neutral surface step (`{colors.surface}` or `{colors.dark-surface}`) with zero borders or outlines.
- **Icons:** Use custom geometric line glyphs for domain concepts and `lucide-react` exclusively for interface controls (arrows, close, copy, menu). Align icons optically with single-line labels using even pixel sizes.

## Do's and Don'ts

- **Do** lead primary navigation and calls to action with B2B developer documentation, security proofs, and agent authorization workflows.
- **Do** keep archival and maintenance surfaces (`/token`, `/paper`, `/verify`, `/lab/paired-liveness`, devnet demos) reachable at HTTP `200` with calm surface-stepped status notices.
- **Don't** render crypto-casino visual clutter anywhere on `entros.io`: ban token flywheel diagrams, neon shimmer buttons (`ShimmerButton`), coin or ticker badges, glowing halos (`.text-glow-cyan`), animated hype backdrops (such as `AsciiFlow` on `/token`), and co-branded launchpad lockups.
- **Don't** add borders around cards or buttons, shadows (`dark:shadow-[...]`), `backdrop-blur-*` glass overlays, floating `<hr>` dividers, eyebrow kickers, coloured side stripes (`border-l-2`/`border-l-4`), or hover highlights on static panels in any new or edited component.
- **Exception (square geometry, `{rounded.none}`):** All interactive controls, panels, and `fumadocs-ui` documentation buttons stay `0px` square to align with the `18 px` `EntrosMark` grid within the `Instrument` direction's square-key family.
- **Exception (dark default theme):** `ThemeProvider` defaults to dark mode (`enableSystem={false}`) with a persistent light/dark toggle in the footer; both themes are maintained and verified to WCAG 2.2 AA.
- **Exception (legacy baseline):** Pre-existing code outside active edits is baselined via `design-check --write-baseline` so CI fails closed on any new `shadow`, `glass`, `glow`, `gradient`, `shimmer`, `floating-divider`, `side-stripe`, `light-weight`, `all-caps`, or `em-dash` breach in modified files.
