import React, { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import type { ScaledRecipeResult } from '../../../domain/brewing';
import type { BrewTimerStatus } from '../../../domain/timer';
import { t } from '../../../i18n';
import { useBrewTimer, type BrewTimerClock } from '../hooks/useBrewTimer';
import { useKitchenAdapters, type KitchenAdapterFactories } from '../hooks/useKitchenAdapters';
import {
  formatBrewNumber,
  formatMinutesSeconds,
  formatPaddedClock,
} from '../utils/brew-station.helpers';
import { ProceduralBrewScene, usePrefersReducedMotion } from './ProceduralBrewScene';
import { clamp01 } from './svg-primitives';
import './BrewTimer.css';

export interface BrewTimerHandle {
  /** Jumps the live run to a phase (no-op while idle). */
  jumpTo(phaseIndex: number): void;
}

export interface BrewTimerProps {
  readonly recipe: ScaledRecipeResult;
  readonly isEspresso: boolean;
  readonly isStartEnabled: boolean;
  /** Phase previewed while idle (shared with the text timeline). */
  readonly previewPhaseIndex: number;
  readonly onPreviewPhaseChange: (index: number) => void;
  readonly onStatusChange?: (status: BrewTimerStatus) => void;
  readonly onActivePhaseChange?: (index: number) => void;
  readonly ref?: React.Ref<BrewTimerHandle>;
  readonly kitchenFactories?: KitchenAdapterFactories;
  readonly clock?: BrewTimerClock;
}

const FLASH_MS = 700;
const RING_PHASE_R = 78;
const RING_TOTAL_R = 92;

const Icon = {
  play: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  ),
  pause: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  ),
  reset: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  ),
  sound: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  ),
  muted: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  ),
  prev: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  next: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  check: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <polyline points="8 12.5 11 15.5 16 9.5" />
    </svg>
  ),
};

/**
 * Live benchtop timer (variant B "Anillo de fase"): phase ring + total ring, procedural scene,
 * active instruction with grams, next-step preview, Kitchen Mode bar and lifecycle controls.
 * Owns all high-frequency state so the rest of the brew station never re-renders per tick.
 */
