---
name: Webhook preview protection
description: Replit preview protection can redirect provider webhooks even when agent connectivity checks pass.
---

A provider webhook redirected to Replit's `__replshield` has not reached the app.
Do not change signature verification or grant access from a checkout return to
compensate. A successful workspace or agent request does not prove the provider
can reach the same development URL.

**Why:** Polar deliveries received HTTP 307 from preview protection while direct
agent requests reached the handler. The actual delivery's redirect destination,
not a repeated local connectivity test, identified the blocker.

**How to apply:** Inspect the delivery's response Location without retaining
query parameters. Use documented Development external access tokens for private
preview API traffic where available. Do not change a public production site's
privacy to obtain token controls without the user's informed consent. Keep
provider signature verification enabled and retry the existing event, not payment.
