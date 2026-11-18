import type { SvgStageDirective } from '../../../../domain/schemas/brewing.schema';
import { isPourOverVessel, type BrewVesselType } from './chamber-geometry';

export interface CoffeeBedProps {
  readonly vesselType: BrewVesselType;
  readonly turbulence: SvgStageDirective['coffeeBedTurbulence'];
  readonly pourStream?: SvgStageDirective['pourStream'];
  readonly upperClipId?: string;
  readonly chamberClipId?: string;
  readonly slurryGradientId?: string;
}

/**
 * Renders the grounded coffee bed & slurry behavior calibrated per vessel architecture:
 * - Pour-overs render settled apex bed + shallow active upper-cone slurry ONLY when active.
 * - Immersion vessels render chamber bed with bloom bubbles / suspended slurry particles.
 * - Espresso keeps its puck enclosed inside the portafilter basket.
 */
export function CoffeeBed({
  vesselType,
  turbulence,
  pourStream = 'none',
  upperClipId,
  chamberClipId,
  slurryGradientId,
}: CoffeeBedProps) {
  if (vesselType === 'portafilter_espresso') {
    return (
      <g
        data-primitive="coffee-bed"
        data-turbulence={turbulence}
        data-enclosed-puck="true"
      />
    );
  }

  if (isPourOverVessel(vesselType)) {
    const bedY = 69;
    const showSlurry =
      pourStream !== 'none' ||
      turbulence === 'bubbling_bloom' ||
      turbulence === 'active_slurry';
    const slurryTop = turbulence === 'active_slurry' ? 56 : 60;

    return (
      <g data-primitive="coffee-bed" data-turbulence={turbulence}>
        <g clipPath={upperClipId ? `url(#${upperClipId})` : undefined}>
          {showSlurry ? (
            <g data-upper-slurry="true">
              <rect
                x={34}
                y={slurryTop}
                width={92}
                height={bedY - slurryTop + 2}
                fill={slurryGradientId ? `url(#${slurryGradientId})` : 'var(--svg-coffee-liquid)'}
                fillOpacity={slurryGradientId ? 1 : 0.85}
              />
              <path
                d={`M36 ${slurryTop} Q58 ${slurryTop - 2.5} 80 ${slurryTop} T124 ${slurryTop}`}
                stroke="var(--svg-coffee-crema)"
                strokeWidth={1.8}
                fill="none"
                opacity={0.88}
              />
            </g>
          ) : null}

          <rect x={36} y={bedY} width={88} height={17} fill="var(--svg-coffee-bed)" opacity={0.95} />
          <line
            x1={48}
            y1={bedY}
            x2={112}
            y2={bedY}
            stroke="var(--svg-coffee-crema)"
            strokeWidth={1.6}
            opacity={0.75}
          />
          <circle cx={71} cy={bedY + 6} r={1.4} fill="var(--svg-coffee-crema)" opacity={0.45} />
          <circle cx={80} cy={bedY + 9} r={1.5} fill="var(--svg-coffee-crema)" opacity={0.45} />
          <circle cx={89} cy={bedY + 5} r={1.4} fill="var(--svg-coffee-crema)" opacity={0.45} />

          {turbulence === 'bubbling_bloom' ? (
            <g>
              <circle
                data-bloom-bubble="true"
                className="svg-bloom-bubble"
                cx={70}
                cy={slurryTop + 2}
                r={2.8}
                fill="var(--svg-coffee-crema)"
                opacity={0.88}
              />
              <circle
                data-bloom-bubble="true"
                className="svg-bloom-bubble svg-bloom-bubble--2"
                cx={80}
                cy={slurryTop - 1}
                r={3.4}
                fill="var(--svg-coffee-crema)"
                opacity={0.92}
              />
              <circle
                data-bloom-bubble="true"
                className="svg-bloom-bubble svg-bloom-bubble--3"
                cx={90}
                cy={slurryTop + 2}
                r={2.6}
                fill="var(--svg-coffee-crema)"
                opacity={0.85}
              />
              <path
                d={`M56 ${slurryTop + 2} Q80 ${slurryTop - 4} 104 ${slurryTop + 2}`}
                stroke="var(--svg-coffee-crema)"
                strokeWidth={1.8}
                fill="none"
                opacity={0.88}
              />
            </g>
          ) : null}

          {turbulence === 'active_slurry' ? (
            <g className="svg-slurry-particle" fill="var(--svg-coffee-crema)" opacity={0.78}>
              <circle data-slurry-particle="true" cx={68} cy={slurryTop + 5} r={1.9} />
              <circle data-slurry-particle="true" cx={80} cy={slurryTop + 3} r={2.1} />
              <circle data-slurry-particle="true" cx={91} cy={slurryTop + 6} r={1.8} />
            </g>
          ) : null}
        </g>
      </g>
    );
  }

  const bedY = vesselType === 'beaker_french_press' ? 130 : 119;
  const bedHeight = vesselType === 'beaker_french_press' ? 14 : 12;

  return (
    <g data-primitive="coffee-bed" data-turbulence={turbulence}>
      <g clipPath={chamberClipId ? `url(#${chamberClipId})` : undefined}>
        <rect x={36} y={bedY} width={88} height={bedHeight} fill="var(--svg-coffee-bed)" opacity={0.94} />
        <circle cx={66} cy={bedY + 6} r={1.5} fill="var(--svg-coffee-crema)" opacity={0.45} />
        <circle cx={80} cy={bedY + 8} r={1.6} fill="var(--svg-coffee-crema)" opacity={0.45} />
        <circle cx={94} cy={bedY + 5} r={1.5} fill="var(--svg-coffee-crema)" opacity={0.45} />

        {turbulence === 'bubbling_bloom' ? (
          <g>
            <circle
              data-bloom-bubble="true"
              className="svg-bloom-bubble"
              cx={68}
              cy={bedY - 2}
              r={3.1}
              fill="var(--svg-coffee-crema)"
              opacity={0.88}
            />
            <circle
              data-bloom-bubble="true"
              className="svg-bloom-bubble svg-bloom-bubble--2"
              cx={80}
              cy={bedY - 5}
              r={3.8}
              fill="var(--svg-coffee-crema)"
              opacity={0.92}
            />
            <circle
              data-bloom-bubble="true"
              className="svg-bloom-bubble svg-bloom-bubble--3"
              cx={92}
              cy={bedY - 2}
              r={2.9}
              fill="var(--svg-coffee-crema)"
              opacity={0.85}
            />
            <path
              d={`M52 ${bedY} Q80 ${bedY - 7} 108 ${bedY}`}
              stroke="var(--svg-coffee-crema)"
              strokeWidth={2.1}
              fill="none"
              opacity={0.85}
            />
          </g>
        ) : null}

        {turbulence === 'active_slurry' ? (
          <g className="svg-slurry-particle" fill="var(--svg-coffee-crema)" opacity={0.75}>
            <circle data-slurry-particle="true" cx={64} cy={bedY - 11} r={2} />
            <circle data-slurry-particle="true" cx={78} cy={bedY - 17} r={2.3} />
            <circle data-slurry-particle="true" cx={94} cy={bedY - 9} r={1.9} />
            <circle data-slurry-particle="true" cx={85} cy={bedY - 5} r={1.7} />
          </g>
        ) : null}

        {turbulence === 'settled' ? (
          <line
            x1={44}
            y1={bedY}
            x2={116}
            y2={bedY}
            stroke="var(--svg-coffee-crema)"
            strokeWidth={1.9}
            opacity={0.85}
          />
        ) : null}
      </g>
    </g>
  );
}
