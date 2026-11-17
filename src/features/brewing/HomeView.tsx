import React from 'react';
import { Link } from 'react-router';
import { t } from '../../i18n';

interface MethodCardData {
  slug: string;
  tag: string;
  title: string;
  desc: string;
  spec1: string;
  spec2: string;
  spec3: string;
  image: string;
  objectPosition?: string;
}

export const HomeView: React.FC = () => {
  const methods: MethodCardData[] = [
    {
      slug: 'v60',
      tag: t('methods.v60.tag'),
      title: t('methods.v60.title'),
      desc: t('methods.v60.desc'),
      spec1: t('methods.ratioLabel', { ratio: t('methods.v60.ratio') }),
      spec2: t('methods.doseLabel', { dose: t('methods.v60.dose') }),
      spec3: t('methods.timeLabel', { time: t('methods.v60.time') }),
      image: '/images/coffee/v60-moody.jpg',
    },
    {
      slug: 'espresso',
      tag: t('methods.espresso.tag'),
      title: t('methods.espresso.title'),
      desc: t('methods.espresso.desc'),
      spec1: t('methods.yieldLabel', { yield: t('methods.espresso.yield') }),
      spec2: t('methods.doseLabel', { dose: t('methods.espresso.dose') }),
      spec3: t('methods.espresso.time'),
      image: '/images/coffee/espresso-moody.jpg',
    },
    {
      slug: 'chemex',
      tag: t('methods.chemex.tag'),
      title: t('methods.chemex.title'),
      desc: t('methods.chemex.desc'),
      spec1: t('methods.ratioLabel', { ratio: t('methods.chemex.ratio') }),
      spec2: t('methods.doseLabel', { dose: t('methods.chemex.dose') }),
      spec3: t('methods.timeLabel', { time: t('methods.chemex.time') }),
      image: '/images/coffee/immersion-moody.jpg',
    },
    {
      slug: 'melitta',
      tag: t('methods.melitta.tag'),
      title: t('methods.melitta.title'),
      desc: t('methods.melitta.desc'),
      spec1: t('methods.ratioLabel', { ratio: t('methods.melitta.ratio') }),
      spec2: t('methods.doseLabel', { dose: t('methods.melitta.dose') }),
      spec3: t('methods.timeLabel', { time: t('methods.melitta.time') }),
      image: '/images/coffee/v60-moody.jpg',
      objectPosition: 'center bottom',
    },
    {
      slug: 'aeropress',
      tag: t('methods.aeropress.tag'),
      title: t('methods.aeropress.title'),
      desc: t('methods.aeropress.desc'),
      spec1: t('methods.ratioLabel', { ratio: t('methods.aeropress.ratio') }),
      spec2: t('methods.doseLabel', { dose: t('methods.aeropress.dose') }),
      spec3: t('methods.timeLabel', { time: t('methods.aeropress.time') }),
      image: '/images/coffee/pro-machine-moody.jpg',
      objectPosition: 'right center',
    },
    {
      slug: 'french-press',
      tag: t('methods.frenchPress.tag'),
      title: t('methods.frenchPress.title'),
      desc: t('methods.frenchPress.desc'),
      spec1: t('methods.ratioLabel', { ratio: t('methods.frenchPress.ratio') }),
      spec2: t('methods.doseLabel', { dose: t('methods.frenchPress.dose') }),
      spec3: t('methods.timeLabel', { time: t('methods.frenchPress.time') }),
      image: '/images/coffee/immersion-moody.jpg',
      objectPosition: 'right center',
    },
  ];

  return (
    <div className="space-y-7">
      {/* Featured Moody Hero Spotlight (Asymmetric Split) */}
      <section className="relative rounded-[20px] overflow-hidden bg-dark-card border border-border-subtle text-text-on-photo grid grid-cols-1 md:grid-cols-[1.05fr_1.15fr] shadow-card">
        <div className="p-7 md:p-10 flex flex-col justify-center gap-3.5 z-10 bg-gradient-to-br from-dark-card to-surface">
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
            <Link
              to="/wiki"
              className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-[10px] bg-elevated/70 text-text-primary border border-border-subtle font-semibold pressable transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {t('home.heroCtaWiki')}
            </Link>
          </div>
        </div>

        <div className="relative min-h-[220px] md:min-h-[300px] overflow-hidden">
          <img
            src="/images/coffee/pro-machine-moody.jpg"
            alt={t('home.heroMediaAlt')}
            className="w-full h-full object-cover contrast-[1.08] saturate-[1.18] brightness-[0.82]"
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-surface via-dark-card/40 to-transparent pointer-events-none" />
        </div>
      </section>

      {/* Moody Photographic Method Cards Grid */}
      <section aria-label={t('home.methodsTitle')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
          {methods.map((method) => (
            <Link
              key={method.slug}
              to={`/brew/${method.slug}`}
              className="relative rounded-[18px] overflow-hidden bg-dark-card border border-border-subtle text-text-on-photo min-h-[270px] flex flex-col justify-end p-5 shadow-card hover-lift pressable group no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {/* Background Photo */}
              <img
                src={method.image}
                alt={method.title}
                style={method.objectPosition ? { objectPosition: method.objectPosition } : undefined}
                className="absolute inset-0 w-full h-full object-cover contrast-[1.12] saturate-[1.22] brightness-[0.74] transition-transform duration-300 group-hover:scale-[1.02]"
              />

              {/* Scrim Gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-canvas/20 via-canvas/60 to-canvas/95 z-0" />

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full justify-between gap-2">
                <span className="self-start font-mono text-[11px] px-2.5 py-1 rounded-md bg-canvas/80 border border-gold/40 text-gold backdrop-blur-sm">
                  {method.tag}
                </span>

                <div className="space-y-1.5 mt-auto">
                  <h2 className="text-xl font-bold tracking-tight m-0 text-text-primary group-hover:text-gold transition-colors">
                    {method.title}
                  </h2>
                  <p className="text-xs text-text-on-photo/85 m-0 line-clamp-2 leading-relaxed">
                    {method.desc}
                  </p>
                  <div className="flex items-center gap-3.5 pt-2.5 mt-2 border-t border-text-on-photo/15 font-mono font-mono-tabular text-xs text-gold">
                    <span>{method.spec1}</span>
                    <span>{method.spec2}</span>
                    <span>{method.spec3}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Wiki Editorial Banner with Beans Photo */}
      <section className="relative rounded-[18px] overflow-hidden min-h-[150px] flex flex-wrap items-center justify-between gap-5 p-6 md:p-7 bg-dark-card border border-border-subtle text-text-on-photo shadow-card">
        <img
          src="/images/coffee/beans-moody.jpg"
          alt={t('home.wikiBannerAlt')}
          className="absolute inset-0 w-full h-full object-cover contrast-[1.1] saturate-[1.25] brightness-[0.45]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas/95 via-canvas/75 to-canvas/40 pointer-events-none" />

        <div className="relative z-10 max-w-lg space-y-1.5">
          <h2 className="m-0 text-xl md:text-2xl font-bold tracking-tight text-text-primary">
            {t('home.wikiBannerTitle')}
          </h2>
          <p className="m-0 text-sm text-text-on-photo/85 leading-relaxed">
            {t('home.wikiBannerDesc')}
          </p>
        </div>

        <Link
          to="/wiki"
          className="relative z-10 inline-flex items-center justify-center min-h-[48px] px-5 py-2.5 rounded-[10px] bg-gold text-dark-card font-bold pressable transition-colors hover:brightness-105 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {t('home.wikiBannerCta')}
        </Link>
      </section>
    </div>
  );
};
