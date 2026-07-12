import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.MYSKILLS_E2E_BASE_URL ?? "http://127.0.0.1:43100";

export default defineConfig({
  testDir: "./test/e2e",
  testMatch: "full-stack.spec.ts",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "line",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "full-stack-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
