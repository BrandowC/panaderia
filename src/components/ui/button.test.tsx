import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('usa type="button" para no enviar formularios por accidente', () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole('button', { name: 'Guardar' })).toHaveAttribute('type', 'button');
  });

  it('permite declarar explicitamente type="submit"', () => {
    render(<Button type="submit">Entrar</Button>);
    expect(screen.getByRole('button', { name: 'Entrar' })).toHaveAttribute('type', 'submit');
  });

  it('ejecuta el manejador al hacer clic', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Sumar</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Sumar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('bloquea el clic mientras esta cargando y anuncia el estado', async () => {
    const onClick = vi.fn();
    render(
      <Button isLoading onClick={onClick}>
        Finalizar
      </Button>,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('no dispara acciones cuando esta deshabilitado', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Archivar
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Archivar' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('mantiene una altura tactil suficiente en todas las variantes', () => {
    const { rerender } = render(<Button size="md">Contar</Button>);
    expect(screen.getByRole('button')).toHaveClass('min-h-touch');

    rerender(<Button size="lg">Contar</Button>);
    expect(screen.getByRole('button')).toHaveClass('min-h-14');
  });
});
