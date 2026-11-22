import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router';
import { describe, expect, it } from 'vitest';
import { useFlavorSelection, type FlavorSelection } from '../hooks/useFlavorSelection';

let latest: FlavorSelection | null = null;
let navigateRef: ReturnType<typeof useNavigate> | null = null;

const Probe: React.FC = () => {
  latest = useFlavorSelection();
  navigateRef = useNavigate();
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
};

const Home: React.FC = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
};

function renderAt(url: string): void {
  latest = null;
  render(
    <MemoryRouter initialEntries={['/', url]} initialIndex={1}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/flavor-wheel" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  );
}

function selection(): FlavorSelection {
  if (!latest) throw new Error('hook not rendered');
  return latest;
}

describe('useFlavorSelection', () => {
  it('selects a valid ?node= with its lineage and family focus', () => {
    renderAt('/flavor-wheel?node=fruity.berry.blackberry');
    expect(selection().selectedNode?.id).toBe('fruity.berry.blackberry');
    expect(selection().lineage.map((n) => n.id)).toEqual(['fruity', 'fruity.berry', 'fruity.berry.blackberry']);
    expect(selection().focusFamily?.id).toBe('fruity');
  });

  it('ignores an unknown ?node=', () => {
    renderAt('/flavor-wheel?node=no-existe');
    expect(selection().selectedNode).toBeUndefined();
    expect(selection().lineage).toEqual([]);
    expect(selection().focusFamily).toBeUndefined();
  });

  it('writes only node and keeps the history length unchanged', () => {
    renderAt('/flavor-wheel');
    act(() => selection().select('fruity.citrus'));
    act(() => selection().select('fruity.citrus.lemon'));
    act(() => selection().select('fruity.citrus.lime'));
    expect(screen.getByTestId('location').textContent).toBe('/flavor-wheel?node=fruity.citrus.lime');
    act(() => navigateRef?.(-1));
    expect(screen.getByTestId('location').textContent).toBe('/');
  });

  it('ignores unknown ids passed to select', () => {
    renderAt('/flavor-wheel?node=fruity');
    act(() => selection().select('no-existe'));
    expect(selection().selectedNode?.id).toBe('fruity');
  });

  it('clear removes node from the URL', () => {
    renderAt('/flavor-wheel?node=fruity');
    act(() => selection().clear());
    expect(screen.getByTestId('location').textContent).toBe('/flavor-wheel');
    expect(selection().selectedNode).toBeUndefined();
  });

  it('resolves a valid from to a return link and keeps it across select and clear', () => {
    renderAt('/flavor-wheel?node=fruity.berry.blackberry&from=origenes%2Fkenya');
    expect(selection().returnEntry).toEqual({ href: '/wiki/origenes/kenya', title: 'Kenia' });
    act(() => selection().select('fruity.citrus'));
    act(() => selection().clear());
    expect(screen.getByTestId('location').textContent).toBe('/flavor-wheel?from=origenes%2Fkenya');
    expect(selection().returnEntry?.href).toBe('/wiki/origenes/kenya');
  });

  it('accepts entries from every wiki section, including brewers', () => {
    renderAt('/flavor-wheel?from=cafeteras%2Fv60');
    expect(selection().returnEntry?.href).toBe('/wiki/cafeteras/v60');
  });

  it('ignores an invalid from', () => {
    renderAt('/flavor-wheel?from=origenes%2Fno-existe');
    expect(selection().returnEntry).toBeUndefined();
    renderAt('/flavor-wheel?from=https%3A%2F%2Fevil.example');
    expect(selection().returnEntry).toBeUndefined();
  });
});
