import { test } from "node:test";
import assert from "node:assert/strict";
import { polarConfig } from "../polarConfig";
import { polarRedirectUrl } from "../../shared/polarUrls";

test("Production and preview credentials, origins and activation are isolated", () => {
  const env = {
    NODE_ENV: "development", POLAR_ACCESS_TOKEN: "dummy-sandbox", POLAR_WEBHOOK_SECRET: "dummy-sandbox-key",
    POLAR_LIVE_ACCESS_TOKEN: "dummy-live", POLAR_LIVE_WEBHOOK_SECRET: "dummy-live-key",
    REPLIT_DEV_DOMAIN: "preview.replit.dev", POLAR_APP_URL: "https://afri-panda.example.test",
    POLAR_LIVE_ENABLED: "true",
  };
  const preview = polarConfig(env);
  assert.equal(preview.environment, "sandbox");
  assert.equal(preview.accessToken, "dummy-sandbox");
  assert.equal(preview.webhookSecret, "dummy-sandbox-key");
  assert.equal(preview.appOrigin, "https://preview.replit.dev");
  const live = polarConfig({ ...env, NODE_ENV: "production" });
  assert.equal(live.environment, "live");
  assert.equal(live.api, "https://api.polar.sh");
  assert.equal(live.accessToken, "dummy-live");
  assert.equal(live.webhookSecret, "dummy-live-key");
  assert.equal(live.appOrigin, "https://afri-panda.example.test");
  assert.equal(live.checkoutAllowed, true);
  assert.equal(polarConfig({ ...env, NODE_ENV: "production", POLAR_LIVE_ENABLED: "false" }).checkoutAllowed, false);
  assert.equal(polarConfig({ ...env, NODE_ENV: "production", POLAR_LIVE_ACCESS_TOKEN: undefined }).accessToken, undefined);
  assert.equal(polarConfig({ ...env, NODE_ENV: "production", POLAR_LIVE_WEBHOOK_SECRET: undefined }).webhookSecret, undefined);
  assert.equal(polarConfig({ ...env, NODE_ENV: "test" }).accessToken, undefined);
  for (const bad of ["http://afri-panda.example.test", "https://preview.replit.dev",
    "https://user:pass@afri-panda.example.test", "https://afri-panda.example.test/path",
    "https://afri-panda.example.test?other=1"]) {
    assert.equal(polarConfig({ ...env, NODE_ENV: "production", POLAR_APP_URL: bad }).appOrigin, undefined);
  }
});

test("Checkout and portal URLs are restricted to the exact active Polar hosts", () => {
  for (const host of ["polar.sh", "buy.polar.sh"]) {
    assert.ok(polarRedirectUrl(`https://${host}/checkout/test`, "live"));
    assert.equal(polarRedirectUrl(`https://${host}/checkout/test`, "sandbox"), null);
  }
  for (const host of ["sandbox.polar.sh", "sandbox-buy.polar.sh"]) {
    assert.ok(polarRedirectUrl(`https://${host}/checkout/test`, "sandbox"));
    assert.equal(polarRedirectUrl(`https://${host}/checkout/test`, "live"), null);
  }
  for (const url of ["javascript:alert(1)", "https://polar.sh.evil.test/pay", "https://polar.sh@evil.test",
    "https://user:pass@polar.sh/pay", "http://buy.polar.sh/pay", "https://polar.sh:444/pay",
    "https://evil.polar.sh/pay", "not a url"]) {
    assert.equal(polarRedirectUrl(url, "live"), null);
  }
});
