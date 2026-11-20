import {
  OriginVarietalsSchema,
  type OriginVarietals,
  type OriginWikiEntry,
  type VarietalWikiEntry,
} from '../../domain/schemas';
import { WIKI_ORIGINS } from './origins';
import { WIKI_VARIETALS } from './varietals';

/**
 * Varietals commonly grown in each origin (C-10, approved in mockup v3.1).
 * Single source of truth for both directions; sources are added by the editorial catalog (C-16).
 */
export const ORIGIN_VARIETALS: OriginVarietals = Object.freeze(
  OriginVarietalsSchema.parse({
    brazil: ['mundo-novo', 'catuai', 'bourbon', 'robusta-canephora'],
    colombia: ['castillo', 'caturra', 'typica'],
    peru: ['typica', 'caturra', 'bourbon'],
    bolivia: ['typica', 'caturra'],
    ecuador: ['typica', 'sidra'],
    guatemala: ['bourbon', 'caturra', 'catuai'],
    'costa-rica': ['villa-sarchi', 'caturra', 'catuai'],
    'el-salvador': ['pacas', 'pacamara', 'bourbon'],
    honduras: ['catuai', 'caturra', 'pacas'],
    nicaragua: ['caturra', 'maragogype', 'pacamara'],
    panama: ['geisha', 'caturra', 'catuai'],
    mexico: ['typica', 'bourbon'],
    ethiopia: ['geisha'],
    kenya: ['sl28-sl34'],
    rwanda: ['bourbon'],
    sumatra: ['catimor', 'typica'],
  })
);

const VARIETALS_BY_SLUG = new Map(WIKI_VARIETALS.map((v) => [v.slug, v] as const));

/** Varietal entries commonly grown in an origin, in the declared order. */
export function getVarietalsForOrigin(originSlug: string): readonly VarietalWikiEntry[] {
  const slugs = ORIGIN_VARIETALS[originSlug] ?? [];
  return slugs.flatMap((slug) => {
    const varietal = VARIETALS_BY_SLUG.get(slug);
    return varietal ? [varietal] : [];
  });
}

/** Origin entries where a varietal is commonly grown (derived from ORIGIN_VARIETALS). */
export function getOriginsForVarietal(varietalSlug: string): readonly OriginWikiEntry[] {
  return WIKI_ORIGINS.filter((origin) => (ORIGIN_VARIETALS[origin.slug] ?? []).includes(varietalSlug));
}
