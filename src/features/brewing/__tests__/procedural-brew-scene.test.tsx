import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { METHODS_CATALOG, getMethodBySlug } from '../../../data/methods';
import type { SvgStageDirective } from '../../../domain/schemas/brewing.schema';
import { BrewPreviewVesselSvg } from '../components/BrewPreviewVesselSvg';
import { ProceduralBrewScene } from '../components/ProceduralBrewScene';
import {
  Agitator,
  CoffeeBed,
  LiquidLevel,
  Plunger,
  PourStream,
  UPPER_FILTER_CLIP_PATHS,
  VESSEL_CHAMBER_BOUNDS,
  VESSEL_CLIP_PATHS,
  VesselClipDefs,
  VesselSilhouette,
  clamp01,
  computeLiquidSurfaceY,
  interpolateLiquidFill,
  isPourOverVessel,
} from '../components/svg-primitives';

afterEach(() => {
  cleanup();
});

const ALL_VESSEL_TYPES: readonly SvgStageDirective['vesselType'][] = [
  'cone_v60',
  'hourglass_chemex',
  'wedge_melitta',
  'cylinder_aeropress',
  'beaker_french_press',
  'portafilter_espresso',
];

describe('Block 1 Primitives: VesselSilhouette, LiquidLevel & CoffeeBed', () => {
  describe('interpolateLiquidFill & computeLiquidSurfaceY', () => {
    it('interpolates liquid fill linearly between startRatio and endRatio', () => {
      expect(interpolateLiquidFill(0.2, 0.8, 0)).toBeCloseTo(0.2, 4);
      expect(interpolateLiquidFill(0.2, 0.8, 0.5)).toBeCloseTo(0.5, 4);
      expect(interpolateLiquidFill(0.2, 0.8, 1)).toBeCloseTo(0.8, 4);
    });

    it('computes lower Y coordinates (higher liquid surface) as fill ratio increases', () => {
      for (const vesselType of ALL_VESSEL_TYPES) {
        const emptyY = computeLiquidSurfaceY(vesselType, 0);
        const midY = computeLiquidSurfaceY(vesselType, 0.5);
        const fullY = computeLiquidSurfaceY(vesselType, 1);

        expect(emptyY).toBeGreaterThan(midY);
        expect(midY).toBeGreaterThan(fullY);
      }
    });
  });

  describe('VesselSilhouette', () => {
    it('renders distinct structural silhouettes for all 6 vessel types', () => {
      const renderedMarkupByVessel = new Map<string, string>();

      for (const vesselType of ALL_VESSEL_TYPES) {
        const { container, unmount } = render(
          <svg viewBox="0 0 160 168">
            <VesselSilhouette vesselType={vesselType} />
          </svg>,
        );

        const group = container.querySelector(
          `[data-primitive="vessel-silhouette"][data-vessel="${vesselType}"]`,
        );
        expect(group).not.toBeNull();
        expect(group?.querySelectorAll('path, rect, line, circle, ellipse').length).toBeGreaterThan(0);

        renderedMarkupByVessel.set(vesselType, group?.innerHTML ?? '');
        unmount();
      }

      // Every vessel silhouette must have unique geometry
      const uniqueGeometries = new Set(renderedMarkupByVessel.values());
      expect(uniqueGeometries.size).toBe(ALL_VESSEL_TYPES.length);
    });
  });

  describe('LiquidLevel', () => {
    it('renders clipped liquid column with GPU transform translateY proportional to fill level', () => {
      const { container: lowContainer } = render(
        <svg viewBox="0 0 160 168">
          <LiquidLevel
            vesselType="cone_v60"
            startRatio={0}
            endRatio={1}
            progress={0.2}
            clipId="v60-low"
            gradientId="v60-grad-low"
          />
        </svg>,
      );

      const { container: highContainer } = render(
        <svg viewBox="0 0 160 168">
          <LiquidLevel
            vesselType="cone_v60"
            startRatio={0}
            endRatio={1}
            progress={0.9}
            clipId="v60-high"
            gradientId="v60-grad-high"
          />
        </svg>,
      );

      const lowTransformGroup = lowContainer.querySelector('[data-liquid-column="true"]');
      const highTransformGroup = highContainer.querySelector('[data-liquid-column="true"]');

      expect(lowTransformGroup).not.toBeNull();
      expect(highTransformGroup).not.toBeNull();

      const lowTransform = lowTransformGroup?.getAttribute('style') ?? '';
      const highTransform = highTransformGroup?.getAttribute('style') ?? '';
      expect(lowTransform).toContain('translateY(');
      expect(highTransform).toContain('translateY(');
      expect(lowTransform).not.toBe(highTransform);

      // Should scope clipPath url to the caller-supplied clipId
      const clippedWrapper = lowContainer.querySelector('[data-primitive="liquid-level"] [clip-path]');
      expect(clippedWrapper?.getAttribute('clip-path')).toBe('url(#v60-low)');
    });

    it('renders espresso crema band exclusively for portafilter_espresso when fill > 0', () => {
      const { container: espressoContainer } = render(
        <svg viewBox="0 0 160 168">
          <LiquidLevel
            vesselType="portafilter_espresso"
            startRatio={0}
            endRatio={1}
            progress={0.85}
            clipId="esp-clip"
            gradientId="esp-grad"
          />
        </svg>,
      );

      const { container: v60Container } = render(
        <svg viewBox="0 0 160 168">
          <LiquidLevel
            vesselType="cone_v60"
            startRatio={0}
            endRatio={1}
            progress={0.85}
            clipId="v60-clip"
            gradientId="v60-grad"
          />
        </svg>,
      );

      expect(espressoContainer.querySelector('[data-crema="true"]')).not.toBeNull();
      expect(v60Container.querySelector('[data-crema="true"]')).toBeNull();
    });
  });

  describe('CoffeeBed', () => {
    it('renders all 4 coffeeBedTurbulence states with distinct visual cues', () => {
      const states: readonly SvgStageDirective['coffeeBedTurbulence'][] = [
        'calm',
        'bubbling_bloom',
        'active_slurry',
        'settled',
      ];

      for (const turbulence of states) {
        const { container, unmount } = render(
          <svg viewBox="0 0 160 168">
            <CoffeeBed
              vesselType="beaker_french_press"
              turbulence={turbulence}
              pourStream={turbulence === 'active_slurry' ? 'steady' : 'none'}
            />
          </svg>,
        );

        const bed = container.querySelector(
          `[data-primitive="coffee-bed"][data-turbulence="${turbulence}"]`,
        );
        expect(bed).not.toBeNull();

        if (turbulence === 'bubbling_bloom') {
          expect(bed?.querySelectorAll('[data-bloom-bubble="true"]').length).toBeGreaterThan(0);
        }

        if (turbulence === 'active_slurry') {
          expect(bed?.querySelectorAll('[data-slurry-particle="true"]').length).toBeGreaterThan(0);
        }

        unmount();
      }
    });

    it('renders shallow upper-cone slurry for pour-overs only when pouring, blooming, or in active slurry', () => {
      const { container: settledContainer } = render(
        <svg viewBox="0 0 160 168">
          <CoffeeBed
            vesselType="cone_v60"
            turbulence="settled"
            pourStream="none"
            upperClipId="upper-v60-settled"
          />
        </svg>,
      );

      const { container: pouringContainer } = render(
        <svg viewBox="0 0 160 168">
          <CoffeeBed
            vesselType="cone_v60"
            turbulence="active_slurry"
            pourStream="spiral"
            upperClipId="upper-v60-pour"
          />
        </svg>,
      );

      expect(settledContainer.querySelector('[data-upper-slurry="true"]')).toBeNull();
      const slurryEl = pouringContainer.querySelector('[data-upper-slurry="true"]');
      expect(slurryEl).not.toBeNull();
      expect(
        pouringContainer.querySelector('[clip-path="url(#upper-v60-pour)"]'),
      ).not.toBeNull();
    });
  });

  describe('Block 1 Edge Cases & Chamber Geometry Triangulation', () => {
    it('clamps progress < 0, progress > 1, and NaN/Infinity inputs without producing NaN', () => {
      expect(clamp01(-0.25)).toBe(0);
      expect(clamp01(1.75)).toBe(1);
      expect(clamp01(Number.NaN)).toBe(0);
      expect(clamp01(Number.POSITIVE_INFINITY)).toBe(0);

      expect(interpolateLiquidFill(0.2, 0.8, -0.4)).toBeCloseTo(0.2, 4);
      expect(interpolateLiquidFill(0.2, 0.8, 1.5)).toBeCloseTo(0.8, 4);
      expect(interpolateLiquidFill(0.2, 0.8, Number.NaN)).toBeCloseTo(0.2, 4);
      expect(interpolateLiquidFill(-0.5, 1.4, 0.5)).toBeCloseTo(0.5, 4);
      expect(interpolateLiquidFill(0.8, 0.3, 0.5)).toBeCloseTo(0.55, 4);
    });

    it('keeps clipPath references isolated across simultaneous SVG instances', () => {
      const { container } = render(
        <div>
          <svg viewBox="0 0 160 168">
            <LiquidLevel
              vesselType="cone_v60"
              startRatio={0.1}
              endRatio={0.6}
              progress={0.5}
              clipId="scene-a-chamber"
              gradientId="scene-a-grad"
            />
          </svg>
          <svg viewBox="0 0 160 168">
            <LiquidLevel
              vesselType="beaker_french_press"
              startRatio={0.2}
              endRatio={0.9}
              progress={0.8}
              clipId="scene-b-chamber"
              gradientId="scene-b-grad"
            />
          </svg>
        </div>,
      );

      const clips = Array.from(container.querySelectorAll('[data-primitive="liquid-level"] [clip-path]'));
      expect(clips).toHaveLength(2);
      expect(clips[0]?.getAttribute('clip-path')).toBe('url(#scene-a-chamber)');
      expect(clips[1]?.getAttribute('clip-path')).toBe('url(#scene-b-chamber)');
    });

    it('separates upper filter cone from lower server carafe for all pour-over vessels and caps slurry height well below the rim', () => {
      for (const vesselType of ALL_VESSEL_TYPES) {
        expect(VESSEL_CLIP_PATHS[vesselType]).toBeTruthy();
        expect(VESSEL_CHAMBER_BOUNDS[vesselType].top).toBeLessThan(
          VESSEL_CHAMBER_BOUNDS[vesselType].bottom,
        );

        if (isPourOverVessel(vesselType)) {
          expect(UPPER_FILTER_CLIP_PATHS[vesselType]).toBeTruthy();
          const { container, unmount } = render(
            <svg viewBox="0 0 160 168">
              <defs>
                <VesselClipDefs
                  vesselType={vesselType}
                  carafeClipId={`carafe-${vesselType}`}
                  upperFilterClipId={`upper-${vesselType}`}
                />
              </defs>
              <CoffeeBed
                vesselType={vesselType}
                turbulence="active_slurry"
                pourStream="steady"
                upperClipId={`upper-${vesselType}`}
              />
            </svg>,
          );

          expect(container.querySelector(`clipPath#carafe-${vesselType}`)).not.toBeNull();
          expect(container.querySelector(`clipPath#upper-${vesselType}`)).not.toBeNull();
          const slurryRect = container.querySelector('[data-upper-slurry="true"] rect');
          const slurryY = Number(slurryRect?.getAttribute('y') ?? 0);
          // Shallow slurry stays well below the upper cone top rim (y ~ 32-36)
          expect(slurryY).toBeGreaterThanOrEqual(54);
          unmount();
        } else {
          expect(UPPER_FILTER_CLIP_PATHS[vesselType]).toBeUndefined();
          const { container, unmount } = render(
            <svg viewBox="0 0 160 168">
              <defs>
                <VesselClipDefs
                  vesselType={vesselType}
                  carafeClipId={`carafe-${vesselType}`}
                  upperFilterClipId={`upper-${vesselType}`}
                />
              </defs>
            </svg>,
          );
          expect(container.querySelector(`clipPath#carafe-${vesselType}`)).not.toBeNull();
          expect(container.querySelector(`clipPath#upper-${vesselType}`)).toBeNull();
          unmount();
        }
      }
    });
  });
});

