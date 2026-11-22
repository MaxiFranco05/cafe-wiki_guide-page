import React, { useId, useMemo, useState } from 'react';
import type { BuildCustomRecipeResult } from '../../../domain/brewing';
import type { BrewMethod, BrewPhase, CustomRecipeDraft } from '../../../domain/schemas';
import { t } from '../../../i18n';
import { formatBrewNumber, formatMinutesSeconds } from '../utils/brew-station.helpers';
import {
  ALLOWED_PHASE_TYPES,
  createEditorPhase,
  summarizeEditorForm,
  validateEditorForm,
  type EditorErrors,
  type EditorForm,
  type EditorPhaseErrors,
  type EditorPhaseForm,
} from '../utils/recipe-display.helpers';
import { AlertIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon } from './recipe-icons';
import { RecipeSheet } from './RecipeSheet';

export type EditorMode = 'new' | 'duplicate' | 'edit';

export interface CustomRecipeEditorModalProps {
  readonly open: boolean;
  readonly method: BrewMethod;
  readonly mode: EditorMode;
  readonly initialForm: EditorForm;
  /** Title and author of the duplicated recipe (subtitle in `duplicate` mode). */
  readonly source?: { readonly title: string; readonly author: string };
  readonly onCancel: () => void;
  /** Persists the validated draft; a failed build shows a generic error with technical details. */
  readonly onSave: (draft: CustomRecipeDraft) => BuildCustomRecipeResult;
}

type PhaseType = BrewPhase['type'];

const FieldError: React.FC<{ readonly id: string; readonly errorKey?: string }> = ({ id, errorKey }) =>
  errorKey ? (
    <p id={id} className="rs-error">
      <AlertIcon size={14} />
      {t(errorKey)}
    </p>
  ) : null;

interface PhaseRowProps {
  readonly phase: EditorPhaseForm;
  readonly index: number;
  readonly count: number;
  readonly methodId: BrewMethod['id'];
  readonly errors?: EditorPhaseErrors;
  readonly onChange: (index: number, patch: Partial<EditorPhaseForm>) => void;
  readonly onMove: (index: number, delta: -1 | 1) => void;
  readonly onRemove: (index: number) => void;
}

const PhaseRow: React.FC<PhaseRowProps> = ({ phase, index, count, methodId, errors, onChange, onMove, onRemove }) => {
  const errorId = useId();
  const n = index + 1;
  const allowed = ALLOWED_PHASE_TYPES[methodId];
  const options = allowed.includes(phase.type) ? allowed : [...allowed, phase.type];
  const describe = (key?: string) => (key ? errorId : undefined);
  const firstError = errors ? (errors.title ?? errors.type ?? errors.durationSeconds ?? errors.waterMl) : undefined;

  const handleType = (next: PhaseType) => {
    const previousLabel = t(`brew.recipes.editor.phaseTypes.${phase.type}`);
    onChange(index, {
      type: next,
      ...(phase.title === previousLabel ? { title: t(`brew.recipes.editor.phaseTypes.${next}`) } : {}),
    });
  };

  return (
    <li className="rs-phase" data-invalid={firstError ? 'true' : 'false'}>
      <div className="rs-phase-top">
        <span className="rs-phase-num" aria-hidden="true">
          {n}
        </span>
        <input
          className="rs-input"
          value={phase.title}
          maxLength={60}
          aria-label={t('brew.recipes.editor.phaseTitleAria', { index: n })}
          aria-invalid={errors?.title ? 'true' : undefined}
          aria-describedby={describe(errors?.title)}
          onChange={(event) => onChange(index, { title: event.target.value })}
        />
        <div className="rs-tools">
          <button
            type="button"
            className="rs-tool"
            aria-label={t('brew.recipes.editor.moveUp', { index: n })}
            disabled={index === 0}
            onClick={() => onMove(index, -1)}
          >
            <ChevronUpIcon />
          </button>
          <button
            type="button"
            className="rs-tool"
            aria-label={t('brew.recipes.editor.moveDown', { index: n })}
            disabled={index === count - 1}
            onClick={() => onMove(index, 1)}
          >
            <ChevronDownIcon />
          </button>
          <button
            type="button"
            className="rs-tool"
            data-danger
            aria-label={t('brew.recipes.editor.remove', { index: n })}
            disabled={count === 1}
            onClick={() => onRemove(index)}
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      <div className="rs-phase-fields">
        <select
          className="rs-input"
          value={phase.type}
          aria-label={t('brew.recipes.editor.phaseTypeAria', { index: n })}
          aria-invalid={errors?.type ? 'true' : undefined}
          aria-describedby={describe(errors?.type)}
          onChange={(event) => {
            const next = options.find((type) => type === event.target.value);
            if (next) handleType(next);
          }}
        >
          {options.map((type) => (
            <option key={type} value={type}>
              {t(`brew.recipes.editor.phaseTypes.${type}`)}
            </option>
          ))}
        </select>
        <div className="rs-unit">
          <input
            className="rs-input rs-mono"
            inputMode="numeric"
            value={phase.durationSeconds}
            aria-label={t('brew.recipes.editor.phaseDurationAria', { index: n })}
            aria-invalid={errors?.durationSeconds ? 'true' : undefined}
            aria-describedby={describe(errors?.durationSeconds)}
            onChange={(event) => onChange(index, { durationSeconds: event.target.value })}
          />
          <em aria-hidden="true">s</em>
        </div>
        <div className="rs-unit">
          <input
            className="rs-input rs-mono"
            data-water
            inputMode="decimal"
            value={phase.waterMl}
            aria-label={t('brew.recipes.editor.phaseWaterAria', { index: n })}
            aria-invalid={errors?.waterMl ? 'true' : undefined}
            aria-describedby={describe(errors?.waterMl)}
            onChange={(event) => onChange(index, { waterMl: event.target.value })}
          />
          <em aria-hidden="true">ml</em>
        </div>
      </div>
      <FieldError id={errorId} errorKey={firstError} />
    </li>
  );
};

