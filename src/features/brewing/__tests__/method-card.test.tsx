import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { MethodCard } from '../components/MethodCard';
import {
  v60Method,
  chemexMethod,
  melittaMethod,
  aeropressMethod,
  frenchPressMethod,
  espressoMethod,
} from '../../../data/methods';

describe('MethodCard (C-03 D-02)', () => {
  it('renders v60 card with SVG vessel silhouette, moody photo, category badge, metrics, and brew link', () => {
    const { container } = render(
      <MemoryRouter>
        <MethodCard method={v60Method} />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: /Hario V60/i });
    expect(link).toHaveAttribute('href', '/brew/v60');

    const vesselSvg = container.querySelector('svg[data-vessel-type="cone_v60"]');
    expect(vesselSvg).toBeInTheDocument();
    expect(vesselSvg).toHaveAttribute('aria-hidden', 'true');

    expect(screen.getByText('Filtro · Pour-Over')).toBeInTheDocument();
    expect(screen.getByText('Guía Estándar')).toBeInTheDocument();
    expect(screen.getByText('Ratio 1:16.7')).toBeInTheDocument();
    expect(screen.getByText('15 g')).toBeInTheDocument();
    expect(screen.getByText('3:30 min')).toBeInTheDocument();
  });

  it('renders espresso card with portafilter SVG silhouette and Yield 1:2 metric', () => {
    const { container } = render(
      <MemoryRouter>
        <MethodCard method={espressoMethod} />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: /Espresso/i });
    expect(link).toHaveAttribute('href', '/brew/espresso');

    const vesselSvg = container.querySelector('svg[data-vessel-type="portafilter_espresso"]');
    expect(vesselSvg).toBeInTheDocument();

    expect(screen.getByText('Presión · 9 Bar')).toBeInTheDocument();
    expect(screen.getByText('Yield 1:2')).toBeInTheDocument();
    expect(screen.getByText('18 g')).toBeInTheDocument();
    expect(screen.getByText('25–30 s')).toBeInTheDocument();
  });

  it('renders distinct SVG silhouettes and localized badges across Chemex, Melitta, AeroPress, and French Press', () => {
    const cases = [
      { method: chemexMethod, vessel: 'hourglass_chemex', href: '/brew/chemex', dose: '30 g' },
      { method: melittaMethod, vessel: 'wedge_melitta', href: '/brew/melitta', dose: '20 g' },
      { method: aeropressMethod, vessel: 'cylinder_aeropress', href: '/brew/aeropress', dose: '15 g' },
      { method: frenchPressMethod, vessel: 'beaker_french_press', href: '/brew/french-press', dose: '30 g' },
    ];

    for (const c of cases) {
      const { container, unmount } = render(
        <MemoryRouter>
          <MethodCard method={c.method} />
        </MemoryRouter>
      );

      expect(container.querySelector(`svg[data-vessel-type="${c.vessel}"]`)).toBeInTheDocument();
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', c.href);
      expect(screen.getByText(c.dose)).toBeInTheDocument();

      // Zero emojis policy check
      const emojiRegex = /[\u{1F300}-\u{1FAFF}]/u;
      expect(emojiRegex.test(container.textContent ?? '')).toBe(false);

      unmount();
    }
  });
});
