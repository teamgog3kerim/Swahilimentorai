import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium, expect } from "@playwright/test";

test("Bilingual Amharic letters, flashcards, numbers, role-play and saved independent progress", {
  skip: process.env.RUN_BROWSER_TESTS !== "1", timeout: 180_000,
}, async () => {
  const { storage } = await import("../storage");
  const { db, pool } = await import("../db");
  const { adminNotifications } = await import("../../shared/schema");
  const { sql } = await import("drizzle-orm");
  const email = `amharic-browser-${randomUUID()}@gmail.com`;
  const password = `Test-${randomUUID()}`;
  const browser = await chromium.launch({
    executablePath: process.env.TEST_CHROMIUM_PATH || "/repl/tools/bin/chromium",
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    new MutationObserver(() => document.getElementById("replit-dev-banner")?.remove())
      .observe(document, { childList: true, subtree: true });
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  try {
    await page.goto(`${base}/signup`);
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await page.locator('input[name="name"]').fill("Temporary Amharic Learner");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="confirmPassword"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await expect(page.getByTestId("track-chooser")).toBeVisible();
    await page.screenshot({ path: "/tmp/amharic-chooser.png", animations: "disabled" });
    await page.getByTestId("button-choose-amharic").click();
    await page.getByTestId("card-level-beginner").click();
    const lessons = await (await page.request.get(`${base}/api/lessons?language=amharic`)).json();
    const letters = lessons.find((l: any) => l.category === "letters" && l.level === "beginner");
    const words = lessons.find((l: any) => l.category === "words");
    const numbers = lessons.find((l: any) => l.category === "numbers" && l.level === "beginner");
    const conversation = lessons.find((l: any) => l.category === "conversations" && l.level === "beginner");
    assert.ok(letters && words && numbers && conversation);

    await page.getByTestId(`card-lesson-${letters.id}`).click();
    const dialog = page.getByTestId("dialog-lesson-detail");
    await expect(dialog).toContainText("七序排列");
    await page.getByTestId("letter-1").click();
    await expect(page.getByTestId("letter-1")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("letter-1")).toContainText("ሁ");
    await page.getByTestId("button-toggle-lesson-completion").click();
    await expect(page.getByTestId("button-toggle-lesson-completion")).toHaveText("标记为未完成");
    const wrong = (letters.content.quizzes[0].answer + 1) % letters.content.quizzes[0].options.length;
    await page.getByTestId(`quiz-option-${wrong}`).click();
    await page.getByTestId("button-check-answer").click();
    await expect(dialog).toContainText("再看一看");
    for (let i = 1; i < letters.content.quizzes.length; i++) {
      await page.getByTestId("button-next-question").click();
      await page.getByTestId("button-reveal-answer").click();
      await expect(dialog).toContainText("答案已揭晓");
    }
    await page.getByTestId("button-retry-quiz").click();
    await expect(page.getByTestId("quiz-option-0")).toBeEnabled();
    await page.getByTestId("button-close-lesson").click();

    await page.getByTestId(`card-lesson-${words.id}`).click();
    await expect(dialog.getByText(words.content.vocabulary[0].chinese, { exact: true })).toHaveCount(0);
    await page.getByTestId("button-reveal-meaning").click();
    await expect(dialog.getByText(words.content.vocabulary[0].chinese, { exact: true })).toBeVisible();
    await dialog.getByRole("button", { name: "下一张", exact: true }).click();
    await expect(page.getByTestId("button-reveal-meaning")).toHaveText("查看释义");
    await page.getByTestId("button-close-lesson").click();

    await page.getByTestId(`card-lesson-${numbers.id}`).click();
    await expect(dialog).toContainText("ዜሮ");
    await page.getByTestId("button-reveal-meaning").click();
    await expect(dialog.getByText("零 · 0", { exact: true })).toBeVisible();
    await page.getByTestId("button-close-lesson").click();

    await page.getByTestId(`card-lesson-${conversation.id}`).click();
    await page.getByTestId("button-start-practice").click();
    await expect(page.getByTestId("select-practice-lesson")).toHaveValue(conversation.id);
    await page.getByTestId("practice-role-A").click();
    await page.getByTestId("button-reveal-turn").click();
    await page.getByRole("button", { name: "查看翻译", exact: true }).click();
    await page.getByTestId("button-next-turn").click();
    await page.getByTestId("practice-role-B").click();
    await page.getByTestId("button-next-turn").click();
    await expect(page.getByTestId("button-reveal-turn")).toBeVisible();
    await page.getByTestId("button-language").click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByTestId("select-practice-lesson")).toHaveValue(conversation.id);
    await expect(page.getByTestId("button-reveal-turn")).toHaveText("Reveal this turn");
    await page.screenshot({ path: "/tmp/amharic-roleplay.png", animations: "disabled" });

    await page.getByTestId("button-nav-progress").click();
    await expect(page.getByTestId("page-progress")).toContainText(`1 / ${lessons.length}`);
    await page.getByTestId("button-switch-language").click();
    await expect(page.getByTestId("page-progress")).toContainText("0 / 90");
    await page.getByTestId("button-nav-learn").click();
    await page.getByTestId("card-level-beginner").click();
    await page.locator('[data-testid^="card-lesson-"]').first().click();
    await page.getByTestId("button-toggle-lesson-completion").click();
    await expect(page.getByTestId("button-toggle-lesson-completion")).toHaveText("Mark incomplete");
    await page.getByTestId("button-close-lesson").click();
    await page.getByTestId("button-switch-language").click();
    await page.getByTestId("card-level-beginner").click();
    await expect(page.getByTestId(`card-lesson-${letters.id}`).getByTestId("icon-completed")).toBeVisible();
    assert.equal((await (await page.request.get(`${base}/api/progress?language=swahili`)).json()).length, 1);
    assert.equal((await (await page.request.get(`${base}/api/progress?language=amharic`)).json()).length, 1);

    await page.reload();
    await expect(page.getByTestId("track-chooser")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.getByTestId("button-choose-amharic").click();
    await page.getByTestId("card-level-beginner").click();
    await expect(page.getByTestId(`card-lesson-${letters.id}`).getByTestId("icon-completed")).toBeVisible();
    await page.setViewportSize({ width: 402, height: 874 });
    await page.getByTestId(`card-lesson-${letters.id}`).click();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    assert.ok(await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth + 2));
    await page.screenshot({ path: "/tmp/amharic-mobile.png", animations: "disabled" });
    assert.deepEqual(errors, []);
    console.log("PASS: Chinese/English Amharic curriculum, letters, flashcard reveal, numbers, quiz feedback/retry, selected-lesson role-play, track isolation, saved progress and mobile letter layout.");
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
