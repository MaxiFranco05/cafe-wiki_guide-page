import type { BrewMethod, RecipeProfile, SvgStageDirective } from '../../../domain/schemas';
import { t } from '../../../i18n';
import {
  formatBrewNumber,
  formatMinutesSeconds,
  getMethodVisualAsset,
} from './brew-station.helpers';

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

function getDefaultProfile(method: BrewMethod): RecipeProfile {
  const defaultId = method.scalingMode === 'espresso_yield_ratio' ? 'normale' : 'normal';
  const match = method.profiles.find((p) => p.id === defaultId) ?? method.profiles[0];
  if (!match) {
    throw new Error(`BrewMethod "${method.id}" has no profiles.`);
  }
  return match;
}

export const formatRatioNumber = formatBrewNumber;
export { formatMinutesSeconds };

export function deriveMethodCardViewModel(method: BrewMethod): MethodCardViewModel {
  const profile = getDefaultProfile(method);
  const visual = getMethodVisualAsset(method.id);
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