describe('Block 2 Primitives: PourStream, Agitator & Plunger', () => {
  describe('PourStream', () => {
    it('omits SVG nodes when pourStream is none', () => {
      const { container } = render(
        <svg viewBox="0 0 160 168">
          <PourStream vesselType="cone_v60" pourStream="none" surfaceY={100} />
        </svg>,
      );
      expect(container.querySelector('[data-primitive="pour-stream"]')).toBeNull();
    });

    it('renders translucent steady, gentle, and spiral streams with shimmer and surface impact ripple', () => {
      const modes: readonly Exclude<SvgStageDirective['pourStream'], 'none'>[] = [
        'gentle',
        'steady',
        'spiral',
      ];

      for (const pourStream of modes) {
        const { container, unmount } = render(
          <svg viewBox="0 0 160 168">
            <PourStream vesselType="cone_v60" pourStream={pourStream} surfaceY={110} />
          </svg>,
        );

        const group = container.querySelector(
          `[data-primitive="pour-stream"][data-pour-stream="${pourStream}"]`,
        );
        expect(group).not.toBeNull();
        expect(group?.querySelector('.svg-impact-ripple')).not.toBeNull();

        if (pourStream === 'spiral') {
          expect(group?.querySelector('.svg-pour-spiral-group')).not.toBeNull();
          expect(group?.querySelector('.svg-pour-spiral-path')).not.toBeNull();
        } else {
          expect(group?.querySelector('.svg-pour-core')).not.toBeNull();
          expect(group?.querySelector('.svg-pour-shimmer')).not.toBeNull();
        }

        unmount();
      }
    });

    it('renders double espresso crema streams and PortafilterDrops for portafilter_espresso', () => {
      const { container } = render(
        <svg viewBox="0 0 160 168">
          <PourStream vesselType="portafilter_espresso" pourStream="steady" surfaceY={108} />
        </svg>,
      );

      const group = container.querySelector('[data-primitive="pour-stream"]');
      expect(group).not.toBeNull();
      const cores = group?.querySelectorAll('.svg-pour-core');
      expect(cores).toHaveLength(2);
      const drops = group?.querySelectorAll('.svg-espresso-drop');
      expect(drops).toHaveLength(2);
    });
  });

  describe('Agitator', () => {
    it('renders nothing for none, high-clearance spoon + view-box vortex for spoon_stir, and external arrows for vessel_swirl', () => {
      const { container: noneContainer } = render(
        <svg viewBox="0 0 160 168">
          <Agitator agitator="none" vesselType="wedge_melitta" surfaceY={112} />
        </svg>,
      );
      expect(noneContainer.querySelector('[data-primitive="agitator"]')).toBeNull();

      const { container: melittaStir } = render(
        <svg viewBox="0 0 160 168">
          <Agitator agitator="spoon_stir" vesselType="wedge_melitta" surfaceY={112} />
        </svg>,
      );
      const stirGroup = melittaStir.querySelector('[data-primitive="agitator"][data-agitator="spoon_stir"]');
      expect(stirGroup).not.toBeNull();
      expect(stirGroup?.querySelector('.svg-stir-vortex')).not.toBeNull();
      // Barista spoon ellipse must clear Melitta dripper bed (bedY = 69, collar = 83)
      const spoonBowl = stirGroup?.querySelector('ellipse');
      expect(Number(spoonBowl?.getAttribute('cy') ?? 999)).toBeLessThan(65);

      const { container: swirlContainer } = render(
        <svg viewBox="0 0 160 168">
          <Agitator agitator="vessel_swirl" vesselType="cone_v60" surfaceY={112} />
        </svg>,
      );
      const swirlGroup = swirlContainer.querySelector(
        '[data-primitive="agitator"][data-agitator="vessel_swirl"]',
      );
      expect(swirlGroup).not.toBeNull();
      expect(swirlGroup?.querySelectorAll('polyline')).toHaveLength(2);
    });
  });

  describe('Plunger', () => {
    it('differentiates AeroPress telescoping hollow piston with press arrows/drops from French Press fixed-lid shaft & mesh', () => {
      const { container: noneAero } = render(
        <svg viewBox="0 0 160 168">
          <Plunger vesselType="cylinder_aeropress" plungerState="none" progress={0.5} />
        </svg>,
      );
      expect(noneAero.querySelector('[data-primitive="plunger"]')).toBeNull();

      const { container: aeroUp } = render(
        <svg viewBox="0 0 160 168">
          <Plunger vesselType="cylinder_aeropress" plungerState="up" progress={0} />
        </svg>,
      );
      const { container: aeroPressing } = render(
        <svg viewBox="0 0 160 168">
          <Plunger vesselType="cylinder_aeropress" plungerState="pressing" progress={0.6} />
        </svg>,
      );
      const aeroGroup = aeroPressing.querySelector('[data-primitive="plunger"][data-plunger-kind="aeropress"]');
      expect(aeroGroup).not.toBeNull();
      expect(aeroPressing.querySelectorAll('[data-press-arrow="true"]')).toHaveLength(2);
      expect(aeroPressing.querySelectorAll('.svg-espresso-drop').length).toBeGreaterThan(0);
      expect(aeroUp.querySelectorAll('[data-press-arrow="true"]')).toHaveLength(0);

      const aeroUpSealY = Number(
        aeroUp.querySelector('[data-aeropress-seal="true"]')?.getAttribute('y') ?? 0,
      );
      const aeroPressSealY = Number(
        aeroPressing.querySelector('[data-aeropress-seal="true"]')?.getAttribute('y') ?? 0,
      );
      expect(aeroPressSealY).toBeGreaterThan(aeroUpSealY);

      const { container: fpUp } = render(
        <svg viewBox="0 0 160 168">
          <Plunger vesselType="beaker_french_press" plungerState="up" progress={0} />
        </svg>,
      );
      const { container: fpDown } = render(
        <svg viewBox="0 0 160 168">
          <Plunger vesselType="beaker_french_press" plungerState="down" progress={1} />
        </svg>,
      );
      const fpGroup = fpDown.querySelector('[data-primitive="plunger"][data-plunger-kind="french-press"]');
      expect(fpGroup).not.toBeNull();
      expect(fpUp.querySelector('[data-french-press-lid="true"]')?.getAttribute('y')).toBe(
        fpDown.querySelector('[data-french-press-lid="true"]')?.getAttribute('y'),
      );
      const fpUpMeshY = Number(
        fpUp.querySelector('[data-french-press-mesh="true"]')?.getAttribute('y') ?? 0,
      );
      const fpDownMeshY = Number(
        fpDown.querySelector('[data-french-press-mesh="true"]')?.getAttribute('y') ?? 0,
      );
      expect(fpDownMeshY).toBeGreaterThan(fpUpMeshY);
    });
  });

  describe('Catalog Directive Triangulation (All 6 Brew Methods)', () => {
    it('renders coherent primitive combinations for every phase across all 6 METHODS_CATALOG methods', () => {
      expect(METHODS_CATALOG).toHaveLength(6);

      for (const method of METHODS_CATALOG) {
        for (const profile of method.profiles) {
          for (const phase of profile.phases) {
            const dir = phase.svgDirective;
            const level = interpolateLiquidFill(
              dir.liquidFillStartRatio,
              dir.liquidFillEndRatio,
              0.5,
            );
            const surfaceY = computeLiquidSurfaceY(dir.vesselType, level);
            const clipBase = `${method.id}-${profile.id}-${phase.id}`;

            const { container, unmount } = render(
              <svg viewBox="0 0 160 168">
                <defs>
                  <VesselClipDefs
                    vesselType={dir.vesselType}
                    carafeClipId={`${clipBase}-carafe`}
                    upperFilterClipId={`${clipBase}-upper`}
                  />
                </defs>
                <CoffeeBed
                  vesselType={dir.vesselType}
                  turbulence={dir.coffeeBedTurbulence}
                  pourStream={dir.pourStream}
                  upperClipId={`${clipBase}-upper`}
                  chamberClipId={`${clipBase}-carafe`}
                />
                <LiquidLevel
                  vesselType={dir.vesselType}
                  startRatio={dir.liquidFillStartRatio}
                  endRatio={dir.liquidFillEndRatio}
                  progress={0.5}
                  clipId={`${clipBase}-carafe`}
                  gradientId={`${clipBase}-grad`}
                />
                <PourStream
                  vesselType={dir.vesselType}
                  pourStream={dir.pourStream}
                  surfaceY={surfaceY}
                />
                <Plunger
                  vesselType={dir.vesselType}
                  plungerState={dir.plungerState}
                  progress={0.5}
                />
                <VesselSilhouette vesselType={dir.vesselType} />
                <Agitator
                  agitator={dir.agitator}
                  vesselType={dir.vesselType}
                  surfaceY={surfaceY}
                />
              </svg>,
            );

            expect(
              container.querySelector(`[data-primitive="vessel-silhouette"][data-vessel="${dir.vesselType}"]`),
            ).not.toBeNull();
            expect(container.querySelector('[data-primitive="liquid-level"]')).not.toBeNull();

            const streamNode = container.querySelector('[data-primitive="pour-stream"]');
            if (dir.pourStream === 'none') {
              expect(streamNode).toBeNull();
            } else {
              expect(streamNode).not.toBeNull();
            }

            const plungerNode = container.querySelector('[data-primitive="plunger"]');
            if (
              dir.plungerState !== 'none' &&
              (dir.vesselType === 'cylinder_aeropress' || dir.vesselType === 'beaker_french_press')
            ) {
              expect(plungerNode).not.toBeNull();
            } else {
              expect(plungerNode).toBeNull();
            }

            unmount();
          }
        }
      }
    });
  });
});

