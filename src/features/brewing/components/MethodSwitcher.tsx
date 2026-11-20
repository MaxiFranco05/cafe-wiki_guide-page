import React, { useId } from 'react';
import { useNavigate } from 'react-router';
import { METHODS_CATALOG } from '../../../data/methods';
import { t } from '../../../i18n';

export interface MethodSwitcherProps {
  readonly currentSlug: string;
  /** When true, switching asks for confirmation because it discards the running brew. */
  readonly isBrewInProgress: boolean;
  /** Injectable confirmation (defaults to `window.confirm`). */
  readonly confirmDiscard?: (message: string) => boolean;
}

/** Native, accessible quick selector to jump between the 6 brew methods from the station header. */
export const MethodSwitcher: React.FC<MethodSwitcherProps> = ({
  currentSlug,
  isBrewInProgress,
  confirmDiscard = (message) => window.confirm(message),
}) => {
  const navigate = useNavigate();
  const selectId = useId();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const target = event.target.value;
    if (target === currentSlug) return;
    if (isBrewInProgress && !confirmDiscard(t('brew.methodSwitcher.confirmDiscard'))) {
      event.target.value = currentSlug;
      return;
    }
    navigate(`/brew/${target}`);
  };

  return (
    <span className="brew-method-switcher">
      <label htmlFor={selectId} className="sr-only">
        {t('brew.methodSwitcher.label')}
      </label>
      <select id={selectId} value={currentSlug} onChange={handleChange}>
        {METHODS_CATALOG.map((method) => (
          <option key={method.id} value={method.id}>
            {t(method.nameKey)}
          </option>
        ))}
      </select>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </span>
  );
};
