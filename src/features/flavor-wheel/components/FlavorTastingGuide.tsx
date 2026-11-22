import React, { useId } from 'react';
import { getFlavorNodeById } from '../../../data/flavor-wheel';
import { t } from '../../../i18n';
import { softenedFill } from '../utils/label-tone';

const STEPS = ['general', 'refine', 'discover'] as const;
const EXAMPLE_FAMILIES = ['fruity', 'sweet', 'roasted'] as const;

export interface FlavorTastingGuideProps {
  readonly onPick: (nodeId: string) => void;
  /** When given, the guide offers "Ocultar guía" (narrow screens only). */
  readonly onDismiss?: () => void;
}

/** Beginner guide shown without a selection: start from what you taste, from general to specific. */
export const FlavorTastingGuide: React.FC<FlavorTastingGuideProps> = ({ onPick, onDismiss }) => {
  const titleId = useId();
  return (
    <section className="fw-panel fw-guide" aria-labelledby={titleId}>
      <div className="fw-guide-top">
        <span className="fw-eyebrow">{t('wheel.guide.eyebrow')}</span>
        {onDismiss ? (
          <button type="button" className="fw-dismiss" onClick={onDismiss}>
            {t('wheel.guide.dismiss')}
          </button>
        ) : null}
      </div>
      <h2 id={titleId} className="fw-panel-title">
        {t('wheel.guide.question')}
      </h2>
      <p className="fw-note">{t('wheel.guide.lead')}</p>
      <ol className="fw-steps">
        {STEPS.map((step, index) => (
          <li key={step}>
            <span className="fw-step-num" aria-hidden="true">
              {index + 1}
            </span>
            <span>
              <strong>{t(`wheel.guide.steps.${step}.title`)}</strong> {t(`wheel.guide.steps.${step}.body`)}
            </span>
          </li>
        ))}
      </ol>
      <div className="fw-chips" role="group" aria-label={t('wheel.guide.examplesLabel')}>
        {EXAMPLE_FAMILIES.map((id) => {
          const family = getFlavorNodeById(id);
          return family ? (
            <button key={id} type="button" className="fw-chip pressable" onClick={() => onPick(id)}>
              <span className="fw-dot" style={{ background: softenedFill(family.colorHex) }} aria-hidden="true" />
              {t(family.labelKey)}
            </button>
          ) : null;
        })}
      </div>
    </section>
  );
};
