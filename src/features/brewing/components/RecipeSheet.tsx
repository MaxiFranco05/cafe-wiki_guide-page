import React, { useEffect, useId, useRef } from 'react';
import { CloseIcon } from './recipe-icons';
import './RecipeSelector.css';

export interface RecipeSheetProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly subtitle?: string;
  /** Accessible label of the header close button; omit to hide the button (e.g. confirmations). */
  readonly closeLabel?: string;
  readonly size?: 'default' | 'wide' | 'narrow';
  readonly role?: 'dialog' | 'alertdialog';
  readonly footer?: React.ReactNode;
  readonly children: React.ReactNode;
}

/**
 * Modal shell for the recipe selector, editor, share/import and confirmations: a native `<dialog>`
 * opened with `showModal()` (focus trap + inert page), bottom sheet below 768 px and centered dialog
 * above. It only exists while open, restores focus to the opener and locks background scroll.
 */
export const RecipeSheet: React.FC<RecipeSheetProps> = ({ open, ...props }) =>
  open ? <OpenRecipeSheet {...props} /> : null;

const OpenRecipeSheet: React.FC<Omit<RecipeSheetProps, 'open'>> = ({
  onClose,
  title,
  subtitle,
  closeLabel,
  size = 'default',
  role = 'dialog',
  footer,
  children,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const subtitleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (dialog && !dialog.open) dialog.showModal();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog?.open) dialog.close();
      opener?.focus();
    };
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="rs rs-sheet"
      data-size={size}
      role={role === 'alertdialog' ? 'alertdialog' : undefined}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={subtitle ? subtitleId : undefined}
      onKeyDown={handleKeyDown}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="rs-grab" aria-hidden="true" />
      <div className="rs-head">
        <div>
          <h2 id={titleId}>{title}</h2>
          {subtitle ? <p id={subtitleId}>{subtitle}</p> : null}
        </div>
        {closeLabel ? (
          <button type="button" className="rs-icon-btn" aria-label={closeLabel} onClick={onClose}>
            <CloseIcon />
          </button>
        ) : null}
      </div>
      <div className="rs-body">{children}</div>
      {footer ? <div className="rs-foot">{footer}</div> : null}
    </dialog>
  );
};
