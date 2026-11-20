import type { SvgStageDirective } from '../../../../domain/schemas/brewing.schema';
import { clamp01 } from './LiquidLevel';
import { VESSEL_CHAMBER_BOUNDS, type BrewVesselType } from './chamber-geometry';

/** French press: rigid rod length so the knob stays in frame at the top and clears the lid at the bottom. */
const FRENCH_PRESS_ROD_LENGTH = 77;
const FRENCH_PRESS_MESH_TOP = 86;
const FRENCH_PRESS_MESH_BOTTOM = 128;
/** AeroPress: the seal rides on the liquid surface (4 px above it) so it never cuts into the coffee. */
const AEROPRESS_SEAL_OFFSET = 4;

export interface PlungerProps {
  readonly vesselType: BrewVesselType;
  readonly plungerState: SvgStageDirective['plungerState'];
  readonly progress: number;
  readonly aeropressTubeGradId?: string;
}

/**
 * Differentiated mechanical plunger primitive:
 * - `beaker_french_press`: lid remains anchored on rim (y=54); shaft + mesh descend cleanly.
 * - `cylinder_aeropress`: wide telescoping hollow smoked cylinder + silicone seal + mug drops on pressing.
 */
export function Plunger({
  vesselType,
  plungerState,
  progress,
  aeropressTubeGradId,
}: PlungerProps) {
  if (plungerState === 'none') {
    return null;
  }

  const p = clamp01(progress);

  if (vesselType === 'beaker_french_press') {
    let meshY = FRENCH_PRESS_MESH_TOP;
    if (plungerState === 'pressing') {
      meshY = FRENCH_PRESS_MESH_TOP + p * (FRENCH_PRESS_MESH_BOTTOM - FRENCH_PRESS_MESH_TOP);
    } else if (plungerState === 'down') {
      meshY = FRENCH_PRESS_MESH_BOTTOM;
    }

    const lidY = 54;
    const rodTopY = meshY - FRENCH_PRESS_ROD_LENGTH;
    const knobY = rodTopY - 4;

    return (
      <g
        data-primitive="plunger"
        data-plunger-kind="french-press"
        data-plunger-state={plungerState}
      >
        <line
          x1={80}
          y1={rodTopY}
          x2={80}
          y2={meshY - 1}
          stroke="var(--accent-gold)"
          strokeWidth={2.3}
          strokeLinecap="round"
        />
        <circle
          cx={80}
          cy={knobY}
          r={4}
          fill="var(--accent-gold)"
          stroke="var(--bg-canvas)"
          strokeWidth={1.3}
        />
        <rect
          data-french-press-lid="true"
          x={42}
          y={lidY}
          width={76}
          height={5}
          rx={2.5}
          fill="var(--bg-dark-card)"
          stroke="var(--accent-gold)"
          strokeWidth={1.7}
        />
        <rect
          data-french-press-mesh="true"
          x={49}
          y={meshY}
          width={62}
          height={3.6}
          rx={1.5}
          fill="var(--accent-gold)"
          stroke="var(--bg-canvas)"
          strokeWidth={0.8}
        />
        <line
          x1={52}
          y1={meshY + 5}
          x2={108}
          y2={meshY + 5}
          stroke="var(--svg-coffee-crema)"
          strokeWidth={1.2}
          strokeDasharray="3 2"
          opacity={0.75}
        />
      </g>
    );
  }

  if (vesselType === 'cylinder_aeropress') {
    // The chamber empties linearly while pressing (1 -> 0), so the seal tracks that surface.
    const chamber = VESSEL_CHAMBER_BOUNDS.cylinder_aeropress;
    const sealTop = chamber.top - AEROPRESS_SEAL_OFFSET;
    const sealBottom = chamber.bottom - AEROPRESS_SEAL_OFFSET;
    let sealY = sealTop;
    if (plungerState === 'pressing') {
      sealY = sealTop + p * (sealBottom - sealTop);
    } else if (plungerState === 'down') {
      sealY = sealBottom;
    }

    const bodyHeight = 52;
    const capY = sealY - bodyHeight;

    return (
      <g
        data-primitive="plunger"
        data-plunger-kind="aeropress"
        data-plunger-state={plungerState}
      >
        {/* Wide telescoping smoked hollow plunger cylinder */}
        <rect
          x={56}
          y={capY}
          width={48}
          height={bodyHeight}
          rx={1.5}
          fill={aeropressTubeGradId ? `url(#${aeropressTubeGradId})` : 'var(--bg-elevated)'}
          fillOpacity={aeropressTubeGradId ? 1 : 0.72}
          stroke="var(--svg-vessel-stroke)"
          strokeWidth={1.4}
        />
        <line
          x1={61}
          y1={capY + 4}
          x2={61}
          y2={sealY - 5}
          stroke="var(--svg-vessel-stroke)"
          strokeOpacity={0.28}
          strokeWidth={1}
        />
        <line
          x1={99}
          y1={capY + 4}
          x2={99}
          y2={sealY - 5}
          stroke="var(--svg-vessel-stroke)"
          strokeOpacity={0.2}
          strokeWidth={1}
        />
        {/* Flared top thumb press flange */}
        <rect
          x={51}
          y={capY - 5}
          width={58}
          height={5}
          rx={2}
          fill="var(--bg-dark-card)"
          stroke="var(--accent-gold)"
          strokeWidth={1.7}
        />
        {/* Beveled silicone rubber gasket seal */}
        <rect
          data-aeropress-seal="true"
          x={54}
          y={sealY - 4}
          width={52}
          height={8}
          rx={2.5}
          fill="var(--bg-dark-card)"
          stroke="var(--svg-vessel-stroke)"
          strokeWidth={1.6}
        />
        <line
          x1={58}
          y1={sealY}
          x2={102}
          y2={sealY}
          stroke="var(--accent-gold)"
          strokeWidth={1.1}
          opacity={0.72}
        />

        {plungerState === 'pressing' ? (
          <g>
            {/* External press guide arrows */}
            <g
              data-press-arrow="true"
              stroke="var(--accent-gold)"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            >
              <line x1={34} y1={72} x2={34} y2={92} />
              <polyline points="29 87 34 93 39 87" />
            </g>
            <g
              data-press-arrow="true"
              stroke="var(--accent-gold)"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            >
              <line x1={126} y1={72} x2={126} y2={92} />
              <polyline points="121 87 126 93 131 87" />
            </g>
            {/* Extraction drops falling from cap into receiving server */}
            <circle
              className="svg-espresso-drop"
              cx={74}
              cy={137}
              r={1.9}
              fill="var(--accent-gold)"
            />
            <circle
              className="svg-espresso-drop svg-espresso-drop--delayed"
              cx={86}
              cy={137}
              r={1.9}
              fill="var(--accent-gold)"
            />
          </g>
        ) : null}
      </g>
    );
  }

  return null;
}
