import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium, expect } from "@playwright/test";

test("Live trial expiry closes lessons, prompts subscription and preserves bilingual progress navigation", {
  skip: process.env.RUN_BROWSER_TESTS !== "1", timeout: 90_000,
}, async () => {
  const { storage } = await import("../storage");
  const { pool } = await import("../db");
  const browser = await chromium.launch({ executablePath: "/repl/tools/bin/chromium", args: ["--no-sandbox"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await page.addInitScript(() => {
    new MutationObserver(() => document.getElementById("replit-dev-banner")?.remove())
      .observe(document, { childList: true, subtree: true });
  });
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  let userId: string | undefined;
  try {
    const signup = await page.request.post(`${base}/api/auth/signup`, { data: {
      name: "Temporary trial learner", email: `trial-ui-${randomUUID()}@example.com`, password: `Test-${randomUUID()}`,
    } });
    assert.equal(signup.ok(), true);
    const user = await (await page.request.get(`${base}/api/auth/user`)).json();
    userId = user.id;
    await page.goto(base);
    await page.getByTestId("button-choose-amharic").click();
    await expect(page.getByTestId("text-reminder-description")).toContainText("88");
    await page.getByTestId("button-language").click();
    await expect(page.getByTestId("text-reminder-description")).toContainText("88-hour trial");
    await page.getByTestId("card-level-beginner").click();
    await page.locator('[data-testid^="card-lesson-"]').first().click();
    await expect(page.getByTestId("dialog-lesson-detail")).toBeVisible();
    await page.keyboard.press("Escape");
    await storage.updateUserPremiumStatus(user.id, true, new Date(Date.now() + 8000));
    await page.reload();
    await page.getByTestId("button-choose-amharic").click();
    await page.getByTestId("card-level-beginner").click();
    await page.locator('[data-testid^="card-lesson-"]').first().click();
    await expect(page.getByTestId("dialog-lesson-detail")).toBeVisible();
    await expect(page.getByTestId("button-course-access-subscribe")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("text-reminder-title")).toHaveText("Trial expired");
    await expect(page.getByTestId("dialog-lesson-detail")).toHaveCount(0);
    await page.getByTestId("button-nav-practice").click();
    await expect(page.getByTestId("button-course-access-subscribe")).toBeVisible();
    await page.getByTestId("button-nav-progress").click();
    await expect(page.getByTestId("page-progress")).toBeVisible();
    await expect(page.getByTestId("page-progress")).not.toContainText("Failed");
    await page.getByTestId("button-nav-learn").click();
    await page.setViewportSize({ width: 402, height: 874 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    await page.screenshot({ path: "/tmp/afri-panda-trial-expired-mobile.png", fullPage: true });
    await page.getByTestId("button-course-access-subscribe").click();
    await expect(page.getByTestId("alert-expired")).toContainText("Free trial ended");
    await expect(page.getByTestId("button-subscribe-quarterly")).toBeDisabled();
    await expect(page.getByTestId("button-subscribe-semiannual")).toBeDisabled();
    const quarterly = page.getByTestId("button-subscribe-quarterly").locator("xpath=../..");
    const semiannual = page.getByTestId("button-subscribe-semiannual").locator("xpath=../..");
    await expect(quarterly).toContainText("88");
    await expect(quarterly).toContainText("USD");
    await expect(semiannual).toContainText("168");
    await expect(semiannual).toContainText("Save USD 8");
    await expect(page.locator("body")).not.toContainText(/Binance|USDT|TRC20/);
    await expect(page.getByText(/USD checkout via Polar.sh is coming soon/)).toBeVisible();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.getByTestId("button-language").click();
    await expect(page.getByTestId("alert-expired")).toContainText("免费试用已结束");
    await expect(page.getByTestId("button-subscribe-semiannual")).toHaveText("付费结账即将开放");
    await page.getByTestId("button-nav-learn").click();
    await expect(page.getByTestId("button-course-access-subscribe")).toHaveText("查看订阅方案");
    await storage.updateUserPremiumStatus(user.id, true, new Date(Date.now() + 30 * 86400000));
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(page.getByTestId("card-level-beginner")).toBeVisible({ timeout: 10_000 });
  } finally {
    if (userId) await storage.deleteManagedUser(userId);
    await browser.close();
    await pool.end();
  }
});
