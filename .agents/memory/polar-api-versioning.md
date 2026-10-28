---
name: Polar API versioning
description: The documented versioned SDK may be ahead of the package registry; verify before changing the payment client.
---

Check the installed SDK's actual exports against current Polar documentation.
The stable package resolved to an older API while the docs recommended a newer
versioned import that it did not export.

**Why:** Copying the documented import without checking the installed package
would prevent the server from starting. The documented REST API and Standard
Webhooks library were used instead, with the API version pinned explicitly.

**How to apply:** When upgrading billing, inspect actual available package exports
and align API requests and webhook endpoint versions. Newly generated webhook
secrets use Standard Webhooks; do not reuse an older secret's HMAC recipe.
