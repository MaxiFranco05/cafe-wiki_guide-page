import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from '../../App';
import { t } from '../../i18n';

describe('MVP End-to-End Integration Flows (Flujo 1 to Flujo 4 — C-12)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('Flujo 1: Home -> Hario V60 -> bidirectional scaling + non-blocking range warning recovery', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );

    // 1. Navigate from Home to Hario V60
    const v60Link = screen.getByRole('link', { name: /Abrir Hario V60/i });
    await user.click(v60Link);

    expect(await screen.findByRole('heading', { name: /Hario V60/i })).toBeInTheDocument();

    const coffeeInput = (await screen.findByLabelText(t('brew.dryCoffeeLabel'))) as HTMLInputElement;
    const waterInput = screen.getByLabelText(t('brew.waterTotalLabel')) as HTMLInputElement;

    expect(coffeeInput.value).toBe('15');
    expect(waterInput.value).toBe('240');

    // 2. Bidirectional scaling: coffee 15 -> 30 updates water to 480 (1:16)
    await user.clear(coffeeInput);
    await user.type(coffeeInput, '30');
    expect(Number(waterInput.value)).toBeCloseTo(480, 0);

    // 3. Out-of-range dose (5 g < V60 min 10 g) triggers non-blocking status warning
    await user.clear(coffeeInput);
    await user.type(coffeeInput, '5');
    expect(
      screen.getByRole('status', { name: t('brew.warnings.bannerLabel') })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar extracción/i })).toBeEnabled();

    // 4. Returning inside range clears warning immediately
    await user.clear(coffeeInput);
    await user.type(coffeeInput, '18');
    expect(screen.queryByRole('status', { name: t('brew.warnings.bannerLabel') })).toBeNull();
  });

  it('Flujo 2: Brew Timer full control cycle (Start -> Pause -> Resume -> Reset)', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/brew/v60']}>
        <AppRoutes />
      </MemoryRouter>
    );

    const startBtn = await screen.findByRole('button', { name: /iniciar extracción/i });
    await user.click(startBtn);

    // Running state shows Pause and Reset controls
    const pauseBtn = await screen.findByRole('button', { name: /pausar/i });
    expect(pauseBtn).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reiniciar a 00:00/i })).toBeInTheDocument();

    // Pause -> Resume
    await user.click(pauseBtn);
    const resumeBtn = await screen.findByRole('button', { name: /reanudar/i });
    await user.click(resumeBtn);
    expect(await screen.findByRole('button', { name: /pausar/i })).toBeInTheDocument();

    // Reset back to idle 00:00
    await user.click(screen.getByRole('button', { name: /reiniciar a 00:00/i }));
    expect(await screen.findByRole('button', { name: /iniciar extracción/i })).toBeInTheDocument();
  });

  it('Flujo 3: Espresso mode calculates Ristretto (27 g), Normale (36 g), and Lungo (54 g) yields for 18 g dose', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/brew/espresso']}>
        <AppRoutes />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Espresso/i })).toBeInTheDocument();

    const doseInput = screen.getByLabelText(t('brew.espresso.doseLabel')) as HTMLInputElement;
    expect(doseInput.value).toBe('18');

    const ristrettoBtn = screen.getByRole('button', { name: /ristretto/i });
    const normaleBtn = screen.getByRole('button', { name: /normale/i });
    const lungoBtn = screen.getByRole('button', { name: /lungo/i });

    expect(ristrettoBtn).toHaveTextContent(/27\s*g/i);
    expect(normaleBtn).toHaveTextContent(/36\s*g/i);
    expect(lungoBtn).toHaveTextContent(/54\s*g/i);

    await user.click(ristrettoBtn);
    expect(ristrettoBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('Flujo 4: Wiki -> Orígenes -> Kenia -> Mora chip -> Flavor Wheel (?from=origenes/kenya) -> Return to Kenia -> Brew CTA', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/wiki']}>
        <AppRoutes />
      </MemoryRouter>
    );

    // 1. Wiki home -> Orígenes section
    const sectionsNav = await screen.findByRole('navigation', { name: /secciones de la wiki/i });
    await user.click(within(sectionsNav).getByRole('link', { name: /orígenes/i }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Orígenes' })).toBeInTheDocument();

    // 2. Orígenes -> Kenia detail
    await user.click(screen.getByRole('link', { name: /kenia/i }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Kenia' })).toBeInTheDocument();

    // 3. Click Mora chip -> Flavor Wheel with deep link & return link
    const moraLink = screen.getByRole('link', { name: /mora/i });
    expect(moraLink.getAttribute('href')).toContain('/flavor-wheel?node=fruity.berry.blackberry');
    await user.click(moraLink);

    expect(await screen.findByText('Rueda de Sabores SCA')).toBeInTheDocument();
    const returnToKenya = await screen.findByRole('link', { name: /volver a kenia/i });
    expect(returnToKenya).toHaveAttribute('href', '/wiki/origenes/kenya');

    // 4. Return to Kenia -> 1-tap Brew CTA
    await user.click(returnToKenya);
    expect(await screen.findByRole('heading', { level: 1, name: 'Kenia' })).toBeInTheDocument();

    const brewLinks = screen
      .getAllByRole('link')
      .filter((el) => el.getAttribute('href')?.startsWith('/brew/'));
    expect(brewLinks.length).toBeGreaterThan(0);

    await user.click(brewLinks[0]!);
    expect(await screen.findByRole('button', { name: /iniciar extracción/i })).toBeInTheDocument();
  });
});
