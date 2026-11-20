import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { FLAVOR_WHEEL_TREE } from '../../../data/flavor-wheel';
import { getWikiSection, type WikiSectionFilters, type WikiSectionSlug } from '../sections';
import { PROFILE_FILTER_IDS, type ProfileFilterId } from '../utils/wiki-ui.helpers';

const ROOT_FAMILIES = new Set(FLAVOR_WHEEL_TREE.map((node) => node.id));

export interface WikiSectionFiltersApi {
  readonly filters: WikiSectionFilters;
  readonly panelOpen: boolean;
  /** Profile + family filters (the ones inside the "Perfil y sabor" panel). */
  readonly panelCount: number;
  /** Every active criterion, search included. */
  readonly activeCount: number;
  setQuery(q: string): void;
  setGroup(groupId: string): void;
  toggleProfile(id: ProfileFilterId): void;
  setFamily(familyId: string): void;
  togglePanel(): void;
  reset(): void;
}

function isProfileFilterId(value: string): value is ProfileFilterId {
  return (PROFILE_FILTER_IDS as readonly string[]).includes(value);
}

/**
 * URL-backed filter state for a wiki section (`?q=&grupo=&perfil=&familia=&filtros=1`).
 * The URL is the only source of truth; unknown values are ignored. Typing replaces the
 * history entry, every other change pushes one so "back" restores the previous results.
 */
export function useWikiSectionFilters(section: WikiSectionSlug): WikiSectionFiltersApi {
  const [params, setParams] = useSearchParams();
  const groupIds = useMemo(() => new Set(getWikiSection(section)?.groupOrder ?? []), [section]);

  const filters = useMemo<WikiSectionFilters>(() => {
    const grupo = params.get('grupo') ?? '';
    const familia = params.get('familia') ?? '';
    const perfil = [...new Set((params.get('perfil') ?? '').split(',').filter(isProfileFilterId))];
    return {
      q: params.get('q') ?? '',
      grupo: groupIds.has(grupo) ? grupo : '',
      perfil: PROFILE_FILTER_IDS.filter((id) => perfil.includes(id)),
      familia: ROOT_FAMILIES.has(familia) ? familia : '',
    };
  }, [params, groupIds]);
  const panelOpen = params.get('filtros') === '1';

  const write = useCallback(
    (next: WikiSectionFilters, open: boolean, replace: boolean) => {
      const out = new URLSearchParams();
      if (next.q) out.set('q', next.q);
      if (next.grupo) out.set('grupo', next.grupo);
      if (next.perfil.length) out.set('perfil', next.perfil.join(','));
      if (next.familia) out.set('familia', next.familia);
      if (open) out.set('filtros', '1');
      setParams(out, { replace });
    },
    [setParams],
  );

  const panelCount = filters.perfil.length + (filters.familia ? 1 : 0);
  return {
    filters,
    panelOpen,
    panelCount,
    activeCount: panelCount + (filters.q ? 1 : 0) + (filters.grupo ? 1 : 0),
    setQuery: (q) => write({ ...filters, q }, panelOpen, true),
    setGroup: (grupo) => write({ ...filters, grupo }, panelOpen, false),
    toggleProfile: (id) =>
      write(
        { ...filters, perfil: filters.perfil.includes(id) ? filters.perfil.filter((p) => p !== id) : [...filters.perfil, id] },
        panelOpen,
        false,
      ),
    setFamily: (familia) => write({ ...filters, familia: filters.familia === familia ? '' : familia }, panelOpen, false),
    togglePanel: () => write(filters, !panelOpen, true),
    reset: () => write({ q: '', grupo: '', perfil: [], familia: '' }, panelOpen, false),
  };
}
