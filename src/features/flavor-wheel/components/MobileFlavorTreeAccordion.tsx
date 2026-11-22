import React from 'react';
import { FLAVOR_WHEEL_TREE } from '../../../data/flavor-wheel';
import type { FlavorWheelNode } from '../../../domain/schemas';
import { t } from '../../../i18n';
import type { FlavorSelection } from '../hooks/useFlavorSelection';
import { softenedFill } from '../utils/label-tone';
import { countDescriptors } from '../utils/wheel-geometry';

const Chevron: React.FC = () => (
  <svg className="fw-acc-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

interface RowProps {
  readonly node: FlavorWheelNode;
  readonly expanded: boolean;
  readonly selected: boolean;
  readonly onActivate: (node: FlavorWheelNode) => void;
}

const AccordionRow: React.FC<RowProps> = ({ node, expanded, selected, onActivate }) => (
  <button
    type="button"
    className={`fw-acc-row fw-acc-row--tier${node.tier}${selected ? ' is-selected' : ''}`}
    aria-expanded={expanded}
    data-tier={node.tier}
    data-fw-node={node.id}
    onClick={() => onActivate(node)}
  >
    <span className="fw-acc-bar" style={{ background: softenedFill(node.colorHex) }} aria-hidden="true" />
    <span className="fw-acc-name">{t(node.labelKey)}</span>
    <span className="fw-acc-count">{t('wheel.descriptorCount', { count: countDescriptors(node) })}</span>
    <Chevron />
  </button>
);

export interface MobileFlavorTreeAccordionProps {
  readonly selection: FlavorSelection;
}

/** Touch-first tree for narrow screens; shares the `?node=` selection with the wheel. */
export const MobileFlavorTreeAccordion: React.FC<MobileFlavorTreeAccordionProps> = ({ selection }) => {
  const { selectedNode, lineage, select, clear } = selection;
  const onPath = (id: string): boolean => lineage.some((n) => n.id === id);

  const activate = (node: FlavorWheelNode): void => {
    // Tapping an open node that is already selected folds it back to its parent.
    if (selectedNode?.id === node.id && node.tier < 3) {
      const parent = lineage[lineage.length - 2];
      if (parent) select(parent.id);
      else clear();
      return;
    }
    select(node.id);
  };

  return (
    <ul className="fw-acc" role="list">
      {FLAVOR_WHEEL_TREE.map((family) => {
        const familyOpen = onPath(family.id);
        return (
          <li key={family.id} className="fw-acc-family">
            <AccordionRow node={family} expanded={familyOpen} selected={selectedNode?.id === family.id} onActivate={activate} />
            {familyOpen ? (
              <ul className="fw-acc-subs" role="list">
                {family.children.map((sub) => {
                  const subOpen = onPath(sub.id);
                  return (
                    <li key={sub.id}>
                      <AccordionRow node={sub} expanded={subOpen} selected={selectedNode?.id === sub.id} onActivate={activate} />
                      {subOpen ? (
                        <div className="fw-acc-leaves">
                          {sub.children.map((leaf) => (
                            <button
                              key={leaf.id}
                              type="button"
                              className="fw-acc-chip"
                              aria-pressed={selectedNode?.id === leaf.id}
                              data-fw-node={leaf.id}
                              onClick={() => activate(leaf)}
                            >
                              <span className="fw-dot" style={{ background: softenedFill(leaf.colorHex) }} aria-hidden="true" />
                              {t(leaf.labelKey)}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
};
