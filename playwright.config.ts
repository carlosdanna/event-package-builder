import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const isCI = process.env.CI === "true";

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // A production build, like the deployed app. It also runs beside a
    // `pnpm dev` server, which keeps its files in .next/dev.
    command: `pnpm exec next build && pnpm exec next start --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 300_000,
    env: {
      NEXT_TEST_PROXY: "1",
      // Never a real key: every call to Proposales is answered by the test.
      PROPOSALES_API_KEY: "test-key",
      PROPOSALES_COMPANY_ID: "7",
    },
  },
});
