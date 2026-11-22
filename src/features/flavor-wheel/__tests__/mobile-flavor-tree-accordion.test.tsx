import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { MobileFlavorTreeAccordion } from '../components/MobileFlavorTreeAccordion';
import { useFlavorSelection } from '../hooks/useFlavorSelection';

const Harness: React.FC = () => {
  const selection = useFlavorSelection();
  const location = useLocation();
  return (
    <>
      <MobileFlavorTreeAccordion selection={selection} />
      <output data-testid="search">{location.search}</output>
    </>
  );
};

function renderAccordion(url = '/flavor-wheel'): void {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Harness />
    </MemoryRouter>,
  );
}

const button = (name: RegExp) => screen.getByRole('button', { name });

describe('MobileFlavorTreeAccordion', () => {
  it('lists the 9 families collapsed with their descriptor count', () => {
    renderAccordion();
    const families = screen.getAllByRole('button').filter((el) => el.getAttribute('data-tier') === '1');
    expect(families).toHaveLength(9);
    expect(families.every((el) => el.getAttribute('aria-expanded') === 'false')).toBe(true);
    expect(button(/^Frutal/)).toHaveTextContent('14 descriptores');
    expect(screen.queryByRole('button', { name: /^Frutos rojos/ })).not.toBeInTheDocument();
  });

  it('selects the three levels and keeps the path expanded', async () => {
    renderAccordion();
    await userEvent.click(button(/^Frutal/));
    await userEvent.click(button(/^Frutos rojos/));
    await userEvent.click(button(/^Mora$/));
    expect(button(/^Frutal/)).toHaveAttribute('aria-expanded', 'true');
    expect(button(/^Frutos rojos/)).toHaveAttribute('aria-expanded', 'true');
    expect(button(/^Mora$/)).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('search').textContent).toBe('?node=fruity.berry.blackberry');
  });

  it('opens the path of a deep-linked node', () => {
    renderAccordion('/flavor-wheel?node=fruity.citrus.lemon');
    expect(button(/^Frutal/)).toHaveAttribute('aria-expanded', 'true');
    expect(button(/^Cítrico/)).toHaveAttribute('aria-expanded', 'true');
    expect(button(/^Limón$/)).toHaveAttribute('aria-pressed', 'true');
  });

  it('collapses an open node that is already selected', async () => {
    renderAccordion('/flavor-wheel?node=fruity.berry');
    await userEvent.click(button(/^Frutos rojos/));
    expect(screen.getByTestId('search').textContent).toBe('?node=fruity');
    await userEvent.click(button(/^Frutal/));
    expect(screen.getByTestId('search').textContent).toBe('');
    expect(button(/^Frutal/)).toHaveAttribute('aria-expanded', 'false');
  });

  it('gives every row a touch target class of at least 44 px', () => {
    renderAccordion('/flavor-wheel?node=fruity.berry');
    for (const el of screen.getAllByRole('button')) {
      expect(el.className).toMatch(/fw-acc-(row|chip)/);
    }
  });
});
