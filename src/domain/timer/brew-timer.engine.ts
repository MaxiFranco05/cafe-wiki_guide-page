import type { BrewPhase } from '../schemas';
import type { ScaledBrewPhase } from '../brewing';

export type BrewTimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export type BrewTimerEvent =
  | 'countdown_3'
  | 'countdown_2'
  | 'countdown_1'
  | 'phase_transition'
  | 'brew_completed';

export interface BrewTimerState<TPhase extends BrewPhase = ScaledBrewPhase> {
  readonly status: BrewTimerStatus;
  readonly phases: readonly TPhase[];
  readonly totalDurationSeconds: number;
  readonly startedAtMs: number | null;
  readonly accumulatedElapsedMs: number;
  readonly lastEvaluatedElapsedMs: number;
}

export interface BrewTimerSnapshot<TPhase extends BrewPhase = ScaledBrewPhase> {
  readonly status: BrewTimerStatus;
  readonly elapsedMs: number;
  readonly elapsedSeconds: number;
  readonly remainingTotalSeconds: number;
  readonly activePhaseIndex: number;
  readonly activePhase: TPhase;
  readonly nextPhase: TPhase | null;
  readonly remainingPhaseSeconds: number;
  readonly phaseProgress: number;
  readonly interpolatedLiquidLevel: number;
}

export interface BrewTimerTickResult<TPhase extends BrewPhase = ScaledBrewPhase> {
  readonly state: BrewTimerState<TPhase>;
  readonly snapshot: BrewTimerSnapshot<TPhase>;
  readonly events: readonly BrewTimerEvent[];
}

const COUNTDOWN_THRESHOLDS: readonly {
  readonly offsetSeconds: number;
  readonly event: 'countdown_1' | 'countdown_2' | 'countdown_3';
}[] = [
  { offsetSeconds: 1, event: 'countdown_1' },
  { offsetSeconds: 2, event: 'countdown_2' },
  { offsetSeconds: 3, event: 'countdown_3' },
];

function clampUnit(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
}

function clampElapsedMs(elapsedMs: number, totalDurationSeconds: number): number {
  const maxMs = Math.max(0, totalDurationSeconds * 1000);
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) {
    return 0;
  }
  if (elapsedMs >= maxMs) {
    return maxMs;
  }
  return elapsedMs;
}

function resolvePhaseIndex<TPhase extends BrewPhase>(
  phases: readonly TPhase[],
  elapsedSeconds: number,
): number {
  for (let i = 0; i < phases.length; i += 1) {
    const phase = phases[i];
    if (phase && elapsedSeconds < phase.endTimeSeconds) {
      return i;
    }
  }
  return phases.length - 1;
}

function detectDifferentialEvents<TPhase extends BrewPhase>(
  phases: readonly TPhase[],
  totalDurationSeconds: number,
  previousElapsedMs: number,
  currentElapsedMs: number,
): readonly BrewTimerEvent[] {
  if (currentElapsedMs <= previousElapsedMs) {
    return [];
  }

  const prevSeconds = previousElapsedMs / 1000;
  const currSeconds = currentElapsedMs / 1000;

  if (prevSeconds < totalDurationSeconds && currSeconds >= totalDurationSeconds) {
    return ['brew_completed'];
  }

  const prevPhaseIndex = resolvePhaseIndex(phases, prevSeconds);
  const currPhaseIndex = resolvePhaseIndex(phases, currSeconds);

  if (currPhaseIndex > prevPhaseIndex) {
    return ['phase_transition'];
  }

  const activePhase = phases[currPhaseIndex];
  if (!activePhase) {
    return [];
  }

  // Check from closest-to-end (1s) to earliest (3s) so a large jump emits only the latest active cue
  for (const { offsetSeconds, event } of COUNTDOWN_THRESHOLDS) {
    const thresholdSeconds = activePhase.endTimeSeconds - offsetSeconds;
    if (
      thresholdSeconds > activePhase.startTimeSeconds &&
      prevSeconds < thresholdSeconds &&
      currSeconds >= thresholdSeconds
    ) {
      return [event];
    }
  }

  return [];
}

