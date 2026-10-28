import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { chromium, expect, type Browser, type Page } from "@playwright/test";
import { eq } from "drizzle-orm";
import { paymentReviews } from "../../shared/schema";

const DAY = 86_400_000;
const actionPath = "/api/admin/subscription/action";

// Delay only transport, not the result: all decisions still reach the real,
// authenticated endpoint and database. No auth or entitlement response is mocked.
async function delayedDecision(page: Page, id: string, action: "approve" | "reject") {
  let release!: () => void;
  let entered!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const intercepted = new Promise<void>(resolve => { entered = resolve; });
  const pattern = `**${actionPath}`;
  let requests = 0;
  await page.route(pattern, async route => {
    requests++;
    entered();
    await gate;
    await route.continue();
  });
  const response = page.waitForResponse(res =>
    new URL(res.url()).pathname === actionPath &&
    res.request().postDataJSON().subscriptionId === id);
  try {
    await page.getByTestId(`button-${action}-${id}`).click();
    await intercepted;
    for (const name of ["approve", "reject"]) {
      const button = page.getByTestId(`button-${name}-${id}`);
      await expect(button).toBeDisabled();
      // Native clicks on disabled buttons must not submit another decision.
      await button.evaluate((element: HTMLButtonElement) => {
        element.click();
        element.click();
      });
    }
    assert.equal(requests, 1);
    release();
    const result = await response;
    assert.equal(result.status(), 200, await result.text());
    const body = await result.json();
    await expect(page.getByTestId(`card-pending-${id}`)).toHaveCount(0);
    assert.equal(requests, 1);
    return body;
  } finally {
    release();
    await page.unroute(pattern);
  }
}

async function signedInPage(browser: Browser, base: string, email: string, password: string) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(origin => {
    // Init scripts also run for opaque documents such as about:blank.
    if (location.origin !== origin) return;
    localStorage.setItem("swahili-ai-language", "en");
    new MutationObserver(() => document.getElementById("replit-dev-banner")?.remove())
      .observe(document, { childList: true, subtree: true });
  }, new URL(base).origin);
  const page = await context.newPage();
  await page.goto(`${base}/login`);
  await page.getByTestId("input-email").fill(email);
  await page.getByTestId("input-password").fill(password);
  await page.locator('button[type="submit"]').click();
  await page.getByTestId("button-choose-swahili").click();
  return page;
}

