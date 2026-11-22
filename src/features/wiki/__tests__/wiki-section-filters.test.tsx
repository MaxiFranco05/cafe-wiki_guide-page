import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { WikiSectionFilters } from '../components/WikiSectionFilters';
import { useWikiSectionFilters } from '../hooks/useWikiSectionFilters';

function Harness() {
  const api = useWikiSectionFilters('origenes');
  const location = useLocation();
  return (
    <>
      <WikiSectionFilters section="origenes" api={api} groupCounts={{ south_america: 5, africa: 3 }} totalCount={16} />
      <output data-testid="url">{location.search}</output>
    </>
  );
}

const renderAt = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/wiki/:section" element={<Harness />} />
      </Routes>
    </MemoryRouter>,
  );

const url = () => screen.getByTestId('url').textContent;

describe('WikiSectionFilters', () => {
  it('searches with a labelled input and clears it', () => {
    renderAt('/wiki/origenes');
    fireEvent.change(screen.getByRole('searchbox', { name: /buscar en orígenes/i }), { target: { value: 'kenia' } });
    expect(url()).toBe('?q=kenia');
    fireEvent.click(screen.getByRole('button', { name: /borrar búsqueda/i }));
    expect(url()).toBe('');
  });

  it('exposes subgroups as a radiogroup with counts', () => {
    renderAt('/wiki/origenes');
    const all = screen.getByRole('radio', { name: /todas las regiones/i });
    expect(all).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('radio', { name: /áfrica 3/i }));
    expect(url()).toBe('?grupo=africa');
    expect(screen.getByRole('radio', { name: /áfrica/i })).toHaveAttribute('aria-checked', 'true');
  });

  it('opens the profile and flavor panel and toggles pressed filters', () => {
    renderAt('/wiki/origenes');
    const toggle = screen.getByRole('button', { name: /perfil y sabor/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: /acidez alta/i }));
    expect(screen.getByRole('button', { name: /acidez alta/i })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /^frutal$/i }));
    expect(url()).toBe('?perfil=acidez&familia=fruity&filtros=1');
    expect(toggle).toHaveTextContent('2');
  });
});
