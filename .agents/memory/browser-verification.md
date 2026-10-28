---
name: Browser verification availability
description: How to handle an unavailable browser-testing helper without skipping signed-in verification.
---

The specialized testing helper has returned `Unknown config kind: testing` in this workspace. If that happens again, run the existing Playwright tests directly rather than leaving protected screens unverified.

**Why:** The trial-expiry flow required signed-in browser checks; direct Playwright execution verified expiry, course gating, subscriptions and access restoration when the helper was unavailable.

**How to apply:** Treat helper availability as environment-specific, not a reason to bypass authentication or to skip verification. Use temporary test accounts and remove them afterward.

For tests that inject network failures with Playwright routing, create the
browser context with `serviceWorkers: "block"`. Test the actual service worker
separately rather than disabling it in the app.

**Why:** A controlling worker can make its own requests outside page routing,
so a simulated API outage may never reach the UI and a retry assertion times
out even though the real error handler works.

**How to apply:** Use this only for network-interception tests; keep dedicated
offline/update tests running with the worker enabled.
