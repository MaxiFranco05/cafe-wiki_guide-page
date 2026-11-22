export {
  createWakeLockAdapter,
  type WakeLockAdapter,
  type WakeLockAdapterDeps,
  type WakeLockDocumentLike,
  type WakeLockNavigatorLike,
  type WakeLockSentinelLike,
  type WakeLockStatus,
} from './wake-lock.adapter';

export {
  createWebAudioAdapter,
  type AudioContextConstructor,
  type AudioContextLike,
  type AudioParamLike,
  type GainNodeLike,
  type GainParamLike,
  type OscillatorNodeLike,
  type WebAudioAdapter,
  type WebAudioAdapterDeps,
} from './web-audio.adapter';

export {
  BrewMethodSlugSchema,
  DEFAULT_USER_PREFERENCES,
  MethodPreferenceConfigSchema,
  PREFERENCES_STORAGE_KEY,
  UserPreferencesSchema,
  createStorageAdapter,
  getSharedStorageAdapter,
  resetSharedStorageAdapter,
  type BrewMethodSlug,
  type MethodPreferenceConfig,
  type StorageAdapter,
  type StorageAdapterDeps,
  type StorageLike,
  type UserPreferences,
} from './storage.adapter';
