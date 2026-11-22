import type { FlavorWheelNode } from '../../../domain/schemas';

/** SVG coordinate system of the wheel: a 600x600 viewBox centered at (300, 300). */
export const WHEEL_VIEWBOX = 600;
export const WHEEL_CENTER = WHEEL_VIEWBOX / 2;

export const WHEEL_RADII = {
  center: 72,
  outer: 296,
  /** Ring bounds when the whole wheel is shown (families, subfamilies, descriptors). */
  full: [72, 150, 222, 296],
  /** Ring bounds when a family is zoomed in (subfamilies, descriptors). */
  zoomed: [72, 168, 296],
} as const;

const TAU = Math.PI * 2;

export interface WheelSegment {
  readonly node: FlavorWheelNode;
  /** 0 = innermost visible ring. */
  readonly ring: number;
  /** Radians, clockwise from 12 o'clock. */
  readonly startAngle: number;
  readonly endAngle: number;
  readonly innerRadius: number;
  readonly outerRadius: number;
  /** 1-based position among its siblings (for `aria-posinset`). */
  readonly posInSet: number;
  readonly setSize: number;
}

/** Number of tier 3 descriptors under a node (1 for a descriptor). */
export function countDescriptors(node: FlavorWheelNode): number {
  if (node.children.length === 0) return 1;
  return node.children.reduce((sum, child) => sum + countDescriptors(child), 0);
}

/**
 * Lays out the visible rings. With no focus (or an id that is not a family) the 3-ring wheel
 * is returned; with a family id, only that branch fills 360 degrees in 2 rings.
 */
export function layoutWheel(
  tree: readonly FlavorWheelNode[],
  focusFamilyId: string | null | undefined,
): readonly WheelSegment[] {
  const family = focusFamilyId ? tree.find((node) => node.id === focusFamilyId) : undefined;
  const top = family ? family.children : tree;
  const bounds: readonly number[] = family ? WHEEL_RADII.zoomed : WHEEL_RADII.full;
  const depth = bounds.length - 1;
  const segments: WheelSegment[] = [];

  const place = (nodes: readonly FlavorWheelNode[], start: number, span: number, ring: number): void => {
    const total = nodes.reduce((sum, node) => sum + countDescriptors(node), 0);
    let angle = start;
    nodes.forEach((node, index) => {
      const width = (span * countDescriptors(node)) / total;
      segments.push({
        node,
        ring,
        startAngle: angle,
        endAngle: angle + width,
        innerRadius: bounds[ring] ?? 0,
        outerRadius: bounds[ring + 1] ?? 0,
        posInSet: index + 1,
        setSize: nodes.length,
      });
      if (ring + 1 < depth) place(node.children, angle, width, ring + 1);
      angle += width;
    });
  };

  place(top, 0, TAU, 0);
  return segments;
}

const round = (value: number): number => Math.round(value * 100) / 100;

function point(radius: number, angle: number): string {
  return `${round(WHEEL_CENTER + radius * Math.sin(angle))} ${round(WHEEL_CENTER - radius * Math.cos(angle))}`;
}

/** `d` attribute of an annular sector between two radii and two angles. */
export function arcPath(innerRadius: number, outerRadius: number, startAngle: number, endAngle: number): string {
  // A 360-degree arc has identical endpoints and would not render; stop just short of it.
  const end = endAngle - startAngle >= TAU - 1e-6 ? startAngle + TAU - 1e-4 : endAngle;
  const large = end - startAngle > Math.PI ? 1 : 0;
  return [
    `M${point(outerRadius, startAngle)}`,
    `A${outerRadius} ${outerRadius} 0 ${large} 1 ${point(outerRadius, end)}`,
    `L${point(innerRadius, end)}`,
    `A${innerRadius} ${innerRadius} 0 ${large} 0 ${point(innerRadius, startAngle)}`,
    'Z',
  ].join('');
}

export interface LabelPlacement {
  readonly x: number;
  readonly y: number;
  /** Degrees, for `rotate(rotation x y)`; never leaves the text upside down. */
  readonly rotation: number;
  readonly fontSize: number;
  readonly orientation: 'radial' | 'tangential';
  /** False when the estimated text does not fit the segment; the label is then not drawn. */
  readonly fits: boolean;
}

const INNER_RING_FONT = 13;
const OUTER_RING_FONT = 10.5;
const AVG_GLYPH_WIDTH = 0.52;
const MIN_RADIAL_ARC = 12;
const RADIAL_PADDING = 6;
const TANGENTIAL_PADDING = 10;

export function labelPlacement(segment: WheelSegment, label: string): LabelPlacement {
  const mid = (segment.startAngle + segment.endAngle) / 2;
  const midRadius = (segment.innerRadius + segment.outerRadius) / 2;
  const arcLength = (segment.endAngle - segment.startAngle) * midRadius;
  const thickness = segment.outerRadius - segment.innerRadius;
  const fontSize = segment.ring === 0 ? INNER_RING_FONT : OUTER_RING_FONT;
  const textLength = label.length * fontSize * AVG_GLYPH_WIDTH;
  const orientation = arcLength < textLength + TANGENTIAL_PADDING ? 'radial' : 'tangential';
  const fits = orientation === 'tangential' || (arcLength >= MIN_RADIAL_ARC && textLength <= thickness - RADIAL_PADDING);

  const degrees = (mid * 180) / Math.PI;
  let rotation: number;
  if (orientation === 'radial') {
    rotation = degrees - 90;
    if (mid > Math.PI) rotation += 180;
  } else {
    rotation = degrees;
    if (mid > Math.PI / 2 && mid < Math.PI * 1.5) rotation += 180;
  }

  return {
    x: round(WHEEL_CENTER + midRadius * Math.sin(mid)),
    y: round(WHEEL_CENTER - midRadius * Math.cos(mid)),
    rotation: round(rotation),
    fontSize,
    orientation,
    fits,
  };
}
