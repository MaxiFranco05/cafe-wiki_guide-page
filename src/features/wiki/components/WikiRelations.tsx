import React from 'react';
import { Link } from 'react-router';
import type { BrewMethod } from '../../../domain/schemas';
import { t } from '../../../i18n';
import { getWikiSection, type WikiItem, type WikiSectionSlug } from '../sections';
import { methodProfileLabels } from './RecommendedMethodCard';

export interface RelationChip {
  readonly item: WikiItem;
  readonly tag?: string;
}

/** Linked chips to related entries of another section. */
export const WikiRelationChips: React.FC<{ readonly section: WikiSectionSlug; readonly items: readonly WikiItem[]; readonly tags?: readonly (string | undefined)[] }> = ({ section, items, tags }) => (
  <div className="w-chips">
    {items.map((item, index) => (
      <Link key={item.slug} className="w-chip" to={`/wiki/${section}/${item.slug}`}>
        {item.title}
        {tags?.[index] && <small>{tags[index]}</small>}
      </Link>
    ))}
  </div>
);

export interface BrewerCoffeesGroup {
  readonly section: WikiSectionSlug;
  readonly entries: readonly { readonly item: WikiItem; readonly profileLabel: string }[];
}

const COFFEE_SECTIONS: readonly WikiSectionSlug[] = ['origenes', 'varietales', 'procesos'];

/** Reverse of "Cómo prepararlo": every origin, varietal and process that recommends this method. */
export function buildBrewerCoffeesGroups(methodId: BrewMethod['id'] | null): readonly BrewerCoffeesGroup[] {
  if (!methodId) return [];
  return COFFEE_SECTIONS.map((section) => ({
    section,
    entries: (getWikiSection(section)?.items ?? []).flatMap((item) => {
      if (item.kind !== 'wiki') return [];
      const recommendation = item.entry.recommendedMethods.find((m) => m.methodId === methodId);
      return recommendation ? [{ item, profileLabel: methodProfileLabels(methodId, recommendation.profileId).profile }] : [];
    }),
  })).filter((group) => group.entries.length > 0);
}

export const BrewerCoffees: React.FC<{ readonly groups: readonly BrewerCoffeesGroup[] }> = ({ groups }) => (
  <div className="w-rel">
    {groups.map((group) => (
      <div key={group.section} className="w-rel-group">
        <span className="w-eyebrow">
          {t('wiki.ui.chapters.coffees.group', { section: t(`wiki.ui.sections.${group.section}.title`), count: group.entries.length })}
        </span>
        <WikiRelationChips section={group.section} items={group.entries.map((e) => e.item)} tags={group.entries.map((e) => e.profileLabel)} />
      </div>
    ))}
  </div>
);
