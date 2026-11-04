import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { APP_ICON_URL, APP_NAME, APP_SLOGAN, APP_TITLE, APP_URL } from "../../client/src/lib/brand";

test("Ethio Panda name and slogan remain consistent across languages, auth pages and mobile", {
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
    assert.equal(manifest.display, "standalone");
    assert.ok(manifest.display_override.includes("standalone"));
    assert.equal(manifest.orientation, "portrait-primary");
    const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
    assert.match(viewport ?? "", /width=device-width/);
    assert.match(viewport ?? "", /viewport-fit=cover/);
    const iconResponse = await page.request.get(`${base}/icon-512.png`);
    assert.equal(iconResponse.status(), 200);
    assert.match(iconResponse.headers()["content-type"] ?? "", /image\/png/);
    await page.goto(base);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", APP_NAME);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", `${APP_URL}/`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", APP_ICON_URL);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", /Ethio Panda/);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", APP_ICON_URL);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${APP_URL}/`);
    assert.deepEqual(errors, []);
    console.log("PASS: Ethio Panda branding, exact slogan, Chinese/English pages, browser metadata, installation manifest and 360/402px layouts.");
  } finally {
    await browser.close();
  }
});
