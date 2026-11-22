import React from 'react';
import type { ScaledBrewPhase } from '../../../domain/brewing';
import { t } from '../../../i18n';
import { formatBrewNumber, formatMinutesSeconds } from '../utils/brew-station.helpers';
import { resolvePhaseInstruction, resolvePhaseTitle } from '../utils/recipe-display.helpers';

export interface PhaseTimelinePreviewProps {
  readonly phases: readonly ScaledBrewPhase[];
  readonly totalDurationSeconds: number;
  readonly totalWaterMl: number;
  readonly isEspresso?: boolean;
  readonly selectedPhaseIndex?: number;
  readonly onSelectPhase?: (index: number) => void;
  /** Live run state (C-08): highlights the running phase and dims completed ones. */
  readonly liveState?: { readonly activeIndex: number; readonly completed: boolean } | null;
}

/**
 * Editorial hairline timeline showing fixed M:SS timestamps, partial increments (+X g),
 * cumulative water targets (→ Y g), and clickable phase rows for live SVG preview sync.
 */
export const PhaseTimelinePreview: React.FC<PhaseTimelinePreviewProps> = ({
  phases,
  totalDurationSeconds,
  totalWaterMl,
  isEspresso = false,
  selectedPhaseIndex = 0,
  onSelectPhase,
  liveState = null,
}) => {
  const summaryText = t(isEspresso ? 'brew.timeline.totalYield' : 'brew.timeline.totalWater', {
    time: formatMinutesSeconds(totalDurationSeconds),
    water: formatBrewNumber(totalWaterMl),
  });

  return (
    <section aria-label={t('brew.timeline.title')} className="pt-1">
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2.5 border-b border-border-subtle">
        <h2 className="m-0 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
          {t('brew.timeline.title')}
        </h2>
        <span className="font-mono font-mono-tabular text-xs font-semibold text-text-primary">
          {summaryText}
        </span>
      </div>

      <div className="divide-y divide-border-subtle border-b border-border-subtle">
        {phases.map((phase, index) => {
          const isActive = liveState ? index === liveState.activeIndex && !liveState.completed : index === selectedPhaseIndex;
          const isDone = liveState !== null && (liveState.completed || index < liveState.activeIndex);
          const liveClass = liveState && isActive ? 'brew-timer-row-live' : isDone ? 'brew-timer-row-done' : '';
          const timeStamp = formatMinutesSeconds(phase.startTimeSeconds);
          const phaseWaterFormatted = formatBrewNumber(phase.phaseWaterGrams);
          const cumulativeFormatted = formatBrewNumber(phase.targetCumulativeGrams);
          const hasWaterPour = phase.waterShare > 0;

          const instruction = resolvePhaseInstruction(phase, {
            waterGrams: phaseWaterFormatted,
            cumulativeWaterGrams: cumulativeFormatted,
          });

          return (
            <button
              key={phase.id}
              type="button"
              onClick={() => onSelectPhase?.(index)}
              aria-current={isActive ? 'step' : undefined}
              className={`w-full text-left py-3 px-2.5 -mx-0.5 flex items-start gap-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus ${
                isActive && !liveState
                  ? 'border-l-[3px] border-l-gold bg-elevated/60'
                  : 'border-l-[3px] border-l-transparent hover:bg-elevated/35'
              } ${liveClass}`}
            >
              <span className="font-mono font-mono-tabular text-xs font-semibold text-gold pt-0.5 w-10 shrink-0">
                {timeStamp}
              </span>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="text-sm font-semibold text-text-primary leading-snug">
                  {resolvePhaseTitle(phase)}
                </div>
                <p className="m-0 text-xs text-text-secondary leading-relaxed">
                  {instruction}
                </p>
              </div>

              <div className="shrink-0 text-right font-mono font-mono-tabular pl-2">
                <div
                  className={`text-xs font-semibold ${
                    hasWaterPour ? 'text-[var(--svg-water-stream)]' : 'text-text-muted'
                  }`}
                >
                  {hasWaterPour
                    ? t('brew.timeline.pourDelta', { grams: phaseWaterFormatted })
                    : t('brew.timeline.drawdownZero')}
                </div>
                <div className="text-[11px] text-text-secondary mt-0.5">
                  {t('brew.timeline.pourCumulative', { grams: cumulativeFormatted })}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
