import { describe, expect, it } from 'vitest';
import { act, render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { useWikiSectionFilters, type WikiSectionFiltersApi } from '../hooks/useWikiSectionFilters';

function setup(entry: string) {
  const api: { current: WikiSectionFiltersApi | null; location: string; historyLength: number } = {
    current: null,
    location: '',
    historyLength: 0,
  };
  const Probe = () => {
    api.current = useWikiSectionFilters('origenes');
    const location = useLocation();
    api.location = location.pathname + location.search;
    return null;
  };
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/wiki/:section" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  );
  return api;
}

describe('useWikiSectionFilters', () => {
  it('parses filters from the URL and ignores unknown values', () => {
    const api = setup('/wiki/origenes?q=kenia&grupo=africa&perfil=acidez,foo,acidez&familia=fruity&filtros=1');
    expect(api.current!.filters).toEqual({ q: 'kenia', grupo: 'africa', perfil: ['acidez'], familia: 'fruity' });
    expect(api.current!.panelOpen).toBe(true);
  });

  it('drops a subgroup or family that does not exist', () => {
    const api = setup('/wiki/origenes?grupo=marte&familia=plastico');
    expect(api.current!.filters).toEqual({ q: '', grupo: '', perfil: [], familia: '' });
  });

  it('writes filters back to the URL', () => {
    const api = setup('/wiki/origenes');
    act(() => api.current!.setQuery('etio'));
    expect(api.location).toBe('/wiki/origenes?q=etio');
    act(() => api.current!.toggleProfile('cuerpo'));
    expect(api.location).toBe('/wiki/origenes?q=etio&perfil=cuerpo');
    act(() => api.current!.setGroup('africa'));
    act(() => api.current!.setFamily('floral'));
    expect(api.current!.filters).toEqual({ q: 'etio', grupo: 'africa', perfil: ['cuerpo'], familia: 'floral' });
    act(() => api.current!.toggleProfile('cuerpo'));
    expect(api.current!.filters.perfil).toEqual([]);
  });

  it('reset clears search and filters but keeps the panel state', () => {
    const api = setup('/wiki/origenes?q=x&grupo=africa&perfil=acidez&familia=fruity&filtros=1');
    act(() => api.current!.reset());
    expect(api.location).toBe('/wiki/origenes?filtros=1');
    expect(api.current!.activeCount).toBe(0);
  });
});
