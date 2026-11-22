import React from 'react';
import type { PwaAdapter } from '../../adapters/pwa.adapter';
import { t } from '../../i18n';
import { usePwaStatus } from '../hooks/usePwaStatus';

export interface PwaStatusToastProps {
  readonly adapter?: PwaAdapter;
}

type VisibleToastMode = 'update' | 'offline' | 'offline-ready' | null;

export const PwaStatusToast: React.FC<PwaStatusToastProps> = ({ adapter }) => {
  const { isOnline, offlineReady, needRefresh, dismissOfflineReady, dismissUpdate, applyUpdate } =
    usePwaStatus(adapter);

  const mode: VisibleToastMode = needRefresh
    ? 'update'
    : !isOnline
      ? 'offline'
      : offlineReady
        ? 'offline-ready'
        : null;

  if (mode === null) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={t('pwa.regionLabel')}
      className="fixed left-4 right-4 bottom-[calc(68px+12px+env(safe-area-inset-bottom,0px))] md:left-auto md:right-6 md:bottom-6 z-[60] flex justify-center md:justify-end pointer-events-none"
    >
      {mode === 'update' ? (
        <div
          data-testid="pwa-toast-update"
          className="pointer-events-auto w-full max-w-[420px] md:w-[380px] rounded-2xl bg-tooltip border border-border-strong p-4 shadow-2xl flex flex-col gap-3 transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none"
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="shrink-0 w-[34px] h-[34px] rounded-[10px] bg-accent-soft text-gold grid place-items-center"
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
              >
                <path d="M21 12a9 9 0 1 1-2.6-6.4" />
                <path d="M21 3v6h-6" />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary leading-snug">
                {t('pwa.update.title')}
              </p>
              <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">
                {t('pwa.update.desc')}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={dismissUpdate}
              className="min-h-[44px] px-3.5 rounded-[10px] border border-border-subtle bg-transparent text-text-secondary hover:text-text-primary text-[13.5px] font-medium pressable focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus cursor-pointer"
            >
              {t('pwa.update.later')}
            </button>
            <button
              type="button"
              onClick={() => {
                void applyUpdate();
              }}
              className="min-h-[44px] px-4 rounded-[10px] border border-accent bg-accent hover:bg-accent-hover text-text-on-accent text-[13.5px] font-semibold pressable focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus cursor-pointer"
            >
              {t('pwa.update.apply')}
            </button>
          </div>
        </div>
      ) : mode === 'offline' ? (
        <div
          data-testid="pwa-toast-offline"
          className="pointer-events-auto w-full max-w-[420px] md:w-[380px] rounded-2xl bg-surface border border-status-warning-border px-3.5 py-3 shadow-2xl flex items-center gap-3 transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none"
        >
          <span
            aria-hidden="true"
            className="shrink-0 w-[34px] h-[34px] rounded-[10px] bg-status-warning-bg text-status-warning grid place-items-center"
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
            >
              <path d="M2 2l20 20" />
              <path d="M8.5 16.5a5 5 0 0 1 7 0" />
              <path d="M5 13a10 10 0 0 1 5.2-2.6" />
              <path d="M14.2 10.6A10 10 0 0 1 19 13" />
              <circle cx="12" cy="20" r="1" fill="currentColor" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary leading-snug">
              {t('pwa.offline.title')}
            </p>
            <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">
              {t('pwa.offline.desc')}
            </p>
          </div>
        </div>
      ) : (
        <div
          data-testid="pwa-toast-offline-ready"
          className="pointer-events-auto w-full max-w-[420px] md:w-[380px] rounded-2xl bg-tooltip border border-border-strong px-3.5 py-3 shadow-2xl flex items-center gap-3 transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none"
        >
          <span
            aria-hidden="true"
            className="shrink-0 w-[34px] h-[34px] rounded-[10px] bg-status-optimal-bg text-status-optimal grid place-items-center"
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
            >
              <circle cx="12" cy="12" r="9" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary leading-snug">
              {t('pwa.offlineReady.title')}
            </p>
            <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">
              {t('pwa.offlineReady.desc')}
            </p>
          </div>
          <button
            type="button"
            onClick={dismissOfflineReady}
            aria-label={t('pwa.closeAria')}
            className="shrink-0 w-11 h-11 -mr-1.5 rounded-[10px] bg-transparent text-text-secondary hover:text-text-primary grid place-items-center pressable focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus cursor-pointer"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
