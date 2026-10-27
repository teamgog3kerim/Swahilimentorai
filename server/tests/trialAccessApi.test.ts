import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { request } from "@playwright/test";
import { FREE_TRIAL_MS } from "../../shared/subscriptionAccess";
import { SUBSCRIPTION_PLANS } from "../../shared/subscriptionPlans";

test("88-hour signup, expiry paywall, retired payments and preserved legacy access", {
  skip: process.env.RUN_BROWSER_TESTS !== "1", timeout: 90_000,
}, async () => {
  const { storage } = await import("../storage");
  const { db, pool } = await import("../db");
  const { users } = await import("../../shared/schema");
  const { eq } = await import("drizzle-orm");
  const baseURL = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  const learner = await request.newContext({ baseURL });
  const admin = await request.newContext({ baseURL });
  const ids: string[] = [];
  try {
    for (const context of [learner, admin]) {
      const response = await context.post("/api/auth/signup", { data: {
        name: "Temporary trial test", email: `trial-${randomUUID()}@example.com`, password: `Test-${randomUUID()}`,
      } });
      assert.equal(response.ok(), true, await response.text());
      const user = await (await context.get("/api/auth/user")).json();
      ids.push(user.id);
      const stored = (await storage.getUser(user.id))!;
      const duration = new Date(stored.subscriptionEndsAt!).getTime() - stored.createdAt.getTime();
      assert.ok(Math.abs(duration - FREE_TRIAL_MS) < 1500, "Both trial dates must be exactly 88 hours apart");
    }
    await db.update(users).set({ isAdmin: true }).where(eq(users.id, ids[1]));
    const lessons = await (await learner.get("/api/lessons?language=amharic")).json();
    const lessonId = lessons[0].id;
    assert.equal((await learner.post("/api/progress", { data: { lessonId, completed: true } })).ok(), true);
    await storage.updateUserPremiumStatus(ids[0], true, new Date(Date.now() - 1));
    for (const path of ["/api/lessons?language=amharic", "/api/lessons?language=swahili",
      "/api/lessons/level/beginner", `/api/lessons/${lessonId}`, "/api/chat/sessions", "/api/chat/session/fake"]) {
      const response = await learner.get(path);
      assert.equal(response.status(), 402, path);
      assert.equal((await response.json()).code, "SUBSCRIPTION_REQUIRED");
    }
    for (const [path, data] of [
      ["/api/progress", { lessonId, completed: true }],
      ["/api/chat/sessions", { level: "beginner", language: "amharic" }],
      ["/api/chat/message", { sessionId: "fake", content: "hello" }],
    ] as const) {
      assert.equal((await learner.post(path, { data })).status(), 402, path);
    }
    assert.equal((await learner.post("/api/subscription/create", { data: { transactionId: "unverified" } })).status(), 410);
    const plans = await (await learner.get("/api/subscription/plans")).json();
    assert.deepEqual(plans.plans, SUBSCRIPTION_PLANS);
    assert.equal(plans.provider, "Polar.sh");
    assert.equal(plans.checkoutEnabled, false);
    const progress = await (await learner.get("/api/progress?language=amharic")).json();
    assert.ok(progress.some((entry: { lessonId: string; completed: boolean }) => entry.lessonId === lessonId && entry.completed));
    const catalog = await (await learner.get("/api/course-catalog?language=amharic")).json();
    assert.ok(catalog.length > 0);
    assert.equal(catalog.some((entry: object) => "content" in entry), false);
    const payment = await learner.post("/api/subscription/verify-payment", { data: {
      transactionId: `test-not-a-real-payment-${randomUUID()}`, planType: "monthly",
    } });
    assert.equal(payment.status(), 410, await payment.text());
    assert.equal(await (await learner.get("/api/subscription")).json(), null);
    assert.equal((await learner.get("/api/lessons")).status(), 402, "Retired payment endpoint must not unlock courses");
    // Earlier pending payments remain resolvable, but new ones cannot be submitted.
    const pending = await storage.createSubscription({
      userId: ids[0], status: "pending", planType: "monthly", amount: 90,
      currency: "USDT", paymentMethod: "Legacy test payment",
      startDate: new Date(), endDate: new Date(Date.now() + 30 * 86400000),
      transactionId: `legacy-fixture-${randomUUID()}`,
    });
    assert.equal((await learner.post("/api/admin/subscription/action", { data: { subscriptionId: pending.id, action: "approve" } })).status(), 403);
    const approval = await admin.post("/api/admin/subscription/action", { data: { subscriptionId: pending.id, action: "approve" } });
    assert.equal(approval.ok(), true, await approval.text());
    assert.equal((await learner.get("/api/lessons?language=amharic")).status(), 200);
    assert.equal((await learner.get("/api/lessons?language=swahili")).status(), 200);
    assert.equal((await admin.get("/api/lessons")).status(), 200);
  } finally {
    for (const id of ids) await storage.deleteManagedUser(id);
    await learner.dispose();
    await admin.dispose();
    await pool.end();
  }
});
