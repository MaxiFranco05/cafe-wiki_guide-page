import React, { useId } from 'react';
import type { DrinkEntry } from '../../../domain/schemas';
import { t } from '../../../i18n';
import { vesselSpec, type VesselKind } from '../utils/wiki-ui.helpers';

type LayerKey = 'water' | 'coffee' | 'milk' | 'foam';

/** Bottom-to-top layer order with design-token colors (milk vs foam kept clearly distinct). */
const LAYERS: readonly { key: LayerKey; color: string }[] = [
  { key: 'water', color: 'var(--svg-water-stream)' },
  { key: 'coffee', color: 'var(--svg-coffee-liquid)' },
  { key: 'milk', color: 'color-mix(in srgb, var(--accent-gold) 58%, var(--text-secondary))' },
  { key: 'foam', color: 'var(--text-primary)' },
];

interface VesselGeometry {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly width: number;
  readonly outer: string;
  readonly inner: string;
  readonly handle: string;
}

const GEOMETRY: Readonly<Record<VesselKind, VesselGeometry>> = {
  demitasse: {
    top: 44, bottom: 128, left: 24, width: 84,
    outer: 'M20 44 H112 L106 116 Q104 132 90 132 H42 Q28 132 26 116 Z',
    inner: 'M25 48 H107 L102 115 Q100 128 89 128 H43 Q32 128 30 115 Z',
    handle: 'M110 58 h8 a13 13 0 0 1 0 28 h-10',
  },
  medium: {
    top: 26, bottom: 128, left: 22, width: 88,
    outer: 'M18 26 H114 L107 116 Q105 132 91 132 H41 Q27 132 25 116 Z',
    inner: 'M23 30 H109 L103 115 Q101 128 90 128 H42 Q31 128 29 115 Z',
    handle: 'M112 46 h8 a14 14 0 0 1 0 30 h-11',
  },
  large: {
    top: 14, bottom: 130, left: 26, width: 80,
    outer: 'M22 14 H110 L103 120 Q101 134 89 134 H43 Q31 134 29 120 Z',
    inner: 'M27 18 H105 L99 119 Q97 130 88 130 H44 Q35 130 33 119 Z',
    handle: 'M108 38 h8 a15 15 0 0 1 0 34 h-11',
  },
  tall: {
    top: 14, bottom: 130, left: 26, width: 80,
    outer: 'M22 14 H110 L103 120 Q101 134 89 134 H43 Q31 134 29 120 Z',
    inner: 'M27 18 H105 L99 119 Q97 130 88 130 H44 Q35 130 33 119 Z',
    handle: '',
  },
};

const SCALE_X = 148;