/** Creates an idle immutable timer state for the given ordered recipe phases. */
export function createInitialTimerState<TPhase extends BrewPhase = ScaledBrewPhase>(
  phases: readonly TPhase[],
  totalDurationSeconds: number,
): BrewTimerState<TPhase> {
  if (phases.length === 0) {
    throw new Error('Brew timer requires at least one BrewPhase.');
  }
  const safeTotal =
    Number.isFinite(totalDurationSeconds) && totalDurationSeconds > 0
      ? totalDurationSeconds
      : (phases[phases.length - 1]?.endTimeSeconds ?? 1);

  return {
    status: 'idle',
    phases,
    totalDurationSeconds: safeTotal,
    startedAtMs: null,
    accumulatedElapsedMs: 0,
    lastEvaluatedElapsedMs: 0,
  };
}

/** Projects a pure read-only snapshot from the current timer state. */
export function getTimerSnapshot<TPhase extends BrewPhase = ScaledBrewPhase>(
  state: BrewTimerState<TPhase>,
): BrewTimerSnapshot<TPhase> {
  const elapsedMs = clampElapsedMs(state.lastEvaluatedElapsedMs, state.totalDurationSeconds);
  const elapsedSeconds = elapsedMs / 1000;
  const remainingTotalSeconds = Math.max(0, state.totalDurationSeconds - elapsedSeconds);

  const activePhaseIndex =
    state.status === 'completed'
      ? state.phases.length - 1
      : resolvePhaseIndex(state.phases, elapsedSeconds);
  const activePhase = state.phases[activePhaseIndex] ?? state.phases[0]!;
  const nextPhase =
    activePhaseIndex < state.phases.length - 1
      ? (state.phases[activePhaseIndex + 1] ?? null)
      : null;

  const phaseDuration = Math.max(0.001, activePhase.endTimeSeconds - activePhase.startTimeSeconds);
  const phaseProgress =
    state.status === 'completed'
      ? 1
      : clampUnit((elapsedSeconds - activePhase.startTimeSeconds) / phaseDuration);
  const remainingPhaseSeconds =
    state.status === 'completed'
      ? 0
      : Math.max(0, activePhase.endTimeSeconds - elapsedSeconds);

  const { liquidFillStartRatio, liquidFillEndRatio } = activePhase.svgDirective;
  const interpolatedLiquidLevel = clampUnit(
    liquidFillStartRatio + (liquidFillEndRatio - liquidFillStartRatio) * phaseProgress,
  );

  return {
    status: state.status,
    elapsedMs,
    elapsedSeconds,
    remainingTotalSeconds,
    activePhaseIndex,
    activePhase,
    nextPhase,
    remainingPhaseSeconds,
    phaseProgress,
    interpolatedLiquidLevel,
  };
}

/** Starts the timer from idle/paused (or restarts cleanly from 0 if already completed). */
export function startTimer<TPhase extends BrewPhase = ScaledBrewPhase>(
  state: BrewTimerState<TPhase>,
  nowMs: number,
): BrewTimerTickResult<TPhase> {
  if (state.status === 'running') {
    return tickTimer(state, nowMs);
  }

  const baseElapsedMs = state.status === 'completed' ? 0 : state.accumulatedElapsedMs;
  const nextState: BrewTimerState<TPhase> = {
    ...state,
    status: 'running',
    startedAtMs: nowMs,
    accumulatedElapsedMs: baseElapsedMs,
    lastEvaluatedElapsedMs: baseElapsedMs,
  };

  return {
    state: nextState,
    snapshot: getTimerSnapshot(nextState),
    events: [],
  };
}