/** Create / duplicate / edit a custom recipe for the current method. Remount (key) to reset. */
export const CustomRecipeEditorModal: React.FC<CustomRecipeEditorModalProps> = ({
  open,
  method,
  mode,
  initialForm,
  source,
  onCancel,
  onSave,
}) => {
  const [form, setForm] = useState<EditorForm>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [buildIssues, setBuildIssues] = useState<readonly string[] | null>(null);
  const ids = { name: useId(), nameErr: useId(), dose: useId(), ratio: useId(), temp: useId(), tempHint: useId(), process: useId(), flavor: useId(), grind: useId(), phasesErr: useId() };

  const summary = summarizeEditorForm(form);
  const validation = useMemo(() => validateEditorForm(form, method), [form, method]);
  const errors: EditorErrors | null = submitted && !validation.ok ? validation.errors : null;
  const errorCount = submitted && !validation.ok ? validation.errorCount : 0;

  const update = (patch: Partial<EditorForm>) => setForm((current) => ({ ...current, ...patch }));
  const updatePhase = (index: number, patch: Partial<EditorPhaseForm>) =>
    setForm((current) => ({
      ...current,
      phases: current.phases.map((phase, i) => (i === index ? { ...phase, ...patch } : phase)),
    }));
  const movePhase = (index: number, delta: -1 | 1) =>
    setForm((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.phases.length) return current;
      const phases = [...current.phases];
      const [moved] = phases.splice(index, 1);
      if (moved) phases.splice(target, 0, moved);
      return { ...current, phases };
    });
  const removePhase = (index: number) =>
    setForm((current) =>
      current.phases.length <= 1 ? current : { ...current, phases: current.phases.filter((_, i) => i !== index) }
    );
  const addPhase = () =>
    setForm((current) => ({ ...current, phases: [...current.phases, createEditorPhase(method.id)] }));

  const handleSave = () => {
    setSubmitted(true);
    setBuildIssues(null);
    if (!validation.ok) return;
    const result = onSave(validation.draft);
    if (!result.ok) setBuildIssues(result.issues);
  };

  const title =
    mode === 'edit'
      ? t('brew.recipes.editor.editTitle')
      : mode === 'duplicate'
        ? t('brew.recipes.editor.duplicateTitle')
        : t('brew.recipes.editor.newTitle');
  const subtitle =
    mode === 'edit'
      ? t('brew.recipes.editor.editSubtitle')
      : mode === 'duplicate' && source
        ? t('brew.recipes.editor.duplicateSubtitle', { title: source.title, author: source.author })
        : t('brew.recipes.editor.newSubtitle', { method: t(method.nameKey) });
  const durations = form.phases.map((phase) => Number(phase.durationSeconds.replace(',', '.')) || 1);

  return (
    <RecipeSheet
      open={open}
      onClose={onCancel}
      size="wide"
      title={title}
      subtitle={subtitle}
      closeLabel={t('brew.recipes.editor.close')}
      footer={
        <>
          <button type="button" className="rs-btn rs-btn--ghost" onClick={onCancel}>
            {t('brew.recipes.editor.cancel')}
          </button>
          <button type="button" className="rs-btn rs-btn--primary rs-grow" onClick={handleSave}>
            <CheckIcon />
            {t('brew.recipes.editor.save')}
          </button>
        </>
      }
    >
      {errorCount > 0 ? (
        <div className="rs-banner rs-banner--error" role="alert">
          <AlertIcon size={18} />
          <p>
            <b>
              {errorCount === 1
                ? t('brew.recipes.editor.errorSummaryOne')
                : t('brew.recipes.editor.errorSummary', { count: errorCount })}
            </b>
          </p>
        </div>
      ) : null}
      {buildIssues ? (
        <div className="rs-banner rs-banner--error" role="alert">
          <AlertIcon size={18} />
          <div>
            <b>{t('brew.recipes.editor.errorGeneric')}</b>
            <details className="rs-tech">
              <summary>{t('brew.recipes.editor.techDetails')}</summary>
              <pre>{buildIssues.join('\n')}</pre>
            </details>
          </div>
        </div>
      ) : null}

      <div className="rs-editor-grid">
        <div className="rs-col">
          <div className="rs-field">
            <label className="rs-label" htmlFor={ids.name}>
              {t('brew.recipes.editor.name')}
            </label>
            <input
              id={ids.name}
              className="rs-input"
              value={form.title}
              maxLength={80}
              aria-invalid={errors?.title ? 'true' : undefined}
              aria-describedby={errors?.title ? ids.nameErr : undefined}
              onChange={(event) => update({ title: event.target.value })}
            />
            <FieldError id={ids.nameErr} errorKey={errors?.title} />
          </div>
          <div className="rs-row2">
            <div className="rs-field">
              <label className="rs-label" htmlFor={ids.dose}>
                {t('brew.recipes.editor.dose')}
              </label>
              <div className="rs-unit">
                <input
                  id={ids.dose}
                  className="rs-input rs-mono"
                  inputMode="decimal"
                  value={form.doseGrams}
                  aria-invalid={errors?.doseGrams ? 'true' : undefined}
                  aria-describedby={errors?.doseGrams ? `${ids.dose}-err` : undefined}
                  onChange={(event) => update({ doseGrams: event.target.value })}
                />
                <em aria-hidden="true">g</em>
              </div>
              <FieldError id={`${ids.dose}-err`} errorKey={errors?.doseGrams} />
            </div>
            <div className="rs-field">
              <label className="rs-label" htmlFor={ids.ratio}>
                {t('brew.recipes.editor.ratio')}
              </label>
              <div className="rs-unit">
                <input
                  id={ids.ratio}
                  className="rs-input rs-mono"
                  inputMode="decimal"
                  value={form.ratio}
                  aria-invalid={errors?.ratio ? 'true' : undefined}
                  aria-describedby={errors?.ratio ? `${ids.ratio}-err` : undefined}
                  onChange={(event) => update({ ratio: event.target.value })}
                />
                <em aria-hidden="true">1:x</em>
              </div>
              <FieldError id={`${ids.ratio}-err`} errorKey={errors?.ratio} />
            </div>
          </div>
          <div className="rs-field">
            <label className="rs-label" htmlFor={ids.temp}>
              {t('brew.recipes.editor.temp')}
            </label>
            <div className="rs-unit">
              <input
                id={ids.temp}
                className="rs-input rs-mono"
                inputMode="numeric"
                value={form.tempCelsius}
                placeholder={String(method.waterTempCelsius.recommended)}
                aria-invalid={errors?.tempCelsius ? 'true' : undefined}
                aria-describedby={errors?.tempCelsius ? `${ids.temp}-err` : ids.tempHint}
                onChange={(event) => update({ tempCelsius: event.target.value })}
              />
              <em aria-hidden="true">°C</em>
            </div>
            <p id={ids.tempHint} className="rs-hint">
              {t('brew.recipes.editor.tempHint', { min: method.waterTempCelsius.min, max: method.waterTempCelsius.max })}
            </p>
            <FieldError id={`${ids.temp}-err`} errorKey={errors?.tempCelsius} />
          </div>
          <details className="rs-notes">
            <summary>
              {t('brew.recipes.editor.notes')}
              <ChevronDownIcon />
            </summary>
            <div className="rs-notes-body">
              <div className="rs-field">
                <label className="rs-label" htmlFor={ids.process}>
                  {t('brew.recipes.editor.process')}
                </label>
                <textarea
                  id={ids.process}
                  className="rs-input"
                  maxLength={300}
                  value={form.processSummary}
                  onChange={(event) => update({ processSummary: event.target.value })}
                />
              </div>
              <div className="rs-field">
                <label className="rs-label" htmlFor={ids.flavor}>
                  {t('brew.recipes.editor.flavor')}
                </label>
                <input
                  id={ids.flavor}
                  className="rs-input"
                  maxLength={200}
                  value={form.flavorHighlight}
                  onChange={(event) => update({ flavorHighlight: event.target.value })}
                />
              </div>
              <div className="rs-field">
                <label className="rs-label" htmlFor={ids.grind}>
                  {t('brew.recipes.editor.grind')}
                </label>
                <input
                  id={ids.grind}
                  className="rs-input"
                  maxLength={120}
                  value={form.grindNote}
                  onChange={(event) => update({ grindNote: event.target.value })}
                />
              </div>
            </div>
          </details>
        </div>

        <div className="rs-col">
          <div className="rs-summary" role="status" aria-label={t('brew.recipes.editor.summaryAria')}>
            <div>
              <small>{t('brew.recipes.editor.summaryDuration')}</small>
              <b>{formatMinutesSeconds(summary.durationSeconds)}</b>
            </div>
            <div>
              <small>{t('brew.recipes.editor.summaryWater')}</small>
              <b data-water>{formatBrewNumber(summary.waterMl)} ml</b>
            </div>
            <div>
              <small>{t('brew.recipes.editor.summaryRatio')}</small>
              <b>{summary.ratio === null ? '—' : `1:${formatBrewNumber(summary.ratio)}`}</b>
            </div>
            <div className="rs-bar" aria-hidden="true">
              {form.phases.map((phase, index) => (
                <span
                  key={phase.key}
                  style={{ flexGrow: durations[index] }}
                  data-dry={(Number(phase.waterMl.replace(',', '.')) || 0) > 0 ? 'false' : 'true'}
                />
              ))}
            </div>
          </div>
          <div className="rs-field">
            <span className="rs-label">{t('brew.recipes.editor.phasesTitle')}</span>
            <p className="rs-hint">{t('brew.recipes.editor.phasesHint')}</p>
          </div>
          <FieldError id={ids.phasesErr} errorKey={errors?.phases} />
          <ol className="rs-phases" aria-describedby={errors?.phases ? ids.phasesErr : undefined}>
            {form.phases.map((phase, index) => (
              <PhaseRow
                key={phase.key}
                phase={phase}
                index={index}
                count={form.phases.length}
                methodId={method.id}
                errors={errors?.phaseFields[index]}
                onChange={updatePhase}
                onMove={movePhase}
                onRemove={removePhase}
              />
            ))}
          </ol>
          <button type="button" className="rs-add-phase" onClick={addPhase}>
            <PlusIcon />
            {t('brew.recipes.editor.addPhase')}
          </button>
        </div>
      </div>
    </RecipeSheet>
  );
};
