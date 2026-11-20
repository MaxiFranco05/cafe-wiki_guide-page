import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { useState } from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { calculateScaledRecipe } from '../../../domain/brewing';
import { getMethodBySlug } from '../../../data/methods';
import {
  createStorageAdapter,
  type StorageLike,
  type WakeLockAdapter,
  type WebAudioAdapter,
} from '../../../adapters';
import type { BrewTimerEvent } from '../../../domain/timer';
import { BrewTimer } from '../components/BrewTimer';
import type { BrewTimerClock } from '../hooks/useBrewTimer';

const v60 = getMethodBySlug('v60')!;
const espresso = getMethodBySlug('espresso')!;
const v60Recipe = calculateScaledRecipe(v60, 'normal', { coffeeGrams: 15 });
const espressoRecipe = calculateScaledRecipe(espresso, 'normale', { coffeeGrams: 18 });

function harness(opts: { wakeSupported?: boolean } = {}) {
  let nowMs = 0;
  const frames = new Map<number, () => void>();
  let nextId = 1;
  const clock: BrewTimerClock = {
    now: () => nowMs,
    requestFrame: (cb) => {
      const id = nextId++;
      frames.set(id, () => cb(nowMs));
      return id;
    },
    cancelFrame: (id) => void frames.delete(id),
  };
  const advance = (ms: number) =>
    act(() => {
      nowMs += ms;
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((run) => run());
    });

  const played: BrewTimerEvent[] = [];
  const wakeCalls: string[] = [];
  let muted = false;
  const supported = opts.wakeSupported ?? true;
  const wake: WakeLockAdapter = {
    requestWakeLock: vi.fn(async () => {
      wakeCalls.push('request');
      return supported;
    }),
    releaseWakeLock: vi.fn(async () => void wakeCalls.push('release')),
    getStatus: () => ({ isSupported: supported, isActive: false }),
    dispose: vi.fn(),
  };
  const audio: WebAudioAdapter = {
    isSupported: () => true,
    isMuted: () => muted,
    setMuted: (m) => {
      muted = m;
    },
    unlock: vi.fn(async () => true),
    playEvent: (e) => {
      if (!muted) played.push(e);
    },
    dispose: vi.fn(async () => undefined),
  };
  const map = new Map<string, string>();
  const storage: StorageLike = {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
  const store = createStorageAdapter({ storage });
  const kitchenFactories = { createWakeLock: () => wake, createAudio: () => audio, createStorage: () => store };
  return { clock, advance, played, wakeCalls, store, kitchenFactories };
}

function TimerUnderTest({
  h,
  espressoMode = false,
}: {
  readonly h: ReturnType<typeof harness>;
  readonly espressoMode?: boolean;
}) {
  const [phase, setPhase] = useState(0);
  return (
    <BrewTimer
      recipe={espressoMode ? espressoRecipe : v60Recipe}
      isEspresso={espressoMode}
      isStartEnabled
      previewPhaseIndex={phase}
      onPreviewPhaseChange={setPhase}
      clock={h.clock}
      kitchenFactories={h.kitchenFactories}
    />
  );
}

const countdown = () => screen.getByTestId('brew-timer-countdown').textContent;
const total = () => screen.getByTestId('brew-timer-total').textContent;

describe('BrewTimer (variant B live panel)', () => {
  let h: ReturnType<typeof harness>;

  beforeEach(() => {
    h = harness();
  });

  it('idle: 00:00 total, full phase-1 countdown and Start visible, no dev fill scrubber', () => {
    render(<TimerUnderTest h={h} />);
    expect(total()).toBe('00:00');
    expect(countdown()).toBe('00:45');
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar extracción/i })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /reiniciar a 00:00/i })).not.toBeInTheDocument();
  });

  it('running: live clock, phase countdown, grams of the active pour and next step', async () => {
    render(<TimerUnderTest h={h} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /iniciar extracción/i }));
    });
    h.advance(37_000);
    expect(total()).toBe('00:37');
    expect(countdown()).toBe('00:08');
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pausar/i })).toBeInTheDocument();
    expect(screen.getByText('Pantalla activa')).toBeInTheDocument();

    h.advance(10_000); // into phase 2 (45-120 s)
    expect(screen.getByTestId('brew-timer-step-grams').textContent).toContain('+125');
    expect(screen.getByTestId('brew-timer-scale-grams').textContent).toContain('175');
    expect(screen.getByText(/siguiente/i).parentElement?.textContent).toContain('Segundo vertido');
  });

  it('flashes the instruction card and announces the new phase on transition', async () => {
    render(<TimerUnderTest h={h} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /iniciar extracción/i }));
    });
    h.advance(46_000);
    expect(screen.getByTestId('brew-timer-card').className).toContain('is-flash');
    expect(screen.getByText(/fase 2: primer vertido/i)).toBeInTheDocument();
    expect(h.played).toContain('phase_transition');
  });

  it('pause freezes the clock, shows Resume and releases the wake lock', async () => {
    render(<TimerUnderTest h={h} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /iniciar extracción/i }));
    });
    h.advance(70_000);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /pausar/i }));
    });
    expect(total()).toBe('01:10');
    h.advance(30_000);
    expect(total()).toBe('01:10');
    expect(screen.getByRole('button', { name: /reanudar/i })).toBeInTheDocument();
    expect(h.wakeCalls).toContain('release');
    expect(screen.queryByText('Pantalla activa')).not.toBeInTheDocument();
  });

  it('reset returns to 00:00 on phase 1', async () => {
    render(<TimerUnderTest h={h} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /iniciar extracción/i }));
    });
    h.advance(90_000);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /reiniciar a 00:00/i }));
    });
    expect(total()).toBe('00:00');
    expect(countdown()).toBe('00:45');
    expect(screen.getByRole('button', { name: /iniciar extracción/i })).toBeInTheDocument();
  });

  it('manual jump keeps running and moves to the next phase start', async () => {
    render(<TimerUnderTest h={h} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /iniciar extracción/i }));
    });
    h.advance(5_000);
    fireEvent.click(screen.getByRole('button', { name: /siguiente fase/i }));
    h.advance(200);
    expect(total()).toBe('00:45');
    expect(screen.getByRole('button', { name: /pausar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /fase anterior/i })).toBeEnabled();
  });

  it('completes at the total duration with the ready state and the restart action', async () => {
    render(<TimerUnderTest h={h} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /iniciar extracción/i }));
    });
    h.advance(250_000);
    expect(screen.getByText('Preparación lista')).toBeInTheDocument();
    expect(countdown()).toBe('03:30');
    expect(h.played).toContain('brew_completed');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /nueva preparación/i }));
    });
    expect(screen.getByRole('button', { name: /iniciar extracción/i })).toBeInTheDocument();
  });

  it('mute toggles aria-pressed, persists and silences cues', async () => {
    render(<TimerUnderTest h={h} />);
    const mute = screen.getByRole('button', { name: /silenciar alertas/i });
    expect(mute).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(mute);
    expect(screen.getByRole('button', { name: /activar sonido/i })).toHaveAttribute('aria-pressed', 'true');
    expect(h.store.getPreferences().muted).toBe(true);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /iniciar extracción/i }));
    });
    h.advance(46_000);
    expect(h.played).toHaveLength(0);
  });

  it('shows a discreet notice when Wake Lock is unsupported and keeps running', async () => {
    const hn = harness({ wakeSupported: false });
    render(<TimerUnderTest h={hn} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /iniciar extracción/i }));
    });
    hn.advance(3_000);
    expect(screen.getByText('La pantalla podría apagarse')).toBeInTheDocument();
    expect(total()).toBe('00:03');
  });

  it('espresso shows the cup target and dose instead of pour grams', () => {
    render(<TimerUnderTest h={h} espressoMode />);
    expect(screen.getByText('Objetivo en taza')).toBeInTheDocument();
    expect(screen.getByText('Dosis')).toBeInTheDocument();
    expect(screen.queryByText('Este paso')).not.toBeInTheDocument();
  });

  it('with reduced motion the flash still happens (colour only) and the panel flags it', async () => {
    const original = window.matchMedia;
    const reducedMatchMedia = (query: string): MediaQueryList => ({
      matches: query.includes('reduce'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    });
    window.matchMedia = reducedMatchMedia;
    try {
      render(<TimerUnderTest h={h} />);
      expect(screen.getByRole('complementary', { name: /temporizador/i })).toHaveAttribute('data-reduced-motion', 'true');
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /iniciar extracción/i }));
      });
      h.advance(46_000);
      expect(screen.getByTestId('brew-timer-card').className).toContain('is-flash');
    } finally {
      window.matchMedia = original;
    }
  });

  it('sweeps the progress rings every frame while running and freezes them on pause', async () => {
    render(<TimerUnderTest h={h} />);
    const phaseRing = () => Number(document.querySelector('.brew-timer-ring .is-phase')?.getAttribute('stroke-dashoffset'));
    const totalRing = () => Number(document.querySelector('.brew-timer-ring .is-total')?.getAttribute('stroke-dashoffset'));
    expect(phaseRing()).toBe(100);
    expect(totalRing()).toBe(100);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /iniciar extracción/i }));
    });
    h.advance(9_000); // 9 s of a 45 s bloom -> 20 %
    expect(phaseRing()).toBeCloseTo(80, 1);

    // 16 ms is below the 100 ms engine tick: no React publish, but the ring still moves.
    const before = phaseRing();
    const totalBefore = totalRing();
    h.advance(16);
    expect(phaseRing()).toBeLessThan(before);
    expect(totalRing()).toBeLessThan(totalBefore);

    fireEvent.click(screen.getByRole('button', { name: /pausar/i }));
    const frozen = phaseRing();
    h.advance(5_000);
    expect(phaseRing()).toBe(frozen);
  });

  it('idle dots and arrows move the preview phase instead of starting the timer', () => {
    render(<TimerUnderTest h={h} />);
    fireEvent.click(screen.getByRole('button', { name: /siguiente fase/i }));
    expect(countdown()).toBe('01:15');
    expect(screen.getByRole('button', { name: /iniciar extracción/i })).toBeInTheDocument();
  });
});

// Keep React import referenced for JSX transform consistency with the rest of the suite.
void React;
