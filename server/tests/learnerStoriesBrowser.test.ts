import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import { expectEnglishInterface } from "./helpers/localeAssertions";

test("Learner stories cover both courses in Chinese and English on desktop and mobile", {
  skip: process.env.RUN_BROWSER_TESTS !== "1", timeout: 60_000,
}, async () => {
  const browser = await chromium.launch({
    executablePath: process.env.TEST_CHROMIUM_PATH || "/repl/tools/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({ serviceWorkers: "block" });
    await context.addInitScript(() => {
      new MutationObserver(() => document.getElementById("replit-dev-banner")?.remove())
        .observe(document, { childList: true, subtree: true });
    });
    const page = await context.newPage();
    await page.route("**/api/learner-stories", route => route.fulfill({ json: [] }));
    await page.goto(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    const section = page.getByTestId("learner-stories");
    for (const locale of ["zh-CN", "en"]) {
      if (locale === "en") await page.getByTestId("button-language").click();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      for (const width of [1280, 402]) {
        await page.setViewportSize({ width, height: 900 });
        await section.scrollIntoViewIfNeeded();
        await expect(section.locator("[data-learning-language=amharic]")).toHaveCount(2);
        await expect(section.locator("[data-learning-language=swahili]")).toHaveCount(2);
        await expect(section.locator('[lang="am"]')).toHaveCount(2);
        await expect(section.locator('[lang="sw"]')).toHaveCount(2);
        await expect(section.getByText(locale === "en" ? "Amharic" : "阿姆哈拉语", { exact: true })).toHaveCount(2);
        await expect(section.getByText(locale === "en" ? "Swahili" : "斯瓦希里语", { exact: true })).toHaveCount(2);
        await expect(section).toContainText(locale === "en" ? "Illustrative Amharic and Swahili learner stories." : "阿姆哈拉语与斯瓦希里语的示例学习故事。");
        await expect(section.getByText(locale === "en" ? "Illustrative example" : "示例故事", { exact: true })).toHaveCount(0);
        await expect(section).not.toContainText("not verified testimonials");
        await expect(section).not.toContainText("并非经核实");
        await expect(section).toContainText(locale === "en" ? "Amharic’s Fidel letters" : "菲德尔字母");
        await expect(section).toContainText(locale === "en" ? "Amharic numbers" : "阿姆哈拉语数字");
        if (locale === "en") await expectEnglishInterface(page, `Learner stories at ${width}px`);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
        if (locale === "en" && width === 1280) {
          await section.screenshot({ path: "/tmp/afri-panda-learner-stories.png", animations: "disabled" });
        }
      }
    }
    console.log("PASS: Two Amharic and two Swahili illustrative stories, translated labels and copy, native-script phrases and responsive layouts.");
  } finally {
    await browser.close();
  }
});
