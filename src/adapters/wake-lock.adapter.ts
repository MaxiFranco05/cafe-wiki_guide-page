export interface WakeLockSentinelLike {
  readonly released: boolean;
  release(): Promise<void>;
  addEventListener?(event: 'release', listener: () => void): void;
  removeEventListener?(event: 'release', listener: () => void): void;
}

export interface WakeLockNavigatorLike {
  readonly wakeLock?: {
    request(type: 'screen'): Promise<WakeLockSentinelLike>;
  };
}

export interface WakeLockDocumentLike {
  readonly visibilityState: DocumentVisibilityState;
  addEventListener(event: 'visibilitychange', listener: () => void): void;
  removeEventListener(event: 'visibilitychange', listener: () => void): void;
}

export interface WakeLockStatus {
  readonly isSupported: boolean;
  readonly isActive: boolean;
}

export interface WakeLockAdapterDeps {
  readonly navigator?: WakeLockNavigatorLike;
  readonly document?: WakeLockDocumentLike;
}

export interface WakeLockAdapter {
  requestWakeLock(): Promise<boolean>;
  releaseWakeLock(): Promise<void>;
  getStatus(): WakeLockStatus;
  dispose(): void;
}

function getDefaultNavigator(): WakeLockNavigatorLike | undefined {
  return typeof navigator !== 'undefined' ? (navigator as WakeLockNavigatorLike) : undefined;
}

function getDefaultDocument(): WakeLockDocumentLike | undefined {
  return typeof document !== 'undefined' ? document : undefined;
}

/**
 * Encapsulates Screen Wake Lock API lifecycle with silent fallback and automatic
 * re-acquisition on `visibilitychange === 'visible'` while a brew timer is active.
 */
export function createWakeLockAdapter(deps?: WakeLockAdapterDeps): WakeLockAdapter {
  const nav = deps && 'navigator' in deps ? deps.navigator : getDefaultNavigator();
  const doc = deps && 'document' in deps ? deps.document : getDefaultDocument();
  const isSupported = typeof nav?.wakeLock?.request === 'function';

  let sentinel: WakeLockSentinelLike | null = null;
  let shouldHoldLock = false;
  let pendingRequest: Promise<boolean> | null = null;
  let isDisposed = false;

  const handleSentinelRelease = () => {
    sentinel = null;
  };

  const attachSentinel = (nextSentinel: WakeLockSentinelLike) => {
    if (sentinel && sentinel !== nextSentinel) {
      sentinel.removeEventListener?.('release', handleSentinelRelease);
    }
    sentinel = nextSentinel;
    sentinel.addEventListener?.('release', handleSentinelRelease);
  };

  const acquireInternal = async (): Promise<boolean> => {
    if (!isSupported || !nav?.wakeLock || isDisposed) {
      return false;
    }

    if (sentinel && !sentinel.released) {
      return true;
    }

    if (pendingRequest) {
      return pendingRequest;
    }

    pendingRequest = (async () => {
      try {
        const nextSentinel = await nav.wakeLock!.request('screen');
        if (!shouldHoldLock || isDisposed) {
          await nextSentinel.release().catch(() => undefined);
          return false;
        }
        attachSentinel(nextSentinel);
        return true;
      } catch {
        sentinel = null;
        return false;
      } finally {
        pendingRequest = null;
      }
    })();

    return pendingRequest;
  };

  const handleVisibilityChange = () => {
    if (shouldHoldLock && !isDisposed && doc?.visibilityState === 'visible') {
      void acquireInternal();
    }
  };

  if (doc) {
    doc.addEventListener('visibilitychange', handleVisibilityChange);
  }

  return {
    async requestWakeLock(): Promise<boolean> {
      if (isDisposed) {
        return false;
      }
      shouldHoldLock = true;
      return acquireInternal();
    },

    async releaseWakeLock(): Promise<void> {
      shouldHoldLock = false;
      const current = sentinel;
      sentinel = null;
      if (!current) {
        return;
      }
      current.removeEventListener?.('release', handleSentinelRelease);
      if (!current.released) {
        try {
          await current.release();
        } catch {
          // Graceful degradation on OS-already-released sentinels
        }
      }
    },

    getStatus(): WakeLockStatus {
      return {
        isSupported,
        isActive: sentinel !== null && !sentinel.released,
      };
    },

    dispose(): void {
      isDisposed = true;
      shouldHoldLock = false;
      if (doc) {
        doc.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      const current = sentinel;
      sentinel = null;
      if (current) {
        current.removeEventListener?.('release', handleSentinelRelease);
        if (!current.released) {
          void current.release().catch(() => undefined);
        }
      }
    },
  };
}
