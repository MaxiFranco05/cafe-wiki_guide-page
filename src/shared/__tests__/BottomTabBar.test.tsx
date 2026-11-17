import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { BottomTabBar } from '../components/BottomTabBar';

describe('BottomTabBar Component', () => {
  it('renders 4 accessible navigation items for mobile', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomTabBar />
      </MemoryRouter>
    );

    const methodsTab = screen.getByRole('link', { name: /métodos/i });
    const brewTab = screen.getByRole('link', { name: /preparar/i });
    const wikiTab = screen.getByRole('link', { name: /wiki/i });
    const wheelTab = screen.getByRole('link', { name: /rueda sca/i });

    expect(methodsTab).toBeInTheDocument();
    expect(brewTab).toBeInTheDocument();
    expect(wikiTab).toBeInTheDocument();
    expect(wheelTab).toBeInTheDocument();

    expect(methodsTab).toHaveAttribute('href', '/');
    expect(brewTab).toHaveAttribute('href', '/brew/v60');
    expect(wikiTab).toHaveAttribute('href', '/wiki');
    expect(wheelTab).toHaveAttribute('href', '/flavor-wheel');
  });

  it('indicates the active route with aria-current="page"', () => {
    render(
      <MemoryRouter initialEntries={['/brew/v60']}>
        <BottomTabBar />
      </MemoryRouter>
    );

    const brewTab = screen.getByRole('link', { name: /preparar/i });
    expect(brewTab).toHaveAttribute('aria-current', 'page');

    const methodsTab = screen.getByRole('link', { name: /métodos/i });
    expect(methodsTab).not.toHaveAttribute('aria-current', 'page');
  });

  it('indicates active route when navigating to /wiki and /flavor-wheel', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/wiki']}>
        <BottomTabBar />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /wiki/i })).toHaveAttribute('aria-current', 'page');
    unmount();

    render(
      <MemoryRouter initialEntries={['/flavor-wheel']}>
        <BottomTabBar />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /rueda sca/i })).toHaveAttribute('aria-current', 'page');
  });

  it('includes tactile pressable styling and touch target dimensions of at least 44px', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomTabBar />
      </MemoryRouter>
    );

    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link.className).toMatch(/min-h-\[(?:44|48)px\]/);
      expect(link.className).toContain('pressable');
    });
  });

  it('includes mobile safe area inset padding and accessible landmark aria-label', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomTabBar />
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /navegación móvil/i });
    expect(nav).toBeInTheDocument();
    expect(nav.className).toContain('pb-[env(safe-area-inset-bottom)]');
  });

  it('renders all decorative SVG icons with aria-hidden="true" to prevent screen reader clutter', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <BottomTabBar />
      </MemoryRouter>
    );

    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(4);
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
