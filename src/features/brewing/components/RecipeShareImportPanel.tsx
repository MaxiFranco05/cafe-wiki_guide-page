import React, { useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { exportCustomRecipeJson } from '../../../domain/brewing';
import type { BrewMethod, CustomBrewRecipe } from '../../../domain/schemas';
import { getMethodBySlug } from '../../../data/methods';
import { t } from '../../../i18n';
import type { ImportOutcome } from '../hooks/useRecipeLibrary';
import { AlertIcon, CheckIcon, CopyIcon, DownloadIcon, FileIcon } from './recipe-icons';
import { RecipeSheet } from './RecipeSheet';

export type ShareImportTab = 'share' | 'import';

export interface RecipeShareImportPanelProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly method: BrewMethod;
  readonly initialTab: ShareImportTab;
  /** Custom recipe to export; `null` when opened from "Importar". */
  readonly shareRecipe: CustomBrewRecipe | null;
  readonly onImport: (rawJson: string) => ImportOutcome;
  readonly onResolveConflict: (recipe: CustomBrewRecipe, mode: 'replace' | 'copy') => ImportOutcome;
  /** Injectable clipboard writer (defaults to `navigator.clipboard.writeText`). */
  readonly writeClipboard?: (text: string) => Promise<void>;
}

type ShareStatus = 'idle' | 'copied' | 'blocked' | 'downloaded';
type ImportState = ImportOutcome | { readonly status: 'empty' } | { readonly status: 'file_error' } | null;

function defaultWriteClipboard(text: string): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return Promise.reject(new Error('Clipboard API unavailable'));
  }
  return navigator.clipboard.writeText(text);
}

function downloadJson(fileName: string, json: string): boolean {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return false;
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}

function methodName(methodId: BrewMethod['id']): string {
  const method = getMethodBySlug(methodId);
  return method ? t(method.nameKey) : methodId;
}

const ImportFeedback: React.FC<{
  readonly state: ImportState;
  readonly onResolve: (recipe: CustomBrewRecipe, mode: 'replace' | 'copy') => void;
}> = ({ state, onResolve }) => {
  if (!state) return null;
  switch (state.status) {
    case 'empty':
    case 'file_error':
      return (
        <div className="rs-banner rs-banner--error" role="alert">
          <AlertIcon size={18} />
          <p>
            <b>{state.status === 'empty' ? t('brew.recipes.import.emptyInput') : t('brew.recipes.import.fileReadError')}</b>
          </p>
        </div>
      );
    case 'invalid': {
      const isJson = state.errorCode === 'invalid_json';
      return (
        <div className="rs-banner rs-banner--error" role="alert">
          <AlertIcon size={18} />
          <div>
            <b>{isJson ? t('brew.recipes.import.invalidJsonTitle') : t('brew.recipes.import.invalidSchemaTitle')}</b>
            <p>{isJson ? t('brew.recipes.import.invalidJsonBody') : t('brew.recipes.import.invalidSchemaBody')}</p>
            <details className="rs-tech">
              <summary>{t('brew.recipes.editor.techDetails')}</summary>
              <pre>{state.issues.join('\n')}</pre>
            </details>
          </div>
        </div>
      );
    }
    case 'conflict':
      return (
        <div className="rs-banner rs-banner--info" role="status">
          <AlertIcon size={18} />
          <div>
            <b>{t('brew.recipes.import.duplicateTitle', { title: state.existing.title })}</b>
            <p>{t('brew.recipes.import.duplicateBody')}</p>
            <div className="rs-banner-actions">
              <button type="button" className="rs-btn rs-btn--soft" onClick={() => onResolve(state.recipe, 'replace')}>
                {t('brew.recipes.import.replace')}
              </button>
              <button type="button" className="rs-btn rs-btn--ghost" onClick={() => onResolve(state.recipe, 'copy')}>
                {t('brew.recipes.import.saveAsCopy')}
              </button>
            </div>
          </div>
        </div>
      );
    case 'other_method': {
      const name = methodName(state.methodId);
      return (
        <div className="rs-banner rs-banner--info" role="status">
          <AlertIcon size={18} />
          <div>
            <b>{t('brew.recipes.import.otherMethodTitle', { title: state.recipe.title, method: name })}</b>
            <p>
              {t('brew.recipes.import.otherMethodBody', { method: name })}{' '}
              <Link to={`/brew/${state.methodId}?recipe=${encodeURIComponent(state.recipe.id)}`}>
                {t('brew.recipes.import.otherMethodLink', { method: name })}
              </Link>
            </p>
          </div>
        </div>
      );
    }
    case 'imported':
      return (
        <div className="rs-banner rs-banner--ok" role="status">
          <CheckIcon size={18} />
          <div>
            <b>{t('brew.recipes.import.successTitle')}</b>
            <p>{t('brew.recipes.import.successBody', { title: state.recipe.title })}</p>
          </div>
        </div>
      );
  }
};

