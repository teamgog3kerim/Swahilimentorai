import { test } from "node:test";
import assert from "node:assert/strict";
import { billingReadiness } from "../billingReadiness";
import { POLAR_PRODUCT_REQUIREMENTS } from "../../shared/subscriptionPlans";

test("Polar catalog has exact USD cent amounts and explicit recurring versus one-time terms", () => {
  assert.deepEqual(POLAR_PRODUCT_REQUIREMENTS, [
    { planId: "quarterly", amountCents: 8800, currency: "usd", billingType: "recurring",
      recurringInterval: "month", recurringIntervalCount: 3, accessMonths: 3 },
    { planId: "semiannual", amountCents: 16800, currency: "usd", billingType: "one_time",
      recurringInterval: null, recurringIntervalCount: null, accessMonths: 6 },
  ]);
});

test("Readiness never exposes configuration values and distinguishes implementation from verification", () => {
  const env = {
    NODE_ENV: "production",
    POLAR_LIVE_ENABLED: "false",
    POLAR_APP_URL: "https://billing.example.test",
    POLAR_LIVE_ACCESS_TOKEN: "test-access-value",
    POLAR_LIVE_WEBHOOK_SECRET: "test-signature-value",
    POLAR_QUARTERLY_PRODUCT_ID: "test-quarter-product",
    POLAR_SEMIANNUAL_PRODUCT_ID: "test-six-month-product",
  };
  const result = billingReadiness(env);
  assert.equal(result.checkoutEnabled, false);
  assert.equal(result.status, "live");
  assert.ok(result.checks.slice(0, 4).every(check => check.complete));
  assert.equal(result.checks.find(check => check.id === "checkout_implementation")?.complete, true);
  assert.equal(result.checks.find(check => check.id === "checkout_activation")?.complete, false);
  for (const value of [env.POLAR_LIVE_ACCESS_TOKEN, env.POLAR_LIVE_WEBHOOK_SECRET,
    env.POLAR_QUARTERLY_PRODUCT_ID, env.POLAR_SEMIANNUAL_PRODUCT_ID, env.POLAR_APP_URL]) {
    assert.equal(JSON.stringify(result).includes(value), false);
  }
  assert.equal(billingReadiness({ ...env, POLAR_LIVE_ENABLED: "true" }).checkoutEnabled, true);
  assert.ok(billingReadiness({ POLAR_ACCESS_TOKEN: "  " }).checks
    .filter(check => check.id !== "checkout_implementation").every(check => !check.complete));
});
