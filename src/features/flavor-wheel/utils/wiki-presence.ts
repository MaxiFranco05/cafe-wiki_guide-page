import type { WikiCategory, WikiEntry } from '../../../domain/schemas';

export const PRESENCE_CATEGORY_ORDER: readonly WikiCategory[] = ['origin', 'varietal', 'process'];

export interface WikiPresence {
  readonly total: number;
  /** Categories with at least one entry, in Orígenes → Varietales → Procesos order. */
  readonly byCategory: readonly { readonly category: WikiCategory; readonly count: number }[];
}

/** Counts the given entries per category; callers pass the same list they render. */
export function summarizeWikiPresence(entries: readonly WikiEntry[]): WikiPresence {
  const byCategory = PRESENCE_CATEGORY_ORDER.map((category) => ({
    category,
    count: entries.filter((entry) => entry.category === category).length,
  })).filter((group) => group.count > 0);
  return { total: entries.length, byCategory };
}
