import type { BrewTimerEvent } from '../domain/timer';

export interface AudioParamLike {
  setValueAtTime(value: number, startTime: number): void;
}

export interface GainParamLike extends AudioParamLike {
  linearRampToValueAtTime(value: number, endTime: number): void;
  exponentialRampToValueAtTime(value: number, endTime: number): void;
}

export interface OscillatorNodeLike {
  type: OscillatorType;
  readonly frequency: AudioParamLike;
  connect(destination: unknown): void;
  start(when?: number): void;
  stop(when?: number): void;
}

export interface GainNodeLike {
  readonly gain: GainParamLike;
  connect(destination: unknown): void;
}

export interface AudioContextLike {
  readonly state: AudioContextState;
  readonly currentTime: number;
  readonly destination: unknown;
  resume(): Promise<void>;
  close(): Promise<void>;
  createOscillator(): OscillatorNodeLike;
  createGain(): GainNodeLike;
}

export type AudioContextConstructor = new () => AudioContextLike;

export interface WebAudioAdapterDeps {
  readonly AudioContextCtor?: AudioContextConstructor;
  readonly initialMuted?: boolean;
}

export interface WebAudioAdapter {
  isSupported(): boolean;
  isMuted(): boolean;
  setMuted(muted: boolean): void;
  unlock(): Promise<boolean>;
  playEvent(event: BrewTimerEvent): void;
  dispose(): Promise<void>;
}

interface ToneSpec {
  readonly frequencyHz: number;
  readonly offsetSeconds: number;
  readonly durationSeconds: number;
  readonly gainPeak: number;
  readonly waveType: OscillatorType;
}

const EVENT_TONE_SEQUENCES: Readonly<Record<BrewTimerEvent, readonly ToneSpec[]>> = {
  countdown_3: [
    { frequencyHz: 880, offsetSeconds: 0, durationSeconds: 0.09, gainPeak: 0.14, waveType: 'sine' },
  ],
  countdown_2: [
    { frequencyHz: 880, offsetSeconds: 0, durationSeconds: 0.09, gainPeak: 0.14, waveType: 'sine' },
  ],
  countdown_1: [
    { frequencyHz: 987.77, offsetSeconds: 0, durationSeconds: 0.11, gainPeak: 0.16, waveType: 'sine' },
  ],
  phase_transition: [
    { frequencyHz: 587.33, offsetSeconds: 0, durationSeconds: 0.11, gainPeak: 0.18, waveType: 'triangle' },
    { frequencyHz: 880, offsetSeconds: 0.11, durationSeconds: 0.16, gainPeak: 0.2, waveType: 'sine' },
  ],
  brew_completed: [
    { frequencyHz: 523.25, offsetSeconds: 0, durationSeconds: 0.14, gainPeak: 0.18, waveType: 'triangle' },
    { frequencyHz: 659.25, offsetSeconds: 0.12, durationSeconds: 0.16, gainPeak: 0.2, waveType: 'sine' },
    { frequencyHz: 783.99, offsetSeconds: 0.24, durationSeconds: 0.24, gainPeak: 0.22, waveType: 'sine' },
  ],
};

function resolveDefaultAudioContextCtor(): AudioContextConstructor | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const win = window as Window & {
    readonly AudioContext?: AudioContextConstructor;
    readonly webkitAudioContext?: AudioContextConstructor;
  };
  return win.AudioContext ?? win.webkitAudioContext;
}

/**
 * Procedural Web Audio API synthesizer for kitchen brew alerts (RN-UX-03).
 * Uses native oscillators with click-free gain envelopes and zero external audio assets.
 */
export function createWebAudioAdapter(deps?: WebAudioAdapterDeps): WebAudioAdapter {
  const AudioContextCtor =
    deps && 'AudioContextCtor' in deps
      ? deps.AudioContextCtor
      : resolveDefaultAudioContextCtor();
  const supported = typeof AudioContextCtor === 'function';

  let ctx: AudioContextLike | null = null;
  let muted = deps?.initialMuted ?? false;
  let disposed = false;

  const ensureContext = (): AudioContextLike | null => {
    if (!supported || !AudioContextCtor || disposed) {
      return null;
    }
    if (!ctx || ctx.state === 'closed') {
      try {
        ctx = new AudioContextCtor();
      } catch {
        ctx = null;
        return null;
      }
    }
    return ctx;
  };

  const scheduleTone = (audioCtx: AudioContextLike, tone: ToneSpec) => {
    const startTime = audioCtx.currentTime + tone.offsetSeconds;
    const attackEnd = startTime + Math.min(0.015, tone.durationSeconds * 0.25);
    const stopTime = startTime + tone.durationSeconds;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = tone.waveType;
    osc.frequency.setValueAtTime(tone.frequencyHz, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(tone.gainPeak, attackEnd);
    gain.gain.exponentialRampToValueAtTime(0.001, stopTime);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(stopTime);
  };

  return {
    isSupported(): boolean {
      return supported;
    },

    isMuted(): boolean {
      return muted;
    },

    setMuted(nextMuted: boolean): void {
      muted = nextMuted;
    },

    async unlock(): Promise<boolean> {
      const audioCtx = ensureContext();
      if (!audioCtx) {
        return false;
      }
      if (audioCtx.state === 'suspended') {
        try {
          await audioCtx.resume();
        } catch {
          return false;
        }
      }
      return audioCtx.state === 'running';
    },

    playEvent(event: BrewTimerEvent): void {
      if (muted || disposed) {
        return;
      }
      const audioCtx = ensureContext();
      if (!audioCtx) {
        return;
      }
      if (audioCtx.state === 'suspended') {
        void audioCtx.resume().catch(() => undefined);
      }
      try {
        for (const tone of EVENT_TONE_SEQUENCES[event]) {
          scheduleTone(audioCtx, tone);
        }
      } catch {
        // Silent degradation if audio graph is blocked by OS
      }
    },

    async dispose(): Promise<void> {
      disposed = true;
      const current = ctx;
      ctx = null;
      if (current && current.state !== 'closed') {
        try {
          await current.close();
        } catch {
          // Ignore close errors during teardown
        }
      }
    },
  };
}
