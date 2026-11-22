import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { calculateScaledRecipe } from '../../../domain/brewing';
import { getMethodBySlug } from '../../../data/methods';
import type { BrewTimerEvent } from '../../../domain/timer';
import type { KitchenControls } from '../hooks/useKitchenAdapters';
import { useBrewTimer, type BrewTimerClock } from '../hooks/useBrewTimer';

const v60 = getMethodBySlug('v60')!;
const recipe = calculateScaledRecipe(v60, 'normal', { coffeeGrams: 15 });
// V60 normal @15 g: 0-45 bloom, 45-120 pour1, 120-165 pour2, 165-210 drawdown

function fakeClock() {
  let nowMs = 1000;
  let nextId = 1;
  const frames = new Map<number, (t: number) => void>();
  const clock: BrewTimerClock = {
    now: () => nowMs,
    requestFrame: (cb) => {
      const id = nextId++;
      frames.set(id, cb);
      return id;
    },
    cancelFrame: (id) => void frames.delete(id),
  };
  return {
    clock,
    /** Advances the monotonic clock and runs one pending animation frame. */
    advance(ms: number) {
      nowMs += ms;
      const pending = [...frames.entries()];
      frames.clear();
      pending.forEach(([, cb]) => cb(nowMs));
    },
    pendingFrames: () => frames.size,
  };
}

function fakeKitchen() {
  const events: BrewTimerEvent[] = [];
  const calls: string[] = [];
  const kitchen: KitchenControls = {
    muted: false,
    wakeLockSupported: true,
    wakeLockActive: false,
    engage: vi.fn(() => calls.push('engage')),
    disengage: vi.fn(() => calls.push('disengage')),
    toggleMute: vi.fn(),
    playEvent: vi.fn((e) => events.push(e)),
  };
  return { kitchen, events, calls };
}

describe('useBrewTimer', () => {
  let c: ReturnType<typeof fakeClock>;
  let k: ReturnType<typeof fakeKitchen>;

  beforeEach(() => {
    c = fakeClock();
    k = fakeKitchen();
  });

  const setup = () =>
    renderHook(() =>
      useBrewTimer({ phases: recipe.phases, totalDurationSeconds: recipe.totalDurationSeconds, kitchen: k.kitchen, clock: c.clock }),
    );

  it('starts idle at 00:00 on phase 1 with the full phase remaining', () => {
    const { result } = setup();
    expect(result.current.status).toBe('idle');
    expect(result.current.snapshot.elapsedSeconds).toBe(0);
    expect(result.current.snapshot.activePhaseIndex).toBe(0);
    expect(result.current.snapshot.remainingPhaseSeconds).toBe(45);
  });

  it('start engages kitchen mode in the gesture and advances by monotonic delta', () => {
    const { result } = setup();
    act(() => result.current.start());
    expect(result.current.status).toBe('running');
    expect(k.calls).toEqual(['engage']);

    act(() => c.advance(37_000));
    expect(Math.floor(result.current.snapshot.elapsedSeconds)).toBe(37);
    expect(Math.ceil(result.current.snapshot.remainingPhaseSeconds)).toBe(8);
  });

  it('recovers a 20 s background gap in a single frame (no drift)', () => {
    const { result } = setup();
    act(() => result.current.start());
    act(() => c.advance(5_000));
    act(() => c.advance(20_000));
    expect(Math.floor(result.current.snapshot.elapsedSeconds)).toBe(25);
  });

  it('throttles evaluations to at most one per 100 ms', () => {
    const { result } = setup();
    act(() => result.current.start());
    // Last evaluation lands at 41.95 s, just before the countdown_3 cue (42 s).
    act(() => c.advance(41_950));
    expect(k.events).not.toContain('countdown_3');
    // 80 ms later the threshold is crossed in wall time, but no evaluation is allowed yet.
    act(() => c.advance(80));
    expect(k.events).not.toContain('countdown_3');
    // Once 100 ms have elapsed since the last evaluation, the engine ticks and emits the cue.
    act(() => c.advance(30));
    expect(k.events).toContain('countdown_3');
    expect(Math.floor(result.current.snapshot.elapsedSeconds)).toBe(42);
  });

  it('pauses with a frozen clock and resumes from the same point', () => {
    const { result } = setup();
    act(() => result.current.start());
    act(() => c.advance(70_000));
    act(() => result.current.pause());
    expect(result.current.status).toBe('paused');
    expect(k.calls).toEqual(['engage', 'disengage']);
    const frozen = Math.floor(result.current.snapshot.elapsedSeconds);
    act(() => c.advance(30_000));
    expect(Math.floor(result.current.snapshot.elapsedSeconds)).toBe(frozen);
    act(() => result.current.start());
    expect(result.current.status).toBe('running');
    act(() => c.advance(1_000));
    expect(Math.floor(result.current.snapshot.elapsedSeconds)).toBe(frozen + 1);
  });

  it('plays engine events and bumps flashKey on phase transitions', () => {
    const { result } = setup();
    act(() => result.current.start());
    act(() => c.advance(42_000));
    expect(k.events).toContain('countdown_3');
    const flash = result.current.flashKey;
    act(() => c.advance(4_000));
    expect(k.events).toContain('phase_transition');
    expect(result.current.snapshot.activePhaseIndex).toBe(1);
    expect(result.current.flashKey).toBe(flash + 1);
  });

  it('jumps to a phase keeping the running state, without sound but with a flash', () => {
    const { result } = setup();
    act(() => result.current.start());
    act(() => c.advance(50_000));
    const flash = result.current.flashKey;
    const eventsBefore = k.events.length;
    act(() => result.current.jumpTo(2));
    expect(result.current.status).toBe('running');
    expect(result.current.snapshot.elapsedSeconds).toBe(120);
    expect(result.current.flashKey).toBe(flash + 1);
    expect(k.events.length).toBe(eventsBefore);
  });

  it('completes at the total duration, releases kitchen mode and plays the final chord', () => {
    const { result } = setup();
    act(() => result.current.start());
    act(() => c.advance(250_000));
    expect(result.current.status).toBe('completed');
    expect(result.current.snapshot.elapsedSeconds).toBe(210);
    expect(k.events).toContain('brew_completed');
    expect(k.calls.at(-1)).toBe('disengage');
    expect(c.pendingFrames()).toBe(0);
  });

  it('reset returns to idle at 00:00 and releases kitchen mode', () => {
    const { result } = setup();
    act(() => result.current.start());
    act(() => c.advance(80_000));
    act(() => result.current.reset());
    expect(result.current.status).toBe('idle');
    expect(result.current.snapshot.elapsedSeconds).toBe(0);
    expect(result.current.snapshot.activePhaseIndex).toBe(0);
    expect(k.calls.at(-1)).toBe('disengage');
  });

  it('start after completion begins a fresh run from 00:00', () => {
    const { result } = setup();
    act(() => result.current.start());
    act(() => c.advance(250_000));
    act(() => result.current.start());
    expect(result.current.status).toBe('running');
    act(() => c.advance(2_000));
    expect(Math.floor(result.current.snapshot.elapsedSeconds)).toBe(2);
  });

  it('stops scheduling frames when unmounted', () => {
    const { result, unmount } = setup();
    act(() => result.current.start());
    unmount();
    expect(c.pendingFrames()).toBe(0);
  });
});
