import { describe, expect, it } from 'vitest';
import {
  WIKI_SECTIONS,
  WIKI_SECTION_SLUGS,
  filterWikiItems,
  getWikiItem,
  getWikiSection,
  groupWikiItems,
  isWikiSectionSlug,
} from '../sections';

const NO_FILTERS = { q: '', grupo: '', perfil: [], familia: '' } as const;

describe('wiki section registry', () => {
  it('declares the five sections in order with their entry counts', () => {
    expect(WIKI_SECTION_SLUGS).toEqual(['origenes', 'varietales', 'procesos', 'cafeteras', 'bebidas']);
    expect(WIKI_SECTIONS.map((s) => s.items.length)).toEqual([16, 16, 6, 10, 12]);
  });

  it('validates section slugs', () => {
    expect(isWikiSectionSlug('origenes')).toBe(true);
    expect(isWikiSectionSlug('granos')).toBe(false);
    expect(getWikiSection('granos')).toBeUndefined();
  });

  it('resolves an entry only inside its own section', () => {
    expect(getWikiItem('origenes', 'kenya')?.title).toBe('Kenia');
    expect(getWikiItem('procesos', 'kenya')).toBeUndefined();
    expect(getWikiItem('granos', 'kenya')).toBeUndefined();
    expect(getWikiItem('cafeteras', 'v60')?.kind).toBe('brewer');
    expect(getWikiItem('bebidas', 'cappuccino')?.kind).toBe('drink');
  });

  it('groups items in catalog subgroup order with localized labels', () => {
    const groups = groupWikiItems('origenes', getWikiSection('origenes')!.items);
    expect(groups[0]).toMatchObject({ id: 'south_america', label: 'Sudamérica' });
    expect(groups.reduce((n, g) => n + g.items.length, 0)).toBe(16);
  });
});

describe('filterWikiItems', () => {
  it('searches without accents and only inside the section', () => {
    expect(filterWikiItems('origenes', { ...NO_FILTERS, q: 'etiopia' }).map((i) => i.slug)).toContain('ethiopia');
    // Panamá mentions Geisha in its summary, but the varietal entry itself never leaks into Orígenes.
    const inOrigins = filterWikiItems('origenes', { ...NO_FILTERS, q: 'geisha' });
    expect(inOrigins.map((i) => i.slug)).not.toContain('geisha');
    expect(inOrigins.every((i) => i.section === 'origenes')).toBe(true);
    expect(filterWikiItems('varietales', { ...NO_FILTERS, q: 'geisha' }).map((i) => i.slug)).toContain('geisha');
  });

  it('matches tasting notes in the search', () => {
    const results = filterWikiItems('origenes', { ...NO_FILTERS, q: 'mora' });
    expect(results.map((i) => i.slug)).toContain('kenya');
  });

  it('filters by subgroup', () => {
    const africa = filterWikiItems('origenes', { ...NO_FILTERS, grupo: 'africa' });
    expect(africa).toHaveLength(3);
    expect(africa.every((i) => i.groupId === 'africa')).toBe(true);
  });

  it('combines profile filters (>= 4, bitterness <= 2)', () => {
    const results = filterWikiItems('origenes', { ...NO_FILTERS, perfil: ['acidez', 'amargor'] });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((i) => i.sensory.acidity >= 4 && i.sensory.bitterness <= 2)).toBe(true);
  });

  it('filters by flavor family including descendants', () => {
    const results = filterWikiItems('varietales', { ...NO_FILTERS, familia: 'fruity' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((i) => i.flavorNodeIds.some((id) => id.startsWith('fruity')))).toBe(true);
  });
});
