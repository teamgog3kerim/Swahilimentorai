import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

test("Hero explains both courses bilingually and preserves image, signup, pricing and sharing on mobile and desktop", {
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
    await page.goto(`https://${process.env.REPLIT_DEV_DOMAIN}/`);
    const hero = page.locator("main section").first();
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(hero.getByRole("heading", { level: 1 })).toContainText("阿姆哈拉语");
    await expect(hero).toContainText("斯瓦希里语");
    await expect(hero).toContainText("探索两种重要的非洲语言");
    await expect(hero.getByRole("group", { name: "阿姆哈拉语与斯瓦希里语" })).toContainText("አማርኛ");
    await expect(hero.getByRole("group", { name: "阿姆哈拉语与斯瓦希里语" })).toContainText("Kiswahili");
    assert.ok((await hero.boundingBox())!.height < 950, "Desktop hero should not retain the previous oversized text column");
    const image = hero.locator("img");
    await expect(image).toHaveAttribute("src", /Chinese_learners_using_Swahili_app_148614f4/);
    await expect(image).toHaveClass("w-full h-auto");
    await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(hero.getByTestId("button-start-free")).toHaveAttribute("href", "/signup");
    await expect(hero.getByTestId("button-start-free")).toHaveText("免费注册开始学习");
    await expect(hero.getByTestId("button-view-pricing")).toHaveText("查看定价");
    await hero.getByTestId("button-view-pricing").click();
    await expect.poll(() => page.locator("#pricing").evaluate(node => node.getBoundingClientRect().top)).toBeLessThan(400);
    await hero.getByRole("button", { name: "邀请好友", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByTestId("button-language").click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(hero).toContainText("Amharic");
    await expect(hero).toContainText("Swahili");
    await expect(hero).toContainText("Explore two major African languages");
    assert.equal(new RegExp("\\p{Script=Han}", "u").test(await hero.innerText()), false);
    await page.setViewportSize({ width: 402, height: 874 });
    await page.evaluate(() => window.scrollTo(0, 0));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    assert.ok((await hero.getByTestId("button-start-free").boundingBox())!.y < 850, "Mobile signup should not be pushed down by repeated explanations");
    await page.screenshot({ path: "/tmp/afri-panda-hero-en-mobile.png", animations: "disabled" });
    await page.getByTestId("button-language").click();
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(hero).toContainText("中文");
    await page.screenshot({ path: "/tmp/afri-panda-hero-zh-mobile.png", animations: "disabled" });
    await hero.getByTestId("button-start-free").click();
    await expect(page).toHaveURL(/\/signup$/);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
