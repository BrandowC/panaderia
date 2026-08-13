import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input } from './input';

describe('Input', () => {
  it('asocia la etiqueta visible con el campo', () => {
    render(<Input label="Cantidad" />);
    expect(screen.getByLabelText('Cantidad')).toBeInTheDocument();
  });

  it('anuncia el error con role alert y aria-invalid', () => {
    render(<Input label="Correo" error="El correo no es valido." />);

    const field = screen.getByLabelText('Correo');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('El correo no es valido.');
    expect(field.getAttribute('aria-describedby')).toContain(screen.getByRole('alert').id);
  });

  it('no marca aria-invalid cuando no hay error', () => {
    render(<Input label="Correo" />);
    expect(screen.getByLabelText('Correo')).not.toHaveAttribute('aria-invalid');
  });

  it('vincula la ayuda mediante aria-describedby', () => {
    render(<Input label="Cantidad" hint="Solo numeros enteros." />);
    const field = screen.getByLabelText('Cantidad');
    const hint = screen.getByText('Solo numeros enteros.');
    expect(field.getAttribute('aria-describedby')).toContain(hint.id);
  });

  it('genera identificadores distintos para cada instancia', () => {
    render(
      <>
        <Input label="Uno" />
        <Input label="Dos" />
      </>,
    );
    expect(screen.getByLabelText('Uno').id).not.toBe(screen.getByLabelText('Dos').id);
  });
});
