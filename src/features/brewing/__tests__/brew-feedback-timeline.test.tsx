import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { v60Method, espressoMethod, frenchPressMethod } from '../../../data/methods';
import { calculateScaledRecipe } from '../../../domain/brewing';
import { evaluateRangeThresholds, resolveGrindTip } from '../../../domain/thresholds';
import { RangeWarningBanner } from '../components/RangeWarningBanner';
import { GrindRecommendationBadge } from '../components/GrindRecommendationBadge';
import { PhaseTimelinePreview } from '../components/PhaseTimelinePreview';

describe('Brew Feedback & Phase Timeline Components (Strict TDD)', () => {
  describe('RangeWarningBanner', () => {
    it('renders nothing when threshold status is ok or input is invalid', () => {
      const okEval = evaluateRangeThresholds(v60Method.thresholds, 15, 250);
      const { container, rerender } = render(<RangeWarningBanner evaluation={okEval} />);
      expect(container).toBeEmptyDOMElement();

      const invalidEval = evaluateRangeThresholds(v60Method.thresholds, 0, 0);
      rerender(<RangeWarningBanner evaluation={invalidEval} />);
      expect(container).toBeEmptyDOMElement();
    });

    it('renders accessible non-blocking status banner with SVG icon and localized message on below_min or above_max', () => {
      const belowEval = evaluateRangeThresholds(v60Method.thresholds, 8, 134);
      const { rerender } = render(<RangeWarningBanner evaluation={belowEval} />);

      const banner = screen.getByRole('status');
      expect(banner).toHaveTextContent(/dosis por debajo de 10 g/i);
      expect(banner.querySelector('svg')).not.toBeNull();

      const aboveEval = evaluateRangeThresholds(v60Method.thresholds, 42, 700);
      rerender(<RangeWarningBanner evaluation={aboveEval} />);
      expect(screen.getByRole('status')).toHaveTextContent(/dosis superior a 36 g/i);
    });
  });

  describe('GrindRecommendationBadge', () => {
    it('displays base grind reference and adjusts tip between finer, standard, and coarser', () => {
      const finerTip = resolveGrindTip(v60Method, 10.5);
      const { rerender } = render(<GrindRecommendationBadge grindTip={finerTip} />);
      expect(screen.getByText(/media-fina \(sal de mesa\)/i)).toBeInTheDocument();
      expect(screen.getByText(/^más fina$/i)).toBeInTheDocument();

      const standardTip = resolveGrindTip(v60Method, 15);
      rerender(<GrindRecommendationBadge grindTip={standardTip} />);
      expect(screen.getByText(/^estándar$/i)).toBeInTheDocument();

      const coarserTip = resolveGrindTip(v60Method, 33);
      rerender(<GrindRecommendationBadge grindTip={coarserTip} />);
      expect(screen.getByText(/^más gruesa$/i)).toBeInTheDocument();
    });
  });

  describe('PhaseTimelinePreview', () => {
    it('renders fixed M:SS timestamps, partial + cumulative water weights, and interpolated instructions', async () => {
      const user = userEvent.setup();
      const onSelectPhase = vi.fn();
      const recipe = calculateScaledRecipe(v60Method, 'normal', { coffeeGrams: 22 });

      render(
        <PhaseTimelinePreview
          phases={recipe.phases}
          totalDurationSeconds={recipe.totalDurationSeconds}
          totalWaterMl={recipe.totalWaterMl}
          selectedPhaseIndex={0}
          onSelectPhase={onSelectPhase}
        />
      );

      expect(screen.getByText('0:00')).toBeInTheDocument();
      expect(screen.getByText('0:45')).toBeInTheDocument();
      expect(screen.getByText('2:00')).toBeInTheDocument();
      expect(screen.getByText('2:45')).toBeInTheDocument();

      // V60 22g normal -> 367 ml total
      expect(screen.getByText(/3:30 · 367 g agua/i)).toBeInTheDocument();
      expect(screen.getByText('+73 g')).toBeInTheDocument();
      expect(screen.getByText('→ 73 g')).toBeInTheDocument();
      expect(screen.getByText('+184 g')).toBeInTheDocument();
      expect(screen.getByText('→ 257 g')).toBeInTheDocument();
      expect(screen.getByText('+110 g')).toBeInTheDocument();
      expect(screen.getAllByText('→ 367 g').length).toBeGreaterThanOrEqual(1);

      // Clicking row triggers phase preview callback
      await user.click(screen.getByRole('button', { name: /primer vertido/i }));
      expect(onSelectPhase).toHaveBeenCalledWith(1);
    });

    it('renders zero pour delta safely for drawdown phase and single shot phase for espresso', () => {
      const espressoRecipe = calculateScaledRecipe(espressoMethod, 'normale', { coffeeGrams: 18 });

      render(
        <PhaseTimelinePreview
          phases={espressoRecipe.phases}
          totalDurationSeconds={espressoRecipe.totalDurationSeconds}
          totalWaterMl={espressoRecipe.totalWaterMl}
          isEspresso={true}
          selectedPhaseIndex={0}
        />
      );

      expect(screen.getByText(/extracción bajo 9 bar/i)).toBeInTheDocument();
      expect(screen.getByText('+36 g')).toBeInTheDocument();
      expect(screen.getByText('→ 36 g')).toBeInTheDocument();
    });

    it('renders zero-water immersion phases (french press) and contains zero emoji characters', () => {
      const fpRecipe = calculateScaledRecipe(frenchPressMethod, 'normal', { coffeeGrams: 30 });
      const { container } = render(
        <PhaseTimelinePreview
          phases={fpRecipe.phases}
          totalDurationSeconds={fpRecipe.totalDurationSeconds}
          totalWaterMl={fpRecipe.totalWaterMl}
          selectedPhaseIndex={1}
        />
      );

      expect(screen.getByText(/infusión/i)).toBeInTheDocument();
      expect(screen.getAllByText('0 g').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('→ 450 g').length).toBeGreaterThanOrEqual(3);
      expect(container.textContent).not.toMatch(/[\p{Extended_Pictographic}]/u);
    });
  });
});
