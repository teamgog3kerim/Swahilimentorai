// Public catalog only. Checkout stays disabled until Polar products and
// verified webhooks are configured; selecting a plan never grants access.
export const SUBSCRIPTION_PLANS = [
  { id: "quarterly", amount: 88, currency: "USD", months: 3 },
  { id: "semiannual", amount: 168, currency: "USD", months: 6 },
] as const;

export const BILLING_PROVIDER = "Polar.sh";
export const CHECKOUT_ENABLED = false;
