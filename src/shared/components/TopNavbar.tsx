import React from 'react';
import { NavLink, Link } from 'react-router';
import { t } from '../../i18n';
import { GlobalSearch } from './GlobalSearch';

const DESKTOP_NAV_ITEMS = [
  { to: '/', labelKey: 'nav.methods', end: true },
  { to: '/brew/v60', labelKey: 'nav.brewStation', end: false },
  { to: '/wiki', labelKey: 'nav.wiki', end: false },
  { to: '/flavor-wheel', labelKey: 'nav.flavorWheel', end: false },
] as const;

export const TopNavbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 h-16 w-full bg-glass backdrop-blur-md border-b border-border-subtle transition-colors duration-150">
      <div className="max-w-[1200px] mx-auto h-full px-4 md:px-9 flex items-center justify-between gap-3">
        {/* Brand link */}
        <Link
          to="/"
          aria-label={t('nav.aria.brand')}
          className="brand-link flex items-center gap-2.5 text-text-primary no-underline pressable min-touch-target rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0"
        >
          <div className="brand-badge w-[40px] h-[40px] rounded-[11px] bg-surface border border-border-strong flex items-center justify-center text-gold shadow-sm shrink-0">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path className="brand-steam brand-steam-1" d="M9.5 4.2c0-1 .9-1.4.9-2.4" stroke="var(--accent-gold)" strokeWidth="1.35" />
              <path className="brand-steam brand-steam-2" d="M14.2 4.2c0-1 .9-1.4.9-2.4" stroke="var(--accent-gold)" strokeWidth="1.35" />
              <path className="brand-cone-fill" d="M7.2 10.5h9.6l-2.6 6.2h-4.4l-2.6-6.2Z" fill="var(--accent-primary)" stroke="none" />
              <path d="M5 6.5h14l-5 10.5h-4L5 6.5Z" />
              <circle className="brand-drop" cx="12" cy="20.2" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <div>
            <div
              className="brand-title font-bold text-base tracking-tight text-text-primary leading-tight whitespace-nowrap"
              data-brand-name="short"
            >
              {t('app.title')}
            </div>
            <div className="hidden sm:block font-mono text-[10px] text-text-secondary tracking-wide uppercase leading-tight whitespace-nowrap">
              {t('app.subtitle')}
            </div>
          </div>
        </Link>

        {/* Desktop Links + Unified Global Search */}
        <div className="flex items-center gap-2.5">
          <nav aria-label={t('nav.aria.main')} className="hidden md:flex items-center gap-2">
            {DESKTOP_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `nav-btn min-h-[44px] min-w-[44px] flex items-center justify-center px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap pressable ${
                    isActive
                      ? 'bg-accent border border-accent text-text-on-accent shadow-sm'
                      : 'text-text-secondary'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {!isActive && <span className="nav-fill-layer" aria-hidden="true" />}
                    <span className="nav-btn-label relative z-[2]">{t(item.labelKey)}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <GlobalSearch />
        </div>
      </div>
    </header>
  );
};
