import React from 'react';
import { NavLink } from 'react-router';
import { t } from '../../i18n';

export const BottomTabBar: React.FC = () => {
  return (
    <nav
      aria-label={t('nav.aria.mobile')}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-glass backdrop-blur-md border-t border-border-subtle pb-[env(safe-area-inset-bottom)] transition-colors duration-150"
    >
      <div className="flex items-center justify-around h-[68px] px-2 max-w-lg mx-auto">
        {/* Tab 1: Métodos */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex-1 min-h-[48px] min-w-[44px] flex flex-col items-center justify-center gap-1 text-[11px] pressable transition-colors ${
              isActive ? 'text-accent font-bold' : 'text-text-secondary hover:text-text-primary'
            }`
          }
        >
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
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
          <span>{t('nav.mobile.methods')}</span>
        </NavLink>

        {/* Tab 2: Preparar */}
        <NavLink
          to="/brew/v60"
          className={({ isActive }) =>
            `flex-1 min-h-[48px] min-w-[44px] flex flex-col items-center justify-center gap-1 text-[11px] pressable transition-colors ${
              isActive ? 'text-accent font-bold' : 'text-text-secondary hover:text-text-primary'
            }`
          }
        >
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
            <path d="M5 4h14l-5 12h-4L5 4Z" />
          </svg>
          <span>{t('nav.mobile.brew')}</span>
        </NavLink>

        {/* Tab 3: Wiki */}
        <NavLink
          to="/wiki"
          className={({ isActive }) =>
            `flex-1 min-h-[48px] min-w-[44px] flex flex-col items-center justify-center gap-1 text-[11px] pressable transition-colors ${
              isActive ? 'text-accent font-bold' : 'text-text-secondary hover:text-text-primary'
            }`
          }
        >
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
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <span>{t('nav.mobile.wiki')}</span>
        </NavLink>

        {/* Tab 4: Rueda SCA */}
        <NavLink
          to="/flavor-wheel"
          className={({ isActive }) =>
            `flex-1 min-h-[48px] min-w-[44px] flex flex-col items-center justify-center gap-1 text-[11px] pressable transition-colors ${
              isActive ? 'text-accent font-bold' : 'text-text-secondary hover:text-text-primary'
            }`
          }
        >
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
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span>{t('nav.mobile.wheel')}</span>
        </NavLink>
      </div>
    </nav>
  );
};
