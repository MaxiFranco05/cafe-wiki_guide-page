import { describe, it, expect } from 'vitest';
import {
  deriveMethodCardViewModel,
  formatMinutesSeconds,
  formatRatioNumber,
} from '../utils/method-card.mapper';
import { METHODS_CATALOG, v60Method, espressoMethod } from '../../../data/methods';

describe('method-card.mapper (C-03 D-01)', () => {
  it('derives default normal profile metrics for v60Method', () => {
    const vm = deriveMethodCardViewModel(v60Method);

    expect(vm.id).toBe('v60');
    expect(vm.href).toBe('/brew/v60');
    expect(vm.category).toBe('pour_over');
    expect(vm.vesselType).toBe('cone_v60');
    expect(vm.imageSrc).toBe('/images/coffee/v60-moody.jpg');
    expect(vm.title).toBe('Hario V60');
    expect(vm.ratioBadge).toBe('Ratio 1:16.7');
    expect(vm.doseBadge).toBe('15 g');
    expect(vm.durationBadge).toBe('3:30 min');
  });

  it('derives default normale profile metrics for espressoMethod', () => {
    const vm = deriveMethodCardViewModel(espressoMethod);

    expect(vm.id).toBe('espresso');
    expect(vm.href).toBe('/brew/espresso');
    expect(vm.category).toBe('pressure');
    expect(vm.vesselType).toBe('portafilter_espresso');
    expect(vm.imageSrc).toBe('/images/coffee/espresso-moody.jpg');
    expect(vm.title).toBe('Espresso');
    expect(vm.ratioBadge).toBe('Yield 1:2');
    expect(vm.doseBadge).toBe('18 g');
    expect(vm.durationBadge).toBe('25–30 s');
  });

  it('formats ratios and M:SS durations accurately', () => {
    expect(formatRatioNumber(16.67)).toBe('16.7');
    expect(formatRatioNumber(16.0)).toBe('16');
    expect(formatRatioNumber(15)).toBe('15');
    expect(formatMinutesSeconds(210)).toBe('3:30');
    expect(formatMinutesSeconds(240)).toBe('4:00');
    expect(formatMinutesSeconds(120)).toBe('2:00');
    expect(formatMinutesSeconds(270)).toBe('4:30');
  });

  it('derives complete resolved view models for all 6 calibrated MVP methods', () => {
    expect(METHODS_CATALOG).toHaveLength(6);

    const viewModels = METHODS_CATALOG.map((m) => deriveMethodCardViewModel(m));
    const expectedDurations: Record<string, string> = {
      v60: '3:30 min',
      chemex: '4:00 min',
      melitta: '3:30 min',
      aeropress: '2:00 min',
      'french-press': '4:30 min',
      espresso: '25–30 s',
    };

    for (const vm of viewModels) {
      expect(vm.durationBadge).toBe(expectedDurations[vm.id]);
      expect(vm.imageSrc).toMatch(/^\/images\/coffee\/[a-z0-9-]+\.jpg$/);
      expect(vm.title).not.toContain('methods.');
      expect(vm.description).not.toContain('methods.');
      expect(vm.categoryBadge).not.toContain('home.');
      expect(vm.referenceAuthor.length).toBeGreaterThan(2);
    }
  });
});
