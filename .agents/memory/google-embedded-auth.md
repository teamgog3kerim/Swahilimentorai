---
name: Google sign-in from embedded previews
description: Google authorization must run in a top-level browser tab, not inside the app preview iframe.
---

When the app is embedded, open the app's Google sign-in start route in a separate browser tab. Standalone app visits can use the same tab. Begin with the app route so the OAuth session cookie and state are created in that top-level context.

**Why:** Google's page returned the exact generic “403…you do not have access to this page” inside the preview iframe, while the same authorization request reached the email sign-in form in a top-level tab. This is not an app admin permission failure.

**How to apply:** Preserve PKCE/state/nonce and verified-account checks. Test both embedded login/signup and standalone navigation. Tell embedded users to continue in the new tab after sign-in. The published callback must use the actual deployment domain and be registered in Google Cloud separately from the development callback.
