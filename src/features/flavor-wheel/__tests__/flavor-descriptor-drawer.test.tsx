import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { getWikiEntriesByFlavorNode } from '../../../data/wiki';
import { FlavorDescriptorDrawer } from '../components/FlavorDescriptorDrawer';
import { useFlavorSelection } from '../hooks/useFlavorSelection';

const Harness: React.FC<{ readonly presentation?: 'aside' | 'sheet' }> = ({ presentation = 'aside' }) => {
  const selection = useFlavorSelection();
  const location = useLocation();
  return (
    <>
      {selection.selectedNode ? (
        <FlavorDescriptorDrawer
          node={selection.selectedNode}
          lineage={selection.lineage}
          presentation={presentation}
          onSelect={selection.select}
          onClose={selection.clear}
        />
      ) : null}
      <output data-testid="location">{`${location.pathname}${location.search}`}</output>
    </>
  );
};

const WikiPage: React.FC = () => {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
};

function renderDrawer(url: string, presentation?: 'aside' | 'sheet'): void {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/flavor-wheel" element={<Harness presentation={presentation} />} />
        <Route path="/wiki/:section/:slug" element={<WikiPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

const panel = () => screen.getByRole('complementary', { name: /./ });

describe('FlavorDescriptorDrawer', () => {
  it('shows path, note and related entries of a descriptor (Mora)', () => {
    renderDrawer('/flavor-wheel?node=fruity.berry.blackberry');
    const path = within(panel()).getByRole('navigation', { name: 'Ruta del sabor' });
    expect(path).toHaveTextContent('Frutal');
    expect(path).toHaveTextContent('Frutos rojos');
    expect(within(path).getByText('Mora')).toHaveAttribute('aria-current', 'location');
    expect(within(panel()).getByRole('heading', { level: 2, name: 'Mora' })).toBeInTheDocument();
    expect(within(panel()).getByText(/acidez málica y fosfórica/)).toBeInTheDocument();
    const origins = within(panel()).getByRole('group', { name: 'Orígenes' });
    expect(within(origins).getByRole('link', { name: 'Kenia' })).toHaveAttribute('href', '/wiki/origenes/kenya');
    const varietals = within(panel()).getByRole('group', { name: 'Varietales' });
    expect(within(varietals).getByRole('link', { name: 'SL28 / SL34' })).toBeInTheDocument();
    expect(within(panel()).queryByRole('group', { name: 'Procesos' })).not.toBeInTheDocument();
  });

  it('states the presence of Mora in the wiki', () => {
    renderDrawer('/flavor-wheel?node=fruity.berry.blackberry');
    expect(within(panel()).getByText('Aparece en 2 fichas: 1 origen, 1 varietal')).toBeInTheDocument();
  });

  it('lists the subfamilies of a family as selectable chips and counts every listed entry', async () => {
    renderDrawer('/flavor-wheel?node=fruity');
    const children = within(panel()).getByRole('group', { name: 'Subfamilias' });
    expect(within(children).getAllByRole('button')).toHaveLength(4);
    const total = getWikiEntriesByFlavorNode('fruity').length;
    expect(within(panel()).getByText(new RegExp(`^Aparece en ${total} fichas: `))).toBeInTheDocument();
    expect(within(panel()).getAllByRole('link')).toHaveLength(total);
    await userEvent.click(within(children).getByRole('button', { name: 'Cítrico' }));
    expect(screen.getByTestId('location').textContent).toBe('/flavor-wheel?node=fruity.citrus');
  });

  it('selects an ancestor from the path', async () => {
    renderDrawer('/flavor-wheel?node=fruity.berry.blackberry');
    await userEvent.click(within(panel()).getByRole('button', { name: 'Frutos rojos' }));
    expect(screen.getByTestId('location').textContent).toBe('/flavor-wheel?node=fruity.berry');
    expect(within(panel()).getByRole('heading', { level: 2, name: 'Frutos rojos' })).toBeInTheDocument();
  });

  it('says there are no entries yet for a flavor without wiki entries', () => {
    renderDrawer('/flavor-wheel?node=roasted.burnt');
    expect(within(panel()).getByText('Todavía no hay fichas de la Wiki con este sabor.')).toBeInTheDocument();
    expect(within(panel()).queryByText(/^Aparece en/)).not.toBeInTheDocument();
    expect(within(panel()).queryByRole('link')).not.toBeInTheDocument();
  });

  it('closes and removes node from the URL', async () => {
    renderDrawer('/flavor-wheel?node=fruity');
    await userEvent.click(within(panel()).getByRole('button', { name: 'Cerrar detalle' }));
    expect(screen.getByTestId('location').textContent).toBe('/flavor-wheel');
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('navigates to a related wiki entry', async () => {
    renderDrawer('/flavor-wheel?node=fruity.berry.blackberry');
    await userEvent.click(within(panel()).getByRole('link', { name: 'Kenia' }));
    expect(screen.getByTestId('location').textContent).toBe('/wiki/origenes/kenya');
  });

  it('is a non-modal dialog when presented as a bottom sheet', () => {
    renderDrawer('/flavor-wheel?node=fruity', 'sheet');
    const sheet = screen.getByRole('dialog', { name: 'Frutal' });
    expect(sheet).toHaveAttribute('aria-modal', 'false');
    expect(sheet).toHaveClass('fw-panel--sheet');
  });
});
