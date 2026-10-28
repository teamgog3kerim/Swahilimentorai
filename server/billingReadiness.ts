import { BILLING_PROVIDER, POLAR_PRODUCT_REQUIREMENTS } from "../shared/subscriptionPlans";
import { polarConfig } from "./polarConfig";

type BillingEnvironment = Record<string, string | undefined>;

// Presence checks only: never return credentials, product IDs or configuration
// values. Populated settings alone must NOT activate unfinished checkout code.
export function billingReadiness(env: BillingEnvironment) {
  const present = (name: string) => Boolean(env[name]?.trim());
  const config = polarConfig(env);
  const checks = [
    { id: "access_token", complete: Boolean(config.accessToken) },
    { id: "webhook_secret", complete: Boolean(config.webhookSecret) },
    { id: "quarterly_product", complete: present("POLAR_QUARTERLY_PRODUCT_ID") },
    { id: "six_month_product", complete: present("POLAR_SEMIANNUAL_PRODUCT_ID") },
    { id: "checkout_implementation", complete: true },
    { id: "verified_webhooks", complete: Boolean(config.webhookSecret) },
    { id: "trusted_origin", complete: Boolean(config.appOrigin) },
    { id: "checkout_activation", complete: config.checkoutAllowed },
  ];
  return {
    provider: BILLING_PROVIDER,
    checkoutEnabled: config.checkoutAllowed && Boolean(config.accessToken && config.webhookSecret &&
      config.appOrigin && present("POLAR_QUARTERLY_PRODUCT_ID") && present("POLAR_SEMIANNUAL_PRODUCT_ID")),
    status: config.environment,
    checks,
    products: POLAR_PRODUCT_REQUIREMENTS,
  };
}
