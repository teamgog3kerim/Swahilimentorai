import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

test("Offline-worker installation and changes never show a browser popup or discard the current draft", {
  skip: process.env.RUN_BROWSER_TESTS !== "1",
  timeout: 90_000,
}, async () => {
  const browser = await chromium.launch({
    executablePath: process.env.TEST_CHROMIUM_PATH || "/repl/tools/bin/chromium",
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({ viewport: { width: 402, height: 874 } });
  await context.addInitScript(() => {
    new MutationObserver(() => document.getElementById("replit-dev-banner")?.remove())
      .observe(document, { childList: true, subtree: true });
    const register = navigator.serviceWorker.register.bind(navigator.serviceWorker);
    navigator.serviceWorker.register = async (...args) => {
      const registration = await register(...args);
      (window as any).__updateTestRegistration = registration;
      return registration;
    };
  });
  const page = await context.newPage();
  const errors: string[] = [];
  let dialogs = 0;
  let navigations = 0;
  page.on("pageerror", error => errors.push(error.message));
  page.on("dialog", async dialog => { dialogs++; await dialog.dismiss(); });
  page.on("framenavigated", frame => { if (frame === page.mainFrame()) navigations++; });
  const triggerUpdate = () => page.evaluate(() => {
    // Exercise the activation event without changing the shared server's worker.
    const container = navigator.serviceWorker;
    const nextController = Object.assign(new EventTarget(), { scriptURL: "/sw.js" });
    Object.defineProperty(container, "controller", { configurable: true, value: nextController });
    container.dispatchEvent(new Event("controllerchange"));
  });
  try {
    await page.goto(`https://${process.env.REPLIT_DEV_DOMAIN}/login`);
    await page.waitForFunction(() => navigator.serviceWorker.controller && (window as any).__updateTestRegistration);
    const email = page.locator('input[name="email"]');
    await email.fill("draft-not-submitted@example.com");
    await triggerUpdate();
    await expect(email).toHaveValue("draft-not-submitted@example.com");
    await page.getByTestId("button-language").click();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    await expect(email).toHaveValue("draft-not-submitted@example.com");
    assert.equal(navigations, 1, "Neither initial installation nor an update should automatically reload");
    await triggerUpdate();

    await page.reload();
    await expect(email).toHaveValue("");
    assert.equal(navigations, 2, "Only a user-requested refresh should navigate");
    assert.equal(dialogs, 0);
    assert.deepEqual(errors, []);
    console.log("PASS: No native popup or forced reload on first installation or worker changes; drafts preserved, optional English and mobile layout work, manual refresh still works.");
  } finally {
    await browser.close();
  }
});
