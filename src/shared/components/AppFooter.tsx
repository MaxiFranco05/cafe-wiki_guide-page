import React from 'react';
import { t } from '../../i18n';

export const AppFooter: React.FC = () => {
  return (
    <footer
      aria-label={t('footer.ariaLabel')}
      className="relative z-10 w-full max-w-[1200px] mx-auto px-4 md:px-9 pt-4 pb-24 md:pb-10 text-center text-xs text-text-secondary font-mono"
    >
      <span data-testid="app-version">{t('footer.version', { version: __APP_VERSION__ })}</span>
    </footer>
  );
};
