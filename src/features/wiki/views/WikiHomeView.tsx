import React from 'react';
import { t } from '../../../i18n';
import { WIKI_SECTION_SLUGS } from '../sections';
import { WikiSectionCard } from '../components/WikiSectionCard';
import '../wiki.css';

/** /wiki — one entry point per section; entries of different sections are never mixed. */
export const WikiHomeView: React.FC = () => (
  <div className="w">
    <section className="w-hero" aria-labelledby="wiki-home-title">
      <div className="w-hero-copy">
        <span className="w-eyebrow">{t('wiki.ui.home.eyebrow')}</span>
        <h1 id="wiki-home-title">{t('wiki.ui.home.title')}</h1>
        <p>{t('wiki.ui.home.desc')}</p>
      </div>
      <div className="w-hero-photo">
        <img src="/images/coffee/beans-moody.jpg" alt={t('wiki.ui.home.heroAlt')} decoding="async" />
      </div>
    </section>
    <nav aria-label={t('wiki.ui.home.sectionsAria')}>
      <ul className="w-hub">
        {WIKI_SECTION_SLUGS.map((slug) => (
          <li key={slug}>
            <WikiSectionCard slug={slug} />
          </li>
        ))}
      </ul>
    </nav>
  </div>
);
