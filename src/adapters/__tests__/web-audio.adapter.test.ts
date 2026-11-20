// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import {
  createWebAudioAdapter,
  type AudioContextLike,
  type GainNodeLike,
  type OscillatorNodeLike,
} from '../web-audio.adapter';

function createMockAudioContextFactory(options?: {
  initialState?: AudioContextState;
  failResume?: boolean;
}) {
  const createdOscillators: OscillatorNodeLike[] = [];
  const createdGains: GainNodeLike[] = [];
  let state: AudioContextState = options?.initialState ?? 'suspended';

  const resume = vi.fn(async () => {
    if (options?.failResume) {
      throw new Error('Autoplay policy blocked');
    }
    state = 'running';
  });

  const close = vi.fn(async () => {
    state = 'closed';
  });

  class MockAudioContext implements AudioContextLike {
    readonly currentTime = 1.0;
    readonly destination = {};

    get state(): AudioContextState {
      return state;
    }

    resume = resume;
    close = close;

    createOscillator(): OscillatorNodeLike {
      const osc: OscillatorNodeLike = {
        type: 'sine',
        frequency: {
          setValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      createdOscillators.push(osc);
      return osc;
    }

    createGain(): GainNodeLike {
      const gain: GainNodeLike = {
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };
      createdGains.push(gain);
      return gain;
    }
  }

  return {
    AudioContextCtor: MockAudioContext,
    createdOscillators,
    createdGains,
    resume,
    close,
  };
}

describe('WebAudioAdapter (RN-UX-03, SU-02)', () => {
  it('lazily creates and resumes a suspended AudioContext inside unlock()', async () => {
    const mock = createMockAudioContextFactory({ initialState: 'suspended' });
    const adapter = createWebAudioAdapter({ AudioContextCtor: mock.AudioContextCtor });

    expect(adapter.isSupported()).toBe(true);
    const unlocked = await adapter.unlock();
    expect(unlocked).toBe(true);
    expect(mock.resume).toHaveBeenCalledTimes(1);

    await adapter.dispose();
  });

  it('synthesizes distinct oscillator tone sequences for countdown, phase_transition, and brew_completed', async () => {
    const mock = createMockAudioContextFactory({ initialState: 'running' });
    const adapter = createWebAudioAdapter({ AudioContextCtor: mock.AudioContextCtor });
    await adapter.unlock();

    adapter.playEvent('countdown_3');
    expect(mock.createdOscillators).toHaveLength(1);
    expect(mock.createdOscillators[0]?.start).toHaveBeenCalledTimes(1);
    expect(mock.createdOscillators[0]?.stop).toHaveBeenCalledTimes(1);

    adapter.playEvent('phase_transition');
    expect(mock.createdOscillators).toHaveLength(3); // +2 tones

    adapter.playEvent('brew_completed');
    expect(mock.createdOscillators).toHaveLength(6); // +3 tones (C5-E5-G5 chord)

    await adapter.dispose();
  });

  it('suppresses synthesis completely when muted or when AudioContext is unsupported', async () => {
    const mock = createMockAudioContextFactory({ initialState: 'running' });
    const mutedAdapter = createWebAudioAdapter({
      AudioContextCtor: mock.AudioContextCtor,
      initialMuted: true,
    });
    expect(mutedAdapter.isMuted()).toBe(true);
    await mutedAdapter.unlock();
    mutedAdapter.playEvent('phase_transition');
    expect(mock.createdOscillators).toHaveLength(0);

    const unsupported = createWebAudioAdapter({ AudioContextCtor: undefined });
    expect(unsupported.isSupported()).toBe(false);
    await expect(unsupported.unlock()).resolves.toBe(false);
    expect(() => unsupported.playEvent('brew_completed')).not.toThrow();

    await mutedAdapter.dispose();
    await unsupported.dispose();
  });

  it('handles AudioContext.resume() rejections safely, toggles mute dynamically, and cleans up on dispose', async () => {
    const blockedMock = createMockAudioContextFactory({
      initialState: 'suspended',
      failResume: true,
    });
    const blockedAdapter = createWebAudioAdapter({ AudioContextCtor: blockedMock.AudioContextCtor });
    await expect(blockedAdapter.unlock()).resolves.toBe(false);
    expect(() => blockedAdapter.playEvent('countdown_1')).not.toThrow();
    await blockedAdapter.dispose();

    const liveMock = createMockAudioContextFactory({ initialState: 'running' });
    const adapter = createWebAudioAdapter({ AudioContextCtor: liveMock.AudioContextCtor });
    await adapter.unlock();

    adapter.setMuted(true);
    expect(adapter.isMuted()).toBe(true);
    adapter.playEvent('countdown_2');
    expect(liveMock.createdOscillators).toHaveLength(0);

    adapter.setMuted(false);
    expect(adapter.isMuted()).toBe(false);
    adapter.playEvent('countdown_1');
    expect(liveMock.createdOscillators).toHaveLength(1);

    await adapter.dispose();
    expect(liveMock.close).toHaveBeenCalledTimes(1);
    adapter.playEvent('brew_completed');
    expect(liveMock.createdOscillators).toHaveLength(1);
  });
});
