import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { createStorageAdapter, type StorageAdapter, type StorageLike } from '../../../adapters';
import { buildCustomRecipe, exportCustomRecipeJson } from '../../../domain/brewing';
import type { CustomBrewRecipe } from '../../../domain/schemas';
import { getMethodBySlug } from '../../../data/methods';
import { useRecipeLibrary, type RecipeSessionConfig } from '../hooks/useRecipeLibrary';
import { createEmptyEditorForm, validateEditorForm } from '../utils/recipe-display.helpers';

const v60 = getMethodBySlug('v60')!;
const aeropress = getMethodBySlug('aeropress')!;
const session: RecipeSessionConfig = { coffeeGrams: 20, profileId: 'normal' };

function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

const throwingStorage: StorageLike = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
  removeItem: () => undefined,
};

function draftFor(title: string, methodId: 'v60' | 'aeropress' = 'v60') {
  const method = methodId === 'v60' ? v60 : aeropress;
  const result = validateEditorForm({ ...createEmptyEditorForm(method), title }, method);
  if (!result.ok) throw new Error('fixture');
  return result.draft;
}

function customRecipe(title: string, methodId: 'v60' | 'aeropress' = 'v60'): CustomBrewRecipe {
  const method = methodId === 'v60' ? v60 : aeropress;
  const built = buildCustomRecipe(draftFor(title, methodId), method);
  if (!built.ok) throw new Error('fixture');
  return built.recipe;
}

function setup(store: StorageAdapter, queryRecipeId: string | null = null, method = v60) {
  return renderHook(
    ({ q }) => useRecipeLibrary(method, { createStorage: () => store, queryRecipeId: q, session }),
    { initialProps: { q: queryRecipeId } }
  );
}

