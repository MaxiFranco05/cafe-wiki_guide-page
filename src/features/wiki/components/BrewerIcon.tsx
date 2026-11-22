import React from 'react';
import type { SvgStageDirective } from '../../../domain/schemas';
import { MethodVesselIcon } from '../../brewing/components/MethodVesselIcon';

/** Brewers with a brew station reuse the station vessel icon (C-03). */
const STATION_VESSELS: Readonly<Record<string, SvgStageDirective['vesselType']>> = {
  v60: 'cone_v60',
  chemex: 'hourglass_chemex',
  melitta: 'wedge_melitta',
  aeropress: 'cylinder_aeropress',
  'french-press': 'beaker_french_press',
  'espresso-machine': 'portafilter_espresso',
};

const svgProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 32 32',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

/** Encyclopedic brewers drawn in the same 32x32 grammar as MethodVesselIcon. */
const ENCYCLOPEDIC: Readonly<Record<string, React.ReactNode>> = {
  moka: (
    <>
      <path d="M10 8h11l-2 9h-7L10 8Z" />
      <path d="M12 17h7l2 10H10l2-10Z" />
      <path d="M12 8l3.5-3L19 8" />
      <path d="M21 10h3.5c1.2 0 2 1 2 2.2V16" stroke="var(--accent-gold)" />
      <circle cx="15.5" cy="22" r="1.2" fill="var(--accent-gold)" stroke="none" />
    </>
  ),
  siphon: (
    <>
      <circle cx="15.5" cy="9.5" r="5" />
      <circle cx="15.5" cy="21" r="4.5" />
      <path d="M15.5 14.5v4" stroke="var(--accent-gold)" strokeWidth="1.6" />
      <path d="M11 27.5h9" />
      <path d="M15.5 25.5v2" stroke="var(--accent-gold)" />
    </>
  ),
  cezve: (
    <>
      <path d="M7 11h10l1.8 13a2 2 0 0 1-2 2.2H7.2a2 2 0 0 1-2-2.2L7 11Z" />
      <path d="M17 13l9-4.5" stroke="var(--accent-gold)" strokeWidth="2" />
      <path d="M8.5 8.5c1-1.5 2.5-1.5 3.5 0s2.5 1.5 3.5 0" stroke="var(--accent-gold)" strokeWidth="1.3" />
    </>
  ),
  'electric-drip': (
    <>
      <path d="M7 6h14v5H11v15H7V6Z" />
      <path d="M13 11h8l-1.5 4h-5L13 11Z" />
      <rect x="13" y="17" width="8" height="8" rx="1.5" />
      <path d="M21 19h2.2a1.5 1.5 0 0 1 0 3H21" />
      <path d="M9 10v12" stroke="var(--accent-gold)" strokeWidth="1.6" />
    </>
  ),
};

export const BrewerIcon: React.FC<{ readonly slug: string }> = ({ slug }) => {
  const vessel = STATION_VESSELS[slug];
  if (vessel) return <MethodVesselIcon vesselType={vessel} className="w-brewer-svg" />;
  return (
    <svg {...svgProps} className="w-brewer-svg" data-brewer={slug}>
      {ENCYCLOPEDIC[slug] ?? <path d="M7 8h18l-6.5 14h-5L7 8Z" />}
    </svg>
  );
};
