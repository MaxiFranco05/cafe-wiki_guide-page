import { useCallback, useMemo, useRef, useState } from 'react';
import { getSharedStorageAdapter, type StorageAdapter } from '../../../adapters';
import {
  buildCustomRecipe,
  importCustomRecipeJson,
  type BuildCustomRecipeResult,
} from '../../../domain/brewing';
import {
  CustomBrewRecipeSchema,
  type BrewMethod,
  type BrewRecipe,
  type CustomBrewRecipe,
  type CustomRecipeDraft,
  type RecipeProfile,
} from '../../../domain/schemas';
import { getDefaultRecipeForMethod, getRecipesByMethod } from '../../../data/recipes';
import { t } from '../../../i18n';
import {
  findRecipeForMethod,
  groupRecipesForSelector,
  resolveInitialRecipe,
  uniqueRecipeId,
  type RecipeSelectorGroups,
} from '../utils/recipe-display.helpers';

/** Current dose and intensity of the brew session, persisted alongside the chosen recipe. */
export interface RecipeSessionConfig {
  readonly coffeeGrams: number;
  readonly profileId: RecipeProfile['id'];
}

export interface UseRecipeLibraryOptions {
  readonly createStorage?: () => StorageAdapter;
  /** `?recipe=<id>` from the URL; only read on mount. */
  readonly queryRecipeId?: string | null;
  /** Session dose/intensity, or a getter read when a selection is persisted. */
  readonly session: RecipeSessionConfig | (() => RecipeSessionConfig);
}

export type ImportOutcome =
  | { readonly status: 'imported'; readonly recipe: CustomBrewRecipe }
  | { readonly status: 'other_method'; readonly recipe: CustomBrewRecipe; readonly methodId: BrewMethod['id'] }
  | { readonly status: 'conflict'; readonly recipe: CustomBrewRecipe; readonly existing: CustomBrewRecipe }
  | {
      readonly status: 'invalid';
      readonly errorCode: 'invalid_json' | 'invalid_schema';
      readonly issues: readonly string[];
    };

export interface RecipeLibrary {
  readonly activeRecipe: BrewRecipe;
  readonly groups: RecipeSelectorGroups;
  select(recipeId: string): void;
  /** Creates (unique id) or, when `draft.id` matches a saved recipe, updates a custom recipe and activates it. */
  saveCustom(draft: CustomRecipeDraft): BuildCustomRecipeResult;
  /** Removes a custom recipe; the station falls back to the standard recipe if it was active. */
  deleteCustom(recipeId: string): void;
  importJson(rawJson: string): ImportOutcome;
  resolveImportConflict(recipe: CustomBrewRecipe, mode: 'replace' | 'copy'): ImportOutcome;
}

/**
 * Catalog + custom recipe library for one brew method: active recipe, CRUD, JSON import and the
 * remembered `selectedRecipeId`, backed by the shared storage adapter (decision 13).
 */
