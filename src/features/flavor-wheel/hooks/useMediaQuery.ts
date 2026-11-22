import { useCallback, useSyncExternalStore } from 'react';

export const NARROW_QUERY = '(max-width: 767px)';
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function hasMatchMedia(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

/** Reactive `matchMedia`; false where the API is missing (SSR, older test environments). */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!hasMatchMedia()) return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(() => (hasMatchMedia() ? window.matchMedia(query).matches : false), [query]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