/** Share a custom recipe as versioned JSON (copy / download) or import one (paste / file). */
export const RecipeShareImportPanel: React.FC<RecipeShareImportPanelProps> = ({
  open,
  onClose,
  initialTab,
  shareRecipe,
  onImport,
  onResolveConflict,
  writeClipboard = defaultWriteClipboard,
}) => {
  const [tab, setTab] = useState<ShareImportTab>(initialTab);
  const [shareStatus, setShareStatus] = useState<ShareStatus>('idle');
  const [rawJson, setRawJson] = useState('');
  const [importState, setImportState] = useState<ImportState>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLTextAreaElement>(null);
  const ids = { shareTab: useId(), importTab: useId(), sharePane: useId(), importPane: useId(), json: useId(), paste: useId() };

  const json = useMemo(() => (shareRecipe ? exportCustomRecipeJson(shareRecipe) : ''), [shareRecipe]);

  const handleCopy = () => {
    writeClipboard(json).then(
      () => setShareStatus('copied'),
      () => {
        setShareStatus('blocked');
        jsonRef.current?.select();
      }
    );
  };

  const handleDownload = () => {
    if (shareRecipe && downloadJson(`${shareRecipe.id}.json`, json)) setShareStatus('downloaded');
  };

  const runImport = (text: string) => {
    setImportState(text.trim().length === 0 ? { status: 'empty' } : onImport(text));
  };

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    file.text().then(
      (text) => {
        setRawJson(text);
        runImport(text);
      },
      () => setImportState({ status: 'file_error' })
    );
  };

  const tabButton = (id: ShareImportTab, label: string) => (
    <button
      type="button"
      role="tab"
      id={id === 'share' ? ids.shareTab : ids.importTab}
      className="rs-tab"
      aria-selected={tab === id}
      aria-controls={id === 'share' ? ids.sharePane : ids.importPane}
      onClick={() => setTab(id)}
    >
      {label}
    </button>
  );

  return (
    <RecipeSheet
      open={open}
      onClose={onClose}
      title={t('brew.recipes.share.title')}
      subtitle={t('brew.recipes.share.subtitle')}
      closeLabel={t('brew.recipes.share.close')}
    >
      <div className="rs-tabs" role="tablist" aria-label={t('brew.recipes.share.tabsAria')}>
        {tabButton('share', t('brew.recipes.share.tabShare'))}
        {tabButton('import', t('brew.recipes.share.tabImport'))}
      </div>

      {tab === 'share' ? (
        <div className="rs-pane" role="tabpanel" id={ids.sharePane} aria-labelledby={ids.shareTab}>
          {shareRecipe ? (
            <>
              <p className="rs-hint">
                {t('brew.recipes.share.recipeLabel')} <b>{shareRecipe.title}</b>
              </p>
              {shareStatus === 'copied' || shareStatus === 'downloaded' ? (
                <div className="rs-banner rs-banner--ok" role="status">
                  <CheckIcon size={18} />
                  <div>
                    <b>{shareStatus === 'copied' ? t('brew.recipes.share.copiedTitle') : t('brew.recipes.share.downloaded')}</b>
                    {shareStatus === 'copied' ? <p>{t('brew.recipes.share.copiedBody')}</p> : null}
                  </div>
                </div>
              ) : null}
              {shareStatus === 'blocked' ? (
                <div className="rs-banner rs-banner--info" role="status">
                  <AlertIcon size={18} />
                  <div>
                    <b>{t('brew.recipes.share.blockedTitle')}</b>
                    <p>{t('brew.recipes.share.blockedBody')}</p>
                  </div>
                </div>
              ) : null}
              <label className="rs-label" htmlFor={ids.json}>
                {t('brew.recipes.share.jsonLabel')}
              </label>
              <textarea ref={jsonRef} id={ids.json} className="rs-input rs-json" readOnly value={json} />
              <div className="rs-actions">
                <button type="button" className="rs-btn rs-btn--primary rs-grow" onClick={handleCopy}>
                  <CopyIcon />
                  {t('brew.recipes.share.copy')}
                </button>
                <button type="button" className="rs-btn rs-btn--ghost rs-grow" onClick={handleDownload}>
                  <DownloadIcon />
                  {t('brew.recipes.share.download')}
                </button>
              </div>
            </>
          ) : (
            <p className="rs-hint">{t('brew.recipes.share.noRecipe')}</p>
          )}
        </div>
      ) : (
        <div className="rs-pane" role="tabpanel" id={ids.importPane} aria-labelledby={ids.importTab}>
          <ImportFeedback state={importState} onResolve={(recipe, mode) => setImportState(onResolveConflict(recipe, mode))} />
          <div className="rs-field">
            <label className="rs-label" htmlFor={ids.paste}>
              {t('brew.recipes.import.pasteLabel')}
            </label>
            <textarea
              id={ids.paste}
              className="rs-input rs-json"
              value={rawJson}
              placeholder={t('brew.recipes.import.placeholder')}
              onChange={(event) => setRawJson(event.target.value)}
            />
          </div>
          <div className="rs-drop">
            <FileIcon />
            <span>{t('brew.recipes.import.fileHint')}</span>
            <button type="button" className="rs-btn rs-btn--ghost" onClick={() => fileRef.current?.click()}>
              {t('brew.recipes.import.chooseFile')}
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={handleFile} />
          </div>
          <button type="button" className="rs-btn rs-btn--primary" onClick={() => runImport(rawJson)}>
            <DownloadIcon />
            {t('brew.recipes.import.submit')}
          </button>
        </div>
      )}
    </RecipeSheet>
  );
};
