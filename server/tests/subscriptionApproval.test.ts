import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { paymentReviews } from "../../shared/schema";
import { subscriptionDatesAtApproval } from "../subscriptionApproval";

const DAY = 86400000;
const now = new Date("2026-10-28T12:00:00Z");
const learner = { isAdmin: false, isPremium: true, subscriptionEndsAt: new Date(now.getTime() - DAY) };

test("Legacy approval grants a full fixed-day term, independent of old submission dates", () => {
  for (const [plan, days] of [["monthly", 30], ["quarterly", 90]] as const) {
    const dates = subscriptionDatesAtApproval(plan, learner, null, now);
    assert.deepEqual(dates.startDate, now);
    assert.equal(dates.endDate.getTime(), now.getTime() + days * DAY);
    assert.deepEqual(dates.subscriptionEndsAt, dates.endDate);
  }
});

test("Early trial purchase and paid renewals preserve the latest valid entitlement", () => {
  const trialEnd = new Date(now.getTime() + 70 * 3600000);
  const paidEnd = new Date(now.getTime() + 3 * DAY);
  for (const [userEnd, activeEnd, expectedStart] of [
    [trialEnd, null, trialEnd],
    [trialEnd, paidEnd, paidEnd],
    [paidEnd, trialEnd, paidEnd],
    [learner.subscriptionEndsAt, learner.subscriptionEndsAt, now],
  ] as const) {
    const dates = subscriptionDatesAtApproval("monthly", { ...learner, subscriptionEndsAt: userEnd }, activeEnd, now);
    assert.deepEqual(dates.startDate, expectedStart);
    assert.equal(dates.endDate.getTime(), expectedStart.getTime() + 30 * DAY);
  }
});

test("Unlimited access is not shortened and disabled stale deadlines are not renewed", () => {
  assert.equal(subscriptionDatesAtApproval("monthly", { ...learner, subscriptionEndsAt: null }, null, now).subscriptionEndsAt, null);
  const dates = subscriptionDatesAtApproval("monthly", {
    ...learner, isPremium: false, subscriptionEndsAt: new Date(now.getTime() + 365 * DAY),
  }, null, now);
  assert.deepEqual(dates.startDate, now);
  assert.throws(() => subscriptionDatesAtApproval("semiannual", learner, null, now), /Unsupported legacy/);
  assert.throws(() => subscriptionDatesAtApproval("toString", learner, null, now), /Unsupported legacy/);
});

