import { describe, expect, it } from 'vitest';
import { getWikiEntriesByFlavorNode } from '../../../data/wiki';
import { summarizeWikiPresence } from '../utils/wiki-presence';

describe('summarizeWikiPresence', () => {
  it('counts Mora as 1 origin and 1 varietal', () => {
    const summary = summarizeWikiPresence(getWikiEntriesByFlavorNode('fruity.berry.blackberry'));
    expect(summary.total).toBe(2);
    expect(summary.byCategory).toEqual([
      { category: 'origin', count: 1 },
      { category: 'varietal', count: 1 },
    ]);
  });

  it('returns zero and no groups for a flavor without entries', () => {
    expect(summarizeWikiPresence(getWikiEntriesByFlavorNode('roasted.burnt'))).toEqual({ total: 0, byCategory: [] });
  });

  it('matches the number of listed entries for a whole family', () => {
    const entries = getWikiEntriesByFlavorNode('fruity');
    const summary = summarizeWikiPresence(entries);
    expect(summary.total).toBe(entries.length);
    expect(summary.byCategory.reduce((sum, g) => sum + g.count, 0)).toBe(entries.length);
    expect(summary.byCategory.map((g) => g.category)).toEqual(['origin', 'varietal', 'process']);
  });
});
