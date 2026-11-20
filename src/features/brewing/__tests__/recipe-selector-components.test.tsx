import { describe, it, expect, vi } from 'vitest';
import { useRef, useState } from 'react';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import userEvent from '@testing-library/user-event';
import { buildCustomRecipe, exportCustomRecipeJson } from '../../../domain/brewing';
import type { CustomBrewRecipe, CustomRecipeDraft } from '../../../domain/schemas';
import { getMethodBySlug } from '../../../data/methods';
import { getRecipeById, getRecipesByMethod } from '../../../data/recipes';
import { RecipeSheet } from '../components/RecipeSheet';
import { RecipeSelectorTrigger } from '../components/RecipeSelectorTrigger';
import { RecipeSelectorModal } from '../components/RecipeSelectorModal';
import { CustomRecipeEditorModal } from '../components/CustomRecipeEditorModal';
import { RecipeShareImportPanel } from '../components/RecipeShareImportPanel';
import { ConfirmDeleteRecipeDialog } from '../components/ConfirmDeleteRecipeDialog';
import { createEmptyEditorForm, groupRecipesForSelector } from '../utils/recipe-display.helpers';
import type { ImportOutcome } from '../hooks/useRecipeLibrary';

const v60 = getMethodBySlug('v60')!;
const kasuya = getRecipeById('v60-kasuya-4-6')!;

function myV60(methodId: 'v60' | 'aeropress' = 'v60'): CustomBrewRecipe {
  const built = buildCustomRecipe(
    {
      methodId,
      title: 'Mi V60',
      phases: [
        { type: 'bloom', title: 'Bloom', durationSeconds: 45, waterAmount: 50 },
        { type: 'pour', title: 'Vertido', durationSeconds: 135, waterAmount: 200 },
      ],
    },
    getMethodBySlug(methodId)!
  );
  if (!built.ok) throw new Error('fixture');
  return built.recipe;
}

const noop = () => undefined;

function SheetHarness() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        Abrir
      </button>
      <RecipeSheet open={open} onClose={() => setOpen(false)} title="Hoja de prueba" closeLabel="Cerrar">
        <p>Contenido</p>
      </RecipeSheet>
    </>
  );
}

