import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium, expect } from "@playwright/test";

test("public plan buttons lead through sign-in to a real sandbox checkout", {
  skip: process.env.RUN_BROWSER_TESTS !== "1",
  timeout: 120_000,
}, async () => {
  const { storage } = await import("../storage");
  const { pool } = await import("../db");
  const browser = await chromium.launch({
    executablePath: "/repl/tools/bin/chromium", args: ["--no-sandbox"],
  });
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  try {
    for (const language of ["zh", "en"]) {
      const context = await browser.newContext({
        viewport: { width: 402, height: 874 }, serviceWorkers: "block",
      });
      const page = await context.newPage();
      let id: string | undefined;
      try {
        await page.goto(base);
        const previewBannerClose = page.getByRole("button", { name: "Close banner", exact: true });
        if (await previewBannerClose.isVisible()) await previewBannerClose.click();
        if (language === "en") await page.getByTestId("button-language").click();
        const button = page.getByTestId("button-subscribe-semiannual");
        await expect(button).toBeEnabled();
        await expect(button).toHaveText(language === "en" ? "View subscription options" : "查看订阅选项");
        await button.click();
        await expect(page).toHaveURL(/\/login$/);

        const password = `Test-${randomUUID()}`;
        // Polar rejects reserved example.com emails, even in its sandbox.
        // This random test address receives no mail: no payment is submitted.
        const email = `afri.panda.test.${randomUUID().replaceAll("-", "")}@gmail.com`;
        const response = await page.request.post(`${base}/api/auth/signup`, {
          data: { name: "Temporary checkout navigation test", email, password },
        });
        assert.equal(response.ok(), true);
        const user = await (await page.request.get(`${base}/api/auth/user`)).json();
        id = user.id;
        await page.request.post(`${base}/api/auth/logout`);
        await page.getByTestId("input-email").fill(email);
        await page.getByTestId("input-password").fill(password);
        await page.getByTestId("button-login-submit").click();
        await expect(page.getByTestId("button-subscribe-semiannual")).toBeEnabled();
        await expect(page.getByRole("heading", {
          name: language === "en" ? "Subscription" : "订阅", exact: true,
        })).toBeVisible();
        const checkoutResponse = page.waitForResponse(response =>
          response.url().endsWith("/api/subscription/checkout") && response.request().method() === "POST");
        await page.getByTestId("button-subscribe-semiannual").click();
        const checkout = await checkoutResponse;
        assert.equal(checkout.status(), 200);
        // The real external navigation can discard Chrome's response body.
        // Assert the HTTP result and actual destination, not that transient body.
        await expect(page).toHaveURL(/^https:\/\/sandbox\.polar\.sh\//, { timeout: 20_000 });
        const after = await storage.getUser(id!);
        assert.equal(after?.subscriptionEndsAt?.getTime(), new Date(user.subscriptionEndsAt).getTime(),
          "Opening checkout must not grant access");
        console.log(`${language}: mobile public button, password sign-in, subscription navigation and real sandbox checkout passed`);
      } finally {
        if (id) await storage.deleteManagedUser(id);
        await context.close();
      }
    }
  } finally {
    await browser.close();
    await pool.end();
  }
});
