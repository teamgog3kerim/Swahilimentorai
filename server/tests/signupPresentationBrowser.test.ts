import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

test("Signup introduction is bilingual, responsive and leaves the form functional", {
  skip: process.env.RUN_BROWSER_TESTS !== "1", timeout: 60_000,
}, async () => {
  const browser = await chromium.launch({
    executablePath: process.env.TEST_CHROMIUM_PATH || "/repl/tools/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.addInitScript(() => {
      new MutationObserver(() => document.getElementById("replit-dev-banner")?.remove())
        .observe(document, { childList: true, subtree: true });
    });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`https://${process.env.REPLIT_DEV_DOMAIN}/signup`);
    const introduction = page.getByTestId("signup-introduction");
    await expect(introduction).toContainText("阿姆哈拉语");
    await expect(introduction).toContainText("斯瓦希里语");
    await expect(introduction).toContainText("the African languages Academy for Chinese people");
    await expect(page.getByTestId("input-name")).toBeVisible();
    await page.getByTestId("button-language").click();
    await expect(introduction).toContainText("Amharic");
    await expect(introduction).toContainText("Swahili");
    assert.equal(/\p{Script=Han}/u.test(await introduction.innerText()), false);
    await page.getByTestId("button-signup-submit").click();
    await expect(page.getByText("Name must be at least 2 characters", { exact: true })).toBeVisible();
    for (const width of [320, 402, 768]) {
      await page.setViewportSize({ width, height: 874 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `No overflow at ${width}px`);
    }
    await page.getByTestId("button-back").click();
    await expect(page).toHaveURL(/\/$/);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
