// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_USER_PREFERENCES,
  PREFERENCES_STORAGE_KEY,
  createStorageAdapter,
  createWakeLockAdapter,
  createWebAudioAdapter,
  type StorageLike,
} from '../index';

function createMemoryStorageMock(): StorageLike & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
  };
}

describe('StorageAdapter (Zod validation & memory fallback)', () => {
  it('persists and reads validated preferences including lastSelectedMethodSlug and per-method config', () => {
    const mockStorage = createMemoryStorageMock();
    const adapter = createStorageAdapter({ storage: mockStorage });

    expect(adapter.getPreferences()).toEqual(DEFAULT_USER_PREFERENCES);

    adapter.updatePreferences({
      muted: true,
      lastSelectedMethodSlug: 'aeropress',
    });
    adapter.setMethodConfig('v60', {
      coffeeGrams: 18,
      waterMl: 300,
      profileId: 'strong',
    });

    // Fresh adapter instance reading from the same backing localStorage
    const rehydrated = createStorageAdapter({ storage: mockStorage });
    const prefs = rehydrated.getPreferences();

    expect(prefs.muted).toBe(true);
    expect(prefs.theme).toBe('dark');
    expect(prefs.lastSelectedMethodSlug).toBe('aeropress');
    expect(prefs.methodConfigs.v60).toEqual({
      coffeeGrams: 18,
      waterMl: 300,
      profileId: 'strong',
    });
  });

  it('recovers safely to DEFAULT_USER_PREFERENCES on malformed JSON or Zod schema violations', () => {
    const mockStorage = createMemoryStorageMock();
    mockStorage.store.set(PREFERENCES_STORAGE_KEY, '{not-valid-json');

    const corruptedAdapter = createStorageAdapter({ storage: mockStorage });
    expect(corruptedAdapter.getPreferences()).toEqual(DEFAULT_USER_PREFERENCES);

    mockStorage.store.set(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        muted: 'not-a-boolean',
        theme: 'invalid-theme',
        methodConfigs: { v60: { coffeeGrams: -10 } },
      }),
    );
    const invalidSchemaAdapter = createStorageAdapter({ storage: mockStorage });
    expect(invalidSchemaAdapter.getPreferences()).toEqual(DEFAULT_USER_PREFERENCES);
  });

  it('falls back transparently to in-memory storage when localStorage throws QuotaExceededError or is unavailable', () => {
    const quotaStorage: StorageLike = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      }),
      removeItem: vi.fn(),
    };

    const quotaAdapter = createStorageAdapter({ storage: quotaStorage });
    expect(() =>
      quotaAdapter.updatePreferences({ muted: true, lastSelectedMethodSlug: 'espresso' }),
    ).not.toThrow();

    expect(quotaAdapter.getPreferences().muted).toBe(true);
    expect(quotaAdapter.getPreferences().lastSelectedMethodSlug).toBe('espresso');

    const noStorageAdapter = createStorageAdapter({ storage: undefined });
    noStorageAdapter.setMethodConfig('chemex', {
      coffeeGrams: 30,
      waterMl: 500,
      profileId: 'normal',
    });
    expect(noStorageAdapter.getPreferences().methodConfigs.chemex?.coffeeGrams).toBe(30);
  });

  it('isolates returned preference clones from external mutation, supports clearPreferences, and exports all adapters via barrel', () => {
    expect(typeof createWakeLockAdapter).toBe('function');
    expect(typeof createWebAudioAdapter).toBe('function');

    const mockStorage = createMemoryStorageMock();
    const adapter = createStorageAdapter({ storage: mockStorage });
    adapter.setMethodConfig('v60', { coffeeGrams: 15, waterMl: 250, profileId: 'normal' });

    const snapshot = adapter.getPreferences();
    snapshot.muted = true;
    if (snapshot.methodConfigs.v60) {
      snapshot.methodConfigs.v60.coffeeGrams = 999;
    }

    // Internal mirror must remain unmutated
    const freshRead = adapter.getPreferences();
    expect(freshRead.muted).toBe(false);
    expect(freshRead.methodConfigs.v60?.coffeeGrams).toBe(15);

    const cleared = adapter.clearPreferences();
    expect(cleared).toEqual(DEFAULT_USER_PREFERENCES);
    expect(mockStorage.removeItem).toHaveBeenCalledWith(PREFERENCES_STORAGE_KEY);
  });
});