export const BrewTimer: React.FC<BrewTimerProps> = ({
  recipe,
  isEspresso,
  isStartEnabled,
  previewPhaseIndex,
  onPreviewPhaseChange,
  onStatusChange,
  onActivePhaseChange,
  ref,
  kitchenFactories,
  clock,
}) => {
  const kitchen = useKitchenAdapters(kitchenFactories);
  const timer = useBrewTimer({
    phases: recipe.phases,
    totalDurationSeconds: recipe.totalDurationSeconds,
    kitchen,
    clock,
  });
  const reducedMotion = usePrefersReducedMotion();
  const { status, snapshot, flashKey } = timer;
  const isIdle = status === 'idle';
  const isCompleted = status === 'completed';
  const phases = recipe.phases;

  const activeIndex = isIdle
    ? Math.min(Math.max(0, previewPhaseIndex), phases.length - 1)
    : snapshot.activePhaseIndex;
  const phase = phases[activeIndex] ?? phases[0]!;
  const nextPhase = phases[activeIndex + 1] ?? null;
  const phaseDuration = Math.max(0, phase.endTimeSeconds - phase.startTimeSeconds);
  // Idle previews show each phase as it ends.
  const sceneProgress = isIdle ? 1 : Math.round(snapshot.phaseProgress * 100) / 100;
  const ringProgress = isIdle ? 0 : snapshot.phaseProgress;
  const elapsed = isIdle ? 0 : snapshot.elapsedSeconds;
  const remaining = isIdle
    ? phaseDuration
    : isCompleted
      ? 0
      : Math.ceil(snapshot.remainingPhaseSeconds - 1e-6);
  const isFinalSeconds = status === 'running' && remaining <= 3;

  // Progress rings are painted imperatively: per animation frame while running (smooth sweep
  // instead of one-second steps) and from the published snapshot otherwise. React never owns
  // the dashoffset attribute, so a re-render cannot snap the ring back to a stale value.
  const totalRingRef = useRef<SVGCircleElement>(null);
  const phaseRingRef = useRef<SVGCircleElement>(null);
  const totalSeconds = recipe.totalDurationSeconds;
  const paintRings = (elapsedSeconds: number, phaseProgress: number) => {
    const totalRatio = totalSeconds > 0 ? clamp01(elapsedSeconds / totalSeconds) : 0;
    totalRingRef.current?.setAttribute('stroke-dashoffset', String(100 - totalRatio * 100));
    phaseRingRef.current?.setAttribute('stroke-dashoffset', String(100 - clamp01(phaseProgress) * 100));
  };
  const smoothRings = status === 'running' && !reducedMotion;

  useLayoutEffect(() => {
    const live = smoothRings ? timer.sample() : null;
    if (live) paintRings(live.elapsedSeconds, live.phaseProgress);
    else paintRings(elapsed, ringProgress);
  });

  useEffect(() => {
    if (!smoothRings) return undefined;
    const { clock: frameClock, sample } = timer;
    let frameId = 0;
    const frame = () => {
      const live = sample();
      if (!live) return;
      paintRings(live.elapsedSeconds, live.phaseProgress);
      frameId = frameClock.requestFrame(frame);
    };
    frameId = frameClock.requestFrame(frame);
    return () => frameClock.cancelFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- paintRings only reads refs and totalSeconds
  }, [smoothRings, timer.sample, timer.clock, totalSeconds]);

  useImperativeHandle(ref, () => ({ jumpTo: (index: number) => timer.jumpTo(index) }), [timer]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    if (!isIdle) onActivePhaseChange?.(snapshot.activePhaseIndex);
  }, [isIdle, snapshot.activePhaseIndex, onActivePhaseChange]);

  // Visual flash on phase change (SU-02): colour-only, auto-clears.
  const [isFlashing, setIsFlashing] = useState(false);
  const firstFlashRef = useRef(true);
  useEffect(() => {
    if (firstFlashRef.current) {
      firstFlashRef.current = false;
      return undefined;
    }
    setIsFlashing(true);
    const id = window.setTimeout(() => setIsFlashing(false), FLASH_MS);
    return () => window.clearTimeout(id);
  }, [flashKey]);

  const goTo = (index: number) => {
    const bounded = Math.max(0, Math.min(index, phases.length - 1));
    if (isIdle) onPreviewPhaseChange(bounded);
    else timer.jumpTo(bounded);
  };

  const handlePrimary = () => {
    if (status === 'running') timer.pause();
    else if (isCompleted) timer.reset(); // back to 00:00 with the recipe editable again
    else timer.start();
  };

  const primary =
    status === 'running'
      ? { icon: Icon.pause, label: t('brew.timer.actionPause') }
      : status === 'paused'
        ? { icon: Icon.play, label: t('brew.timer.actionResume') }
        : isCompleted
          ? { icon: Icon.play, label: t('brew.timer.actionRestart') }
          : { icon: Icon.play, label: t('brew.actionStart') };

  const clockLabel = isCompleted
    ? t('brew.timer.totalTimeLabel')
    : status === 'paused'
      ? t('brew.timer.pausedRemainingLabel')
      : t('brew.timer.remainingLabel');

  const unit = isEspresso ? t('brew.unitGrams') : t('brew.unitMl');
  const announcement = isIdle
    ? ''
    : t('brew.timer.phaseAnnouncement', { index: activeIndex + 1, title: t(phase.titleKey) });

  return (
    <aside
      aria-label={t('brew.timer.panelAria')}
      data-status={status}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      className="brew-timer order-2 lg:col-start-2 lg:row-start-1 lg:sticky lg:top-24 timer-panel-surface border border-border-subtle rounded-[18px] shadow-xl"
    >
      {/* Kitchen Mode bar */}
      <div className="brew-timer-kbar">
        <div className="brew-timer-badges">
          {!isIdle && (
            <span className="brew-timer-pill brew-timer-pill--status">
              <i aria-hidden="true" />
              {t(`brew.timer.status.${status}`)}
            </span>
          )}
          {status === 'running' && kitchen.wakeLockActive && (
            <span className="brew-timer-pill brew-timer-pill--wake" role="status">
              {t('brew.kitchen.screenOn')}
            </span>
          )}
          {status === 'running' && !kitchen.wakeLockActive && !kitchen.wakeLockSupported && (
            <span className="brew-timer-pill brew-timer-pill--nowake" role="status">
              {t('brew.kitchen.screenUnsupported')}
            </span>
          )}
          {isIdle && <span className="brew-timer-pill brew-timer-pill--hint">{t('brew.kitchen.idleHint')}</span>}
        </div>
        <button
          type="button"
          className="brew-timer-mute pressable"
          aria-pressed={kitchen.muted}
          aria-label={kitchen.muted ? t('brew.kitchen.unmute') : t('brew.kitchen.mute')}
          onClick={kitchen.toggleMute}
        >
          {kitchen.muted ? Icon.muted : Icon.sound}
        </button>
      </div>

      {/* Ring + scene */}
      <div className="brew-timer-stage">
        <div className="brew-timer-stage-row">
          <div className="brew-timer-dial">
            <div
              className={`brew-timer-ring ${isFlashing ? 'is-flash' : ''}`}
              role="img"
              aria-label={t('brew.timer.ringAria', { percent: Math.round(ringProgress * 100) })}
            >
              <svg viewBox="0 0 200 200" aria-hidden="true">
                <circle className="is-track" cx="100" cy="100" r={RING_TOTAL_R} strokeWidth="5" />
                <circle
                  className="is-total"
                  cx="100"
                  cy="100"
                  r={RING_TOTAL_R}
                  strokeWidth="5"
                  pathLength={100}
                  strokeDasharray="100"
                  ref={totalRingRef}
                />
                <circle className="is-track" cx="100" cy="100" r={RING_PHASE_R} strokeWidth="10" />
                <circle
                  className="is-phase"
                  cx="100"
                  cy="100"
                  r={RING_PHASE_R}
                  strokeWidth="10"
                  pathLength={100}
                  strokeDasharray="100"
                  ref={phaseRingRef}
                />
              </svg>
              <div className={`brew-timer-clock ${isFinalSeconds ? 'is-final' : ''}`}>
                <small>{clockLabel}</small>
                <b data-testid="brew-timer-countdown">
                  {isCompleted ? formatPaddedClock(recipe.totalDurationSeconds) : formatPaddedClock(remaining)}
                </b>
              </div>
            </div>
            {!isCompleted && (
              <div className="brew-timer-total">
                <span>{t('brew.timer.totalLabel')}</span>
                <b data-testid="brew-timer-total">{formatPaddedClock(Math.floor(elapsed))}</b>
                <span>/ {formatPaddedClock(recipe.totalDurationSeconds)}</span>
              </div>
            )}
          </div>
          <ProceduralBrewScene
            directive={phase.svgDirective}
            progress={sceneProgress}
            reducedMotion={reducedMotion}
            className="brew-timer-scene"
          />
        </div>

      </div>

      <div className="brew-timer-phasehead">
        <b>
          {t('brew.timer.phaseOf', { current: activeIndex + 1, total: phases.length, title: t(phase.titleKey) })}
        </b>
        <span>
          {t('brew.timer.phaseRange', {
            start: formatMinutesSeconds(phase.startTimeSeconds),
            end: formatMinutesSeconds(phase.endTimeSeconds),
          })}
        </span>
      </div>

      <div className="brew-timer-steps">
        <button
          type="button"
          className="brew-timer-step pressable"
          aria-label={t('brew.timer.prevPhaseAria')}
          disabled={activeIndex === 0 || isCompleted}
          onClick={() => goTo(activeIndex - 1)}
        >
          {Icon.prev}
        </button>
        <button
          type="button"
          className="brew-timer-step pressable"
          aria-label={t('brew.timer.nextPhaseAria')}
          disabled={!nextPhase || isCompleted}
          onClick={() => goTo(activeIndex + 1)}
        >
          {Icon.next}
        </button>
      </div>

      <div className="brew-timer-dots" role="group" aria-label={t('brew.timer.phasesGroupAria')}>
        {phases.map((p, idx) => (
          <button
            key={p.id}
            type="button"
            className={idx === activeIndex ? 'is-current' : !isIdle && idx < activeIndex ? 'is-past' : ''}
            aria-label={t('brew.timer.phaseDotAria', { index: idx + 1, title: t(p.titleKey) })}
            aria-current={idx === activeIndex ? 'step' : undefined}
            onClick={() => goTo(idx)}
          />
        ))}
      </div>

      {isCompleted ? (
        <div className="brew-timer-done" role="status">
          {Icon.check}
          <h2>{t('brew.timer.completedTitle')}</h2>
          <p>
            {t('brew.timer.completedSummary', {
              total: formatPaddedClock(recipe.totalDurationSeconds),
              water: formatBrewNumber(recipe.totalWaterMl),
              unit,
              ratio: formatBrewNumber(recipe.ratio),
            })}
          </p>
        </div>
      ) : (
        <>
          <div className={`brew-timer-card ${isFlashing ? 'is-flash' : ''}`} data-testid="brew-timer-card">
            <h2>{t(phase.titleKey)}</h2>
            <p>
              {t(phase.instructionKey, {
                waterGrams: formatBrewNumber(phase.phaseWaterGrams),
                cumulativeWaterGrams: formatBrewNumber(phase.targetCumulativeGrams),
              })}
            </p>
            <div className="brew-timer-grams">
              {isEspresso ? (
                <>
                  <div className="is-water">
                    <small>{t('brew.timer.cupTargetLabel')}</small>
                    <b>
                      {formatBrewNumber(phase.targetCumulativeGrams)}
                      <em>{t('brew.unitGrams')}</em>
                    </b>
                  </div>
                  <div>
                    <small>{t('brew.timer.doseLabel')}</small>
                    <b>
                      {formatBrewNumber(recipe.coffeeGrams)}
                      <em>{t('brew.unitGrams')}</em>
                    </b>
                  </div>
                </>
              ) : (
                <>
                  <div className="is-water">
                    <small>{t('brew.timer.stepGramsLabel')}</small>
                    <b data-testid="brew-timer-step-grams">
                      {phase.phaseWaterGrams > 0 ? (
                        <>
                          +{formatBrewNumber(phase.phaseWaterGrams)}
                          <em>{t('brew.unitGrams')}</em>
                        </>
                      ) : (
                        '—'
                      )}
                    </b>
                  </div>
                  <div>
                    <small>{t('brew.timer.scaleGramsLabel')}</small>
                    <b data-testid="brew-timer-scale-grams">
                      {formatBrewNumber(phase.targetCumulativeGrams)}
                      <em>{t('brew.unitGrams')}</em>
                    </b>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="brew-timer-next">
            <div>
              <small>{t('brew.timer.nextLabel')}</small>
              <b>{nextPhase ? t(nextPhase.titleKey) : t('brew.timer.lastStep')}</b>
            </div>
            {nextPhase && (
              <span>
                {t('brew.timer.nextReadout', {
                  start: formatMinutesSeconds(nextPhase.startTimeSeconds),
                  cumulative: formatBrewNumber(nextPhase.targetCumulativeGrams),
                })}
              </span>
            )}
          </div>
        </>
      )}

      <div className="brew-timer-actions">
        <button
          type="button"
          className="brew-timer-btn brew-timer-btn--primary"
          disabled={isIdle && !isStartEnabled}
          onClick={handlePrimary}
        >
          {primary.icon}
          <span>{primary.label}</span>
        </button>
        {(status === 'running' || status === 'paused') && (
          <button
            type="button"
            className="brew-timer-btn brew-timer-btn--secondary"
            onClick={timer.reset}
          >
            {Icon.reset}
            <span>{t('brew.timer.actionResetZero')}</span>
          </button>
        )}
      </div>

      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>
    </aside>
  );
};
