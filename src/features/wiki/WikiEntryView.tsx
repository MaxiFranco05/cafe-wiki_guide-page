import React from 'react';
import { useParams, Link } from 'react-router';
import { t } from '../../i18n';
import { NotFoundView } from '../../shared/components/NotFoundView';

const VALID_CATEGORIES = new Set(['granos', 'procesos', 'molienda', 'agua', 'extraccion']);

export const WikiEntryView: React.FC = () => {
  const { category, entrySlug } = useParams<{ category: string; entrySlug: string }>();

  if (!category || !VALID_CATEGORIES.has(category) || !entrySlug) {
    return <NotFoundView />;
  }

  const formattedTitle = entrySlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label={t('wiki.breadcrumbAria')} className="flex items-center gap-2 text-xs text-text-secondary">
        <Link to="/wiki" className="hover:text-accent transition-colors">
          {t('wiki.breadcrumbHome')}
        </Link>
        <span>/</span>
        <span className="capitalize">{category}</span>
        <span>/</span>
        <span className="text-gold font-semibold">{formattedTitle}</span>
      </nav>

      {/* Entry Content Card */}
      <article className="p-6 md:p-8 rounded-[18px] bg-surface border border-border-subtle shadow-card space-y-4">
        <span className="font-mono text-xs text-gold uppercase px-2.5 py-1 rounded-md bg-canvas border border-gold/30">
          {category}
        </span>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-primary m-0">
          {formattedTitle}
        </h1>
        <p className="text-sm md:text-base text-text-secondary leading-relaxed max-w-2xl">
          {t('wiki.entryPlaceholderBody', { title: formattedTitle })}
        </p>

        <div className="pt-4 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/wiki"
            className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors min-h-[44px] inline-flex items-center"
          >
            {t('wiki.backToWiki')}
          </Link>
          <Link
            to="/brew/v60"
            className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:text-gold transition-colors min-h-[44px]"
          >
            {t('wiki.prepareWithV60')}
          </Link>
        </div>
      </article>
    </div>
  );
};
