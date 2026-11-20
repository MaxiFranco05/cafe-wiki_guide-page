import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { PREFERENCES_STORAGE_KEY } from '../../adapters';
import {
  DEFAULT_BREW_METHOD_SLUG,
  readLastBrewMethod,
  rememberBrewMethod,
  resetLastBrewMethodStore,
  useLastBrewMethod,
} from '../hooks/useLastBrewMethod';

describe('useLastBrewMethod (last selected brew method store)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetLastBrewMethodStore();
  });

  it('falls back to v60 when nothing is stored', () => {
    expect(DEFAULT_BREW_METHOD_SLUG).toBe('v60');
    expect(readLastBrewMethod()).toBe('v60');
  });

  it('reads a valid persisted slug', () => {
    window.localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ muted: false, theme: 'dark', lastSelectedMethodSlug: 'chemex', methodConfigs: {} }),
    );
    resetLastBrewMethodStore();
    expect(readLastBrewMethod()).toBe('chemex');
  });

  it('ignores an invalid persisted slug without throwing', () => {
    window.localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ muted: false, theme: 'dark', lastSelectedMethodSlug: 'moka-pot', methodConfigs: {} }),
    );
    resetLastBrewMethodStore();
    expect(() => readLastBrewMethod()).not.toThrow();
    expect(readLastBrewMethod()).toBe('v60');
  });

  it('persists a remembered slug and notifies subscribed hooks', () => {
    const { result } = renderHook(() => useLastBrewMethod());
    expect(result.current).toBe('v60');

    act(() => rememberBrewMethod('aeropress'));

    expect(result.current).toBe('aeropress');
    const stored = JSON.parse(window.localStorage.getItem(PREFERENCES_STORAGE_KEY) ?? '{}');
    expect(stored.lastSelectedMethodSlug).toBe('aeropress');
  });

  it('ignores unknown slugs passed to rememberBrewMethod', () => {
    act(() => rememberBrewMethod('not-a-method'));
    expect(readLastBrewMethod()).toBe('v60');
  });
});
