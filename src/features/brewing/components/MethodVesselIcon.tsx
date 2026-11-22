import React from 'react';
import type { SvgStageDirective } from '../../../domain/schemas';

export interface MethodVesselIconProps {
  readonly vesselType: SvgStageDirective['vesselType'];
  readonly className?: string;
}

/**
 * Renders a clean minimal vector silhouette matching each brewing vessel (C-03 D-02).
 * Uses semantic CSS variables (--svg-vessel-stroke / --accent-gold) without raw hex colors.
 */
export const MethodVesselIcon: React.FC<MethodVesselIconProps> = ({ vesselType, className }) => {
  const sharedProps: React.SVGProps<SVGSVGElement> = {
    width: 24,
    height: 24,
    viewBox: '0 0 32 32',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    className: className ?? 'text-[var(--svg-vessel-stroke)]',
    'data-vessel-type': vesselType,
  } as React.SVGProps<SVGSVGElement>;

  switch (vesselType) {
    case 'cone_v60':
      return (
        <svg {...sharedProps} data-vessel-type="cone_v60">
          <path d="M7 8h18l-6.5 14h-5L7 8Z" />
          <path d="M11 8l3.5 14" stroke="var(--accent-gold)" strokeWidth="1.4" />
          <path d="M9 22h14" />
          <circle cx="16" cy="26.5" r="1.5" fill="var(--accent-gold)" stroke="none" />
        </svg>
      );

    case 'hourglass_chemex':
      return (
        <svg {...sharedProps} data-vessel-type="hourglass_chemex">
          <path d="M9 5h14l-5 10 4 12H10l4-12L9 5Z" />
          <path d="M12.5 15h7" stroke="var(--accent-gold)" strokeWidth="2.2" />
          <circle cx="16" cy="15" r="1.2" fill="var(--accent-gold)" stroke="none" />
        </svg>
      );

    case 'wedge_melitta':
      return (
        <svg {...sharedProps} data-vessel-type="wedge_melitta">
          <path d="M8 7h16l-4 12h-8L8 7Z" />
          <path d="M11 19v4c0 2.2 2.2 4 5 4s5-1.8 5-4v-4" />
          <path d="M13 12h6" stroke="var(--accent-gold)" strokeWidth="1.4" />
        </svg>
      );

    case 'cylinder_aeropress':
      return (
        <svg {...sharedProps} data-vessel-type="cylinder_aeropress">
          <rect x="11" y="11" width="10" height="14" rx="1.5" />
          <path d="M13 11V6h6v5" stroke="var(--accent-gold)" />
          <path d="M10 6h12" />
          <path d="M9 25h14" />
        </svg>
      );

    case 'beaker_french_press':
      return (
        <svg {...sharedProps} data-vessel-type="beaker_french_press">
          <rect x="9" y="8" width="12" height="18" rx="2" />
          <path d="M21 12h3a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-3" />
          <path d="M15 4v15" stroke="var(--accent-gold)" />
          <path d="M10 19h10" stroke="var(--accent-gold)" strokeWidth="1.5" />
        </svg>
      );

    case 'portafilter_espresso':
      return (
        <svg {...sharedProps} data-vessel-type="portafilter_espresso">
          <path d="M6 10h11v5a5.5 5.5 0 0 1-11 0v-5Z" />
          <path d="M17 12h9" stroke="var(--accent-gold)" strokeWidth="2.2" />
          <path d="M9.5 21v4M13.5 21v4" stroke="var(--accent-gold)" />
        </svg>
      );
  }
};
