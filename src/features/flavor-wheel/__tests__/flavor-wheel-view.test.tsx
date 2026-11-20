import React from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetSharedStorageAdapter } from '../../../adapters';
import { FlavorWheelView } from '../views/FlavorWheelView';

let navigateRef: ReturnType<typeof useNavigate> | null = null;

const LocationProbe: React.FC = () => {
  const location = useLocation();
  navigateRef = useNavigate();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
};

function renderView(url = '/flavor-wheel'): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/', url]} initialIndex={1}>
      <Routes>
        <Route path="/" element={<LocationProbe />} />
        <Route
          path="/flavor-wheel"
          element={
            <>
              <FlavorWheelView />
              <LocationProbe />
            </>
          }
        />
        <Route path="/wiki/:section/:slug" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

function mockNarrow(narrow: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: narrow && query.includes('max-width'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

const wheel = () => screen.getByRole('region', { name: 'Rueda de sabores' });
const accordion = () => screen.getByRole('region', { name: 'Familias de sabor' });
const location = () => screen.getByTestId('location').textContent;

beforeEach(() => {
  window.localStorage.clear();
  resetSharedStorageAdapter();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('FlavorWheelView — deep links', () => {
  it('opens a deep-linked descriptor zoomed in its family with the panel', () => {
    renderView('/flavor-wheel?node=fruity.berry.blackberry');
    expect(within(wheel()).getAllByRole('treeitem')).toHaveLength(18);
    expect(within(wheel()).getByRole('treeitem', { name: 'Mora' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('complementary', { name: 'Mora' })).toBeInTheDocument();
  });

  it('ignores an unknown node and shows the full wheel with the guide', () => {
    renderView('/flavor-wheel?node=no-existe');
    expect(within(wheel()).getAllByRole('treeitem')).toHaveLength(88);
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '¿Qué sentís en la taza?' })).toBeInTheDocument();
  });

  it('updates the URL on each selection without growing the history', async () => {
    renderView();
    await userEvent.click(within(wheel()).getByRole('treeitem', { name: 'Cítrico' }));
    await userEvent.click(within(wheel()).getByRole('treeitem', { name: 'Limón' }));
    expect(location()).toBe('/flavor-wheel?node=fruity.citrus.lemon');
    act(() => navigateRef?.(-1));
    expect(location()).toBe('/');
  });

  it('shares the selection between the accordion and the wheel', async () => {
    renderView();
    await userEvent.click(within(accordion()).getByRole('button', { name: /^Frutal/ }));
    await userEvent.click(within(accordion()).getByRole('button', { name: /^Frutos rojos/ }));
    await userEvent.click(within(accordion()).getByRole('button', { name: /^Mora$/ }));
    expect(within(wheel()).getByRole('treeitem', { name: 'Mora' })).toHaveAttribute('aria-selected', 'true');
    expect(within(wheel()).getAllByRole('treeitem')).toHaveLength(18);
  });
});

describe('FlavorWheelView — return to the wiki entry', () => {
  it('shows "Volver a Kenia" when arriving from a wiki entry', async () => {
    renderView('/flavor-wheel?node=fruity.berry.blackberry&from=origenes%2Fkenya');
    const back = screen.getByRole('link', { name: 'Volver a Kenia' });
    expect(back).toHaveAttribute('href', '/wiki/origenes/kenya');
    await userEvent.click(back);
    expect(location()).toBe('/wiki/origenes/kenya');
  });

  it('keeps the return link and the from parameter across selections and closing', async () => {
    renderView('/flavor-wheel?from=origenes%2Fkenya');
    await userEvent.click(within(wheel()).getByRole('treeitem', { name: 'Cítrico' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar detalle' }));
    expect(screen.getByRole('link', { name: 'Volver a Kenia' })).toBeInTheDocument();
    expect(location()).toBe('/flavor-wheel?from=origenes%2Fkenya');
  });

  it('ignores an invalid origin', () => {
    renderView('/flavor-wheel?from=origenes%2Fno-existe');
    expect(screen.queryByRole('link', { name: /^Volver a/ })).not.toBeInTheDocument();
    expect(within(wheel()).getAllByRole('treeitem')).toHaveLength(88);
  });
});

describe('FlavorWheelView — beginner guide', () => {
  it('shows the guide without a dismiss button on wide screens', () => {
    mockNarrow(false);
    renderView();
    expect(screen.getByRole('heading', { name: '¿Qué sentís en la taza?' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ocultar guía' })).not.toBeInTheDocument();
  });

  it('hides the guide on narrow screens and keeps it hidden on the next visit', async () => {
    mockNarrow(true);
    const first = renderView();
    await userEvent.click(screen.getByRole('button', { name: 'Ocultar guía' }));
    expect(screen.queryByRole('heading', { name: '¿Qué sentís en la taza?' })).not.toBeInTheDocument();
    first.unmount();
    resetSharedStorageAdapter();
    renderView();
    expect(screen.queryByRole('heading', { name: '¿Qué sentís en la taza?' })).not.toBeInTheDocument();
    expect(within(accordion()).getAllByRole('button')).toHaveLength(9);
  });

  it('a starting family from the guide selects it', async () => {
    renderView();
    await userEvent.click(screen.getByRole('button', { name: 'Tostado' }));
    expect(location()).toBe('/flavor-wheel?node=roasted');
  });
});

describe('FlavorWheelView — mobile bottom sheet', () => {
  it('Escape closes the sheet and returns focus to the accordion', async () => {
    mockNarrow(true);
    renderView('/flavor-wheel?node=fruity.berry.blackberry');
    expect(screen.getByRole('dialog', { name: 'Mora' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(location()).toBe('/flavor-wheel');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    // Mora folds away with its subfamily: focus lands on the nearest visible row of its path.
    expect(document.activeElement).toBe(within(accordion()).getByRole('button', { name: /^Frutal/ }));
  });

  it('closing from the sheet button also returns focus to the accordion', async () => {
    mockNarrow(true);
    renderView('/flavor-wheel?node=fruity');
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar detalle' }));
    expect(document.activeElement).toBe(within(accordion()).getByRole('button', { name: /^Frutal/ }));
  });
});

describe('FlavorWheelView — copy', () => {
  it('resolves every key and renders no emoji', () => {
    renderView('/flavor-wheel?node=fruity.berry.blackberry&from=origenes%2Fkenya');
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/\b(wheel|flavorWheel|wiki)\.[a-zA-Z_.-]+/);
    expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    for (const el of document.querySelectorAll('[aria-label]')) {
      expect(el.getAttribute('aria-label')).not.toMatch(/\b(wheel|flavorWheel)\.[a-zA-Z_.-]+/);
    }
  });
});
