import { describe, expect, it } from 'vitest';
import { OriginVarietalsSchema } from '../../../domain/schemas';
import { getWikiEntryByCategoryAndSlug, WIKI_ORIGINS, WIKI_VARIETALS } from '../index';
import {
  ORIGIN_VARIETALS,
  getOriginsForVarietal,
  getVarietalsForOrigin,
} from '../origin-varietals';

describe('OriginVarietalsSchema', () => {
  it('accepts a map of origin slugs to non-empty unique varietal slug lists', () => {
    expect(OriginVarietalsSchema.safeParse({ kenya: ['sl28-sl34'], brazil: ['bourbon', 'catuai'] }).success).toBe(true);
  });

  it('rejects empty lists, duplicates and non kebab-case slugs', () => {
    expect(OriginVarietalsSchema.safeParse({ kenya: [] }).success).toBe(false);
    expect(OriginVarietalsSchema.safeParse({ kenya: ['bourbon', 'bourbon'] }).success).toBe(false);
    expect(OriginVarietalsSchema.safeParse({ Kenya: ['bourbon'] }).success).toBe(false);
    expect(OriginVarietalsSchema.safeParse({ kenya: ['SL 28'] }).success).toBe(false);
  });
});

describe('ORIGIN_VARIETALS catalog', () => {
  it('is valid against its schema', () => {
    expect(OriginVarietalsSchema.safeParse(ORIGIN_VARIETALS).success).toBe(true);
  });

  it('only references existing origins and varietals of the right category', () => {
    for (const [origin, varietals] of Object.entries(ORIGIN_VARIETALS)) {
      expect(getWikiEntryByCategoryAndSlug('origin', origin), origin).toBeDefined();
      for (const varietal of varietals) {
        expect(getWikiEntryByCategoryAndSlug('varietal', varietal), `${origin} -> ${varietal}`).toBeDefined();
      }
    }
  });

  it('covers every origin in the wiki', () => {
    for (const origin of WIKI_ORIGINS) {
      expect(ORIGIN_VARIETALS[origin.slug], origin.slug).toBeDefined();
    }
  });
});

describe('origin <-> varietal selectors', () => {
  it('returns the varietal entries of an origin in declared order', () => {
    expect(getVarietalsForOrigin('brazil').map((v) => v.slug)).toEqual(ORIGIN_VARIETALS.brazil);
  });

  it('derives the reverse direction from the same table', () => {
    const origins = getOriginsForVarietal('bourbon').map((o) => o.slug);
    expect(origins).toContain('brazil');
    expect(origins).toContain('rwanda');
    for (const slug of origins) {
      expect(ORIGIN_VARIETALS[slug]).toContain('bourbon');
    }
  });

  it('keeps both directions symmetric for every varietal', () => {
    for (const varietal of WIKI_VARIETALS) {
      for (const origin of getOriginsForVarietal(varietal.slug)) {
        expect(getVarietalsForOrigin(origin.slug).map((v) => v.slug)).toContain(varietal.slug);
      }
    }
  });

  it('returns empty lists for unknown slugs', () => {
    expect(getVarietalsForOrigin('atlantis')).toEqual([]);
    expect(getOriginsForVarietal('unicorn')).toEqual([]);
  });
});
