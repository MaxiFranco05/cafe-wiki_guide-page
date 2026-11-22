import React, { useId } from 'react';
import { Link } from 'react-router';
import { getWikiEntriesByFlavorNode } from '../../../data/wiki';
import type { FlavorWheelNode, WikiCategory } from '../../../domain/schemas';
import { t } from '../../../i18n';
import { CATEGORY_SECTION } from '../../wiki/sections';
import { softenedFill } from '../utils/label-tone';
import { PRESENCE_CATEGORY_ORDER, summarizeWikiPresence, type WikiPresence } from '../utils/wiki-presence';

const TIER_KEY = { 1: 'wheel.tiers.family', 2: 'wheel.tiers.subfamily', 3: 'wheel.tiers.descriptor' } as const;
const CHILDREN_KEY = { 1: 'wheel.childrenTitle.family', 2: 'wheel.childrenTitle.subfamily' } as const;

function presenceLine(presence: WikiPresence): string {
  const total =
    presence.total === 1 ? t('wheel.presence.one') : t('wheel.presence.many', { count: presence.total });
  const parts = presence.byCategory.map(({ category, count }) =>
    count === 1 ? t(`wheel.presence.${category}.one`) : t(`wheel.presence.${category}.many`, { count }),
  );
  return `${total}: ${parts.join(', ')}`;
}

const ChevronRight: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export interface FlavorDescriptorDrawerProps {
  readonly node: FlavorWheelNode;
  readonly lineage: readonly FlavorWheelNode[];
  /** `aside` beside the wheel (≥ 768 px); `sheet` as a non-modal bottom sheet on narrow screens. */
  readonly presentation: 'aside' | 'sheet';
  readonly onSelect: (nodeId: string) => void;
  readonly onClose: () => void;
}

/** Detail of the selected flavor: path, tasting note, children and the wiki entries that mention it. */
export const FlavorDescriptorDrawer: React.FC<FlavorDescriptorDrawerProps> = ({ node, lineage, presentation, onSelect, onClose }) => {
  const titleId = useId();
  const entries = getWikiEntriesByFlavorNode(node.id);
  const presence = summarizeWikiPresence(entries);
  const groups = PRESENCE_CATEGORY_ORDER.map((category: WikiCategory) => ({
    category,
    items: entries.filter((entry) => entry.category === category),
  })).filter((group) => group.items.length > 0);
  const ancestors = lineage.slice(0, -1);
  const childrenKey = node.tier === 3 ? undefined : CHILDREN_KEY[node.tier];

  const body = (
    <>
      <div className="fw-panel-top">
        <nav aria-label={t('wheel.pathLabel')}>
          <ol className="fw-crumbs">
            {ancestors.map((ancestor) => (
              <li key={ancestor.id}>
                <button type="button" className="fw-crumb" onClick={() => onSelect(ancestor.id)}>
                  {t(ancestor.labelKey)}
                </button>
                <span className="fw-crumb-sep" aria-hidden="true">
                  ›
                </span>
              </li>
            ))}
            <li>
              <span className="fw-crumb fw-crumb--current" aria-current="location">
                {t(node.labelKey)}
              </span>
            </li>
          </ol>
        </nav>
        <button type="button" className="fw-icon-btn pressable" aria-label={t('wheel.close')} onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      <span className="fw-eyebrow">{t(TIER_KEY[node.tier])}</span>
      <h2 id={titleId} className="fw-panel-title">
        <span className="fw-swatch" style={{ background: softenedFill(node.colorHex) }} aria-hidden="true" />
        {t(node.labelKey)}
      </h2>
      <p className="fw-note">{t(node.tastingNoteKey)}</p>

      {childrenKey ? (
        <section className="fw-sec">
          <h3 id={`${titleId}-children`}>{t(childrenKey)}</h3>
          <div className="fw-chips" role="group" aria-labelledby={`${titleId}-children`}>
            {node.children.map((child) => (
              <button key={child.id} type="button" className="fw-chip pressable" onClick={() => onSelect(child.id)}>
                <span className="fw-dot" style={{ background: softenedFill(child.colorHex) }} aria-hidden="true" />
                {t(child.labelKey)}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="fw-sec">
        <h3>{t('wheel.related.title')}</h3>
        {groups.length > 0 ? (
          <>
            <p className="fw-presence">{presenceLine(presence)}</p>
            {groups.map(({ category, items }) => (
              <div key={category} className="fw-rel-group" role="group" aria-labelledby={`${titleId}-${category}`}>
                <h4 id={`${titleId}-${category}`}>{t(`wheel.related.${category}`)}</h4>
                {items.map((entry) => (
                  <Link key={entry.slug} className="fw-rel" to={`/wiki/${CATEGORY_SECTION[category]}/${entry.slug}`}>
                    <span>{t(entry.titleKey)}</span>
                    <ChevronRight />
                  </Link>
                ))}
              </div>
            ))}
          </>
        ) : (
          <p className="fw-empty">{t('wheel.related.empty')}</p>
        )}
      </section>
    </>
  );

  return presentation === 'sheet' ? (
    <div className="fw-panel fw-panel--sheet" role="dialog" aria-modal="false" aria-labelledby={titleId}>
      {body}
    </div>
  ) : (
    <aside className="fw-panel fw-panel--aside" aria-labelledby={titleId}>
      {body}
    </aside>
  );
};
