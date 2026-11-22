import { VESSEL_CHAMBER_BOUNDS, type BrewVesselType } from './chamber-geometry';

/** Clamps a numeric ratio safely into the closed [0, 1] interval. */
export function clamp01(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
}

/** Linearly interpolates liquid fill height ratio for phase progress p ∈ [0, 1]. */
export function interpolateLiquidFill(
  startRatio: number,
  endRatio: number,
  progress: number,
): number {
  const safeStart = clamp01(startRatio);
  const safeEnd = clamp01(endRatio);
  const safeProgress = clamp01(progress);
  return clamp01(safeStart + (safeEnd - safeStart) * safeProgress);
}

/** Computes the Y coordinate (in the 160x168 viewBox) of the vessel liquid meniscus. */
export function computeLiquidSurfaceY(vesselType: BrewVesselType, level: number): number {
  const bounds = VESSEL_CHAMBER_BOUNDS[vesselType];
  const chamberSpan = bounds.bottom - bounds.top;
  return bounds.bottom - clamp01(level) * chamberSpan;
}

export interface LiquidLevelProps {
  readonly vesselType: BrewVesselType;
  readonly startRatio: number;
  readonly endRatio: number;
  readonly progress: number;
  readonly clipId: string;
  readonly gradientId: string;
  readonly cremaGradientId?: string;
}

/** Clipped vessel extraction liquid column with GPU translateY and seamless horizontal waves. */
export function LiquidLevel({
  vesselType,
  startRatio,
  endRatio,
  progress,
  clipId,
  gradientId,
  cremaGradientId,
}: LiquidLevelProps) {
  const level = interpolateLiquidFill(startRatio, endRatio, progress);
  const surfaceY = computeLiquidSurfaceY(vesselType, level);
  const translateY = Math.round(surfaceY - 40);
  const isEspresso = vesselType === 'portafilter_espresso';

  return (
    <g data-primitive="liquid-level" data-liquid-level={level.toFixed(2)}>
      <g clipPath={`url(#${clipId})`}>
        <g
          data-liquid-column="true"
          className="svg-liquid-fill-group"
          style={{ transform: `translateY(${translateY}px)` }}
        >
          <path
            className="svg-liquid-wave-back"
            d="M -20 39 Q 0 34 20 39 T 60 39 T 100 39 T 140 39 T 180 39 T 220 39 T 260 39 V 185 H -20 Z"
            fill="var(--svg-coffee-crema)"
            opacity={0.18}
          />
          <g className="svg-liquid-wave-front">
            <path
              d="M -20 40 Q 0 45 20 40 T 60 40 T 100 40 T 140 40 T 180 40 T 220 40 T 260 40 V 185 H -20 Z"
              fill={`url(#${gradientId})`}
            />
            {isEspresso && level > 0 ? (
              <path
                data-crema="true"
                d="M -20 40 Q 0 45 20 40 T 60 40 T 100 40 T 140 40 T 180 40 T 220 40 T 260 40 L 260 47 Q 240 50 220 47 T 180 47 T 140 47 T 100 47 T 60 47 T 20 47 T -20 47 Z"
                fill={cremaGradientId ? `url(#${cremaGradientId})` : 'var(--svg-coffee-crema)'}
                opacity={0.96}
              />
            ) : (
              <path
                d="M -20 40 Q 0 45 20 40 T 60 40 T 100 40 T 140 40 T 180 40 T 220 40 T 260 40 L 260 47 Q 240 50 220 47 T 180 47 T 140 47 T 100 47 T 60 47 T 20 47 T -20 47 Z"
                fill={cremaGradientId ? `url(#${cremaGradientId})` : 'var(--svg-coffee-crema)'}
                opacity={0.12}
              />
            )}
            <path
              d="M -20 40 Q 0 45 20 40 T 60 40 T 100 40 T 140 40 T 180 40 T 220 40 T 260 40"
              stroke="var(--svg-coffee-crema)"
              strokeWidth={1.8}
              strokeLinecap="round"
              fill="none"
              opacity={0.78}
            />
          </g>
        </g>
      </g>
    </g>
  );
}
