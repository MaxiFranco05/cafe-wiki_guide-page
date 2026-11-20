import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes } from 'react-router';
import { BrewStationView } from '../views/BrewStationView';
import { readLastBrewMethod, resetLastBrewMethodStore } from '../../../shared/hooks/useLastBrewMethod';

interface FakeSentinel {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: () => void;
  removeEventListener: () => void;
}

function installWakeLock() {
  const release = vi.fn(async () => undefined);
  const request = vi.fn(async (): Promise<FakeSentinel> => ({
    released: false,
    release,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
  Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request } });
  return { request, release };
}

function renderStation(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <nav aria-label="test-nav">
        <Link to="/wiki">Ir a la wiki</Link>
      </nav>
      <Routes>
        <Route path="/brew/:methodSlug" element={<BrewStationView />} />
        <Route path="/wiki" element={<p>Wiki</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

const flush = () => act(async () => undefined);
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

describe('BrewStationView live execution (C-08)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetLastBrewMethodStore();
    vi.useFakeTimers({
      toFake: ['performance', 'requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout', 'Date'],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, 'wakeLock');
    vi.restoreAllMocks();
  });

  it('runs the full cycle: start locks the recipe, phases advance with grams and scene, pause, resume and reset unlock', async () => {
    renderStation('/brew/v60');
    const coffeeInput = screen.getByLabelText(/café seco \(g\)/i);
    const scene = () => document.querySelector('aside.brew-timer svg[data-vessel="cone_v60"]');

    fireEvent.click(screen.getByRole('button', { name: /iniciar extracción/i }));
    await flush();
    expect(screen.getByText(/receta bloqueada/i)).toBeInTheDocument();
    expect(coffeeInput).toBeDisabled();
    expect(screen.getByRole('button', { name: /fuerte/i })).toBeDisabled();
    expect(screen.queryByRole('slider')).toBeNull();

    advance(20_000);
    const bloomLevel = Number(scene()?.getAttribute('data-liquid-level'));
    advance(26_000); // 46 s -> phase 2
    expect(screen.getByText(/fase 2 de 4 · primer vertido/i)).toBeInTheDocument();
    expect(screen.getByTestId('brew-timer-scale-grams').textContent).toContain('175');
    expect(scene()?.getAttribute('data-pour-stream')).not.toBe('none');
    expect(Number(scene()?.getAttribute('data-liquid-level'))).toBeGreaterThanOrEqual(bloomLevel);
    const liveRow = screen.getByRole('button', { name: /^0:45 Primer vertido/i });
    expect(liveRow.className).toContain('brew-timer-row-live');
    expect(screen.getByRole('button', { name: /^0:00 Bloom/i }).className).toContain('brew-timer-row-done');

    fireEvent.click(screen.getByRole('button', { name: /pausar/i }));
    await flush();
    const frozen = screen.getByTestId('brew-timer-total').textContent;
    advance(15_000);
    expect(screen.getByTestId('brew-timer-total').textContent).toBe(frozen);
    expect(coffeeInput).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /reanudar/i }));
    await flush();
    advance(2_000);
    expect(screen.getByTestId('brew-timer-total').textContent).not.toBe(frozen);

    fireEvent.click(screen.getByRole('button', { name: /reiniciar a 00:00/i }));
    await flush();
    expect(screen.getByTestId('brew-timer-total').textContent).toBe('00:00');
    expect(coffeeInput).toBeEnabled();
    expect(coffeeInput).toHaveValue(15);
    expect(screen.queryByText(/receta bloqueada/i)).toBeNull();
  });

  it('timeline rows jump the live run instead of only previewing', async () => {
    renderStation('/brew/v60');
    fireEvent.click(screen.getByRole('button', { name: /iniciar extracción/i }));
    await flush();
    advance(1_000);
    fireEvent.click(screen.getByRole('button', { name: /^2:45 Drenaje final/i }));
    advance(200);
    expect(screen.getByTestId('brew-timer-total').textContent).toBe('02:45');
    expect(screen.getByRole('button', { name: /pausar/i })).toBeInTheDocument();
  });

  it('reaches the ready state with a full carafe and unlocks the recipe', async () => {
    renderStation('/brew/v60');
    fireEvent.click(screen.getByRole('button', { name: /iniciar extracción/i }));
    await flush();
    advance(215_000);
    expect(screen.getByText('Preparación lista')).toBeInTheDocument();
    const scene = document.querySelector('aside.brew-timer svg[data-vessel="cone_v60"]');
    expect(Number(scene?.getAttribute('data-liquid-level'))).toBe(1);
    expect(screen.getByLabelText(/café seco \(g\)/i)).toBeEnabled();
  });

  it('shows "Pantalla activa" while running and releases the wake lock on pause', async () => {
    const wake = installWakeLock();
    renderStation('/brew/v60');
    fireEvent.click(screen.getByRole('button', { name: /iniciar extracción/i }));
    await flush();
    expect(wake.request).toHaveBeenCalledWith('screen');
    expect(screen.getByText('Pantalla activa')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /pausar/i }));
    await flush();
    expect(wake.release).toHaveBeenCalled();
    expect(screen.queryByText('Pantalla activa')).toBeNull();
  });

  it('releases the wake lock when leaving the station mid-brew', async () => {
    const wake = installWakeLock();
    renderStation('/brew/v60');
    fireEvent.click(screen.getByRole('button', { name: /iniciar extracción/i }));
    await flush();
    fireEvent.click(screen.getByRole('link', { name: /ir a la wiki/i }));
    await flush();
    expect(screen.getByText('Wiki')).toBeInTheDocument();
    expect(wake.release).toHaveBeenCalled();
  });

  it('method selector switches freely when idle and remembers the last method', async () => {
    renderStation('/brew/v60');
    fireEvent.change(screen.getByLabelText(/cambiar cafetera/i), { target: { value: 'chemex' } });
    await flush();
    expect(screen.getByRole('heading', { name: 'Chemex' })).toBeInTheDocument();
    expect(readLastBrewMethod()).toBe('chemex');
  });

  it('method selector asks before discarding a running brew', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    renderStation('/brew/v60');
    fireEvent.click(screen.getByRole('button', { name: /iniciar extracción/i }));
    await flush();

    fireEvent.change(screen.getByLabelText(/cambiar cafetera/i), { target: { value: 'aeropress' } });
    await flush();
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'Hario V60' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pausar/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/cambiar cafetera/i), { target: { value: 'aeropress' } });
    await flush();
    expect(screen.getByRole('heading', { name: 'AeroPress' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar extracción/i })).toBeInTheDocument();
  });

  it('persists the mute toggle across visits', async () => {
    const first = renderStation('/brew/v60');
    fireEvent.click(screen.getByRole('button', { name: /silenciar alertas/i }));
    first.unmount();
    renderStation('/brew/v60');
    expect(screen.getByRole('button', { name: /activar sonido/i })).toHaveAttribute('aria-pressed', 'true');
  });
});
