import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// `server-only` protege el codigo privilegiado en produccion, pero en pruebas
// impide importar los modulos de servidor que precisamente queremos verificar.
vi.mock('server-only', () => ({}));

afterEach(() => {
  cleanup();
});
