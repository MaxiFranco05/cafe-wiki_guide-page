import React, { useRef, useState } from 'react';
import type { BrewMethod, BrewRecipe, CustomBrewRecipe, CustomRecipeDraft } from '../../../domain/schemas';
import type { RecipeLibrary } from '../hooks/useRecipeLibrary';
import {
  createEmptyEditorForm,
  editorFormFromRecipe,
  resolveRecipeAuthor,
  resolveRecipeTitle,
  type EditorForm,
} from '../utils/recipe-display.helpers';
import { ConfirmDeleteRecipeDialog } from './ConfirmDeleteRecipeDialog';
import { CustomRecipeEditorModal, type EditorMode } from './CustomRecipeEditorModal';
import { RecipeSelectorModal } from './RecipeSelectorModal';
import { RecipeSelectorTrigger } from './RecipeSelectorTrigger';
import { RecipeShareImportPanel, type ShareImportTab } from './RecipeShareImportPanel';

export interface RecipeLibraryControlsProps {
  readonly library: RecipeLibrary;
  readonly method: BrewMethod;
  readonly locked: boolean;
  readonly lockedHintId?: string;
  /** Current session dose, used as the editor's reference dose when duplicating. */
  readonly referenceDoseGrams: number;
  /** Injectable clipboard writer for share (tests). */
  readonly writeClipboard?: (text: string) => Promise<void>;
}

interface EditorState {
  readonly key: number;
  readonly mode: EditorMode;
  readonly form: EditorForm;
  readonly source?: { readonly title: string; readonly author: string };
}

interface ShareState {
  readonly tab: ShareImportTab;
  readonly recipe: CustomBrewRecipe | null;
}

/**
 * Station header recipe control: trigger + selector, editor, share/import and delete confirmation,
 * all driven by `useRecipeLibrary`. Selector stays open under the editor/share/confirm layers.
 */
export const RecipeLibraryControls: React.FC<RecipeLibraryControlsProps> = ({
  library,
  method,
  locked,
  lockedHintId,
  referenceDoseGrams,
  writeClipboard,
}) => {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [share, setShare] = useState<ShareState | null>(null);
  const [toDelete, setToDelete] = useState<CustomBrewRecipe | null>(null);
  const editorSeq = useRef(0);

  const openEditor = (mode: EditorMode, form: EditorForm, source?: EditorState['source']) => {
    editorSeq.current += 1;
    setEditor({ key: editorSeq.current, mode, form, ...(source ? { source } : {}) });
  };

  const closeAll = () => {
    setEditor(null);
    setShare(null);
    setToDelete(null);
    setSelectorOpen(false);
  };

  const handleDuplicate = (recipe: BrewRecipe) =>
    openEditor('duplicate', editorFormFromRecipe(recipe, method, 'duplicate', referenceDoseGrams > 0 ? referenceDoseGrams : undefined), {
      title: resolveRecipeTitle(recipe),
      author: resolveRecipeAuthor(recipe),
    });

  const handleSave = (draft: CustomRecipeDraft) => {
    const result = library.saveCustom(draft);
    if (result.ok) closeAll();
    return result;
  };

  return (
    <>
      <RecipeSelectorTrigger
        recipe={library.activeRecipe}
        method={method}
        locked={locked}
        lockedHintId={lockedHintId}
        onOpen={() => setSelectorOpen(true)}
      />
      <RecipeSelectorModal
        open={selectorOpen && !locked}
        onClose={() => setSelectorOpen(false)}
        method={method}
        groups={library.groups}
        activeRecipeId={library.activeRecipe.id}
        onUse={(recipeId) => {
          library.select(recipeId);
          setSelectorOpen(false);
        }}
        onDuplicate={handleDuplicate}
        onEdit={(recipe) => openEditor('edit', editorFormFromRecipe(recipe, method, 'edit'))}
        onShare={(recipe) => setShare({ tab: 'share', recipe })}
        onDelete={setToDelete}
        onCreate={() => openEditor('new', createEmptyEditorForm(method))}
        onImport={() => setShare({ tab: 'import', recipe: null })}
      />
      {editor ? (
        <CustomRecipeEditorModal
          key={editor.key}
          open
          method={method}
          mode={editor.mode}
          initialForm={editor.form}
          source={editor.source}
          onCancel={() => setEditor(null)}
          onSave={handleSave}
        />
      ) : null}
      {share ? (
        <RecipeShareImportPanel
          open
          onClose={() => setShare(null)}
          method={method}
          initialTab={share.tab}
          shareRecipe={share.recipe}
          onImport={library.importJson}
          onResolveConflict={library.resolveImportConflict}
          writeClipboard={writeClipboard}
        />
      ) : null}
      <ConfirmDeleteRecipeDialog
        open={toDelete !== null}
        recipe={toDelete}
        isActive={toDelete?.id === library.activeRecipe.id}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) library.deleteCustom(toDelete.id);
          setToDelete(null);
        }}
      />
    </>
  );
};
