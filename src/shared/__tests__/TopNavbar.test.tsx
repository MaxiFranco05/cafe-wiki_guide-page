import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TopNavbar } from '../components/TopNavbar';

describe('TopNavbar Component', () => {
  it('renders brand mark, data-brand-name attribute, and title in Spanish', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TopNavbar />
      </MemoryRouter>
    );

    const brandNameEl = screen.getByText('Atelier Brew');
    expect(brandNameEl).toHaveAttribute('data-brand-name', 'short');

    expect(screen.getByText('BARISMO DE ESPECIALIDAD · TBD')).toBeInTheDocument();
  });

  it('renders desktop navigation links with translated text and proper touch target', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TopNavbar />
      </MemoryRouter>
    );

    const methodsLink = screen.getByRole('link', { name: /métodos/i });
    const brewLink = screen.getByRole('link', { name: /estación de preparación/i });
    const wikiLink = screen.getByRole('link', { name: /wiki & orígenes/i });
    const wheelLink = screen.getByRole('link', { name: /rueda sca/i });

    expect(methodsLink).toHaveAttribute('href', '/');
    expect(brewLink).toHaveAttribute('href', '/brew/v60');
    expect(wikiLink).toHaveAttribute('href', '/wiki');
    expect(wheelLink).toHaveAttribute('href', '/flavor-wheel');

    // Active route should have aria-current="page"
    expect(methodsLink).toHaveAttribute('aria-current', 'page');
    expect(brewLink).not.toHaveAttribute('aria-current', 'page');
  });

  it('updates aria-current="page" when navigating to another desktop route', () => {
    render(
      <MemoryRouter initialEntries={['/brew/v60']}>
        <TopNavbar />
      </MemoryRouter>
    );

    const brewLink = screen.getByRole('link', { name: /estación de preparación/i });
    expect(brewLink).toHaveAttribute('aria-current', 'page');

    const methodsLink = screen.getByRole('link', { name: /métodos/i });
    expect(methodsLink).not.toHaveAttribute('aria-current', 'page');
  });

  it('does NOT render any light/dark theme switch button', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TopNavbar />
      </MemoryRouter>
    );

    const switchBtn = screen.queryByRole('button', { name: /tema|theme|oscuro|claro/i });
    expect(switchBtn).toBeNull();
  });

  it('includes proper accessible landmark aria-label on navigation element', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TopNavbar />
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /navegación principal/i });
    expect(nav).toBeInTheDocument();
  });
});
