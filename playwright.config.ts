import { defineConfig, devices } from '@playwright/test';

const PORT = 3210;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 45_000,

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
  },

  projects: [
    // El conteo se hace casi siempre desde un telefono: es el escenario principal.
    { name: 'movil', use: { ...devices['Pixel 7'] } },
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: `npx next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
