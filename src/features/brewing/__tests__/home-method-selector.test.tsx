import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { HomeMethodSelectorView } from '../views/HomeMethodSelectorView';

describe('HomeMethodSelectorView (C-03 D-03)', () => {
  it('renders all 6 catalog brew methods dynamically with dual discovery links', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <HomeMethodSelectorView />
      </MemoryRouter>
    );

    expect(screen.getByText('Hario V60')).toBeInTheDocument();
    expect(screen.getByText('Chemex')).toBeInTheDocument();
    expect(screen.getByText('Melitta')).toBeInTheDocument();
    expect(screen.getByText('AeroPress')).toBeInTheDocument();
    expect(screen.getByText('Prensa Francesa')).toBeInTheDocument();
    expect(screen.getByText('Espresso')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Explorar Wiki Sensorial/i })).toHaveAttribute(
      'href',
      '/wiki'
    );
    expect(screen.getByRole('link', { name: /Abrir Rueda de Sabores/i })).toHaveAttribute(
      'href',
      '/flavor-wheel'
    );
  });

  it('filters brew methods interactively by category chips and updates aria-pressed', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <HomeMethodSelectorView />
      </MemoryRouter>
    );

    const allChip = screen.getByRole('button', { name: /Todos/i });
    const filterChip = screen.getByRole('button', { name: /Filtro/i });
    const immersionChip = screen.getByRole('button', { name: /Inmersión/i });
    const hybridChip = screen.getByRole('button', { name: /Híbrido/i });
    const pressureChip = screen.getByRole('button', { name: /Presión/i });

    expect(allChip).toHaveAttribute('aria-pressed', 'true');
    expect(filterChip).toHaveAttribute('aria-pressed', 'false');

    // Filter -> 3 pour_over methods (V60, Chemex, Melitta)
    await user.click(filterChip);
    expect(filterChip).toHaveAttribute('aria-pressed', 'true');
    expect(allChip).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Hario V60')).toBeInTheDocument();
    expect(screen.getByText('Chemex')).toBeInTheDocument();
    expect(screen.getByText('Melitta')).toBeInTheDocument();
    expect(screen.queryByText('Espresso')).toBeNull();
    expect(screen.queryByText('AeroPress')).toBeNull();

    // Immersion -> 1 (Prensa Francesa)
    await user.click(immersionChip);
    expect(immersionChip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Prensa Francesa')).toBeInTheDocument();
    expect(screen.queryByText('Hario V60')).toBeNull();

    // Hybrid -> 1 (AeroPress)
    await user.click(hybridChip);
    expect(hybridChip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('AeroPress')).toBeInTheDocument();
    expect(screen.queryByText('Prensa Francesa')).toBeNull();

    // Pressure -> 1 (Espresso)
    await user.click(pressureChip);
    expect(pressureChip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Espresso')).toBeInTheDocument();
    expect(screen.queryByText('AeroPress')).toBeNull();

    // Reset back to All -> 6 methods
    await user.click(allChip);
    expect(allChip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Hario V60')).toBeInTheDocument();
    expect(screen.getByText('Espresso')).toBeInTheDocument();
  });

  it('supports keyboard activation (Tab + Enter/Space) on category filter chips', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <HomeMethodSelectorView />
      </MemoryRouter>
    );

    const filterChip = screen.getByRole('button', { name: /Filtro/i });
    const allChip = screen.getByRole('button', { name: /Todos/i });

    filterChip.focus();
    expect(filterChip).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(filterChip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText('Espresso')).toBeNull();

    allChip.focus();
    await user.keyboard(' ');
    expect(allChip).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Espresso')).toBeInTheDocument();
  });

  it('navigates in 1 tap when clicking a method card', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomeMethodSelectorView />} />
          <Route path="/brew/:methodSlug" element={<div>Brew Route Target</div>} />
        </Routes>
      </MemoryRouter>
    );

    const catalogRegion = screen.getByRole('region', { name: /Métodos de Extracción/i });
    const v60Link = within(catalogRegion).getByRole('link', { name: /Hario V60/i });
    await user.click(v60Link);
    expect(screen.getByText('Brew Route Target')).toBeInTheDocument();
  });
});
