import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FLAVOR_WHEEL_TREE, getDescendantFlavorNodeIds, getFlavorNodeById, getFlavorNodeLineage } from '../../../data/flavor-wheel';
import type { FlavorWheelNode } from '../../../domain/schemas';
import { t } from '../../../i18n';
import type { FlavorSelection } from '../hooks/useFlavorSelection';
import { REDUCED_MOTION_QUERY, useMediaQuery } from '../hooks/useMediaQuery';
import { pickLabelTone, softenedFill } from '../utils/label-tone';
import { WHEEL_VIEWBOX, arcPath, labelPlacement, layoutWheel, type WheelSegment } from '../utils/wheel-geometry';

/** How the last zoom change was triggered: keyboard changes skip the animation (Emil: no motion on keyboard actions). */
type ZoomSource = 'initial' | 'pointer' | 'keyboard';

const FOCUS_RING_INSET = 2;
const FOCUS_RING_ANGLE_INSET = 0.004;

function siblingsOf(node: FlavorWheelNode): readonly FlavorWheelNode[] {
  const lineage = getFlavorNodeLineage(node.id) ?? [];
  const parent = lineage[lineage.length - 2];
  return parent ? parent.children : FLAVOR_WHEEL_TREE;
}

function parentOf(node: FlavorWheelNode): FlavorWheelNode | undefined {
  const lineage = getFlavorNodeLineage(node.id) ?? [];
  return lineage[lineage.length - 2];
}

interface SegmentProps {
  readonly segment: WheelSegment;
  readonly label: string;
  readonly selected: boolean;
  readonly dimmed: boolean;
  readonly expanded: boolean | undefined;
  readonly tabbable: boolean;
  readonly registerRef: (id: string, el: SVGGElement | null) => void;
}

const WheelSegmentItem: React.FC<SegmentProps> = ({ segment, label, selected, dimmed, expanded, tabbable, registerRef }) => {
  const { node } = segment;
  const placement = labelPlacement(segment, label);
  const tone = pickLabelTone(node.colorHex);
  return (
    <g
      ref={(el) => registerRef(node.id, el)}
      className="fw-seg"
      role="treeitem"
      tabIndex={tabbable ? 0 : -1}
      aria-label={label}
      aria-level={node.tier}
      aria-posinset={segment.posInSet}
      aria-setsize={segment.setSize}
      aria-selected={selected}
      aria-expanded={expanded}
      data-fw-node={node.id}
      data-dimmed={dimmed}
      data-selected={selected}
    >
      <path
        className="fw-seg-fill"
        d={arcPath(segment.innerRadius, segment.outerRadius, segment.startAngle, segment.endAngle)}
        style={{ fill: softenedFill(node.colorHex) }}
      />
      {placement.fits ? (
        <text
          className={`fw-label fw-label--${tone}`}
          x={placement.x}
          y={placement.y}
          transform={`rotate(${placement.rotation} ${placement.x} ${placement.y})`}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={placement.fontSize}
          aria-hidden="true"
        >
          {label}
        </text>
      ) : null}
      <path
        className="fw-seg-ring"
        d={arcPath(
          segment.innerRadius + FOCUS_RING_INSET,
          segment.outerRadius - FOCUS_RING_INSET,
          segment.startAngle + FOCUS_RING_ANGLE_INSET,
          segment.endAngle - FOCUS_RING_ANGLE_INSET,
        )}
        aria-hidden="true"
      />
    </g>
  );
};

export interface SunburstFlavorWheelSvgProps {
  readonly selection: FlavorSelection;
}

