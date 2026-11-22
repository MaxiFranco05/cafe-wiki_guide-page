import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { METHODS_CATALOG } from '../../data/methods';
import { WIKI_SECTIONS } from '../../features/wiki/sections';
import { t } from '../../i18n';

interface SearchEntry {
  readonly id: string;
  readonly href: string;
  readonly group: string;
  readonly title: string;
  readonly subtitle: string;
  readonly searchBlob: string;
}

function normalizeSearchText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export const GlobalSearch: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const searchIndex = useMemo<readonly SearchEntry[]>(() => {
    const methodGroup = t('nav.search.groups.methods');
    const wikiGroup = t('nav.search.groups.wiki');
    const wheelGroup = t('nav.search.groups.wheel');

    const methodEntries: SearchEntry[] = METHODS_CATALOG.map((method) => {
      const title = t(method.nameKey);
      const subtitle = t(`home.categoryBadges.${method.category}`);
      const profileKeywords = method.profiles
        .map((p) => `${t(p.labelKey)} ${t(p.descriptionKey)} ${p.referenceAuthor}`)
        .join(' ');
      return {
        id: `method-${method.id}`,
        href: `/brew/${method.id}`,
        group: methodGroup,
        title,
        subtitle,
        searchBlob: normalizeSearchText(`${method.id} ${title} ${subtitle} ${profileKeywords}`),
      };
    });

    const wikiEntries: SearchEntry[] = [
      {
        id: 'wiki-index',
        href: '/wiki',
        group: wikiGroup,
        title: t('wiki.title'),
        subtitle: t('nav.search.entries.wiki.indexSubtitle'),
        searchBlob: normalizeSearchText(
          `wiki ${t('wiki.title')} ${t('nav.search.entries.wiki.indexSubtitle')}`
        ),
      },
      // Real catalog entries of every wiki section (C-10), searchable by title and aliases.
      ...WIKI_SECTIONS.flatMap((section) => {
        const subtitle = t(`wiki.ui.sections.${section.slug}.singular`);
        return section.items.map((item) => ({
          id: `wiki-${section.slug}-${item.slug}`,
          href: `/wiki/${section.slug}/${item.slug}`,
          group: wikiGroup,
          title: item.title,
          subtitle,
          searchBlob: normalizeSearchText(`${item.slug} ${item.title} ${item.aliases} ${subtitle}`),
        }));
      }),
    ];

    const wheelTitle = t('wheel.title');
    const wheelSubtitle = t('nav.search.entries.wheel.subtitle');
    const wheelKeywords = t('nav.search.entries.wheel.keywords');
    const wheelEntry: SearchEntry = {
      id: 'flavor-wheel',
      href: '/flavor-wheel',
      group: wheelGroup,
      title: wheelTitle,
      subtitle: wheelSubtitle,
      searchBlob: normalizeSearchText(`${wheelTitle} ${wheelSubtitle} ${wheelKeywords}`),
    };

    return [...methodEntries, ...wikiEntries, wheelEntry];
  }, []);

  const normalizedQuery = normalizeSearchText(query);
  const filteredResults = useMemo(() => {
    if (!normalizedQuery) return [];
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    return searchIndex
      .filter((entry) => tokens.every((token) => entry.searchBlob.includes(token)))
      .slice(0, 8);
  }, [normalizedQuery, searchIndex]);

  useEffect(() => {
    const handleOutsideMouseDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleOutsideMouseDown);
    return () => document.removeEventListener('mousedown', handleOutsideMouseDown);
  }, []);

  const selectEntry = (entry: SearchEntry) => {
    setIsOpen(false);
    setActiveIndex(-1);
    setQuery('');
    navigate(entry.href);
    inputRef.current?.blur();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen && normalizedQuery) setIsOpen(true);
      setActiveIndex((prev) =>
        filteredResults.length === 0 ? -1 : (prev + 1) % filteredResults.length
      );
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) =>
        filteredResults.length === 0
          ? -1
          : (prev - 1 + filteredResults.length) % filteredResults.length
      );
      return;
    }

    if (event.key === 'Enter' && isOpen && filteredResults.length > 0) {
      const targetIndex = activeIndex >= 0 ? activeIndex : 0;
      const chosen = filteredResults[targetIndex];
      if (chosen) {
        event.preventDefault();
        selectEntry(chosen);
      }
    }
  };

  const showDropdown = isOpen && normalizedQuery.length > 0;

  return (
    <div ref={containerRef} className="relative shrink-0">
      <div className="flex items-center h-10 w-40 sm:w-52 lg:w-60 rounded-[10px] bg-surface border border-border-subtle focus-within:border-accent px-2.5 gap-2 transition-colors">
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="text-text-secondary shrink-0"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          ref={inputRef}
          type="search"
          value={query}
          aria-label={t('nav.search.ariaLabel')}
          aria-expanded={showDropdown}
          aria-controls="global-search-results"
          placeholder={t('nav.search.placeholder')}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            if (normalizedQuery) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className="w-full min-w-0 bg-transparent border-none outline-none text-xs text-text-primary placeholder:text-text-muted [&::-webkit-search-cancel-button]:hidden"
        />

        {query.length > 0 && (
          <button
            type="button"
            aria-label={t('nav.search.clearAriaLabel')}
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            className="inline-flex items-center justify-center w-6 h-6 rounded-md text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors cursor-pointer shrink-0"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          id="global-search-results"
          role="listbox"
          aria-label={t('nav.search.resultsAriaLabel')}
          className="absolute top-[calc(100%+8px)] right-0 w-[min(92vw,360px)] z-50 rounded-[14px] bg-surface border border-border-strong shadow-card p-1.5 max-h-[360px] overflow-y-auto"
        >
          {filteredResults.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-text-muted">
              {t('nav.search.noResults', { query: query.trim() })}
            </div>
          ) : (
            <ul className="m-0 p-0 list-none space-y-0.5">
              {filteredResults.map((entry, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => selectEntry(entry)}
                      className={`w-full text-left px-3 py-2.5 rounded-[10px] flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-accent-soft text-text-primary'
                          : 'bg-transparent text-text-primary hover:bg-elevated'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-text-primary truncate">
                          {entry.title}
                        </div>
                        <div className="text-xs text-text-secondary truncate">{entry.subtitle}</div>
                      </div>
                      <span className="shrink-0 font-mono text-[10px] px-2 py-0.5 rounded-md bg-canvas border border-border-subtle text-gold">
                        {entry.group}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
