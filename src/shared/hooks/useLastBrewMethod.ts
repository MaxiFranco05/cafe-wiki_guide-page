import { useSyncExternalStore } from 'react';
import {
  BrewMethodSlugSchema,
  createStorageAdapter,
  type BrewMethodSlug,
  type StorageAdapter,
} from '../../adapters';

export const DEFAULT_BREW_METHOD_SLUG: BrewMethodSlug = 'v60';

let adapter: StorageAdapter | null = null;
let current: BrewMethodSlug | null = null;
const listeners = new Set<() => void>();

function getAdapter(): StorageAdapter {
  if (adapter === null) {
    adapter = createStorageAdapter();
  }
  return adapter;
}

/** Returns the last brew method the user visited (validated), or `v60`. */
export function readLastBrewMethod(): BrewMethodSlug {
  if (current === null) {
    const parsed = BrewMethodSlugSchema.safeParse(getAdapter().getPreferences().lastSelectedMethodSlug);
    current = parsed.success ? parsed.data : DEFAULT_BREW_METHOD_SLUG;
  }
  return current;
}

/** Persists a visited brew method slug; unknown slugs are ignored. */
export function rememberBrewMethod(slug: string): void {
  const parsed = BrewMethodSlugSchema.safeParse(slug);
  if (!parsed.success || parsed.data === readLastBrewMethod()) {
    return;
  }
  current = parsed.data;
  getAdapter().updatePreferences({ lastSelectedMethodSlug: parsed.data });
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Reactive last-method slug shared by navigation and the brew station. */
export function useLastBrewMethod(): BrewMethodSlug {
  return useSyncExternalStore(subscribe, readLastBrewMethod, () => DEFAULT_BREW_METHOD_SLUG);
}

/** Clears the in-memory cache (tests) and optionally injects a storage adapter. */
export function resetLastBrewMethodStore(storageAdapter?: StorageAdapter): void {
  adapter = storageAdapter ?? null;
  current = null;
}
