import React from 'react';
import { t } from '../../../i18n';

/** A detail-page chapter. Builders return `null` when there is no content, so it is never rendered. */
export interface WikiChapterData {
  readonly id: string;
  readonly title: string;
  readonly sub?: string;
  readonly story?: boolean;
  readonly content: React.ReactNode;
}

const chapterNumber = (index: number) => String(index + 1).padStart(2, '0');

/** Renders chapters numbered at render time, so numbers stay consecutive when some are omitted. */
export const WikiChapterList: React.FC<{ readonly chapters: readonly WikiChapterData[] }> = ({ chapters }) => (
  <>
    {chapters.map((chapter, index) => (
      <section
        key={chapter.id}
        id={`ch-${chapter.id}`}
        className={`w-chapter w-o3 ${chapter.story ? 'w-chapter--story' : ''}`}
        aria-labelledby={`h-${chapter.id}`}
      >
        <div className="w-chapter-head">
          <span className="w-chapter-num" aria-hidden="true">
            {chapterNumber(index)}
          </span>
          <h2 id={`h-${chapter.id}`} tabIndex={-1}>
            {chapter.title}
          </h2>
          {chapter.sub && <p className="w-chapter-sub">{chapter.sub}</p>}
        </div>
        {chapter.content}
      </section>
    ))}
  </>
);

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Sticky "En esta ficha" index (desktop). Jumps to a chapter and moves focus to its title. */
export const WikiChapterIndex: React.FC<{ readonly chapters: readonly WikiChapterData[] }> = ({ chapters }) => {
  if (chapters.length < 2) return null;
  const goTo = (id: string) => {
    const section = document.getElementById(`ch-${id}`);
    if (!section) return;
    section.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    document.getElementById(`h-${id}`)?.focus({ preventScroll: true });
  };
  return (
    <nav className="w-toc" aria-labelledby="w-toc-title">
      <h2 id="w-toc-title">{t('wiki.ui.detail.tocTitle')}</h2>
      <ol>
        {chapters.map((chapter, index) => (
          <li key={chapter.id}>
            <button type="button" onClick={() => goTo(chapter.id)}>
              <span>{chapterNumber(index)}</span>
              {chapter.title}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
};
