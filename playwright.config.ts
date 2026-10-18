import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://127.0.0.1:${PORT}`;
const testEnvironment = `E2E_TEST=1 DATABASE_URL=pglite:./.data/e2e-pglite APP_URL=${baseURL} PCU_EMAIL_DOMAINS=pcu.edu.ph`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // Always the built app. The dev server compiles routes on first visit, so
    // clicks can land before hydration and the test reads the wrong state.
    command: process.env.CI
      ? `${testEnvironment} npm run test:e2e:seed && ${testEnvironment} npm run start -- -p ${PORT}`
      : `${testEnvironment} npm run test:e2e:seed && npm run build && ${testEnvironment} npm run start -- -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
