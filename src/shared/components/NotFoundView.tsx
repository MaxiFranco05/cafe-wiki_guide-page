import React from 'react';
import { Link } from 'react-router';
import { t } from '../../i18n';

export const NotFoundView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 py-12">
      <div className="w-16 h-16 rounded-2xl bg-surface border border-border-subtle flex items-center justify-center text-accent mb-6 shadow-sm">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 text-text-primary">
        {t('notFound.title')}
      </h1>
      <p className="text-sm md:text-base text-text-secondary max-w-md mb-8 leading-relaxed">
        {t('notFound.desc')}
      </p>
      <Link
        to="/"
        className="inline-flex items-center justify-center min-h-[48px] px-6 py-2.5 rounded-xl bg-accent text-text-on-accent font-semibold pressable transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {t('notFound.cta')}
      </Link>
    </div>
  );
};
