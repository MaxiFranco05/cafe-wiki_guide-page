import { describe, it, expect, vi } from 'vitest';
import { createPwaAdapter, type RegisterSwFn } from '../pwa.adapter';

describe('createPwaAdapter (Imperative Shell for SW & Connectivity)', () => {
  it('tracks initial navigator.onLine and reacts to window online/offline events cleanly', () => {
    const target = new EventTarget();
    let onlineFlag = true;
    const adapter = createPwaAdapter({
      isSupported: () => false,
      getOnline: () => onlineFlag,
      eventTarget: target,
    });

    const states: boolean[] = [];
    const unsubscribe = adapter.subscribe((state) => {
      states.push(state.isOnline);
    });

    expect(adapter.getSnapshot().isOnline).toBe(true);

    onlineFlag = false;
    target.dispatchEvent(new Event('offline'));
    expect(adapter.getSnapshot().isOnline).toBe(false);

    onlineFlag = true;
    target.dispatchEvent(new Event('online'));
    expect(adapter.getSnapshot().isOnline).toBe(true);

    expect(states).toEqual([false, true]);
    unsubscribe();
    adapter.dispose();
  });

  it('registers SW in prompt mode, surfaces offlineReady and needRefresh without auto-reloading, and invokes updateServiceWorker on applyUpdate', async () => {
    const target = new EventTarget();
    const updateSpy = vi.fn().mockResolvedValue(undefined);
    let capturedCallbacks: Parameters<RegisterSwFn>[0] | undefined;

    const fakeRegisterSW: RegisterSwFn = vi.fn((options) => {
      capturedCallbacks = options;
      return updateSpy;
    });

    const adapter = createPwaAdapter({
      isSupported: () => true,
      getOnline: () => true,
      eventTarget: target,
      registerSW: fakeRegisterSW,
    });

    adapter.start();
    expect(fakeRegisterSW).toHaveBeenCalledTimes(1);
    expect(capturedCallbacks?.immediate).toBe(true);

    // Trigger first offline-ready activation
    capturedCallbacks?.onOfflineReady?.();
    expect(adapter.getSnapshot().offlineReady).toBe(true);
    adapter.dismissOfflineReady();
    expect(adapter.getSnapshot().offlineReady).toBe(false);

    // Trigger new SW available (must NOT auto-reload!)
    capturedCallbacks?.onNeedRefresh?.();
    expect(adapter.getSnapshot().needRefresh).toBe(true);
    expect(updateSpy).not.toHaveBeenCalled();

    // User postpones update
    adapter.dismissUpdate();
    expect(adapter.getSnapshot().needRefresh).toBe(false);

    // Trigger again and apply update explicitly
    capturedCallbacks?.onNeedRefresh?.();
    await adapter.applyUpdate();
    expect(updateSpy).toHaveBeenCalledWith(true);

    adapter.dispose();
  });

  it('degrades silently when serviceWorker is unavailable or registration throws (e.g. private browsing)', () => {
    const target = new EventTarget();
    const throwingRegister: RegisterSwFn = () => {
      throw new Error('SecurityError: ServiceWorker blocked');
    };

    const adapter = createPwaAdapter({
      isSupported: () => true,
      getOnline: () => true,
      eventTarget: target,
      registerSW: throwingRegister,
    });

    expect(() => adapter.start()).not.toThrow();
    expect(adapter.getSnapshot()).toEqual({
      isOnline: true,
      offlineReady: false,
      needRefresh: false,
    });

    adapter.dispose();
  });
});
