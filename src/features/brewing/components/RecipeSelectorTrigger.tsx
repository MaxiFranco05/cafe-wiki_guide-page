import React from 'react';
import type { BrewMethod, BrewRecipe } from '../../../domain/schemas';
import { t } from '../../../i18n';
import { formatBrewNumber } from '../utils/brew-station.helpers';
import {
  getRecipeNormalRatio,
  getRecipeTemp,
  resolveRecipeTitle,
} from '../utils/recipe-display.helpers';
import { BookIcon, ChevronDownIcon, LockIcon } from './recipe-icons';
import './RecipeSelector.css';

export interface RecipeSelectorTriggerProps {
  readonly recipe: BrewRecipe;
  readonly method: BrewMethod;
  /** True while the timer is running or paused: the recipe cannot change. */
  readonly locked: boolean;
  /** Id of the visible "recipe locked" note that explains the disabled state. */
  readonly lockedHintId?: string;
  readonly onOpen: () => void;
  readonly ref?: React.Ref<HTMLButtonElement>;
}

/** Station header button showing the active recipe; opens the recipe selector. */
export const RecipeSelectorTrigger: React.FC<RecipeSelectorTriggerProps> = ({
  recipe,
  method,
  locked,
  lockedHintId,
  onOpen,
  ref,
}) => {
  const title = resolveRecipeTitle(recipe);
  const meta = t('brew.recipes.trigger.meta', {
    ratio: formatBrewNumber(getRecipeNormalRatio(recipe)),
    temp: getRecipeTemp(recipe, method).recommended,
  });

  return (
    <button
      ref={ref}
      type="button"
      className="rs-trigger"
      onClick={onOpen}
      disabled={locked}
      aria-haspopup="dialog"
      aria-label={t('brew.recipes.trigger.aria', { title })}
      aria-describedby={locked ? lockedHintId : undefined}
    >
      <span className="rs-trigger-icon">
        <BookIcon size={16} />
      </span>
      <span className="rs-trigger-text">
        <span className="rs-trigger-name soft-blur-swap" key={recipe.id}>
          {title}
        </span>
        <span className="rs-trigger-meta">{meta}</span>
      </span>
      <span className="rs-trigger-chev" aria-hidden="true">
        {locked ? <LockIcon /> : <ChevronDownIcon />}
      </span>
    </button>
  );
};