describe('RecipeSheet', () => {
  it('opens as a modal dialog, closes with Escape and returns focus to the opener', async () => {
    const user = userEvent.setup();
    render(<SheetHarness />);
    const opener = screen.getByRole('button', { name: 'Abrir' });
    await user.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'Hoja de prueba' });
    expect(dialog).toHaveAttribute('open');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('closes with the close button', async () => {
    const user = userEvent.setup();
    render(<SheetHarness />);
    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('RecipeSelectorTrigger', () => {
  it('shows the active recipe with author, ratio and temperature', () => {
    render(<RecipeSelectorTrigger recipe={kasuya} method={v60} locked={false} onOpen={noop} />);
    const trigger = screen.getByRole('button', { name: /Receta activa: Método 4:6/ });
    expect(trigger).toHaveTextContent('1:15 · 92 °C');
  });

  it('does not open while locked', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<RecipeSelectorTrigger recipe={kasuya} method={v60} locked onOpen={onOpen} lockedHintId="hint" />);
    const trigger = screen.getByRole('button', { name: /Receta activa/ });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute('aria-describedby', 'hint');
    await user.click(trigger);
    expect(onOpen).not.toHaveBeenCalled();
  });
});

describe('RecipeSelectorModal', () => {
  function renderSelector(custom: CustomBrewRecipe[] = [], activeId = 'v60-standard') {
    const handlers = {
      onUse: vi.fn(),
      onDuplicate: vi.fn(),
      onEdit: vi.fn(),
      onShare: vi.fn(),
      onDelete: vi.fn(),
      onCreate: vi.fn(),
      onImport: vi.fn(),
    };
    render(
      <RecipeSelectorModal
        open
        onClose={noop}
        method={v60}
        groups={groupRecipesForSelector(getRecipesByMethod('v60'), custom)}
        activeRecipeId={activeId}
        {...handlers}
      />
    );
    return handlers;
  }

  it('lists the three V60 groups and marks the active recipe', () => {
    renderSelector([myV60()]);
    const dialog = screen.getByRole('dialog', { name: 'Recetas para Hario V60' });
    const standard = within(dialog).getByRole('region', { name: 'Estándar (por defecto)' });
    const catalog = within(dialog).getByRole('region', { name: 'Autores y Clásicas' });
    const mine = within(dialog).getByRole('region', { name: 'Mis Recetas' });
    expect(within(standard).getByRole('heading', { name: 'V60 Estándar (3 Vertidos)' })).toBeInTheDocument();
    expect(within(catalog).getByRole('heading', { name: 'Método 4:6 (WBrC 2016)' })).toBeInTheDocument();
    expect(within(mine).getByRole('heading', { name: 'Mi V60' })).toBeInTheDocument();
    expect(within(standard).getByText('En uso')).toBeInTheDocument();
    expect(within(standard).getByRole('button', { name: 'Receta en uso' })).toBeDisabled();
  });

  it('shows the Kasuya card facts and process', () => {
    renderSelector();
    const card = screen.getByRole('heading', { name: 'Método 4:6 (WBrC 2016)' }).closest('article')!;
    expect(card).toHaveTextContent('Tetsu Kasuya');
    expect(card).toHaveTextContent('Avanzada');
    expect(card).toHaveTextContent('1:15');
    expect(card).toHaveTextContent('3:30');
    expect(card).toHaveTextContent('92 °C');
    expect(card).toHaveTextContent(/Cinco vertidos iguales/);
    expect(card).toHaveTextContent('Destaca:');
  });

  it('offers edit/share/delete only on custom recipes and wires actions', async () => {
    const user = userEvent.setup();
    const mine = myV60();
    const handlers = renderSelector([mine]);
    expect(screen.queryByRole('button', { name: 'Editar Método 4:6 (WBrC 2016)' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar Método 4:6 (WBrC 2016)' })).not.toBeInTheDocument();

    const kasuyaCard = screen.getByRole('heading', { name: 'Método 4:6 (WBrC 2016)' }).closest('article')!;
    await user.click(within(kasuyaCard).getByRole('button', { name: 'Usar esta receta' }));
    expect(handlers.onUse).toHaveBeenCalledWith('v60-kasuya-4-6');
    await user.click(screen.getByRole('button', { name: 'Duplicar Método 4:6 (WBrC 2016)' }));
    expect(handlers.onDuplicate).toHaveBeenCalledWith(kasuya);
    await user.click(screen.getByRole('button', { name: 'Editar Mi V60' }));
    expect(handlers.onEdit).toHaveBeenCalledWith(mine);
    await user.click(screen.getByRole('button', { name: 'Compartir Mi V60' }));
    expect(handlers.onShare).toHaveBeenCalledWith(mine);
    await user.click(screen.getByRole('button', { name: 'Eliminar Mi V60' }));
    expect(handlers.onDelete).toHaveBeenCalledWith(mine);
  });

  it('shows the empty state with create and import actions', async () => {
    const user = userEvent.setup();
    const handlers = renderSelector();
    const mine = screen.getByRole('region', { name: 'Mis Recetas' });
    expect(mine).toHaveTextContent('Todavía no guardaste recetas para Hario V60.');
    await user.click(within(mine).getByRole('button', { name: 'Crear receta' }));
    await user.click(within(mine).getByRole('button', { name: 'Importar' }));
    expect(handlers.onCreate).toHaveBeenCalled();
    expect(handlers.onImport).toHaveBeenCalled();
  });
});

describe('CustomRecipeEditorModal', () => {
  function renderEditor(onSave = vi.fn((_draft: CustomRecipeDraft) => ({ ok: true as const, recipe: myV60() }))) {
    const form = createEmptyEditorForm(v60);
    render(
      <CustomRecipeEditorModal open method={v60} mode="new" initialForm={form} onCancel={noop} onSave={onSave} />
    );
    return onSave;
  }

  it('creates "Mi V60" with four phases and shows live totals', async () => {
    const user = userEvent.setup();
    const onSave = renderEditor();
    await user.type(screen.getByLabelText('Nombre de la receta'), 'Mi V60');

    const water = (i: number) => screen.getByLabelText(`Agua de la fase ${i} en mililitros`);
    const duration = (i: number) => screen.getByLabelText(`Duración de la fase ${i} en segundos`);
    await user.click(screen.getByRole('button', { name: 'Agregar fase' }));
    // 4 phases: Bloom 45/50, Vertido 60/120, Drenaje->Vertido 45/80, Vertido(new)->Drenaje 30/0
    fireEvent.change(duration(1), { target: { value: '45' } });
    fireEvent.change(water(1), { target: { value: '50' } });
    fireEvent.change(duration(2), { target: { value: '60' } });
    fireEvent.change(water(2), { target: { value: '120' } });
    fireEvent.change(screen.getByLabelText('Tipo de la fase 3'), { target: { value: 'pour' } });
    fireEvent.change(duration(3), { target: { value: '45' } });
    fireEvent.change(water(3), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText('Tipo de la fase 4'), { target: { value: 'drawdown' } });
    fireEvent.change(duration(4), { target: { value: '30' } });
    fireEvent.change(water(4), { target: { value: '0' } });

    const summary = screen.getByRole('status', { name: 'Resumen de la receta' });
    expect(summary).toHaveTextContent('3:00');
    expect(summary).toHaveTextContent('250 ml');

    await user.click(screen.getByRole('button', { name: 'Guardar y usar' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const draft = onSave.mock.calls[0]![0];
    expect(draft.title).toBe('Mi V60');
    expect(draft.phases.map((p) => [p.type, p.durationSeconds, p.waterAmount])).toEqual([
      ['bloom', 45, 50],
      ['pour', 60, 120],
      ['pour', 45, 80],
      ['drawdown', 30, 0],
    ]);
  });

  it('updates the total duration live', () => {
    renderEditor();
    const summary = screen.getByRole('status', { name: 'Resumen de la receta' });
    expect(summary).toHaveTextContent('3:00');
    fireEvent.change(screen.getByLabelText('Duración de la fase 1 en segundos'), { target: { value: '60' } });
    expect(summary).toHaveTextContent('3:15');
  });

  it('blocks saving without a name or water and announces inline errors', async () => {
    const user = userEvent.setup();
    const onSave = renderEditor();
    for (const i of [1, 2, 3]) {
      fireEvent.change(screen.getByLabelText(`Agua de la fase ${i} en mililitros`), { target: { value: '0' } });
    }
    await user.click(screen.getByRole('button', { name: 'Guardar y usar' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Revisá 2 campos antes de guardar.');
    const name = screen.getByLabelText('Nombre de la receta');
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription('Poné un nombre para identificar tu receta.');
    expect(screen.getByText('Al menos una fase debe aportar agua.')).toBeInTheDocument();
  });

  it('disables removing the last remaining phase', async () => {
    const user = userEvent.setup();
    renderEditor();
    await user.click(screen.getByRole('button', { name: 'Quitar fase 3' }));
    await user.click(screen.getByRole('button', { name: 'Quitar fase 2' }));
    expect(screen.getByRole('button', { name: 'Quitar fase 1' })).toBeDisabled();
  });
});

describe('RecipeShareImportPanel', () => {
  function renderPanel(options: {
    tab?: 'share' | 'import';
    writeClipboard?: (text: string) => Promise<void>;
    onImport?: (raw: string) => ImportOutcome;
  }) {
    const recipe = myV60();
    const onImport = options.onImport ?? vi.fn((): ImportOutcome => ({ status: 'imported', recipe }));
    render(
      <MemoryRouter>
      <RecipeShareImportPanel
        open
        onClose={noop}
        method={v60}
        initialTab={options.tab ?? 'share'}
        shareRecipe={recipe}
        onImport={onImport}
        onResolveConflict={vi.fn((): ImportOutcome => ({ status: 'imported', recipe }))}
        writeClipboard={options.writeClipboard}
      />
      </MemoryRouter>
    );
    return { recipe, onImport };
  }

  it('copies the exported JSON and confirms', async () => {
    const user = userEvent.setup();
    const writeClipboard = vi.fn(async () => undefined);
    renderPanel({ writeClipboard });
    await user.click(screen.getByRole('button', { name: 'Copiar JSON' }));
    expect(writeClipboard).toHaveBeenCalledWith(expect.stringContaining('"schemaVersion": 1'));
    expect(await screen.findByText('JSON copiado.')).toBeInTheDocument();
  });

  it('falls back to selectable text when the clipboard is blocked', async () => {
    const user = userEvent.setup();
    renderPanel({ writeClipboard: vi.fn(async () => Promise.reject(new Error('denied'))) });
    await user.click(screen.getByRole('button', { name: 'Copiar JSON' }));
    expect(await screen.findByText('No pudimos usar el portapapeles.')).toBeInTheDocument();
    expect(screen.getByLabelText('JSON de la receta')).toHaveAttribute('readonly');
  });

  it('shows a translated error for corrupt JSON', async () => {
    const user = userEvent.setup();
    renderPanel({
      tab: 'import',
      onImport: () => ({ status: 'invalid', errorCode: 'invalid_json', issues: ['Unexpected end of JSON input'] }),
    });
    fireEvent.change(screen.getByLabelText('Pegá el JSON de la receta'), { target: { value: '{ "schemaVersion": 1, ' } });
    await user.click(screen.getByRole('button', { name: 'Importar receta' }));
    expect(screen.getByRole('alert')).toHaveTextContent('El texto no es un JSON válido.');
  });

  it('tells the user when the recipe belongs to another method and links to it', async () => {
    const user = userEvent.setup();
    const aero = myV60('aeropress');
    renderPanel({
      tab: 'import',
      onImport: () => ({ status: 'other_method', recipe: aero, methodId: 'aeropress' }),
    });
    fireEvent.change(screen.getByLabelText('Pegá el JSON de la receta'), {
      target: { value: exportCustomRecipeJson(aero) },
    });
    await user.click(screen.getByRole('button', { name: 'Importar receta' }));
    expect(screen.getByText('"Mi V60" es una receta de AeroPress.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Prepararla en AeroPress' })).toHaveAttribute(
      'href',
      `/brew/aeropress?recipe=${aero.id}`
    );
  });
});

describe('ConfirmDeleteRecipeDialog', () => {
  it('confirms or cancels deletion of a custom recipe', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDeleteRecipeDialog open recipe={myV60()} isActive onCancel={onCancel} onConfirm={onConfirm} />);
    const dialog = screen.getByRole('alertdialog', { name: '¿Eliminar "Mi V60"?' });
    expect(dialog).toHaveTextContent('la estación vuelve a la Estándar');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
