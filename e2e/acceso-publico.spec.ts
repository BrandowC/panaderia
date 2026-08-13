import { expect, test } from '@playwright/test';

test.describe('Acceso sin sesión', () => {
  test('la raíz redirige al inicio de sesión', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Bienvenido' })).toBeVisible();
  });

  test('el inventario exige iniciar sesión', async ({ page }) => {
    await page.goto('/inventario');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('la administración exige iniciar sesión', async ({ page }) => {
    await page.goto('/panes');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('el historial exige iniciar sesión', async ({ page }) => {
    await page.goto('/historial');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('un token de reporte inventado no revela información', async ({ page }) => {
    const response = await page.goto('/report/token-que-no-existe-1234567890');
    expect(response?.status()).toBe(404);
    await expect(page.getByText(/No encontramos esta página/i)).toBeVisible();
  });

  test('no se puede registrar una cuenta desde la aplicación', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /registr|crear cuenta/i })).toHaveCount(0);
  });

  test('el login muestra un error sin revelar si el correo existe', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill('nadie@ejemplo.test');
    await page.getByRole('textbox', { name: 'Contraseña' }).fill('contrasena-incorrecta');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Next.js inserta su propio anunciador de rutas con role="alert"; se excluye
    // acotando la busqueda al formulario.
    const alert = page.locator('form').getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toHaveText(/Correo o contrasena incorrectos/i);
    // No debe distinguirse entre correo inexistente y contrasena erronea.
    await expect(alert).not.toHaveText(/no existe|no registrado|usuario/i);
  });
});
