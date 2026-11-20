import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../../../App';
import { t } from '../../../i18n';
import { getRecipeById } from '../../../data/recipes';

const renderAt = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <AppRoutes />
    </MemoryRouter>,
  );

const notFound = () => screen.queryByText('404 — Ruta no encontrada');

beforeEach(() => {
  window.localStorage.clear();
});

describe('WikiHomeView (/wiki)', () => {
  it('shows one card per section and no combined list of entries', () => {
    renderAt('/wiki');
    const nav = screen.getByRole('navigation', { name: /secciones de la wiki/i });
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/wiki/origenes',
      '/wiki/varietales',
      '/wiki/procesos',
      '/wiki/cafeteras',
      '/wiki/bebidas',
    ]);
    expect(screen.queryByRole('link', { name: /^kenia\./i })).toBeNull();
  });
});

describe('WikiSectionView (/wiki/:section)', () => {
  it('lists only the origins, grouped by region, with a result count', () => {
    renderAt('/wiki/origenes');
    expect(screen.getByRole('heading', { level: 1, name: 'Orígenes' })).toBeInTheDocument();
    expect(screen.getByText(/16 fichas/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /sudamérica/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^bourbon\./i })).toBeNull();
  });

  it('searches without accents inside the section', () => {
    renderAt('/wiki/origenes');
    fireEvent.change(screen.getByRole('searchbox', { name: /buscar en orígenes/i }), { target: { value: 'etiopia' } });
    expect(screen.getByRole('link', { name: /^etiopía\./i })).toBeInTheDocument();
    expect(screen.getByText(/1 ficha$/i)).toBeInTheDocument();
  });

  it('filters by subgroup and profile from the URL', () => {
    renderAt('/wiki/origenes?grupo=africa&perfil=acidez');
    const cards = screen.getAllByRole('link', { name: /de 5/i });
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThanOrEqual(3);
  });

  it('filters varietals by flavor family', () => {
    renderAt('/wiki/varietales?familia=fruity');
    expect(screen.getAllByRole('link', { name: /de 5/i }).length).toBeGreaterThan(0);
  });

  it('shows an empty state that clears search and filters', () => {
    renderAt('/wiki/origenes?q=xyz');
    expect(screen.getByRole('heading', { name: /no hay orígenes con esos filtros/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /limpiar búsqueda y filtros/i }));
    expect(screen.getByText(/16 fichas/i)).toBeInTheDocument();
  });

  it('restores the filters when coming back from an entry', () => {
    renderAt('/wiki/origenes?perfil=acidez');
    fireEvent.click(screen.getByRole('link', { name: /^kenia\./i }));
    expect(screen.getByRole('heading', { level: 1, name: 'Kenia' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: /volver a orígenes/i }));
    // The filter panel is collapsed, so its chips are hidden from the accessibility tree.
    expect(screen.getByRole('button', { name: /acidez alta/i, hidden: true })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /perfil y sabor/i })).toHaveTextContent('1');
  });

  it('renders 404 for an unknown section', () => {
    renderAt('/wiki/granos');
    expect(notFound()).toBeInTheDocument();
  });
});

describe('WikiEntryDetailView (/wiki/:section/:entrySlug)', () => {
  it('Kenia: header facts, wheel, related varietals and numbered chapters', () => {
    renderAt('/wiki/origenes/kenya');
    expect(screen.getByRole('heading', { level: 1, name: 'Kenia' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /acidez 5 de 5/i })).toBeInTheDocument();
    expect(screen.getByText('Altitud')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Varietales que se cultivan' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sl28/i })).toHaveAttribute('href', '/wiki/varietales/sl28-sl34');
    const nums = [...document.querySelectorAll('.w-chapter-num')].map((n) => n.textContent);
    expect(nums).toEqual(['01', '02']);
  });

  it('Brasil without editorial history starts at 01 and never repeats the summary', () => {
    renderAt('/wiki/origenes/brazil');
    expect(screen.queryByRole('heading', { name: /historia/i })).toBeNull();
    const nums = [...document.querySelectorAll('.w-chapter-num')].map((n) => n.textContent);
    expect(nums[0]).toBe('01');
    const summary = screen.getByText(/primer productor mundial/i);
    expect(screen.getAllByText(summary.textContent ?? '')).toHaveLength(1);
  });

  it('varietal shows where it is grown', () => {
    renderAt('/wiki/varietales/bourbon');
    expect(screen.getByRole('heading', { name: 'Dónde se cultiva' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /brasil/i })).toHaveAttribute('href', '/wiki/origenes/brazil');
  });

  it('process shows its own facts and no altitude', () => {
    renderAt('/wiki/procesos/honey');
    expect(screen.getByText('Mucílago')).toBeInTheDocument();
    expect(screen.queryByText('Altitud')).toBeNull();
  });

  it('brewer with station: recipes come first, then how it works and the coffees that shine in it', () => {
    renderAt('/wiki/cafeteras/chemex');
    const titles = [...document.querySelectorAll('.w-chapter h2')].map((h) => h.textContent);
    expect(titles[0]).toBe('Recetas de autor y tradicionales');
    expect(titles[1]).toBe('Cómo funciona');
    expect(titles).toContain('Cafés que lucen en esta cafetera');
    expect(screen.getByRole('link', { name: /abrir estación chemex/i })).toHaveAttribute('href', '/brew/chemex');
    expect(screen.getByRole('navigation', { name: /en esta ficha/i })).toBeInTheDocument();
  });

  it('encyclopedic brewer shows its traditional preparation and no station', () => {
    renderAt('/wiki/cafeteras/moka');
    expect(screen.getByRole('heading', { name: 'Cómo se prepara' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /abrir estación/i })).toBeNull();
    expect(screen.getByRole('img', { name: 'Cafetera Moka' })).toBeInTheDocument();
  });

  it('drink shows its composition and its story from the catalog', () => {
    renderAt('/wiki/bebidas/cappuccino');
    expect(screen.getByRole('heading', { name: 'Composición y proporciones' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Origen e historia' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /preparar la base en espresso/i })).toHaveAttribute('href', '/brew/espresso?profile=normale');
  });

  it('caps long alias lists at three', () => {
    renderAt('/wiki/origenes/brazil');
    expect(screen.getByText(/y 3 más/i)).toBeInTheDocument();
  });

  it('renders 404 for an entry of another section', () => {
    renderAt('/wiki/procesos/kenya');
    expect(notFound()).toBeInTheDocument();
  });
});

describe('one-tap preparation and cross links', () => {
  it('Kenia -> "Preparar en Hario V60 (Liviano)" opens the station with Liviano selected', () => {
    renderAt('/wiki/origenes/kenya');
    fireEvent.click(screen.getByRole('link', { name: 'Preparar en Hario V60 (Liviano)' }));
    expect(screen.getByRole('heading', { name: /hario v60/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /liviano/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('V60 -> "Preparar esta receta" opens the station with that recipe', () => {
    renderAt('/wiki/cafeteras/v60');
    const firstAuthor = getRecipeById('v60-hoffmann-1cup')!;
    fireEvent.click(screen.getAllByRole('link', { name: /preparar esta receta/i })[0]!);
    expect(screen.getAllByText(t(firstAuthor.titleKey)).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /iniciar extracción/i })).toBeInTheDocument();
  });

  it('Kenia -> "Conocer la Hario V60" opens the brewer page', () => {
    renderAt('/wiki/origenes/kenya');
    fireEvent.click(screen.getByRole('link', { name: /conocer la hario v60/i }));
    expect(screen.getByRole('heading', { level: 1, name: 'Hario V60' })).toBeInTheDocument();
  });
});
