import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SunburstFlavorWheelSvg } from '../components/SunburstFlavorWheelSvg';
import { useFlavorSelection } from '../hooks/useFlavorSelection';

const Harness: React.FC = () => {
  const selection = useFlavorSelection();
  return <SunburstFlavorWheelSvg selection={selection} />;
};

function renderWheel(url = '/flavor-wheel'): void {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Harness />
    </MemoryRouter>,
  );
}

const items = () => screen.getAllByRole('treeitem');
const item = (name: string) => screen.getByRole('treeitem', { name });
const isDimmed = (name: string) => item(name).getAttribute('data-dimmed') === 'true';

function mockMatchMedia(matches: (query: string) => boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: matches(query),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SunburstFlavorWheelSvg — pointer', () => {
  it('renders the full wheel with 9 families, 20 subfamilies and 59 descriptors and no selection', () => {
    renderWheel();
    expect(screen.getByRole('tree', { name: 'Rueda de sabores SCA' })).toBeInTheDocument();
    expect(items()).toHaveLength(88);
    expect(items().filter((el) => el.getAttribute('aria-level') === '1')).toHaveLength(9);
    expect(items().filter((el) => el.getAttribute('aria-level') === '2')).toHaveLength(20);
    expect(items().filter((el) => el.getAttribute('aria-level') === '3')).toHaveLength(59);
    expect(items().some((el) => el.getAttribute('aria-selected') === 'true')).toBe(false);
    expect(screen.queryByRole('button', { name: 'Volver a la rueda completa' })).not.toBeInTheDocument();
  });

  it('zooms into Frutal: 4 subfamilies, 14 descriptors and a back button in the center', async () => {
    renderWheel();
    await userEvent.click(item('Frutal'));
    expect(items()).toHaveLength(18);
    const back = screen.getByRole('button', { name: 'Volver a la rueda completa' });
    expect(within(back).getByText('Frutal')).toBeInTheDocument();
  });

  it('highlights a subfamily and its descriptors and dims its siblings', async () => {
    renderWheel('/flavor-wheel?node=fruity');
    await userEvent.click(item('Frutos rojos'));
    expect(item('Frutos rojos')).toHaveAttribute('aria-selected', 'true');
    expect(isDimmed('Frutos rojos')).toBe(false);
    expect(isDimmed('Mora')).toBe(false);
    expect(isDimmed('Cítrico')).toBe(true);
    expect(isDimmed('Limón')).toBe(true);
  });

  it('highlights a descriptor with its subfamily inside the family branch', async () => {
    renderWheel();
    await userEvent.click(item('Mora'));
    expect(items()).toHaveLength(18);
    expect(item('Mora')).toHaveAttribute('aria-selected', 'true');
    expect(isDimmed('Frutos rojos')).toBe(false);
    expect(isDimmed('Frambuesa')).toBe(true);
    expect(isDimmed('Cítrico')).toBe(true);
  });

  it('returns to the full wheel from the center', async () => {
    renderWheel('/flavor-wheel?node=fruity');
    await userEvent.click(screen.getByRole('button', { name: 'Volver a la rueda completa' }));
    expect(items()).toHaveLength(88);
    expect(items().some((el) => el.getAttribute('aria-selected') === 'true')).toBe(false);
  });

  it('draws a label only where it fits but names every segment', () => {
    renderWheel();
    const tree = screen.getByRole('tree');
    expect(within(tree).getByText('Frutal')).toBeInTheDocument();
    for (const el of items()) {
      expect(el.getAttribute('aria-label')).toBeTruthy();
    }
  });
});

describe('SunburstFlavorWheelSvg — keyboard', () => {
  it('has a single tab stop', () => {
    renderWheel();
    expect(items().filter((el) => el.getAttribute('tabindex') === '0')).toHaveLength(1);
  });

  it('moves clockwise to the next family with ArrowRight', async () => {
    renderWheel();
    await userEvent.tab();
    expect(document.activeElement).toBe(item('Frutal'));
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(item('Floral'));
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(document.activeElement).toBe(item('Otros'));
  });

  it('jumps to the first and last sibling with Home and End', async () => {
    renderWheel();
    await userEvent.tab();
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(item('Otros'));
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(item('Frutal'));
  });

  it('goes down to the first subfamily and selects it with Enter', async () => {
    renderWheel();
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(item('Frutos rojos'));
    await userEvent.keyboard('{Enter}');
    expect(item('Frutos rojos')).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(item('Frutos rojos'));
    expect(items()).toHaveLength(18);
  });

  it('selecting a family with Space moves focus into its branch', async () => {
    renderWheel();
    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(items()).toHaveLength(18);
    expect(document.activeElement).toBe(item('Frutos rojos'));
  });

  it('Escape returns to the full wheel with focus on the family', async () => {
    renderWheel('/flavor-wheel?node=fruity.citrus');
    await userEvent.tab();
    await userEvent.keyboard('{Escape}');
    expect(items()).toHaveLength(88);
    expect(document.activeElement).toBe(item('Frutal'));
  });

  it('ArrowUp from a subfamily in the zoomed branch returns to the family on the full wheel', async () => {
    renderWheel('/flavor-wheel?node=fruity.citrus');
    await userEvent.tab();
    await userEvent.keyboard('{ArrowUp}');
    expect(items()).toHaveLength(88);
    expect(document.activeElement).toBe(item('Frutal'));
  });
});

describe('SunburstFlavorWheelSvg — motion', () => {
  it('animates the zoom when motion is allowed', async () => {
    mockMatchMedia(() => false);
    renderWheel();
    await userEvent.click(item('Frutal'));
    expect(screen.getByTestId('wheel-layer')).toHaveClass('fw-animate');
  });

  it('skips the animation with prefers-reduced-motion', async () => {
    mockMatchMedia((query) => query.includes('prefers-reduced-motion'));
    renderWheel();
    await userEvent.click(item('Frutal'));
    expect(screen.getByTestId('wheel-layer')).not.toHaveClass('fw-animate');
  });

  it('skips the animation for keyboard-initiated zooms', async () => {
    mockMatchMedia(() => false);
    renderWheel();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByTestId('wheel-layer')).not.toHaveClass('fw-animate');
  });
});
