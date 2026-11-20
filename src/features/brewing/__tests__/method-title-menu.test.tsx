import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useParams } from 'react-router';
import { MethodSwitcher } from '../components/MethodSwitcher';

function Probe() {
  const { methodSlug } = useParams<{ methodSlug: string }>();
  return <p data-testid="slug">{methodSlug}</p>;
}

function renderMenu(options: { brewing?: boolean; confirm?: (message: string) => boolean } = {}) {
  return render(
    <MemoryRouter initialEntries={['/brew/v60']}>
      <Routes>
        <Route
          path="/brew/:methodSlug"
          element={
            <>
              <MethodSwitcher
                currentSlug="v60"
                isBrewInProgress={options.brewing ?? false}
                confirmDiscard={options.confirm}
              />
              <Probe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

const nameButton = () => screen.getByRole('button', { name: 'Hario V60', description: 'Cambiar cafetera' });

describe('MethodSwitcher as title menu (C-14 header rev 2)', () => {
  it('renders the method name as the level-1 heading button, without a select next to it', () => {
    renderMenu();
    expect(screen.getByRole('heading', { level: 1, name: 'Hario V60' })).toContainElement(nameButton());
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(nameButton()).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens a menu with the 6 methods, the current one checked, and navigates on select', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(nameButton());
    const menu = screen.getByRole('menu', { name: 'Cafeteras' });
    const items = within(menu).getAllByRole('menuitemradio');
    expect(items).toHaveLength(6);
    expect(within(menu).getByRole('menuitemradio', { name: /Hario V60/ })).toHaveAttribute('aria-checked', 'true');
    expect(within(menu).getByRole('menuitemradio', { name: /Hario V60/ })).toHaveFocus();
    await user.click(within(menu).getByRole('menuitemradio', { name: /Chemex/ }));
    expect(screen.getByTestId('slug')).toHaveTextContent('chemex');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('moves with arrow keys and closes with Escape returning focus to the name', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(nameButton());
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(within(menu).getByRole('menuitemradio', { name: /Chemex/ })).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'End' });
    expect(within(menu).getByRole('menuitemradio', { name: /Espresso/ })).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(nameButton()).toHaveFocus();
    expect(screen.getByTestId('slug')).toHaveTextContent('v60');
  });

  it('asks before discarding a brew in progress and stays when cancelled', async () => {
    const user = userEvent.setup();
    const confirm = vi.fn(() => false);
    renderMenu({ brewing: true, confirm });
    await user.click(nameButton());
    await user.click(screen.getByRole('menuitemradio', { name: /Chemex/ }));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('slug')).toHaveTextContent('v60');
  });

  it('closes when clicking outside', async () => {
    const user = userEvent.setup();
    renderMenu();
    await user.click(nameButton());
    await user.click(screen.getByTestId('slug'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
