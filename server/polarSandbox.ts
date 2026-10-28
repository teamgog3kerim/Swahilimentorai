import type { Express } from "express";
import { Webhook } from "standardwebhooks";
import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { users, subscriptions, polarCheckouts, polarPayments } from "@shared/schema";
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from "@shared/subscriptionPlans";
import { randomUUID } from "node:crypto";

// This release deliberately cannot talk to Polar's live API, even in production.
const API = "https://sandbox-api.polar.sh";
const VERSION = "2026-10";
let validatedAt = 0;
const productId = (plan: SubscriptionPlanId) => process.env[
  plan === "quarterly" ? "POLAR_QUARTERLY_PRODUCT_ID" : "POLAR_SEMIANNUAL_PRODUCT_ID"
]?.trim();

export function sandboxStatus() {
  const configured = process.env.NODE_ENV === "development" &&
    Boolean(process.env.POLAR_ACCESS_TOKEN && productId("quarterly") && productId("semiannual"));
  return {
    environment: "sandbox" as const,
    configured,
    webhookConfigured: Boolean(process.env.POLAR_WEBHOOK_SECRET),
    validated: validatedAt > Date.now() - 300_000,
    checkoutEnabled: configured && Boolean(process.env.POLAR_WEBHOOK_SECRET),
  };
}

export class PolarSetupError extends Error {
  constructor(public code: string, public status = 503) { super(code); }
}

async function polar(path: string, body?: unknown) {
  const response = await fetch(`${API}/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN || ""}`,
      "Polar-Version": VERSION,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(6000),
  });
  // Never log provider bodies or submitted values. Only retain safe error categories.
  if (!response.ok) {
    const failure = await response.json().catch(() => null);
    const validation = Array.isArray(failure?.detail) ? failure.detail.map((item: any) => ({
      field: Array.isArray(item.loc) ? item.loc.filter((part: unknown) =>
        typeof part === "string" && /^[a-z_]+$/.test(part)).join(".") : "",
      type: typeof item.type === "string" && /^[a-z_]+$/.test(item.type) ? item.type : "",
    })) : [];
    console.warn("Polar sandbox request rejected", { status: response.status, validation });
    throw new PolarSetupError(
      response.status === 401 || response.status === 403 ? "POLAR_TOKEN_REJECTED" : "POLAR_REQUEST_FAILED",
    );
  }
  return response.json();
}

export function productMatches(plan: SubscriptionPlanId, product: any) {
  const amount = plan === "quarterly" ? 8800 : 16800;
  const prices = product.prices?.filter((p: any) => !p.is_archived) || [];
  return typeof product.organization_id === "string" && !product.is_archived &&
    product.is_recurring === (plan === "quarterly") &&
    (plan !== "quarterly" || (product.recurring_interval === "month" && product.recurring_interval_count === 3)) &&
    prices.length === 1 && prices[0].amount_type === "fixed" &&
    prices[0].price_currency === "usd" && prices[0].price_amount === amount;
}

export async function validateSandboxProducts() {
  if (!sandboxStatus().configured) throw new PolarSetupError("SANDBOX_NOT_CONFIGURED");
  validatedAt = 0;
  const products = await Promise.all(SUBSCRIPTION_PLANS.map(plan =>
    polar(`products/${encodeURIComponent(productId(plan.id)!)}`)));
  if (!products.every((product, index) =>
    product.id === productId(SUBSCRIPTION_PLANS[index].id) &&
    productMatches(SUBSCRIPTION_PLANS[index].id, product)) ||
    products[0].organization_id !== products[1].organization_id) {
    throw new PolarSetupError("POLAR_PRODUCT_MISMATCH");
  }
  validatedAt = Date.now();
}

export function addCalendarMonths(date: Date, months: number) {
  const result = new Date(date);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const last = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, last));
  return result;
}

