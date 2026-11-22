import React, { useId, useState } from 'react';
import type { BrewMethod, BrewRecipe, CustomBrewRecipe } from '../../../domain/schemas';
import { t } from '../../../i18n';
import { formatBrewNumber, formatMinutesSeconds } from '../utils/brew-station.helpers';
import {
  getRecipeNormalRatio,
  getRecipeTemp,
  resolveRecipeAuthor,
  resolveRecipeText,
  resolveRecipeTitle,
  type RecipeSelectorGroups,
} from '../utils/recipe-display.helpers';
import { CopyIcon, DownloadIcon, EditIcon, PlusIcon, ShareIcon, TrashIcon, CheckIcon } from './recipe-icons';
import { RecipeSheet } from './RecipeSheet';

export interface RecipeCardActions {
  readonly onUse: (recipeId: string) => void;
  readonly onDuplicate: (recipe: BrewRecipe) => void;
  readonly onEdit: (recipe: CustomBrewRecipe) => void;
  readonly onShare: (recipe: CustomBrewRecipe) => void;
  readonly onDelete: (recipe: CustomBrewRecipe) => void;
}

export interface RecipeSelectorModalProps extends RecipeCardActions {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly method: BrewMethod;
  readonly groups: RecipeSelectorGroups;
  readonly activeRecipeId: string;
  readonly onCreate: () => void;
  readonly onImport: () => void;
}

const DIFFICULTY_LEVEL = { universal: 1, intermediate: 2, advanced: 3 } as const;
const PROCESS_CLAMP_CHARS = 90;
const DIFFICULTY_DOTS = [1, 2, 3] as const;

interface RecipeCardProps extends RecipeCardActions {
  readonly recipe: BrewRecipe;
  readonly method: BrewMethod;
  readonly isActive: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  method,
  isActive,
  onUse,
  onDuplicate,
  onEdit,
  onShare,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const processId = useId();
  const title = resolveRecipeTitle(recipe);
  const process = resolveRecipeText(recipe, 'processSummary');
  const flavor = resolveRecipeText(recipe, 'flavorHighlight');
  const level = DIFFICULTY_LEVEL[recipe.difficulty];
  const kindKey = recipe.source === 'custom' ? 'custom' : recipe.kind;

  return (
    <li>
      <article className="rs-card" aria-current={isActive ? 'true' : undefined}>
        <div className="rs-card-top">
          <div>
            <h4 className="rs-card-title">{title}</h4>
            <div className="rs-card-by">
              <span>{resolveRecipeAuthor(recipe)}</span>
              <span aria-hidden="true">·</span>
              <span className="rs-diff" aria-hidden="true">
                {DIFFICULTY_DOTS.map((dot) => (
                  <i key={dot} data-on={dot <= level ? 'true' : 'false'} />
                ))}
              </span>
              <span>{t(`brew.recipes.card.difficulty.${recipe.difficulty}`)}</span>
            </div>
          </div>
          <div className="rs-badges">
            <span className={`rs-badge rs-badge--${kindKey}`}>{t(`brew.recipes.card.kinds.${kindKey}`)}</span>
            {isActive ? (
              <span className="rs-badge rs-badge--active">
                <CheckIcon size={11} />
                {t('brew.recipes.card.inUse')}
              </span>
            ) : null}
          </div>
        </div>

        <p className="rs-facts">
          <b>1:{formatBrewNumber(getRecipeNormalRatio(recipe))}</b>
          <span>{formatMinutesSeconds(recipe.totalDurationSeconds)}</span>
          <span>{t('brew.recipes.tempSingle', { recommended: getRecipeTemp(recipe, method).recommended })}</span>
          <span>{t('brew.recipes.card.phasesCount', { count: recipe.phases.length })}</span>
        </p>

        {process ? (
          <p id={processId} className="rs-process" data-expanded={expanded ? 'true' : 'false'}>
            {process}
          </p>
        ) : null}
        {flavor ? (
          <p className="rs-flavor">
            <span>{t('brew.recipes.card.highlight')}</span> {flavor}
          </p>
        ) : null}
        {process && process.length > PROCESS_CLAMP_CHARS ? (
          <button
            type="button"
            className="rs-more"
            aria-expanded={expanded}
            aria-controls={processId}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? t('brew.recipes.card.seeLess') : t('brew.recipes.card.seeMore')}
          </button>
        ) : null}

