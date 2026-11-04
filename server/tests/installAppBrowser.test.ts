import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

test("floating install control follows scrolling and supports Android and iOS installation guidance", {
  skip: process.env.RUN_BROWSER_TESTS !== "1",
  timeout: 90_000,
}, async () => {
  const browser = await chromium.launch({
    executablePath: process.env.TEST_CHROMIUM_PATH || "/repl/tools/bin/chromium",
    args: ["--no-sandbox"],
  });
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;

  try {
    const androidContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const androidPage = await androidContext.newPage();
    await androidPage.goto(base);

    const installButton = androidPage.getByTestId("install-app-floating-button");
    await expect(installButton).toBeVisible();
    await expect(installButton).toContainText("安装应用");
    const bounds = await installButton.boundingBox();
    assert.ok(bounds);
    assert.ok(bounds.x + bounds.width <= 390, "install button stays inside the viewport");

    await androidPage.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await expect(androidPage.locator(".install-app")).toHaveClass(/install-app--collapsed/);
    await installButton.click();
    await expect(androidPage.getByTestId("install-app-instructions")).toContainText("浏览器菜单");

    const dispatched = await androidPage.evaluate(() => {
      (window as any).__installPromptCount = 0;
      const event = new Event("beforeinstallprompt", { cancelable: true });
      Object.defineProperties(event, {
        prompt: { value: Function("window", "window.__installPromptCount = (window.__installPromptCount || 0) + 1").bind(null, window) },
        userChoice: { value: Promise.resolve({ outcome: "accepted", platform: "web" }) },
      });
      const dispatchResult = window.dispatchEvent(event);
      return { dispatchResult, defaultPrevented: event.defaultPrevented };
    });
    assert.equal(dispatched.defaultPrevented, true, "the app captures the native install prompt event");
    await expect(androidPage.locator(".install-app")).toHaveAttribute("data-install-available", "true");
    await installButton.click();
    await expect(androidPage.getByTestId("install-app-floating-button")).toBeHidden();
    assert.equal(await androidPage.evaluate(() => (window as Window & { __installPromptCount?: number }).__installPromptCount), 1);
    await androidContext.close();

    const iosContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
    const iosPage = await iosContext.newPage();
    await iosPage.goto(base);
    await iosPage.getByTestId("install-app-floating-button").click();
    await expect(iosPage.getByTestId("install-app-instructions")).toContainText("分享按钮");
    await expect(iosPage.getByTestId("install-app-instructions")).toContainText("添加到主屏幕");
    await iosContext.close();

    console.log("PASS: install control collapses on scroll, opens native Android install when available, and gives iOS home-screen steps.");
  } finally {
    await browser.close();
  }
});
