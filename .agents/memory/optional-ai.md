---
name: Optional AI configuration
description: Keep the imported app usable when its AI integration has not been connected.
---

Missing AI credentials should disable tutoring with an explicit configuration error, not prevent the whole app from starting.

**Why:** Imported projects do not inherit the original project's AI credentials; unrelated features should remain usable without inventing keys or responses.

**How to apply:** Keep AI initialization conditional and report unavailable configuration at the AI endpoint. Preserve the existing provider and model unless asked to change them.
