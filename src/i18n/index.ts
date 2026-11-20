import esUi from './locales/es/ui.json';
import esMethods from './locales/es/methods.json';
import esFlavorWheel from './locales/es/flavor-wheel.json';
import esWiki from './locales/es/wiki.json';
import esRecipes from './locales/es/recipes.json';

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

function isRecord(item: unknown): item is Record<string, unknown> {
  return typeof item === 'object' && item !== null && !Array.isArray(item);
}

/**
 * Pure recursive deep merge for locale dictionaries.
 * Preserves target keys and merges nested objects without mutating inputs.
 */
export function deepMerge<T extends Record<string, unknown>, U extends Record<string, unknown>>(
  target: T,
  source: U
): T & U {
  const output: Record<string, unknown> = { ...target };

  for (const [key, sourceValue] of Object.entries(source)) {
    const targetValue = output[key];
    if (isRecord(targetValue) && isRecord(sourceValue)) {
      output[key] = deepMerge(targetValue, sourceValue);
    } else {
      output[key] = sourceValue;
    }
  }

  return output as T & U;
}

export const esDictionary = deepMerge(
  deepMerge(
    deepMerge(
      deepMerge(esUi as Record<string, unknown>, esMethods as Record<string, unknown>),
      esFlavorWheel as Record<string, unknown>
    ),
    esWiki as Record<string, unknown>
  ),
  esRecipes as Record<string, unknown>
);

export type TranslationKey =
  | NestedKeyOf<typeof esUi>
  | NestedKeyOf<typeof esMethods>
  | NestedKeyOf<typeof esFlavorWheel>
  | NestedKeyOf<typeof esWiki>
  | NestedKeyOf<typeof esRecipes>;

export type TranslationParams = Record<string, string | number>;

/**
 * Resolves a translation key from the active locale dictionary (Spanish in v1).
 * Supports nested dot-notation keys and parameter interpolation (both {key} and {{key}}).
 * If a key does not exist, returns the key itself as a fallback to avoid crashing.
 */
export function t(key: TranslationKey | (string & {}), params?: TranslationParams): string {
  const segments = key.split('.');
  let current: unknown = esDictionary;

  for (const segment of segments) {
    if (typeof current === 'object' && current !== null && segment in current) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      current = undefined;
      break;
    }
  }

  if (typeof current !== 'string') {
    return key;
  }

  return interpolate(current, params);
}

/**
 * Replaces `{{key}}` and `{key}` placeholders in a free-text template (e.g. user-authored
 * custom recipe instructions) with the provided parameters.
 */
export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
    return str
      .replaceAll(`{{${paramKey}}}`, String(paramValue))
      .replaceAll(`{${paramKey}}`, String(paramValue));
  }, template);
}

export { esUi, esMethods, esFlavorWheel, esWiki, esRecipes };
