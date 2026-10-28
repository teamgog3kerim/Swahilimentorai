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
not a repeated local connectivity test, identified the blocker. Making the
preview public did not resolve the provider's redirect in this project.

**How to apply:** Inspect the delivery's response Location without retaining
query parameters. Use documented Development external access tokens for private
preview API traffic where available. Do not change a public production site's
privacy to obtain token controls without the user's informed consent. Keep
provider signature verification enabled and retry the existing event, not payment.
Do not keep retrying privacy changes if the provider still receives a redirect;
use an authenticated forwarding mechanism or an isolated published test receiver.

Polar CLI uses an organization-derived development signing key, not the private
dashboard endpoint key. Never accept that development key at a public webhook
endpoint or in production; keep the CLI receiver loopback-only and retain
authoritative provider-order verification.

**Why:** Treating the CLI key as an additional public signing secret weakens the
trust boundary. Forwarding is for local sandbox verification, not live delivery.

**How to apply:** Keep both signature checks. The CLI stream forwards new events,
not historical failed HTTP deliveries. Recover an existing sandbox payment by
triggering its existing paid order ID, with the app retrieving the real provider
order; do not ask the user to pay again merely to obtain a webhook.
