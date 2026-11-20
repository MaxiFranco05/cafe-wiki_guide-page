import React from 'react';
import { Link } from 'react-router';
import type { BrewMethod, RecipeProfile } from '../../../domain/schemas';
import { getMethodBySlug } from '../../../data/methods';
import { getBrewerForMethod } from '../../../data/wiki-brewers';
import { t } from '../../../i18n';
import { shortProfileLabel } from '../utils/wiki-ui.helpers';
import { BrewerIcon } from './BrewerIcon';
import { UiIcon } from './WikiIcons';

/** Method name and short profile label ("Hario V60", "Liviano") for CTAs. */
export function methodProfileLabels(methodId: BrewMethod['id'], profileId: RecipeProfile['id']): { method: string; profile: string } {
  const method = getMethodBySlug(methodId);
  const profile = method?.profiles.find((p) => p.id === profileId);
  return {
    method: method ? t(method.nameKey) : methodId,
    profile: profile ? shortProfileLabel(t(profile.labelKey)) : profileId,
  };
}

export interface RecommendedMethodCardProps {
  readonly methodId: BrewMethod['id'];
  readonly profileId: RecipeProfile['id'];
  readonly reason: string;
  readonly primary: boolean;
}

export const RecommendedMethodCard: React.FC<RecommendedMethodCardProps> = ({ methodId, profileId, reason, primary }) => {
  const { method, profile } = methodProfileLabels(methodId, profileId);
  const brewer = getBrewerForMethod(methodId);
  return (
    <div className="w-method">
      <div className="w-method-head">
        <b>{method}</b>
        <span>{profile}</span>
      </div>
      <p>{reason}</p>
      <Link className={`w-cta ${primary ? '' : 'w-cta--secondary'}`} to={`/brew/${methodId}?profile=${profileId}`}>
        {t('wiki.ui.methods.prepare', { method, profile })}
        <UiIcon name="arrow" />
      </Link>
      {brewer && (
        <Link className="w-method-more" to={`/wiki/cafeteras/${brewer.slug}`}>
          <BrewerIcon slug={brewer.slug} />
          {t('wiki.ui.methods.knowBrewer', { brewer: t(brewer.titleKey) })}
        </Link>
      )}
    </div>
  );
};