/** Evaluates a monotonic clock pulse and returns updated state, snapshot, and crossed events. */
export function tickTimer<TPhase extends BrewPhase = ScaledBrewPhase>(
  state: BrewTimerState<TPhase>,
  nowMs: number,
): BrewTimerTickResult<TPhase> {
  if (state.status !== 'running' || state.startedAtMs === null) {
    return {
      state,
      snapshot: getTimerSnapshot(state),
      events: [],
    };
  }

  const deltaMs = Math.max(0, nowMs - state.startedAtMs);
  const rawElapsedMs = state.accumulatedElapsedMs + deltaMs;
  const currentElapsedMs = clampElapsedMs(rawElapsedMs, state.totalDurationSeconds);
  const safeElapsedMs = Math.max(state.lastEvaluatedElapsedMs, currentElapsedMs);

  const events = detectDifferentialEvents(
    state.phases,
    state.totalDurationSeconds,
    state.lastEvaluatedElapsedMs,
    safeElapsedMs,
  );

  const totalDurationMs = state.totalDurationSeconds * 1000;
  const isCompleted = safeElapsedMs >= totalDurationMs;

  const nextState: BrewTimerState<TPhase> = isCompleted
    ? {
        ...state,
        status: 'completed',
        startedAtMs: null,
        accumulatedElapsedMs: totalDurationMs,
        lastEvaluatedElapsedMs: totalDurationMs,
      }
    : {
        ...state,
        lastEvaluatedElapsedMs: safeElapsedMs,
      };

  return {
    state: nextState,
    snapshot: getTimerSnapshot(nextState),
    events,
  };
}

/** Pauses a running timer and freezes its exact monotonic elapsed duration. */
export function pauseTimer<TPhase extends BrewPhase = ScaledBrewPhase>(
  state: BrewTimerState<TPhase>,
  nowMs: number,
): BrewTimerTickResult<TPhase> {
  if (state.status !== 'running' || state.startedAtMs === null) {
    return {
      state,
      snapshot: getTimerSnapshot(state),
      events: [],
    };
  }

  const ticked = tickTimer(state, nowMs);
  if (ticked.state.status === 'completed') {
    return ticked;
  }

  const pausedState: BrewTimerState<TPhase> = {
    ...ticked.state,
    status: 'paused',
    startedAtMs: null,
    accumulatedElapsedMs: ticked.state.lastEvaluatedElapsedMs,
  };

  return {
    state: pausedState,
    snapshot: getTimerSnapshot(pausedState),
    events: ticked.events,
  };
}

/** Resumes a paused timer from its frozen elapsed duration using the new monotonic anchor. */
export function resumeTimer<TPhase extends BrewPhase = ScaledBrewPhase>(
  state: BrewTimerState<TPhase>,
  nowMs: number,
): BrewTimerTickResult<TPhase> {
  if (state.status !== 'paused') {
    return {
      state,
      snapshot: getTimerSnapshot(state),
      events: [],
    };
  }

  const resumedState: BrewTimerState<TPhase> = {
    ...state,
    status: 'running',
    startedAtMs: nowMs,
  };

  return {
    state: resumedState,
    snapshot: getTimerSnapshot(resumedState),
    events: [],
  };
}

/** Resets the timer back to idle at 00:00. */
export function resetTimer<TPhase extends BrewPhase = ScaledBrewPhase>(
  state: BrewTimerState<TPhase>,
): BrewTimerTickResult<TPhase> {
  const nextState = createInitialTimerState(state.phases, state.totalDurationSeconds);
  return {
    state: nextState,
    snapshot: getTimerSnapshot(nextState),
    events: [],
  };
}

/** Jumps manually to the start of a specific phase while preserving running/paused mode. */
export function jumpToPhase<TPhase extends BrewPhase = ScaledBrewPhase>(
  state: BrewTimerState<TPhase>,
  targetPhaseIndex: number,
  nowMs: number,
): BrewTimerTickResult<TPhase> {
  const boundedIndex = Math.max(0, Math.min(targetPhaseIndex, state.phases.length - 1));
  const targetPhase = state.phases[boundedIndex] ?? state.phases[0]!;
  const targetElapsedMs = clampElapsedMs(
    targetPhase.startTimeSeconds * 1000,
    state.totalDurationSeconds,
  );

  const nextStatus: BrewTimerStatus =
    state.status === 'completed' ? 'paused' : state.status;

  const nextState: BrewTimerState<TPhase> = {
    ...state,
    status: nextStatus,
    startedAtMs: nextStatus === 'running' ? nowMs : null,
    accumulatedElapsedMs: targetElapsedMs,
    lastEvaluatedElapsedMs: targetElapsedMs,
  };

  return {
    state: nextState,
    snapshot: getTimerSnapshot(nextState),
    events: [],
  };
}
