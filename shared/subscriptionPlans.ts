// Public catalog only. Checkout stays disabled until Polar products and
// verified webhooks are configured; selecting a plan never grants access.
export const SUBSCRIPTION_PLANS = [
  { id: "quarterly", amount: 88, currency: "USD", months: 3 },
  { id: "semiannual", amount: 168, currency: "USD", months: 6 },
] as const;

export const BILLING_PROVIDER = "Polar.sh";
export const CHECKOUT_ENABLED = false;

export type SubscriptionPlanId = typeof SUBSCRIPTION_PLANS[number]["id"];

// Trusted product specifications for the later provider integration.
// Amounts sent to a provider use cents, never client-supplied totals.
export const POLAR_PRODUCT_REQUIREMENTS = SUBSCRIPTION_PLANS.map(plan => ({
  planId: plan.id,
  amountCents: plan.amount * 100,
  currency: "usd",
  billingType: plan.id === "quarterly" ? "recurring" : "one_time",
  recurringInterval: plan.id === "quarterly" ? "month" : null,
  recurringIntervalCount: plan.id === "quarterly" ? 3 : null,
  accessMonths: plan.months,
}));
