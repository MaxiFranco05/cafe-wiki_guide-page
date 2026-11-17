import type { BrewMethod } from '../../domain/schemas';
import { v60Method } from './v60';
import { chemexMethod } from './chemex';
import { melittaMethod } from './melitta';
import { aeropressMethod } from './aeropress';
import { frenchPressMethod } from './french-press';
import { espressoMethod } from './espresso';

export {
  v60Method,
  chemexMethod,
  melittaMethod,
  aeropressMethod,
  frenchPressMethod,
  espressoMethod,
};

export const METHODS_CATALOG: readonly BrewMethod[] = [
  v60Method,
  chemexMethod,
  melittaMethod,
  aeropressMethod,
  frenchPressMethod,
  espressoMethod,
] as const;

export const METHODS_BY_SLUG: Readonly<Record<string, BrewMethod>> = Object.freeze(
  METHODS_CATALOG.reduce<Record<string, BrewMethod>>((acc, method) => {
    acc[method.id] = method;
    return acc;
  }, {})
);

export function getMethodBySlug(slug: string): BrewMethod | undefined {
  return METHODS_BY_SLUG[slug];
}
