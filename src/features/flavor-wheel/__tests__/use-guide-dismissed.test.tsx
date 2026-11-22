import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PREFERENCES_STORAGE_KEY, createStorageAdapter, type StorageLike } from '../../../adapters';
import { useGuideDismissed } from '../hooks/useGuideDismissed';

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
}

describe('useGuideDismissed', () => {
  it('starts visible with no stored preference', () => {
    const adapter = createStorageAdapter({ storage: memoryStorage() });
    const { result } = renderHook(() => useGuideDismissed(adapter));
    expect(result.current.dismissed).toBe(false);
  });

  it('persists the dismissal so a new mount stays hidden', () => {
    const storage = memoryStorage();
    const { result } = renderHook(() => useGuideDismissed(createStorageAdapter({ storage })));
    act(() => result.current.dismiss());
    expect(result.current.dismissed).toBe(true);

    const remount = renderHook(() => useGuideDismissed(createStorageAdapter({ storage })));
    expect(remount.result.current.dismissed).toBe(true);
  });

  it('treats an invalid stored value as not dismissed without wiping other preferences', () => {
    const storage = memoryStorage({
      [PREFERENCES_STORAGE_KEY]: JSON.stringify({
        muted: true,
        theme: 'dark',
        methodConfigs: {},
        customRecipes: [],
        flavorWheelGuideDismissed: 'yes',
      }),
    });
    const adapter = createStorageAdapter({ storage });
    const { result } = renderHook(() => useGuideDismissed(adapter));
    expect(result.current.dismissed).toBe(false);
    expect(adapter.getPreferences().muted).toBe(true);
  });
});
