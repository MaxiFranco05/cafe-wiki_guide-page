import React, { useId } from 'react';
import type { SensoryProfile } from '../../../domain/schemas';
import { t } from '../../../i18n';
import { SENSORY_KEYS } from '../utils/wiki-ui.helpers';

export interface SensoryWheelProps {
  readonly profile: SensoryProfile;
  readonly variant: 'full' | 'compact';
}

const START = -Math.PI / 2; // first sector (Acidez) starts at 12 o'clock and runs clockwise
const QUARTER = Math.PI / 2;

function sectorPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  return `M${cx} ${cy}L${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}Z`;
}

const labelOf = (key: (typeof SENSORY_KEYS)[number]) => t(`wiki.ui.sensory.${key}`);

/** "Predomina acidez y dulzor (4/5)." */
export function sensorySummary(profile: SensoryProfile): string {
  const top = Math.max(...SENSORY_KEYS.map((k) => profile[k]));
  const attrs = SENSORY_KEYS.filter((k) => profile[k] === top).map((k) => labelOf(k).toLowerCase());
  const joined = attrs.length > 1 ? `${attrs.slice(0, -1).join(', ')} ${t('wiki.ui.sensory.and')} ${attrs[attrs.length - 1]}` : attrs[0] ?? '';
  return t('wiki.ui.sensory.summary', { attrs: joined, value: top });
}

/**
 * Four-sector radial "performance wheel": each sector fills from the centre up to value/5.
 * `full` adds labels, ring ticks and an accessible description; `compact` is decorative only
 * (cards show the readable profile line next to it).
 */
export const SensoryWheel: React.FC<SensoryWheelProps> = ({ profile, variant }) => {
  const gradientId = `wheel-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const compact = variant === 'compact';
  const c = compact ? 32 : 150;
  const R = compact ? 29 : 104;
  const gap = compact ? 0.05 : 0.03;
  const values = SENSORY_KEYS.map((key) => t('wiki.ui.sensory.valueAria', { label: labelOf(key), value: profile[key] })).join(', ');

  const svg = (
    <svg
      className={`w-wheel ${compact ? 'w-wheel--mini' : 'w-wheel--full'}`}
      viewBox={compact ? '0 0 64 64' : '-40 -10 380 320'}
      {...(compact ? { 'aria-hidden': true } : { role: 'img', 'aria-label': t('wiki.ui.sensory.wheelAria', { values }) })}
    >
      <defs>
        <radialGradient id={gradientId} cx={c} cy={c} r={R} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.95} />
          <stop offset="100%" stopColor="var(--accent-gold)" stopOpacity={0.9} />
        </radialGradient>
      </defs>
      {SENSORY_KEYS.map((key, i) => {
        const r = (profile[key] / 5) * R;
        const d = sectorPath(c, c, r, START + i * QUARTER + gap, START + (i + 1) * QUARTER - gap);
        return (
          <g key={key}>
            <path d={d} fill={`url(#${gradientId})`} data-sector={key} data-radius={r} />
            {!compact && <path className="fill-edge" d={d} />}
          </g>
        );
      })}
      {[1, 2, 3, 4, 5].map((ring) => (
        <circle key={ring} className={`ring ${ring === 5 ? 'ring--outer' : ''}`} cx={c} cy={c} r={(ring / 5) * R} />
      ))}
      {[0, 1, 2, 3].map((i) => {
        const a = START + i * QUARTER;
        return <line key={i} className="spoke" x1={c} y1={c} x2={(c + R * Math.cos(a)).toFixed(2)} y2={(c + R * Math.sin(a)).toFixed(2)} />;
      })}
      {!compact &&
        [1, 2, 3, 4, 5].map((ring) => (
          <text key={`t${ring}`} className="tick" x={c + 3} y={(c - (ring / 5) * R + 9).toFixed(1)}>
            {ring}
          </text>
        ))}
      {!compact &&
        SENSORY_KEYS.map((key, i) => {
          const a = START + (i + 0.5) * QUARTER;
          const x = c + (R + 30) * Math.cos(a);
          const y = c + (R + 30) * Math.sin(a);
          const anchor = Math.cos(a) > 0.2 ? 'start' : Math.cos(a) < -0.2 ? 'end' : 'middle';
          return (
            <g key={`l${key}`} aria-hidden="true">
              <text x={x.toFixed(1)} y={(y - 2).toFixed(1)} textAnchor={anchor}>
                {labelOf(key)}
              </text>
              <text className="val" x={x.toFixed(1)} y={(y + 14).toFixed(1)} textAnchor={anchor}>
                {`${profile[key]}/5`}
              </text>
            </g>
          );
        })}
    </svg>
  );

  if (compact) return svg;
  return (
    <>
      {svg}
      <p className="w-wheel-caption">{sensorySummary(profile)}</p>
    </>
  );
};