        <div className="rs-actions">
          {isActive ? (
            <button type="button" className="rs-btn rs-btn--ghost rs-use" disabled>
              {t('brew.recipes.card.using')}
            </button>
          ) : (
            <button type="button" className="rs-btn rs-btn--soft rs-use" onClick={() => onUse(recipe.id)}>
              {t('brew.recipes.card.use')}
            </button>
          )}
          <button
            type="button"
            className="rs-btn rs-btn--ghost"
            aria-label={t('brew.recipes.card.duplicateAria', { title })}
            onClick={() => onDuplicate(recipe)}
          >
            <CopyIcon />
            <span aria-hidden="true">{t('brew.recipes.card.duplicate')}</span>
          </button>
          {recipe.source === 'custom' ? (
            <>
              <button
                type="button"
                className="rs-btn rs-btn--ghost"
                aria-label={t('brew.recipes.card.editAria', { title })}
                onClick={() => onEdit(recipe)}
              >
                <EditIcon />
              </button>
              <button
                type="button"
                className="rs-btn rs-btn--ghost"
                aria-label={t('brew.recipes.card.shareAria', { title })}
                onClick={() => onShare(recipe)}
              >
                <ShareIcon />
              </button>
              <button
                type="button"
                className="rs-btn rs-btn--danger"
                aria-label={t('brew.recipes.card.deleteAria', { title })}
                onClick={() => onDelete(recipe)}
              >
                <TrashIcon />
              </button>
            </>
          ) : null}
        </div>
      </article>
    </li>
  );
};

interface RecipeGroupProps extends RecipeCardActions {
  readonly title: string;
  readonly count?: string;
  readonly recipes: readonly BrewRecipe[];
  readonly method: BrewMethod;
  readonly activeRecipeId: string;
  readonly columns?: 1 | 2;
  readonly empty?: React.ReactNode;
}

const RecipeGroup: React.FC<RecipeGroupProps> = ({ title, count, recipes, columns = 1, empty, ...cardProps }) => {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <div className="rs-group-head">
        <h3 id={headingId}>{title}</h3>
        {count ? <span>{count}</span> : null}
      </div>
      {recipes.length > 0 ? (
        <ul className="rs-list" data-columns={columns}>
          {recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              method={cardProps.method}
              isActive={recipe.id === cardProps.activeRecipeId}
              onUse={cardProps.onUse}
              onDuplicate={cardProps.onDuplicate}
              onEdit={cardProps.onEdit}
              onShare={cardProps.onShare}
              onDelete={cardProps.onDelete}
            />
          ))}
        </ul>
      ) : (
        empty
      )}
    </section>
  );
};

/** Grouped recipe catalog for the current method (Estándar · Autores y Clásicas · Mis Recetas). */
export const RecipeSelectorModal: React.FC<RecipeSelectorModalProps> = ({
  open,
  onClose,
  method,
  groups,
  activeRecipeId,
  onCreate,
  onImport,
  ...actions
}) => {
  const methodName = t(method.nameKey);
  const shared = { method, activeRecipeId, ...actions };

  return (
    <RecipeSheet
      open={open}
      onClose={onClose}
      title={t('brew.recipes.selector.title', { method: methodName })}
      subtitle={t('brew.recipes.selector.subtitle')}
      closeLabel={t('brew.recipes.selector.close')}
      footer={
        <>
          <button type="button" className="rs-btn rs-btn--ghost" onClick={onImport}>
            <DownloadIcon />
            {t('brew.recipes.selector.import')}
          </button>
          <button type="button" className="rs-btn rs-btn--primary rs-grow" onClick={onCreate}>
            <PlusIcon />
            {t('brew.recipes.selector.create')}
          </button>
        </>
      }
    >
      <RecipeGroup {...shared} title={t('brew.recipes.selector.groups.standard')} recipes={groups.standard} />
      <RecipeGroup
        {...shared}
        title={t('brew.recipes.selector.groups.catalog')}
        count={t('brew.recipes.selector.catalogCount', { count: groups.catalog.length })}
        recipes={groups.catalog}
        columns={2}
      />
      <RecipeGroup
        {...shared}
        title={t('brew.recipes.selector.groups.mine')}
        count={
          groups.mine.length === 0
            ? undefined
            : groups.mine.length === 1
              ? t('brew.recipes.selector.mineCountOne')
              : t('brew.recipes.selector.mineCount', { count: groups.mine.length })
        }
        recipes={groups.mine}
        empty={
          <div className="rs-empty">
            <b>{t('brew.recipes.selector.emptyTitle', { method: methodName })}</b>
            <span>{t('brew.recipes.selector.emptyBody')}</span>
            <div className="rs-actions">
              <button type="button" className="rs-btn rs-btn--soft" onClick={onCreate}>
                <PlusIcon />
                {t('brew.recipes.selector.create')}
              </button>
              <button type="button" className="rs-btn rs-btn--ghost" onClick={onImport}>
                <DownloadIcon />
                {t('brew.recipes.share.tabImport')}
              </button>
            </div>
          </div>
        }
      />
    </RecipeSheet>
  );
};