describe('Scene collision guards (C-08 review)', () => {
  const aeropress = getMethodBySlug('aeropress')!;
  const frenchPress = getMethodBySlug('french-press')!;

  it('never shows the AeroPress plunger while the chamber is being filled', () => {
    for (const profile of aeropress.profiles) {
      for (const phase of profile.phases) {
        if (phase.svgDirective.pourStream !== 'none') {
          expect(phase.svgDirective.plungerState).toBe('none');
        }
      }
    }
  });

  it('pours first and stirs after, so the spoon never crosses the water stream', () => {
    const fill = aeropress.profiles[0]!.phases[0]!.svgDirective;
    expect(fill.pourStream).not.toBe('none');
    expect(fill.agitator).toBe('spoon_stir');
    for (const progress of [0, 0.3, 0.59, 0.6, 0.8, 1]) {
      const { container, unmount } = render(<ProceduralBrewScene directive={fill} progress={progress} />);
      const hasStream = container.querySelector('[data-primitive="pour-stream"]') !== null;
      const hasSpoon = container.querySelector('[data-primitive="agitator"]') !== null;
      expect(hasStream && hasSpoon).toBe(false);
      expect(hasStream || hasSpoon).toBe(true);
      unmount();
    }
  });

  it('keeps the AeroPress seal on the liquid surface while pressing', () => {
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const { container, unmount } = render(
        <svg viewBox="0 0 160 168">
          <Plunger vesselType="cylinder_aeropress" plungerState="pressing" progress={progress} />
        </svg>,
      );
      const seal = container.querySelector('[data-aeropress-seal="true"]');
      const sealBottom = Number(seal?.getAttribute('y')) + Number(seal?.getAttribute('height'));
      const surfaceY = computeLiquidSurfaceY('cylinder_aeropress', 1 - progress);
      expect(sealBottom).toBeLessThanOrEqual(surfaceY + 0.01);
      expect(sealBottom).toBeGreaterThan(surfaceY - 6);
      unmount();
    }
  });

  it('keeps the French press knob inside the frame and above the lid across the whole press', () => {
    const plunge = frenchPress.profiles[0]!.phases.find((p) => p.svgDirective.plungerState === 'pressing')!;
    for (const progress of [0, 0.5, 1]) {
      const { container, unmount } = render(
        <svg viewBox="0 0 160 168">
          <Plunger vesselType="beaker_french_press" plungerState={plunge.svgDirective.plungerState} progress={progress} />
        </svg>,
      );
      const knob = container.querySelector('circle');
      const lidY = Number(container.querySelector('[data-french-press-lid="true"]')?.getAttribute('y'));
      const top = Number(knob?.getAttribute('cy')) - Number(knob?.getAttribute('r'));
      const bottom = Number(knob?.getAttribute('cy')) + Number(knob?.getAttribute('r'));
      expect(top).toBeGreaterThanOrEqual(0);
      expect(bottom).toBeLessThan(lidY);
      unmount();
    }
  });

  it('ends the espresso streams at the cup surface instead of inside the coffee', () => {
    for (const level of [0, 0.5, 1]) {
      const surfaceY = computeLiquidSurfaceY('portafilter_espresso', level);
      const { container, unmount } = render(
        <svg viewBox="0 0 160 168">
          <PourStream vesselType="portafilter_espresso" pourStream="steady" surfaceY={surfaceY} />
        </svg>,
      );
      for (const line of container.querySelectorAll('line')) {
        expect(Number(line.getAttribute('y2'))).toBeLessThanOrEqual(Math.round(surfaceY));
      }
      unmount();
    }
  });
});

