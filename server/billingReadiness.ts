import { BILLING_PROVIDER, POLAR_PRODUCT_REQUIREMENTS } from "../shared/subscriptionPlans";

type BillingEnvironment = Record<string, string | undefined>;

// Presence checks only: never return credentials, product IDs or configuration
// values. Populated settings alone must NOT activate unfinished checkout code.
export function billingReadiness(env: BillingEnvironment) {
  const present = (name: string) => Boolean(env[name]?.trim());
  const checks = [
    { id: "access_token", complete: present("POLAR_ACCESS_TOKEN") },
    { id: "webhook_secret", complete: present("POLAR_WEBHOOK_SECRET") },
    { id: "quarterly_product", complete: present("POLAR_QUARTERLY_PRODUCT_ID") },
    { id: "six_month_product", complete: present("POLAR_SEMIANNUAL_PRODUCT_ID") },
    { id: "checkout_implementation", complete: false },
    { id: "verified_webhooks", complete: false },
    { id: "sandbox_payment_test", complete: false },
  ];
  return {
    provider: BILLING_PROVIDER,
    checkoutEnabled: false,
    status: "not_connected",
    checks,
    products: POLAR_PRODUCT_REQUIREMENTS,
  };
}
