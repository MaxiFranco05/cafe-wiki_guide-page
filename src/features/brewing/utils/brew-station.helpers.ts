import type { BrewMethod, RecipeProfile, SvgStageDirective } from '../../../domain/schemas';

export const MAX_SAFE_BREW_INPUT = 2000;

export interface MethodVisualAsset {
  readonly imageSrc: string;
  readonly objectPosition?: string;
}

const METHOD_VISUAL_ASSETS: Readonly<Record<BrewMethod['id'], MethodVisualAsset>> = {
  v60: { imageSrc: '/images/coffee/v60-moody.jpg' },
  chemex: { imageSrc: '/images/coffee/immersion-moody.jpg' },
  melitta: { imageSrc: '/images/coffee/v60-moody.jpg', objectPosition: 'center bottom' },
  aeropress: { imageSrc: '/images/coffee/pro-machine-moody.jpg', objectPosition: 'right center' },
  'french-press': { imageSrc: '/images/coffee/immersion-moody.jpg', objectPosition: 'right center' },
  espresso: { imageSrc: '/images/coffee/espresso-moody.jpg' },
};

/**
 * Resolves static photography path and framing alignment for a brew method.
 */
export function getMethodVisualAsset(methodId: BrewMethod['id']): MethodVisualAsset {
  return METHOD_VISUAL_ASSETS[methodId];
}

/**
 * Validates the optional ?profile query parameter against the method's allowed profiles
 * (spec §Method Station Initialization), falling back to the method default.
 */
export function resolveInitialProfileId(
  method: BrewMethod,
  searchParamProfile: string | null | undefined
): RecipeProfile['id'] {
  if (searchParamProfile) {
    const matched = method.profiles.find((profile) => profile.id === searchParamProfile);
    if (matched) {
      return matched.id;
    }
  }

  const fallbackId = method.scalingMode === 'espresso_yield_ratio' ? 'normale' : 'normal';
  const defaultProfile =
    method.profiles.find((profile) => profile.id === fallbackId) ?? method.profiles[0];

  if (!defaultProfile) {
    throw new Error(`BrewMethod "${method.id}" contains no recipe profiles.`);
  }

  return defaultProfile.id;
}

export interface SanitizedBrewInputResult {
  readonly isValid: boolean;
  readonly value: number;
}

/**
 * Sanitizes raw numeric user text into a safe positive finite decimal <= MAX_SAFE_BREW_INPUT.
 * Returns `{ isValid: false, value: 0 }` for empty, zero, negative, or non-finite inputs.
 */
export function parseSanitizedBrewInput(rawValue: string): SanitizedBrewInputResult {
  const normalized = rawValue.trim().replaceAll(',', '.');
  if (normalized.length === 0) {
    return { isValid: false, value: 0 };
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { isValid: false, value: 0 };
  }

  const clamped = Math.min(parsed, MAX_SAFE_BREW_INPUT);
  return {
    isValid: true,
    value: Math.round((clamped + Number.EPSILON) * 10) / 10,
  };
}

/**
 * Formats numbers keeping integers clean ("15") and single decimals concise ("16.7").
 */
export function formatBrewNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.round((value + Number.EPSILON) * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

/**
 * Formats seconds into unpadded `M:SS` timeline timestamps (e.g. 45 -> "0:45", 210 -> "3:30").
 */
export function formatMinutesSeconds(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Formats seconds into zero-padded `MM:SS` benchtop timer readout (e.g. 22 -> "00:22", 210 -> "03:30").
 */
export function formatPaddedClock(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Resolves SVG vessel identifier from a method's default phase directive.
 */
export function getMethodVesselType(method: BrewMethod): SvgStageDirective['vesselType'] {
  return method.profiles[0]?.phases[0]?.svgDirective.vesselType ?? 'cone_v60';
}
