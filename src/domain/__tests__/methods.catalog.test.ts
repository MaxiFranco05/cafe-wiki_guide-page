import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { BrewMethodSchema } from '../schemas';
import { METHODS_CATALOG, getMethodBySlug } from '../../data/methods';
import { t } from '../../i18n';

describe('Methods Catalog & Physical Thresholds (RN-RG-03)', () => {
  it('contains exactly 6 MVP brewing methods', () => {
    expect(METHODS_CATALOG).toHaveLength(6);
    const slugs = METHODS_CATALOG.map((m) => m.id);
    expect(slugs).toEqual(['v60', 'chemex', 'melitta', 'aeropress', 'french-press', 'espresso']);
  });

  it('validates every method against BrewMethodSchema', () => {
    for (const method of METHODS_CATALOG) {
      const parsed = BrewMethodSchema.safeParse(method);
      expect(parsed.success, `Method ${method.id} failed schema validation`).toBe(true);
    }
  });

  it('provides exactly 18 recipe profiles (3 per method)', () => {
    const totalProfiles = METHODS_CATALOG.reduce((acc, m) => acc + m.profiles.length, 0);
    expect(totalProfiles).toBe(18);

    for (const method of METHODS_CATALOG) {
      expect(method.profiles).toHaveLength(3);
      if (method.id === 'espresso') {
        const ids = method.profiles.map((p) => p.id);
        expect(ids).toEqual(['ristretto', 'normale', 'lungo']);
      } else {
        const ids = method.profiles.map((p) => p.id);
        expect(ids).toEqual(['light', 'normal', 'strong']);
      }
    }
  });

  it('verifies physical equipment limits conform to RN-RG-03', () => {
    const v60 = getMethodBySlug('v60');
    expect(v60).toBeDefined();
    expect(v60?.thresholds.minCoffeeGrams).toBe(10);
    expect(v60?.thresholds.maxCoffeeGrams).toBe(36);
    expect(v60?.thresholds.minWaterMl).toBe(150);
    expect(v60?.thresholds.maxWaterMl).toBe(600);

    const chemex = getMethodBySlug('chemex');
    expect(chemex).toBeDefined();
    expect(chemex?.thresholds.minCoffeeGrams).toBe(20);
    expect(chemex?.thresholds.maxCoffeeGrams).toBe(55);
    expect(chemex?.thresholds.minWaterMl).toBe(300);
    expect(chemex?.thresholds.maxWaterMl).toBe(900);

    const melitta = getMethodBySlug('melitta');
    expect(melitta).toBeDefined();
    expect(melitta?.thresholds.minCoffeeGrams).toBe(10);
    expect(melitta?.thresholds.maxCoffeeGrams).toBe(35);
    expect(melitta?.thresholds.minWaterMl).toBe(150);
    expect(melitta?.thresholds.maxWaterMl).toBe(550);

    const aeropress = getMethodBySlug('aeropress');
    expect(aeropress).toBeDefined();
    expect(aeropress?.thresholds.minCoffeeGrams).toBe(11);
    expect(aeropress?.thresholds.maxCoffeeGrams).toBe(30);
    expect(aeropress?.thresholds.minWaterMl).toBe(150);
    expect(aeropress?.thresholds.maxWaterMl).toBe(260);

    const frenchPress = getMethodBySlug('french-press');
    expect(frenchPress).toBeDefined();
    expect(frenchPress?.thresholds.minCoffeeGrams).toBe(12);
    expect(frenchPress?.thresholds.maxCoffeeGrams).toBe(65);
    expect(frenchPress?.thresholds.minWaterMl).toBe(180);
    expect(frenchPress?.thresholds.maxWaterMl).toBe(1000);

    const espresso = getMethodBySlug('espresso');
    expect(espresso).toBeDefined();
    expect(espresso?.thresholds.minCoffeeGrams).toBe(14);
    expect(espresso?.thresholds.maxCoffeeGrams).toBe(22);
  });

  describe('Cross-Reference Integrity with es/methods.json', () => {
    it('resolves 100% of *Key references without falling back to raw keys', () => {
      for (const method of METHODS_CATALOG) {
        // Method name and grind keys
        expect(t(method.nameKey), `Unresolved nameKey for ${method.id}`).not.toBe(method.nameKey);
        expect(t(method.baseGrindKey), `Unresolved baseGrindKey for ${method.id}`).not.toBe(
          method.baseGrindKey
        );

        // Warning message keys
        const belowMin = t(method.thresholds.warningMessageKeys.belowMinKey);
        const aboveMax = t(method.thresholds.warningMessageKeys.aboveMaxKey);
        expect(
          belowMin,
          `Unresolved belowMinKey for ${method.id}: ${method.thresholds.warningMessageKeys.belowMinKey}`
        ).not.toBe(method.thresholds.warningMessageKeys.belowMinKey);
        expect(
          aboveMax,
          `Unresolved aboveMaxKey for ${method.id}: ${method.thresholds.warningMessageKeys.aboveMaxKey}`
        ).not.toBe(method.thresholds.warningMessageKeys.aboveMaxKey);

        // Profiles and phases
        for (const profile of method.profiles) {
          expect(t(profile.labelKey), `Unresolved labelKey for ${profile.id}`).not.toBe(
            profile.labelKey
          );
          expect(
            t(profile.descriptionKey),
            `Unresolved descriptionKey for ${profile.id}`
          ).not.toBe(profile.descriptionKey);

          for (const phase of profile.phases) {
            expect(t(phase.titleKey), `Unresolved titleKey for phase ${phase.id}`).not.toBe(
              phase.titleKey
            );

            const resolvedInstruction = t(phase.instructionKey, {
              waterGrams: 45,
              cumulativeWaterGrams: 45,
            });
            expect(
              resolvedInstruction,
              `Unresolved instructionKey for phase ${phase.id}`
            ).not.toBe(phase.instructionKey);
            expect(
              resolvedInstruction,
              `Uninterpolated placeholder in ${phase.instructionKey}`
            ).not.toContain('{waterGrams}');
            expect(
              resolvedInstruction,
              `Uninterpolated placeholder in ${phase.instructionKey}`
            ).not.toContain('{cumulativeWaterGrams}');
          }
        }
      }
    });
  });

  describe('Domain & Data Module Architecture Purity (Functional Core)', () => {
    function getAllSourceFiles(dir: string): string[] {
      const results: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== '__tests__') {
            results.push(...getAllSourceFiles(fullPath));
          }
        } else if (entry.name.endsWith('.ts')) {
          results.push(fullPath);
        }
      }
      return results;
    }

    it('has 0 imports of react, DOM, window, or navigator in src/domain and src/data', () => {
      const domainDir = path.resolve(__dirname, '..');
      const dataDir = path.resolve(__dirname, '../../data');

      const domainFiles = getAllSourceFiles(domainDir);
      const dataFiles = getAllSourceFiles(dataDir);
      const allFiles = [...domainFiles, ...dataFiles];

      expect(allFiles.length).toBeGreaterThan(0);

      const forbiddenImportPattern = /from\s+['"](react|react-dom|@testing-library\/react)['"]/;
      const forbiddenGlobalsPattern = /\b(window|document|navigator|localStorage|sessionStorage)\b/;

      for (const file of allFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        expect(
          forbiddenImportPattern.test(content),
          `File ${file} contains forbidden React/DOM import`
        ).toBe(false);
        expect(
          forbiddenGlobalsPattern.test(content),
          `File ${file} contains forbidden browser global reference`
        ).toBe(false);
      }
    });
  });
});
