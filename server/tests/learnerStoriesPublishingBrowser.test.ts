import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { chromium, expect } from "@playwright/test";

test("Admin can publish bilingual permissioned stories, edit, withdraw permission and delete", {
  skip: process.env.RUN_BROWSER_TESTS !== "1", timeout: 120_000,
}, async () => {
  const { storage } = await import("../storage");
  const { pool } = await import("../db");
  const browser = await chromium.launch({
    executablePath: process.env.TEST_CHROMIUM_PATH || "/repl/tools/bin/chromium",
    args: ["--no-sandbox"],
  });
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  let adminId: string | undefined;
  const storyIds: string[] = [];
  const errors: string[] = [];
  try {
    const password = randomUUID();
    const user = await storage.createUserWithPassword(`story-browser-${randomUUID()}@example.invalid`, "Story QA", await bcrypt.hash(password, 10));
    adminId = user.id;
    await storage.updateManagedUser(user.id, { username: user.username, isAdmin: true, isPremium: false, subscriptionEndsAt: null });
    const context = await browser.newContext();
    await context.addInitScript(() => {
      if (!localStorage.getItem("swahili-ai-language")) localStorage.setItem("swahili-ai-language", "en");
      new MutationObserver(() => document.getElementById("replit-dev-banner")?.remove())
        .observe(document, { childList: true, subtree: true });
    });
    const login = await context.request.post(`${base}/api/auth/login`, { data: { email: user.email, password } });
    assert.equal(login.status(), 200);
    const page = await context.newPage();
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${base}/dashboard`);
    await page.getByTestId("button-choose-swahili").click();
    await page.getByTestId("button-nav-admin").click();
    await page.getByTestId("tab-learner-stories").click();
    await page.locator("#story-language").selectOption("amharic");
    const fields = {
      "name-zh": "自动测试署名",
      "name-en": `Automated learner ${randomUUID().slice(0, 8)}`,
      "quote-zh": "自动测试故事，不是真实学员评价。",
      "quote-en": "Browser test story, not a real learner endorsement.",
      "context-zh": "测试背景",
      "context-en": "Test context",
      "private-contact": "private-browser-test@example.invalid",
      "consent-record": "Automated test record only, not actual learner permission.",
    };
    for (const [id, value] of Object.entries(fields)) await page.locator(`#${id}`).fill(value);
    const consent = page.getByRole("checkbox").nth(0);
    const approved = page.getByRole("checkbox").nth(1);
    const published = page.getByRole("checkbox").nth(2);
    await expect(approved).toBeDisabled();
    await expect(published).toBeDisabled();
    await consent.check();
    await approved.check();
    await published.check();
    await page.getByRole("button", { name: "Save story", exact: true }).click();
    await expect(page.getByText("Story saved.", { exact: true })).toBeVisible();
    const records = await (await context.request.get(`${base}/api/admin/learner-stories`)).json();
    const record = records.find((s: { displayNameEn: string }) => s.displayNameEn === fields["name-en"]);
    assert.ok(record);
    storyIds.push(record.id);
    const row = page.getByTestId(`learner-story-admin-${record.id}`);
    await expect(row).toContainText("Published");
    await row.getByRole("button", { name: "Edit", exact: true }).click();
    await page.locator("#quote-en").fill("Edited test story.");
    await expect(approved).not.toBeChecked();
    await expect(published).not.toBeChecked();
    await expect(approved).toBeDisabled();
    await page.getByRole("button", { name: "Save story", exact: true }).click();
    await expect(page.getByText("Story saved.", { exact: true })).toBeVisible();
    await expect(row).toContainText("Unpublished");
    await row.getByRole("button", { name: "Edit", exact: true }).click();
    await approved.check();
    await published.check();
    await page.getByRole("button", { name: "Save story", exact: true }).click();
    await expect(page.getByText("Story saved.", { exact: true })).toBeVisible();

    const visitor = await browser.newContext();
    await visitor.addInitScript(() => {
      new MutationObserver(() => document.getElementById("replit-dev-banner")?.remove())
        .observe(document, { childList: true, subtree: true });
    });
    const publicPage = await visitor.newPage();
    await publicPage.goto(base);
    const publicCard = publicPage.getByTestId(`testimonial-${record.id}`);
    await expect(publicCard).toContainText(fields["quote-zh"]);
    await expect(publicCard).toContainText("阿姆哈拉语");
    await expect(publicCard).toContainText("已核实");
    await publicPage.getByTestId("button-language").click();
    await expect(publicCard).toContainText("Edited test story.");
    await expect(publicCard).toContainText("Amharic");
    await expect(publicCard).toContainText("Verified");
    for (const width of [1280, 402]) {
      await publicPage.setViewportSize({ width, height: 900 });
      await publicCard.scrollIntoViewIfNeeded();
      assert.ok(await publicPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
      await expect(publicPage.locator("body")).not.toContainText(fields["private-contact"]);
      await expect(publicPage.locator("body")).not.toContainText(fields["consent-record"]);
    }
    await row.getByRole("button", { name: "Edit", exact: true }).click();
    await consent.uncheck();
    await expect(approved).not.toBeChecked();
    await expect(published).not.toBeChecked();
    await page.getByRole("button", { name: "Save story", exact: true }).click();
    await expect(page.getByText("Story saved.", { exact: true })).toBeVisible();
    await publicPage.reload();
    await expect(publicPage.getByTestId(`testimonial-${record.id}`)).toHaveCount(0);
    await page.getByTestId("button-language").click();
    await expect(page.getByRole("button", { name: "保存故事", exact: true })).toBeVisible();
    await page.setViewportSize({ width: 402, height: 900 });
    await expect(row).toContainText("未发布");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    // Admin APIs must not be present in shared service-worker caches.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.reload();
    const cachedPrivateUrls = await page.evaluate(async () => {
      const urls: string[] = [];
      for (const name of await caches.keys()) {
        for (const req of await (await caches.open(name)).keys()) {
          if (new URL(req.url).pathname.startsWith("/api/admin/learner-stories")) urls.push(req.url);
        }
      }
      return urls;
    });
    assert.deepEqual(cachedPrivateUrls, []);
    await page.getByTestId("button-choose-swahili").click();
    await page.getByTestId("button-nav-admin").click();
    await page.getByTestId("tab-learner-stories").click();
    page.once("dialog", dialog => dialog.accept());
    await page.getByTestId(`learner-story-admin-${record.id}`).getByRole("button", { name: "删除", exact: true }).click();
    await expect(page.getByTestId(`learner-story-admin-${record.id}`)).toHaveCount(0);
    assert.deepEqual(errors, []);
    await visitor.close();
  } finally {
    await browser.close();
    for (const id of storyIds) await storage.deleteLearnerStory(id);
    if (adminId) await storage.deleteManagedUser(adminId);
    await pool.end();
  }
});
