/**
 * Segment fills soften the catalog `colorHex` toward `--bg-canvas` with
 * `color-mix(in oklab, <hex> 78%, var(--bg-canvas))`.
 */
export const SEGMENT_MIX_PERCENT = 78;

/** CSS `fill` for a segment, swatch or accordion bar built from catalog color data. */
export function softenedFill(colorHex: string): string {
  return `color-mix(in oklab, ${colorHex} ${SEGMENT_MIX_PERCENT}%, var(--bg-canvas))`;
}

/**
 * Raw-color luminance above which dark labels (`--bg-canvas`) beat light ones
 * (`--text-primary`) on the softened fill. Calibrated against the 88 catalog colors
 * (light wins up to 0.2846, dark from 0.2890); `label-tone.test.ts` re-checks it.
 */
const DARK_LABEL_THRESHOLD = 0.287;

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of a `#RRGGBB` color; NaN for invalid input. */
export function relativeLuminance(hex: string): number {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return Number.NaN;
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

export type LabelTone = 'dark' | 'light';

/** Label tone with the higher contrast over the softened segment color. */
export function pickLabelTone(colorHex: string): LabelTone {
  const luminance = relativeLuminance(colorHex);
  return luminance > DARK_LABEL_THRESHOLD ? 'dark' : 'light';
}
