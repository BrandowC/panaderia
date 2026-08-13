import { expect, test, type Page } from '@playwright/test';
import { createTestUser, deleteTestProducts, deleteTestUser, type TestUser } from './fixtures';

const PREFIX = 'ZZPrueba';

async function login(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(user.email);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(user.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(/\/inventario/);
}

test.describe('Catálogo de productos', () => {
  let admin: TestUser;

  test.beforeAll(async () => {
    admin = await createTestUser('Admin Catalogo');
  });

  test.afterAll(async () => {
    await deleteTestProducts(PREFIX);
    await deleteTestUser(admin.id);
  });

  test('crea un producto y aparece en la lista', async ({ page }) => {
    await login(page, admin);
    await page.goto('/panes');

    const name = `${PREFIX} Rosca`;
    await page.getByLabel('Nombre').fill(name);
    await page.getByLabel('Categoría').fill('Tradicionales');
    await page.getByRole('button', { name: 'Agregar producto' }).click();

    await expect(page.getByRole('status')).toContainText(name);
    await expect(page.getByText(name)).toBeVisible();
  });

  test('rechaza un nombre duplicado entre productos activos', async ({ page }) => {
    await login(page, admin);
    await page.goto('/panes');

    const name = `${PREFIX} Duplicado`;

    await page.getByLabel('Nombre').fill(name);
    await page.getByRole('button', { name: 'Agregar producto' }).click();
    await expect(page.getByRole('status')).toBeVisible();

    await page.getByLabel('Nombre').fill(name);
    await page.getByRole('button', { name: 'Agregar producto' }).click();
    await expect(page.locator('form').getByRole('alert')).toContainText(
      /Ya existe un producto activo/i,
    );
  });

  test('detecta duplicados aunque cambien acentos y mayúsculas', async ({ page }) => {
    await login(page, admin);
    await page.goto('/panes');

    await page.getByLabel('Nombre').fill(`${PREFIX} Aliñado`);
    await page.getByRole('button', { name: 'Agregar producto' }).click();
    await expect(page.getByRole('status')).toBeVisible();

    await page.getByLabel('Nombre').fill(`${PREFIX} ALINADO`);
    await page.getByRole('button', { name: 'Agregar producto' }).click();
    await expect(page.locator('form').getByRole('alert')).toContainText(
      /Ya existe un producto activo/i,
    );
  });

  test('rechaza una URL de imagen peligrosa', async ({ page }) => {
    await login(page, admin);
    await page.goto('/panes');

    await page.getByLabel('Nombre').fill(`${PREFIX} Xss`);
    await page.getByLabel('Imagen (URL)').fill('javascript:alert(1)');
    await page.getByRole('button', { name: 'Agregar producto' }).click();

    await expect(page.locator('form').getByRole('alert')).toBeVisible();
  });

  test('la búsqueda encuentra productos sin escribir acentos', async ({ page }) => {
    await login(page, admin);
    await page.goto('/panes');

    await page.getByLabel('Buscar producto').fill('alinado');
    await expect(page.getByText(/Pan aliñado/)).toBeVisible();
  });

  test('archivar retira el producto de los conteos nuevos', async ({ page }) => {
    await login(page, admin);
    await page.goto('/panes');

    const name = `${PREFIX} Archivable`;
    await page.getByLabel('Nombre').fill(name);
    await page.getByRole('button', { name: 'Agregar producto' }).click();
    await expect(page.getByRole('status')).toBeVisible();

    await page.getByLabel('Buscar producto').fill(name);
    const row = page.locator('li').filter({ hasText: name }).first();
    await row.getByRole('button', { name: 'Archivar' }).click();

    await expect(row.getByText(/Archivado/)).toBeVisible({ timeout: 10_000 });
  });
});
