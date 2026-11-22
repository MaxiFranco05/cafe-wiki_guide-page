import React from 'react';
import { t } from '../../../i18n';
import type { WikiChapterData } from './WikiChapter';
import { UiIcon } from './WikiIcons';

/**
 * Editorial history content (history, symbolism, milestones). The catalog does not provide it yet:
 * it arrives with the editorial catalog (C-16), with sources. Until then the chapter is omitted.
 */
export interface EditorialContent {
  readonly subtitle: string;
  readonly paragraphs: readonly string[];
  readonly symbolismLabel: string;
  readonly symbolism: string;
  readonly milestones: readonly { readonly when: string; readonly text: string }[];
}

export function buildStoryChapter(content: EditorialContent | undefined): WikiChapterData | null {
  if (!content) return null;
  return {
    id: 'historia',
    title: t('wiki.ui.chapters.story.title'),
    sub: content.subtitle,
    story: true,
    content: (
      <>
        <div className="w-prose-stack">
          {content.paragraphs.map((paragraph) => (
            <p key={paragraph} className="w-prose">
              {paragraph}
            </p>
          ))}
        </div>
        <aside className="w-callout">
          <span className="w-callout-label">
            <UiIcon name="spark" size={13} /> {content.symbolismLabel}
          </span>
          <p>{content.symbolism}</p>
        </aside>
        {content.milestones.length > 0 && (
          <ol className="w-timeline">
            {content.milestones.map((milestone) => (
              <li key={milestone.when}>
                <time>{milestone.when}</time>
                <span>{milestone.text}</span>
              </li>
            ))}
          </ol>
        )}
      </>
    ),
  };
}

/** Story already present in the catalog (drinks, C-15): shown as "Origen e historia". */
export function buildOriginStoryChapter(story: string | undefined, summary: string): WikiChapterData | null {
  if (!story || story === summary) return null;
  return {
    id: 'historia',
    title: t('wiki.ui.chapters.originStory.title'),
    sub: t('wiki.ui.chapters.originStory.sub'),
    story: true,
    content: <p className="w-prose">{story}</p>,
  };
}
