import { describe, expect, it } from 'vitest';
import { FLAVOR_WHEEL_TREE, getFlavorNodeById } from '../../../data/flavor-wheel';
import {
  WHEEL_RADII,
  arcPath,
  countDescriptors,
  labelPlacement,
  layoutWheel,
  type WheelSegment,
} from '../utils/wheel-geometry';

const TAU = Math.PI * 2;

function ring(segments: readonly WheelSegment[], index: number): readonly WheelSegment[] {
  return segments.filter((s) => s.ring === index);
}

function span(segments: readonly WheelSegment[]): number {
  return segments.reduce((sum, s) => sum + (s.endAngle - s.startAngle), 0);
}

describe('countDescriptors', () => {
  it('counts tier 3 leaves under a node', () => {
    const fruity = getFlavorNodeById('fruity');
    expect(fruity && countDescriptors(fruity)).toBe(14);
    const leaf = getFlavorNodeById('fruity.berry.blackberry');
    expect(leaf && countDescriptors(leaf)).toBe(1);
  });
});

describe('layoutWheel — full wheel', () => {
  const segments = layoutWheel(FLAVOR_WHEEL_TREE, null);

  it('lays out 9 families, 20 subfamilies and 59 descriptors in 3 rings', () => {
    expect(ring(segments, 0)).toHaveLength(9);
    expect(ring(segments, 1)).toHaveLength(20);
    expect(ring(segments, 2)).toHaveLength(59);
  });

  it('closes every ring at 360 degrees', () => {
    for (const index of [0, 1, 2]) {
      expect(span(ring(segments, index))).toBeCloseTo(TAU, 9);
    }
  });

  it('gives each node an angle proportional to its descriptors (Frutal = 14/59)', () => {
    const fruity = segments.find((s) => s.node.id === 'fruity');
    expect(fruity).toBeDefined();
    expect(fruity && fruity.endAngle - fruity.startAngle).toBeCloseTo((14 / 59) * TAU, 9);
  });

  it('nests children inside the angular range of their parent', () => {
    const berry = segments.find((s) => s.node.id === 'fruity.berry');
    const blackberry = segments.find((s) => s.node.id === 'fruity.berry.blackberry');
    expect(berry && blackberry).toBeTruthy();
    if (!berry || !blackberry) return;
    expect(blackberry.startAngle).toBeGreaterThanOrEqual(berry.startAngle - 1e-9);
    expect(blackberry.endAngle).toBeLessThanOrEqual(berry.endAngle + 1e-9);
  });

  it('exposes sibling position and set size', () => {
    const families = ring(segments, 0);
    expect(families.map((s) => s.posInSet)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(families.every((s) => s.setSize === 9)).toBe(true);
    const citrus = segments.find((s) => s.node.id === 'fruity.citrus');
    expect(citrus).toMatchObject({ posInSet: 3, setSize: 4 });
  });

  it('uses the 3-ring radii', () => {
    expect(ring(segments, 0)[0]).toMatchObject({ innerRadius: WHEEL_RADII.center, outerRadius: 150 });
    expect(ring(segments, 2)[0]).toMatchObject({ innerRadius: 222, outerRadius: WHEEL_RADII.outer });
  });
});

describe('layoutWheel — zoomed on a family', () => {
  const segments = layoutWheel(FLAVOR_WHEEL_TREE, 'fruity');

  it('shows the family branch in 2 rings: 4 subfamilies and 14 descriptors', () => {
    expect(ring(segments, 0).map((s) => s.node.id)).toEqual([
      'fruity.berry',
      'fruity.dried-fruit',
      'fruity.citrus',
      'fruity.stone-tropical',
    ]);
    expect(ring(segments, 1)).toHaveLength(14);
    expect(ring(segments, 2)).toHaveLength(0);
    expect(span(ring(segments, 0))).toBeCloseTo(TAU, 9);
    expect(span(ring(segments, 1))).toBeCloseTo(TAU, 9);
  });

  it('uses the 2-ring radii', () => {
    expect(ring(segments, 0)[0]).toMatchObject({ innerRadius: WHEEL_RADII.center, outerRadius: 168 });
    expect(ring(segments, 1)[0]).toMatchObject({ innerRadius: 168, outerRadius: WHEEL_RADII.outer });
  });

  it('falls back to the full wheel for an unknown or non-family focus', () => {
    expect(layoutWheel(FLAVOR_WHEEL_TREE, 'no-existe')).toHaveLength(88);
    expect(layoutWheel(FLAVOR_WHEEL_TREE, 'fruity.berry')).toHaveLength(88);
  });
});

describe('arcPath', () => {
  it('draws an annular sector with outer and inner arcs', () => {
    const d = arcPath(72, 150, 0, Math.PI / 2);
    expect(d.startsWith('M')).toBe(true);
    expect(d.match(/A/g)).toHaveLength(2);
    expect(d.endsWith('Z')).toBe(true);
  });

  it('sets the large-arc flag only for sectors wider than 180 degrees', () => {
    expect(arcPath(72, 150, 0, Math.PI / 2)).toContain(' 0 0 1 ');
    expect(arcPath(72, 150, 0, Math.PI * 1.5)).toContain(' 0 1 1 ');
  });

  it('renders a full ring without collapsing to an empty path', () => {
    const d = arcPath(72, 150, 0, TAU);
    expect(d).not.toContain('NaN');
    expect(d.match(/A/g)).toHaveLength(2);
  });
});

describe('labelPlacement', () => {
  const full = layoutWheel(FLAVOR_WHEEL_TREE, null);
  const zoomed = layoutWheel(FLAVOR_WHEEL_TREE, 'fruity');
  const find = (list: readonly WheelSegment[], id: string): WheelSegment => {
    const s = list.find((x) => x.node.id === id);
    if (!s) throw new Error(`missing ${id}`);
    return s;
  };

  it('fits a family label in the full wheel', () => {
    expect(labelPlacement(find(full, 'fruity'), 'Frutal').fits).toBe(true);
  });

  it('hides a long descriptor label that does not fit its ring', () => {
    expect(labelPlacement(find(full, 'sour-fermented.sour-acids.phosphoric-acid'), 'Ácido fosfórico extremadamente largo').fits).toBe(false);
  });

  it('places narrow labels radially and wide labels tangentially', () => {
    const narrow = labelPlacement(find(full, 'fruity.berry.blackberry'), 'Mora');
    const wide = labelPlacement(find(zoomed, 'fruity.berry'), 'Frutos rojos');
    expect(narrow.orientation).toBe('radial');
    expect(wide.orientation).toBe('tangential');
  });

  it('flips labels on the left half so they never read upside down', () => {
    for (const segment of full) {
      const placement = labelPlacement(segment, 'Ab');
      const normalized = ((placement.rotation % 360) + 360) % 360;
      expect(normalized > 90 && normalized < 270).toBe(false);
    }
  });

  it('uses 13 px on the inner ring and 10.5 px on outer rings', () => {
    expect(labelPlacement(find(full, 'fruity'), 'Frutal').fontSize).toBe(13);
    expect(labelPlacement(find(full, 'fruity.berry'), 'Frutos rojos').fontSize).toBe(10.5);
  });
});
