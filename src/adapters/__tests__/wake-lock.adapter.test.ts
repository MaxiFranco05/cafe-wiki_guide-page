// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  createWakeLockAdapter,
  type WakeLockDocumentLike,
  type WakeLockNavigatorLike,
  type WakeLockSentinelLike,
} from '../wake-lock.adapter';

function createMockSentinel() {
  let released = false;
  const releaseListeners = new Set<() => void>();
  const sentinel: WakeLockSentinelLike & { triggerRelease: () => void } = {
    get released() {
      return released;
    },
    release: vi.fn(async () => {
      released = true;
      for (const listener of releaseListeners) {
        listener();
      }
    }),
    addEventListener: vi.fn((event: 'release', listener: () => void) => {
      if (event === 'release') {
        releaseListeners.add(listener);
      }
    }),
    removeEventListener: vi.fn((event: 'release', listener: () => void) => {
      if (event === 'release') {
        releaseListeners.delete(listener);
      }
    }),
    triggerRelease: () => {
      released = true;
      for (const listener of releaseListeners) {
        listener();
      }
    },
  };
  return sentinel;
}

function createMockDocument(initialState: DocumentVisibilityState = 'visible') {
  let state: DocumentVisibilityState = initialState;
  const listeners = new Set<() => void>();

  const doc: WakeLockDocumentLike & {
    setVisibilityState: (next: DocumentVisibilityState) => void;
    listenerCount: () => number;
  } = {
    get visibilityState() {
      return state;
    },
    addEventListener: vi.fn((event: 'visibilitychange', listener: () => void) => {
      if (event === 'visibilitychange') {
        listeners.add(listener);
      }
    }),
    removeEventListener: vi.fn((event: 'visibilitychange', listener: () => void) => {
      if (event === 'visibilitychange') {
        listeners.delete(listener);
      }
    }),
    setVisibilityState: (next) => {
      state = next;
      for (const listener of listeners) {
        listener();
      }
    },
    listenerCount: () => listeners.size,
  };

  return doc;
}

describe('WakeLockAdapter (RN-UX-02, SU-02)', () => {
  it('acquires and releases screen wake lock cleanly', async () => {
    const sentinel = createMockSentinel();
    const request = vi.fn(async () => sentinel);
    const nav: WakeLockNavigatorLike = { wakeLock: { request } };
    const doc = createMockDocument('visible');

    const adapter = createWakeLockAdapter({ navigator: nav, document: doc });
    expect(adapter.getStatus()).toEqual({ isSupported: true, isActive: false });

    const acquired = await adapter.requestWakeLock();
    expect(acquired).toBe(true);
    expect(request).toHaveBeenCalledWith('screen');
    expect(adapter.getStatus()).toEqual({ isSupported: true, isActive: true });

    await adapter.releaseWakeLock();
    expect(sentinel.release).toHaveBeenCalledTimes(1);
    expect(adapter.getStatus()).toEqual({ isSupported: true, isActive: false });

    adapter.dispose();
  });

  it('re-acquires screen wake lock automatically when document becomes visible while active', async () => {
    const firstSentinel = createMockSentinel();
    const secondSentinel = createMockSentinel();
    const request = vi
      .fn<() => Promise<WakeLockSentinelLike>>()
      .mockResolvedValueOnce(firstSentinel)
      .mockResolvedValueOnce(secondSentinel);
    const nav: WakeLockNavigatorLike = { wakeLock: { request } };
    const doc = createMockDocument('visible');

    const adapter = createWakeLockAdapter({ navigator: nav, document: doc });
    await adapter.requestWakeLock();
    expect(request).toHaveBeenCalledTimes(1);

    // Tab moves to background -> OS releases sentinel
    doc.setVisibilityState('hidden');
    firstSentinel.triggerRelease();
    expect(adapter.getStatus().isActive).toBe(false);

    // Tab returns to foreground -> adapter re-acquires automatically
    doc.setVisibilityState('visible');
    await vi.waitFor(() => {
      expect(request).toHaveBeenCalledTimes(2);
    });
    expect(adapter.getStatus().isActive).toBe(true);

    adapter.dispose();
  });

  it('degrades silently when navigator.wakeLock is unsupported or rejects with NotAllowedError', async () => {
    const unsupported = createWakeLockAdapter({ navigator: {}, document: createMockDocument() });
    expect(unsupported.getStatus()).toEqual({ isSupported: false, isActive: false });
    await expect(unsupported.requestWakeLock()).resolves.toBe(false);
    await expect(unsupported.releaseWakeLock()).resolves.toBeUndefined();
    unsupported.dispose();

    const rejectedNav: WakeLockNavigatorLike = {
      wakeLock: {
        request: vi.fn(async () => {
          throw new DOMException('Battery saver enabled', 'NotAllowedError');
        }),
      },
    };
    const rejectedAdapter = createWakeLockAdapter({
      navigator: rejectedNav,
      document: createMockDocument(),
    });
    await expect(rejectedAdapter.requestWakeLock()).resolves.toBe(false);
    expect(rejectedAdapter.getStatus()).toEqual({ isSupported: true, isActive: false });
    rejectedAdapter.dispose();
  });

  it('deduplicates concurrent/repeated requests, handles external release, and cleans up listeners on dispose', async () => {
    const sentinel = createMockSentinel();
    const request = vi.fn(async () => sentinel);
    const nav: WakeLockNavigatorLike = { wakeLock: { request } };
    const doc = createMockDocument('visible');

    const adapter = createWakeLockAdapter({ navigator: nav, document: doc });
    expect(doc.listenerCount()).toBe(1);

    const [r1, r2] = await Promise.all([adapter.requestWakeLock(), adapter.requestWakeLock()]);
    expect(r1).toBe(true);
    expect(r2).toBe(true);
    expect(request).toHaveBeenCalledTimes(1);

    // Repeated call while sentinel is active reuses existing lock
    expect(await adapter.requestWakeLock()).toBe(true);
    expect(request).toHaveBeenCalledTimes(1);

    // External OS release flips isActive to false
    sentinel.triggerRelease();
    expect(adapter.getStatus().isActive).toBe(false);

    // Dispose detaches visibilitychange listener and blocks further requests
    adapter.dispose();
    expect(doc.listenerCount()).toBe(0);
    doc.setVisibilityState('visible');
    expect(await adapter.requestWakeLock()).toBe(false);
    expect(request).toHaveBeenCalledTimes(1);
  });
});
