---
name: Offline cache privacy
description: Why private APIs must bypass the offline cache and cache-policy updates must purge old entries.
---

Keep account-specific APIs network-only. Offline caching is limited to shared curriculum and app assets. Rotate cache names when changing privacy policy so prior cached private records are removed.

**Why:** Cache Storage is shared across accounts within an origin, not scoped to the login session. The original cache-first policy retained old progress and admin data, so successful saves did not appear and switching accounts could reuse another account's responses.

**How to apply:** Treat auth, progress, chat, subscription and administration responses as private. Verify updates in a real browser with the service worker enabled, not just through API tests; confirm these URLs are absent from Cache Storage.

Service-worker updates must not force a page reload or use blocking browser dialogs. Let learners refresh or reopen the app when ready; first installation must not interrupt the page either.

**Why:** The Chinese browser confirmation was mistaken for an app error, and automatic reloads can discard lesson state or unsent chat drafts.

**How to apply:** Keep background update activation separate from page navigation, and preserve the current page until the learner chooses to refresh or revisit.
