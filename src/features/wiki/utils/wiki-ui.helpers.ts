import type { DrinkEntry, SensoryProfile } from '../../../domain/schemas';
import { FLAVOR_LINEAGE_BY_ID } from '../../../data/flavor-wheel';
import type { SensoryThresholds } from '../../../data/wiki/search';

/** Sensory attributes in wheel order: Acidez (top right), then clockwise. */
export const SENSORY_KEYS = ['acidity', 'sweetness', 'body', 'bitterness'] as const;
export type SensoryKey = (typeof SENSORY_KEYS)[number];

export const PROFILE_FILTER_IDS = ['acidez', 'dulzor', 'cuerpo', 'amargor'] as const;
export type ProfileFilterId = (typeof PROFILE_FILTER_IDS)[number];

/** "Liviano (Claridad Floral)" -> "Liviano" for compact CTA labels. */
export function shortProfileLabel(label: string): string {
  const cut = label.indexOf(' (');
  return (cut === -1 ? label : label.slice(0, cut)).trim();
}

export interface ProfileAttribute {
  readonly key: SensoryKey;
  readonly value: number;
}

/** Dominant attributes for cards: every value >= 4, or the highest one(s) if none reaches 4. Max 3. */
export function cardProfile(profile: SensoryProfile): readonly ProfileAttribute[] {
  const sorted = SENSORY_KEYS.map((key) => ({ key, value: profile[key] })).sort((a, b) => b.value - a.value);
  const strong = sorted.filter((a) => a.value >= 4);
  const top = sorted[0]?.value ?? 0;
  return (strong.length > 0 ? strong : sorted.filter((a) => a.value === top)).slice(0, 3);
}

/** Root SCA family -> design-system token (never the catalog colorHex). */
export const FLAVOR_FAMILY_TOKEN: Readonly<Record<string, string>> = Object.freeze({
  fruity: '--flavor-fruity',
  floral: '--flavor-floral',
  sweet: '--flavor-sweet',
  'nutty-cocoa': '--flavor-nutty-cocoa',
  spiced: '--flavor-spices',
  roasted: '--flavor-roasted',
  'green-vegetative': '--flavor-green-vegetative',
  'sour-fermented': '--flavor-sour-fermented',
  other: '--flavor-other',
});

export function getNoteFamilyId(nodeId: string): string {
  return FLAVOR_LINEAGE_BY_ID[nodeId]?.[0]?.id ?? 'other';
}

export function familyColorVar(familyId: string): string {
  return `var(${FLAVOR_FAMILY_TOKEN[familyId] ?? FLAVOR_FAMILY_TOKEN.other})`;
}

const PROFILE_FILTER_THRESHOLDS: Readonly<Record<ProfileFilterId, SensoryThresholds>> = {
  acidez: { minAcidity: 4 },
  dulzor: { minSweetness: 4 },
  cuerpo: { minBody: 4 },
  amargor: { maxBitterness: 2 },
};

export function profileFiltersToThresholds(ids: readonly ProfileFilterId[]): SensoryThresholds {
  return ids.reduce<SensoryThresholds>((acc, id) => ({ ...acc, ...PROFILE_FILTER_THRESHOLDS[id] }), {});
}

export type VesselKind = 'demitasse' | 'medium' | 'large' | 'tall';

export interface VesselSpec {
  readonly kind: VesselKind;
  readonly capacityMl: number;
  readonly ticksMl: readonly number[];
  readonly fillRatio: number;
  readonly hasHandle: boolean;
  readonly ice: boolean;
}

/** Vessel for the composition diagram: chosen by served volume, filled to its average. */
export function vesselSpec(drink: DrinkEntry): VesselSpec {
  const { min, max } = drink.servedVolumeMl;
  const average = (min + max) / 2;
  const base =
    drink.family === 'cold'
      ? { kind: 'tall' as const, capacityMl: 320, ticksMl: [100, 200, 300], hasHandle: false, ice: true }
      : max <= 115
        ? { kind: 'demitasse' as const, capacityMl: 110, ticksMl: [30, 60, 90], hasHandle: true, ice: false }
        : max <= 205
          ? { kind: 'medium' as const, capacityMl: 200, ticksMl: [50, 100, 150], hasHandle: true, ice: false }
          : { kind: 'large' as const, capacityMl: 320, ticksMl: [100, 200, 300], hasHandle: true, ice: false };
  const fillRatio = Math.max(0.16, Math.min(0.92, average / base.capacityMl));
  return { ...base, fillRatio };
}

const MAX_VISIBLE_ALIASES = 3;

export function capAliases(text: string): { readonly shown: readonly string[]; readonly hidden: readonly string[] } {
  const list = text.split(/,\s*/).map((a) => a.trim()).filter(Boolean);
  return { shown: list.slice(0, MAX_VISIBLE_ALIASES), hidden: list.slice(MAX_VISIBLE_ALIASES) };
}
