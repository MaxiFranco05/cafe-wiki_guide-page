import React from 'react';
import type { CustomBrewRecipe } from '../../../domain/schemas';
import { t } from '../../../i18n';
import { TrashIcon } from './recipe-icons';
import { RecipeSheet } from './RecipeSheet';

export interface ConfirmDeleteRecipeDialogProps {
  readonly open: boolean;
  readonly recipe: CustomBrewRecipe | null;
  /** The recipe is the station's active one: deleting it falls back to the standard recipe. */
  readonly isActive: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

/** Explicit confirmation before permanently deleting a custom recipe from this device. */
export const ConfirmDeleteRecipeDialog: React.FC<ConfirmDeleteRecipeDialogProps> = ({
  open,
  recipe,
  isActive,
  onCancel,
  onConfirm,
}) => (
  <RecipeSheet
    open={open && recipe !== null}
    onClose={onCancel}
    role="alertdialog"
    size="narrow"
    title={t('brew.recipes.confirmDelete.title', { title: recipe?.title ?? '' })}
    subtitle={`${t('brew.recipes.confirmDelete.body')}${isActive ? ` ${t('brew.recipes.confirmDelete.activeNote')}` : ''}`}
    footer={
      <>
        <button type="button" className="rs-btn rs-btn--ghost rs-grow" onClick={onCancel}>
          {t('brew.recipes.confirmDelete.cancel')}
        </button>
        <button type="button" className="rs-btn rs-btn--danger-solid rs-grow" onClick={onConfirm}>
          <TrashIcon />
          {t('brew.recipes.confirmDelete.confirm')}
        </button>
      </>
    }
  >
    {null}
  </RecipeSheet>
);
