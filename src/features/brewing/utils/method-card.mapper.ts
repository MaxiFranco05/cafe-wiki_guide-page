import type { BrewMethod, RecipeProfile, SvgStageDirective } from '../../../domain/schemas';
import { t } from '../../../i18n';

export interface MethodCardViewModel {
  readonly id: BrewMethod['id'];
  readonly href: string;
  readonly category: BrewMethod['category'];
  readonly categoryBadge: string;
  readonly vesselType: SvgStageDirective['vesselType'];
  readonly imageSrc: string;
  readonly objectPosition?: string;
  readonly title: string;
  readonly description: string;
  readonly referenceAuthor: string;
  readonly ratioBadge: string;
  readonly doseBadge: string;
  readonly durationBadge: string;
}

const METHOD_VISUAL_ASSETS: Readonly<
  Record<BrewMethod['id'], { readonly imageSrc: string; readonly objectPosition?: string }>
> = {
  v60: { imageSrc: '/images/coffee/v60-moody.jpg' },
  chemex: { imageSrc: '/images/coffee/immersion-moody.jpg' },
  melitta: { imageSrc: '/images/coffee/v60-moody.jpg', objectPosition: 'center bottom' },
  aeropress: { imageSrc: '/images/coffee/pro-machine-moody.jpg', objectPosition: 'right center' },
  'french-press': { imageSrc: '/images/coffee/immersion-moody.jpg', objectPosition: 'right center' },
  espresso: { imageSrc: '/images/coffee/espresso-moody.jpg' },
};

function getDefaultProfile(method: BrewMethod): RecipeProfile {
  const defaultId = method.scalingMode === 'espresso_yield_ratio' ? 'normale' : 'normal';
  const match = method.profiles.find((p) => p.id === defaultId) ?? method.profiles[0];
  if (!match) {
    throw new Error(`BrewMethod "${method.id}" has no profiles.`);
  }
  return match;
}

export function formatRatioNumber(ratio: number): string {
  const rounded = Math.round(ratio * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatMinutesSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function deriveMethodCardViewModel(method: BrewMethod): MethodCardViewModel {
  const profile = getDefaultProfile(method);
  const visual = METHOD_VISUAL_ASSETS[method.id];
  const vesselType = profile.phases[0]?.svgDirective.vesselType ?? 'cone_v60';
  const ratioFormatted = formatRatioNumber(profile.ratio);

  const ratioBadge =
    method.scalingMode === 'espresso_yield_ratio'
      ? t('methods.yieldLabel', { yield: ratioFormatted })
      : t('methods.ratioLabel', { ratio: ratioFormatted });

  const doseBadge = t('methods.doseLabel', { dose: method.defaultDoseGrams });

  const durationBadge =
    method.scalingMode === 'espresso_yield_ratio'
      ? t('methods.espresso.time')
      : t('methods.timeLabel', { time: formatMinutesSeconds(profile.totalDurationSeconds) });

  return {
    id: method.id,
    href: `/brew/${method.id}`,
    category: method.category,
    categoryBadge: t(`home.categoryBadges.${method.category}`),
    vesselType,
    imageSrc: visual.imageSrc,
    objectPosition: visual.objectPosition,
    title: t(method.nameKey),
    description: t(profile.descriptionKey),
    referenceAuthor: profile.referenceAuthor,
    ratioBadge,
    doseBadge,
    durationBadge,
  };
}
