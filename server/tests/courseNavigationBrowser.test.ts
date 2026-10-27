import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium, expect } from "@playwright/test";
import type { Lesson } from "../../shared/schema";

test("All courses render, bounded course/exercise navigation works, and AI failures preserve drafts", {
  skip: process.env.RUN_BROWSER_TESTS !== "1",
  timeout: 240_000,
}, async () => {
  const { storage } = await import("../storage");
  const { db, pool } = await import("../db");
  const { adminNotifications } = await import("../../shared/schema");
  const { sql } = await import("drizzle-orm");
  const email = `navigation-${randomUUID()}@gmail.com`;
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
  page.on("pageerror", error => errors.push(error.message));
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  try {
    await page.goto(`${base}/signup`);
    await page.locator('input[name="name"]').fill("Temporary navigation learner");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.locator('input[name="confirmPassword"]').fill(password);
    await page.locator('button[type="submit"]').click();
    await page.getByTestId("button-choose-amharic").click();
    await page.getByTestId("card-level-beginner").click();
    await page.locator('[data-testid^="card-lesson-"]').first().click();
    const dialog = page.getByTestId("dialog-lesson-detail");
    await expect(page.getByTestId("button-previous-lesson")).toBeDisabled();
    await expect(page.getByTestId("button-previous-letter")).toBeDisabled();
    await page.getByTestId("button-next-letter").click();
    await expect(page.getByTestId("letter-1")).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("button-previous-letter").click();
    await expect(page.getByTestId("letter-0")).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("button-reveal-answer").click();
    await page.getByTestId("button-next-question").click();
    await page.getByTestId("button-previous-question").click();
    await expect(page.getByTestId("button-check-answer")).toBeDisabled();
    await page.getByTestId("button-next-lesson").click();
    await expect(page.getByTestId("button-previous-lesson")).toBeEnabled();
    await expect(page.getByTestId("letter-0")).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("button-previous-lesson").click();
    assert.deepEqual(await (await page.request.get(`${base}/api/progress?language=amharic`)).json(), []);
    await page.getByTestId("button-toggle-lesson-completion").click();
    await expect(page.getByTestId("button-toggle-lesson-completion")).toHaveText("标记为未完成");
    await page.setViewportSize({ width: 402, height: 874 });
    assert.ok(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth + 2));
    await page.screenshot({ path: "/tmp/course-navigation-mobile.png", animations: "disabled" });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.getByTestId("button-back-to-lesson-list").click();
    await page.getByTestId("button-back-to-levels").click();
    await page.getByTestId("button-language").click();

    let rendered = 0;
    let swahili: Lesson[] = [];
    for (const track of ["amharic", "swahili"]) {
      if (track === "swahili") await page.getByTestId("button-switch-language").click();
      const lessons: Lesson[] = await (await page.request.get(`${base}/api/lessons?language=${track}`)).json();
      if (track === "swahili") swahili = lessons;
      for (const level of ["beginner", "intermediate", "advanced"]) {
        const levelLessons = lessons.filter(lesson => lesson.level === level);
        await page.getByTestId(`card-level-${level}`).click();
        await page.getByTestId(`card-lesson-${levelLessons[0].id}`).click();
        await expect(page.getByTestId("button-previous-lesson")).toBeDisabled();
        for (let i = 0; i < levelLessons.length; i++) {
          await expect(dialog.getByRole("heading", { name: levelLessons[i].title, exact: true })).toBeVisible();
          await expect(page.getByTestId("text-lesson-position")).toBeVisible();
          const content = levelLessons[i].content as any;
          if (content.grammar) {
            await expect(page.getByTestId("lesson-grammar")).toContainText(content.grammar.rule);
            if (levelLessons[i].title === "Telling Time") await expect(page.getByTestId("lesson-grammar")).toContainText("six hours");
          }
          if (i + 1 < levelLessons.length) await page.getByTestId("button-next-lesson").click();
          else await expect(page.getByTestId("button-next-lesson")).toBeDisabled();
          rendered++;
        }
        await page.getByTestId("button-back-to-lesson-list").click();
        await page.getByTestId("button-back-to-levels").click();
      }
    }
    assert.equal(rendered, 121);
    await page.getByTestId("card-level-beginner").click();
    const numbers = swahili.find(lesson => lesson.title === "Numbers 1-20")!;
    await page.getByTestId(`card-lesson-${numbers.id}`).click();
    await expect(page.getByTestId("button-previous-flashcard")).toBeDisabled();
    await page.getByTestId("button-next-flashcard").click();
    await page.getByTestId("button-previous-flashcard").click();
    await page.getByTestId("button-start-practice").click();
    await expect(page.getByTestId("select-practice-lesson")).toHaveValue(numbers.id);
    await page.getByTestId("quiz-option-0").click();
    await page.getByTestId("button-check-answer").click();
    await expect(page.getByTestId("page-practice")).toContainText("That’s right.");
    await page.getByTestId("button-next-question").click();
    await page.getByTestId("button-previous-question").click();
    await expect(page.getByTestId("button-check-answer")).toBeDisabled();
    await page.getByTestId("practice-category-conversations").click();
    const firstConversation = swahili.find(lesson => (lesson.content as any).dialogues?.length)!;
    await expect(page.getByTestId("select-practice-lesson")).toHaveValue(firstConversation.id);
    await expect(page.getByTestId("button-previous-practice-lesson")).toBeDisabled();
    await expect(page.getByTestId("button-previous-turn")).toBeDisabled();
    const lines = (firstConversation.content as any).dialogues[0].lines;
    for (let i = 1; i < lines.length; i++) await page.getByTestId("button-next-turn").click();
    await expect(page.getByTestId("button-next-turn")).toHaveText("Restart dialogue");
    await page.getByTestId("button-previous-turn").click();
    await expect(page.getByTestId("button-next-turn")).toHaveText("Next turn");
    await page.getByTestId("button-next-practice-lesson").click();
    await page.getByTestId("button-previous-practice-lesson").click();
    await expect(page.getByTestId("select-practice-lesson")).toHaveValue(firstConversation.id);
    await page.getByTestId("button-back-to-courses").click();
    await expect(page.getByTestId("card-level-beginner")).toBeVisible();

    await page.screenshot({ path: "/tmp/course-readiness-swahili.png", animations: "disabled" });

    // Keep real service-worker coverage above. Network mocks need an isolated
    // context because Playwright cannot intercept service-worker-owned fetches.
    const aiContext = await browser.newContext({ serviceWorkers: "block" });
    await aiContext.addCookies(await context.cookies());
    await aiContext.addInitScript(() => {
      new MutationObserver(() => document.getElementById("replit-dev-banner")?.remove())
        .observe(document, { childList: true, subtree: true });
    });
    const aiPage = await aiContext.newPage();
    aiPage.on("pageerror", error => errors.push(error.message));
    await aiPage.route("**/api/capabilities", route => route.fulfill({ json: { aiTutorAvailable: true } }));
    await aiPage.route("**/api/chat/message", route => route.fulfill({ status: 503, json: { message: "AI unavailable" } }));
    await aiPage.goto(base);
    await aiPage.getByTestId("button-language").click();
    await aiPage.getByTestId("button-choose-swahili").click();
    await aiPage.getByTestId("button-nav-practice").click();
    await aiPage.getByTestId("button-ai-practice").click();
    await aiPage.getByTestId("button-start-beginner").click();
    await aiPage.getByTestId("input-message").fill("Habari");
    await aiPage.getByTestId("button-send").click();
    await expect(aiPage.getByText("Live AI is unavailable. Return to guided practice to continue learning.", { exact: true })).toBeVisible();
    await expect(aiPage.getByTestId("input-message")).toHaveValue("Habari");
    await aiPage.getByTestId("button-guided-practice").click();
    await expect(aiPage.getByTestId("select-practice-lesson")).toBeVisible();
    assert.deepEqual(errors, []);
    console.log(`PASS: ${rendered} lessons across both courses and all levels rendered; bilingual/mobile navigation, grammar, flashcards, quizzes, role-play, progress and recoverable AI failures.`);
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
