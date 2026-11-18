import { memo, useEffect, useId, useState } from 'react';
import type { SvgStageDirective } from '../../../domain/schemas/brewing.schema';
import { t } from '../../../i18n';
import {
  Agitator,
  CoffeeBed,
  LiquidLevel,
  Plunger,
  PourStream,
  VesselClipDefs,
  VesselSilhouette,
  computeLiquidSurfaceY,
  interpolateLiquidFill,
} from './svg-primitives';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Subscribes safely to OS prefers-reduced-motion with jsdom/SSR fallback. */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    setPrefersReduced(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReduced(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }

    return undefined;
  }, []);

  return prefersReduced;
}

export interface ProceduralBrewSceneProps {
  readonly directive: SvgStageDirective;
  readonly progress?: number;
  readonly reducedMotion?: boolean;
  readonly ariaLabel?: string;
  readonly className?: string;
}

/**
 * Memoized procedural SVG brew extraction stage driven strictly by `SvgStageDirective` + `progress`.
 * Combines geometry clipping, GPU-safe liquid fill translation, pour streams, grounds turbulence,
 * mechanical plungers, and manual agitation while honoring `prefers-reduced-motion`.
 */
export const ProceduralBrewScene = memo(function ProceduralBrewScene({
  directive,
  progress = 1,
  reducedMotion,
  ariaLabel,
  className,
}: ProceduralBrewSceneProps) {
  const osReducedMotion = usePrefersReducedMotion();
  const effectiveReducedMotion = reducedMotion ?? osReducedMotion;
  const safeId = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  const carafeClipId = `${safeId}-carafe`;
  const upperClipId = `${safeId}-upper`;
  const coffeeGradId = `${safeId}-coffee-grad`;
  const slurryGradId = `${safeId}-slurry-grad`;
  const cremaGradId = `${safeId}-crema-grad`;
  const aeropressTubeGradId = `${safeId}-aeropress-tube`;
  const glassSheenId = `${safeId}-glass-sheen`;

  const level = interpolateLiquidFill(
    directive.liquidFillStartRatio,
    directive.liquidFillEndRatio,
    progress,
  );
  const surfaceY = computeLiquidSurfaceY(directive.vesselType, level);
  const isSwirling = directive.agitator === 'vessel_swirl';

  const wrapperClass = [
    'procedural-svg-wrapper',
    isSwirling ? 'is-swirling' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={wrapperClass}
      data-reduced-motion={effectiveReducedMotion ? 'true' : 'false'}
    >
      <svg
        viewBox="0 0 160 168"
        fill="none"
        role="img"
        aria-label={ariaLabel ?? t('brew.timer.scene.ariaLabel')}
        className="w-full h-full max-w-[168px] max-h-[176px]"
        data-vessel={directive.vesselType}
        data-pour-stream={directive.pourStream}
        data-turbulence={directive.coffeeBedTurbulence}
        data-agitator={directive.agitator}
        data-plunger-state={directive.plungerState}
        data-liquid-level={level.toFixed(2)}
      >
        <defs>
          <VesselClipDefs
            vesselType={directive.vesselType}
            carafeClipId={carafeClipId}
            upperFilterClipId={upperClipId}
          />

          <linearGradient id={coffeeGradId} x1={80} y1={36} x2={80} y2={146} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--svg-coffee-liquid)" stopOpacity={0.95} />
            <stop offset="32%" stopColor="var(--svg-coffee-bed)" stopOpacity={0.98} />
            <stop offset="100%" stopColor="var(--bg-timer-deep)" />
          </linearGradient>

          <linearGradient id={slurryGradId} x1={80} y1={50} x2={80} y2={86} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--svg-coffee-liquid)" stopOpacity={0.82} />
            <stop offset="100%" stopColor="var(--svg-coffee-bed)" stopOpacity={0.96} />
          </linearGradient>

          <linearGradient id={cremaGradId} x1={80} y1={30} x2={80} y2={48} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--text-primary)" stopOpacity={0.92} />
            <stop offset="55%" stopColor="var(--svg-coffee-crema)" />
            <stop offset="100%" stopColor="var(--accent-primary)" />
          </linearGradient>

          <linearGradient
            id={aeropressTubeGradId}
            x1={56}
            y1={0}
            x2={104}
            y2={0}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="var(--svg-vessel-stroke)" stopOpacity={0.16} />
            <stop offset="22%" stopColor="var(--bg-elevated)" stopOpacity={0.72} />
            <stop offset="78%" stopColor="var(--bg-canvas)" stopOpacity={0.82} />
            <stop offset="100%" stopColor="var(--svg-vessel-stroke)" stopOpacity={0.12} />
          </linearGradient>

          <linearGradient id={glassSheenId} x1={34} y1={30} x2={126} y2={140} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--svg-vessel-stroke)" stopOpacity={0.14} />
            <stop offset="50%" stopColor="var(--svg-vessel-stroke)" stopOpacity={0.04} />
            <stop offset="100%" stopColor="var(--svg-vessel-stroke)" stopOpacity={0.1} />
          </linearGradient>
        </defs>

        <g clipPath={`url(#${carafeClipId})`}>
          <rect x={24} y={24} width={112} height={122} fill={`url(#${glassSheenId})`} />
        </g>

        <LiquidLevel
          vesselType={directive.vesselType}
          startRatio={directive.liquidFillStartRatio}
          endRatio={directive.liquidFillEndRatio}
          progress={progress}
          clipId={carafeClipId}
          gradientId={coffeeGradId}
          cremaGradientId={cremaGradId}
        />

        <CoffeeBed
          vesselType={directive.vesselType}
          turbulence={directive.coffeeBedTurbulence}
          pourStream={directive.pourStream}
          upperClipId={upperClipId}
          chamberClipId={carafeClipId}
          slurryGradientId={slurryGradId}
        />

        <PourStream
          vesselType={directive.vesselType}
          pourStream={directive.pourStream}
          surfaceY={surfaceY}
        />

        <Plunger
          vesselType={directive.vesselType}
          plungerState={directive.plungerState}
          progress={progress}
          aeropressTubeGradId={aeropressTubeGradId}
        />

        <VesselSilhouette vesselType={directive.vesselType} />

        <Agitator
          agitator={directive.agitator}
          vesselType={directive.vesselType}
          surfaceY={surfaceY}
        />
      </svg>
    </div>
  );
});
