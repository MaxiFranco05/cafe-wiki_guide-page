import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import type { BrewMethod, BrewRecipe, RecipeProfile } from '../../../domain/schemas';
import type { BrewTimerStatus } from '../../../domain/timer';
import { calculateEspressoStyles, calculateScaledRecipe } from '../../../domain/brewing';
import { getMethodBySlug } from '../../../data/methods';
import { t } from '../../../i18n';
import { NotFoundView } from '../../../shared/components/NotFoundView';
import { rememberBrewMethod } from '../../../shared/hooks/useLastBrewMethod';
import { BrewControls } from '../components/BrewControls';
import { BrewTimer, type BrewTimerHandle } from '../components/BrewTimer';
import { EspressoYieldCards } from '../components/EspressoYieldCards';
import { GrindRecommendationBadge } from '../components/GrindRecommendationBadge';
import { MethodSwitcher } from '../components/MethodSwitcher';
import { MethodVesselIcon } from '../components/MethodVesselIcon';
import { PhaseTimelinePreview } from '../components/PhaseTimelinePreview';
import { RecipeLibraryControls } from '../components/RecipeLibraryControls';
import { useRecipeLibrary, type RecipeSessionConfig } from '../hooks/useRecipeLibrary';
import { RangeWarningBanner } from '../components/RangeWarningBanner';
import {
  formatBrewNumber,
  getMethodVesselType,
  parseSanitizedBrewInput,
  resolveInitialProfileId,
} from '../utils/brew-station.helpers';

interface BrewStationSessionProps {
  readonly method: BrewMethod;
  readonly initialProfileId: RecipeProfile['id'];
  /** `?recipe=<id>` deep link (C-14). */
  readonly queryRecipeId: string | null;
}

interface BrewSessionState {
  readonly profileId: RecipeProfile['id'];
  readonly coffeeInput: string;
  readonly waterInput: string;
  readonly selectedPhaseIndex: number;
}

function buildDefaultState(
  method: BrewMethod,
  profileId: RecipeProfile['id'],
  recipe: BrewRecipe
): BrewSessionState {
  const defaultScaled = calculateScaledRecipe(
    method,
    profileId,
    { coffeeGrams: method.defaultDoseGrams },
    recipe
  );

  return {
    profileId,
    coffeeInput: formatBrewNumber(method.defaultDoseGrams),
    waterInput: formatBrewNumber(defaultScaled.totalWaterMl),
    selectedPhaseIndex: 0,
  };
}

