import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { chromium, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { paymentReviews } from "../../shared/schema";

test("Admin payment history shows real reviewer snapshots and bilingual historical gaps", {
  skip: process.env.RUN_BROWSER_TESTS !== "1", timeout: 90_000,
}, async () => {
  const { storage } = await import("../storage");
  const { db, pool } = await import("../db");
  const browser = await chromium.launch({
    executablePath: process.env.TEST_CHROMIUM_PATH || "/repl/tools/bin/chromium",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const ids: string[] = [];
  const paymentIds: string[] = [];
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  try {
    const password = randomUUID();
    const admin = await storage.createUserWithPassword(
      `audit-browser-admin-${randomUUID()}@example.com`, "Audit reviewer", await bcrypt.hash(password, 10),
    );
    ids.push(admin.id);
    await storage.updateManagedUser(admin.id, {
      username: admin.username, isAdmin: true, isPremium: true, subscriptionEndsAt: null,
    });
    const learner = await storage.createUserWithPassword(
      `audit-browser-learner-${randomUUID()}@example.com`, "Audit learner", "not-a-real-password",
    );
    ids.push(learner.id);
    const fixture = async (status: string, amount = 90) => {
      const payment = await storage.createSubscription({
        userId: learner.id, status, planType: "monthly", amount, currency: "USDT",
        paymentMethod: "Legacy test fixture", startDate: new Date("2020-01-01"), endDate: new Date("2020-02-01"),
      });
      paymentIds.push(payment.id);
      return payment;
    };
    const approved = await fixture("pending");
    const rejected = await fixture("pending");
    const historical = await fixture("active", 17);
    const pending = await fixture("pending");
    assert.ok((await page.request.post(`${base}/api/auth/login`, { data: { email: admin.email, password } })).ok());
    // Extra client-supplied reviewer details must not override the signed-in actor.
    assert.ok((await page.request.post(`${base}/api/admin/subscription/action`, {
      data: { subscriptionId: approved.id, action: "approve", reviewerId: learner.id, reviewerName: "Forged reviewer" },
    })).ok());
    assert.ok((await page.request.post(`${base}/api/admin/subscription/action`, {
      data: { subscriptionId: rejected.id, action: "reject" },
    })).ok());
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(base);
    await page.getByTestId("button-choose-swahili").click();
    await page.getByTestId("button-nav-admin").click();
    await page.getByTestId("tab-subscriptions").click();
    await page.getByTestId("input-search-subscriptions").fill(learner.email);
    const approval = page.getByTestId(`payment-review-${approved.id}`);
    const rejection = page.getByTestId(`payment-review-${rejected.id}`);
    const old = page.getByTestId(`payment-review-${historical.id}`);
    await expect(approval).toContainText("已批准");
    await expect(approval).toContainText(admin.username);
    await expect(approval).not.toContainText("Forged reviewer");
    await expect(approval).toContainText("审核时间");
    await expect(approval).toContainText("记录的订阅开始时间");
    await expect(approval).toContainText("记录的订阅结束时间");
    await expect(approval).toContainText("审核后的访问截止时间");
    await expect(rejection).toContainText("已拒绝");
    await expect(rejection).toContainText("拒绝未授予访问权限");
    await expect(old).toHaveText("历史支付未记录审核详情");
    await expect(page.getByTestId(`payment-review-${pending.id}`)).toHaveText("等待验证");
    await page.getByTestId("button-language").click();
    await expect(approval).toContainText("Approved");
    await expect(approval).toContainText("Reviewed at");
    await expect(rejection).toContainText("Rejected");
    await expect(rejection).toContainText("Rejection did not grant access");
    await expect(old).toHaveText("Review details were not recorded for this historical payment");
    await expect(page.getByTestId(`row-subscription-${historical.id}`)).toContainText("17 USDT");
    await page.reload();
    await page.getByTestId("button-choose-swahili").click();
    await page.getByTestId("button-nav-admin").click();
    await page.getByTestId("tab-subscriptions").click();
    await page.getByTestId("input-search-subscriptions").fill(learner.email);
    await expect(approval).toContainText("Audit reviewer");
    await page.screenshot({ path: "/tmp/payment-review-admin.jpg", fullPage: true });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    for (const id of paymentIds) await db.delete(paymentReviews).where(eq(paymentReviews.subscriptionId, id));
    for (const id of ids.reverse()) await storage.deleteManagedUser(id);
    await pool.end();
  }
});
