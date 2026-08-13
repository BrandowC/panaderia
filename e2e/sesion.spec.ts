import { expect, test, type Page } from '@playwright/test';
import { createTestUser, deleteTestUser, type TestUser } from './fixtures';

async function login(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(user.email);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(user.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(/\/inventario/);
}

/**
 * Sin roles, tener sesion es la unica barrera: estas pruebas comprueban que esa
 * barrera existe y que abre todas las secciones a cualquier miembro del equipo.
 */
test.describe('Sesión única', () => {
  let member: TestUser;

  test.beforeAll(async () => {
    member = await createTestUser('Miembro Prueba');
  });

  test.afterAll(async () => {
    await deleteTestUser(member.id);
  });

  test('inicia sesión y llega al resumen', async ({ page }) => {
    await login(page, member);
    await expect(page.getByRole('heading', { name: /Hola, Miembro/ })).toBeVisible();
  });

  test('el menú muestra todas las secciones', async ({ page }) => {
    await login(page, member);
    await page.getByRole('button', { name: 'Abrir menú' }).click();

    const menu = page.getByRole('dialog', { name: 'Menú de navegación' });
    for (const label of ['Resumen', 'Contar panes', 'Reportes', 'Panes', 'Empleados']) {
      await expect(menu.getByRole('link', { name: label })).toBeVisible();
    }
  });

  test('puede entrar a panes y a empleados', async ({ page }) => {
    await login(page, member);

    await page.goto('/panes');
    await expect(page.getByRole('heading', { name: 'Panes' })).toBeVisible();

    await page.goto('/empleados');
    await expect(page.getByRole('heading', { name: 'Empleados' })).toBeVisible();
  });

  test('al cerrar sesión se pierde el acceso', async ({ page }) => {
    await login(page, member);

    await page.getByRole('button', { name: 'Abrir menú' }).click();
    await page
      .getByRole('dialog', { name: 'Menú de navegación' })
      .getByRole('button', { name: 'Cerrar sesión' })
      .click();
    await page.waitForURL(/\/login$/);

    await page.goto('/panes');
    await expect(page).toHaveURL(/\/login$/);
  });
});
