import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  PREFERENCES_STORAGE_KEY,
  getSharedStorageAdapter,
  resetSharedStorageAdapter,
  type UserPreferences,
  type WakeLockAdapter,
  type WebAudioAdapter,
} from '../../../adapters';
import { buildCustomRecipe } from '../../../domain/brewing';
import { getMethodBySlug } from '../../../data/methods';
import { rememberBrewMethod } from '../../../shared/hooks/useLastBrewMethod';
import { useKitchenAdapters } from '../hooks/useKitchenAdapters';

const wake = (): WakeLockAdapter => ({
  requestWakeLock: vi.fn(async () => true),
  releaseWakeLock: vi.fn(async () => undefined),
  getStatus: () => ({ isSupported: true, isActive: false }),
  dispose: vi.fn(),
});

const audio = (): WebAudioAdapter => {
  let muted = false;
  return {
    isSupported: () => true,
    isMuted: () => muted,
    setMuted: (next: boolean) => {
      muted = next;
    },
    unlock: async () => true,
    playEvent: () => undefined,
    dispose: async () => undefined,
  };
};

function stored(): UserPreferences {
  return JSON.parse(window.localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? '{}') as UserPreferences;
}

describe('shared storage adapter (C-14 decision 13)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetSharedStorageAdapter();
  });

  it('returns the same instance until reset', () => {
    const first = getSharedStorageAdapter();
    expect(getSharedStorageAdapter()).toBe(first);
    resetSharedStorageAdapter();
    expect(getSharedStorageAdapter()).not.toBe(first);
  });

  it('keeps a custom recipe and the mute preference across last-method and kitchen writes', () => {
    const v60 = getMethodBySlug('v60')!;
    const built = buildCustomRecipe(
      {
        methodId: 'v60',
        title: 'Mi V60',
        phases: [{ type: 'pour', title: 'Vertido', durationSeconds: 120, waterAmount: 250 }],
      },
      v60
    );
    if (!built.ok) throw new Error('fixture');

    rememberBrewMethod('v60');
    getSharedStorageAdapter().saveCustomRecipe(built.recipe);

    const { result } = renderHook(() => useKitchenAdapters({ createWakeLock: wake, createAudio: audio }));
    act(() => result.current.toggleMute());
    rememberBrewMethod('chemex');

    const prefs = stored();
    expect(prefs.customRecipes.map((r) => r.id)).toEqual([built.recipe.id]);
    expect(prefs.muted).toBe(true);
    expect(prefs.lastSelectedMethodSlug).toBe('chemex');
  });
});
