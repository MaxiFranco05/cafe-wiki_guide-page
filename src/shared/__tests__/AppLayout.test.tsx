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

  it('renders BrewStationView at route "/brew/v60" with the live timer panel (reset only appears once a run starts)', async () => {
    render(
      <MemoryRouter initialEntries={['/brew/v60']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Hario V60/i })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: /temporizador de preparación/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar extracción/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reiniciar a 00:00/i })).toBeNull();
  });

  it('renders all 6 valid brew method routes without 404', async () => {
    const validSlugs = ['v60', 'espresso', 'chemex', 'melitta', 'aeropress', 'french-press'];

    for (const slug of validSlugs) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[`/brew/${slug}`]}>
          <AppRoutes />
        </MemoryRouter>
      );

      expect(await screen.findByRole('button', { name: /iniciar extracción/i })).toBeInTheDocument();
      expect(screen.queryByText('404 — Ruta no encontrada')).toBeNull();
      unmount();
    }
  });

  it('renders WikiHomeView at route "/wiki"', async () => {
    render(
      <MemoryRouter initialEntries={['/wiki']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Todo sobre el café, por tema' })
    ).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /secciones de la wiki/i })).toBeInTheDocument();
  });

  it('renders WikiSectionView at route "/wiki/origenes"', async () => {
    render(
      <MemoryRouter initialEntries={['/wiki/origenes']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Orígenes' })).toBeInTheDocument();
  });

  it('renders WikiEntryDetailView at route "/wiki/varietales/bourbon"', async () => {
    render(
      <MemoryRouter initialEntries={['/wiki/varietales/bourbon']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Bourbon' })).toBeInTheDocument();
  });

  it('renders NotFoundView for an unknown wiki section or an entry of another section', async () => {
    for (const path of ['/wiki/categoria-desconocida/bourbon', '/wiki/granos', '/wiki/procesos/bourbon']) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      );
      expect(await screen.findByText('404 — Ruta no encontrada')).toBeInTheDocument();
      unmount();
    }
  });

  it('renders FlavorWheelView at route "/flavor-wheel"', async () => {
    render(
      <MemoryRouter initialEntries={['/flavor-wheel']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByText('Rueda de Sabores SCA')).toBeInTheDocument();
    expect(screen.getByText('CATA SCA')).toBeInTheDocument();
  });

  it('renders NotFoundView on unknown route with a functional recovery return link to home', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/some-unknown-path']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByText('404 — Ruta no encontrada')).toBeInTheDocument();
    const returnLink = screen.getByRole('link', { name: /volver al inicio/i });
    expect(returnLink).toHaveAttribute('href', '/');

    await user.click(returnLink);
    expect(await screen.findByText('Precisión de barra en cada extracción.')).toBeInTheDocument();
  });

  it('renders NotFoundView when an invalid brew method slug is passed', async () => {
    render(
      <MemoryRouter initialEntries={['/brew/metodo-inexistente']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByText('404 — Ruta no encontrada')).toBeInTheDocument();
  });
});

describe('AppLayout footer', () => {
  it('shows the current app version in the footer', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(screen.getByTestId('app-version')).toHaveTextContent(/^Versión \d+\.\d+\.\d+$/);
  });
});
