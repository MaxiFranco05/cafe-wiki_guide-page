import React from 'react';
import type { ThresholdEvaluationResult } from '../../../domain/thresholds';
import { t } from '../../../i18n';

export interface RangeWarningBannerProps {
  readonly evaluation: ThresholdEvaluationResult;
}

/**
 * Non-blocking physical range warning banner (RN-RG-01..03, spec §Non-Blocking Physical Range Warning).
 * Renders nothing when status is `ok` or when invalid_input is already surfaced inline near inputs.
 */
export const RangeWarningBanner: React.FC<RangeWarningBannerProps> = ({ evaluation }) => {
  if (
    evaluation.status === 'ok' ||
    !evaluation.isValidInput ||
    !evaluation.warningKey
  ) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t('brew.warnings.bannerLabel')}
      className="flex items-start gap-3 rounded-[13px] border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-3.5 py-3 text-xs text-text-primary soft-blur-swap"
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
        className="text-status-warning shrink-0 mt-0.5"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <div className="space-y-0.5 leading-relaxed">
        <div className="font-semibold text-status-warning uppercase tracking-wider text-[10px]">
          {t('brew.warnings.bannerLabel')}
        </div>
        <p className="m-0 text-text-primary leading-snug">{t(evaluation.warningKey)}</p>
      </div>
    </div>
  );
};
