import React, { useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { BrewMethod, CatalogBrewRecipe } from '../../../domain/schemas';
import { t } from '../../../i18n';
import { UiIcon } from './WikiIcons';

type RecipeTab = 'author' | 'traditional';

function formatDuration(seconds: number): string {
  return t('wiki.ui.recipe.duration', { time: `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}` });
}

const RecipeCard: React.FC<{ readonly recipe: CatalogBrewRecipe; readonly methodId: BrewMethod['id']; readonly primary: boolean }> = ({ recipe, methodId, primary }) => (
  <li className="w-recipe">
    <h3>{t(recipe.titleKey)}</h3>
    <span className="w-recipe-by">{recipe.authorName}</span>
    <div className="w-recipe-stats">
      <span>{t(`wiki.ui.recipe.difficulty.${recipe.difficulty}`)}</span>
      {recipe.waterTempCelsius && <span>{`${recipe.waterTempCelsius.min}–${recipe.waterTempCelsius.max} °C`}</span>}
      <span>{formatDuration(recipe.totalDurationSeconds)}</span>
    </div>
    <p>{t(recipe.processSummaryKey)}</p>
    <p>
      <b>{t('wiki.ui.recipe.inCup')}</b> {t(recipe.flavorHighlightKey)}
    </p>
    <Link className={`w-cta ${primary ? '' : 'w-cta--secondary'}`} to={`/brew/${methodId}?recipe=${recipe.id}`}>
      {t('wiki.ui.recipe.prepare')}
      <UiIcon name="arrow" />
    </Link>
  </li>
);

/** Author vs traditional (standard + classic) recipes; each opens directly in the brew station. */
export const RecipeTabs: React.FC<{ readonly methodId: BrewMethod['id']; readonly recipes: readonly CatalogBrewRecipe[] }> = ({ methodId, recipes }) => {
  const groups: Record<RecipeTab, readonly CatalogBrewRecipe[]> = {
    author: recipes.filter((r) => r.kind === 'author'),
    traditional: recipes.filter((r) => r.kind !== 'author'),
  };
  const tabs = (['author', 'traditional'] as const).filter((tab) => groups[tab].length > 0);
  const [active, setActive] = useState<RecipeTab>(tabs[0] ?? 'author');
  const baseId = useId();
  const tabRefs = useRef<Record<RecipeTab, HTMLButtonElement | null>>({ author: null, traditional: null });

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    const next = tabs[(tabs.indexOf(active) + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    if (next) {
      setActive(next);
      tabRefs.current[next]?.focus();
    }
  };

  return (
    <>
      <div className="w-tabs" role="tablist" aria-label={t('wiki.ui.chapters.recipes.tabsAria')} onKeyDown={onKeyDown}>
        {tabs.map((tab) => (
          <button
            key={tab}
            ref={(el) => {
              tabRefs.current[tab] = el;
            }}
            type="button"
            role="tab"
            id={`${baseId}-tab-${tab}`}
            aria-selected={active === tab}
            aria-controls={`${baseId}-panel-${tab}`}
            tabIndex={active === tab ? 0 : -1}
            className="w-tab"
            onClick={() => setActive(tab)}
          >
            {t(`wiki.ui.chapters.recipes.${tab}`)} <b>{groups[tab].length}</b>
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <ul key={tab} className="w-recipes" role="tabpanel" id={`${baseId}-panel-${tab}`} aria-labelledby={`${baseId}-tab-${tab}`} hidden={active !== tab}>
          {groups[tab].map((recipe, index) => (
            <RecipeCard key={recipe.id} recipe={recipe} methodId={methodId} primary={tab === 'author' && index === 0} />
          ))}
        </ul>
      ))}
    </>
  );
};
