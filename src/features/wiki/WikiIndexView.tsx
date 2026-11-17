import React from 'react';
import { Link } from 'react-router';
import { t } from '../../i18n';

export const WikiIndexView: React.FC = () => {
  const categories = [
    { slug: 'granos', label: t('wiki.categories.granos'), sample: 'bourbon' },
    { slug: 'procesos', label: t('wiki.categories.procesos'), sample: 'lavado' },
    { slug: 'molienda', label: t('wiki.categories.molienda'), sample: 'media-fina' },
    { slug: 'agua', label: t('wiki.categories.agua'), sample: 'minerales' },
    { slug: 'extraccion', label: t('wiki.categories.extraccion'), sample: 'solubilidad' },
  ];

  return (
    <div className="space-y-6">
      {/* Featured Moody Banner */}
      <section className="relative rounded-[20px] overflow-hidden bg-dark-card border border-border-subtle text-text-on-photo grid grid-cols-1 md:grid-cols-[1.1fr_1fr] shadow-card">
        <div className="p-7 md:p-9 flex flex-col justify-center gap-2.5 z-10 bg-gradient-to-br from-dark-card to-surface">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary m-0">
            {t('wiki.title')}
          </h1>
          <p className="m-0 text-sm md:text-base text-text-secondary leading-relaxed">
            {t('wiki.subtitle')}
          </p>
        </div>
        <div className="relative min-h-[180px] md:min-h-[220px] overflow-hidden">
          <img
            src="/images/coffee/beans-moody.jpg"
            alt={t('wiki.heroAlt')}
            className="w-full h-full object-cover contrast-[1.1] saturate-[1.25] brightness-[0.7]"
          />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-dark-card via-dark-card/40 to-transparent pointer-events-none" />
        </div>
      </section>

      {/* Categories Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            to={`/wiki/${cat.slug}/${cat.sample}`}
            className="p-5 rounded-[16px] bg-surface border border-border-subtle hover:border-gold/40 hover-lift pressable text-text-primary no-underline transition-colors block"
          >
            <div className="font-bold text-lg text-text-primary mb-1">{cat.label}</div>
            <div className="text-xs text-text-secondary">
              {t('wiki.featuredEntryPrefix')}{' '}
              <span className="text-gold font-mono uppercase">{cat.sample}</span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
};