export function useRecipeLibrary(method: BrewMethod, options: UseRecipeLibraryOptions): RecipeLibrary {
  const [storage] = useState<StorageAdapter>(() => (options.createStorage ?? getSharedStorageAdapter)());
  const sessionRef = useRef(options.session);
  sessionRef.current = options.session;

  const [customRecipes, setCustomRecipes] = useState<CustomBrewRecipe[]>(() =>
    storage.getCustomRecipes(method.id)
  );
  const [activeRecipeId, setActiveRecipeId] = useState<string>(
    () =>
      resolveInitialRecipe(method, {
        queryRecipeId: options.queryRecipeId,
        storedRecipeId: storage.getPreferences().methodConfigs[method.id]?.selectedRecipeId,
        customRecipes,
      }).id
  );

  const activeRecipe = useMemo(
    () => findRecipeForMethod(method.id, activeRecipeId, customRecipes) ?? getDefaultRecipeForMethod(method.id),
    [method.id, activeRecipeId, customRecipes]
  );
  const groups = useMemo(
    () => groupRecipesForSelector(getRecipesByMethod(method.id), customRecipes),
    [method.id, customRecipes]
  );

  const activate = useCallback(
    (recipeId: string) => {
      setActiveRecipeId(recipeId);
      const existing = storage.getPreferences().methodConfigs[method.id];
      const session = typeof sessionRef.current === 'function' ? sessionRef.current() : sessionRef.current;
      storage.setMethodConfig(method.id, {
        ...existing,
        coffeeGrams: session.coffeeGrams > 0 ? session.coffeeGrams : (existing?.coffeeGrams ?? method.defaultDoseGrams),
        profileId: session.profileId,
        selectedRecipeId: recipeId,
      });
    },
    [storage, method.id, method.defaultDoseGrams]
  );

  const refresh = useCallback(() => setCustomRecipes(storage.getCustomRecipes(method.id)), [storage, method.id]);

  const persistImported = useCallback(
    (recipe: CustomBrewRecipe): ImportOutcome => {
      storage.saveCustomRecipe(recipe);
      if (recipe.methodId !== method.id) {
        return { status: 'other_method', recipe, methodId: recipe.methodId };
      }
      refresh();
      activate(recipe.id);
      return { status: 'imported', recipe };
    },
    [storage, method.id, refresh, activate]
  );

  const select = useCallback(
    (recipeId: string) => {
      if (findRecipeForMethod(method.id, recipeId, customRecipes)) activate(recipeId);
    },
    [method.id, customRecipes, activate]
  );

  const saveCustom = useCallback(
    (draft: CustomRecipeDraft): BuildCustomRecipeResult => {
      const allCustom = storage.getCustomRecipes();
      const editing = draft.id ? allCustom.find((recipe) => recipe.id === draft.id) : undefined;

      let result = buildCustomRecipe(draft, method);
      if (result.ok && !editing) {
        const id = uniqueRecipeId(result.recipe.id, allCustom.map((recipe) => recipe.id));
        if (id !== result.recipe.id) result = buildCustomRecipe(draft, method, { id });
      }
      if (!result.ok) return result;

      const recipe: CustomBrewRecipe = editing
        ? { ...result.recipe, createdAtIso: editing.createdAtIso }
        : result.recipe;
      storage.saveCustomRecipe(recipe);
      refresh();
      activate(recipe.id);
      return { ok: true, recipe };
    },
    [storage, method, refresh, activate]
  );

  const deleteCustom = useCallback(
    (recipeId: string) => {
      storage.deleteCustomRecipe(recipeId);
      refresh();
      if (recipeId === activeRecipeId) activate(getDefaultRecipeForMethod(method.id).id);
    },
    [storage, refresh, activeRecipeId, activate, method.id]
  );

  const importJson = useCallback(
    (rawJson: string): ImportOutcome => {
      const parsed = importCustomRecipeJson(rawJson);
      if (!parsed.ok) {
        return { status: 'invalid', errorCode: parsed.errorCode, issues: parsed.issues };
      }
      const existing = storage.getCustomRecipes().find((recipe) => recipe.id === parsed.recipe.id);
      if (existing) {
        return { status: 'conflict', recipe: parsed.recipe, existing };
      }
      return persistImported(parsed.recipe);
    },
    [storage, persistImported]
  );

  const resolveImportConflict = useCallback(
    (recipe: CustomBrewRecipe, mode: 'replace' | 'copy'): ImportOutcome => {
      if (mode === 'replace') return persistImported(recipe);

      const ids = storage.getCustomRecipes().map((saved) => saved.id);
      const copy = CustomBrewRecipeSchema.safeParse({
        ...recipe,
        id: uniqueRecipeId(`${recipe.id}-copia`, ids),
        title: t('brew.recipes.editor.copyName', { title: recipe.title }).slice(0, 80),
      });
      if (!copy.success) {
        return {
          status: 'invalid',
          errorCode: 'invalid_schema',
          issues: copy.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
        };
      }
      return persistImported(copy.data);
    },
    [storage, persistImported]
  );

  return { activeRecipe, groups, select, saveCustom, deleteCustom, importJson, resolveImportConflict };
}
