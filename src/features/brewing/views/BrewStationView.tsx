import React, { useId, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import type { BrewMethod, RecipeProfile } from '../../../domain/schemas';
import { calculateEspressoStyles, calculateScaledRecipe } from '../../../domain/brewing';
import { getMethodBySlug } from '../../../data/methods';
import { t } from '../../../i18n';
import { NotFoundView } from '../../../shared/components/NotFoundView';
import { Tooltip } from '../../../shared/components/Tooltip';
import { BrewControls } from '../components/BrewControls';
import { EspressoYieldCards } from '../components/EspressoYieldCards';
import { GrindRecommendationBadge } from '../components/GrindRecommendationBadge';
import { MethodVesselIcon } from '../components/MethodVesselIcon';
import { PhaseTimelinePreview } from '../components/PhaseTimelinePreview';
import { ProceduralBrewScene } from '../components/ProceduralBrewScene';
import { RangeWarningBanner } from '../components/RangeWarningBanner';
import { clamp01, interpolateLiquidFill } from '../components/svg-primitives';
import {
  formatBrewNumber,
  formatMinutesSeconds,
  formatPaddedClock,
  getMethodVesselType,
  parseSanitizedBrewInput,
  resolveInitialProfileId,
} from '../utils/brew-station.helpers';

interface BrewStationSessionProps {
  readonly method: BrewMethod;
  readonly initialProfileId: RecipeProfile['id'];
}

interface BrewSessionState {
  readonly profileId: RecipeProfile['id'];
  readonly coffeeInput: string;
  readonly waterInput: string;
  readonly selectedPhaseIndex: number;
  readonly previewProgress: number;
}

function buildDefaultState(
  method: BrewMethod,
  profileId: RecipeProfile['id']
): BrewSessionState {
  const defaultScaled = calculateScaledRecipe(method, profileId, {
    coffeeGrams: method.defaultDoseGrams,
  });

  return {
    profileId,
    coffeeInput: formatBrewNumber(method.defaultDoseGrams),
    waterInput: formatBrewNumber(defaultScaled.totalWaterMl),
    selectedPhaseIndex: 0,
    previewProgress: 1,
  };
}

const BrewStationSession: React.FC<BrewStationSessionProps> = ({
  method,
  initialProfileId,
}) => {
  const scrubberId = useId();
  const [state, setState] = useState<BrewSessionState>(() =>
    buildDefaultState(method, initialProfileId)
  );

  const isEspresso = method.scalingMode === 'espresso_yield_ratio';
  const parsedCoffee = parseSanitizedBrewInput(state.coffeeInput);
  const parsedWater = parseSanitizedBrewInput(state.waterInput);

  const activeCoffeeForEval = parsedCoffee.isValid ? parsedCoffee.value : 0;
  const activeRecipe = calculateScaledRecipe(method, state.profileId, {
    coffeeGrams: activeCoffeeForEval,
  });

  const espressoStyles = isEspresso
    ? calculateEspressoStyles(method, activeCoffeeForEval)
    : [];

  const activeProfile =
    method.profiles.find((profile) => profile.id === activeRecipe.profileId) ??
    method.profiles[0]!;

  const safePhaseIndex = Math.min(
    Math.max(0, state.selectedPhaseIndex),
    Math.max(0, activeRecipe.phases.length - 1)
  );
  const previewPhase = activeRecipe.phases[safePhaseIndex] ?? activeRecipe.phases[0]!;
  const previewFillPercent = Math.round(
    interpolateLiquidFill(
      previewPhase.svgDirective.liquidFillStartRatio,
      previewPhase.svgDirective.liquidFillEndRatio,
      state.previewProgress,
    ) * 100,
  );

  const isStartEnabled = isEspresso
    ? parsedCoffee.isValid
    : parsedCoffee.isValid && parsedWater.isValid;

  const vesselType = getMethodVesselType(method);

  const handleProfileChange = (nextProfileId: RecipeProfile['id']) => {
    const coffeeDose = parsedCoffee.isValid ? parsedCoffee.value : 0;
    const recalculated = calculateScaledRecipe(method, nextProfileId, {
      coffeeGrams: coffeeDose,
    });
    setState((prev) => ({
      ...prev,
      profileId: nextProfileId,
      waterInput: parsedCoffee.isValid
        ? formatBrewNumber(recalculated.totalWaterMl)
        : prev.waterInput,
      selectedPhaseIndex: Math.min(prev.selectedPhaseIndex, Math.max(0, recalculated.phases.length - 1)),
      previewProgress: 1,
    }));
  };

  const handleCoffeeChange = (rawValue: string) => {
    const nextCoffee = parseSanitizedBrewInput(rawValue);
    if (!nextCoffee.isValid) {
      setState((prev) => ({
        ...prev,
        coffeeInput: rawValue,
      }));
      return;
    }

    const recalculated = calculateScaledRecipe(method, state.profileId, {
      coffeeGrams: nextCoffee.value,
    });
    setState((prev) => ({
      ...prev,
      coffeeInput: rawValue,
      waterInput: formatBrewNumber(recalculated.totalWaterMl),
    }));
  };

  const handleWaterChange = (rawValue: string) => {
    const nextWater = parseSanitizedBrewInput(rawValue);
    if (!nextWater.isValid) {
      setState((prev) => ({
        ...prev,
        waterInput: rawValue,
      }));
      return;
    }

    const recalculated = calculateScaledRecipe(method, state.profileId, {
      waterMl: nextWater.value,
    });
    setState((prev) => ({
      ...prev,
      waterInput: rawValue,
      coffeeInput: formatBrewNumber(recalculated.coffeeGrams),
    }));
  };

  const handleSelectPhase = (nextIndex: number) => {
    const bounded = Math.max(0, Math.min(nextIndex, activeRecipe.phases.length - 1));
    setState((prev) => ({
      ...prev,
      selectedPhaseIndex: bounded,
      previewProgress: 1,
    }));
  };

  const handlePreviewProgressChange = (nextProgress: number) => {
    setState((prev) => ({
      ...prev,
      previewProgress: clamp01(nextProgress),
    }));
  };

  const handleReset = () => {
    setState(buildDefaultState(method, initialProfileId));
  };

  const formattedClock = formatPaddedClock(activeRecipe.totalDurationSeconds);
  const formattedPhaseInstruction = t(previewPhase.instructionKey, {
    waterGrams: formatBrewNumber(previewPhase.phaseWaterGrams),
    cumulativeWaterGrams: formatBrewNumber(previewPhase.targetCumulativeGrams),
  });

  return (
    <div className="space-y-6">
      {/* Clean Editorial Header */}
      <header className="space-y-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:text-text-primary transition-colors pressable focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-md py-1"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>{t('brew.backToCatalog')}</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-[12px] bg-dark-card border border-gold/35 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <MethodVesselIcon vesselType={vesselType} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary m-0 leading-tight">
                {t(method.nameKey)}
              </h1>
              <p className="text-sm text-text-secondary m-0 mt-1">
                {t('brew.stationSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono font-mono-tabular text-xs md:justify-end">
            <span key={activeProfile.referenceAuthor} className="text-text-secondary soft-blur-swap">
              {activeProfile.referenceAuthor}
            </span>
            <span aria-hidden="true" className="text-text-muted">
              •
            </span>
            <span className="font-semibold text-gold">
              {t('brew.waterTempBadge', {
                recommended: method.waterTempCelsius.recommended,
                min: method.waterTempCelsius.min,
                max: method.waterTempCelsius.max,
              })}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile-First Split Reloj Grid: Controls (1) -> Timer (2) -> Grind & Timeline (3) on <lg; Unified Sheet + Sticky Timer on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] lg:items-start gap-5 lg:gap-6">
        <div className="contents lg:col-start-1 lg:row-start-1 lg:block lg:bg-surface lg:border lg:border-border-subtle lg:rounded-[18px] lg:p-6 lg:space-y-5 lg:shadow-lg">
          {/* Controls + Non-Blocking Threshold Warnings */}
          <section className="order-1 bg-surface border border-border-subtle rounded-[18px] p-5 lg:bg-transparent lg:border-0 lg:rounded-none lg:p-0 space-y-4">
            {isEspresso ? (
              <EspressoYieldCards
                method={method}
                styles={espressoStyles}
                selectedStyleId={
                  activeRecipe.profileId === 'ristretto' ||
                  activeRecipe.profileId === 'lungo'
                    ? activeRecipe.profileId
                    : 'normale'
                }
                doseInput={state.coffeeInput}
                isDoseValid={parsedCoffee.isValid}
                onDoseChange={handleCoffeeChange}
                onStyleSelect={handleProfileChange}
              />
            ) : (
              <BrewControls
                method={method}
                recipe={activeRecipe}
                coffeeInput={state.coffeeInput}
                waterInput={state.waterInput}
                isCoffeeValid={parsedCoffee.isValid}
                isWaterValid={parsedWater.isValid}
                onProfileChange={handleProfileChange}
                onCoffeeChange={handleCoffeeChange}
                onWaterChange={handleWaterChange}
              />
            )}

            <RangeWarningBanner evaluation={activeRecipe.thresholdEvaluation} />
          </section>

          {/* Grind Tip & Extended Timeline */}
          <section className="order-3 bg-surface border border-border-subtle rounded-[18px] p-5 lg:bg-transparent lg:border-0 lg:rounded-none lg:p-0 space-y-4">
            <GrindRecommendationBadge grindTip={activeRecipe.grindTip} />
            <PhaseTimelinePreview
              phases={activeRecipe.phases}
              totalDurationSeconds={activeRecipe.totalDurationSeconds}
              totalWaterMl={activeRecipe.totalWaterMl}
              isEspresso={isEspresso}
              selectedPhaseIndex={safePhaseIndex}
              onSelectPhase={handleSelectPhase}
            />
          </section>
        </div>

        {/* Benchtop Live Timer Preview Panel */}
        <aside className="order-2 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-24 timer-panel-surface border border-border-subtle rounded-[18px] p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-xl">
          <div className="space-y-3 text-center">
            <div className="min-h-[164px] flex flex-col items-center justify-center gap-2.5 rounded-[14px] bg-canvas/55 border border-border-subtle/70 px-3 py-3">
              <ProceduralBrewScene
                directive={previewPhase.svgDirective}
                progress={state.previewProgress}
                className="w-[152px] h-[160px] sm:w-[168px] sm:h-[176px]"
              />
              <div className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[10px] bg-elevated/85 border border-border-subtle font-mono font-mono-tabular text-[11px] overflow-hidden">
                <label htmlFor={scrubberId} className="text-text-secondary shrink-0 whitespace-nowrap">
                  {t('brew.timer.scene.progressLabel')}
                </label>
                <input
                  id={scrubberId}
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={state.previewProgress}
                  aria-label={t('brew.timer.scene.progressLabel')}
                  onChange={(event) => handlePreviewProgressChange(Number.parseFloat(event.target.value))}
                  className="flex-1 min-w-0 cursor-pointer accent-[var(--accent-gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded"
                />
                <span className="text-[var(--svg-water-stream)] font-semibold shrink-0 whitespace-nowrap">
                  {t('brew.timer.scene.fillReadout', { percent: previewFillPercent })}
                </span>
              </div>
            </div>

            <div className="font-mono font-mono-tabular text-xs text-text-secondary">
              {isEspresso
                ? t('brew.timer.shotSummary', {
                    cumulative: formatBrewNumber(previewPhase.targetCumulativeGrams),
                  })
                : t('brew.timer.pourSummary', {
                    water: formatBrewNumber(previewPhase.phaseWaterGrams),
                    cumulative: formatBrewNumber(previewPhase.targetCumulativeGrams),
                  })}
            </div>

            <div className="font-mono font-mono-tabular text-[11px] font-bold text-gold uppercase tracking-wider min-h-[1.5em]">
              {t('brew.timer.phaseHeader', {
                current: safePhaseIndex + 1,
                total: activeRecipe.phases.length,
                title: t(previewPhase.titleKey),
                start: formatMinutesSeconds(previewPhase.startTimeSeconds),
                end: formatMinutesSeconds(previewPhase.endTimeSeconds),
              })}
            </div>

            {/* Smooth Sliding Phase Dots */}
            <div className="flex items-center justify-center gap-1.5 min-h-[16px]">
              {activeRecipe.phases.map((phase, idx) => {
                const isDotActive = idx === safePhaseIndex;
                return (
                  <button
                    key={phase.id}
                    type="button"
                    aria-label={t('brew.timer.phaseDotAria', {
                      index: idx + 1,
                      title: t(phase.titleKey),
                    })}
                    aria-current={isDotActive ? 'step' : undefined}
                    onClick={() => handleSelectPhase(idx)}
                    className={`h-[7px] rounded-full transition-[width,background-color] duration-200 ease-[var(--ease-out)] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus ${
                      isDotActive
                        ? 'w-6 bg-gold'
                        : 'w-[7px] bg-border-strong hover:bg-text-muted'
                    }`}
                  />
                );
              })}
            </div>

            {/* Flanked Tabular Clock Readout */}
            <div className="flex items-center justify-center gap-4 pt-1">
              <button
                type="button"
                aria-label={t('brew.timer.prevPhaseAria')}
                disabled={safePhaseIndex === 0}
                onClick={() => handleSelectPhase(safePhaseIndex - 1)}
                className="min-w-[44px] min-h-[44px] rounded-[11px] bg-elevated/85 border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-strong disabled:opacity-35 disabled:cursor-not-allowed pressable cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <div className="font-mono font-mono-tabular text-[48px] sm:text-[54px] font-bold tracking-tight text-text-primary leading-none">
                {formattedClock}
              </div>

              <button
                type="button"
                aria-label={t('brew.timer.nextPhaseAria')}
                disabled={safePhaseIndex >= activeRecipe.phases.length - 1}
                onClick={() => handleSelectPhase(safePhaseIndex + 1)}
                className="min-w-[44px] min-h-[44px] rounded-[11px] bg-elevated/85 border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-strong disabled:opacity-35 disabled:cursor-not-allowed pressable cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Compact Metric Telemetry with Confirmed Icons (1C, 1A, 1B) + HeroUI-Style Tooltip */}
            <div className="flex items-center justify-center flex-wrap gap-2.5 pt-1">
              <Tooltip content={t('brew.timer.tooltips.coffee')}>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] bg-elevated/80 border border-border-subtle text-xs font-mono font-mono-tabular text-text-primary cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="text-gold shrink-0"
                  >
                    <path d="M15.8 3.6c-3.5-1.4-8.1 1-10.2 5.4-2.1 4.4-1 9.1 2.4 10.6.4-.8 1.2-2.9 1.6-5.2.5-2.8 1.6-4.4 2.7-6 .7-1 1.6-2.2 3.5-4.8Zm2 1.2c-.8 1.7-1.7 3-2.5 4.2-1.1 1.6-1.9 2.9-2.4 5.4-.4 2.2-1 4.1-1.5 5.4 3.4-.3 6.9-2.8 8.5-6.4 1.6-3.5.7-7.1-2.1-8.6Z" />
                  </svg>
                  <span>{`${formatBrewNumber(activeRecipe.coffeeGrams)} ${t('brew.unitGrams')}`}</span>
                </button>
              </Tooltip>

              <Tooltip content={t('brew.timer.tooltips.water')}>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] bg-elevated/80 border border-border-subtle text-xs font-mono font-mono-tabular text-[var(--svg-water-stream)] cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.95"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="shrink-0"
                  >
                    <path d="M12 3.2S6 10.4 6 14.5a6 6 0 0 0 12 0c0-4.1-6-11.3-6-11.3Z" />
                  </svg>
                  <span>
                    {`${formatBrewNumber(activeRecipe.totalWaterMl)} ${
                      isEspresso ? t('brew.unitGrams') : t('brew.unitMl')
                    }`}
                  </span>
                </button>
              </Tooltip>

              <Tooltip content={t('brew.timer.tooltips.ratio')}>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] bg-elevated/80 border border-border-subtle text-xs font-mono font-mono-tabular text-gold cursor-help focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.95"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="shrink-0"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 12l4-4" />
                  </svg>
                  <span>{t('brew.ratioInline', { ratio: formatBrewNumber(activeRecipe.ratio) })}</span>
                </button>
              </Tooltip>
            </div>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed m-0 min-h-[3.2em] flex items-center justify-center px-2">
              {formattedPhaseInstruction}
            </p>
          </div>

          {/* Stacked Full-Width Benchtop Actions (>= 48px) */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              disabled={!isStartEnabled}
              className="w-full min-h-[50px] rounded-[12px] bg-accent hover:bg-accent-hover disabled:opacity-45 disabled:cursor-not-allowed text-text-on-accent font-semibold text-sm flex items-center justify-center gap-2 pressable shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
              <span>{t('brew.actionStart')}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full min-h-[50px] rounded-[12px] bg-elevated/90 hover:bg-surface text-text-primary border border-border-subtle hover:border-border-strong font-semibold text-sm flex items-center justify-center gap-2 pressable cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>{t('brew.actionReset')}</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export const BrewStationView: React.FC = () => {
  const { methodSlug } = useParams<{ methodSlug: string }>();
  const [searchParams] = useSearchParams();

  const method = methodSlug ? getMethodBySlug(methodSlug) : undefined;
  if (!method) {
    return <NotFoundView />;
  }

  const initialProfileId = resolveInitialProfileId(method, searchParams.get('profile'));

  return (
    <BrewStationSession
      key={`${method.id}:${initialProfileId}`}
      method={method}
      initialProfileId={initialProfileId}
    />
  );
};
