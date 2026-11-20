import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../../App';

describe('AppLayout and Public SPA Routing', () => {
  it('renders HomeView at route "/" with hero and method cards', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );

    // Hero title
    expect(screen.getByText('Precisión de barra en cada extracción.')).toBeInTheDocument();

    // Top navbar and bottom tabs
    expect(screen.getByRole('navigation', { name: /navegación principal/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /navegación móvil/i })).toBeInTheDocument();

    // Method cards
    expect(screen.getByText('Hario V60')).toBeInTheDocument();
    expect(screen.getByText('Espresso')).toBeInTheDocument();
    expect(screen.getByText('Chemex')).toBeInTheDocument();
    expect(screen.getByText('Melitta')).toBeInTheDocument();
    expect(screen.getByText('AeroPress')).toBeInTheDocument();
    expect(screen.getByText('Prensa Francesa')).toBeInTheDocument();
  });

  it('renders BrewStationView at route "/brew/v60" with the live timer panel (reset only appears once a run starts)', () => {
    render(
      <MemoryRouter initialEntries={['/brew/v60']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Hario V60/i })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: /temporizador de preparación/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar extracción/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reiniciar a 00:00/i })).toBeNull();
  });

  it('renders all 6 valid brew method routes without 404', () => {
    const validSlugs = ['v60', 'espresso', 'chemex', 'melitta', 'aeropress', 'french-press'];

    validSlugs.forEach((slug) => {
      const { unmount } = render(
        <MemoryRouter initialEntries={[`/brew/${slug}`]}>
          <AppRoutes />
        </MemoryRouter>
      );

      expect(screen.queryByText('404 — Ruta no encontrada')).toBeNull();
      expect(screen.getByRole('button', { name: /iniciar extracción/i })).toBeInTheDocument();
      unmount();
    });
  });

  it('renders WikiHomeView at route "/wiki"', () => {
    render(
      <MemoryRouter initialEntries={['/wiki']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Todo sobre el café, por tema' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /secciones de la wiki/i })).toBeInTheDocument();
  });

  it('renders WikiSectionView at route "/wiki/origenes"', () => {
    render(
      <MemoryRouter initialEntries={['/wiki/origenes']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Orígenes' })).toBeInTheDocument();
  });

  it('renders WikiEntryDetailView at route "/wiki/varietales/bourbon"', () => {
    render(
      <MemoryRouter initialEntries={['/wiki/varietales/bourbon']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Bourbon' })).toBeInTheDocument();
  });

  it('renders NotFoundView for an unknown wiki section or an entry of another section', () => {
    for (const path of ['/wiki/categoria-desconocida/bourbon', '/wiki/granos', '/wiki/procesos/bourbon']) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      );
      expect(screen.getByText('404 — Ruta no encontrada')).toBeInTheDocument();
      unmount();
    }
  });

  it('renders FlavorWheelView at route "/flavor-wheel"', () => {
    render(
      <MemoryRouter initialEntries={['/flavor-wheel']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText('Rueda de Sabores SCA')).toBeInTheDocument();
    expect(screen.getByText('CATA SCA')).toBeInTheDocument();
  });

  it('renders NotFoundView on unknown route with a functional recovery return link to home', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/some-unknown-path']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText('404 — Ruta no encontrada')).toBeInTheDocument();
    const returnLink = screen.getByRole('link', { name: /volver al inicio/i });
    expect(returnLink).toHaveAttribute('href', '/');

    await user.click(returnLink);
    expect(screen.getByText('Precisión de barra en cada extracción.')).toBeInTheDocument();
  });

  it('renders NotFoundView when an invalid brew method slug is passed', () => {
    render(
      <MemoryRouter initialEntries={['/brew/metodo-inexistente']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText('404 — Ruta no encontrada')).toBeInTheDocument();
  });
});