describe('Block 3 Container: ProceduralBrewScene & Accessibility prefers-reduced-motion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('assembles all primitives cleanly and propagates progress p = 0, 0.5, 1', () => {
    const directive: SvgStageDirective = {
      vesselType: 'beaker_french_press',
      pourStream: 'steady',
      // Pour + spoon are sequenced (never together); swirl coexists with the stream.
      agitator: 'vessel_swirl',
      plungerState: 'pressing',
      liquidFillStartRatio: 0.2,
      liquidFillEndRatio: 0.8,
      coffeeBedTurbulence: 'active_slurry',
    };

    const ratios = [0, 0.5, 1] as const;
    const expectedLevels = ['0.20', '0.50', '0.80'] as const;

    ratios.forEach((progress, idx) => {
      const { container, unmount } = render(
        <ProceduralBrewScene directive={directive} progress={progress} />,
      );

      const svg = container.querySelector('svg[data-vessel="beaker_french_press"]');
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute('data-liquid-level')).toBe(expectedLevels[idx]);
      expect(svg?.querySelector('[data-primitive="liquid-level"]')).not.toBeNull();
      expect(svg?.querySelector('[data-primitive="coffee-bed"]')).not.toBeNull();
      expect(svg?.querySelector('[data-primitive="pour-stream"]')).not.toBeNull();
      expect(svg?.querySelector('[data-primitive="plunger"]')).not.toBeNull();
      expect(svg?.querySelector('[data-primitive="vessel-silhouette"]')).not.toBeNull();
      expect(svg?.querySelector('[data-primitive="agitator"]')).not.toBeNull();
      unmount();
    });
  });

  it('activates vessel swirl class on wrapper when agitator is vessel_swirl and generates non-colliding clip IDs', () => {
    const swirlDirective: SvgStageDirective = {
      vesselType: 'cone_v60',
      pourStream: 'none',
      agitator: 'vessel_swirl',
      plungerState: 'none',
      liquidFillStartRatio: 0.7,
      liquidFillEndRatio: 0.7,
      coffeeBedTurbulence: 'settled',
    };

    const { container } = render(
      <div>
        <ProceduralBrewScene directive={swirlDirective} progress={1} />
        <ProceduralBrewScene
          directive={{ ...swirlDirective, vesselType: 'wedge_melitta', agitator: 'none' }}
          progress={1}
        />
      </div>,
    );

    const wrappers = container.querySelectorAll('.procedural-svg-wrapper');
    expect(wrappers).toHaveLength(2);
    expect(wrappers[0]?.classList.contains('is-swirling')).toBe(true);
    expect(wrappers[1]?.classList.contains('is-swirling')).toBe(false);

    const clipIds = Array.from(container.querySelectorAll('clipPath[id]')).map((el) =>
      el.getAttribute('id'),
    );
    expect(clipIds.length).toBeGreaterThanOrEqual(2);
    expect(new Set(clipIds).size).toBe(clipIds.length);
  });

  it('honors explicit reducedMotion prop and OS prefers-reduced-motion media query', () => {
    const sampleDirective: SvgStageDirective = {
      vesselType: 'cone_v60',
      pourStream: 'spiral',
      agitator: 'vessel_swirl',
      plungerState: 'none',
      liquidFillStartRatio: 0.1,
      liquidFillEndRatio: 0.4,
      coffeeBedTurbulence: 'bubbling_bloom',
    };

    const { container: forcedTrue } = render(
      <ProceduralBrewScene directive={sampleDirective} reducedMotion />,
    );
    expect(forcedTrue.querySelector('[data-reduced-motion="true"]')).not.toBeNull();

    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener,
        removeEventListener,
      })),
    });

    const { container: osReduced, unmount } = render(
      <ProceduralBrewScene directive={sampleDirective} />,
    );
    expect(osReduced.querySelector('[data-reduced-motion="true"]')).not.toBeNull();
    unmount();
    expect(removeEventListener).toHaveBeenCalledTimes(1);

    // Cleanup matchMedia definition so subsequent tests see clean defaults
    Reflect.deleteProperty(window, 'matchMedia');
  });

  it('transitions cleanly across consecutive method phases on rerender and delegates BrewPreviewVesselSvg', () => {
    const v60 = getMethodBySlug('v60');
    const firstProfile = v60?.profiles[0];
    expect(firstProfile).toBeDefined();
    if (!firstProfile || firstProfile.phases.length < 2) {
      throw new Error('Expected v60 default profile with multiple phases');
    }

    const phaseOne = firstProfile.phases[0]!.svgDirective;
    const phaseTwo = firstProfile.phases[1]!.svgDirective;
    const lastPhase = firstProfile.phases[firstProfile.phases.length - 1]!.svgDirective;

    const { container, rerender } = render(
      <ProceduralBrewScene directive={phaseOne} progress={0.5} />,
    );
    const clipIdPhaseOne = container.querySelector('clipPath[data-chamber-clip="carafe"]')?.getAttribute('id');

    expect(container.querySelector('svg')?.getAttribute('data-pour-stream')).toBe(
      phaseOne.pourStream,
    );

    rerender(<ProceduralBrewScene directive={phaseTwo} progress={1} />);
    expect(container.querySelector('svg')?.getAttribute('data-pour-stream')).toBe(
      phaseTwo.pourStream,
    );
    expect(container.querySelector('svg')?.getAttribute('data-liquid-level')).toBe(
      phaseTwo.liquidFillEndRatio.toFixed(2),
    );
    // Stable scoped clipPath ID across rerenders of same mounted scene instance
    expect(container.querySelector('clipPath[data-chamber-clip="carafe"]')?.getAttribute('id')).toBe(
      clipIdPhaseOne,
    );

    rerender(<ProceduralBrewScene directive={lastPhase} progress={1} />);
    expect(container.querySelector('svg')?.getAttribute('data-turbulence')).toBe(
      lastPhase.coffeeBedTurbulence,
    );

    const { container: previewContainer } = render(
      <BrewPreviewVesselSvg directive={phaseTwo} />,
    );
    expect(
      previewContainer.querySelector(`svg[data-vessel="${phaseTwo.vesselType}"]`),
    ).not.toBeNull();
  });
});