describe('useRecipeLibrary', () => {
  it('starts on the standard recipe and groups the V60 catalog', () => {
    const { result } = setup(createStorageAdapter({ storage: memoryStorage() }));
    expect(result.current.activeRecipe.id).toBe('v60-standard');
    expect(result.current.groups.standard).toHaveLength(1);
    expect(result.current.groups.catalog.map((r) => r.id)).toContain('v60-kasuya-4-6');
    expect(result.current.groups.mine).toEqual([]);
  });

  it('selects a recipe and remembers it per method with the session dose', () => {
    const store = createStorageAdapter({ storage: memoryStorage() });
    const { result } = setup(store);
    act(() => result.current.select('v60-kasuya-4-6'));
    expect(result.current.activeRecipe.id).toBe('v60-kasuya-4-6');
    expect(store.getPreferences().methodConfigs.v60).toMatchObject({
      selectedRecipeId: 'v60-kasuya-4-6',
      coffeeGrams: 20,
      profileId: 'normal',
    });

    const reloaded = setup(store);
    expect(reloaded.result.current.activeRecipe.id).toBe('v60-kasuya-4-6');
  });

  it('honours a valid ?recipe query over the remembered recipe', () => {
    const store = createStorageAdapter({ storage: memoryStorage() });
    store.setMethodConfig('v60', { coffeeGrams: 15, profileId: 'normal', selectedRecipeId: 'v60-scott-rao' });
    expect(setup(store, 'v60-kasuya-4-6').result.current.activeRecipe.id).toBe('v60-kasuya-4-6');
    expect(setup(store, 'aeropress-alan-adler').result.current.activeRecipe.id).toBe('v60-scott-rao');
  });

  it('saves a new custom recipe, activates it and avoids id collisions', () => {
    const store = createStorageAdapter({ storage: memoryStorage() });
    const { result } = setup(store);
    let firstId = '';
    act(() => {
      const saved = result.current.saveCustom(draftFor('Mi V60'));
      expect(saved.ok).toBe(true);
      if (saved.ok) firstId = saved.recipe.id;
    });
    act(() => {
      result.current.saveCustom(draftFor('Mi V60'));
    });
    expect(result.current.groups.mine.map((r) => r.id)).toEqual([firstId, `${firstId}-2`]);
    expect(result.current.activeRecipe.id).toBe(`${firstId}-2`);
    expect(store.getCustomRecipes('v60')).toHaveLength(2);
  });

  it('edits a custom recipe in place keeping its creation date', () => {
    const store = createStorageAdapter({ storage: memoryStorage() });
    const original = customRecipe('Mi V60');
    store.saveCustomRecipe(original);
    const { result } = setup(store);
    act(() => {
      const saved = result.current.saveCustom({ ...draftFor('Mi V60 editada'), id: original.id });
      expect(saved.ok).toBe(true);
    });
    expect(result.current.groups.mine).toHaveLength(1);
    expect(result.current.groups.mine[0]).toMatchObject({
      id: original.id,
      title: 'Mi V60 editada',
      createdAtIso: original.createdAtIso,
    });
  });

  it('deletes the active custom recipe and falls back to the standard one', () => {
    const store = createStorageAdapter({ storage: memoryStorage() });
    const mine = customRecipe('Mi V60');
    store.saveCustomRecipe(mine);
    const { result } = setup(store, mine.id);
    expect(result.current.activeRecipe.id).toBe(mine.id);
    act(() => result.current.deleteCustom(mine.id));
    expect(result.current.activeRecipe.id).toBe('v60-standard');
    expect(store.getCustomRecipes()).toEqual([]);
  });

  it('imports JSON: success activates it, other methods are saved without activating', () => {
    const store = createStorageAdapter({ storage: memoryStorage() });
    const { result } = setup(store);
    act(() => {
      const outcome = result.current.importJson(exportCustomRecipeJson(customRecipe('Compartida')));
      expect(outcome.status).toBe('imported');
    });
    expect(result.current.activeRecipe.source).toBe('custom');

    act(() => {
      const outcome = result.current.importJson(exportCustomRecipeJson(customRecipe('Invertida', 'aeropress')));
      expect(outcome).toMatchObject({ status: 'other_method', methodId: 'aeropress' });
    });
    expect(result.current.groups.mine).toHaveLength(1);
    expect(store.getCustomRecipes('aeropress')).toHaveLength(1);
  });

  it('reports invalid JSON and id conflicts, then resolves the conflict as replace or copy', () => {
    const store = createStorageAdapter({ storage: memoryStorage() });
    const mine = customRecipe('Mi V60');
    store.saveCustomRecipe(mine);
    const { result } = setup(store);

    act(() => {
      expect(result.current.importJson('{ "schemaVersion": 1, ')).toMatchObject({
        status: 'invalid',
        errorCode: 'invalid_json',
      });
    });

    const incoming = { ...mine, title: 'Mi V60 de otra persona' };
    let conflict: ReturnType<typeof result.current.importJson> | undefined;
    act(() => {
      conflict = result.current.importJson(exportCustomRecipeJson(incoming));
    });
    expect(conflict).toMatchObject({ status: 'conflict' });

    act(() => {
      result.current.resolveImportConflict(incoming, 'copy');
    });
    expect(result.current.groups.mine.map((r) => r.title)).toEqual(['Mi V60', 'Mi V60 de otra persona (copia)']);

    act(() => {
      result.current.resolveImportConflict(incoming, 'replace');
    });
    expect(result.current.groups.mine.find((r) => r.id === mine.id)?.title).toBe('Mi V60 de otra persona');
  });

  it('keeps working in memory when storage throws', () => {
    const store = createStorageAdapter({ storage: throwingStorage });
    const { result } = setup(store);
    act(() => result.current.select('v60-kasuya-4-6'));
    act(() => {
      result.current.saveCustom(draftFor('Sin storage'));
    });
    expect(result.current.groups.mine).toHaveLength(1);
    expect(result.current.activeRecipe.source).toBe('custom');
  });
});
