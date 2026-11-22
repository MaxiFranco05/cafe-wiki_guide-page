import React, { useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { t } from '../../../i18n';
import { NotFoundView } from '../../../shared/components/NotFoundView';
import { WikiEntryCard } from '../components/WikiEntryCard';
import { SectionIcon } from '../components/WikiIcons';
import { WikiSectionFilters } from '../components/WikiSectionFilters';
import { useWikiSectionFilters } from '../hooks/useWikiSectionFilters';
import { filterWikiItems, getWikiSection, groupWikiItems, type WikiSectionDef } from '../sections';
import '../wiki.css';

export const WikiSectionView: React.FC = () => {
  const { section: sectionSlug } = useParams<{ section: string }>();
  const section = getWikiSection(sectionSlug);
  if (!section) return <NotFoundView />;
  return <WikiSectionContent key={section.slug} section={section} />;
};

const WikiSectionContent: React.FC<{ readonly section: WikiSectionDef }> = ({ section }) => {
  const api = useWikiSectionFilters(section.slug);
  const { search } = useLocation();
  const { filters } = api;
  const title = t(`wiki.ui.sections.${section.slug}.title`);

  const results = useMemo(() => filterWikiItems(section.slug, filters), [section.slug, filters]);
  const groups = useMemo(() => groupWikiItems(section.slug, results), [section.slug, results]);
  const { groupCounts, totalCount } = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const groupId of section.groupOrder) {
      counts[groupId] = filterWikiItems(section.slug, { ...filters, grupo: groupId }).length;
    }
    return { groupCounts: counts, totalCount: filterWikiItems(section.slug, { ...filters, grupo: '' }).length };
  }, [section, filters]);

  const resultText = t(results.length === 1 ? 'wiki.ui.section.resultsOne' : 'wiki.ui.section.resultsOther', { count: results.length });

  return (
    <div className="w">
      <nav aria-label={t('wiki.ui.detail.breadcrumbAria')}>
        <ol className="w-crumbs">
          <li>
            <Link to="/wiki">{t('wiki.ui.detail.breadcrumbHome')}</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{title}</li>
        </ol>
      </nav>
      <header className="w-sechead">
        <span className="w-sec-icon">
          <SectionIcon icon={section.icon} />
        </span>
        <div>
          <h1>{title}</h1>
          <p>{t(`wiki.ui.sections.${section.slug}.desc`)}</p>
        </div>
      </header>

      <WikiSectionFilters section={section.slug} api={api} groupCounts={groupCounts} totalCount={totalCount} />

      <div className="w-resultbar">
        <span aria-live="polite">{resultText}</span>
        {api.activeCount > 0 && (
          <button type="button" className="w-link-btn" onClick={api.reset}>
            {t('wiki.ui.section.clearFilters')}
          </button>
        )}
      </div>

      {groups.length > 0 ? (
        groups.map((group) => (
          <section key={group.id} className="w-group" aria-labelledby={`g-${group.id}`}>
            <h2 id={`g-${group.id}`}>
              {group.label} <small>{group.items.length}</small>
            </h2>
            <ul className="w-grid">
              {group.items.map((item) => (
                <li key={item.slug}>
                  <WikiEntryCard item={item} returnSearch={search} />
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <div className="w-empty">
          <h2>{t('wiki.ui.section.emptyTitle', { section: title.toLowerCase() })}</h2>
          <p>{t('wiki.ui.section.emptyDesc')}</p>
          <button type="button" className="w-chip" onClick={api.reset}>
            {t('wiki.ui.section.emptyAction')}
          </button>
        </div>
      )}
    </div>
  );
};
