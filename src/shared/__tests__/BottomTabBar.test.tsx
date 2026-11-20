import { describe, it, expect, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { BottomTabBar } from '../components/BottomTabBar';
import { TopNavbar } from '../components/TopNavbar';
import { rememberBrewMethod, resetLastBrewMethodStore } from '../hooks/useLastBrewMethod';

describe('BottomTabBar Component', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetLastBrewMethodStore();
  });

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

describe('Brew station navigation remembers the last method (C-08)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetLastBrewMethodStore();
  });

  it('points "Preparar" and "Estación de Preparación" to the last visited method', () => {
    act(() => rememberBrewMethod('chemex'));
    render(
      <MemoryRouter initialEntries={['/wiki']}>
        <TopNavbar />
        <BottomTabBar />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /preparar/i })).toHaveAttribute('href', '/brew/chemex');
    expect(screen.getByRole('link', { name: /estación de preparación/i })).toHaveAttribute('href', '/brew/chemex');
  });

  it('marks the brew items active on any /brew/* route even if it is not the stored method', () => {
    render(
      <MemoryRouter initialEntries={['/brew/aeropress']}>
        <TopNavbar />
        <BottomTabBar />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /preparar/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /estación de preparación/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /preparar/i })).toHaveAttribute('href', '/brew/v60');
  });
});
