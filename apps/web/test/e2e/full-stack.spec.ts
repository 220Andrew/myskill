import { expect, test } from "@playwright/test";

const ownerEmail = requiredEnvironment("MYSKILLS_E2E_OWNER_EMAIL");
const ownerPassword = requiredEnvironment("MYSKILLS_E2E_OWNER_PASSWORD");

test("anonymous visitor browses the seeded registry through the production proxy", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  const skillsResponse = page.waitForResponse((response) => (
    response.url().endsWith("/api/v1/skills") && response.request().method() === "GET"
  ));

  await page.goto("/registry");
  await expect(page).toHaveTitle(/MySkills/);
  await expect(page.getByRole("heading", { name: "Skill registry" })).toBeVisible();
  const skillResult = page.getByRole("link", { name: /Release Notes Helper/ }).first();
  await expect(skillResult).toBeVisible();

  const response = await skillsResponse;
  expect(response.status()).toBe(200);
  expect(new URL(response.url()).port).toBe(new URL(page.url()).port);

  await skillResult.click();
  await expect(page.getByRole("heading", { name: "Release Notes Helper" })).toBeVisible();
  await expect(page.getByText("0.1.0", { exact: true }).first()).toBeVisible();

  const readiness = await page.evaluate(async () => {
    const response = await fetch("/api/ready");
    return {
      body: await response.json() as {
        ok: boolean;
        checks: { postgres: string; artifactStorage: string };
      },
      status: response.status,
    };
  });
  expect(readiness).toEqual({
    body: {
      ok: true,
      service: "myskills-app-api",
      checks: { postgres: "ready", artifactStorage: "ready" },
    },
    status: 200,
  });
  expect(browserErrors).toEqual([]);
});

test("owner uses a real HttpOnly cookie session and exports a real seeded bundle", async ({ context, page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ownerEmail);
  await page.getByLabel("Password").fill(ownerPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(page).toHaveURL(/\/(?:registry|skills\/release-notes-helper)$/);
  await expect(page.getByRole("link", { name: "Account settings" })).toHaveAttribute("title", ownerEmail);

  const sessionCookie = (await context.cookies()).find((cookie) => cookie.name === "myskills_session");
  expect(sessionCookie).toMatchObject({
    httpOnly: true,
    sameSite: "Lax",
    secure: true,
  });

  const storedSession = await page.evaluate(() => window.localStorage.getItem("myskills-app:web-session"));
  expect(storedSession).not.toBeNull();
  expect(storedSession).not.toContain(sessionCookie?.value ?? "__missing_cookie__");
  expect(JSON.parse(storedSession ?? "{}").user.email).toBe(ownerEmail);

  const authenticatedExport = await page.evaluate(async () => {
    const meResponse = await fetch("/api/v1/me");
    const me = await meResponse.json() as { user?: { email?: string } };
    const bundleResponse = await fetch("/api/v1/skills/release-notes-helper/releases/0.1.0/bundle?platform=codex");
    const bundle = await bundleResponse.json() as { files?: Array<{ path: string; content: string }> };
    return {
      bundle,
      bundleContentType: bundleResponse.headers.get("content-type"),
      bundleStatus: bundleResponse.status,
      me,
      meStatus: meResponse.status,
    };
  });

  expect(authenticatedExport.meStatus).toBe(200);
  expect(authenticatedExport.me.user?.email).toBe(ownerEmail);
  expect(authenticatedExport.bundleStatus).toBe(200);
  expect(authenticatedExport.bundleContentType).toContain("application/vnd.myskills-app.package+json");
  expect(authenticatedExport.bundle.files?.map((file) => file.path)).toEqual(expect.arrayContaining(["README.md", "skill.json"]));
  const manifest = authenticatedExport.bundle.files?.find((file) => file.path === "skill.json");
  expect(JSON.parse(manifest?.content ?? "{}")).toMatchObject({
    name: "release-notes-helper",
    version: "0.1.0",
  });

  await page.getByLabel("Sign out").click();
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
  expect((await context.cookies()).some((cookie) => cookie.name === "myskills_session")).toBe(false);
});

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required. Run this spec through scripts/run-fullstack-e2e.mjs.`);
  }
  return value;
}
