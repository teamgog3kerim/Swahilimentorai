---
name: Offline cache privacy
description: Why private APIs must bypass the offline cache and cache-policy updates must purge old entries.
---

Keep account-specific APIs network-only. Offline caching is limited to shared curriculum and app assets. Rotate cache names when changing privacy policy so prior cached private records are removed.

**Why:** Cache Storage is shared across accounts within an origin, not scoped to the login session. The original cache-first policy retained old progress and admin data, so successful saves did not appear and switching accounts could reuse another account's responses.

**How to apply:** Treat auth, progress, chat, subscription and administration responses as private. Verify updates in a real browser with the service worker enabled, not just through API tests; confirm these URLs are absent from Cache Storage.