function origin() {
  // Trusted platform development setting, not a request-controlled Host header.
  if (!process.env.REPLIT_DEV_DOMAIN) throw new PolarSetupError("SANDBOX_ORIGIN_MISSING");
  return `https://${process.env.REPLIT_DEV_DOMAIN}`;
}

export function safePolarUrl(value: unknown) {
  if (typeof value !== "string") throw new PolarSetupError("POLAR_INVALID_URL");
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password ||
    !["sandbox.polar.sh", "sandbox-buy.polar.sh"].includes(url.hostname)) {
    throw new PolarSetupError("POLAR_INVALID_URL");
  }
  return url.href;
}

// Additive only; never rewrite existing account or payment tables.
export async function ensurePolarSandboxSchema() {
  if (process.env.NODE_ENV !== "development") return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS polar_checkouts (
      id text PRIMARY KEY, reference text NOT NULL UNIQUE,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id text NOT NULL, customer_id text,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS polar_payments (
      order_id text PRIMARY KEY, checkout_id text,
      user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subscription_id text, customer_id text NOT NULL,
      local_subscription_id varchar NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
      baseline_end timestamp, refunded boolean NOT NULL DEFAULT false,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `);
}

const paidOrderSchema = z.object({
  id: z.string().uuid(), paid: z.literal(true), status: z.literal("paid"),
  product_id: z.string().uuid(), customer_id: z.string().uuid(),
  customer: z.object({ external_id: z.string().min(1) }),
  checkout_id: z.string().uuid().nullable(), subscription_id: z.string().uuid().nullable(),
  subtotal_amount: z.number().int(), discount_amount: z.literal(0), currency: z.literal("usd"),
  refunded_amount: z.literal(0),
});

export async function grantPaidOrder(input: unknown) {
  const parsed = paidOrderSchema.safeParse(input);
  if (!parsed.success) throw new PolarSetupError("INVALID_PAID_ORDER", 400);
  const order = parsed.data;
  const plan = SUBSCRIPTION_PLANS.find(p => productId(p.id) === order.product_id);
  if (!plan || order.subtotal_amount !== plan.amount * 100 ||
    (plan.id === "quarterly") !== Boolean(order.subscription_id)) {
    throw new PolarSetupError("INVALID_PAID_ORDER", 400);
  }
  return db.transaction(async tx => {
    const [user] = await tx.select().from(users).where(eq(users.id, order.customer.external_id)).for("update");
    if (!user) return "deleted_user";
    const [existing] = await tx.select().from(polarPayments).where(eq(polarPayments.orderId, order.id));
    if (existing) return "duplicate";
    const [checkout] = order.checkout_id ? await tx.select().from(polarCheckouts)
      .where(eq(polarCheckouts.id, order.checkout_id)) : [];
    const [prior] = order.subscription_id ? await tx.select().from(polarPayments)
      .where(and(eq(polarPayments.subscriptionId, order.subscription_id), eq(polarPayments.userId, user.id)))
      .limit(1) : [];
    if (!(checkout?.userId === user.id && checkout.planId === plan.id) &&
      !(prior?.customerId === order.customer_id && plan.id === "quarterly")) {
      throw new PolarSetupError("UNBOUND_PAYMENT", 400);
    }
    const now = new Date();
    const [active] = await tx.select().from(subscriptions)
      .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")))
      .orderBy(desc(subscriptions.endDate)).limit(1);
    const base = new Date(Math.max(now.getTime(), user.subscriptionEndsAt?.getTime() || 0, active?.endDate.getTime() || 0));
    const end = addCalendarMonths(base, plan.months);
    const [local] = await tx.insert(subscriptions).values({
      userId: user.id, status: "active", planType: plan.id, amount: plan.amount,
      currency: "USD", paymentMethod: "Polar Sandbox", transactionId: `polar-sandbox:${order.id}`,
      startDate: base, endDate: end,
    }).returning();
    await tx.insert(polarPayments).values({
      orderId: order.id, checkoutId: order.checkout_id, userId: user.id, customerId: order.customer_id,
      subscriptionId: order.subscription_id, localSubscriptionId: local.id,
      baselineEnd: user.subscriptionEndsAt,
    });
    // Preserve unlimited administrator-granted access.
    if (!(user.isPremium && user.subscriptionEndsAt === null)) {
      await tx.update(users).set({ isPremium: true, subscriptionEndsAt: end }).where(eq(users.id, user.id));
    }
    return "granted";
  });
}

export function registerPolarSandbox(app: Express, authenticated: any, admin: any) {
  const handleError = (res: any, error: unknown) => {
    const known = error instanceof PolarSetupError;
    res.status(known ? error.status : 503).json({
      code: known ? error.code : "POLAR_UNAVAILABLE",
      message: "Sandbox payment setup is not ready. No access change was made.",
    });
  };
  app.post("/api/admin/billing/validate", authenticated, admin, async (_req, res) => {
    res.set("Cache-Control", "private, no-store");
    try { await validateSandboxProducts(); res.json(sandboxStatus()); }
    catch (error) { handleError(res, error); }
  });
  app.post("/api/subscription/checkout", authenticated, async (req: any, res) => {
    res.set("Cache-Control", "private, no-store");
    const parsed = z.object({
      planId: z.enum(["quarterly", "semiannual"]), locale: z.enum(["en", "zh"]).default("zh"),
    }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ code: "INVALID_PLAN" });
    if (!sandboxStatus().checkoutEnabled) return res.status(503).json({ code: "CHECKOUT_UNAVAILABLE" });
    try {
      await validateSandboxProducts();
      // Avoid accidentally opening two recurring subscriptions for one learner.
      const [prior] = await db.select().from(polarPayments).where(and(
        eq(polarPayments.userId, req.user.id), sql`${polarPayments.subscriptionId} IS NOT NULL`,
      ))
        .orderBy(desc(polarPayments.createdAt)).limit(1);
      if (prior?.subscriptionId && parsed.data.planId === "quarterly") {
        const current = await polar(`subscriptions/${encodeURIComponent(prior.subscriptionId)}`);
        if (["active", "trialing", "past_due", "unpaid"].includes(current.status)) {
          return res.status(409).json({ code: "SUBSCRIPTION_ALREADY_EXISTS" });
        }
      }
      // Reuse an unfinished session rather than creating another recurring checkout.
      const [unfinished] = await db.select().from(polarCheckouts).where(and(
        eq(polarCheckouts.userId, req.user.id), eq(polarCheckouts.planId, parsed.data.planId),
      )).orderBy(desc(polarCheckouts.createdAt)).limit(1);
      if (unfinished && unfinished.createdAt.getTime() > Date.now() - 30 * 60_000) {
        const existing = await polar(`checkouts/${encodeURIComponent(unfinished.id)}`);
        if (existing.status === "open") return res.json({ url: safePolarUrl(existing.url) });
      }
      const reference = randomUUID();
      const result = await polar("checkouts/", {
        products: [productId(parsed.data.planId)],
        external_customer_id: req.user.id,
        customer_email: req.user.email,
        allow_discount_codes: false, allow_trial: false, locale: parsed.data.locale,
        metadata: { app: "afri-panda-sandbox" },
        success_url: `${origin()}/dashboard?tab=subscription&payment=success&reference=${reference}`,
        return_url: `${origin()}/dashboard?tab=subscription&payment=canceled`,
      });
      const url = safePolarUrl(result.url);
      const id = z.string().uuid().parse(result.id);
      await db.insert(polarCheckouts).values({ id, reference, userId: req.user.id, planId: parsed.data.planId });
      res.json({ url });
    } catch (error) { handleError(res, error); }
  });
  app.get("/api/subscription/payment-status", authenticated, async (req: any, res) => {
    res.set("Cache-Control", "private, no-store");
    if (process.env.NODE_ENV !== "development") return res.json({ paid: false, hasCustomer: false });
    const rows = await db.select().from(polarPayments).where(eq(polarPayments.userId, req.user.id));
    const reference = typeof req.query.reference === "string" ? req.query.reference : undefined;
    const [checkout] = reference ? await db.select().from(polarCheckouts).where(and(
      eq(polarCheckouts.reference, reference), eq(polarCheckouts.userId, req.user.id),
    )) : [];
    res.json({
      paid: rows.some(p => !p.refunded && (!reference || p.checkoutId === checkout?.id)),
      hasCustomer: rows.length > 0,
    });
  });
  app.post("/api/subscription/portal", authenticated, async (req: any, res) => {
    res.set("Cache-Control", "private, no-store");
    if (!sandboxStatus().configured) return res.status(503).json({ code: "CHECKOUT_UNAVAILABLE" });
    try {
      const [payment] = await db.select().from(polarPayments).where(eq(polarPayments.userId, req.user.id)).limit(1);
      if (!payment) return res.status(404).json({ code: "NO_POLAR_CUSTOMER" });
      const result = await polar("customer-sessions/", { customer_id: payment.customerId });
      res.json({ url: safePolarUrl(result.customer_portal_url) });
    } catch (error) { handleError(res, error); }
  });
  app.post("/api/webhooks/polar", async (req, res) => {
    res.set("Cache-Control", "no-store");
    if (!sandboxStatus().configured || !process.env.POLAR_WEBHOOK_SECRET) {
      return res.status(503).json({ code: "SANDBOX_WEBHOOK_NOT_CONFIGURED" });
    }
    let event: any;
    try {
      if (!Buffer.isBuffer(req.rawBody)) throw new Error("Missing raw payload");
      event = new Webhook(process.env.POLAR_WEBHOOK_SECRET).verify(req.rawBody.toString("utf8"), {
        "webhook-id": req.header("webhook-id") || "",
        "webhook-timestamp": req.header("webhook-timestamp") || "",
        "webhook-signature": req.header("webhook-signature") || "",
      });
    } catch { return res.status(403).json({ code: "INVALID_WEBHOOK_SIGNATURE" }); }
    try {
      if (event.type === "order.paid") {
        // Retrieve current authoritative state: a delayed event cannot revive a refunded order.
        const id = z.string().uuid().parse(event.data?.id);
        const order = await polar(`orders/${id}`);
        if (order.refunded_amount > 0) return res.status(202).json({ received: true });
        await grantPaidOrder(order);
      } else if (event.type === "order.refunded") {
        const id = z.string().uuid().parse(event.data?.id);
        const order = await polar(`orders/${id}`);
        // Partial refunds do not revoke the entire course pass.
        if (order.refunded_amount > 0 && order.refunded_amount >= order.net_amount) {
          await db.transaction(async tx => {
            const [payment] = await tx.select().from(polarPayments).where(eq(polarPayments.orderId, id));
            if (!payment) return;
            const [user] = await tx.select().from(users).where(eq(users.id, payment.userId)).for("update");
            if (!user) return;
            await tx.update(polarPayments).set({ refunded: true }).where(eq(polarPayments.orderId, id));
            await tx.update(subscriptions).set({ status: "refunded" })
              .where(eq(subscriptions.id, payment.localSubscriptionId));
            const [remaining] = await tx.select().from(subscriptions)
              .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, "active")))
              .orderBy(desc(subscriptions.endDate)).limit(1);
            const [local] = await tx.select().from(subscriptions).where(eq(subscriptions.id, payment.localSubscriptionId));
            // Never overwrite an admin change or erase another paid subscription/trial.
            if (local && user.subscriptionEndsAt?.getTime() === local.endDate.getTime()) {
              const end = new Date(Math.max(payment.baselineEnd?.getTime() || 0, remaining?.endDate.getTime() || 0));
              await tx.update(users).set({ subscriptionEndsAt: end }).where(eq(users.id, user.id));
            }
          });
        }
      }
      // Cancellation/failure events never extend access. Existing paid time expires normally.
      res.status(202).json({ received: true });
    } catch (error) { handleError(res, error); }
  });
}
