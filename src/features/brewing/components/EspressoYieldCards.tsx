import React, { useId } from 'react';
import type { BrewMethod } from '../../../domain/schemas';
import type { EspressoStyleResult } from '../../../domain/brewing';
import { t } from '../../../i18n';
import { formatBrewNumber } from '../utils/brew-station.helpers';

export interface EspressoYieldCardsProps {
  readonly method: BrewMethod;
  readonly styles: readonly EspressoStyleResult[];
  readonly selectedStyleId: 'ristretto' | 'normale' | 'lungo';
  readonly doseInput: string;
  readonly isDoseValid: boolean;
  readonly onDoseChange: (rawValue: string) => void;
  readonly onStyleSelect: (styleId: 'ristretto' | 'normale' | 'lungo') => void;
  /** Locks every control while a brew is running or paused (C-08). */
  readonly disabled?: boolean;
}

const ESPRESSO_STYLE_NAME_KEY: Readonly<Record<'ristretto' | 'normale' | 'lungo', string>> = {
  ristretto: 'brew.espresso.styles.ristretto',
  normale: 'brew.espresso.styles.normale',
  lungo: 'brew.espresso.styles.lungo',
};

export const EspressoYieldCards: React.FC<EspressoYieldCardsProps> = ({
  method,
  styles,
  selectedStyleId,
  doseInput,
  isDoseValid,
  onDoseChange,
  onStyleSelect,
  disabled = false,
}) => {
  const doseInputId = useId();
  const errorId = useId();
  const activeStyle = styles.find((item) => item.profileId === selectedStyleId) ?? styles[1];

  return (
    <div className="space-y-4">
      {/* Single Dry Dose Recessed Input Well */}
      <div
        className={`rounded-[14px] bg-elevated border px-3.5 py-3 transition-colors focus-within:border-border-focus ${
          isDoseValid ? 'border-border-recessed' : 'border-status-danger'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <label
            htmlFor={doseInputId}
            className="text-xs font-medium text-text-secondary cursor-pointer"
          >
            {t('brew.espresso.doseLabel')}
          </label>
          <span className="font-mono font-mono-tabular text-[11px] font-semibold text-gold">
            {t('brew.suggestedRange', {
              min: method.thresholds.minCoffeeGrams,
              max: method.thresholds.maxCoffeeGrams,
              unit: t('brew.unitGrams'),
            })}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <input
            disabled={disabled}
            id={doseInputId}
            type="number"
            inputMode="decimal"
            min="1"
            max="2000"
            step="0.1"
            value={doseInput}
            aria-invalid={!isDoseValid}
            aria-describedby={!isDoseValid ? errorId : undefined}
            onChange={(e) => onDoseChange(e.target.value)}
            className="no-spinner w-full bg-transparent border-0 p-0 font-mono font-mono-tabular text-[26px] font-bold leading-none text-text-primary focus:outline-none"
          />
          <span className="font-mono text-sm font-medium text-text-muted shrink-0">
            {t('brew.unitGrams')}
          </span>
        </div>
      </div>

      {/* Unified 3-Style Yield Strip */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            {t('brew.espresso.stylesTitle')}
          </span>
          {activeStyle && (
            <span className="font-mono font-mono-tabular text-xs font-semibold text-gold">
              {`${t('brew.espresso.targetShotTitle')}: ${formatBrewNumber(activeStyle.yieldGrams)} ${t('brew.unitGrams')}`}
            </span>
          )}
        </div>

        <div
          role="group"
          aria-label={t('brew.espresso.stylesTitle')}
          className="grid grid-cols-3 gap-1.5 p-1 rounded-[14px] bg-elevated border border-border-subtle"
        >
          {styles.map((style) => {
            const isSelected = style.profileId === selectedStyleId;
            return (
              <button
                disabled={disabled}
                key={style.profileId}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onStyleSelect(style.profileId)}
                className={`min-h-[68px] rounded-[11px] px-2.5 py-2 flex flex-col items-start justify-between text-left pressable cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus ${
                  isSelected
                    ? 'bg-surface text-text-primary border border-gold/65 shadow-sm'
                    : 'bg-transparent text-text-secondary border border-transparent hover:text-text-primary hover:bg-surface/40'
                }`}
              >
                <div className="w-full flex items-baseline justify-between gap-1">
                  <span className="text-xs font-semibold">{t(ESPRESSO_STYLE_NAME_KEY[style.profileId])}</span>
                  <span
                    className={`font-mono font-mono-tabular text-[10px] ${
                      isSelected ? 'text-gold' : 'text-text-muted'
                    }`}
                  >
                    {t('brew.ratioInline', { ratio: formatBrewNumber(style.ratio) })}
                  </span>
                </div>

                <div className="font-mono font-mono-tabular text-base font-bold text-text-primary leading-tight mt-1">
                  {t('brew.espresso.yieldGrams', { yield: formatBrewNumber(style.yieldGrams) })}
                </div>

                <div className="font-mono font-mono-tabular text-[10px] text-text-muted leading-tight">
                  {t('brew.espresso.targetWindow', {
                    min: style.targetWindowSeconds.min,
                    max: style.targetWindowSeconds.max,
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {!isDoseValid && (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-status-danger m-0 px-1"
        >
          {t('brew.warnings.invalidInput')}
        </p>
      )}
    </div>
  );
};
