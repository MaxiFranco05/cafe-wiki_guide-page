import type { SvgStageDirective } from '../../../../domain/schemas/brewing.schema';
import { isPourOverVessel, type BrewVesselType } from './chamber-geometry';

export interface AgitatorProps {
  readonly agitator: SvgStageDirective['agitator'];
  readonly vesselType: BrewVesselType;
  readonly surfaceY: number;
}

/**
 * Renders tactile manual agitation primitives:
 * - `spoon_stir`: view-box anchored vortex arcs + surface-calibrated barista spoon
 *   (stays clear of filter collars & ground beds in pour-overs).
 * - `vessel_swirl`: subtle external directional arcs flanking the vessel.
 */
export function Agitator({ agitator, vesselType, surfaceY }: AgitatorProps) {
  if (agitator === 'none') {
    return null;
  }

  if (agitator === 'spoon_stir') {
    const pourOver = isPourOverVessel(vesselType);
    const stirY = pourOver ? 56 : Math.max(66, Math.min(108, Math.round(surfaceY)));
    const spoonTipY = pourOver ? 58 : Math.min(110, stirY + 2);
    const spoonTipX = pourOver ? 85 : 87;
    const arcR = pourOver ? 13 : 17;
    const spoonGroupClass =
      vesselType === 'beaker_french_press'
        ? 'svg-spoon-group svg-spoon-group--immersion'
        : 'svg-spoon-group';

    return (
      <g data-primitive="agitator" data-agitator="spoon_stir">
        <g className="svg-stir-vortex" style={{ transformOrigin: `80px ${stirY}px` }}>
          <path
            d={`M ${80 - arcR} ${stirY} A ${arcR} 4 0 0 1 ${80 + arcR * 0.65} ${stirY - 2.3}`}
            stroke="var(--svg-coffee-crema)"
            strokeOpacity={0.56}
            strokeWidth={1.35}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M ${80 + arcR} ${stirY} A ${arcR} 4 0 0 1 ${80 - arcR * 0.65} ${stirY + 2.3}`}
            stroke="var(--svg-water-stream)"
            strokeOpacity={0.44}
            strokeWidth={1.15}
            strokeLinecap="round"
            fill="none"
          />
        </g>

        <g className="svg-stir-vortex--inner" style={{ transformOrigin: `80px ${stirY}px` }}>
          <path
            d={`M ${80 - arcR * 0.55} ${stirY} A ${arcR * 0.55} 2.2 0 0 0 ${80 + arcR * 0.5} ${stirY + 1.3}`}
            stroke="var(--svg-vessel-stroke)"
            strokeOpacity={0.36}
            strokeWidth={0.95}
            strokeLinecap="round"
            fill="none"
          />
        </g>

        <g className={spoonGroupClass}>
          <line
            x1={pourOver ? 105 : 98}
            y1={15}
            x2={spoonTipX + 1.5}
            y2={spoonTipY - 1.2}
            stroke="var(--accent-gold)"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
          <ellipse
            cx={spoonTipX}
            cy={spoonTipY}
            rx={5.4}
            ry={3.4}
            transform={`rotate(-18 ${spoonTipX} ${spoonTipY})`}
            fill="var(--accent-gold)"
            stroke="var(--bg-canvas)"
            strokeWidth={0.85}
            opacity={0.95}
          />
        </g>
      </g>
    );
  }

  return (
    <g
      data-primitive="agitator"
      data-agitator="vessel_swirl"
      stroke="var(--accent-gold)"
      strokeWidth={1.9}
      strokeLinecap="round"
      fill="none"
    >
      <path d="M24 72 C16 84, 24 98, 42 102" />
      <polyline points="37 97 43 102 36 106" />
      <path d="M136 72 C144 84, 136 98, 118 102" />
      <polyline points="123 97 117 102 124 106" />
    </g>
  );
}
