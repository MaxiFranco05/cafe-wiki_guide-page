import esUi from './locales/es/ui.json';

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<typeof esUi>;

export type TranslationParams = Record<string, string | number>;

/**
 * Resolves a translation key from the active locale dictionary (Spanish in v1).
 * Supports nested dot-notation keys and parameter interpolation (e.g. {ratio}).
 * If a key does not exist, returns the key itself as a fallback to avoid crashing.
 */
export function t(key: TranslationKey | (string & {}), params?: TranslationParams): string {
  const segments = key.split('.');
  let current: unknown = esUi;

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
    return str.replaceAll(`{${paramKey}}`, String(paramValue));
  }, current);
}

export { esUi };
