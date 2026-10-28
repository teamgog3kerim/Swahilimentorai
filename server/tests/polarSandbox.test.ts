import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import express from "express";
import { Webhook } from "standardwebhooks";
import { eq } from "drizzle-orm";
import {
  addCalendarMonths, productMatches, safePolarUrl, sandboxStatus,
  ensurePolarSandboxSchema, registerPolarSandbox,
} from "../polarSandbox";
import { db, pool } from "../db";
import { users, polarPayments } from "../../shared/schema";
import { storage } from "../storage";

test("Sandbox URL restrictions, calendar terms and exact product specifications", () => {
  assert.equal(addCalendarMonths(new Date("2026-08-31T12:00:00Z"), 6).toISOString(), "2027-02-28T12:00:00.000Z");
  assert.throws(() => safePolarUrl("https://evil.test/checkout"));
  assert.throws(() => safePolarUrl("https://sandbox.polar.sh@evil.test"));
  assert.throws(() => safePolarUrl("http://sandbox.polar.sh"));
  assert.ok(safePolarUrl("https://sandbox.polar.sh/checkout/test"));
  const product = { organization_id: randomUUID(), is_archived: false, is_recurring: true,
    recurring_interval: "month", recurring_interval_count: 3,
    prices: [{ amount_type: "fixed", price_currency: "usd", price_amount: 8800 }] };
  assert.equal(productMatches("quarterly", product), true);
  assert.equal(productMatches("quarterly", { ...product, recurring_interval_count: 1 }), false);
  assert.equal(productMatches("semiannual", product), false);
  assert.equal(productMatches("quarterly", { ...product, prices: [{ ...product.prices[0], price_amount: 1 }] }), false);
});

