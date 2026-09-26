// The password screen in front of the app.
import { expect, test } from "@playwright/test";

test("asks for the password before showing the wizard", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("Password").fill("wrong");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Wrong password.")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);

  // Matches APP_PASSWORD in playwright.config.ts.
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Pick a template" })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("refuses calls to the route handlers without a session", async ({ request }) => {
  const response = await request.get("/api/content");

  expect(response.status()).toBe(401);
  expect(await response.json()).toEqual({ error: "Sign in to continue." });
});

test("tells the user when the session expires", async ({ page }) => {
  await page.clock.install();
  await page.goto("/login");
  await page.getByLabel("Password").fill("test-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Pick a template" })).toBeVisible();

  await page.clock.fastForward("10:00");

  const dialog = page.getByRole("dialog", { name: "Your session expired" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: "Sign in again" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
