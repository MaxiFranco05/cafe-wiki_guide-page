import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { BrewStationView } from '../views/BrewStationView';

function renderStation(entry = '/brew/v60') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/brew/:methodSlug" element={<BrewStationView />} />
      </Routes>
    </MemoryRouter>
  );
}

const trigger = () => screen.getByRole('button', { name: /Receta activa:/ });
const timeline = () => screen.getByRole('region', { name: /^Fases/ });

async function openSelector(user: ReturnType<typeof userEvent.setup>) {
  await user.click(trigger());
  return screen.getByRole('dialog', { name: /Recetas para Hario V60/ });
}

describe('BrewStationView recipe selection (C-14)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts on the standard recipe exactly like before', () => {
    renderStation();
    expect(trigger()).toHaveAccessibleName('Elegir receta. Receta activa: V60 Estándar (3 Vertidos)');
    expect(screen.getByLabelText(/agua total \(ml\)/i)).toHaveValue(240);
  });

  it('choosing Método 4:6 with 20 g recalculates water, pours, duration and temperature, and survives a reload', async () => {
    const user = userEvent.setup();
    const { unmount } = renderStation();
    fireEvent.change(screen.getByLabelText(/café seco \(g\)/i), { target: { value: '20' } });

    const selector = await openSelector(user);
    const card = within(selector).getByRole('heading', { name: 'Método 4:6 (WBrC 2016)' }).closest('article')!;
    await user.click(within(card).getByRole('button', { name: 'Usar esta receta' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/café seco \(g\)/i)).toHaveValue(20);
    expect(screen.getByLabelText(/agua total \(ml\)/i)).toHaveValue(300);
    expect(timeline()).toHaveTextContent('3:30 · 300 g agua');
    expect(within(timeline()).getAllByText('+60 g')).toHaveLength(5);
    expect(trigger()).toHaveTextContent('1:15 · 92 °C');
    // Intensity chips and water temperature follow the recipe, not the C-02 method profile.
    expect(screen.getByRole('button', { name: /liviano/i })).toHaveTextContent('1:16');
    expect(screen.getByRole('button', { name: /normal/i })).toHaveTextContent('1:15');
    expect(screen.getByRole('button', { name: /fuerte/i })).toHaveTextContent('1:13.5');
    expect(screen.queryByText(/93 °C/)).not.toBeInTheDocument();

    unmount();
    renderStation();
    expect(trigger()).toHaveAccessibleName(/Método 4:6/);
  });

  it('opens the recipe from ?recipe= and ignores ids of other methods', () => {
    const { unmount } = renderStation('/brew/v60?recipe=v60-kasuya-4-6');
    expect(trigger()).toHaveAccessibleName(/Método 4:6/);
    unmount();
    renderStation('/brew/v60?recipe=aeropress-alan-adler');
    expect(trigger()).toHaveAccessibleName(/V60 Estándar/);
  });

  it('runs the full custom recipe flow: create, duplicate, share, delete and re-import', async () => {
    const user = userEvent.setup();
    renderStation();

    // Create from scratch.
    let selector = await openSelector(user);
    await user.click(within(selector).getAllByRole('button', { name: 'Crear receta' })[0]!);
    const editor = screen.getByRole('dialog', { name: 'Nueva receta' });
    await user.type(within(editor).getByLabelText('Nombre de la receta'), 'Mi V60');
    await user.click(within(editor).getByRole('button', { name: 'Guardar y usar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger()).toHaveAccessibleName('Elegir receta. Receta activa: Mi V60');
    expect(within(timeline()).getByText('Verté 45 g hasta alcanzar 45 g.')).toBeInTheDocument();
    expect(within(timeline()).queryByText('custom')).not.toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Temporizador de preparación' })).not.toHaveTextContent('custom');

    // Duplicate an author recipe.
    selector = await openSelector(user);
    await user.click(within(selector).getByRole('button', { name: 'Duplicar Método 4:6 (WBrC 2016)' }));
    const dup = screen.getByRole('dialog', { name: 'Duplicar receta' });
    expect(within(dup).getByLabelText('Título de la fase 1')).toHaveValue('Vertido 1 (40% · Base)');
    await user.click(within(dup).getByRole('button', { name: 'Guardar y usar' }));
    expect(trigger()).toHaveAccessibleName(/Método 4:6 \(WBrC 2016\) \(copia\)/);

    // Share "Mi V60".
    selector = await openSelector(user);
    await user.click(within(selector).getByRole('button', { name: 'Compartir Mi V60' }));
    const sharePanel = screen.getByRole('dialog', { name: 'Compartir e importar' });
    await user.click(within(sharePanel).getByRole('button', { name: 'Copiar JSON' }));
    expect(await within(sharePanel).findByText('JSON copiado.')).toBeInTheDocument();
    const exported = await navigator.clipboard.readText();
    expect(JSON.parse(exported)).toMatchObject({ schemaVersion: 1, recipe: { title: 'Mi V60' } });
    await user.click(within(sharePanel).getByRole('button', { name: 'Cerrar' }));

    // Delete it.
    selector = screen.getByRole('dialog', { name: /Recetas para Hario V60/ });
    await user.click(within(selector).getByRole('button', { name: 'Eliminar Mi V60' }));
    await user.click(
      within(screen.getByRole('alertdialog', { name: '¿Eliminar "Mi V60"?' })).getByRole('button', { name: 'Eliminar' })
    );
    expect(within(selector).queryByRole('heading', { name: 'Mi V60' })).not.toBeInTheDocument();

    // Re-import the shared JSON.
    await user.click(within(selector).getByRole('button', { name: 'Importar JSON' }));
    const importPanel = screen.getByRole('dialog', { name: 'Compartir e importar' });
    fireEvent.change(within(importPanel).getByLabelText('Pegá el JSON de la receta'), { target: { value: exported } });
    await user.click(within(importPanel).getByRole('button', { name: 'Importar receta' }));
    expect(within(importPanel).getByText('Receta importada.')).toBeInTheDocument();
    expect(trigger()).toHaveAccessibleName('Elegir receta. Receta activa: Mi V60');
    expect(within(selector).getByRole('heading', { name: 'Mi V60' })).toBeInTheDocument();
  });

  it('locks the recipe trigger while the timer runs', async () => {
    const user = userEvent.setup();
    renderStation();
    await user.click(screen.getAllByRole('button', { name: /iniciar/i })[0]!);
    expect(trigger()).toBeDisabled();
    expect(trigger()).toHaveAccessibleDescription(/Receta bloqueada/);
  });
});