test("Sandbox checkout, signed payment, duplicate delivery, renewals, ownership and refunds", {
  skip: process.env.RUN_POLAR_TESTS !== "1", timeout: 60_000,
}, async () => {
  // Run this test with a dummy token supplied by the shell, never a real credential.
  assert.equal(process.env.POLAR_ACCESS_TOKEN, "local-test-placeholder");
  process.env.NODE_ENV = "development";
  const quarterly = randomUUID(), semester = randomUUID(), organization = randomUUID();
  process.env.POLAR_QUARTERLY_PRODUCT_ID = quarterly;
  process.env.POLAR_SEMIANNUAL_PRODUCT_ID = semester;
  const secret = `whsec_${randomBytes(32).toString("base64")}`;
  process.env.POLAR_WEBHOOK_SECRET = secret;
  await ensurePolarSandboxSchema();
  const realFetch = globalThis.fetch;
  let checkoutId = randomUUID(), customerId = randomUUID();
  let lastCheckoutBody: any;
  const orders = new Map<string, any>();
  globalThis.fetch = (async (url: any, options: any) => {
    if (!String(url).startsWith("https://sandbox-api.polar.sh/")) return realFetch(url, options);
    const path = new URL(String(url)).pathname;
    if (path.includes("/products/")) {
      const recurring = path.endsWith(quarterly);
      return Response.json({ id: recurring ? quarterly : semester, organization_id: organization,
        is_recurring: recurring, is_archived: false, recurring_interval: recurring ? "month" : null,
        recurring_interval_count: recurring ? 3 : null,
        prices: [{ amount_type: "fixed", price_currency: "usd", price_amount: recurring ? 8800 : 16800 }] });
    }
    if (path === "/v1/checkouts/") {
      lastCheckoutBody = JSON.parse(options.body);
      return Response.json({ id: checkoutId, url: `https://sandbox.polar.sh/checkout/${checkoutId}` });
    }
    if (path.includes("/checkouts/")) return Response.json({ status: "expired" });
    if (path.includes("/orders/")) return Response.json(orders.get(path.split("/").pop()!));
    if (path.includes("/subscriptions/")) return Response.json({ status: "active" });
    if (path === "/v1/customer-sessions/") return Response.json({ customer_portal_url: "https://sandbox.polar.sh/portal/test" });
    throw new Error("Unexpected provider request");
  }) as typeof fetch;
  const app = express();
  app.use(express.json({ verify: (req, _res, buffer) => { req.rawBody = buffer; } }));
  app.use(async (req: any, _res, next) => {
    req.user = req.header("x-test-user") ? await storage.getUser(req.header("x-test-user")) : undefined;
    next();
  });
  const authenticated = (req: any, res: any, next: any) => req.user ? next() : res.sendStatus(401);
  const admin = (req: any, res: any, next: any) => req.user?.isAdmin ? next() : res.sendStatus(403);
  registerPolarSandbox(app, authenticated, admin);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const port = (server.address() as any).port;
  const ids: string[] = [];
  const learner = await storage.createUser({
    email: `polar-local-${randomUUID()}@example.com`, username: "Temporary billing test",
    isPremium: true, subscriptionEndsAt: new Date(Date.now() + 88 * 3600000),
  });
  ids.push(learner.id);
  const other = await storage.createUser({ email: `polar-local-${randomUUID()}@example.com`, username: "Other test" });
  ids.push(other.id);
  const call = (path: string, body?: any, user = learner.id, headers: any = {}) => realFetch(`http://127.0.0.1:${port}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", ...(user ? { "x-test-user": user } : {}), ...headers },
    body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
  });
  const event = (type: string, orderId: string, valid = true) => {
    const payload = JSON.stringify({ type, data: { id: orderId } });
    const id = randomUUID(), time = new Date();
    return call("/api/webhooks/polar", payload, "", {
      "webhook-id": id, "webhook-timestamp": `${Math.floor(time.getTime() / 1000)}`,
      "webhook-signature": valid ? new Webhook(secret).sign(id, time, payload) : "v1,invalid",
    });
  };
  try {
    assert.equal((await call("/api/subscription/checkout", { planId: "quarterly" }, "")).status, 401);
    assert.equal((await call("/api/admin/billing/validate", {})).status, 403);
    for (const extra of [{ amount: 1 }, { userId: other.id }, { productId: semester }, { successUrl: "https://evil.test" }]) {
      assert.equal((await call("/api/subscription/checkout", { planId: "semiannual", ...extra })).status, 400);
    }
    assert.equal((await call("/api/subscription/checkout", { planId: "semiannual", locale: "zh" })).status, 200);
    assert.equal(lastCheckoutBody.external_customer_id, learner.id);
    assert.equal(lastCheckoutBody.products[0], semester);
    assert.equal(lastCheckoutBody.allow_trial, false);
    assert.equal(lastCheckoutBody.allow_discount_codes, false);
    const reference = new URL(lastCheckoutBody.success_url).searchParams.get("reference");
    const before = (await storage.getUser(learner.id))!.subscriptionEndsAt!;
    const id = randomUUID();
    const paid = { id, status: "paid", paid: true, product_id: semester, customer_id: customerId,
      customer: { external_id: learner.id }, checkout_id: checkoutId, subscription_id: null,
      subtotal_amount: 16800, discount_amount: 0, currency: "usd", refunded_amount: 0, net_amount: 16800 };
    orders.set(id, paid);
    assert.equal((await event("order.paid", id, false)).status, 403);
    assert.equal((await storage.getUser(learner.id))!.subscriptionEndsAt!.getTime(), before.getTime());
    assert.equal((await event("order.paid", id)).status, 202);
    const after = (await storage.getUser(learner.id))!.subscriptionEndsAt!;
    assert.equal(after.toISOString(), addCalendarMonths(before, 6).toISOString());
    await Promise.all([event("order.paid", id), event("order.paid", id)]);
    assert.equal((await storage.getUser(learner.id))!.subscriptionEndsAt!.getTime(), after.getTime());
    assert.equal((await db.select().from(polarPayments).where(eq(polarPayments.userId, learner.id))).length, 1);
    const status = await (await call(`/api/subscription/payment-status?reference=${reference}`)).json();
    assert.deepEqual(status, { paid: true, hasCustomer: true });
    assert.equal((await (await call(`/api/subscription/payment-status?reference=${reference}`, undefined, other.id)).json()).paid, false);
    assert.equal((await (await call("/api/subscription/payment-status?reference=wrong")).json()).paid, false);
    assert.equal((await call("/api/subscription/portal", {})).status, 200);
    const wrong = randomUUID();
    orders.set(wrong, { ...paid, id: wrong, subtotal_amount: 1 });
    assert.equal((await event("order.paid", wrong)).status, 400);
    orders.set(wrong, { ...paid, id: wrong, customer: { external_id: other.id } });
    assert.equal((await event("order.paid", wrong)).status, 400);
    // Refund preserves the exact outstanding trial. Delayed paid events cannot revive it.
    orders.set(id, { ...paid, refunded_amount: 16800 });
    assert.equal((await event("order.refunded", id)).status, 202);
    assert.equal((await storage.getUser(learner.id))!.subscriptionEndsAt!.getTime(), before.getTime());
    assert.equal((await event("order.paid", id)).status, 202);
    assert.equal((await storage.getUser(learner.id))!.subscriptionEndsAt!.getTime(), before.getTime());
    // Quarterly first payment + renewal without checkout ID are both account-bound.
    checkoutId = randomUUID();
    assert.equal((await call("/api/subscription/checkout", { planId: "quarterly", locale: "en" })).status, 200);
    const subscriptionId = randomUUID(), quarterOrder = randomUUID();
    orders.set(quarterOrder, { ...paid, id: quarterOrder, product_id: quarterly,
      subscription_id: subscriptionId, checkout_id: checkoutId, subtotal_amount: 8800, net_amount: 8800 });
    assert.equal((await event("order.paid", quarterOrder)).status, 202);
    const firstEnd = (await storage.getUser(learner.id))!.subscriptionEndsAt!;
    const renewal = randomUUID();
    orders.set(renewal, { ...orders.get(quarterOrder), id: renewal, checkout_id: null });
    assert.equal((await event("order.paid", renewal)).status, 202);
    assert.equal((await storage.getUser(learner.id))!.subscriptionEndsAt!.toISOString(), addCalendarMonths(firstEnd, 3).toISOString());
    assert.equal((await call("/api/subscription/checkout", { planId: "quarterly" })).status, 409);
    const unchanged = (await storage.getUser(learner.id))!.subscriptionEndsAt!.getTime();
    assert.equal((await event("subscription.canceled", subscriptionId)).status, 202);
    assert.equal((await storage.getUser(learner.id))!.subscriptionEndsAt!.getTime(), unchanged);
    process.env.NODE_ENV = "production";
    assert.equal(sandboxStatus().checkoutEnabled, false);
    assert.equal((await call("/api/subscription/checkout", { planId: "semiannual" })).status, 503);
  } finally {
    globalThis.fetch = realFetch;
    for (const id of ids) await storage.deleteManagedUser(id);
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await pool.end();
  }
});
