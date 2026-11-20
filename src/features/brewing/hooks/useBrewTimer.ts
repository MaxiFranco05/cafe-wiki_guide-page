import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ScaledBrewPhase } from '../../../domain/brewing';
import {
  createInitialTimerState,
  getTimerSnapshot,
  jumpToPhase,
  pauseTimer,
  resumeTimer,
  startTimer,
  tickTimer,
  type BrewTimerSnapshot,
  type BrewTimerState,
  type BrewTimerStatus,
  type BrewTimerTickResult,
} from '../../../domain/timer';
import type { KitchenControls } from './useKitchenAdapters';

/** Monotonic clock + frame scheduler (injectable for deterministic tests). */
export interface BrewTimerClock {
  now(): number;
  requestFrame(callback: (time: number) => void): number;
  cancelFrame(id: number): void;
}

const browserClock: BrewTimerClock = {
  now: () => performance.now(),
  requestFrame: (callback) => window.requestAnimationFrame(callback),
  cancelFrame: (id) => window.cancelAnimationFrame(id),
};

/** Minimum interval between engine evaluations (RN-UX-01 / RN-UX-04). */
export const BREW_TIMER_TICK_MS = 100;
const PROGRESS_PUBLISH_STEP = 0.01;

export interface UseBrewTimerOptions {
  readonly phases: readonly ScaledBrewPhase[];
  readonly totalDurationSeconds: number;
  readonly kitchen: KitchenControls;
  readonly clock?: BrewTimerClock;
}

export interface BrewTimerController {
  readonly status: BrewTimerStatus;
  readonly snapshot: BrewTimerSnapshot<ScaledBrewPhase>;
  /** Increments on every phase change (automatic or manual) to drive the visual flash. */
  readonly flashKey: number;
  /** Starts from idle/completed or resumes from paused. Call inside the user gesture. */
  start(): void;
  pause(): void;
  reset(): void;
  jumpTo(phaseIndex: number): void;
  /**
   * Pure read of the engine at the current clock time, without publishing state or firing events.
   * Returns null unless running. Lets purely visual layers (the progress ring) animate per frame
   * without re-rendering React.
   */
  sample(): BrewTimerSnapshot<ScaledBrewPhase> | null;
  /** Clock in use, so visual layers schedule frames on the same (injectable) source. */
  readonly clock: BrewTimerClock;
}

function isObservableChange(
  prev: BrewTimerSnapshot<ScaledBrewPhase>,
  next: BrewTimerSnapshot<ScaledBrewPhase>,
): boolean {
  return (
    prev.status !== next.status ||
    prev.activePhaseIndex !== next.activePhaseIndex ||
    Math.floor(prev.elapsedSeconds) !== Math.floor(next.elapsedSeconds) ||
    Math.abs(prev.phaseProgress - next.phaseProgress) >= PROGRESS_PUBLISH_STEP
  );
}

/**
 * Connects the pure monotonic engine to React: a rAF loop throttled to 100 ms, snapshot
 * publication only on observable changes, and Kitchen Mode side effects for engine events.
 */
export function useBrewTimer({
  phases,
  totalDurationSeconds,
  kitchen,
  clock = browserClock,
}: UseBrewTimerOptions): BrewTimerController {
  const idleState = useMemo(
    () => createInitialTimerState(phases, totalDurationSeconds),
    [phases, totalDurationSeconds],
  );
  const engineRef = useRef<BrewTimerState<ScaledBrewPhase> | null>(null);
  const [snapshot, setSnapshot] = useState(() => getTimerSnapshot(idleState));
  const [flashKey, setFlashKey] = useState(0);
  const lastEvalRef = useRef(Number.NEGATIVE_INFINITY);
  const kitchenRef = useRef(kitchen);
  kitchenRef.current = kitchen;
  const clockRef = useRef(clock);
  clockRef.current = clock;

  const status: BrewTimerStatus = engineRef.current ? snapshot.status : 'idle';
  const visibleSnapshot = engineRef.current ? snapshot : getTimerSnapshot(idleState);

  const apply = useCallback((result: BrewTimerTickResult<ScaledBrewPhase>, force = false) => {
    const prevState = engineRef.current;
    engineRef.current = result.state;
    for (const event of result.events) {
      kitchenRef.current.playEvent(event);
    }
    if (result.events.includes('phase_transition')) {
      setFlashKey((key) => key + 1);
    }
    if (prevState?.status === 'running' && result.state.status === 'completed') {
      kitchenRef.current.disengage();
    }
    setSnapshot((prev) => (force || isObservableChange(prev, result.snapshot) ? result.snapshot : prev));
  }, []);

  // rAF loop only while running; elapsed time always comes from the monotonic delta.
  useEffect(() => {
    if (status !== 'running') return undefined;
    const activeClock = clockRef.current;
    let frameId = 0;
    let cancelled = false;

    const step = () => {
      if (cancelled) return;
      const now = activeClock.now();
      const engine = engineRef.current;
      if (engine && engine.status === 'running' && now - lastEvalRef.current >= BREW_TIMER_TICK_MS) {
        lastEvalRef.current = now;
        apply(tickTimer(engine, now));
      }
      if (engineRef.current?.status === 'running') {
        frameId = activeClock.requestFrame(step);
      }
    };

    frameId = activeClock.requestFrame(step);
    return () => {
      cancelled = true;
      activeClock.cancelFrame(frameId);
    };
  }, [status, apply]);

  const start = useCallback(() => {
    const now = clockRef.current.now();
    const engine = engineRef.current;
    kitchenRef.current.engage();
    lastEvalRef.current = now;
    if (engine && engine.status === 'paused') {
      apply(resumeTimer(engine, now), true);
      return;
    }
    apply(startTimer(createInitialTimerState(phases, totalDurationSeconds), now), true);
  }, [apply, phases, totalDurationSeconds]);

  const pause = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || engine.status !== 'running') return;
    apply(pauseTimer(engine, clockRef.current.now()), true);
    kitchenRef.current.disengage();
  }, [apply]);

  const reset = useCallback(() => {
    engineRef.current = null;
    kitchenRef.current.disengage();
    setSnapshot(getTimerSnapshot(idleState));
  }, [idleState]);

  const jumpTo = useCallback(
    (phaseIndex: number) => {
      const engine = engineRef.current;
      if (!engine) return;
      const now = clockRef.current.now();
      lastEvalRef.current = now;
      apply(jumpToPhase(engine, phaseIndex, now), true);
      setFlashKey((key) => key + 1);
    },
    [apply],
  );

  const sample = useCallback((): BrewTimerSnapshot<ScaledBrewPhase> | null => {
    const engine = engineRef.current;
    if (!engine || engine.status !== 'running') return null;
    return tickTimer(engine, clockRef.current.now()).snapshot;
  }, []);

  return { status, snapshot: visibleSnapshot, flashKey, start, pause, reset, jumpTo, sample, clock };
}
