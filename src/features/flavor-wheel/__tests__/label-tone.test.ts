import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FLAVOR_NODES_BY_ID } from '../../../data/flavor-wheel';
import { pickLabelTone, relativeLuminance, SEGMENT_MIX_PERCENT } from '../utils/label-tone';

// Token values come from the approved design system, never from this test.
const tokensCss = readFileSync(resolve(__dirname, '../../../../design-system/tokens.css'), 'utf8');
function token(name: string): string {
  const match = tokensCss.match(new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!match?.[1]) throw new Error(`token ${name} not found`);
  return match[1];
}
const CANVAS = token('--bg-canvas');
const TEXT_PRIMARY = token('--text-primary');

function channels(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
}
function mixOverCanvas(hex: string): string {
  const p = SEGMENT_MIX_PERCENT / 100;
  const color = channels(hex);
  const canvas = channels(CANVAS);
  return `#${color
    .map((v, i) => Math.round(v * p + (canvas[i] ?? 0) * (1 - p)).toString(16).padStart(2, '0'))
    .join('')}`;
}
function contrast(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const COLORS = Object.values(FLAVOR_NODES_BY_ID).map((node) => ({ id: node.id, hex: node.colorHex }));

describe('pickLabelTone', () => {
  it('covers the 88 catalog colors', () => {
    expect(COLORS).toHaveLength(88);
  });

  it('always picks the tone with the higher contrast over the softened segment', () => {
    for (const { id, hex } of COLORS) {
      const segment = mixOverCanvas(hex);
      const onLight = contrast(segment, TEXT_PRIMARY);
      const onDark = contrast(segment, CANVAS);
      // Near ties (e.g. grapefruit, 4.13 vs 4.13) are equally good either way.
      if (Math.abs(onDark - onLight) < 0.05) continue;
      const best = onDark > onLight ? 'dark' : 'light';
      expect(pickLabelTone(hex), id).toBe(best);
    }
  });

  it('keeps at least 4.1:1 for every catalog color (the halo covers the rest of the gap to 4.5:1)', () => {
    for (const { id, hex } of COLORS) {
      const segment = mixOverCanvas(hex);
      const picked = pickLabelTone(hex) === 'dark' ? CANVAS : TEXT_PRIMARY;
      expect(contrast(segment, picked), id).toBeGreaterThanOrEqual(4.1);
    }
  });

  it('returns light for an invalid color instead of throwing', () => {
    expect(pickLabelTone('not-a-color')).toBe('light');
  });
});
