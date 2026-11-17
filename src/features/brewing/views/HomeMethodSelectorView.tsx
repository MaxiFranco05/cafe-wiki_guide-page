import React, { useState } from 'react';
import { Link } from 'react-router';
import { METHODS_CATALOG } from '../../../data/methods';
import type { BrewMethod } from '../../../domain/schemas';
import { t } from '../../../i18n';
import { MethodCard } from '../components/MethodCard';

type CategoryFilter = 'all' | BrewMethod['category'];

const FILTER_OPTIONS: readonly { readonly id: CategoryFilter; readonly labelKey: string }[] = [
  { id: 'all', labelKey: 'home.filters.all' },
  { id: 'pour_over', labelKey: 'home.filters.pour_over' },
  { id: 'immersion', labelKey: 'home.filters.immersion' },
  { id: 'hybrid', labelKey: 'home.filters.hybrid' },
  { id: 'pressure', labelKey: 'home.filters.pressure' },
];

export const HomeMethodSelectorView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const filteredMethods =
    activeCategory === 'all'
      ? METHODS_CATALOG
      : METHODS_CATALOG.filter((method) => method.category === activeCategory);

  const countForCategory = (category: CategoryFilter): number =>
    category === 'all'
      ? METHODS_CATALOG.length
      : METHODS_CATALOG.filter((method) => method.category === category).length;

  return (
    <div className="space-y-8">
      {/* Featured Moody Hero Spotlight */}
      <section className="relative rounded-[20px] overflow-hidden bg-dark-card border border-border-subtle text-text-on-photo grid grid-cols-1 md:grid-cols-[1.05fr_1.15fr] shadow-card">
        <div className="p-7 md:p-10 flex flex-col justify-center gap-3.5 z-10 bg-gradient-to-br from-dark-card to-surface">
          <span className="self-start font-mono text-[11px] px-2.5 py-1 rounded-md bg-gold-soft border border-gold/40 text-gold tracking-wide">
            {t('home.heroBadge')}
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-tight m-0 text-text-primary">
            {t('home.heroTitle')}
          </h1>
          <p className="m-0 text-sm md:text-base text-text-secondary leading-relaxed max-w-xl">
            {t('home.heroDesc')}
          </p>
          <div className="flex flex-wrap gap-2.5 mt-2">
            <Link
              to="/brew/v60"
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-[10px] bg-accent text-text-on-accent font-bold pressable transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {t('home.heroCtaBrew')}
            </Link>
            <a
              href="#descubrir-cafe"
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-[10px] bg-elevated/70 text-text-primary border border-border-subtle font-semibold pressable transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {t('home.heroCtaDiscover')}
            </a>
          </div>
        </div>

        <div className="relative min-h-[220px] md:min-h-[310px] overflow-hidden">
          <img
            src="/images/coffee/pro-machine-moody.jpg"
            alt={t('home.heroMediaAlt')}
            className="w-full h-full object-cover contrast-[1.08] saturate-[1.18] brightness-[0.82]"
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-surface via-dark-card/40 to-transparent pointer-events-none" />
        </div>
      </section>

      {/* Catalog Section Header + Interactive Category Filter Bar */}
      <section aria-label={t('home.methodsTitle')} className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-text-primary m-0">
              {t('home.methodsTitle')}
            </h2>
            <p className="text-sm text-text-secondary m-0">
              {t('home.methodsSubtitle')}
            </p>
          </div>

          <div
            role="group"
            aria-label={t('home.filters.ariaLabel')}
            className="flex flex-wrap gap-2"
          >
            {FILTER_OPTIONS.map((option) => {
              const isSelected = activeCategory === option.id;
              const count = countForCategory(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setActiveCategory(option.id)}
                  className={`inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-[10px] border text-[13px] font-semibold pressable transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isSelected
                      ? 'bg-accent-soft border-accent text-text-primary font-bold'
                      : 'bg-surface border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary'
                  }`}
                >
                  <span>{t(option.labelKey)}</span>
                  <span
                    className={`font-mono font-mono-tabular text-[11px] px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-accent text-text-on-accent' : 'bg-elevated text-gold'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Method Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
          {filteredMethods.map((method) => (
            <MethodCard key={method.id} method={method} />
          ))}
        </div>
      </section>

      {/* Dual Discovery Section: Sensory Wiki & SCA Flavor Wheel */}
      <section
        id="descubrir-cafe"
        className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-[18px]"
      >
        {/* Sensory Wiki Card */}
        <article className="relative rounded-[18px] overflow-hidden min-h-[195px] p-6 md:p-7 bg-dark-card border border-border-subtle text-text-on-photo shadow-card flex flex-col justify-between gap-4">
          <img
            src="/images/coffee/beans-moody.jpg"
            alt={t('home.wikiBannerAlt')}
            className="absolute inset-0 w-full h-full object-cover contrast-[1.1] saturate-[1.25] brightness-[0.42]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-canvas/95 via-canvas/75 to-canvas/40 pointer-events-none" />

          <div className="relative z-10 space-y-2 max-w-lg">
            <span className="inline-block font-mono text-[11px] px-2.5 py-1 rounded-md bg-gold-soft border border-gold/40 text-gold">
              {t('home.wikiCard.tag')}
            </span>
            <h3 className="m-0 text-xl md:text-2xl font-bold tracking-tight text-text-primary">
              {t('home.wikiCard.title')}
            </h3>
            <p className="m-0 text-sm text-text-on-photo/85 leading-relaxed">
              {t('home.wikiCard.desc')}
            </p>
          </div>

          <div className="relative z-10 pt-1">
            <Link
              to="/wiki"
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-[10px] bg-gold text-dark-card font-bold pressable transition-colors hover:brightness-105 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold no-underline"
            >
              {t('home.wikiCard.cta')}
            </Link>
          </div>
        </article>

        {/* SCA Flavor Wheel Card */}
        <article className="relative rounded-[18px] overflow-hidden min-h-[195px] p-6 md:p-7 bg-surface border border-border-subtle text-text-primary shadow-card flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 max-w-md">
              <span className="inline-block font-mono text-[11px] px-2.5 py-1 rounded-md bg-accent-soft border border-accent/40 text-gold">
                {t('home.wheelCard.tag')}
              </span>
              <h3 className="m-0 text-xl md:text-2xl font-bold tracking-tight text-text-primary">
                {t('home.wheelCard.title')}
              </h3>
              <p className="m-0 text-sm text-text-secondary leading-relaxed">
                {t('home.wheelCard.desc')}
              </p>
            </div>

            {/* Concentric Semantic SCA Flavor Emblem */}
            <svg
              width="78"
              height="78"
              viewBox="0 0 80 80"
              aria-hidden="true"
              className="shrink-0 mt-1"
            >
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="var(--flavor-floral)"
                strokeWidth="7"
                strokeDasharray="34 180"
                strokeDashoffset="0"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="var(--flavor-fruity)"
                strokeWidth="7"
                strokeDasharray="34 180"
                strokeDashoffset="-36"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="var(--flavor-sour-fermented)"
                strokeWidth="7"
                strokeDasharray="34 180"
                strokeDashoffset="-72"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="var(--flavor-green-vegetative)"
                strokeWidth="7"
                strokeDasharray="34 180"
                strokeDashoffset="-108"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="var(--flavor-other)"
                strokeWidth="7"
                strokeDasharray="34 180"
                strokeDashoffset="-144"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="var(--flavor-roasted)"
                strokeWidth="7"
                strokeDasharray="34 180"
                strokeDashoffset="-180"
              />
              <circle
                cx="40"
                cy="40"
                r="22"
                fill="none"
                stroke="var(--border-strong)"
                strokeWidth="2"
              />
              <circle cx="40" cy="40" r="10" fill="var(--accent-gold)" />
            </svg>
          </div>

          <div className="pt-1">
            <Link
              to="/flavor-wheel"
              className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-[10px] bg-elevated text-text-primary border border-border-strong font-bold pressable transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold no-underline"
            >
              {t('home.wheelCard.cta')}
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
};
