import React from 'react';
import { NavLink, Link } from 'react-router';
import { t } from '../../i18n';

const DESKTOP_NAV_ITEMS = [
  { to: '/', labelKey: 'nav.methods', end: true },
  { to: '/brew/v60', labelKey: 'nav.brewStation', end: false },
  { to: '/wiki', labelKey: 'nav.wiki', end: false },
  { to: '/flavor-wheel', labelKey: 'nav.flavorWheel', end: false },
] as const;

export const TopNavbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 h-16 w-full bg-glass backdrop-blur-md border-b border-border-subtle transition-colors duration-150">
      <div className="max-w-[1200px] mx-auto h-full px-4 md:px-9 flex items-center justify-between">
        {/* Brand link */}
        <Link
          to="/"
          aria-label={t('nav.aria.brand')}
          className="flex items-center gap-3 text-text-primary no-underline pressable min-touch-target rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <div className="w-[38px] h-[38px] rounded-[10px] bg-dark-card border border-gold/35 flex items-center justify-center text-gold shadow-sm">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 5h14l-5 12h-4L5 5Z" />
              <circle cx="12" cy="20" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <div>
            <div
              className="font-bold text-base tracking-tight text-text-primary leading-tight"
              data-brand-name="short"
            >
              {t('app.title')}
            </div>
            <div className="font-mono text-[10px] text-text-secondary tracking-wide uppercase leading-tight">
              {t('app.subtitle')}
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav aria-label={t('nav.aria.main')} className="hidden md:flex items-center gap-2">
          {DESKTOP_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `min-h-[44px] min-w-[44px] flex items-center justify-center px-3.5 py-2 rounded-[10px] text-sm font-semibold pressable transition-colors ${
                  isActive
                    ? 'bg-accent text-text-on-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                }`
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
};
