import esUi from './locales/es/ui.json';
import esMethods from './locales/es/methods.json';

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
  esUi as Record<string, unknown>,
  esMethods as Record<string, unknown>
);

export type TranslationKey = NestedKeyOf<typeof esUi> | NestedKeyOf<typeof esMethods>;

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

  if (!params) {
    return current;
  }

  return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
    return str
      .replaceAll(`{{${paramKey}}}`, String(paramValue))
      .replaceAll(`{${paramKey}}`, String(paramValue));
  }, current);
}

export { esUi, esMethods };