/** Radial SCA wheel: 3 rings, zoom to the selected node's family, roving-tabindex tree keyboard model. */
export const SunburstFlavorWheelSvg: React.FC<SunburstFlavorWheelSvgProps> = ({ selection }) => {
  const { selectedNode, lineage, focusFamily, select, clear } = selection;
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [zoomSource, setZoomSource] = useState<ZoomSource>('initial');
  /** Segment to focus once the layer it lives in (`'all'` or a family id) is mounted. */
  const pendingFocus = useRef<{ readonly id: string; readonly layer: string } | null>(null);
  const segmentEls = useRef(new Map<string, SVGGElement>());
  const layerKey = focusFamily?.id ?? 'all';

  const segments = useMemo(() => layoutWheel(FLAVOR_WHEEL_TREE, focusFamily?.id ?? null), [focusFamily]);
  const visibleIds = useMemo(() => new Set(segments.map((s) => s.node.id)), [segments]);
  const highlighted = useMemo(
    () => (selectedNode ? new Set([...lineage.map((n) => n.id), ...getDescendantFlavorNodeIds(selectedNode.id)]) : null),
    [selectedNode, lineage],
  );

  const tabId =
    focusedId && visibleIds.has(focusedId)
      ? focusedId
      : selectedNode && visibleIds.has(selectedNode.id)
        ? selectedNode.id
        : segments[0]?.node.id;

  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending || pending.layer !== layerKey) return;
    const el = segmentEls.current.get(pending.id);
    if (el) {
      el.focus();
      pendingFocus.current = null;
    }
  });

  const registerRef = (id: string, el: SVGGElement | null): void => {
    if (el) segmentEls.current.set(id, el);
    else if (segmentEls.current.get(id) && !segmentEls.current.get(id)?.isConnected) segmentEls.current.delete(id);
  };

  const focusSegment = (id: string, layer: string = layerKey): void => {
    setFocusedId(id);
    pendingFocus.current = { id, layer };
  };

  const selectFromKeyboard = (node: FlavorWheelNode): void => {
    setZoomSource('keyboard');
    select(node.id);
    const family = getFlavorNodeLineage(node.id)?.[0]?.id ?? node.id;
    // A family becomes the center when selected: keep the focus inside its branch.
    focusSegment(node.tier === 1 ? (node.children[0]?.id ?? node.id) : node.id, family);
  };

  const resetToFamily = (familyId: string, source: ZoomSource): void => {
    setZoomSource(source);
    clear();
    focusSegment(familyId, 'all');
  };

  const moveFocusTo = (target: FlavorWheelNode): void => {
    if (visibleIds.has(target.id)) {
      focusSegment(target.id);
      return;
    }
    // Only a family can be hidden (it is the center of the zoomed branch): show the full wheel.
    resetToFamily(target.id, 'keyboard');
  };

  const onKeyDown = (event: React.KeyboardEvent<SVGGElement>): void => {
    const id = (event.target as Element).closest('[data-fw-node]')?.getAttribute('data-fw-node');
    const node = id ? getFlavorNodeById(id) : undefined;
    if (!node) return;
    const siblings = siblingsOf(node);
    const index = siblings.findIndex((s) => s.id === node.id);
    let target: FlavorWheelNode | undefined;

    switch (event.key) {
      case 'ArrowRight':
        target = siblings[(index + 1) % siblings.length];
        break;
      case 'ArrowLeft':
        target = siblings[(index - 1 + siblings.length) % siblings.length];
        break;
      case 'Home':
        target = siblings[0];
        break;
      case 'End':
        target = siblings[siblings.length - 1];
        break;
      case 'ArrowDown':
        target = node.children[0];
        break;
      case 'ArrowUp':
        target = parentOf(node);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        selectFromKeyboard(node);
        return;
      case 'Escape':
        if (focusFamily) {
          event.preventDefault();
          resetToFamily(focusFamily.id, 'keyboard');
        }
        return;
      default:
        return;
    }
    event.preventDefault();
    if (target) moveFocusTo(target);
  };

  const onClick = (event: React.MouseEvent<SVGGElement>): void => {
    const id = (event.target as Element).closest('[data-fw-node]')?.getAttribute('data-fw-node');
    if (!id) return;
    setZoomSource('pointer');
    setFocusedId(id);
    select(id);
  };

  const onBack = (event: React.MouseEvent<HTMLButtonElement>): void => {
    if (!focusFamily) return;
    // `detail === 0` means the button was activated from the keyboard.
    const fromKeyboard = event.detail === 0;
    if (fromKeyboard) {
      resetToFamily(focusFamily.id, 'keyboard');
    } else {
      setZoomSource('pointer');
      clear();
    }
  };

  const animate = zoomSource === 'pointer' && !reducedMotion;

  return (
    <div className="fw-wheel">
      <div key={focusFamily?.id ?? 'all'} data-testid="wheel-layer" className={animate ? 'fw-wheel-layer fw-animate' : 'fw-wheel-layer'}>
        <svg className="fw-wheel-svg" viewBox={`0 0 ${WHEEL_VIEWBOX} ${WHEEL_VIEWBOX}`}>
          <g role="tree" aria-label={t('wheel.treeLabel')} onKeyDown={onKeyDown} onClick={onClick}>
            {segments.map((segment) => {
              const { node } = segment;
              const isSelected = selectedNode?.id === node.id;
              const isExpanded =
                node.tier < 3 ? Boolean(selectedNode && lineage.some((n) => n.id === node.id) && node.tier < selectedNode.tier) : undefined;
              return (
                <WheelSegmentItem
                  key={node.id}
                  segment={segment}
                  label={t(node.labelKey)}
                  selected={isSelected}
                  dimmed={highlighted ? !highlighted.has(node.id) : false}
                  expanded={isExpanded}
                  tabbable={node.id === tabId}
                  registerRef={registerRef}
                />
              );
            })}
          </g>
        </svg>
        {focusFamily ? (
          <button type="button" className="fw-center fw-center--button pressable" aria-label={t('wheel.center.backAria')} onClick={onBack}>
            <span className="fw-center-eyebrow">{t('wheel.tiers.family')}</span>
            <strong>{t(focusFamily.labelKey)}</strong>
            <span className="fw-center-back">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {t('wheel.center.back')}
            </span>
          </button>
        ) : (
          <div className="fw-center" aria-hidden="true">
            <span className="fw-center-eyebrow">{t('wheel.center.eyebrow')}</span>
            <strong>{t('wheel.center.title')}</strong>
            <span className="fw-center-eyebrow">{t('wheel.center.hint')}</span>
          </div>
        )}
      </div>
      <p className="fw-kbd" aria-label={t('wheel.keyboard.label')}>
        <kbd>{t('wheel.keyboard.sideKeys')}</kbd> {t('wheel.keyboard.side')} · <kbd>{t('wheel.keyboard.downKey')}</kbd> {t('wheel.keyboard.down')} ·{' '}
        <kbd>{t('wheel.keyboard.upKey')}</kbd> {t('wheel.keyboard.up')} · <kbd>{t('wheel.keyboard.enterKey')}</kbd> {t('wheel.keyboard.enter')} ·{' '}
        <kbd>{t('wheel.keyboard.escKey')}</kbd> {t('wheel.keyboard.esc')}
      </p>
    </div>
  );
};
