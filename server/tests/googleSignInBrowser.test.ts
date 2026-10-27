import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

test("Google sign-in escapes embedded login/signup and stays in-tab for a standalone app", {
  skip: process.env.RUN_BROWSER_TESTS !== "1",
  timeout: 90_000,
}, async () => {
  const browser = await chromium.launch({
    executablePath: process.env.TEST_CHROMIUM_PATH || "/repl/tools/bin/chromium",
    args: ["--no-sandbox"],
  });
  // This test isolates OAuth navigation; the full app journey separately tests
  // the service worker. Initial worker activation otherwise reloads the shell.
  const context = await browser.newContext({ serviceWorkers: "block" });
  await context.addInitScript(() => {
    new MutationObserver(() => document.getElementById("replit-dev-banner")?.remove())
      .observe(document, { childList: true, subtree: true });
  });
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  try {
    for (const route of ["/login", "/signup"]) {
      const page = await context.newPage();
      await page.route("**/__google_auth_test_shell", (request) => request.fulfill({
        contentType: "text/html",
        body: `<iframe title="App preview" width="1100" height="850"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          src="${route}"></iframe>`,
      }));
      await page.goto(`${base}/__google_auth_test_shell`);
      const frame = page.frameLocator('iframe[title="App preview"]');
      const [popup] = await Promise.all([
        context.waitForEvent("page"),
        frame.getByTestId("button-google-signin").click(),
      ]);
      await popup.waitForURL((url) => url.hostname === "accounts.google.com");
      await popup.locator('input[name="identifier"]').waitFor({ state: "visible", timeout: 15_000 });
      assert.equal(await popup.evaluate(() => window.self === window.top), true);
      assert.equal(await popup.evaluate(() => window.opener === null), true);
      await expect(frame.getByTestId("button-google-signin")).toBeVisible();
      await popup.close();
      await page.close();
    }

    const standalone = await context.newPage();
    await standalone.goto(`${base}/login`);
    await standalone.getByTestId("button-google-signin").click();
    await standalone.waitForURL((url) => url.hostname === "accounts.google.com");
    await standalone.locator('input[name="identifier"]').waitFor({ state: "visible", timeout: 15_000 });
    assert.equal(context.pages().length, 1);
    console.log("PASS: Embedded login/signup open a full Google sign-in tab without 403; standalone sign-in stays in the same tab. No Google credentials entered.");
  } finally {
    await browser.close();
  }
});
