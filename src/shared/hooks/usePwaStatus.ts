import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { pwaAdapter, type PwaAdapter, type PwaStatusSnapshot } from '../../adapters/pwa.adapter';

export interface UsePwaStatusResult extends PwaStatusSnapshot {
  readonly dismissOfflineReady: () => void;
  readonly dismissUpdate: () => void;
  readonly applyUpdate: () => Promise<void>;
}

/**
 * React hook subscribing to the imperative PWA adapter via `useSyncExternalStore`.
 */
export function usePwaStatus(adapter: PwaAdapter = pwaAdapter): UsePwaStatusResult {
  const subscribe = useCallback(
    (onStoreChange: () => void) => adapter.subscribe(onStoreChange),
    [adapter]
  );

  const snapshot = useSyncExternalStore(
    subscribe,
    () => adapter.getSnapshot(),
    () => adapter.getSnapshot()
  );

  useEffect(() => {
    adapter.start();
  }, [adapter]);

  const dismissOfflineReady = useCallback(() => {
    adapter.dismissOfflineReady();
  }, [adapter]);

  const dismissUpdate = useCallback(() => {
    adapter.dismissUpdate();
  }, [adapter]);

  const applyUpdate = useCallback(() => adapter.applyUpdate(), [adapter]);

  return {
    ...snapshot,
    dismissOfflineReady,
    dismissUpdate,
    applyUpdate,
  };
}
