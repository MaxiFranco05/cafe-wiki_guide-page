import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { createStorageAdapter, type StorageLike, type WakeLockAdapter, type WebAudioAdapter } from '../../../adapters';
import { useKitchenAdapters } from '../hooks/useKitchenAdapters';

function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

function fakeWakeLock(supported = true): WakeLockAdapter & { calls: string[] } {
  const calls: string[] = [];
  let active = false;
  return {
    calls,
    requestWakeLock: vi.fn(async () => {
      calls.push('request');
      active = supported;
      return supported;
    }),
    releaseWakeLock: vi.fn(async () => {
      calls.push('release');
      active = false;
    }),
    getStatus: () => ({ isSupported: supported, isActive: active }),
    dispose: vi.fn(() => calls.push('dispose')),
  };
}

function fakeAudio(): WebAudioAdapter & { calls: string[] } {
  const calls: string[] = [];
  let muted = false;
  return {
    calls,
    isSupported: () => true,
    isMuted: () => muted,
    setMuted: vi.fn((m: boolean) => {
      muted = m;
    }),
    unlock: vi.fn(async () => {
      calls.push('unlock');
      return true;
    }),
    playEvent: vi.fn((e) => {
      if (!muted) calls.push(`play:${e}`);
    }),
    dispose: vi.fn(async () => {
      calls.push('dispose');
    }),
  };
}

describe('useKitchenAdapters', () => {
  let storage: StorageLike;

  beforeEach(() => {
    storage = memoryStorage();
  });

  it('creates adapters once and exposes wake lock support and persisted mute', () => {
    const wake = fakeWakeLock();
    const audio = fakeAudio();
    const createWakeLock = vi.fn(() => wake);
    const createAudio = vi.fn(() => audio);
    const store = createStorageAdapter({ storage });
    store.updatePreferences({ muted: true });

    const { result, rerender } = renderHook(() =>
      useKitchenAdapters({ createWakeLock, createAudio, createStorage: () => store }),
    );
    rerender();

    expect(createWakeLock).toHaveBeenCalledTimes(1);
    expect(createAudio).toHaveBeenCalledTimes(1);
    expect(result.current.muted).toBe(true);
    expect(result.current.wakeLockSupported).toBe(true);
    expect(audio.setMuted).toHaveBeenCalledWith(true);
  });

  it('engage unlocks audio and requests the wake lock; disengage releases it', async () => {
    const wake = fakeWakeLock();
    const audio = fakeAudio();
    const { result } = renderHook(() =>
      useKitchenAdapters({ createWakeLock: () => wake, createAudio: () => audio, createStorage: () => createStorageAdapter({ storage }) }),
    );

    await act(async () => {
      result.current.engage();
    });
    expect(audio.calls).toContain('unlock');
    expect(wake.calls).toEqual(['request']);
    expect(result.current.wakeLockActive).toBe(true);

    await act(async () => {
      result.current.disengage();
    });
    expect(wake.calls).toEqual(['request', 'release']);
    expect(result.current.wakeLockActive).toBe(false);
  });

  it('toggleMute persists the preference and silences events', () => {
    const audio = fakeAudio();
    const store = createStorageAdapter({ storage });
    const { result } = renderHook(() =>
      useKitchenAdapters({ createWakeLock: () => fakeWakeLock(), createAudio: () => audio, createStorage: () => store }),
    );

    act(() => result.current.toggleMute());

    expect(result.current.muted).toBe(true);
    expect(store.getPreferences().muted).toBe(true);
    result.current.playEvent('phase_transition');
    expect(audio.calls).not.toContain('play:phase_transition');
  });

  it('reports an unsupported wake lock without throwing', async () => {
    const wake = fakeWakeLock(false);
    const { result } = renderHook(() =>
      useKitchenAdapters({ createWakeLock: () => wake, createAudio: () => fakeAudio(), createStorage: () => createStorageAdapter({ storage }) }),
    );
    expect(result.current.wakeLockSupported).toBe(false);
    await act(async () => {
      result.current.engage();
    });
    expect(result.current.wakeLockActive).toBe(false);
  });

  it('releases the wake lock and disposes adapters on unmount', async () => {
    const wake = fakeWakeLock();
    const audio = fakeAudio();
    const { result, unmount } = renderHook(() =>
      useKitchenAdapters({ createWakeLock: () => wake, createAudio: () => audio, createStorage: () => createStorageAdapter({ storage }) }),
    );
    await act(async () => {
      result.current.engage();
    });
    unmount();
    expect(wake.calls).toContain('release');
    expect(wake.calls).toContain('dispose');
    expect(audio.calls).toContain('dispose');
  });
});
