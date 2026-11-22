import React from 'react';
import { Link } from 'react-router';
import { getFlavorNodeById } from '../../../data/flavor-wheel';
import { getBrewerRecipes } from '../../../data/wiki-brewers';
import { t } from '../../../i18n';
import type { WikiItem } from '../sections';
import { SENSORY_KEYS, cardProfile, familyColorVar, getNoteFamilyId } from '../utils/wiki-ui.helpers';
import { BrewerIcon } from './BrewerIcon';
import { SensoryWheel } from './SensoryWheel';

const MAX_NOTES = 3;

function Badges({ item }: { readonly item: WikiItem }) {
  if (item.kind === 'brewer') {
    const recipes = getBrewerRecipes(item.slug).length;
    return (
      <div className="w-badges">
        {item.entry.methodId ? (
          <span className="w-badge w-badge--ok">{t('wiki.ui.card.station')}</span>
        ) : (
          <span className="w-badge w-badge--muted">{t('wiki.ui.card.encyclopedic')}</span>
        )}
        {recipes > 0 && <span className="w-badge">{t('wiki.ui.card.recipes', { count: recipes })}</span>}
      </div>
    );
  }
  if (item.kind === 'drink') {
    const { composition, servedVolumeMl } = item.entry;
    return (
      <div className="w-badges">
        <span className={`w-badge ${composition.milk || composition.foam ? '' : 'w-badge--muted'}`}>
          {t(composition.milk || composition.foam ? 'wiki.ui.card.withMilk' : 'wiki.ui.card.noMilk')}
        </span>
        <span className="w-badge w-badge--muted">{t('wiki.ui.card.volume', { min: servedVolumeMl.min, max: servedVolumeMl.max })}</span>
      </div>
    );
  }
  return item.relevance === 'southern_cone_staple' ? (
    <div className="w-badges">
      <span className="w-badge">{t('wiki.ui.card.southernCone')}</span>
    </div>
  ) : null;
}

/** "Predomina: Acidez 5 · Dulzor 4" — the readable companion of the decorative mini wheel. */
export const CardProfileLine: React.FC<{ readonly item: WikiItem }> = ({ item }) => (
  <p className="w-card-profile">
    {t('wiki.ui.sensory.cardLine')}{' '}
    {cardProfile(item.sensory).map((attr, i) => (
      <React.Fragment key={attr.key}>
        {i > 0 && ' · '}
        {t(`wiki.ui.sensory.${attr.key}`)} <b>{attr.value}</b>
      </React.Fragment>
    ))}
  </p>
);

/** Navigation state carried to the entry so "Volver" restores the section filters. */
export interface WikiEntryLinkState {
  readonly returnSearch?: string;
}

export const WikiEntryCard: React.FC<{ readonly item: WikiItem; readonly returnSearch?: string }> = ({ item, returnSearch }) => {
  const state: WikiEntryLinkState = { returnSearch };
  const profileAria = SENSORY_KEYS.map((key) =>
    t('wiki.ui.sensory.valueAria', { label: t(`wiki.ui.sensory.${key}`), value: item.sensory[key] }),
  ).join(', ');
  const titleBlock = (
    <div>
      <h3>{item.title}</h3>
      <div className="w-card-sub">{item.groupLabel}</div>
    </div>
  );
  return (
    <Link className="w-card" to={`/wiki/${item.section}/${item.slug}`} state={state} aria-label={`${item.title}. ${profileAria}`}>
      <div>
        {item.kind === 'brewer' ? (
          <div className="w-card-title-row">
            <span className="w-brewer-badge">
              <BrewerIcon slug={item.slug} />
            </span>
            {titleBlock}
          </div>
        ) : (
          titleBlock
        )}
        <Badges item={item} />
      </div>
      <SensoryWheel profile={item.sensory} variant="compact" />
      <CardProfileLine item={item} />
      <div className="w-card-foot w-notes">
        {item.flavorNodeIds.slice(0, MAX_NOTES).map((id) => (
          <NoteBadge key={id} nodeId={id} />
        ))}
      </div>
    </Link>
  );
};

const NoteBadge: React.FC<{ readonly nodeId: string }> = ({ nodeId }) => {
  const label = noteLabel(nodeId);
  if (!label) return null;
  return (
    <span className="w-note" style={{ '--fam': familyColorVar(getNoteFamilyId(nodeId)) } as React.CSSProperties}>
      <span className="w-chip-dot" aria-hidden="true" />
      {label}
    </span>
  );
};

export function noteLabel(nodeId: string): string | null {
  const node = getFlavorNodeById(nodeId);
  return node ? t(node.labelKey) : null;
}
