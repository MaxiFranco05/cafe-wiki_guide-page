import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { FLAVOR_WHEEL_TREE } from '../../../data/flavor-wheel';
import { t } from '../../../i18n';
import { FlavorDescriptorDrawer } from '../components/FlavorDescriptorDrawer';
import { FlavorTastingGuide } from '../components/FlavorTastingGuide';
import { MobileFlavorTreeAccordion } from '../components/MobileFlavorTreeAccordion';
import { SunburstFlavorWheelSvg } from '../components/SunburstFlavorWheelSvg';
import { useFlavorSelection } from '../hooks/useFlavorSelection';
import { useGuideDismissed } from '../hooks/useGuideDismissed';
import { NARROW_QUERY, useMediaQuery } from '../hooks/useMediaQuery';
import { countDescriptors } from '../utils/wheel-geometry';
import '../flavor-wheel.css';

const FAMILY_COUNT = FLAVOR_WHEEL_TREE.length;
const SUBFAMILY_COUNT = FLAVOR_WHEEL_TREE.reduce((sum, family) => sum + family.children.length, 0);
const DESCRIPTOR_COUNT = FLAVOR_WHEEL_TREE.reduce((sum, family) => sum + countDescriptors(family), 0);

/** `/flavor-wheel`: radial wheel (≥ 768 px) or accordion, detail panel, beginner guide and return link. */
export const FlavorWheelView: React.FC = () => {
  const selection = useFlavorSelection();
  const { selectedNode, lineage, returnEntry, select, clear } = selection;
  const narrow = useMediaQuery(NARROW_QUERY);
  const guide = useGuideDismissed();
  const wheelRef = useRef<HTMLElement>(null);
  const accordionRef = useRef<HTMLElement>(null);
  /** Ids to try (selected first, then ancestors) when focus returns after closing the panel. */
  const restoreFocusIds = useRef<readonly string[] | null>(null);

  const closePanel = useCallback(() => {
    restoreFocusIds.current = lineage.map((node) => node.id).reverse();
    clear();
  }, [lineage, clear]);

  useEffect(() => {
    const ids = restoreFocusIds.current;
    if (!ids || selectedNode) return;
    restoreFocusIds.current = null;
    const root = narrow ? accordionRef.current : wheelRef.current;
    for (const id of ids) {
      const el = root?.querySelector<HTMLElement | SVGElement>(`[data-fw-node="${id}"]`);
      if (el) {
        el.focus();
        return;
      }
    }
  }, [selectedNode, narrow]);

  // On narrow screens the panel is a bottom sheet: Escape closes it.
  useEffect(() => {
    if (!narrow || !selectedNode) return undefined;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') closePanel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [narrow, selectedNode, closePanel]);

  const showGuide = !(narrow && guide.dismissed);

  return (
    <div className="fw">
      {returnEntry ? (
        <Link className="fw-return pressable" to={returnEntry.href}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {t('wheel.returnTo', { title: returnEntry.title })}
        </Link>
      ) : null}

      <header className="fw-head">
        <div>
          <span className="fw-tag">{t('wheel.tag')}</span>
          <h1>{t('wheel.title')}</h1>
          <p className="fw-sub">{t('wheel.subtitle')}</p>
        </div>
        <p className="fw-counts">
          <span>{t('wheel.counts.families', { count: FAMILY_COUNT })}</span>
          <span>{t('wheel.counts.subfamilies', { count: SUBFAMILY_COUNT })}</span>
          <span>{t('wheel.counts.descriptors', { count: DESCRIPTOR_COUNT })}</span>
        </p>
      </header>

      <div className="fw-grid">
        <section ref={wheelRef} className="fw-card fw-wheel-card" aria-label={t('wheel.wheelRegion')}>
          <SunburstFlavorWheelSvg selection={selection} />
        </section>

        <div className="fw-side">
          {selectedNode ? (
            narrow ? (
              // <main> is its own stacking context (z-10): the sheet must leave it to sit above the tab bar.
              createPortal(
                <div className="fw">
                  <div className="fw-backdrop" aria-hidden="true" onClick={closePanel} />
                  <FlavorDescriptorDrawer node={selectedNode} lineage={lineage} presentation="sheet" onSelect={select} onClose={closePanel} />
                </div>,
                document.body,
              )
            ) : (
              <FlavorDescriptorDrawer node={selectedNode} lineage={lineage} presentation="aside" onSelect={select} onClose={closePanel} />
            )
          ) : showGuide ? (
            <FlavorTastingGuide onPick={select} onDismiss={narrow ? guide.dismiss : undefined} />
          ) : null}
        </div>

        <section ref={accordionRef} className="fw-card fw-acc-card" aria-label={t('wheel.accordionLabel')}>
          <MobileFlavorTreeAccordion selection={selection} />
        </section>
      </div>
    </div>
  );
};
