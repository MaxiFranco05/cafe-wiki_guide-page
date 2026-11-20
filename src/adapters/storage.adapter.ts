import { z } from 'zod';

export const PREFERENCES_STORAGE_KEY = 'cafeteria-wiki:preferences:v1';

export const BrewMethodSlugSchema = z.enum([
  'v60',
  'chemex',
  'melitta',
  'aeropress',
  'french-press',
  'espresso',
]);

export type BrewMethodSlug = z.infer<typeof BrewMethodSlugSchema>;

export const MethodPreferenceConfigSchema = z.object({
  coffeeGrams: z.number().positive(),
  waterMl: z.number().positive().optional(),
  profileId: z.enum(['light', 'normal', 'strong', 'ristretto', 'normale', 'lungo']),
});

export type MethodPreferenceConfig = z.infer<typeof MethodPreferenceConfigSchema>;

export const UserPreferencesSchema = z.object({
  muted: z.boolean(),
  theme: z.enum(['dark']),
  lastSelectedMethodSlug: BrewMethodSlugSchema.optional(),
  methodConfigs: z.record(z.string(), MethodPreferenceConfigSchema),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  muted: false,
  theme: 'dark',
  methodConfigs: {},
};

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StorageAdapterDeps {
  readonly storage?: StorageLike;
  readonly storageKey?: string;
}

export interface StorageAdapter {
  getPreferences(): UserPreferences;
  savePreferences(next: UserPreferences): UserPreferences;
  updatePreferences(partial: Partial<Omit<UserPreferences, 'methodConfigs'>>): UserPreferences;
  setMethodConfig(slug: BrewMethodSlug, config: MethodPreferenceConfig): UserPreferences;
  clearPreferences(): UserPreferences;
}

function resolveDefaultStorage(): StorageLike | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function readValidatedFromStorage(
  storage: StorageLike | undefined,
  key: string,
): UserPreferences | null {
  if (!storage) {
    return null;
  }
  try {
    const raw = storage.getItem(key);
    if (raw === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    const result = UserPreferencesSchema.safeParse(parsed);
    if (!result.success) {
      return null;
    }
    return structuredClone(result.data);
  } catch {
    return null;
  }
}

/**
 * Zod-validated localStorage adapter for kitchen preferences with isolated
 * `structuredClone()` in-memory fallback on QuotaExceededError / SecurityError.
 */
export function createStorageAdapter(deps?: StorageAdapterDeps): StorageAdapter {
  const storage = deps && 'storage' in deps ? deps.storage : resolveDefaultStorage();
  const storageKey = deps?.storageKey ?? PREFERENCES_STORAGE_KEY;

  let memoryMirror: UserPreferences =
    readValidatedFromStorage(storage, storageKey) ?? structuredClone(DEFAULT_USER_PREFERENCES);

  const persist = (candidate: UserPreferences): UserPreferences => {
    const parsed = UserPreferencesSchema.safeParse(candidate);
    const valid = parsed.success ? parsed.data : structuredClone(DEFAULT_USER_PREFERENCES);
    memoryMirror = structuredClone(valid);

    if (storage) {
      try {
        storage.setItem(storageKey, JSON.stringify(memoryMirror));
      } catch {
        // QuotaExceededError or SecurityError: retain valid state in memoryMirror
      }
    }

    return structuredClone(memoryMirror);
  };

  return {
    getPreferences(): UserPreferences {
      return structuredClone(memoryMirror);
    },

    savePreferences(next: UserPreferences): UserPreferences {
      return persist(next);
    },

    updatePreferences(partial: Partial<Omit<UserPreferences, 'methodConfigs'>>): UserPreferences {
      return persist({
        ...memoryMirror,
        ...partial,
        methodConfigs: structuredClone(memoryMirror.methodConfigs),
      });
    },

    setMethodConfig(slug: BrewMethodSlug, config: MethodPreferenceConfig): UserPreferences {
      return persist({
        ...memoryMirror,
        methodConfigs: {
          ...structuredClone(memoryMirror.methodConfigs),
          [slug]: structuredClone(config),
        },
      });
    },

    clearPreferences(): UserPreferences {
      memoryMirror = structuredClone(DEFAULT_USER_PREFERENCES);
      if (storage) {
        try {
          storage.removeItem(storageKey);
        } catch {
          // Ignore removeItem failure in restricted environments
        }
      }
      return structuredClone(memoryMirror);
    },
  };
}
