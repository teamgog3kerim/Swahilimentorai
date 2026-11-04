import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { APP_NAME, APP_SLOGAN, APP_TITLE } from "../../client/src/lib/brand";

test("Ethiopanda name and slogan remain consistent across languages, auth pages and mobile", {
  skip: process.env.RUN_BROWSER_TESTS !== "1",
  timeout: 90_000,
}, async () => {
  const browser = await chromium.launch({
    executablePath: process.env.TEST_CHROMIUM_PATH || "/repl/tools/bin/chromium",
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({ serviceWorkers: "block", viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    new MutationObserver(() => document.getElementById("replit-dev-banner")?.remove())
      .observe(document, { childList: true, subtree: true });
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  try {
    await page.goto(base);
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    for (const locale of ["zh-CN", "en"]) {
      if (locale === "en") {
        await page.goto(base);
        await page.getByTestId("button-language").click();
      }
      for (const route of ["/", "/login", "/signup"]) {
        await page.goto(`${base}${route}`);
        await expect(page).toHaveTitle(APP_TITLE);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.getByText(APP_NAME, { exact: true }).first()).toBeVisible();
        if (route === "/") await expect(page.getByTestId("brand-slogan")).toHaveText(APP_SLOGAN);
        else await expect(page.getByText(APP_SLOGAN, { exact: true })).toBeVisible();
        for (const width of [360, 402]) {
          await page.setViewportSize({ width, height: 874 });
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `${route}: ${locale}, ${width}px`);
          await expect(page.getByText(APP_NAME, { exact: true }).first()).toBeVisible();
        }
      }
    }
    const manifest = await (await page.request.get(`${base}/manifest.json`)).json();
    assert.equal(manifest.name, APP_NAME);
    assert.equal(manifest.short_name, APP_NAME);
    assert.equal(manifest.description, APP_SLOGAN);
    await page.goto(base);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", APP_NAME);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", APP_SLOGAN);
    assert.deepEqual(errors, []);
    console.log("PASS: Ethiopanda branding, exact slogan, Chinese/English pages, browser metadata, installation manifest and 360/402px layouts.");
  } finally {
    await browser.close();
  }
});
