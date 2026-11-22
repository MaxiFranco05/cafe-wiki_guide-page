import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createPwaAdapter, type RegisterSwFn } from '../../adapters/pwa.adapter';
import { PwaStatusToast } from '../components/PwaStatusToast';

const EMOJI_REGEX = /\p{Extended_Pictographic}/u;

describe('PwaStatusToast (Offline, Offline-Ready & Update Prompt)', () => {
  it('renders nothing when online with no offlineReady or needRefresh notification', () => {
    const target = new EventTarget();
    const adapter = createPwaAdapter({
      isSupported: () => false,
      getOnline: () => true,
      eventTarget: target,
    });

    const { container } = render(<PwaStatusToast adapter={adapter} />);
    expect(container.firstChild).toBeNull();
    adapter.dispose();
  });

  it('shows discreet offline status when connectivity drops and hides it automatically when back online', () => {
    const target = new EventTarget();
    let online = true;
    const adapter = createPwaAdapter({
      isSupported: () => false,
      getOnline: () => online,
      eventTarget: target,
    });

    render(<PwaStatusToast adapter={adapter} />);
    expect(screen.queryByRole('status')).toBeNull();

    act(() => {
      online = false;
      target.dispatchEvent(new Event('offline'));
    });

    const region = screen.getByRole('status');
    expect(region).toHaveTextContent('Sin conexión · Modo offline activo');
    expect(EMOJI_REGEX.test(region.textContent ?? '')).toBe(false);

    act(() => {
      online = true;
      target.dispatchEvent(new Event('online'));
    });

    expect(screen.queryByRole('status')).toBeNull();
    adapter.dispose();
  });

  it('shows offline-ready toast and dismisses it cleanly on close button click', async () => {
    const user = userEvent.setup();
    let callbacks: Parameters<RegisterSwFn>[0] | undefined;
    const adapter = createPwaAdapter({
      isSupported: () => true,
      getOnline: () => true,
      eventTarget: new EventTarget(),
      registerSW: (opts) => {
        callbacks = opts;
        return vi.fn().mockResolvedValue(undefined);
      },
    });

    render(<PwaStatusToast adapter={adapter} />);

    act(() => {
      callbacks?.onOfflineReady?.();
    });

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Lista para usar sin conexión');
    expect(EMOJI_REGEX.test(status.textContent ?? '')).toBe(false);

    await user.click(screen.getByRole('button', { name: /cerrar aviso/i }));
    expect(screen.queryByRole('status')).toBeNull();
    adapter.dispose();
  });

  it('prioritizes update prompt over offline/offlineReady, lets user postpone or apply update', async () => {
    const user = userEvent.setup();
    const updateSpy = vi.fn().mockResolvedValue(undefined);
    let callbacks: Parameters<RegisterSwFn>[0] | undefined;
    const target = new EventTarget();
    let online = false;

    const adapter = createPwaAdapter({
      isSupported: () => true,
      getOnline: () => online,
      eventTarget: target,
      registerSW: (opts) => {
        callbacks = opts;
        return updateSpy;
      },
    });

    render(<PwaStatusToast adapter={adapter} />);
    expect(screen.getByRole('status')).toHaveTextContent('Sin conexión · Modo offline activo');

    act(() => {
      callbacks?.onNeedRefresh?.();
    });

    // Update prompt takes priority over offline indicator
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Nueva versión disponible');
    expect(EMOJI_REGEX.test(status.textContent ?? '')).toBe(false);

    // Postponing reveals the underlying offline indicator without calling updateSW
    await user.click(screen.getByRole('button', { name: /después/i }));
    expect(updateSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Sin conexión · Modo offline activo');

    // Re-trigger update and click Actualizar
    act(() => {
      online = true;
      target.dispatchEvent(new Event('online'));
      callbacks?.onNeedRefresh?.();
    });

    await user.click(screen.getByRole('button', { name: /actualizar/i }));
    expect(updateSpy).toHaveBeenCalledWith(true);

    adapter.dispose();
  });
});
