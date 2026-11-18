import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { v60Method, espressoMethod } from '../../../data/methods';
import { calculateScaledRecipe, calculateEspressoStyles } from '../../../domain/brewing';
import { BrewControls } from '../components/BrewControls';
import { EspressoYieldCards } from '../components/EspressoYieldCards';

describe('BrewControls & EspressoYieldCards (Strict TDD)', () => {
  describe('BrewControls (Filter / Immersion bidirectional mode)', () => {
    it('renders 3 intensity buttons with aria-pressed, associated number inputs, tbsp badge, and temperature', () => {
      const recipe = calculateScaledRecipe(v60Method, 'normal', { coffeeGrams: 15 });

      render(
        <BrewControls
          method={v60Method}
          recipe={recipe}
          coffeeInput="15"
          waterInput="250"
          isCoffeeValid={true}
          isWaterValid={true}
          onProfileChange={vi.fn()}
          onCoffeeChange={vi.fn()}
          onWaterChange={vi.fn()}
        />
      );

      const lightBtn = screen.getByRole('button', { name: /liviano/i });
      const normalBtn = screen.getByRole('button', { name: /normal/i });
      const strongBtn = screen.getByRole('button', { name: /fuerte/i });

      expect(lightBtn).toHaveAttribute('aria-pressed', 'false');
      expect(normalBtn).toHaveAttribute('aria-pressed', 'true');
      expect(strongBtn).toHaveAttribute('aria-pressed', 'false');

      const coffeeInput = screen.getByLabelText(/café seco \(g\)/i);
      const waterInput = screen.getByLabelText(/agua total \(ml\)/i);

      expect(coffeeInput).toHaveAttribute('type', 'number');
      expect(coffeeInput).toHaveAttribute('min', '1');
      expect(coffeeInput).toHaveAttribute('max', '2000');
      expect(coffeeInput).toHaveAttribute('step', '0.1');
      expect(coffeeInput).toHaveValue(15);

      expect(waterInput).toHaveAttribute('type', 'number');
      expect(waterInput).toHaveAttribute('min', '1');
      expect(waterInput).toHaveAttribute('max', '2000');
      expect(waterInput).toHaveAttribute('step', '0.1');
      expect(waterInput).toHaveValue(250);

      expect(screen.getByText(/~2 cdas/i)).toBeInTheDocument();
      expect(screen.getByText(/93 °C/)).toBeInTheDocument();
    });

    it('invokes onProfileChange, onCoffeeChange, and onWaterChange cleanly', async () => {
      const user = userEvent.setup();
      const onProfileChange = vi.fn();
      const onCoffeeChange = vi.fn();
      const onWaterChange = vi.fn();
      const recipe = calculateScaledRecipe(v60Method, 'normal', { coffeeGrams: 15 });

      render(
        <BrewControls
          method={v60Method}
          recipe={recipe}
          coffeeInput="15"
          waterInput="250"
          isCoffeeValid={true}
          isWaterValid={true}
          onProfileChange={onProfileChange}
          onCoffeeChange={onCoffeeChange}
          onWaterChange={onWaterChange}
        />
      );

      await user.click(screen.getByRole('button', { name: /fuerte/i }));
      expect(onProfileChange).toHaveBeenCalledWith('strong');

      const coffeeInput = screen.getByLabelText(/café seco \(g\)/i);
      fireEvent.change(coffeeInput, { target: { value: '22' } });
      expect(onCoffeeChange).toHaveBeenCalledWith('22');

      const waterInput = screen.getByLabelText(/agua total \(ml\)/i);
      fireEvent.change(waterInput, { target: { value: '360' } });
      expect(onWaterChange).toHaveBeenCalledWith('360');
    });

    it('displays accessible validation error when coffee or water input is invalid', () => {
      const recipe = calculateScaledRecipe(v60Method, 'normal', { coffeeGrams: 0 });

      render(
        <BrewControls
          method={v60Method}
          recipe={recipe}
          coffeeInput="0"
          waterInput="250"
          isCoffeeValid={false}
          isWaterValid={true}
          onProfileChange={vi.fn()}
          onCoffeeChange={vi.fn()}
          onWaterChange={vi.fn()}
        />
      );

      const coffeeInput = screen.getByLabelText(/café seco \(g\)/i);
      expect(coffeeInput).toHaveAttribute('aria-invalid', 'true');
      expect(
        screen.getByText(/ingresá una cantidad válida mayor a 0 para calcular la receta/i)
      ).toBeInTheDocument();
    });
  });

  describe('EspressoYieldCards (Espresso yield mode)', () => {
    it('renders single dry dose input and all 3 espresso yield styles simultaneously', () => {
      const styles = calculateEspressoStyles(espressoMethod, 18);

      render(
        <EspressoYieldCards
          method={espressoMethod}
          styles={styles}
          selectedStyleId="normale"
          doseInput="18"
          isDoseValid={true}
          onDoseChange={vi.fn()}
          onStyleSelect={vi.fn()}
        />
      );

      const doseInput = screen.getByLabelText(/dosis en portafiltro \(g\)/i);
      expect(doseInput).toHaveAttribute('type', 'number');
      expect(doseInput).toHaveAttribute('min', '1');
      expect(doseInput).toHaveAttribute('max', '2000');
      expect(doseInput).toHaveAttribute('step', '0.1');
      expect(doseInput).toHaveValue(18);
      expect(screen.queryByLabelText(/agua total/i)).toBeNull();

      const ristrettoBtn = screen.getByRole('button', { name: /ristretto/i });
      const normaleBtn = screen.getByRole('button', { name: /normale/i });
      const lungoBtn = screen.getByRole('button', { name: /lungo/i });

      expect(ristrettoBtn).toHaveAttribute('aria-pressed', 'false');
      expect(normaleBtn).toHaveAttribute('aria-pressed', 'true');
      expect(lungoBtn).toHaveAttribute('aria-pressed', 'false');

      expect(ristrettoBtn).toHaveTextContent('1:1.5');
      expect(ristrettoBtn).toHaveTextContent('27 g');
      expect(ristrettoBtn).toHaveTextContent('20–25 s');

      expect(normaleBtn).toHaveTextContent('1:2');
      expect(normaleBtn).toHaveTextContent('36 g');
      expect(normaleBtn).toHaveTextContent('25–30 s');

      expect(lungoBtn).toHaveTextContent('1:3');
      expect(lungoBtn).toHaveTextContent('54 g');
      expect(lungoBtn).toHaveTextContent('30–35 s');
    });

    it('updates simultaneously for 20 g dose and triggers style selection', async () => {
      const user = userEvent.setup();
      const onDoseChange = vi.fn();
      const onStyleSelect = vi.fn();
      const styles20 = calculateEspressoStyles(espressoMethod, 20);

      render(
        <EspressoYieldCards
          method={espressoMethod}
          styles={styles20}
          selectedStyleId="normale"
          doseInput="20"
          isDoseValid={true}
          onDoseChange={onDoseChange}
          onStyleSelect={onStyleSelect}
        />
      );

      expect(screen.getByRole('button', { name: /ristretto/i })).toHaveTextContent('30 g');
      expect(screen.getByRole('button', { name: /normale/i })).toHaveTextContent('40 g');
      expect(screen.getByRole('button', { name: /lungo/i })).toHaveTextContent('60 g');

      const doseInput = screen.getByLabelText(/dosis en portafiltro \(g\)/i);
      fireEvent.change(doseInput, { target: { value: '20.5' } });
      expect(onDoseChange).toHaveBeenCalledWith('20.5');

      await user.click(screen.getByRole('button', { name: /ristretto/i }));
      expect(onStyleSelect).toHaveBeenCalledWith('ristretto');
    });

    it('marks espresso dose invalid and renders accessible validation feedback on zero or negative dose', () => {
      const stylesInvalid = calculateEspressoStyles(espressoMethod, 0);

      render(
        <EspressoYieldCards
          method={espressoMethod}
          styles={stylesInvalid}
          selectedStyleId="normale"
          doseInput="-2"
          isDoseValid={false}
          onDoseChange={vi.fn()}
          onStyleSelect={vi.fn()}
        />
      );

      const doseInput = screen.getByLabelText(/dosis en portafiltro \(g\)/i);
      expect(doseInput).toHaveAttribute('aria-invalid', 'true');
      expect(
        screen.getByText(/ingresá una cantidad válida mayor a 0 para calcular la receta/i)
      ).toBeInTheDocument();
    });
  });
});
