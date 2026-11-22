import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FlavorTastingGuide } from '../components/FlavorTastingGuide';

describe('FlavorTastingGuide', () => {
  it('asks what the user tastes and offers three starting families', async () => {
    const onPick = vi.fn();
    render(<FlavorTastingGuide onPick={onPick} />);
    expect(screen.getByRole('heading', { name: '¿Qué sentís en la taza?' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    const examples = screen.getByRole('group', { name: 'Familias para empezar' });
    expect(examples).toHaveTextContent('Frutal');
    expect(examples).toHaveTextContent('Dulce');
    expect(examples).toHaveTextContent('Tostado');
    await userEvent.click(screen.getByRole('button', { name: 'Dulce' }));
    expect(onPick).toHaveBeenCalledWith('sweet');
  });

  it('offers to hide itself only when a dismiss action is given', async () => {
    const onDismiss = vi.fn();
    const { rerender } = render(<FlavorTastingGuide onPick={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Ocultar guía' })).not.toBeInTheDocument();
    rerender(<FlavorTastingGuide onPick={vi.fn()} onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button', { name: 'Ocultar guía' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