const LockIcon: React.FC = () => (
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
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const BrewStationSession: React.FC<BrewStationSessionProps> = ({
  method,
  initialProfileId,
  queryRecipeId,
}) => {
  // Read lazily by the recipe library when it persists a selection (dose + intensity of this session).
  const recipeSessionRef = useRef<RecipeSessionConfig>({
    coffeeGrams: method.defaultDoseGrams,
    profileId: initialProfileId,
  });
  const library = useRecipeLibrary(method, {
    queryRecipeId,
    session: () => recipeSessionRef.current,
  });
  const recipe = library.activeRecipe;
  const lockHintId = useId();
  const [state, setState] = useState<BrewSessionState>(() =>
    buildDefaultState(method, initialProfileId, recipe)
  );
  const [syncedRecipeId, setSyncedRecipeId] = useState(recipe.id);
  // Low-frequency live-run state only (status + phase index); per-tick state stays inside BrewTimer.
  const [timerStatus, setTimerStatus] = useState<BrewTimerStatus>('idle');
  const [livePhaseIndex, setLivePhaseIndex] = useState(0);
  const timerRef = useRef<BrewTimerHandle>(null);

  const isEspresso = method.scalingMode === 'espresso_yield_ratio';
  const isRecipeLocked = timerStatus === 'running' || timerStatus === 'paused';
  const isLive = timerStatus !== 'idle';
  const parsedCoffee = parseSanitizedBrewInput(state.coffeeInput);
  const parsedWater = parseSanitizedBrewInput(state.waterInput);

  const activeCoffeeForEval = parsedCoffee.isValid ? parsedCoffee.value : 0;
  recipeSessionRef.current = {
    coffeeGrams: parsedCoffee.isValid ? parsedCoffee.value : method.defaultDoseGrams,
    profileId: state.profileId,
  };

  // A different recipe became active (select / save / import / delete): keep the dose, recalc water.
  if (syncedRecipeId !== recipe.id) {
    setSyncedRecipeId(recipe.id);
    setState((prev) => ({
      ...prev,
      waterInput: parsedCoffee.isValid
        ? formatBrewNumber(
            calculateScaledRecipe(method, prev.profileId, { coffeeGrams: parsedCoffee.value }, recipe).totalWaterMl
          )
        : prev.waterInput,
      selectedPhaseIndex: 0,
    }));
  }

  const activeRecipe = calculateScaledRecipe(
    method,
    state.profileId,
    { coffeeGrams: activeCoffeeForEval },
    recipe
  );

  const espressoStyles = isEspresso
    ? calculateEspressoStyles(method, activeCoffeeForEval, recipe)
    : [];

  const safePhaseIndex = Math.min(
    Math.max(0, state.selectedPhaseIndex),
    Math.max(0, activeRecipe.phases.length - 1)
  );

  const isStartEnabled = isEspresso
    ? parsedCoffee.isValid
    : parsedCoffee.isValid && parsedWater.isValid;

  const vesselType = getMethodVesselType(method);

  const handleProfileChange = (nextProfileId: RecipeProfile['id']) => {
    const coffeeDose = parsedCoffee.isValid ? parsedCoffee.value : 0;
    const recalculated = calculateScaledRecipe(
      method,
      nextProfileId,
      { coffeeGrams: coffeeDose },
      recipe
    );
    setState((prev) => ({
      ...prev,
      profileId: nextProfileId,
      waterInput: parsedCoffee.isValid
        ? formatBrewNumber(recalculated.totalWaterMl)
        : prev.waterInput,
      selectedPhaseIndex: Math.min(prev.selectedPhaseIndex, Math.max(0, recalculated.phases.length - 1)),
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

    const recalculated = calculateScaledRecipe(
      method,
      state.profileId,
      { coffeeGrams: nextCoffee.value },
      recipe
    );
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

    const recalculated = calculateScaledRecipe(
      method,
      state.profileId,
      { waterMl: nextWater.value },
      recipe
    );
    setState((prev) => ({
      ...prev,
      waterInput: rawValue,
      coffeeInput: formatBrewNumber(recalculated.coffeeGrams),
    }));
  };

  const handleSelectPhase = useCallback(
    (nextIndex: number) => {
      const bounded = Math.max(0, Math.min(nextIndex, activeRecipe.phases.length - 1));
      setState((prev) => ({
        ...prev,
        selectedPhaseIndex: bounded,
      }));
    },
    [activeRecipe.phases.length]
  );

  const handleTimelineSelect = (index: number) => {
    if (isLive) {
      timerRef.current?.jumpTo(index);
    } else {
      handleSelectPhase(index);
    }
  };

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

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-[12px] bg-dark-card border border-gold/35 flex items-center justify-center shrink-0 shadow-sm">
              <MethodVesselIcon vesselType={vesselType} />
            </div>
            <div className="min-w-0">
              <MethodSwitcher currentSlug={method.id} isBrewInProgress={isRecipeLocked} />
              <p className="text-sm text-text-secondary m-0 mt-1">
                {t('brew.stationSubtitle')}
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <RecipeLibraryControls
              library={library}
              method={method}
              locked={isRecipeLocked}
              lockedHintId={lockHintId}
              referenceDoseGrams={parsedCoffee.isValid ? parsedCoffee.value : method.defaultDoseGrams}
            />
          </div>
        </div>
      </header>

      {/* Mobile order: Controls (1) -> Live timer (2) -> Grind & text timeline (3); unified sheet + sticky timer on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr] lg:items-start gap-5 lg:gap-6">
        <div className="contents lg:col-start-1 lg:row-start-1 lg:block lg:bg-surface lg:border lg:border-border-subtle lg:rounded-[18px] lg:p-6 lg:space-y-5 lg:shadow-lg">
          {/* Controls + Non-Blocking Threshold Warnings */}
          <section className="order-1 bg-surface border border-border-subtle rounded-[18px] p-5 lg:bg-transparent lg:border-0 lg:rounded-none lg:p-0 space-y-4">
            {isRecipeLocked && (
              <div className="brew-recipe-lock" role="status" id={lockHintId}>
                <LockIcon />
                <span>{t('brew.recipeLocked')}</span>
              </div>
            )}
            <div className={isRecipeLocked ? 'brew-recipe-locked' : undefined}>
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
                  disabled={isRecipeLocked}
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
                  disabled={isRecipeLocked}
                  intensityRatios={recipe.intensityRatios}
                />
              )}
            </div>

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
              onSelectPhase={handleTimelineSelect}
              liveState={
                isLive
                  ? { activeIndex: livePhaseIndex, completed: timerStatus === 'completed' }
                  : null
              }
            />
          </section>
        </div>

        {/* Live benchtop timer (variant B "Anillo de fase") */}
        <BrewTimer
          ref={timerRef}
          recipe={activeRecipe}
          isEspresso={isEspresso}
          isStartEnabled={isStartEnabled}
          previewPhaseIndex={safePhaseIndex}
          onPreviewPhaseChange={handleSelectPhase}
          onStatusChange={setTimerStatus}
          onActivePhaseChange={setLivePhaseIndex}
        />
      </div>
    </div>
  );
};

export const BrewStationView: React.FC = () => {
  const { methodSlug } = useParams<{ methodSlug: string }>();
  const [searchParams] = useSearchParams();

  const method = methodSlug ? getMethodBySlug(methodSlug) : undefined;

  useEffect(() => {
    if (method) rememberBrewMethod(method.id);
  }, [method]);

  if (!method) {
    return <NotFoundView />;
  }

  const initialProfileId = resolveInitialProfileId(method, searchParams.get('profile'));
  const queryRecipeId = searchParams.get('recipe');

  return (
    <BrewStationSession
      key={`${method.id}:${initialProfileId}:${queryRecipeId ?? ''}`}
      method={method}
      initialProfileId={initialProfileId}
      queryRecipeId={queryRecipeId}
    />
  );
};
