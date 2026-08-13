import { expect, test, type Page } from '@playwright/test';
import { adminClient, createTestUser, deleteTestUser, type TestUser } from './fixtures';

async function login(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(user.email);
  await page.getByRole('textbox', { name: 'Contraseña' }).fill(user.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL(/\/inventario/);
}

test.describe('Conteo completo y reporte público', () => {
  let employee: TestUser;

  test.beforeAll(async () => {
    employee = await createTestUser('Contador Prueba');
  });

  test.afterAll(async () => {
    await deleteTestUser(employee.id);
  });

  test('recorrido completo: contar, finalizar y consultar el enlace público', async ({ page }) => {
    await login(page, employee);

    await page.getByRole('button', { name: /Iniciar conteo|Continuar conteo/ }).click();
    await page.waitForURL(/\/inventario\/[0-9a-f-]{36}$/);

    // Registrar cantidades con el boton grande y con el campo numerico.
    const firstRow = page
      .locator('li')
      .filter({ has: page.getByRole('button', { name: /^Agregar uno a/ }) })
      .first();
    const plus = firstRow.getByRole('button', { name: /^Agregar uno a/ });

    await plus.click();
    await plus.click();
    await plus.click();

    const firstInput = firstRow.getByRole('textbox');
    await expect(firstInput).toHaveValue('3');

    // Esperar a que el autoguardado confirme antes de finalizar.
    await expect(page.getByText('Guardado', { exact: true })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Finalizar conteo' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Después no podrás modificarlo/)).toBeVisible();

    await dialog.getByRole('textbox').fill('Conteo automatizado de prueba');
    await dialog.getByRole('button', { name: 'Sí, finalizar' }).click();

    await page.waitForURL(/\/report\/[\w-]+$/, { timeout: 30_000 });

    await expect(page.getByRole('heading', { name: 'Reporte de conteo' })).toBeVisible();
    await expect(page.getByText(/INV-\d{8}-\d{3}/)).toBeVisible();
    await expect(page.getByText('Contador Prueba')).toBeVisible();
    await expect(page.getByText('Finalizado')).toBeVisible();
    await expect(page.getByText('Conteo automatizado de prueba')).toBeVisible();
    await expect(page.getByText('(Colombia)')).toBeVisible();

    const reportUrl = page.url();

    // El enlace publico debe abrirse sin sesion.
    const anonymous = await page.context().browser()?.newContext();
    if (anonymous) {
      const anonPage = await anonymous.newPage();
      await anonPage.goto(reportUrl);
      await expect(anonPage.getByRole('heading', { name: 'Reporte de conteo' })).toBeVisible();
      // Y no debe exponer datos privados.
      await expect(anonPage.getByText(employee.email)).toHaveCount(0);
      await anonymous.close();
    }

    // Un conteo finalizado ya no puede editarse.
    await page.goto('/inventario');
    await expect(page.getByRole('button', { name: 'Iniciar conteo' })).toBeVisible();
  });

  test('el borrador se recupera tras recargar la página', async ({ page }) => {
    await login(page, employee);
    await page.getByRole('button', { name: /Iniciar conteo|Continuar conteo/ }).click();
    await page.waitForURL(/\/inventario\/[0-9a-f-]{36}$/);

    const url = page.url();
    const row = page
      .locator('li')
      .filter({ has: page.getByRole('button', { name: /^Agregar uno a/ }) })
      .first();
    await row.getByRole('button', { name: /^Agregar uno a/ }).click();
    await expect(page.getByText('Guardado', { exact: true })).toBeVisible({ timeout: 15_000 });

    await page.reload();
    await page.waitForURL(url);

    const reloaded = page
      .locator('li')
      .filter({ has: page.getByRole('button', { name: /^Agregar uno a/ }) })
      .first();
    await expect(reloaded.getByRole('textbox')).toHaveValue('1');
  });

  test('el reporte revocado deja de ser accesible', async ({ page }) => {
    await login(page, employee);
    await page.getByRole('button', { name: /Iniciar conteo|Continuar conteo/ }).click();
    await page.waitForURL(/\/inventario\/[0-9a-f-]{36}$/);

    const row = page
      .locator('li')
      .filter({ has: page.getByRole('button', { name: /^Agregar uno a/ }) })
      .first();
    await row.getByRole('button', { name: /^Agregar uno a/ }).click();
    await expect(page.getByText('Guardado', { exact: true })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: 'Finalizar conteo' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Sí, finalizar' }).click();
    await page.waitForURL(/\/report\/[\w-]+$/, { timeout: 30_000 });

    const reportUrl = page.url();
    const reportNumber = await page.getByText(/INV-\d{8}-\d{3}/).textContent();

    const admin = adminClient();
    await admin
      .from('public_reports')
      .update({ is_revoked: true })
      .eq('report_number', reportNumber?.trim() ?? '');

    const response = await page.goto(reportUrl);
    expect(response?.status()).toBe(404);
  });
});
