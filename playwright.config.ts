import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/** End-to-end tests against the production build (`npm run e2e`). Not part of `npm run check`. */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/es`,
    timeout: 300_000,
    reuseExistingServer: true,
  },
});
