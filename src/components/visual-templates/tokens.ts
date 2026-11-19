export type VisualTheme = "dark" | "light";

export type WholePixelMarkSize = 18 | 36 | 54;

export const ENTROS_MARK_GRID_UNIT = 18;
export const ENTROS_MARK_BLOCK_COLOR = "#00E7FE";
export const VISUAL_TEMPLATE_WIDTH = 1600;
export const VISUAL_TEMPLATE_HEIGHT = 900;
export const VISUAL_TEMPLATE_ASPECT_RATIO = "16 / 9";
export const MIN_TEXT_CONTRAST_RATIO = 4.5;

export interface VisualThemePalette {
  readonly theme: VisualTheme;
  readonly canvas: string;
  readonly surface: string;
  readonly surfaceAlt: string;
  readonly foreground: string;
  readonly muted: string;
  readonly accentFill: string;
  readonly accentText: string;
  readonly greenFill: string;
  readonly greenText: string;
  readonly purpleFill: string;
  readonly purpleText: string;
  readonly warningFill: string;
  readonly warningText: string;
  readonly border: string;
  readonly borderStrong: string;
  readonly markBarColor: string;
  readonly markBlockColor: string;
}

export const VISUAL_THEME_PALETTES: Readonly<
  Record<VisualTheme, VisualThemePalette>
> = {
  dark: {
    theme: "dark",
    canvas: "#000000",
    surface: "#0A0A0F",
    surfaceAlt: "#14141C",
    foreground: "#E8E6E0",
    muted: "#858595",
    accentFill: "#00E7FE",
    accentText: "#22D3E6",
    greenFill: "#14F195",
    greenText: "#14F195",
    purpleFill: "#A855F7",
    purpleText: "#A855F7",
    warningFill: "#FFB800",
    warningText: "#FFB800",
    border: "rgba(232, 230, 224, 0.14)",
    borderStrong: "rgba(0, 231, 254, 0.42)",
    markBarColor: "#E8E6E0",
    markBlockColor: ENTROS_MARK_BLOCK_COLOR,
  },
  light: {
    theme: "light",
    canvas: "#FAFAF8",
    surface: "#F0F0EC",
    surfaceAlt: "#EEF1F3",
    foreground: "#1A1A1F",
    muted: "#5A5A6A",
    accentFill: "#0AADBC",
    accentText: "#007888",
    greenFill: "#059669",
    greenText: "#047857",
    purpleFill: "#7C3AED",
    purpleText: "#6D28D9",
    warningFill: "#D97706",
    warningText: "#9A4D00",
    border: "rgba(26, 26, 31, 0.12)",
    borderStrong: "rgba(10, 173, 188, 0.48)",
    markBarColor: "#1A1A1F",
    markBlockColor: ENTROS_MARK_BLOCK_COLOR,
  },
};

export function isWholePixelMarkSize(size: number): boolean {
  return (
    Number.isInteger(size) &&
    size >= ENTROS_MARK_GRID_UNIT &&
    size % ENTROS_MARK_GRID_UNIT === 0
  );
}

function relativeLuminance(hex: string): number {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid six-digit hex color: ${hex}`);
  }
  const channels = [0, 2, 4].map((offset) => {
    const channel = Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const r = channels[0] ?? 0;
  const g = channels[1] ?? 0;
  const b = channels[2] ?? 0;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foregroundHex: string, backgroundHex: string): number {
  const fgLum = relativeLuminance(foregroundHex);
  const bgLum = relativeLuminance(backgroundHex);
  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);
  return (lighter + 0.05) / (darker + 0.05);
}
