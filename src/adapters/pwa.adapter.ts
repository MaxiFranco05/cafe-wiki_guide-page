import { registerSW as defaultRegisterSW } from 'virtual:pwa-register';

export interface PwaStatusSnapshot {
  readonly isOnline: boolean;
  readonly offlineReady: boolean;
  readonly needRefresh: boolean;
}

export interface RegisterSwOptions {
  readonly immediate?: boolean;
  readonly onNeedRefresh?: () => void;
  readonly onOfflineReady?: () => void;
  readonly onRegisterError?: (error: unknown) => void;
}

export type RegisterSwFn = (
  options?: RegisterSwOptions
) => (reloadPage?: boolean) => Promise<void>;

export interface PwaAdapterDeps {
  readonly isSupported?: () => boolean;
  readonly getOnline?: () => boolean;
  readonly eventTarget?: EventTarget | null;
  readonly registerSW?: RegisterSwFn;
}

export interface PwaAdapter {
  start: () => void;
  getSnapshot: () => PwaStatusSnapshot;
  subscribe: (listener: (snapshot: PwaStatusSnapshot) => void) => () => void;
  dismissOfflineReady: () => void;
  dismissUpdate: () => void;
  applyUpdate: () => Promise<void>;
  dispose: () => void;
}

function defaultIsSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
}

function defaultGetOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

function defaultEventTarget(): EventTarget | null {
  return typeof window !== 'undefined' ? window : null;
}

/**
 * Imperative Shell adapter encapsulating Service Worker lifecycle (`registerType: 'prompt'`)
 * and browser online/offline connectivity events with graceful degradation.
 */
export function createPwaAdapter(deps: PwaAdapterDeps = {}): PwaAdapter {
  const isSupported = deps.isSupported ?? defaultIsSupported;
  const getOnline = deps.getOnline ?? defaultGetOnline;
  const eventTarget = deps.eventTarget !== undefined ? deps.eventTarget : defaultEventTarget();
  const registerSwFn = deps.registerSW ?? (defaultRegisterSW as RegisterSwFn);

  let snapshot: PwaStatusSnapshot = Object.freeze({
    isOnline: getOnline(),
    offlineReady: false,
    needRefresh: false,
  });

  const listeners = new Set<(next: PwaStatusSnapshot) => void>();
  let started = false;
  let listenersAttached = false;
  let updateServiceWorker: ((reloadPage?: boolean) => Promise<void>) | null = null;

  const emit = (patch: Partial<PwaStatusSnapshot>): void => {
    const next: PwaStatusSnapshot = Object.freeze({
      isOnline: patch.isOnline ?? snapshot.isOnline,
      offlineReady: patch.offlineReady ?? snapshot.offlineReady,
      needRefresh: patch.needRefresh ?? snapshot.needRefresh,
    });
    if (
      next.isOnline === snapshot.isOnline &&
      next.offlineReady === snapshot.offlineReady &&
      next.needRefresh === snapshot.needRefresh
    ) {
      return;
    }
    snapshot = next;
    for (const listener of listeners) {
      listener(snapshot);
    }
  };

  const handleOnline = (): void => {
    emit({ isOnline: getOnline() });
  };

  const handleOffline = (): void => {
    emit({ isOnline: getOnline() });
  };

  const attachNetworkListeners = (): void => {
    if (listenersAttached || !eventTarget) {
      return;
    }
    eventTarget.addEventListener('online', handleOnline);
    eventTarget.addEventListener('offline', handleOffline);
    listenersAttached = true;
  };

  attachNetworkListeners();

  return {
    start() {
      attachNetworkListeners();
      if (started) {
        return;
      }
      started = true;
      if (!isSupported()) {
        return;
      }
      try {
        updateServiceWorker = registerSwFn({
          immediate: true,
          onOfflineReady() {
            emit({ offlineReady: true });
          },
          onNeedRefresh() {
            emit({ needRefresh: true });
          },
          onRegisterError() {
            // Degrade silently in restricted browsers (e.g. private browsing)
          },
        });
      } catch {
        updateServiceWorker = null;
      }
    },

    getSnapshot() {
      return snapshot;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    dismissOfflineReady() {
      emit({ offlineReady: false });
    },

    dismissUpdate() {
      emit({ needRefresh: false });
    },

    async applyUpdate() {
      if (!updateServiceWorker) {
        return;
      }
      try {
        await updateServiceWorker(true);
      } catch {
        // Never crash UI if SW reload fails
      }
    },

    dispose() {
      if (listenersAttached && eventTarget) {
        eventTarget.removeEventListener('online', handleOnline);
        eventTarget.removeEventListener('offline', handleOffline);
        listenersAttached = false;
      }
      listeners.clear();
    },
  };
}

export const pwaAdapter: PwaAdapter = createPwaAdapter();
