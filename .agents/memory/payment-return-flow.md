---
name: Verified payment return flow
description: Post-checkout navigation must wait for server-side payment confirmation.
---

After Polar checkout, keep the learner on the confirmation screen until the
server verifies payment; then send them to language selection. A return URL by
itself never grants course access.

**Why:** The user chose course selection after confirmation, and webhook
processing can lag behind checkout return.

**How to apply:** Preserve pending/manual-check behavior when verification has
not succeeded; only navigate to learning after the payment-status API confirms.
