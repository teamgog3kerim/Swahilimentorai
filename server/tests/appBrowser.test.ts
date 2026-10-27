import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium, expect } from "@playwright/test";

test("Chinese-first account, learning progress, and admin browser journey", {
  skip: process.env.RUN_BROWSER_TESTS !== "1", timeout: 180_000,
}, async () => {
  const { storage } = await import("../storage");
  const { pool, db } = await import("../db");
  const { adminNotifications } = await import("../../shared/schema");
  const { sql } = await import("drizzle-orm");
  const browser = await chromium.launch({
    executablePath: process.env.TEST_CHROMIUM_PATH || "/repl/tools/bin/chromium",
    headless: true, args: ["--no-sandbox"],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  // The proxy's standalone development banner is outside the app and can
  // cover its controls; it is not present in the embedded preview.
  await context.addInitScript(() => {
    new MutationObserver(() => document.getElementById("replit-dev-banner")?.remove())
      .observe(document, { childList: true, subtree: true });
  });
  const page = await context.newPage();
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  const email = `browser-test-${randomUUID()}@gmail.com`;
  const password = randomUUID();
  const ids = new Set<string>();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(base);
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await page.getByTestId("button-language").click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.goto(`${base}/signup`);
    await expect(page.getByTestId("input-name")).toHaveAttribute("autocomplete", "name");
    await expect(page.getByTestId("input-email")).toHaveAttribute("autocomplete", "username");
    await expect(page.getByTestId("input-password")).toHaveAttribute("autocomplete", "new-password");
    await expect(page.getByTestId("input-confirm-password")).toHaveAttribute("autocomplete", "new-password");
    await page.locator('input[name="name"]').fill("Browser QA Learner");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="confirmPassword"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.getByTestId("button-choose-swahili").click();
    await page.getByTestId("card-level-beginner").click();
    await expect(page.locator('[data-testid^="card-lesson-"]').first()).toBeVisible();
    const user = await storage.getUserByEmail(email);
    assert.ok(user);
    ids.add(user.id);
    assert.equal((await page.request.get(`${base}/api/admin/users`)).status(), 403);
    await page.locator('[data-testid^="card-lesson-"]').first().click();
    await expect(page.getByTestId("dialog-lesson-detail")).toContainText("Vocabulary");
    await page.getByTestId("button-toggle-lesson-completion").click();
    await expect(page.getByTestId("button-toggle-lesson-completion")).toHaveText("Mark incomplete");
    assert.ok((await storage.getUserProgress(user.id)).some((entry) => entry.completed));
    await page.getByTestId("button-close-lesson").click();
    await page.reload();
    await page.getByTestId("button-choose-swahili").click();
    await page.getByTestId("card-level-beginner").click();
    await expect(page.getByTestId("icon-completed").first()).toBeVisible();
    await page.getByTestId("button-nav-progress").click();
    await expect(page.getByRole("heading", { name: "Your progress", exact: true })).toBeVisible();
    await page.getByTestId("button-nav-practice").click();
    await expect(page.getByTestId("page-practice")).toBeVisible();
    const capabilities = await (await page.request.get(`${base}/api/capabilities`)).json();
    if (capabilities.aiTutorAvailable) {
      await page.getByTestId("button-ai-practice").click();
      await page.getByTestId("button-start-beginner").click();
      await expect(page.getByTestId("input-message")).toBeEnabled();
    } else {
      await expect(page.getByTestId("button-ai-practice")).toBeDisabled();
      await expect(page.getByTestId("select-practice-lesson")).toBeVisible();
    }
    await page.getByTestId("button-nav-subscription").click();
    await expect(page.getByRole("heading", { name: "Subscription", exact: true })).toBeVisible();
    await page.screenshot({ path: "/tmp/swahili-qa-dashboard.png" });
    console.log("PASS: Chinese default; English preference persistence; signup; 90-lesson curriculum; lesson completion persistence; progress/practice/subscription navigation; non-admin authorization.");

    await storage.updateManagedUser(user.id, {
      username: user.username, isAdmin: true, isPremium: true, subscriptionEndsAt: null,
    });
    const target = await storage.createUserWithPassword(`browser-target-${randomUUID()}@gmail.com`, "Browser target", "not-a-real-password");
    ids.add(target.id);
    await page.reload();
    await page.getByTestId("button-choose-swahili").click();
    await page.getByTestId("button-nav-admin").click();
    await page.getByTestId("tab-users").click();
    await page.getByTestId("input-search-users").fill(target.email);
    await page.getByTestId(`row-user-${target.id}`).getByRole("button", { name: "Manage", exact: true }).click();
    await page.locator("#managed-username").fill("Updated browser target");
    await page.getByRole("button", { name: "Save changes", exact: true }).click();
    await expect(page.getByTestId(`row-user-${target.id}`)).toContainText("Updated browser target");
    await page.getByTestId(`row-user-${target.id}`).getByRole("button", { name: "Manage", exact: true }).click();
    await page.getByRole("button", { name: "Delete user…", exact: true }).click();
    await expect(page.getByRole("button", { name: "Permanently delete", exact: true })).toBeDisabled();
    await page.getByLabel("Email confirmation").fill(target.email);
    await page.getByRole("button", { name: "Permanently delete", exact: true }).click();
    await expect(page.getByTestId(`row-user-${target.id}`)).toHaveCount(0);
    assert.equal(await storage.getUser(target.id), undefined);
    ids.delete(target.id);
    await page.getByTestId("input-search-users").fill(email);
    await page.getByTestId(`row-user-${user.id}`).getByRole("button", { name: "Manage", exact: true }).click();
    await expect(page.locator("#managed-admin")).toBeDisabled();
    await expect(page.getByRole("button", { name: "Delete user…", exact: true })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await page.screenshot({ path: "/tmp/swahili-qa-admin.png" });
    await page.getByTestId("button-nav-learn").click();
    await page.setViewportSize({ width: 402, height: 874 });
    await page.screenshot({ path: "/tmp/swahili-qa-mobile.png" });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2));
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.getByTestId("button-logout").click();
    await expect(page.getByTestId("text-username")).toHaveCount(0);
    await page.goto(`${base}/login`);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page.getByTestId("button-nav-learn")).toBeVisible();
    const cachedPrivateUrls = await page.evaluate(async () => {
      const requests = (await Promise.all((await caches.keys()).map(async (key) => (await caches.open(key)).keys()))).flat();
      return requests.map((request) => new URL(request.url).pathname)
        .filter((path) => path.startsWith("/api/") && !path.startsWith("/api/lessons"));
    });
    assert.deepEqual(cachedPrivateUrls, []);
    assert.deepEqual(errors, []);
    console.log("PASS: Admin edit/delete with confirmation; self-lockout protection; mobile overflow check; logout/login; no uncaught browser errors.");
  } finally {
    const signupUser = await storage.getUserByEmail(email);
    if (signupUser) ids.add(signupUser.id);
    for (const id of ids) {
      await db.delete(adminNotifications).where(sql`${adminNotifications.metadata}->>'userId' = ${id}`);
      await storage.deleteManagedUser(id);
    }
    await browser.close();
    await pool.end();
  }
});
