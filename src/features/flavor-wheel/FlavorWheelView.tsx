import React from 'react';
import { t } from '../../i18n';

export const FlavorWheelView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border-subtle rounded-[18px] p-6 md:p-8 shadow-card space-y-4">
        <span className="font-mono text-xs text-gold uppercase px-2.5 py-1 rounded-md bg-canvas border border-gold/35">
          {t('wheel.tag')}
        </span>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary m-0">
          {t('wheel.title')}
        </h1>
        <p className="text-sm md:text-base text-text-secondary leading-relaxed max-w-2xl m-0">
          {t('wheel.subtitle')}
        </p>

        {/* Concentric SCA Ring Placeholder */}
        <div className="flex flex-col items-center justify-center p-8 md:p-12 border border-border-subtle rounded-2xl bg-canvas my-6">
          <svg
            width="180"
            height="180"
            viewBox="0 0 100 100"
            className="text-accent animate-pulse"
            aria-hidden="true"
          >
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.25" />
            <circle cx="50" cy="50" r="32" fill="none" stroke="var(--accent-gold)" strokeWidth="2.5" opacity="0.4" />
            <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6" />
            <circle cx="50" cy="50" r="6" fill="var(--accent-gold)" />
          </svg>
          <p className="mt-6 text-xs md:text-sm text-text-muted text-center max-w-md">
            {t('wheel.placeholderDesc')}
          </p>
        </div>
      </div>
    </div>
  );
};
