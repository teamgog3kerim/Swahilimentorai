import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

test("installed launches show a bilingual animated panda splash before the home screen", {
  skip: process.env.RUN_BROWSER_TESTS !== "1",
  timeout: 90_000,
}, async () => {
  const browser = await chromium.launch({
    executablePath: process.env.TEST_CHROMIUM_PATH || "/repl/tools/bin/chromium",
    args: ["--no-sandbox"],
  });
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;

  try {
    const browserContext = await browser.newContext({ serviceWorkers: "block" });
    const browserPage = await browserContext.newPage();
    await browserPage.goto(base);
    await expect(browserPage.getByTestId("app-launch-splash")).toHaveCount(0);
    await browserContext.close();

    const installedContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      serviceWorkers: "block",
    });
    await installedContext.addInitScript(() => {
      Object.defineProperty(navigator, "standalone", { configurable: true, value: true });
    });
    const installedPage = await installedContext.newPage();
    await installedPage.goto(base);

    const splash = installedPage.getByTestId("app-launch-splash");
    await expect(splash).toBeVisible();
    await expect(splash).toContainText("欢迎来到 Ethio Panda");
    await expect(splash).toContainText("学习非洲语言");
    await expect(splash).toContainText("Welcome to Ethio Panda");
    await expect(splash).toContainText("Learn African Languages...");
    assert.equal(
      await splash.locator(".app-launch-splash__mascot").evaluate(node => getComputedStyle(node).animationIterationCount),
      "infinite",
      "the panda animates while the splash screen is visible",
    );
    await expect(splash).toBeHidden({ timeout: 6_000 });
    await expect(installedPage.locator("main")).toBeVisible();
    await installedContext.close();

    console.log("PASS: normal browser visits skip the splash; installed launches show both greetings, animate the panda, then continue to the app.");
  } finally {
    await browser.close();
  }
});
