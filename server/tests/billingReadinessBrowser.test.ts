import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium, expect } from "@playwright/test";

test("Polar readiness is admin-only, bilingual, mobile-safe and retryable", {
  skip: process.env.RUN_BROWSER_TESTS !== "1", timeout: 60_000,
}, async () => {
  const { storage } = await import("../storage");
  const { pool } = await import("../db");
  const browser = await chromium.launch({ executablePath: "/repl/tools/bin/chromium", args: ["--no-sandbox"] });
  // Network failure injection must reach Playwright rather than a controlling
  // service worker. Offline-worker behavior has its own dedicated tests.
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, serviceWorkers: "block" });
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  let id: string | undefined;
  let readinessRequests = 0;
  page.on("request", request => {
    if (request.url().includes("/api/admin/billing/readiness")) readinessRequests++;
  });
  try {
    const signup = await page.request.post(`${base}/api/auth/signup`, { data: {
      name: "Temporary billing setup learner", email: `billing-setup-${randomUUID()}@example.com`, password: `Test-${randomUUID()}`,
    } });
    assert.equal(signup.ok(), true);
    const user = await (await page.request.get(`${base}/api/auth/user`)).json();
    id = user.id;
    await page.goto(base);
    await page.getByTestId("button-choose-amharic").click();
    await page.getByTestId("button-nav-subscription").click();
    await expect(page.getByTestId("button-subscribe-quarterly")).toBeDisabled();
    await expect(page.getByTestId("billing-readiness")).toHaveCount(0);
    assert.equal(readinessRequests, 0);
    await storage.updateManagedUser(user.id, {
      username: user.username, isAdmin: true, isPremium: true,
      subscriptionEndsAt: new Date(user.subscriptionEndsAt),
    });
    await page.reload();
    await page.getByTestId("button-nav-subscription").click();
    const checklist = page.getByTestId("billing-readiness");
    await expect(checklist).toBeVisible();
    await expect(checklist).toContainText("Polar.sh");
    assert.ok(readinessRequests > 0);
    await page.setViewportSize({ width: 402, height: 874 });
    await checklist.scrollIntoViewIfNeeded();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.getByTestId("button-language").click();
    await expect(checklist).toContainText("Access token");
    await expect(checklist).toContainText(/disabled|not connected|unavailable/i);
    await page.route("**/api/admin/billing/readiness", route => route.fulfill({
      status: 503, contentType: "application/json", body: JSON.stringify({ message: "Temporary test failure" }),
    }));
    await page.reload();
    await page.getByTestId("button-nav-subscription").click();
    await expect(page.getByTestId("button-retry-billing-readiness")).toBeVisible();
    await page.unroute("**/api/admin/billing/readiness");
    await page.getByTestId("button-retry-billing-readiness").click();
    await expect(checklist).toContainText("Access token");
    await expect(page.getByTestId("button-retry-billing-readiness")).toHaveCount(0);
    await expect(page.getByTestId("button-subscribe-semiannual")).toBeDisabled();
  } finally {
    await browser.close();
    if (id) await storage.deleteManagedUser(id);
    await pool.end();
  }
});
