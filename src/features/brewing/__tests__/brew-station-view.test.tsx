import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Link, Route, Routes } from 'react-router';
import { BrewStationView } from '../views/BrewStationView';
import { NotFoundView } from '../../../shared/components/NotFoundView';

function renderBrewRoute(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <nav aria-label="test-nav">
        <Link to="/brew/espresso">Switch to Espresso</Link>
      </nav>
      <Routes>
        <Route path="/brew/:methodSlug" element={<BrewStationView />} />
        <Route path="*" element={<NotFoundView />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('BrewStationView Integration (C-05 Strict TDD)', () => {
  it('pre-selects valid ?profile=light on V60 and falls back safely on unrecognized ?profile', () => {
    const { unmount } = renderBrewRoute('/brew/v60?profile=light');

    expect(screen.getByRole('heading', { name: 'Hario V60' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /liviano/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText(/café seco \(g\)/i)).toHaveValue(15);
    expect(screen.getByLabelText(/agua total \(ml\)/i)).toHaveValue(255);
    // C-14 header rev 2: the compact recipe pill shows the recipe name (the author lives in the selector card)
    expect(screen.getByRole('button', { name: /Receta activa: V60 Estándar/ })).toBeInTheDocument();

    unmount();

    renderBrewRoute('/brew/v60?profile=invalid-tier');
    expect(screen.getByRole('button', { name: /normal/i })).toHaveAttribute('aria-pressed', 'true');
    // C-14: the station follows the catalog standard recipe (1:16, 3:00) instead of the C-02 profile
    expect(screen.getByLabelText(/agua total \(ml\)/i)).toHaveValue(240);
  });

  it('supports bidirectional Coffee <-> Water scaling on V60 and Chemex and preserves coffee dose on intensity change', async () => {
    const user = userEvent.setup();
    const { unmount } = renderBrewRoute('/brew/v60');

    const coffeeInput = screen.getByLabelText(/café seco \(g\)/i);
    const waterInput = screen.getByLabelText(/agua total \(ml\)/i);

    // Edit coffee -> 22 g => 352 ml + ~2.9 cdas + phases summing 352 g
    fireEvent.change(coffeeInput, { target: { value: '22' } });
    expect(waterInput).toHaveValue(352);
    expect(screen.getByText(/~2.9 cdas/i)).toBeInTheDocument();
    expect(screen.getByText(/3:00 · 352 g agua/i)).toBeInTheDocument();

    // Change intensity to Fuerte (1:14.5) while preserving current coffee dose (20 g -> 290 ml)
    fireEvent.change(coffeeInput, { target: { value: '20' } });
    await user.click(screen.getByRole('button', { name: /fuerte/i }));
    expect(screen.getByRole('button', { name: /fuerte/i })).toHaveAttribute('aria-pressed', 'true');
    expect(coffeeInput).toHaveValue(20);
    expect(waterInput).toHaveValue(290);

    unmount();

    // Bidirectional Water -> Coffee on Chemex (water 250 -> coffee 15.6 g)
    renderBrewRoute('/brew/chemex');
    const chemexCoffee = screen.getByLabelText(/café seco \(g\)/i);
    const chemexWater = screen.getByLabelText(/agua total \(ml\)/i);
    fireEvent.change(chemexWater, { target: { value: '250' } });
    expect(chemexCoffee).toHaveValue(15.6);
  });

  it('operates specialized Espresso mode with simultaneous yields and style clock updates', async () => {
    const user = userEvent.setup();
    renderBrewRoute('/brew/espresso');

    const doseInput = screen.getByLabelText(/dosis en portafiltro \(g\)/i);
    expect(doseInput).toHaveValue(18);
    expect(screen.getByText('0:28 · 36 g bebida')).toBeInTheDocument();

    // Change dose 18 -> 20 updates all 3 yields simultaneously
    fireEvent.change(doseInput, { target: { value: '20' } });
    expect(screen.getByRole('button', { name: /ristretto/i })).toHaveTextContent('30 g');
    expect(screen.getByRole('button', { name: /normale/i })).toHaveTextContent('40 g');
    expect(screen.getByRole('button', { name: /lungo/i })).toHaveTextContent('60 g');

    // Select Ristretto -> updates yield in the timeline (C-13 recipes share one 0:28 duration across styles)
    await user.click(screen.getByRole('button', { name: /ristretto/i }));
    expect(screen.getByRole('button', { name: /ristretto/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('0:28 · 30 g bebida')).toBeInTheDocument();

    // Select Lungo -> updates yield
    await user.click(screen.getByRole('button', { name: /lungo/i }));
    expect(screen.getByRole('button', { name: /lungo/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('0:28 · 60 g bebida')).toBeInTheDocument();
  });

  it('shows non-blocking RangeWarningBanner outside thresholds, hides it when valid, and disables Iniciar extracción only on <=0/empty', () => {
    renderBrewRoute('/brew/v60');

    const coffeeInput = screen.getByLabelText(/café seco \(g\)/i);
    const startBtn = screen.getByRole('button', { name: /iniciar extracción/i });

    // Below min (8 g) -> warning banner visible, start remains enabled
    fireEvent.change(coffeeInput, { target: { value: '8' } });
    expect(screen.getByRole('status')).toHaveTextContent(/dosis por debajo de 10 g/i);
    expect(startBtn).not.toBeDisabled();

    // Above max (42 g) -> warning banner visible, start remains enabled
    fireEvent.change(coffeeInput, { target: { value: '42' } });
    expect(screen.getByRole('status')).toHaveTextContent(/dosis superior a 36 g/i);
    expect(startBtn).not.toBeDisabled();

    // Valid range (15 g) -> warning banner dismissed
    fireEvent.change(coffeeInput, { target: { value: '15' } });
    expect(screen.queryByRole('status')).toBeNull();
    expect(startBtn).not.toBeDisabled();

    // Zero, negative, empty -> start disabled
    fireEvent.change(coffeeInput, { target: { value: '0' } });
    expect(startBtn).toBeDisabled();

    fireEvent.change(coffeeInput, { target: { value: '-5' } });
    expect(startBtn).toBeDisabled();

    fireEvent.change(coffeeInput, { target: { value: '' } });
    expect(startBtn).toBeDisabled();
  });

  it('supports idle phase preview navigation via arrows, dots and timeline rows', async () => {
    const user = userEvent.setup();
    renderBrewRoute('/brew/v60');

    expect(screen.getByText(/FASE 1 DE 4 · BLOOM/i)).toBeInTheDocument();

    // Advance via > button
    await user.click(screen.getByRole('button', { name: /siguiente fase/i }));
    expect(screen.getByText(/FASE 2 DE 4 · VERTIDO 1/i)).toBeInTheDocument();

    // Jump via < button back to 1
    await user.click(screen.getByRole('button', { name: /fase anterior/i }));
    expect(screen.getByText(/FASE 1 DE 4 · BLOOM/i)).toBeInTheDocument();

    // Jump via dot slider click to phase 3
    await user.click(screen.getByRole('button', { name: /ir a la fase 3: vertido 2/i }));
    expect(screen.getByText(/FASE 3 DE 4 · VERTIDO 2/i)).toBeInTheDocument();

    // Jump via timeline row click to phase 4
    await user.click(screen.getByRole('button', { name: /^2:25 Drawdown/i }));
    expect(screen.getByText(/FASE 4 DE 4 · DRAWDOWN/i)).toBeInTheDocument();

    // Previewing never starts the timer
    expect(screen.getByRole('button', { name: /iniciar extracción/i })).toBeInTheDocument();

    // Navigate from /brew/v60 to /brew/espresso cleanly resetting session
    await user.click(screen.getByRole('link', { name: /switch to espresso/i }));
    expect(screen.getByRole('heading', { name: 'Espresso' })).toBeInTheDocument();
    expect(screen.getByLabelText(/dosis en portafiltro \(g\)/i)).toHaveValue(18);
  });

  it('renders NotFoundView for an unknown method slug', () => {
    renderBrewRoute('/brew/metodo-inexistente');
    expect(screen.getByText('404 — Ruta no encontrada')).toBeInTheDocument();
  });

  it('integrates ProceduralBrewScene in timer aside with interactive phase sync and no dev scrubber', async () => {
    const user = userEvent.setup();
    renderBrewRoute('/brew/v60');

    const asidePanel = document.querySelector('aside.timer-panel-surface');
    expect(asidePanel).not.toBeNull();

    const sceneSvg = asidePanel?.querySelector('svg[data-vessel="cone_v60"]');
    expect(sceneSvg).not.toBeNull();
    const initialStream = sceneSvg?.getAttribute('data-pour-stream');
    const initialTurbulence = sceneSvg?.getAttribute('data-turbulence');
    expect(initialStream).toBeTruthy();
    expect(initialTurbulence).toBeTruthy();

    // Advance via timeline row click to drain phase (phase 4) -> updates SVG primitive states
    await user.click(screen.getByRole('button', { name: /^2:25 Drawdown/i }));
    expect(sceneSvg?.getAttribute('data-pour-stream')).toBe('none');
    expect(sceneSvg?.getAttribute('data-turbulence')).toBe('settled');

    // Return via arrow button to phase 3 and step via dot slider to phase 1
    await user.click(screen.getByRole('button', { name: /fase anterior/i }));
    expect(sceneSvg?.getAttribute('data-pour-stream')).not.toBe('none');
    await user.click(screen.getByRole('button', { name: /ir a la fase 1: bloom/i }));

    // Idle preview shows each phase at its end state; the dev-only fill scrubber is gone
    expect(screen.queryByRole('slider')).toBeNull();
    expect(Number(sceneSvg?.getAttribute('data-liquid-level'))).toBeGreaterThan(0);
  });

  it('renders accurate vessel scenes across all 6 /brew/:methodSlug routes', () => {
    const expectedVessels = [
      ['v60', 'cone_v60'],
      ['chemex', 'hourglass_chemex'],
      ['melitta', 'wedge_melitta'],
      ['aeropress', 'cylinder_aeropress'],
      ['french-press', 'beaker_french_press'],
      ['espresso', 'portafilter_espresso'],
    ] as const;

    for (const [slug, vessel] of expectedVessels) {
      const { unmount } = renderBrewRoute(`/brew/${slug}`);
      const svg = document.querySelector(`aside.timer-panel-surface svg[data-vessel="${vessel}"]`);
      expect(svg).not.toBeNull();
      unmount();
    }
  });
});
