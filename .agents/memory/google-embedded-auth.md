---
name: Google sign-in from embedded previews
description: Google authorization must run in a top-level browser tab, not inside the app preview iframe.
---

When the app is embedded, open the app's Google sign-in start route in a separate browser tab. Standalone app visits can use the same tab. Begin with the app route so the OAuth session cookie and state are created in that top-level context.

**Why:** Google's page returned the exact generic “403…you do not have access to this page” inside the preview iframe, while the same authorization request reached the email sign-in form in a top-level tab. This is not an app admin permission failure.

**How to apply:** Preserve PKCE/state/nonce and verified-account checks. Test both embedded login/signup and standalone navigation. Tell embedded users to continue in the new tab after sign-in. The published callback must use the actual deployment domain and be registered in Google Cloud separately from the development callback.

Keep preview OAuth callbacks on the preview origin rather than substituting the published callback to avoid Google's allowlist errors.

**Why:** OAuth state and PKCE are held in the session cookie on the origin where sign-in starts. A callback on another origin cannot safely complete that session. Google's `redirect_uri_mismatch` is distinct from the iframe 403 and requires an exact authorized callback entry on the Google OAuth client.

**How to apply:** Verify the callback actually emitted by the running app, then have the OAuth client owner authorize that exact URI without removing the working published callback. Do not replace secrets or weaken account checks as a workaround.

If the owner confirms the same OAuth client and the exact saved redirect URI, allow for Google's configuration propagation instead of repeatedly asking the same checks or changing credentials.

**Why:** Google's official [Manage OAuth Clients guidance](https://support.google.com/cloud/answer/15549257) says settings changes, including redirect URIs, can take five minutes to a few hours to take effect.

**How to apply:** Compare the app's emitted callback with Google's error details, confirm the saved URI and client identity once, then leave the configuration stable and start a fresh sign-in later. Do not claim Google sign-in works until its sign-in form is reached; completing a real account login still requires the account holder.
