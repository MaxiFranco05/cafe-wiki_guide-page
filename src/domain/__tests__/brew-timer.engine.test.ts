// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { getMethodBySlug } from '../../data/methods';
import { calculateScaledRecipe } from '../brewing';
import type { BrewPhase } from '../schemas';
import {
  createInitialTimerState,
  getTimerSnapshot,
  jumpToPhase,
  pauseTimer,
  resetTimer,
  resumeTimer,
  startTimer,
  tickTimer,
} from '../timer';

const MOCK_PHASES: readonly BrewPhase[] = [
  {
    id: 'phase-bloom',
    order: 1,
    type: 'bloom',
    titleKey: 'methods.v60.phases.bloom.title',
    instructionKey: 'methods.v60.phases.bloom.instruction',
    startTimeSeconds: 0,
    endTimeSeconds: 45,
    waterShare: 0.2,
    svgDirective: {
      vesselType: 'cone_v60',
      pourStream: 'spiral',
      agitator: 'vessel_swirl',
      plungerState: 'none',
      liquidFillStartRatio: 0,
      liquidFillEndRatio: 0.2,
      coffeeBedTurbulence: 'bubbling_bloom',
    },
  },
  {
    id: 'phase-pour-1',
    order: 2,
    type: 'pour',
    titleKey: 'methods.v60.phases.pour1.title',
    instructionKey: 'methods.v60.phases.pour1.instruction',
    startTimeSeconds: 45,
    endTimeSeconds: 105,
    waterShare: 0.5,
    svgDirective: {
      vesselType: 'cone_v60',
      pourStream: 'steady',
      agitator: 'none',
      plungerState: 'none',
      liquidFillStartRatio: 0.2,
      liquidFillEndRatio: 0.8,
      coffeeBedTurbulence: 'active_slurry',
    },
  },
  {
    id: 'phase-drawdown',
    order: 3,
    type: 'drawdown',
    titleKey: 'methods.v60.phases.drawdown.title',
    instructionKey: 'methods.v60.phases.drawdown.instruction',
    startTimeSeconds: 105,
    endTimeSeconds: 180,
    waterShare: 0.3,
    svgDirective: {
      vesselType: 'cone_v60',
      pourStream: 'none',
      agitator: 'none',
      plungerState: 'none',
      liquidFillStartRatio: 0.8,
      liquidFillEndRatio: 1,
      coffeeBedTurbulence: 'settled',
    },
  },
];