test("Manual review persists full terms atomically and serializes duplicate approvals and renewals", {
  skip: process.env.RUN_HTTP_TESTS !== "1", timeout: 90_000,
}, async (t) => {
  const { storage } = await import("../storage");
  const { pool, db } = await import("../db");
  const ids: string[] = [];
  const paymentIds: string[] = [];
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  try {
    const password = randomUUID();
    const admin = await storage.createUserWithPassword(
      `approval-admin-${randomUUID()}@example.com`, "Temporary admin", await bcrypt.hash(password, 10),
    );
    ids.push(admin.id);
    await storage.updateManagedUser(admin.id, {
      username: admin.username, isAdmin: true, isPremium: true, subscriptionEndsAt: null,
    });
    const login = await fetch(`${base}/api/auth/login`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: admin.email, password }),
    });
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie")?.split(";")[0];
    assert.ok(cookie);
    const act = (id: string, action = "approve") => fetch(`${base}/api/admin/subscription/action`, {
      method: "POST", headers: { cookie, "content-type": "application/json" },
      body: JSON.stringify({ subscriptionId: id, action }),
    });
    const fixture = async (deadline: Date | null, premium = true) => {
      const user = await storage.createUserWithPassword(
        `approval-learner-${randomUUID()}@example.com`, "Temporary learner", "not-a-real-password",
      );
      ids.push(user.id);
      await storage.updateUserPremiumStatus(user.id, premium, deadline);
      return user;
    };
    const pending = async (userId: string, planType = "monthly") => {
      const payment = await storage.createSubscription({
      userId, status: "pending", planType, amount: planType === "quarterly" ? 250 : 90,
      currency: "USDT", paymentMethod: "Legacy test fixture",
      // Old provisional dates are deliberately already expired.
      startDate: new Date(Date.now() - 120 * DAY), endDate: new Date(Date.now() - 90 * DAY),
      transactionId: `approval-test-${randomUUID()}`,
      });
      paymentIds.push(payment.id);
      return payment;
    };
    const reviews = (id: string) => db.select().from(paymentReviews).where(eq(paymentReviews.subscriptionId, id));
    const assertReview = async (id: string, outcome: "approved" | "rejected") => {
      const events = await reviews(id);
      assert.equal(events.length, 1);
      const saved = (await storage.getSubscription(id))!;
      assert.equal(events[0].reviewerId, admin.id);
      assert.equal(events[0].reviewerName, admin.username);
      assert.equal(events[0].outcome, outcome);
      assert.deepEqual(events[0].startDate, saved.startDate);
      assert.deepEqual(events[0].endDate, saved.endDate);
      assert.deepEqual(events[0].subscriptionEndsAt, (await storage.getUser(saved.userId))!.subscriptionEndsAt);
      assert.ok(Math.abs(events[0].reviewedAt.getTime() - Date.now()) < 60_000);
      return events[0];
    };

    await t.test("Delayed monthly and quarterly approvals start now, not at submission", async () => {
      for (const [plan, days] of [["monthly", 30], ["quarterly", 90]] as const) {
        const user = await fixture(new Date(Date.now() - DAY));
        const payment = await pending(user.id, plan);
        const before = Date.now();
        assert.equal((await storage.getSubscription(payment.id))!.status, "pending");
        const response = await act(payment.id);
        assert.equal(response.status, 200, await response.text());
        const after = Date.now();
        const saved = (await storage.getSubscription(payment.id))!;
        assert.equal(saved.status, "active");
        assert.ok(saved.startDate.getTime() >= before && saved.startDate.getTime() <= after);
        assert.equal(saved.endDate.getTime() - saved.startDate.getTime(), days * DAY);
        assert.equal(saved.amount, payment.amount);
        assert.equal(saved.currency, payment.currency);
        assert.deepEqual((await storage.getUser(user.id))!.subscriptionEndsAt, saved.endDate);
        assert.equal((await act(payment.id)).status, 400);
        assert.equal((await act(payment.id, "reject")).status, 400);
        assert.deepEqual(await storage.getSubscription(payment.id), saved);
        await assertReview(payment.id, "approved");
      }
    });

    await t.test("Buying during a trial keeps every remaining trial hour", async () => {
      const trialEnd = new Date(Date.now() + 70 * 3600000);
      const user = await fixture(trialEnd);
      const payment = await pending(user.id);
      assert.deepEqual((await storage.getUser(user.id))!.subscriptionEndsAt, trialEnd, "Pending payment must not change access");
      const response = await act(payment.id);
      assert.equal(response.status, 200);
      const saved = (await storage.getSubscription(payment.id))!;
      assert.deepEqual(saved.startDate, trialEnd);
      assert.equal(saved.endDate.getTime(), trialEnd.getTime() + 30 * DAY);
      assert.equal((await response.json()).endDate, saved.endDate.toISOString());
      assert.deepEqual((await storage.getUser(user.id))!.subscriptionEndsAt, saved.endDate);
    });

    await t.test("Renewals preserve active paid time even if the user deadline lags", async () => {
      const user = await fixture(new Date(Date.now() + DAY));
      const paidEnd = new Date(Date.now() + 3 * DAY);
      await storage.createSubscription({
        userId: user.id, status: "active", planType: "monthly", amount: 90,
        currency: "USDT", paymentMethod: "Legacy test fixture",
        startDate: new Date(Date.now() - 27 * DAY), endDate: paidEnd,
      });
      const payment = await pending(user.id);
      assert.equal((await act(payment.id)).status, 200);
      assert.deepEqual((await storage.getSubscription(payment.id))!.startDate, paidEnd);
      assert.equal((await storage.getUser(user.id))!.subscriptionEndsAt!.getTime(), paidEnd.getTime() + 30 * DAY);
    });

    await t.test("Concurrent duplicate approvals add the duration only once", async () => {
      const end = new Date(Date.now() + DAY);
      const user = await fixture(end);
      const payment = await pending(user.id);
      const responses = await Promise.all([act(payment.id), act(payment.id)]);
      assert.deepEqual(responses.map(r => r.status).sort(), [200, 400]);
      assert.equal((await storage.getUser(user.id))!.subscriptionEndsAt!.getTime(), end.getTime() + 30 * DAY);
      await assertReview(payment.id, "approved");
    });

    await t.test("Concurrent distinct payments stack without losing either paid term", async () => {
      const end = new Date(Date.now() + DAY);
      const user = await fixture(end);
      const payments = await Promise.all([pending(user.id), pending(user.id, "quarterly")]);
      const responses = await Promise.all(payments.map(p => act(p.id)));
      assert.deepEqual(responses.map(r => r.status), [200, 200]);
      const saved = await Promise.all(payments.map(p => storage.getSubscription(p.id)));
      saved.sort((a, b) => a!.startDate.getTime() - b!.startDate.getTime());
      assert.deepEqual(saved[0]!.startDate, end);
      assert.deepEqual(saved[1]!.startDate, saved[0]!.endDate);
      assert.equal((await storage.getUser(user.id))!.subscriptionEndsAt!.getTime(), end.getTime() + 120 * DAY);
    });

    await t.test("Rejection is terminal, does not change access, and missing IDs return 404", async () => {
      const end = new Date(Date.now() + DAY);
      const user = await fixture(end);
      const payment = await pending(user.id);
      assert.equal((await act(payment.id, "reject")).status, 200);
      assert.equal((await act(payment.id)).status, 400);
      const saved = (await storage.getSubscription(payment.id))!;
      assert.equal(saved.status, "rejected");
      assert.deepEqual(saved.startDate, payment.startDate);
      assert.deepEqual(saved.endDate, payment.endDate);
      assert.deepEqual((await storage.getUser(user.id))!.subscriptionEndsAt, end);
      const event = await assertReview(payment.id, "rejected");
      assert.equal((await act(payment.id, "reject")).status, 400);
      assert.deepEqual(await reviews(payment.id), [event]);
      assert.equal((await act(randomUUID())).status, 404);
    });

    await t.test("Approval/rejection races have exactly one terminal outcome", async () => {
      const end = new Date(Date.now() + DAY);
      const user = await fixture(end);
      const payment = await pending(user.id);
      const responses = await Promise.all([act(payment.id), act(payment.id, "reject")]);
      assert.deepEqual(responses.map(r => r.status).sort(), [200, 400]);
      const saved = (await storage.getSubscription(payment.id))!;
      const expectedEnd = saved.status === "active" ? new Date(end.getTime() + 30 * DAY) : end;
      assert.deepEqual((await storage.getUser(user.id))!.subscriptionEndsAt, expectedEnd);
      await assertReview(payment.id, saved.status === "active" ? "approved" : "rejected");
    });

    await t.test("Unlimited grants survive approval and invalid plans leave payments pending", async () => {
      const user = await fixture(null);
      const payment = await pending(user.id);
      assert.equal((await act(payment.id)).status, 200);
      assert.equal((await storage.getUser(user.id))!.subscriptionEndsAt, null);
      const invalid = await pending(user.id, "unknown");
      await assert.rejects(storage.resolvePendingSubscription(invalid.id, "approve", admin.id), /Unsupported legacy/);
      assert.equal((await storage.getSubscription(invalid.id))!.status, "pending");
      assert.equal((await storage.getUser(user.id))!.subscriptionEndsAt, null);
      assert.deepEqual(await reviews(invalid.id), []);
    });

    await t.test("Failures after writing the audit roll back both decisions and access; retry writes once", async () => {
      for (const action of ["approve", "reject"] as const) {
        const user = await fixture(new Date(Date.now() + DAY));
        const payment = await pending(user.id);
        const before = await storage.getUser(user.id);
        const originalTransaction = db.transaction;
        // Exercise a real database rollback after the payment, entitlement and
        // audit INSERT have all executed, not a mocked database transaction.
        db.transaction = ((callback: any, config: any) => originalTransaction.call(db, async (tx: any) => {
          await callback(tx);
          const inserted = await tx.select().from(paymentReviews).where(eq(paymentReviews.subscriptionId, payment.id));
          assert.equal(inserted.length, 1);
          throw new Error("Injected failure before commit");
        }, config)) as typeof db.transaction;
        try {
          await assert.rejects(storage.resolvePendingSubscription(payment.id, action, admin.id), /Injected failure/);
        } finally {
          db.transaction = originalTransaction;
        }
        assert.deepEqual(await storage.getSubscription(payment.id), payment);
        assert.deepEqual(await storage.getUser(user.id), before);
        assert.deepEqual(await reviews(payment.id), []);
        assert.equal((await act(payment.id, action)).status, 200);
        await assertReview(payment.id, action === "approve" ? "approved" : "rejected");
      }
    });

    await t.test("Audit write failures cannot partially approve or reject payments", async () => {
      for (const action of ["approve", "reject"] as const) {
        const user = await fixture(new Date(Date.now() + DAY));
        const payment = await pending(user.id);
        const before = await storage.getUser(user.id);
        // A test-only preexisting key makes the audit INSERT fail at the database.
        await db.insert(paymentReviews).values({
          subscriptionId: payment.id, reviewerId: admin.id, reviewerName: admin.username,
          outcome: "rejected", startDate: payment.startDate, endDate: payment.endDate,
          subscriptionEndsAt: before!.subscriptionEndsAt,
        });
        try {
          await assert.rejects(storage.resolvePendingSubscription(payment.id, action, admin.id));
          assert.deepEqual(await storage.getSubscription(payment.id), payment);
          assert.deepEqual(await storage.getUser(user.id), before);
          assert.equal((await reviews(payment.id)).length, 1);
        } finally {
          await db.delete(paymentReviews).where(eq(paymentReviews.subscriptionId, payment.id));
        }
      }
    });

    await t.test("History is admin-only, explicitly safe, and does not fabricate older reviews", async () => {
      const user = await fixture(new Date(Date.now() + DAY));
      const payment = await pending(user.id);
      assert.deepEqual(await reviews(payment.id), []);
      await assert.rejects(storage.resolvePendingSubscription(payment.id, "approve", user.id), /administrator/);
      assert.deepEqual(await reviews(payment.id), []);
      const response = await fetch(`${base}/api/admin/subscriptions`, { headers: { cookie } });
      assert.equal(response.status, 200);
      const history = await response.json();
      assert.equal(history.find((s: any) => s.id === payment.id).review, null);
      const recorded = history.find((s: any) => s.review);
      assert.ok(recorded);
      assert.deepEqual(Object.keys(recorded.review).sort(), [
        "subscriptionId", "reviewerId", "reviewerName", "outcome", "reviewedAt", "startDate", "endDate", "subscriptionEndsAt",
      ].sort());
      assert.equal("passwordHash" in recorded.user, false);
      assert.equal("googleId" in recorded.user, false);
      assert.equal((await fetch(`${base}/api/admin/subscriptions`)).status, 401);
      const learnerEmail = `audit-access-${randomUUID()}@example.com`;
      const accessLearner = await storage.createUserWithPassword(learnerEmail, "Temporary learner", await bcrypt.hash(password, 10));
      ids.push(accessLearner.id);
      const learnerLogin = await fetch(`${base}/api/auth/login`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: learnerEmail, password }),
      });
      assert.equal(learnerLogin.status, 200);
      const learnerCookie = learnerLogin.headers.get("set-cookie")!.split(";")[0];
      assert.equal((await fetch(`${base}/api/admin/subscriptions`, { headers: { cookie: learnerCookie } })).status, 403);
      assert.equal((await fetch(`${base}/api/admin/payment-reviews/retained`)).status, 401);
      assert.equal((await fetch(`${base}/api/admin/payment-reviews/retained`, { headers: { cookie: learnerCookie } })).status, 403);
    });

    await t.test("Deleted learner reviews remain admin-readable without restoring personal or payment data", async () => {
      const user = await fixture(new Date(Date.now() + DAY));
      const approved = await pending(user.id);
      const rejected = await pending(user.id);
      const unreviewed = await pending(user.id);
      assert.equal((await act(approved.id)).status, 200);
      assert.equal((await act(rejected.id, "reject")).status, 200);
      const events = [...await reviews(approved.id), ...await reviews(rejected.id)];
      const retained = async () => {
        const response = await fetch(`${base}/api/admin/payment-reviews/retained`, { headers: { cookie } });
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("cache-control"), "private, no-store");
        return response.json() as Promise<any[]>;
      };
      assert.equal((await retained()).some(r => [approved.id, rejected.id].includes(r.subscriptionId)), false);
      const deletion = await fetch(`${base}/api/admin/users/${user.id}`, {
        method: "DELETE", headers: { cookie },
      });
      assert.equal(deletion.status, 204);
      ids.splice(ids.indexOf(user.id), 1);
      assert.equal(await storage.getUser(user.id), undefined);
      for (const payment of [approved, rejected, unreviewed]) {
        assert.equal(await storage.getSubscription(payment.id), undefined);
      }
      const entries = await retained();
      for (const event of events) {
        assert.deepEqual(entries.find(r => r.subscriptionId === event.subscriptionId), JSON.parse(JSON.stringify(event)));
      }
      assert.equal(entries.some(r => r.subscriptionId === unreviewed.id), false, "Do not fabricate audit evidence");
      const serialized = JSON.stringify(entries);
      for (const privateValue of [user.id, user.email, approved.transactionId!, rejected.transactionId!]) {
        assert.equal(serialized.includes(privateValue), false);
      }
      const history = await fetch(`${base}/api/admin/subscriptions`, { headers: { cookie } });
      assert.equal(history.status, 200);
      const existing = await history.json();
      assert.equal(existing.some((r: any) => r.id === approved.id || r.id === rejected.id), false);
      assert.ok(existing.some((r: any) => r.review), "Existing history still includes reviews");
    });

    await t.test("Reviewer snapshots survive renaming and permanent administrator deletion", async () => {
      const reviewer = await fixture(null);
      await storage.updateManagedUser(reviewer.id, {
        username: "Original reviewer", isAdmin: true, isPremium: true, subscriptionEndsAt: null,
      });
      const user = await fixture(null);
      const payment = await pending(user.id);
      await storage.resolvePendingSubscription(payment.id, "reject", reviewer.id);
      const [event] = await reviews(payment.id);
      assert.equal(event.reviewerName, "Original reviewer");
      await storage.updateManagedUser(reviewer.id, {
        username: "Renamed reviewer", isAdmin: true, isPremium: true, subscriptionEndsAt: null,
      });
      assert.deepEqual(await reviews(payment.id), [event]);
      await storage.deleteManagedUser(reviewer.id);
      ids.splice(ids.indexOf(reviewer.id), 1);
      assert.deepEqual(await reviews(payment.id), [event]);
      const listed = (await storage.getAllSubscriptions()).find(s => s.id === payment.id);
      assert.deepEqual(listed!.review, event);
    });
  } finally {
    for (const id of paymentIds) await db.delete(paymentReviews).where(eq(paymentReviews.subscriptionId, id));
    for (const id of ids.reverse()) await storage.deleteManagedUser(id);
    await pool.end();
  }
});
