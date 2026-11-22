import React from 'react';
import { Link } from 'react-router';
import { t } from '../../../i18n';
import { getWikiSection, type WikiSectionSlug } from '../sections';
import { SectionIcon, UiIcon } from './WikiIcons';

const SAMPLE_COUNT = 4;

export const WikiSectionCard: React.FC<{ readonly slug: WikiSectionSlug }> = ({ slug }) => {
  const section = getWikiSection(slug);
  if (!section) return null;
  const title = t(`wiki.ui.sections.${slug}.title`);
  return (
    <Link className="w-sec" to={`/wiki/${slug}`}>
      <span className="w-sec-icon">
        <SectionIcon icon={section.icon} />
      </span>
      <div>
        <h2>
          {title} <small>{t('wiki.ui.home.entriesCount', { count: section.items.length })}</small>
        </h2>
        <p>{t(`wiki.ui.sections.${slug}.desc`)}</p>
      </div>
      <div className="w-sec-samples" aria-hidden="true">
        {section.items.slice(0, SAMPLE_COUNT).map((item) => (
          <span key={item.slug}>{item.title}</span>
        ))}
      </div>
      <span className="w-sec-go" aria-hidden="true">
        {t('wiki.ui.home.explore', { section: title.toLowerCase() })} <UiIcon name="arrow" />
      </span>
    </Link>
  );
};
