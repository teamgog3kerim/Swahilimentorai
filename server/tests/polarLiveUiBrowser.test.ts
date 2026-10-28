import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db, pool } from "../db";
import { users } from "../../shared/schema";
import { storage } from "../storage";

test("Signed-in Chinese and English checkout screens support isolated live and sandbox redirects", {
  skip: process.env.RUN_BROWSER_TESTS !== "1", timeout: 90000,
}, async () => {
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  const browser = await chromium.launch({
    executablePath: process.env.TEST_CHROMIUM_PATH || "/repl/tools/bin/chromium",
    headless: true, args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, serviceWorkers: "block",
  });
  let userId: string | undefined;
  let environment = "sandbox";
  try {
    const signup = await context.request.post(`${base}/api/auth/signup`, {
      data: { name: "Temporary billing UI check", email: `billing-ui-${randomUUID()}@example.com`,
        password: `Local-${randomUUID()}` },
    });
    assert.ok(signup.ok(), "Standard signup must succeed");
    const user = await (await context.request.get(`${base}/api/auth/user`)).json();
    userId = user.id;
    assert.ok(userId);
    // A temporary test administrator, authenticated through the normal signup.
    await db.update(users).set({ isAdmin: true }).where(eq(users.id, userId!));
    const baseline = await (await context.request.get(`${base}/api/subscription/plans`)).json();
    assert.equal(baseline.environment, "sandbox", "Preview must not enable live payments");
    await context.route("**/api/subscription/plans", route => route.fulfill({ json: {
      ...baseline, environment, checkoutEnabled: true, configured: true, webhookConfigured: true,
    } }));
    await context.route("**/api/subscription/payment-status*", route =>
      route.fulfill({ json: { paid: false, hasCustomer: true } }));
    await context.route("**/api/subscription/checkout", route => route.fulfill({ json: {
      url: environment === "live" ? "https://buy.polar.sh/checkout/local-ui-test"
        : "https://sandbox.polar.sh/checkout/local-ui-test",
    } }));
    await context.route("**/api/subscription/portal", route => route.fulfill({ json: {
      url: environment === "live" ? "https://polar.sh/portal/local-ui-test"
        : "https://sandbox.polar.sh/portal/local-ui-test",
    } }));
    // All provider navigation is served locally by the test; no checkout is created.
    for (const host of ["buy.polar.sh", "polar.sh", "sandbox.polar.sh"]) {
      await context.route(`https://${host}/**`, route => route.fulfill({
        contentType: "text/html", body: "<html><body>Local redirect test only</body></html>",
      }));
    }
    await context.addInitScript(() => {
      const locale = new URLSearchParams(location.search).get("uiTestLocale");
      if (locale === "en" || locale === "zh") localStorage.setItem("swahili-ai-language", locale);
    });
    const page = await context.newPage();
    for (const mode of ["sandbox", "live"]) {
      environment = mode;
      for (const locale of ["zh", "en"]) {
        const dashboard = `${base}/dashboard?tab=subscription&uiTestLocale=${locale}`;
        await page.goto(dashboard);
        await expect(page.getByTestId("button-subscribe-quarterly")).toBeEnabled();
        await expect(page.getByTestId(mode === "sandbox" ? "notice-sandbox-only" : "notice-live-checkout")).toBeVisible();
        await expect(page.getByTestId("button-validate-polar")).toBeVisible();
        if (mode === "live") {
          await expect(page.getByTestId("button-subscribe-quarterly")).toHaveText(
            locale === "en" ? "Pay and subscribe" : "付款并订阅");
          assert.equal(await page.getByTestId("notice-sandbox-only").count(), 0);
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false,
          "Mobile subscription screen must not overflow horizontally");
        for (const plan of ["quarterly", "semiannual"]) {
          await page.getByTestId(`button-subscribe-${plan}`).click();
          await page.waitForURL(`https://${mode === "live" ? "buy.polar.sh" : "sandbox.polar.sh"}/checkout/local-ui-test`);
          await page.goto(dashboard);
          await expect(page.getByTestId("button-subscription-portal")).toBeVisible();
        }
        await page.getByTestId("button-subscription-portal").click();
        await page.waitForURL(`https://${mode === "live" ? "polar.sh" : "sandbox.polar.sh"}/portal/local-ui-test`);
      }
    }
  } finally {
    await context.close();
    await browser.close();
    if (userId) await storage.deleteManagedUser(userId);
    await pool.end();
  }
});
