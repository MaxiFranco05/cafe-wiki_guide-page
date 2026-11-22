import React, { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { METHODS_CATALOG, getMethodBySlug } from '../../../data/methods';
import { t } from '../../../i18n';
import { getMethodVesselType } from '../utils/brew-station.helpers';
import { MethodVesselIcon } from './MethodVesselIcon';
import { CheckIcon, ChevronDownIcon } from './recipe-icons';
import './RecipeSelector.css';

export interface MethodSwitcherProps {
  readonly currentSlug: string;
  /** When true, switching asks for confirmation because it discards the running brew. */
  readonly isBrewInProgress: boolean;
  /** Injectable confirmation (defaults to `window.confirm`). */
  readonly confirmDiscard?: (message: string) => boolean;
}

/**
 * Station title (C-14 header rev 2): the method name is the `h1` button that opens a menu of the
 * six methods. Nothing sits to its right, so the header does not shift with the name length.
 */
export const MethodSwitcher: React.FC<MethodSwitcherProps> = ({
  currentSlug,
  isBrewInProgress,
  confirmDiscard = (message) => window.confirm(message),
}) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const hintId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const current = getMethodBySlug(currentSlug);
  const currentName = current ? t(current.nameKey) : currentSlug;
  const currentIndex = Math.max(0, METHODS_CATALOG.findIndex((method) => method.id === currentSlug));

  useEffect(() => {
    if (!open) return;
    itemRefs.current[currentIndex]?.focus();
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !wrapRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open, currentIndex]);

  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  };

  const choose = (slug: string) => {
    if (slug === currentSlug) {
      close(true);
      return;
    }
    if (isBrewInProgress && !confirmDiscard(t('brew.methodSwitcher.confirmDiscard'))) {
      close(true);
      return;
    }
    setOpen(false);
    navigate(`/brew/${slug}`);
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    const items = itemRefs.current.filter((item): item is HTMLButtonElement => item !== null);
    const index = items.findIndex((item) => item === document.activeElement);
    const focusAt = (next: number) => items[(next + items.length) % items.length]?.focus();
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusAt(index + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusAt(index - 1);
        break;
      case 'Home':
        event.preventDefault();
        focusAt(0);
        break;
      case 'End':
        event.preventDefault();
        focusAt(items.length - 1);
        break;
      case 'Escape':
        event.preventDefault();
        close(true);
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  return (
    <div className="mt-wrap" ref={wrapRef}>
      <h1 className="mt-title">
        <button
          ref={buttonRef}
          type="button"
          className="mt-button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          aria-describedby={hintId}
          onClick={() => setOpen((value) => !value)}
        >
          <span>{currentName}</span>
          <span className="mt-chev" aria-hidden="true">
            <ChevronDownIcon />
          </span>
        </button>
      </h1>
      <span id={hintId} className="sr-only">
        {t('brew.methodSwitcher.label')}
      </span>
      {open ? (
        <ul
          id={menuId}
          className="mt-menu"
          role="menu"
          aria-label={t('brew.methodSwitcher.menuAria')}
          onKeyDown={handleMenuKeyDown}
        >
          {METHODS_CATALOG.map((method, index) => {
            const isCurrent = method.id === currentSlug;
            return (
              <li key={method.id} role="none">
                <button
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isCurrent}
                  tabIndex={-1}
                  className="mt-item"
                  onClick={() => choose(method.id)}
                >
                  <span className="mt-item-icon">
                    <MethodVesselIcon vesselType={getMethodVesselType(method)} />
                  </span>
                  <span className="mt-item-text">
                    <span className="mt-item-name">{t(method.nameKey)}</span>
                    <span className="mt-item-meta">
                      {t(`home.categoryBadges.${method.category}`)} ·{' '}
                      {t('methods.doseLabel', { dose: method.defaultDoseGrams })}
                    </span>
                  </span>
                  {isCurrent ? (
                    <span className="mt-item-check" aria-hidden="true">
                      <CheckIcon />
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};
