import React from 'react';
import type { WikiSectionIcon } from '../sections';

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export const SectionIcon: React.FC<{ readonly icon: WikiSectionIcon }> = ({ icon }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" strokeWidth={1.8} {...base}>
    {icon === 'globe' && (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" />
      </>
    )}
    {icon === 'leaf' && (
      <>
        <path d="M5 19c0-8 6-14 15-14c0 9-6 15-14 15" />
        <path d="M5 19l8-8" />
      </>
    )}
    {icon === 'drop' && (
      <>
        <ellipse cx="12" cy="13" rx="6" ry="8" />
        <path d="M12 5c-1.5 3-1.5 13 0 16" />
      </>
    )}
    {icon === 'brewer' && (
      <>
        <path d="M5 4h14l-5 8h-4z" />
        <path d="M7 14h10l1 6H6z" />
        <path d="M12 12v2" />
      </>
    )}
    {icon === 'cup' && (
      <>
        <path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
        <path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17" />
        <path d="M8 3c0 1.5 1.5 1.5 1.5 3M12 3c0 1.5 1.5 1.5 1.5 3" />
      </>
    )}
  </svg>
);

export type UiIconName = 'search' | 'x' | 'arrow' | 'back' | 'wheel' | 'sliders' | 'check' | 'info' | 'spark';

export const UiIcon: React.FC<{ readonly name: UiIconName; readonly size?: number }> = ({ name, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth={2} {...base}>
    {name === 'search' && (
      <>
        <circle cx="11" cy="11" r="7" />
        <line x1="16.5" y1="16.5" x2="21" y2="21" />
      </>
    )}
    {name === 'x' && (
      <>
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="18" y1="6" x2="6" y2="18" />
      </>
    )}
    {name === 'arrow' && (
      <>
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="13 6 19 12 13 18" />
      </>
    )}
    {name === 'back' && (
      <>
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="11 6 5 12 11 18" />
      </>
    )}
    {name === 'wheel' && (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="3" x2="12" y2="9" />
        <line x1="12" y1="15" x2="12" y2="21" />
      </>
    )}
    {name === 'sliders' && (
      <>
        <line x1="4" y1="7" x2="20" y2="7" />
        <line x1="4" y1="17" x2="20" y2="17" />
        <circle cx="9" cy="7" r="2.5" fill="currentColor" />
        <circle cx="15" cy="17" r="2.5" fill="currentColor" />
      </>
    )}
    {name === 'check' && <polyline points="5 12.5 10 17 19 7" />}
    {name === 'info' && (
      <>
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="11" x2="12" y2="16" />
        <circle cx="12" cy="7.8" r=".8" fill="currentColor" />
      </>
    )}
    {name === 'spark' && <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />}
  </svg>
);
