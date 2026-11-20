import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { TopNavbar } from '../components/TopNavbar';

describe('GlobalSearch in TopNavbar (Strict TDD)', () => {
  it('renders accessible search input inside TopNavbar', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TopNavbar />
      </MemoryRouter>
    );

    const input = screen.getByRole('searchbox', { name: /buscar en toda la guía de café/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('placeholder', 'Buscar cafetera, grano, cata...');
  });

  it('finds brew methods from catalog when typing method queries like v60 or espresso', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <TopNavbar />
      </MemoryRouter>
    );

    const input = screen.getByRole('searchbox', { name: /buscar en toda la guía de café/i });
    await user.type(input, 'chemex');

    const listbox = screen.getByRole('listbox', { name: /resultados de búsqueda/i });
    expect(listbox).toBeInTheDocument();
    // The brew method comes first; the Chemex wiki entry (Cafetera) is also offered.
    const options = screen.getAllByRole('option', { name: /Chemex/i });
    expect(options[0]).toHaveTextContent(/Chemex/i);
    expect(options.some((option) => /cafetera/i.test(option.textContent ?? ''))).toBe(true);
  });

  it('finds Wiki entries and SCA Flavor Wheel across all sections', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <TopNavbar />
      </MemoryRouter>
    );

    const input = screen.getByRole('searchbox', { name: /buscar en toda la guía de café/i });
    await user.type(input, 'bourbon');
    expect(screen.getByRole('option', { name: /^Bourbon.*Varietal/i })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Granos y Varietales/i })).toBeNull();

    await user.clear(input);
    await user.type(input, 'geisha');
    expect(screen.getByRole('option', { name: /Geisha.*Varietal/i })).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, 'floral');
    expect(screen.getByRole('option', { name: /Rueda de Sabores SCA/i })).toBeInTheDocument();
  });

  it('navigates via keyboard ArrowDown + Enter and via click, then closes dropdown', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <TopNavbar />
        <Routes>
          <Route path="/" element={<div>Home</div>} />
          <Route path="/brew/chemex" element={<div>Chemex Destination</div>} />
          <Route path="/wiki/varietales/bourbon" element={<div>Bourbon Destination</div>} />
        </Routes>
      </MemoryRouter>
    );

    const input = screen.getByRole('searchbox', { name: /buscar en toda la guía de café/i });
    await user.type(input, 'chemex');
    await user.keyboard('{ArrowDown}{Enter}');

    expect(screen.getByText('Chemex Destination')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).toBeNull();

    await user.type(input, 'bourbon');
    const option = screen.getByRole('option', { name: /^Bourbon.*Varietal/i });
    await user.click(option);
    expect(screen.getByText('Bourbon Destination')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('closes on Escape/Clear and shows no-results feedback for unmatched queries', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <TopNavbar />
      </MemoryRouter>
    );

    const input = screen.getByRole('searchbox', { name: /buscar en toda la guía de café/i });
    await user.type(input, 'xyz123');
    expect(screen.getByText('Sin resultados para "xyz123"')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();

    await user.type(input, 'v60');
    const clearBtn = screen.getByRole('button', { name: /limpiar búsqueda/i });
    await user.click(clearBtn);
    expect(input).toHaveValue('');
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