/** Vessel drawn to scale for the served volume, with layers, ml scale and a legend. */
export const DrinkComposition: React.FC<{ readonly drink: DrinkEntry }> = ({ drink }) => {
  const clipId = `cup-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const spec = vesselSpec(drink);
  const g = GEOMETRY[spec.kind];
  const comp = drink.composition;
  const vessel = t(`wiki.ui.composition.vessels.${spec.kind}`);
  const innerHeight = g.bottom - (g.top + 4);
  const liquidHeight = innerHeight * spec.fillRatio;
  const surface = g.bottom - liquidHeight;

  let cursor = g.bottom;
  const active = LAYERS.filter((layer) => comp[layer.key] > 0);
  const rects = active.map((layer, index) => {
    const height = (comp[layer.key] / 100) * liquidHeight;
    cursor -= height;
    return (
      <g key={layer.key}>
        <rect x={g.left} y={cursor.toFixed(1)} width={g.width} height={(height + 0.6).toFixed(1)} fill={layer.color} />
        {index > 0 && (
          <line x1={g.left} y1={(cursor + height).toFixed(1)} x2={g.left + g.width} y2={(cursor + height).toFixed(1)} stroke="color-mix(in srgb, var(--bg-canvas) 38%, transparent)" strokeWidth={1} />
        )}
      </g>
    );
  });
  const blackCoffee = !comp.milk && !comp.foam && !spec.ice && comp.coffee > 0;
  const cremaHeight = Math.min(5, Math.max(3, liquidHeight * 0.14));
  const layerSummary = LAYERS.filter((l) => comp[l.key] > 0)
    .map((l) => t('wiki.ui.composition.layerValue', { label: t(`wiki.ui.composition.layers.${l.key}`), value: comp[l.key] }))
    .join(', ');

  return (
    <div className="w-compo">
      <figure className="w-vessel-box">
        <svg
          viewBox="0 0 198 148"
          width="100%"
          role="img"
          aria-label={t('wiki.ui.composition.aria', { vessel, min: drink.servedVolumeMl.min, max: drink.servedVolumeMl.max, layers: layerSummary })}
        >
          <defs>
            <clipPath id={clipId}>
              <path d={g.inner} />
            </clipPath>
          </defs>
          <path d={g.outer} fill="var(--bg-canvas)" stroke="color-mix(in srgb, var(--accent-gold) 78%, var(--border-strong))" strokeWidth={2.2} strokeLinejoin="round" />
          <path d={g.inner} fill="var(--bg-elevated)" />
          <g clipPath={`url(#${clipId})`}>
            {rects}
            {blackCoffee && <rect x={g.left} y={surface.toFixed(1)} width={g.width} height={cremaHeight.toFixed(1)} fill="var(--svg-coffee-crema)" opacity={0.88} />}
            {spec.ice && (
              <g opacity={0.45} fill="var(--svg-vessel-glass)" stroke="var(--text-primary)" strokeWidth={1}>
                <rect x={38} y={(surface + 8).toFixed(1)} width={18} height={16} rx={3} transform={`rotate(-10 47 ${(surface + 16).toFixed(1)})`} />
                <rect x={64} y={(surface + 12).toFixed(1)} width={19} height={17} rx={3} transform={`rotate(12 73 ${(surface + 20).toFixed(1)})`} />
                <rect x={49} y={(surface + 32).toFixed(1)} width={17} height={15} rx={3} transform={`rotate(6 57 ${(surface + 39).toFixed(1)})`} />
              </g>
            )}
            <line x1={g.left} y1={surface.toFixed(1)} x2={g.left + g.width} y2={surface.toFixed(1)} stroke="color-mix(in srgb, var(--accent-gold) 65%, transparent)" strokeWidth={1.2} />
          </g>
          <path d={g.inner} fill="none" stroke="color-mix(in srgb, var(--bg-canvas) 68%, transparent)" strokeWidth={1.5} />
          {spec.hasHandle && <path d={g.handle} fill="none" stroke="color-mix(in srgb, var(--accent-gold) 72%, var(--border-strong))" strokeWidth={2.2} strokeLinecap="round" />}
          <line x1={12} y1={138} x2={122} y2={138} stroke="var(--border-strong)" strokeWidth={2} strokeLinecap="round" />
          <line x1={SCALE_X} y1={g.top + 4} x2={SCALE_X} y2={g.bottom} stroke="var(--border-recessed)" strokeWidth={1} />
          {spec.ticksMl.map((ml) => {
            const y = g.bottom - (ml / spec.capacityMl) * innerHeight;
            return (
              <g key={ml}>
                <line x1={SCALE_X - 6} y1={y.toFixed(1)} x2={SCALE_X} y2={y.toFixed(1)} stroke="var(--border-strong)" strokeWidth={1.2} />
                <text x={SCALE_X + 4} y={(y + 4).toFixed(1)} fill="var(--text-muted)" fontFamily="var(--font-mono)" fontSize={11}>
                  {ml}
                </text>
              </g>
            );
          })}
          <line x1={106} y1={surface.toFixed(1)} x2={SCALE_X - 8} y2={surface.toFixed(1)} stroke="var(--accent-gold)" strokeWidth={1} strokeDasharray="2.5 2.5" opacity={0.75} />
          <circle cx={SCALE_X - 8} cy={surface.toFixed(1)} r={2.2} fill="var(--accent-gold)" />
        </svg>
        <figcaption>{t('wiki.ui.composition.caption', { vessel, cap: spec.capacityMl })}</figcaption>
      </figure>
      <ul className="w-legend">
        {LAYERS.slice()
          .reverse()
          .map((layer) => (
            <li key={layer.key} className={comp[layer.key] ? '' : 'off'} style={{ '--layer': layer.color } as React.CSSProperties}>
              <i aria-hidden="true" />
              <span>{t(`wiki.ui.composition.layers.${layer.key}`)}</span>
              <b>{`${comp[layer.key]}%`}</b>
            </li>
          ))}
        <li className="w-legend-vol">
          <i aria-hidden="true" />
          <span>{t('wiki.ui.chapters.composition.served')}</span>
          <b>{t('wiki.ui.detail.facts.servingValue', { min: drink.servedVolumeMl.min, max: drink.servedVolumeMl.max })}</b>
        </li>
      </ul>
    </div>
  );
};
