import { test } from "node:test";
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";

test("Footer is responsive and its panda welcomes scrolling users in both interface languages", {
  skip: process.env.RUN_BROWSER_TESTS !== "1", timeout: 60_000,
}, async () => {
  const browser = await chromium.launch({
    executablePath: process.env.TEST_CHROMIUM_PATH || "/repl/tools/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.addInitScript(() => {
      new MutationObserver(() => document.getElementById("replit-dev-banner")?.remove())
        .observe(document, { childList: true, subtree: true });
    });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`https://${process.env.REPLIT_DEV_DOMAIN}/`);
    const footer = page.getByTestId("footer");
    const panda = page.getByTestId("panda-welcome");
    const greeting = page.getByTestId("panda-greeting");
    await expect(panda).toHaveAttribute("data-visible", "false");
    await panda.scrollIntoViewIfNeeded();
    await expect(panda).toHaveAttribute("data-visible", "true");
    await expect(page.getByTestId("panda-cap")).toBeVisible();
    assert.equal(await panda.locator("svg").evaluate(node => getComputedStyle(node).animationIterationCount), "infinite");
    await expect(panda.getByRole("button")).toHaveCount(0);
    for (const selector of [".panda-welcome__cap", ".panda-welcome__tassel"]) {
      assert.equal(await panda.locator(selector).evaluate(node => getComputedStyle(node).animationIterationCount), "infinite");
    }
    await expect(greeting).toBeVisible();
    assert.match(await greeting.innerText(), /欢迎/);
    await expect(footer).toContainText("Afri Panda");
    await expect(footer).toContainText("the African languages Academy for Chinese people");
    await expect(footer).toContainText("阿姆哈拉语");
    await expect(footer).toContainText("斯瓦希里语");
    await expect(footer.getByTestId("link-登录")).toHaveAttribute("href", "/login");
    await expect(footer.getByTestId("link-定价")).toHaveAttribute("href", "/#pricing");
    await page.screenshot({ path: "/tmp/afri-panda-footer-zh-desktop.png", animations: "disabled" });
    await page.getByTestId("button-language").click();
    await panda.scrollIntoViewIfNeeded();
    await expect(greeting).toContainText(/welcome/i);
    await expect(footer).toContainText("Amharic");
    await expect(footer).toContainText("Swahili");
    assert.equal(/\p{Script=Han}/u.test(await footer.innerText()), false);
    for (const width of [320, 402, 768, 1440]) {
      await page.setViewportSize({ width, height: 874 });
      await panda.scrollIntoViewIfNeeded();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `No horizontal overflow at ${width}px`);
    }
    await page.setViewportSize({ width: 402, height: 874 });
    await panda.scrollIntoViewIfNeeded();
    await page.screenshot({ path: "/tmp/afri-panda-footer-en-mobile.png", animations: "disabled" });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const lightSurface = await footer.evaluate(node => getComputedStyle(node).backgroundColor);
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    assert.notEqual(await footer.evaluate(node => getComputedStyle(node).backgroundColor), lightSurface, "Footer follows the app's dark theme");
    await page.screenshot({ path: "/tmp/afri-panda-footer-dark-mobile.png", animations: "disabled" });
    await page.evaluate(() => document.documentElement.classList.remove("dark"));
    assert.equal(await panda.evaluate(node =>
      [node, ...node.querySelectorAll("*")].some(element => {
        const style = getComputedStyle(element);
        return style.animationName !== "none" && style.animationDuration.split(",").some(duration => parseFloat(duration) > 0.01);
      })), false, "Reduced-motion users should not get repeating panda animations");
    await footer.getByTestId("link-免费注册").click();
    await expect(page).toHaveURL(/\/signup$/);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});
