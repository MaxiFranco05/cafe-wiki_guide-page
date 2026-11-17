import React, { useState } from 'react';
import { useParams, Link } from 'react-router';
import { t } from '../../i18n';
import { NotFoundView } from '../../shared/components/NotFoundView';

const KNOWN_METHODS: Record<string, { titleKey: string; image: string }> = {
  v60: { titleKey: 'methods.v60.title', image: '/images/coffee/v60-moody.jpg' },
  espresso: { titleKey: 'methods.espresso.title', image: '/images/coffee/espresso-moody.jpg' },
  chemex: { titleKey: 'methods.chemex.title', image: '/images/coffee/immersion-moody.jpg' },
  melitta: { titleKey: 'methods.melitta.title', image: '/images/coffee/v60-moody.jpg' },
  aeropress: { titleKey: 'methods.aeropress.title', image: '/images/coffee/pro-machine-moody.jpg' },
  'french-press': { titleKey: 'methods.frenchPress.title', image: '/images/coffee/immersion-moody.jpg' },
};

export const BrewStationView: React.FC = () => {
  const { methodSlug } = useParams<{ methodSlug: string }>();
  const [intensity, setIntensity] = useState<'light' | 'normal' | 'strong'>('normal');

  if (!methodSlug || !KNOWN_METHODS[methodSlug]) {
    return <NotFoundView />;
  }

  const method = KNOWN_METHODS[methodSlug];

  return (
    <div className="space-y-6">
      {/* Header with back link */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-gold transition-colors pressable mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md py-1"
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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary m-0">
          {`${t(method.titleKey)} — ${t('brew.stationTitle')}`}
        </h1>
        <p className="text-sm text-text-secondary m-0 mt-1">
          {t('brew.stationSubtitle')}
        </p>
      </div>

      {/* Dual Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[22px]">
        {/* Left Panel: Recipe & Controls */}
        <div className="bg-surface border border-border-subtle rounded-[18px] p-6 flex flex-col gap-5 shadow-card">
          <div>
            <div className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              {t('brew.intensityTitle')}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['light', 'normal', 'strong'] as const).map((tier) => {
                const labelKey =
                  tier === 'light'
                    ? 'brew.intensityLight'
                    : tier === 'normal'
                      ? 'brew.intensityNormal'
                      : 'brew.intensityStrong';
                const isSelected = intensity === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setIntensity(tier)}
                    aria-pressed={isSelected}
                    className={`min-h-[46px] rounded-[10px] border text-xs font-semibold pressable transition-colors ${
                      isSelected
                        ? 'bg-gold/15 text-gold border-gold/50 shadow-sm'
                        : 'bg-canvas text-text-secondary border-border-subtle hover:border-border-strong'
                    }`}
                  >
                    {t(labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-canvas border border-border-subtle rounded-xl p-3.5">
              <div className="text-xs text-text-secondary mb-1">{t('brew.dryCoffee')}</div>
              <div className="font-mono font-mono-tabular text-2xl font-bold text-text-primary">
                {t('brew.sampleDryCoffee')}
              </div>
            </div>
            <div className="bg-canvas border border-border-subtle rounded-xl p-3.5">
              <div className="text-xs text-text-secondary mb-1">{t('brew.water')}</div>
              <div className="font-mono font-mono-tabular text-2xl font-bold text-text-primary">
                {t('brew.sampleWater')}
              </div>
            </div>
          </div>

          <div className="border-t border-border-subtle pt-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center text-text-secondary">
              <span>0:00 · {t('brew.phaseBloom')}</span>
              <span className="font-mono font-mono-tabular text-text-primary font-bold">
                {t('brew.phaseBloomDelta')}
              </span>
            </div>
            <div className="flex justify-between items-center text-text-secondary">
              <span>0:45 · {t('brew.phasePour1')}</span>
              <span className="font-mono font-mono-tabular text-text-primary font-bold">
                {t('brew.phasePour1Delta')}
              </span>
            </div>
            <div className="flex justify-between items-center text-text-secondary">
              <span>1:15 · {t('brew.phasePour2')}</span>
              <span className="font-mono font-mono-tabular text-text-primary font-bold">
                {t('brew.phasePour2Delta')}
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel: Moody Timer & Action Stack */}
        <div className="relative overflow-hidden rounded-[18px] p-7 md:p-8 bg-dark-card border border-border-subtle text-text-on-photo flex flex-col items-center justify-center text-center shadow-card">
          <img
            src={method.image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover opacity-25 filter saturate-[1.3] contrast-[1.1] pointer-events-none"
          />
          <div className="absolute inset-0 bg-dark-card/80 backdrop-blur-[2px] pointer-events-none" />

          <div className="relative z-10 w-full flex flex-col items-center gap-3">
            <span className="font-mono text-xs text-gold uppercase tracking-wider font-semibold">
              {t('brew.phaseIndicator')}
            </span>

            <div className="font-mono font-mono-tabular text-5xl md:text-6xl font-extrabold tracking-tight my-1 text-text-primary">
              {t('brew.timerZero')}
            </div>

            <p className="text-sm text-text-on-photo/85 max-w-[34ch] mb-3 leading-relaxed">
              {t('brew.phaseInstruction')}
            </p>

            {/* Stacked Full-Width Buttons (Mercado Libre Pattern) */}
            <div className="w-full flex flex-col gap-2.5 mt-2">
              <button
                type="button"
                className="w-full min-h-[50px] rounded-xl bg-accent text-text-on-accent font-bold text-base pressable transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {t('brew.actionStart')}
              </button>
              <button
                type="button"
                className="w-full min-h-[50px] rounded-xl bg-gold/15 text-gold border border-gold/30 font-bold text-base pressable transition-colors hover:bg-gold/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                {t('brew.actionReset')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