test("Signed-in legacy review updates lists, expiry and learner access without duplicate grants", {
  skip: process.env.RUN_BROWSER_TESTS !== "1", timeout: 180_000,
}, async t => {
  assert.ok(process.env.REPLIT_DEV_DOMAIN, "A running development app is required");
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  const { storage } = await import("../storage");
  const { db, pool } = await import("../db");
  const userIds: string[] = [];
  const paymentIds: string[] = [];
  const errors: string[] = [];
  let browser: Browser | undefined;
  try {
    // Fail before creating fixtures if the existing audit migration is missing.
    await db.select().from(paymentReviews).limit(0);
    browser = await chromium.launch({
      executablePath: process.env.TEST_CHROMIUM_PATH || "/repl/tools/bin/chromium",
      args: ["--no-sandbox"],
    });
    browser.on("context", context => context.on("page", page =>
      page.on("pageerror", error => errors.push(error.message))));
    const password = randomUUID();
    const hash = await bcrypt.hash(password, 10);
    const account = async (admin: boolean) => {
      const user = await storage.createUserWithPassword(
        `review-ui-${randomUUID()}@example.invalid`, admin ? "Temporary reviewer" : "Temporary learner", hash,
      );
      userIds.push(user.id);
      if (admin) await storage.updateManagedUser(user.id, {
        username: user.username, isAdmin: true, isPremium: true, subscriptionEndsAt: null,
      });
      else await storage.updateUserPremiumStatus(user.id, true, new Date(Date.now() - DAY));
      return user;
    };
    const admin = await account(true);
    const otherAdmin = await account(true);
    const primary = await signedInPage(browser, base, admin.email!, password);
    const stale = await signedInPage(browser, base, otherAdmin.email!, password);
    const lessonResponse = await primary.request.get(`${base}/api/lessons?language=swahili`);
    assert.equal(lessonResponse.status(), 200);
    const lessons = await lessonResponse.json();
    assert.ok(lessons.length);
    const lessonUrl = `${base}/api/lessons/${lessons[0].id}`;

    for (const [plan, action, days] of [
      ["monthly", "approve", 30], ["quarterly", "approve", 90], ["monthly", "reject", 0],
    ] as const) {
      await t.test(`${action} delayed ${plan} payment through admin buttons`, async () => {
        const learner = await account(false);
        const beforeUser = (await storage.getUser(learner.id))!;
        const payment = await storage.createSubscription({
          userId: learner.id, status: "pending", planType: plan,
          amount: plan === "quarterly" ? 250 : 90, currency: "USDT",
          paymentMethod: "Legacy browser regression fixture",
          transactionId: `legacy-browser-${randomUUID()}`,
          startDate: new Date("2020-01-01"), endDate: new Date("2020-02-01"),
        });
        paymentIds.push(payment.id);
        const learnerPage = await signedInPage(browser!, base, learner.email!, password);
        await expect(learnerPage.getByTestId("button-course-access-subscribe")).toBeVisible();
        assert.equal((await learnerPage.request.get(`${base}/api/admin/pending`)).status(), 403);
        assert.equal((await learnerPage.request.get(lessonUrl)).status(), 402);
        // Prime the subscriptions cache as well as pending: success must refresh
        // both views, not merely make the pending card disappear.
        for (const page of [primary, stale]) {
          await page.getByTestId("button-nav-admin").click();
          await page.getByTestId("tab-subscriptions").click();
          await page.getByTestId("button-refresh-subscriptions").click();
          await page.getByTestId("input-search-subscriptions").fill(learner.email!);
          await expect(page.getByTestId(`row-subscription-${payment.id}`)).toContainText("Pending");
          await page.getByTestId("tab-pending").click();
          await page.getByTestId("button-refresh-pending").click();
          await expect(page.getByTestId(`card-pending-${payment.id}`)).toBeVisible();
        }
        const pendingCount = Number(await primary.getByTestId("text-pending-count").innerText());
        const activeCount = Number(await primary.getByTestId("text-active-count").innerText());
        const beforeApproval = Date.now();
        const result = await delayedDecision(primary, payment.id, action);
        const afterApproval = Date.now();
        await expect(primary.getByText(action === "approve" ? "Subscription approved" : "Subscription rejected", {
          exact: true,
        }).first()).toBeVisible();
        await expect(primary.getByTestId("text-pending-count")).toHaveText(String(pendingCount - 1));
        await expect(primary.getByTestId("text-active-count")).toHaveText(String(activeCount + (days ? 1 : 0)));
        const saved = (await storage.getSubscription(payment.id))!;
        const savedUser = (await storage.getUser(learner.id))!;
        assert.equal(saved.amount, payment.amount);
        assert.equal(saved.currency, payment.currency);
        assert.equal(saved.status, action === "approve" ? "active" : "rejected");
        if (action === "approve") {
          assert.ok(saved.startDate.getTime() >= beforeApproval && saved.startDate.getTime() <= afterApproval);
          assert.equal(saved.endDate.getTime() - saved.startDate.getTime(), days * DAY);
          assert.equal(result.endDate, saved.endDate.toISOString());
          assert.deepEqual(savedUser.subscriptionEndsAt, saved.endDate);
        } else {
          assert.deepEqual(saved.startDate, payment.startDate);
          assert.deepEqual(saved.endDate, payment.endDate);
          assert.deepEqual(savedUser, beforeUser);
        }
        await primary.getByTestId("tab-subscriptions").click();
        const row = primary.getByTestId(`row-subscription-${payment.id}`);
        await expect(row.getByTestId(`badge-status-${saved.status}`)).toBeVisible();
        const displayedEnd = await primary.evaluate(iso => new Date(iso).toLocaleDateString("en-US", {
          year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
        }), action === "approve" ? result.endDate : payment.endDate.toISOString());
        await expect(row.getByRole("cell").nth(6)).toHaveText(displayedEnd);
        await expect(primary.getByTestId(`payment-review-${payment.id}`)).toContainText(
          action === "approve" ? displayedEnd : "Rejection did not grant access",
        );
        const events = await db.select().from(paymentReviews).where(eq(paymentReviews.subscriptionId, payment.id));
        assert.equal(events.length, 1);
        assert.equal(events[0].reviewerId, admin.id);

        // A second admin has a genuinely stale pending card. Both repeat actions
        // must surface real server errors and leave dates, access and audit intact.
        for (const repeat of ["approve", "reject"] as const) {
          const response = stale.waitForResponse(res =>
            new URL(res.url()).pathname === actionPath && res.request().postDataJSON().subscriptionId === payment.id);
          await stale.getByTestId(`button-${repeat}-${payment.id}`).click();
          assert.equal((await response).status(), 400);
          await expect(stale.getByText("Action failed", { exact: true }).first()).toBeVisible();
          await expect(stale.getByText(`400: Subscription is already ${saved.status}`, { exact: true }).first()).toBeVisible();
          await expect(stale.getByTestId(`button-${repeat}-${payment.id}`)).toBeEnabled();
        }
        assert.deepEqual(await storage.getSubscription(payment.id), saved);
        assert.deepEqual(await storage.getUser(learner.id), savedUser);
        assert.deepEqual(await db.select().from(paymentReviews).where(eq(paymentReviews.subscriptionId, payment.id)), events);
        await stale.getByTestId("button-refresh-pending").click();
        await expect(stale.getByTestId(`card-pending-${payment.id}`)).toHaveCount(0);

        // Refresh the existing signed-in learner via the real focus listener,
        // without logging in again, replacing auth data, or reloading the page.
        const refreshed = learnerPage.waitForResponse(res =>
          new URL(res.url()).pathname === "/api/auth/user" && res.status() === 200);
        await learnerPage.evaluate(() => window.dispatchEvent(new Event("focus")));
        const refreshedUser = await (await refreshed).json();
        assert.equal(refreshedUser.subscriptionEndsAt, savedUser.subscriptionEndsAt!.toISOString());
        if (action === "approve") {
          await expect(learnerPage.getByTestId("button-course-access-subscribe")).toHaveCount(0);
          await learnerPage.getByTestId("card-level-beginner").click();
          await learnerPage.locator('[data-testid^="card-lesson-"]').first().click();
          await expect(learnerPage.getByTestId("dialog-lesson-detail")).toBeVisible();
          assert.equal((await learnerPage.request.get(lessonUrl)).status(), 200);
          await learnerPage.keyboard.press("Escape");
          await learnerPage.getByTestId("button-nav-practice").click();
          await expect(learnerPage.getByTestId("page-practice")).toBeVisible();
        } else {
          await expect(learnerPage.getByTestId("button-course-access-subscribe")).toBeVisible();
          await learnerPage.getByTestId("button-nav-practice").click();
          await expect(learnerPage.getByTestId("button-course-access-subscribe")).toBeVisible();
          assert.equal((await learnerPage.request.get(lessonUrl)).status(), 402);
        }
        await learnerPage.getByTestId("button-nav-subscription").click();
        if (action === "approve") {
          const date = await learnerPage.evaluate(iso => new Date(iso).toLocaleDateString("en-US"), result.endDate);
          await expect(learnerPage.getByTestId("card-current-subscription")).toContainText(date);
          await expect(learnerPage.getByTestId("card-subscription-record")).toContainText("active");
        } else {
          await expect(learnerPage.getByTestId("alert-expired")).toBeVisible();
          await expect(learnerPage.getByTestId("card-current-subscription")).toContainText("Expired");
          await expect(learnerPage.getByTestId("card-subscription-record")).toHaveCount(0);
        }
        await expect(learnerPage.getByTestId("button-subscribe-quarterly")).toBeDisabled();
        await expect(learnerPage.getByTestId("button-subscribe-semiannual")).toBeDisabled();
        await expect(learnerPage.locator("body")).not.toContainText(/Binance|TRC20|USDT/);
        for (const endpoint of ["verify-payment", "create"]) {
          const response = await learnerPage.request.post(`${base}/api/subscription/${endpoint}`, {
            data: { planType: "monthly", transactionId: `retired-${randomUUID()}` },
          });
          assert.equal(response.status(), 410);
        }
        assert.deepEqual(await storage.getUser(learner.id), savedUser);
        await learnerPage.context().close();
      });
    }
    assert.deepEqual(errors, []);
  } finally {
    // Close sessions before deleting their accounts; remove audit fixtures first
    // because historical reviews intentionally survive account deletion.
    await browser?.close();
    try {
      for (const id of paymentIds) await db.delete(paymentReviews).where(eq(paymentReviews.subscriptionId, id));
      for (const id of userIds.reverse()) await storage.deleteManagedUser(id);
    } finally {
      await pool.end();
    }
  }
});
