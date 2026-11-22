import React, { useId } from 'react';
import { FLAVOR_WHEEL_TREE } from '../../../data/flavor-wheel';
import { t } from '../../../i18n';
import type { WikiSectionFiltersApi } from '../hooks/useWikiSectionFilters';
import { getWikiSection, groupLabelFor, type WikiSectionSlug } from '../sections';
import { PROFILE_FILTER_IDS, familyColorVar } from '../utils/wiki-ui.helpers';
import { UiIcon } from './WikiIcons';

export interface WikiSectionFiltersProps {
  readonly section: WikiSectionSlug;
  readonly api: WikiSectionFiltersApi;
  /** Results per subgroup with the current search and panel filters applied. */
  readonly groupCounts: Readonly<Record<string, number>>;
  /** Results across every subgroup with the current search and panel filters applied. */
  readonly totalCount: number;
}

export const WikiSectionFilters: React.FC<WikiSectionFiltersProps> = ({ section, api, groupCounts, totalCount }) => {
  const panelId = useId();
  const title = t(`wiki.ui.sections.${section}.title`);
  const { filters } = api;
  const groups = getWikiSection(section)?.groupOrder ?? [];

  return (
    <>
      <div className="w-toolbar">
        <label className="w-search">
          <UiIcon name="search" size={18} />
          <span className="sr-only">{t('wiki.ui.section.searchLabel', { section: title.toLowerCase() })}</span>
          <input
            type="search"
            value={filters.q}
            placeholder={t('wiki.ui.section.searchLabel', { section: title.toLowerCase() })}
            autoComplete="off"
            onChange={(event) => api.setQuery(event.target.value)}
          />
          {filters.q && (
            <button type="button" className="w-clear" aria-label={t('wiki.ui.section.clearSearch')} onClick={() => api.setQuery('')}>
              <UiIcon name="x" />
            </button>
          )}
        </label>
        <button type="button" className="w-more" aria-expanded={api.panelOpen} aria-controls={panelId} onClick={api.togglePanel}>
          <UiIcon name="sliders" size={18} />
          <span>{t('wiki.ui.section.moreFilters')}</span>
          {api.panelCount > 0 && <b>{api.panelCount}</b>}
        </button>
      </div>

      <div className="w-chips w-chips--scroll" role="radiogroup" aria-label={t(`wiki.ui.sections.${section}.groupLabel`)}>
        <button type="button" role="radio" className="w-chip" aria-checked={!filters.grupo} onClick={() => api.setGroup('')}>
          {t(`wiki.ui.sections.${section}.groupAll`)} <b>{totalCount}</b>
        </button>
        {groups.map((groupId) => (
          <button key={groupId} type="button" role="radio" className="w-chip" aria-checked={filters.grupo === groupId} onClick={() => api.setGroup(groupId)}>
            {groupLabelFor(section, groupId)} <b>{groupCounts[groupId] ?? 0}</b>
          </button>
        ))}
      </div>

      <div className="w-panel-filters" id={panelId} hidden={!api.panelOpen}>
        <div className="w-filter-row">
          <span className="w-eyebrow">{t('wiki.ui.section.profileTitle')}</span>
          <div className="w-chips">
            {PROFILE_FILTER_IDS.map((id) => {
              const pressed = filters.perfil.includes(id);
              return (
                <button key={id} type="button" className="w-chip" aria-pressed={pressed} onClick={() => api.toggleProfile(id)}>
                  {pressed && <UiIcon name="check" size={14} />}
                  {t(`wiki.ui.profileFilters.${id}`)}
                </button>
              );
            })}
          </div>
        </div>
        <div className="w-filter-row">
          <span className="w-eyebrow">{t('wiki.ui.section.familyTitle')}</span>
          <div className="w-chips">
            {FLAVOR_WHEEL_TREE.map((family) => (
              <button
                key={family.id}
                type="button"
                className="w-chip"
                aria-pressed={filters.familia === family.id}
                onClick={() => api.setFamily(family.id)}
                style={{ '--fam': familyColorVar(family.id) } as React.CSSProperties}
              >
                <span className="w-chip-dot" aria-hidden="true" />
                {t(family.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
