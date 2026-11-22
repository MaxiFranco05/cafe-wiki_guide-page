import type { SensoryProfile } from '../../domain/schemas';

export interface SensoryThresholds {
  readonly minAcidity?: number;
  readonly minSweetness?: number;
  readonly minBody?: number;
  readonly maxBitterness?: number;
}

/**
 * Normalizes user queries and catalog haystacks for accent- and case-insensitive search.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Checks whether a sensory profile satisfies all provided inclusive thresholds.
 */
export function matchesSensoryThresholds(
  profile: SensoryProfile,
  thresholds: SensoryThresholds
): boolean {
  const { minAcidity, minSweetness, minBody, maxBitterness } = thresholds;

  if (minAcidity !== undefined && profile.acidity < minAcidity) {
    return false;
  }

  if (minSweetness !== undefined && profile.sweetness < minSweetness) {
    return false;
  }

  if (minBody !== undefined && profile.body < minBody) {
    return false;
  }

  if (maxBitterness !== undefined && profile.bitterness > maxBitterness) {
    return false;
  }

  return true;
}
