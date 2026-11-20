import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { getDrinkBySlug } from '../../../data/wiki-drinks';
import { getRecipeById } from '../../../data/recipes';
import { getWikiItem } from '../sections';
import { SensoryWheel } from '../components/SensoryWheel';
import { BrewerIcon } from '../components/BrewerIcon';
import { BrewerPhoto } from '../components/BrewerPhoto';
import { WikiEntryCard } from '../components/WikiEntryCard';
import { WikiSectionCard } from '../components/WikiSectionCard';
import { WikiChapterList, WikiChapterIndex, type WikiChapterData } from '../components/WikiChapter';
import { FlavorNoteChips } from '../components/FlavorNoteChips';
import { RecommendedMethodCard } from '../components/RecommendedMethodCard';
import { RecipeTabs } from '../components/RecipeTabs';
import { DrinkComposition } from '../components/DrinkComposition';
import { WikiRelationChips, buildBrewerCoffeesGroups } from '../components/WikiRelations';
import { buildStoryChapter } from '../components/WikiStoryChapter';

const wrap = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('SensoryWheel', () => {
  const profile = { acidity: 5, sweetness: 4, body: 2, bitterness: 1 };

  it('full: fills each sector up to value/5 and announces every value', () => {
    const { container } = render(<SensoryWheel profile={profile} variant="full" />);
    const svg = screen.getByRole('img', { name: /acidez 5 de 5, dulzor 4 de 5, cuerpo 2 de 5, amargor 1 de 5/i });
    expect(svg).toBeInTheDocument();
    const radii = [...container.querySelectorAll('[data-sector]')].map((el) => Number(el.getAttribute('data-radius')));
    expect(radii).toEqual([104, 83.2, 41.6, 20.8]);
    expect(screen.getByText('5/5')).toBeInTheDocument();
    expect(screen.getByText(/predomina/i)).toHaveTextContent('Predomina acidez (5/5).');
  });

  it('compact: decorative graphic only, without labels', () => {
    const { container } = render(<SensoryWheel profile={profile} variant="compact" />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg.querySelectorAll('text')).toHaveLength(0);
  });
});

