import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium, expect } from "@playwright/test";
import { expectEnglishInterface } from "./helpers/localeAssertions";

test("English audit allows native teaching text and only the language-switch Chinese label", {
  skip: process.env.RUN_BROWSER_TESTS !== "1", timeout: 30_000,
}, async () => {
  const browser = await chromium.launch({
    executablePath: process.env.TEST_CHROMIUM_PATH || "/repl/tools/bin/chromium", args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent('<html lang="en"><body><button data-testid="button-language" title="切换界面语言为中文">中文</button><p lang="am">ሰላም!</p><p lang="sw">Jambo!</p><p hidden>隐藏</p></body></html>');
    await expectEnglishInterface(page, "Intentional native phrases");
    await page.evaluate(() => document.body.insertAdjacentHTML("beforeend", '<button title="保存">Save</button><p data-testid="missing-label">阿姆哈拉语</p>'));
    await assert.rejects(expectEnglishInterface(page, "Regression fixture"), /title=保存[\s\S]*missing-label: 阿姆哈拉语/);
  } finally {
    await browser.close();
  }
});

test("principal public and learner flows stay bilingual without Chinese fallback in English", {
  skip: process.env.RUN_BROWSER_TESTS !== "1", timeout: 180_000,
}, async () => {
  const { storage } = await import("../storage");
  const { db, pool } = await import("../db");
  const { adminNotifications } = await import("../../shared/schema");
  const { sql } = await import("drizzle-orm");
  const email = `locale-${randomUUID()}@gmail.com`;
  const password = `Test-${randomUUID()}`;
  const browser = await chromium.launch({
    executablePath: process.env.TEST_CHROMIUM_PATH || "/repl/tools/bin/chromium", args: ["--no-sandbox"],
  });
  const context = await browser.newContext({ serviceWorkers: "block" });
  await context.addInitScript(() => {
    new MutationObserver(() => document.getElementById("replit-dev-banner")?.remove())
      .observe(document, { childList: true, subtree: true });
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  const check = async (english: boolean, flow: string) => {
    await expect(page.locator("html")).toHaveAttribute("lang", english ? "en" : "zh-CN");
    if (english) await expectEnglishInterface(page, flow);
  };
  try {
    // Isolate the illustrative fallback from any genuine stories in the database.
    await page.route("**/api/learner-stories", route => route.fulfill({ json: [] }));
    for (const english of [false, true]) {
      await page.goto(base);
      if (english) await page.getByTestId("button-language").click();
      await expect(page.getByTestId("learner-stories")).toBeVisible();
      await check(english, "Landing, pricing, footer and learner stories");
      await page.getByTestId("button-share").first().click();
      await expect(page.getByTestId("dialog-share")).toBeVisible();
      await check(english, "Sharing dialog");
      await page.keyboard.press("Escape");
      for (const route of ["/login", "/signup", "/missing-locale-page"]) {
        await page.goto(`${base}${route}`);
        if (route === "/missing-locale-page") await expect(page.getByRole("heading")).toBeVisible();
        else await expect(page.getByTestId(route === "/login" ? "text-login-title" : "text-signup-title")).toBeVisible();
        await check(english, route);
      }
      await page.goto(`${base}/signup`);
      await page.locator('input[name="name"]').fill("QA");
      await page.locator('input[name="email"]').fill("qa@example.com");
      await page.locator('input[name="password"]').fill("short");
      await page.locator('input[name="confirmPassword"]').fill("different");
      await page.locator('button[type="submit"]').click();
      await expect(page.getByText(english ? "Password must be at least 8 characters" : "密码至少需要8个字符", { exact: true })).toBeVisible();
      await check(english, "Sign-up validation");
    }
    await page.locator('input[name="name"]').fill("Locale QA Learner");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="confirmPassword"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page.getByTestId("track-chooser")).toBeVisible();
    await check(true, "Course chooser");

    for (const english of [true, false]) {
      if (!english) {
        await page.getByTestId("button-language").click();
        await page.reload();
      }
      await expect(page.getByTestId("track-chooser")).toBeVisible();
      await check(english, "Course chooser");
      await page.getByTestId("button-choose-amharic").click();
      for (const track of ["amharic", "swahili"]) {
        if (track === "swahili") await page.getByTestId("button-switch-language").click();
        await page.getByTestId("button-nav-learn").click();
        await expect(page.getByTestId("card-level-beginner")).toBeVisible();
        await check(english, `${track} course levels`);
        await page.getByTestId("card-level-beginner").click();
        await expect(page.locator('[data-testid^="card-lesson-"]').first()).toBeVisible();
        await check(english, `${track} lesson list`);
        await page.locator('[data-testid^="card-lesson-"]').first().click();
        await expect(page.getByTestId("dialog-lesson-detail")).toBeVisible();
        await check(english, `${track} lesson detail`);
        await page.getByTestId("button-toggle-lesson-completion").click();
        await expect(page.getByTestId("button-toggle-lesson-completion")).toHaveText(english ? "Mark incomplete" : "标记为未完成");
        await check(english, `${track} saved progress feedback`);
        await page.getByTestId("button-close-lesson").click();
        await page.getByTestId("button-nav-practice").click();
        await expect(page.getByTestId("select-practice-lesson")).toBeVisible();
        await page.getByTestId("quiz-option-0").click();
        await page.getByTestId("button-check-answer").click();
        await check(english, `${track} guided quiz feedback`);
        await page.getByTestId("practice-category-conversations").click();
        await expect(page.getByTestId("button-reveal-turn")).toBeVisible();
        await page.getByTestId("button-reveal-turn").click();
        await page.getByRole("button", { name: english ? "Reveal translation" : "查看翻译", exact: true }).click();
        await check(english, `${track} role-play translation`);
        await page.getByTestId("button-nav-progress").click();
        await expect(page.getByTestId("page-progress")).toBeVisible();
        await check(english, `${track} progress`);
      }
      await page.getByTestId("button-nav-subscription").click();
      await expect(page.getByRole("heading", { name: english ? "Subscription" : "订阅", exact: true })).toBeVisible();
      await check(english, "Subscription plans");
      await expect(page.getByTestId("button-subscribe-quarterly")).toBeDisabled();
      await expect(page.getByTestId("button-subscribe-semiannual")).toBeDisabled();
      await expect(page.getByTestId("dialog-payment")).toHaveCount(0);
      await expect(page.getByText(english
        ? /Sandbox checkout is not ready/
        : /沙盒结账尚未就绪/).first()).toBeVisible();
    }
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    assert.equal(await page.evaluate(() => localStorage.getItem("swahili-ai-language")), "zh");
    await page.getByTestId("button-language").click();
    await page.reload();
    await check(true, "Saved English preference on reload");
    assert.equal(await page.evaluate(() => localStorage.getItem("swahili-ai-language")), "en");
    assert.deepEqual(errors, []);
  } finally {
    const user = await storage.getUserByEmail(email);
    if (user) {
      await db.delete(adminNotifications).where(sql`${adminNotifications.metadata}->>'userId' = ${user.id}`);
      await storage.deleteManagedUser(user.id);
    }
    await browser.close();
    await pool.end();
  }
});
