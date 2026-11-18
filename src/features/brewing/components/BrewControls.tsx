import React, { useId } from 'react';
import type { BrewMethod, RecipeProfile } from '../../../domain/schemas';
import type { ScaledRecipeResult } from '../../../domain/brewing';
import { t } from '../../../i18n';
import { formatBrewNumber } from '../utils/brew-station.helpers';

export interface BrewControlsProps {
  readonly method: BrewMethod;
  readonly recipe: ScaledRecipeResult;
  readonly coffeeInput: string;
  readonly waterInput: string;
  readonly isCoffeeValid: boolean;
  readonly isWaterValid: boolean;
  readonly onProfileChange: (profileId: RecipeProfile['id']) => void;
  readonly onCoffeeChange: (rawValue: string) => void;
  readonly onWaterChange: (rawValue: string) => void;
}

const TIER_LABEL_KEY_BY_ID: Readonly<Record<'light' | 'normal' | 'strong', string>> = {
  light: 'brew.tiers.light',
  normal: 'brew.tiers.normal',
  strong: 'brew.tiers.strong',
};

export const BrewControls: React.FC<BrewControlsProps> = ({
  method,
  recipe,
  coffeeInput,
  waterInput,
  isCoffeeValid,
  isWaterValid,
  onProfileChange,
  onCoffeeChange,
  onWaterChange,
}) => {
  const coffeeInputId = useId();
  const waterInputId = useId();
  const errorId = useId();

  const hasInvalidInput = !isCoffeeValid || !isWaterValid;
  const activeRatioText = formatBrewNumber(recipe.ratio);

  return (
    <div className="space-y-4">
      {/* Intensity Segmented Track */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
            {t('brew.intensityTitle')}
          </span>
          <span className="font-mono font-mono-tabular text-xs font-semibold text-gold">
            {t('brew.ratioBadge', { ratio: activeRatioText })}
          </span>
        </div>

        <div
          role="group"
          aria-label={t('brew.intensityTitle')}
          className="grid grid-cols-3 gap-1 p-1 rounded-[13px] bg-elevated border border-border-subtle"
        >
          {method.profiles.map((profile) => {
            const isSelected = profile.id === recipe.profileId;
            const tierKey =
              profile.id === 'light' || profile.id === 'normal' || profile.id === 'strong'
                ? TIER_LABEL_KEY_BY_ID[profile.id]
                : profile.labelKey;

            return (
              <button
                key={profile.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onProfileChange(profile.id)}
                className={`min-h-[46px] rounded-[10px] px-2 py-1.5 flex flex-col items-center justify-center text-center pressable cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus ${
                  isSelected
                    ? 'bg-surface text-text-primary border border-gold/60 shadow-sm'
                    : 'bg-transparent text-text-secondary border border-transparent hover:text-text-primary hover:bg-surface/40'
                }`}
              >
                <span className="text-xs font-semibold leading-tight">{t(tierKey)}</span>
                <span
                  className={`font-mono font-mono-tabular text-[11px] leading-tight mt-0.5 ${
                    isSelected ? 'text-gold' : 'text-text-muted'
                  }`}
                >
                  {t('brew.ratioInline', { ratio: formatBrewNumber(profile.ratio) })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bidirectional Coffee & Water Recessed Wells */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Dry Coffee Input Well */}
        <div
          className={`rounded-[14px] bg-elevated border px-3.5 py-3 transition-colors focus-within:border-border-focus ${
            isCoffeeValid ? 'border-border-recessed' : 'border-status-danger'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <label
              htmlFor={coffeeInputId}
              className="text-xs font-medium text-text-secondary cursor-pointer"
            >
              {t('brew.dryCoffeeLabel')}
            </label>
            <span className="font-mono font-mono-tabular text-[11px] font-semibold text-gold whitespace-nowrap">
              {t('brew.tablespoonsEstimate', { tbsp: formatBrewNumber(recipe.tablespoons) })}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <input
              id={coffeeInputId}
              type="number"
              inputMode="decimal"
              min="1"
              max="2000"
              step="0.1"
              value={coffeeInput}
              aria-invalid={!isCoffeeValid}
              aria-describedby={!isCoffeeValid ? errorId : undefined}
              onChange={(e) => onCoffeeChange(e.target.value)}
              className="no-spinner w-full bg-transparent border-0 p-0 font-mono font-mono-tabular text-[26px] font-bold leading-none text-text-primary focus:outline-none"
            />
            <span className="font-mono text-sm font-medium text-text-muted shrink-0">
              {t('brew.unitGrams')}
            </span>
          </div>

          <div className="text-[11px] text-text-muted mt-1.5 font-mono font-mono-tabular">
            {t('brew.suggestedRange', {
              min: method.thresholds.minCoffeeGrams,
              max: method.thresholds.maxCoffeeGrams,
              unit: t('brew.unitGrams'),
            })}
          </div>
        </div>

        {/* Water Total Input Well */}
        <div
          className={`rounded-[14px] bg-elevated border px-3.5 py-3 transition-colors focus-within:border-border-focus ${
            isWaterValid ? 'border-border-recessed' : 'border-status-danger'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <label
              htmlFor={waterInputId}
              className="text-xs font-medium text-text-secondary cursor-pointer"
            >
              {t('brew.waterTotalLabel')}
            </label>
            <span className="font-mono font-mono-tabular text-[11px] font-semibold text-[var(--svg-water-stream)] whitespace-nowrap">
              {`${method.waterTempCelsius.recommended} °C`}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <input
              id={waterInputId}
              type="number"
              inputMode="decimal"
              min="1"
              max="2000"
              step="0.1"
              value={waterInput}
              aria-invalid={!isWaterValid}
              aria-describedby={!isWaterValid ? errorId : undefined}
              onChange={(e) => onWaterChange(e.target.value)}
              className="no-spinner w-full bg-transparent border-0 p-0 font-mono font-mono-tabular text-[26px] font-bold leading-none text-[var(--svg-water-stream)] focus:outline-none"
            />
            <span className="font-mono text-sm font-medium text-text-muted shrink-0">
              {t('brew.unitMl')}
            </span>
          </div>

          <div className="text-[11px] text-text-muted mt-1.5 font-mono font-mono-tabular">
            {method.thresholds.minWaterMl !== undefined && method.thresholds.maxWaterMl !== undefined
              ? t('brew.suggestedRange', {
                  min: method.thresholds.minWaterMl,
                  max: method.thresholds.maxWaterMl,
                  unit: t('brew.unitMl'),
                })
              : t('brew.waterTempBadge', {
                  recommended: method.waterTempCelsius.recommended,
                  min: method.waterTempCelsius.min,
                  max: method.waterTempCelsius.max,
                })}
          </div>
        </div>
      </div>

      {/* Inline invalid positive-number guard */}
      {hasInvalidInput && (
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