describe('brew-timer.engine (RN-UX-01, RN-UX-03, RN-UX-04)', () => {
  it('computes drift-free elapsed time from monotonic timestamps after long suspension jumps', () => {
    const initial = createInitialTimerState(MOCK_PHASES, 180);
    expect(getTimerSnapshot(initial).status).toBe('idle');

    const started = startTimer(initial, 1000);
    expect(started.snapshot.status).toBe('running');
    expect(started.snapshot.elapsedSeconds).toBe(0);

    // Simulate 45 s background tab suspension in a single tick
    const afterJump = tickTimer(started.state, 46000);
    expect(afterJump.snapshot.elapsedSeconds).toBe(45);
    expect(afterJump.snapshot.remainingTotalSeconds).toBe(135);
    expect(afterJump.snapshot.activePhaseIndex).toBe(1);
    expect(afterJump.snapshot.activePhase.id).toBe('phase-pour-1');
  });

  it('preserves accumulated elapsed time across pause and resume cycles without drift', () => {
    const initial = createInitialTimerState(MOCK_PHASES, 180);
    const started = startTimer(initial, 0);
    const paused = pauseTimer(started.state, 15500);

    expect(paused.snapshot.status).toBe('paused');
    expect(paused.snapshot.elapsedMs).toBe(15500);
    expect(paused.snapshot.elapsedSeconds).toBeCloseTo(15.5, 4);

    // Ticking while paused must not advance elapsed time
    const tickedWhilePaused = tickTimer(paused.state, 50000);
    expect(tickedWhilePaused.snapshot.elapsedMs).toBe(15500);
    expect(tickedWhilePaused.events).toEqual([]);

    const resumed = resumeTimer(paused.state, 60000);
    const afterResumeTick = tickTimer(resumed.state, 70000);
    expect(afterResumeTick.snapshot.status).toBe('running');
    expect(afterResumeTick.snapshot.elapsedMs).toBe(25500);
    expect(afterResumeTick.snapshot.elapsedSeconds).toBeCloseTo(25.5, 4);
  });

  it('resolves activePhase, nextPhase, phaseProgress, and interpolatedLiquidLevel accurately', () => {
    const initial = createInitialTimerState(MOCK_PHASES, 180);
    const started = startTimer(initial, 0);

    // Midpoint of phase-pour-1 (45s..105s => 75s -> p = 0.5, fill 0.2..0.8 => 0.5)
    const midPour = tickTimer(started.state, 75000);
    expect(midPour.snapshot.activePhase.id).toBe('phase-pour-1');
    expect(midPour.snapshot.nextPhase?.id).toBe('phase-drawdown');
    expect(midPour.snapshot.phaseProgress).toBeCloseTo(0.5, 4);
    expect(midPour.snapshot.remainingPhaseSeconds).toBeCloseTo(30, 4);
    expect(midPour.snapshot.interpolatedLiquidLevel).toBeCloseTo(0.5, 4);

    // Completing recipe clamps elapsedSeconds to 180 and nextPhase to null
    const completed = tickTimer(midPour.state, 185000);
    expect(completed.snapshot.status).toBe('completed');
    expect(completed.snapshot.elapsedSeconds).toBe(180);
    expect(completed.snapshot.remainingTotalSeconds).toBe(0);
    expect(completed.snapshot.activePhaseIndex).toBe(2);
    expect(completed.snapshot.nextPhase).toBeNull();
    expect(completed.snapshot.phaseProgress).toBe(1);
    expect(completed.snapshot.interpolatedLiquidLevel).toBeCloseTo(1, 4);
    expect(completed.events).toContain('brew_completed');
  });

  it('supports manual jumpToPhase preserving running/paused status and resets cleanly', () => {
    const initial = createInitialTimerState(MOCK_PHASES, 180);
    const started = startTimer(initial, 1000);
    const jumped = jumpToPhase(started.state, 2, 5000);

    expect(jumped.snapshot.status).toBe('running');
    expect(jumped.snapshot.activePhaseIndex).toBe(2);
    expect(jumped.snapshot.elapsedSeconds).toBe(105);
    expect(jumped.snapshot.phaseProgress).toBe(0);

    const paused = pauseTimer(jumped.state, 10000);
    const jumpedBack = jumpToPhase(paused.state, 1, 12000);
    expect(jumpedBack.snapshot.status).toBe('paused');
    expect(jumpedBack.snapshot.activePhaseIndex).toBe(1);
    expect(jumpedBack.snapshot.elapsedSeconds).toBe(45);

    const reset = resetTimer(jumpedBack.state);
    expect(reset.snapshot.status).toBe('idle');
    expect(reset.snapshot.elapsedSeconds).toBe(0);
    expect(reset.snapshot.activePhaseIndex).toBe(0);
  });

  it('emits countdown_3, countdown_2, countdown_1, phase_transition, and brew_completed exactly once without duplicates', () => {
    const initial = createInitialTimerState(MOCK_PHASES, 180);
    let state = startTimer(initial, 0).state;

    // 41.9s -> no countdown yet
    let res = tickTimer(state, 41900);
    expect(res.events).toEqual([]);
    state = res.state;

    // 42.05s crosses 42s (3s before 45s) -> emits countdown_3 once
    res = tickTimer(state, 42050);
    expect(res.events).toEqual(['countdown_3']);
    state = res.state;

    // 42.15s and 42.85s -> no duplicate countdown_3
    res = tickTimer(state, 42150);
    expect(res.events).toEqual([]);
    state = res.state;

    res = tickTimer(state, 42850);
    expect(res.events).toEqual([]);
    state = res.state;

    // 43.02s -> countdown_2
    res = tickTimer(state, 43020);
    expect(res.events).toEqual(['countdown_2']);
    state = res.state;

    // 44.01s -> countdown_1
    res = tickTimer(state, 44010);
    expect(res.events).toEqual(['countdown_1']);
    state = res.state;

    // 45.00s -> phase_transition
    res = tickTimer(state, 45000);
    expect(res.events).toEqual(['phase_transition']);
    expect(res.snapshot.activePhaseIndex).toBe(1);
    state = res.state;

    // Final completion at 180s
    res = tickTimer(state, 180000);
    expect(res.events).toEqual(['brew_completed']);
  });

  it('handles repeated timestamps, backward nowMs, multi-phase jumps, and restart from completed', () => {
    expect(() => createInitialTimerState([], 60)).toThrow();

    const initial = createInitialTimerState(MOCK_PHASES, 180);
    const started = startTimer(initial, 10000);

    // Backward timestamp must clamp delta to 0 without going negative
    const backward = tickTimer(started.state, 5000);
    expect(backward.snapshot.elapsedMs).toBe(0);
    expect(backward.events).toEqual([]);

    // Repeated timestamp is idempotent
    const tick1 = tickTimer(started.state, 52050);
    expect(tick1.events).toEqual(['countdown_3']);
    const tickSame = tickTimer(tick1.state, 52050);
    expect(tickSame.events).toEqual([]);

    // Big jump across phase 1 -> phase 2 emits a single phase_transition (no stale burst)
    const multiJump = tickTimer(tickSame.state, 130000);
    expect(multiJump.snapshot.activePhaseIndex).toBe(2);
    expect(multiJump.events).toEqual(['phase_transition']);

    // Complete then restart cleanly via startTimer
    const finished = tickTimer(multiJump.state, 200000);
    expect(finished.snapshot.status).toBe('completed');
    const restarted = startTimer(finished.state, 210000);
    expect(restarted.snapshot.status).toBe('running');
    expect(restarted.snapshot.elapsedMs).toBe(0);
    expect(restarted.snapshot.activePhaseIndex).toBe(0);
  });

  it('executes cleanly across real scaled recipes from METHODS_CATALOG (v60, french-press, espresso)', () => {
    for (const slug of ['v60', 'french-press', 'espresso'] as const) {
      const method = getMethodBySlug(slug);
      expect(method).toBeDefined();
      if (!method) continue;

      const defaultProfile = method.profiles[0]!;
      const scaled = calculateScaledRecipe(method, defaultProfile.id, {
        coffeeGrams: method.defaultDoseGrams,
      });

      const init = createInitialTimerState(scaled.phases, scaled.totalDurationSeconds);
      const started = startTimer(init, 0);
      const mid = tickTimer(started.state, (scaled.totalDurationSeconds * 1000) / 2);
      const done = tickTimer(mid.state, scaled.totalDurationSeconds * 1000);

      expect(mid.snapshot.phaseProgress).toBeGreaterThanOrEqual(0);
      expect(mid.snapshot.phaseProgress).toBeLessThanOrEqual(1);
      expect(done.snapshot.status).toBe('completed');
      expect(done.events).toEqual(['brew_completed']);
    }
  });
});
