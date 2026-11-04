---
name: Billing environment boundaries
description: Why live payments stay separate from preview and how to verify live setup without charging the owner.
---

Keep development preview sandbox-only even when live credentials are available.
Live payment changes take effect through publishing, not by changing the
preview's payment mode.

**Why:** Preview is used for owner walkthroughs and sandbox webhook forwarding.
Allowing it to select live credentials could turn an ordinary test checkout into
a real charge. The two environments also have different webhook reachability.

**How to apply:** Preserve separate credentials and provider bindings. Verify live
configuration with read-only product checks and mocked payment-flow tests.
After publishing, verify delivery with a signed non-payment lifecycle event.
Do not create a real charge or credit a fabricated paid order as a smoke test.

Keep payment-provider names out of learner-facing pages. Use “Pay and subscribe”
in English and equivalent Chinese wording; provider names may remain in admin diagnostics.

**Why:** The user requested provider-neutral payment wording on user pages.

**How to apply:** Preserve the provider integration and hosted checkout; change
the app's learner-facing copy rather than renaming technical configuration.

The published primary domain is `https://ethiopanda.com`; the development
preview remains on its separate Replit hostname.

**Why:** The user designated this custom domain for the public Afri Panda app.

**How to apply:** Keep production OAuth and Polar return/webhook URLs on the
custom domain. Preserve Replit preview callbacks and sandbox configuration.
