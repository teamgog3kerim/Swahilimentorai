---
name: Locale browser audits
description: Distinguish native teaching content and previous-action notifications from untranslated interface text.
---

Do not exempt entire lessons or stories from English-interface checks merely because they contain language-learning content. Native Amharic and Swahili phrases are intentional; Chinese interface subtitles in English mode are not.

**Why:** An English-only dictionary check cannot catch a component selecting the wrong locale field from lesson data. Broad teaching-content exemptions would hide that failure.

**How to apply:** Audit rendered text and accessible labels alongside dictionary checks, exempting only the language-switch control. Dismiss notifications created before switching locales before auditing the new locale: existing notifications are snapshots of the original action, not freshly rendered translation keys.

Avoid assigning named helper functions inside Playwright evaluation callbacks run through tsx.

**Why:** tsx's function-name preservation can insert a `__name` helper that is not present in the browser execution environment.

**How to apply:** Keep browser-evaluated audit code self-contained, without referencing transform-injected helpers or Node-side closures.
