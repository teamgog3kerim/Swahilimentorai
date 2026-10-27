---
name: Optional AI configuration
description: Keep the imported app usable when its AI integration has not been connected.
---

Missing AI credentials should disable live tutoring with an explicit unavailable state, not prevent startup or core guided practice in either course.

**Why:** Imported projects do not inherit the original project's AI credentials. The app must still be usable for learning without making a paid AI connection a prerequisite; never invent keys or tutor responses.

**How to apply:** Keep AI initialization conditional, make guided exercises available independently, and show a clear unavailable state before users enter a nonfunctional live-tutoring flow. Still report unavailable configuration at the AI endpoint. Preserve the existing provider and model unless asked to change them.
