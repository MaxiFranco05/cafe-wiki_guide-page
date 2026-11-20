import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createWakeLockAdapter,
  getSharedStorageAdapter,
  createWebAudioAdapter,
  type StorageAdapter,
  type WakeLockAdapter,
  type WebAudioAdapter,
} from '../../../adapters';
import type { BrewTimerEvent } from '../../../domain/timer';

export interface KitchenAdapterFactories {
  readonly createWakeLock?: () => WakeLockAdapter;
  readonly createAudio?: () => WebAudioAdapter;
  readonly createStorage?: () => StorageAdapter;
}

export interface KitchenControls {
  readonly muted: boolean;
  readonly wakeLockSupported: boolean;
  readonly wakeLockActive: boolean;
  /** Must be called synchronously inside the user's Start/Resume gesture (SU-02). */
  engage(): void;
  disengage(): void;
  toggleMute(): void;
  playEvent(event: BrewTimerEvent): void;
}

interface AdapterSet {
  readonly wakeLock: WakeLockAdapter;
  readonly audio: WebAudioAdapter;
}

/**
 * Imperative shell for Kitchen Mode: Screen Wake Lock, Web Audio cues and the persisted mute
 * preference. Adapters live for one mount (StrictMode-safe) and are released on unmount.
 */
export function useKitchenAdapters(factories: KitchenAdapterFactories = {}): KitchenControls {
  const factoriesRef = useRef(factories);
  const [storage] = useState<StorageAdapter>(() =>
    (factories.createStorage ?? getSharedStorageAdapter)(),
  );
  const [muted, setMuted] = useState<boolean>(() => storage.getPreferences().muted);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [wakeLockSupported, setWakeLockSupported] = useState(true);
  const adaptersRef = useRef<AdapterSet | null>(null);
  const mutedRef = useRef(muted);
  const mountedRef = useRef(false);

  useEffect(() => {
    const { createWakeLock, createAudio } = factoriesRef.current;
    const wakeLock = (createWakeLock ?? (() => createWakeLockAdapter()))();
    const audio = (createAudio ?? (() => createWebAudioAdapter({ initialMuted: mutedRef.current })))();
    audio.setMuted(mutedRef.current);
    adaptersRef.current = { wakeLock, audio };
    mountedRef.current = true;
    setWakeLockSupported(wakeLock.getStatus().isSupported);

    return () => {
      mountedRef.current = false;
      adaptersRef.current = null;
      void wakeLock.releaseWakeLock();
      wakeLock.dispose();
      void audio.dispose();
    };
  }, []);

  const engage = useCallback(() => {
    const adapters = adaptersRef.current;
    if (!adapters) return;
    void adapters.audio.unlock();
    void adapters.wakeLock.requestWakeLock().then((active) => {
      if (mountedRef.current) setWakeLockActive(active);
    });
  }, []);

  const disengage = useCallback(() => {
    setWakeLockActive(false);
    const adapters = adaptersRef.current;
    if (adapters) void adapters.wakeLock.releaseWakeLock();
  }, []);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    adaptersRef.current?.audio.setMuted(next);
    storage.updatePreferences({ muted: next });
  }, [storage]);

  const playEvent = useCallback((event: BrewTimerEvent) => {
    adaptersRef.current?.audio.playEvent(event);
  }, []);

  return { muted, wakeLockSupported, wakeLockActive, engage, disengage, toggleMute, playEvent };
}