describe('BrewerIcon and BrewerPhoto', () => {
  it('renders an icon for station and encyclopedic brewers, with a fallback', () => {
    for (const slug of ['v60', 'espresso-machine', 'moka', 'siphon', 'cezve', 'electric-drip', 'unknown']) {
      const { container, unmount } = render(<BrewerIcon slug={slug} />);
      expect(container.querySelector('svg'), slug).not.toBeNull();
      unmount();
    }
  });

  it('renders the photo lazily with a one-line caption', () => {
    render(<BrewerPhoto slug="moka" title="Cafetera Moka" />);
    const img = screen.getByRole('img', { name: 'Cafetera Moka' });
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img.getAttribute('src')).toContain('moka-moody.jpg');
    expect(screen.getByText(/cuerpo octogonal/i)).toBeInTheDocument();
  });

  it('renders nothing for a brewer without photo', () => {
    const { container } = render(<BrewerPhoto slug="unknown" title="X" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('cards', () => {
  it('WikiEntryCard links to the entry and shows the dominant profile and up to three notes', () => {
    const kenya = getWikiItem('origenes', 'kenya')!;
    wrap(<WikiEntryCard item={kenya} />);
    const link = screen.getByRole('link', { name: /^kenia\./i });
    expect(link).toHaveAttribute('href', '/wiki/origenes/kenya');
    expect(within(link).getByText(/predomina:/i)).toHaveTextContent(/acidez 5/i);
    expect(link.querySelectorAll('.w-note').length).toBeLessThanOrEqual(3);
  });

  it('WikiEntryCard shows station and recipe badges for brewers and milk/volume for drinks', () => {
    wrap(<WikiEntryCard item={getWikiItem('cafeteras', 'v60')!} />);
    expect(screen.getByText('Con estación')).toBeInTheDocument();
    expect(screen.getByText(/4 recetas/i)).toBeInTheDocument();
    wrap(<WikiEntryCard item={getWikiItem('bebidas', 'cappuccino')!} />);
    expect(screen.getByText('Con leche')).toBeInTheDocument();
  });

  it('WikiSectionCard links to the section with its entry count', () => {
    wrap(<WikiSectionCard slug="varietales" />);
    const link = screen.getByRole('link', { name: /varietales/i });
    expect(link).toHaveAttribute('href', '/wiki/varietales');
    expect(link).toHaveTextContent('16 fichas');
  });
});

describe('chapters', () => {
  const chapters: (WikiChapterData | null)[] = [
    null,
    { id: 'a', title: 'Primero', content: <p>uno</p> },
    null,
    { id: 'b', title: 'Segundo', sub: 'sub', content: <p>dos</p> },
  ];

  it('numbers only the chapters that exist, consecutively', () => {
    render(<WikiChapterList chapters={chapters.filter((c): c is WikiChapterData => c !== null)} />);
    const nums = [...document.querySelectorAll('.w-chapter-num')].map((n) => n.textContent);
    expect(nums).toEqual(['01', '02']);
    expect(screen.getByRole('heading', { name: 'Segundo' })).toBeInTheDocument();
  });

  it('index scrolls to a chapter and moves focus to its title', () => {
    const list = chapters.filter((c): c is WikiChapterData => c !== null);
    render(
      <>
        <WikiChapterList chapters={list} />
        <WikiChapterIndex chapters={list} />
      </>,
    );
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    fireEvent.click(screen.getByRole('button', { name: /02 segundo/i }));
    expect(scroll).toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Segundo' })).toHaveFocus();
  });

  it('index is not rendered with fewer than two chapters', () => {
    const { container } = render(<WikiChapterIndex chapters={[{ id: 'a', title: 'Solo', content: null }]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('links to other parts of the app', () => {
  it('FlavorNoteChips link to the flavor wheel with node and origin entry', () => {
    wrap(<FlavorNoteChips nodeIds={['fruity.berry.blackberry']} from="origenes/kenya" />);
    expect(screen.getByRole('link', { name: /mora/i })).toHaveAttribute(
      'href',
      '/flavor-wheel?node=fruity.berry.blackberry&from=origenes%2Fkenya',
    );
  });

  it('RecommendedMethodCard prepares in one tap and links to the brewer page', () => {
    wrap(<RecommendedMethodCard methodId="v60" profileId="light" reason="Motivo" primary />);
    expect(screen.getByRole('link', { name: 'Preparar en Hario V60 (Liviano)' })).toHaveAttribute('href', '/brew/v60?profile=light');
    expect(screen.getByRole('link', { name: /conocer la hario v60/i })).toHaveAttribute('href', '/wiki/cafeteras/v60');
  });

  it('RecipeTabs split author and traditional recipes and open them in the station', () => {
    const recipes = ['v60-standard', 'v60-hoffmann-1cup', 'v60-kasuya-4-6'].map((id) => getRecipeById(id)!);
    wrap(<RecipeTabs methodId="v60" recipes={recipes} />);
    expect(screen.getAllByRole('link', { name: /preparar esta receta/i })[0]).toHaveAttribute('href', '/brew/v60?recipe=v60-hoffmann-1cup');
    fireEvent.click(screen.getByRole('tab', { name: /tradicionales/i }));
    expect(screen.getByRole('tab', { name: /tradicionales/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('link', { name: /preparar esta receta/i })[0]).toHaveAttribute('href', '/brew/v60?recipe=v60-standard');
  });

  it('DrinkComposition shows layers, scale and a short caption', () => {
    render(<DrinkComposition drink={getDrinkBySlug('cappuccino')!} />);
    expect(screen.getByRole('img', { name: /composición en taza mediana \(150 a 180 ml\)/i })).toBeInTheDocument();
    expect(screen.getByText('Taza mediana · escala en ml (máx. 200)')).toBeInTheDocument();
    expect(screen.getByText('34%')).toBeInTheDocument();
  });
});

describe('relations and editorial chapters', () => {
  it('WikiRelationChips link each related entry', () => {
    wrap(<WikiRelationChips section="varietales" items={[getWikiItem('varietales', 'bourbon')!]} />);
    expect(screen.getByRole('link', { name: 'Bourbon' })).toHaveAttribute('href', '/wiki/varietales/bourbon');
  });

  it('buildBrewerCoffeesGroups lists the entries that recommend a brewer, with their profile', () => {
    const groups = buildBrewerCoffeesGroups('chemex');
    expect(groups.map((g) => g.section)).toEqual(['origenes', 'varietales', 'procesos']);
    expect(groups[0]!.entries.every((e) => e.profileLabel.length > 0)).toBe(true);
    expect(buildBrewerCoffeesGroups(null)).toEqual([]);
  });

  it('buildStoryChapter returns null without editorial content and a chapter with it', () => {
    expect(buildStoryChapter(undefined)).toBeNull();
    const chapter = buildStoryChapter({
      subtitle: 'Sub',
      paragraphs: ['Párrafo uno'],
      symbolismLabel: 'Simbología',
      symbolism: 'Texto',
      milestones: [{ when: '1921', text: 'Hito' }],
    })!;
    render(<>{chapter.content}</>);
    expect(chapter.title).toBe('Historia y simbología cultural');
    expect(screen.getByText('Párrafo uno')).toBeInTheDocument();
    expect(screen.getByText('1921')).toBeInTheDocument();
  });
});
