import React from 'react';
import type { GrindTipResult } from '../../../domain/thresholds';
import { t } from '../../../i18n';

export interface GrindRecommendationBadgeProps {
  readonly grindTip: GrindTipResult;
}

const ADJUSTMENT_TONE_CLASS: Readonly<Record<GrindTipResult['adjustment'], string>> = {
  finer: 'text-gold',
  standard: 'text-status-optimal',
  coarser: 'text-accent',
};

/**
 * Dynamic grind guidance block driven by hydraulic bed depth thresholds (RN-BR-04).
 */
export const GrindRecommendationBadge: React.FC<GrindRecommendationBadgeProps> = ({
  grindTip,
}) => {
  const adjustmentLabel = t(`brew.grind.labels.${grindTip.adjustment}`);
  const tipText = t(`brew.grindTips.${grindTip.adjustment}`);

  return (
    <div className="border-t border-border-subtle pt-4 flex items-start gap-3">
      <div className="w-8 h-8 rounded-[9px] bg-elevated border border-border-subtle flex items-center justify-center text-gold shrink-0 mt-0.5">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="2.2" />
          <path d="M12 4v2.5M12 17.5V20M4 12h2.5M17.5 12H20" />
        </svg>
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
          <div className="text-xs font-semibold text-text-primary leading-snug">
            <span className="text-text-secondary mr-1">{t('brew.grind.prefix')}</span>
            <span>{t(grindTip.baseGrindKey)}</span>
          </div>
          <span
            className={`font-mono text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${ADJUSTMENT_TONE_CLASS[grindTip.adjustment]}`}
          >
            {adjustmentLabel}
          </span>
        </div>
        <p className="m-0 text-xs text-text-secondary leading-snug min-h-[2.25em]">
          {tipText}
        </p>
      </div>
    </div>
  );
};
