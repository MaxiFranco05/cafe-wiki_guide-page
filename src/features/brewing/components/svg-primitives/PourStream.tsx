import type { SvgStageDirective } from '../../../../domain/schemas/brewing.schema';
import { isPourOverVessel, type BrewVesselType } from './chamber-geometry';

export interface PourStreamProps {
  readonly vesselType: BrewVesselType;
  readonly pourStream: SvgStageDirective['pourStream'];
  readonly surfaceY: number;
}

/**
 * Translucent minimalist water/espresso stream primitive:
 * - Espresso renders dual crema streams + animated drops from the Y-spout.
 * - Gentle / Steady render soft translucent vertical cores + shimmer + surface impact ripple.
 * - Spiral renders calm helical sway calibrated to real liquid/slurry depth.
 */
export function PourStream({ vesselType, pourStream, surfaceY }: PourStreamProps) {
  if (pourStream === 'none') {
    return null;
  }

  if (vesselType === 'portafilter_espresso') {
    const spoutPositions = [71, 89] as const;
    return (
      <g data-primitive="pour-stream" data-pour-stream={pourStream}>
        {spoutPositions.map((x) => (
          <g key={x}>
            <line
              className="svg-pour-core"
              x1={x}
              y1={78}
              x2={x}
              y2={112}
              stroke="var(--svg-coffee-crema)"
              strokeWidth={2.4}
              strokeLinecap="round"
            />
            <line
              className="svg-pour-shimmer"
              x1={x}
              y1={78}
              x2={x}
              y2={112}
              stroke="var(--text-primary)"
              strokeWidth={1}
              strokeLinecap="round"
              opacity={0.65}
            />
          </g>
        ))}
        <circle className="svg-espresso-drop" cx={71} cy={96} r={2.2} fill="var(--accent-gold)" />
        <circle
          className="svg-espresso-drop svg-espresso-drop--delayed"
          cx={89}
          cy={96}
          r={2.2}
          fill="var(--accent-gold)"
        />
      </g>
    );
  }

  let targetY = 58;
  if (vesselType === 'beaker_french_press') {
    targetY = Math.max(66, Math.min(130, Math.round(surfaceY)));
  } else if (vesselType === 'cylinder_aeropress') {
    targetY = Math.max(66, Math.min(118, Math.round(surfaceY)));
  } else if (isPourOverVessel(vesselType)) {
    targetY = 58;
  }

  if (pourStream === 'spiral') {
    const span = targetY - 10;
    const ctrl1Y = Math.round(10 + span * 0.29);
    const ctrl2Y = Math.round(10 + span * 0.68);
    return (
      <g data-primitive="pour-stream" data-pour-stream="spiral">
        <g className="svg-pour-spiral-group" opacity={0.56}>
          <path
            className="svg-pour-spiral-path"
            d={`M80 10 C89 ${ctrl1Y}, 71 ${ctrl2Y}, 80 ${targetY}`}
            stroke="var(--svg-water-stream)"
            strokeWidth={2.6}
            strokeLinecap="round"
            fill="none"
          />
          <line
            x1={80}
            y1={10}
            x2={80}
            y2={targetY}
            stroke="var(--text-primary)"
            strokeWidth={0.9}
            strokeDasharray="3 5"
            strokeLinecap="round"
            opacity={0.28}
          />
        </g>
        <ellipse
          className="svg-impact-ripple"
          cx={80}
          cy={targetY}
          rx={10}
          ry={3.2}
          stroke="var(--svg-water-stream)"
          strokeWidth={1.3}
          fill="none"
          opacity={0.58}
        />
      </g>
    );
  }

  const isGentle = pourStream === 'gentle';
  const coreStrokeWidth = isGentle ? 2.2 : 3.4;
  const coreOpacity = isGentle ? 0.42 : 0.48;
  const shimmerStrokeWidth = isGentle ? 0.9 : 1.1;
  const shimmerOpacity = isGentle ? 0.52 : 0.6;
  const rippleRx = isGentle ? 6.5 : 8.5;

  return (
    <g data-primitive="pour-stream" data-pour-stream={pourStream}>
      <line
        className="svg-pour-core"
        x1={80}
        y1={10}
        x2={80}
        y2={targetY}
        stroke="var(--svg-water-stream)"
        strokeWidth={coreStrokeWidth}
        strokeLinecap="round"
        opacity={coreOpacity}
      />
      <line
        className={isGentle ? 'svg-pour-shimmer svg-pour-shimmer--gentle' : 'svg-pour-shimmer'}
        x1={80}
        y1={10}
        x2={80}
        y2={targetY}
        stroke="var(--text-primary)"
        strokeWidth={shimmerStrokeWidth}
        strokeLinecap="round"
        opacity={shimmerOpacity}
      />
      <ellipse
        className="svg-impact-ripple"
        cx={80}
        cy={targetY}
        rx={rippleRx}
        ry={2.6}
        stroke="var(--svg-water-stream)"
        strokeWidth={1.2}
        fill="none"
        opacity={0.62}
      />
    </g>
  );
}
