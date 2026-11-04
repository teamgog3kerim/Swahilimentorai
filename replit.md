# Ethio Panda

## Overview
**Ethio Panda** is an African language learning platform for Chinese- and English-speaking learners, with Amharic and Swahili courses. Its user-selected slogan is **“the African languages Academy for Chinese people”**. Keep the name and this English slogan consistent in both interfaces. The interface defaults to Simplified Chinese, with optional English saved in the browser. Guided lessons, conversations and self-checks work independently of optional live AI. The platform also supports progress tracking and USD subscription plans; Polar checkout is currently sandbox-only, not live.

## User Preferences
Preferred communication style: Simple, everyday language.
Chinese is the primary/default interface. English is optional and should only be enabled when a user selects it; keep their selection saved for later visits.
For Chinese users, pronunciation aids must use Chinese characters rather than Latin spellings throughout the app, explicitly including the practice page, role-play, quick replies and both language courses. Keep native learning-language text visible (Swahili itself uses Latin spelling) and retain Latin transliteration in English mode. Chinese sound approximations are memory aids, not exact phonetic transcriptions. Chinese AI tutor instructions must request Chinese-character reading aids, not Latin transliteration.
Learner stories must represent Amharic learners as well as Swahili learners. Do not present illustrative stories as verified customer testimonials.
For landing-hero refinements, keep the existing image and signup/pricing/share buttons unchanged. Use compact, balanced spacing and clearly present Amharic and Swahili as two major African languages offered by the academy.

Keep the footer panda in the app's purple theme with a graduation cap and continuous gentle panda/cap animation after scroll reveal. Preserve bilingual greetings and reduced-motion support. Do not show a pause/resume animation button; the user explicitly requested its removal.

New email and Google accounts receive an 88-hour free trial starting at registration. After expiry, learners must obtain a paid subscription to continue courses and practice; keep their progress. Never charge automatically at trial expiry, restart a trial on login or plan selection, or grant paid access before verified payment. Preserve already-issued access deadlines and administrator access.

## System Architecture

### Frontend
The frontend is built with React 18+ (TypeScript, Vite), utilizing Radix UI primitives and shadcn/ui components with Tailwind CSS for styling. Wouter handles client-side routing, distinguishing between a marketing landing page and the authenticated user dashboard. State management is powered by TanStack Query for server state and a custom `useAuth` hook for authentication. The design system emphasizes mobile-first responsiveness, featuring Inter and Noto Sans SC fonts, a custom theme with light/dark modes, and consistent spacing and color systems. Key pages include Learn, Practice, Progress, and Subscription.

### Backend
The backend uses Express.js (Node.js, TypeScript) with a RESTful API. Authentication supports existing email/password accounts via Passport.js Local and verified Gmail accounts via Google OpenID Connect. Sessions use `express-session` and a PostgreSQL store. AI integration leverages Replit's AI Integrations service for OpenAI's GPT-5 model for conversational tutoring. Data interactions use Drizzle ORM.

### Google sign-in and application owner
- Configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` through Secrets. Set `GOOGLE_CALLBACK_URL` to the exact HTTPS URL ending in `/api/auth/google/callback`, and register it in the Google Cloud web OAuth client. Development has its own callback; configure the published app's callback separately in Production.
- Missing Google configuration must not stop email/password or other app features. Google sign-in is visibly disabled until configured.
- Google rejects OAuth inside preview iframes with a generic 403. Embedded login, signup, and account-link buttons must open the app's OAuth start route in a new top-level tab, with `noopener,noreferrer`. Standalone visits can sign in in the same tab. Users continue in that tab after signing in.
- `APP_OWNER_EMAIL` reserves the owner account. Its full administrator access is established only after a verified Gmail sign-in. Local password registration/login must not grant access to the reserved owner address.
- Preserve existing accounts and their learning data. Ordinary existing accounts require password sign-in followed by “Connect Google account” in the dashboard before Google can be linked. This prevents silent linking to unverified, self-registered email identities.
- A pre-existing local owner account is recovered through verified Google ownership, removing its old password and sessions to prevent a previously claimed email from retaining admin access.
- Admin user controls allow name, role, and membership changes, plus permanent deletion with explicit email confirmation. Server-side checks protect the owner and prevent self-deletion/self-demotion. Do not return password hashes or Google subject IDs from management APIs.

Authentication checks: `node --import tsx --test server/tests/accountPolicy.test.ts`. Development database integration checks: `RUN_DB_TESTS=1 node --import tsx --test server/tests/googleAccounts.test.ts` (temporary test accounts are removed afterwards).

OAuth navigation regression: `RUN_BROWSER_TESTS=1 node --import tsx --test server/tests/googleSignInBrowser.test.ts`. It verifies embedded login/signup reach Google's sign-in form in a separate tab and standalone login stays in-tab, without entering Google credentials.

### Curriculum and browser verification
- Startup initializes the supplied 90-lesson Swahili curriculum only when that track is empty, and adds missing Amharic lessons independently. Initialization is serialized and never replaces existing lessons or learner progress.
- Lesson detail screens let learners mark lessons complete or incomplete, with progress saved to their account.
- Private API responses must bypass the service worker cache. Only shared lessons and app assets are eligible for offline caching.
- Run the signed-in browser journey with `RUN_BROWSER_TESTS=1 node --import tsx --test server/tests/appBrowser.test.ts`. It uses temporary accounts, removes them afterwards, and checks Chinese-first defaults, English persistence, progress saves, admin management, logout/login, and mobile layout. `TEST_CHROMIUM_PATH` can override the browser executable.
- AI tutoring requires its integration configuration. Newsletter subscription and the guide/blog/legal content pages are not implemented; do not present them as functional.

### Amharic and Swahili learning tracks
- The product supports Chinese- and English-speaking learners choosing either Amharic or Swahili. Chinese stays the default interface; the target language is a separate choice, not inferred from interface language.
- Every new signed-in dashboard mount presents a course chooser. Learners can switch tracks at any time. Do not silently inherit another user's browser-wide course preference.
- The supplied Amharic foundation has 31 lessons: 33 seven-order Fidel families (231 characters), 39 additional labialized syllables, 8 vocabulary lessons, 3 number lessons, and 12 practical conversation lessons. Every explanation, definition and quiz has Chinese and English versions, with native script and approximate Latin transliteration.
- Amharic flashcards, self-checks and scripted role-play work without AI credentials. Pronunciation uses a matching device voice only, with an explicit unavailable state otherwise; never substitute English TTS for Amharic. No prerecorded native audio or speech-recognition scoring is claimed.
- Guided practice also supports Swahili, using existing bilingual vocabulary for self-checks and the supplied dialogues for role-play. Live AI is an optional mode, unavailable until configured; unavailable services must not block course use.
- Imported Swahili grammar is displayed bilingually. Read-time curriculum adapters correct known legacy clock/word-spacing mistakes and complete the 1–20 number lesson without rewriting stored lessons or progress; the same adapters apply to downloaded content.
- Lesson, flashcard, letter, quiz and role-play navigation is bounded and bilingual. Moving to another lesson does not mark it complete. End-of-dialogue restart must be explicit.
- Full navigation/rendering check: `RUN_BROWSER_TESTS=1 node --import tsx --test server/tests/courseNavigationBrowser.test.ts`. It visits all 121 lessons, checks navigation and mobile layout, and verifies recoverable AI failure behavior without calling a paid service.
- Translation release checks: `npm run check:i18n` rejects duplicate dictionary keys (before JSON parsing), empty/Chinese English values, missing literal English keys and unchecked dynamic `t()` calls, with source locations. Translate literals where data is defined instead of passing arbitrary fields to `t()`. `npm run build` always runs these checks first.
- Bilingual browser gate: `npm run test:i18n:browser` requires the running development app and `REPLIT_DEV_DOMAIN` (optional `TEST_CHROMIUM_PATH`). It creates and removes temporary learner accounts, checks public/auth/chooser/lesson/practice/progress/payment/sharing flows in both locales, audits all 121 lessons in English, and verifies Chinese-default and saved language behavior. English audits include visible text and accessible labels; native teaching phrases remain valid, and only the exact language-switch control is exempt from the Chinese-text audit. Old toast messages retain the language of their original action, so tests dismiss them before switching locales.
- Language-scoped lesson, progress and chat-session query URLs use `?language=amharic|swahili`; omitted language preserves Swahili behavior. Existing lesson/progress IDs remain unchanged. Session target language is stored server-side; chat-message `language` means interface language (`zh` or `en`), not target language.
- Development schema changes use `npm run db:push`; production receives the schema diff through Publish, not startup-time DDL.
- Content integrity: `node --import tsx --test server/tests/amharicCurriculum.test.ts`. Track API isolation: `RUN_HTTP_TESTS=1 node --import tsx --test server/tests/languageTracks.test.ts`. Interactive bilingual journey: `RUN_BROWSER_TESTS=1 node --import tsx --test server/tests/amharicBrowser.test.ts`.

### Data Storage
PostgreSQL, hosted on Neon serverless, serves as the primary database. Key tables include `users`, `lessons`, `user_progress`, `chat_sessions`, `chat_messages`, and `subscriptions`. Lesson content is stored as JSONB, encompassing vocabulary, phrases, dialogues, and grammar across a 9-month, 90-lesson curriculum divided into Beginner, Intermediate, and Advanced levels. Drizzle Kit manages schema migrations.

### Recurring Subscription System
Only two plans are offered: USD 88 every three months (quarterly) and USD 168 paid once for six months (semiannual). Both include full Amharic and Swahili course access. The user confirmed quarterly means one USD 88 payment every three months, not twice per quarter. Six months costs USD 176 on quarterly versus USD 168 upfront, saving USD 8. Polar.sh products and checkout will be integrated later; until then paid checkout is disabled and clearly labeled unavailable. Cryptocurrency instructions and new manual payment submissions are retired. Preserve historical subscription records and issued access; legacy admin review exists only to resolve earlier payments. Future integration must verify provider webhooks and map trusted products to these plans before granting access.

See `docs/polar-integration-readiness.md` before connecting Polar. The admin readiness view distinguishes settings presence from a validated/tested connection. Sandbox checkout revalidates product terms and requires a signing secret; live checkout remains disabled regardless of configuration. Polar's one-time benefit is not an app lifetime grant: the USD 168 product requires an explicit six-month entitlement in this app.

Historical manual payments were sold as fixed 30-day monthly and 90-day quarterly terms, not the new USD calendar-month plans. Approval grants that full legacy term after approval or the latest remaining trial/paid deadline, whichever is later; never reuse a pending record's provisional dates or change its price. Resolve approval/rejection atomically and serialize by learner to prevent duplicate grants and lost renewal time. Keep unlimited grants intact. Regression checks: `RUN_HTTP_TESTS=1 node --import tsx --test server/tests/subscriptionApproval.test.ts`.

Signed-in admin review regression: `npm run test:subscription:browser` requires the running development app and `REPLIT_DEV_DOMAIN` (optional `TEST_CHROMIUM_PATH`). It uses temporary administrators, learners and expired legacy pending fixtures, exercises real login and review buttons, checks delayed requests, success/error messages, refreshed lists and expiry, duplicate reviews, learner access refresh and retired checkout, then removes its fixtures.

### Admin Panel
An admin panel provides management capabilities for users with `isAdmin=true`. It includes a statistics dashboard, tabs for pending payments, active subscriptions, user management, and visit analytics. Admin API routes (`/api/admin/*`) are protected and facilitate actions like approving or rejecting subscriptions, and managing user data.

The **Learner stories** tab supports Chinese and English public attribution, quotes and context for either Amharic or Swahili. Administrators must verify the account and record permission covering both translations and public attribution before approving and publishing. Private contact details and consent records are admin-only, excluded from public responses, response-body logs and offline caches. Content or permission changes invalidate approval/publication on the server: save the edited version privately, then reopen it to explicitly reapprove and republish. Withdrawing permission requires saving the change to remove the story publicly. No genuine stories are seeded: the landing page retains clearly labeled illustrative examples until a permissioned story is published.

Story checks: `RUN_HTTP_TESTS=1 node --import tsx --test server/tests/learnerStories.test.ts` covers permission gates, authorization and privacy; `RUN_BROWSER_TESTS=1 node --import tsx --test server/tests/learnerStoriesPublishingBrowser.test.ts` covers signed-in editing, publication, bilingual public rendering, withdrawal and deletion. `server/tests/learnerStoriesBrowser.test.ts` checks the illustrative fallback with an isolated empty public-story response, independent of published stories.

### Analytics System
The platform includes a comprehensive analytics system to track visitor data:
- **Visits Table**: Stores sessionId (required), userId, country (code/name), browser, OS, device type, and IP hash
- **Visit Tracking**: Client-side tracking in App.tsx using sessionStorage to prevent duplicate tracking per session
- **Security**: Dual-layer rate limiting using trusted server values (req.ip and req.sessionID):
  - IP-based: Max 10 requests per minute per IP (returns 429 if exceeded)
  - Session-based: One visit per session per minute (returns cached response)
- **Admin Dashboard**: Analytics tab with Recharts visualizations including:
  - Overview metrics (total visits, unique sessions, today's visits)
  - Visits trend line chart (last 30 days)
  - Top countries bar chart
  - Browser distribution pie chart
  - Device type breakdown

### Progressive Web App (PWA) Features
The application includes PWA features for enhanced user experience. A custom service worker (`sw.js`) provides offline capabilities through various caching strategies (cache-first for static assets, network-first for API lessons, etc.) and enables offline navigation by serving a cached `index.html`. Offline lesson storage is implemented using IndexedDB. The PWA also features online/offline detection with an indicator, and a web app manifest (`manifest.json`) for installation on home screens.

### Social Sharing
A `ShareButton` component enables users to share the platform on WeChat, WhatsApp, Telegram, X (Twitter), and Facebook. The share message is a compelling Chinese invitation highlighting the AI tutor, curriculum, and free trial. For logged-in users, the share functionality extends to include their personal learning progress, such as completed lessons, practice count, and learning streaks.

## Running on Replit

- Install the dependencies declared in `package.json` with npm.
- Run `npm run db:push` to initialize the development database schema. The imported database starts empty; this does not restore data from the original project.
- Use the **Start application** workflow (`npm run dev`). Express and Vite serve together on port 5000.
- `DATABASE_URL` and `SESSION_SECRET` must be available through the environment.
- AI tutoring also needs `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY`. Without AI credentials, the app still starts, but chat requests return an explicit 503 configuration error.
- `npm run build` builds the production app; `npm start` serves the build.

## External Dependencies

### Brand icon
Use the existing purple graduation panda as the app's brand icon throughout the interface, browser tab, and installed app. Do not restore the earlier standalone graduation-cap brand mark. Preserve the footer panda's continuous up/down animation and localized greeting, with no pause button; respect reduced-motion settings. Functional course-level icons are not brand logos.

-   **Replit AI Integrations**: Proxied access to OpenAI API (GPT-5 model).
-   **Neon Database**: Serverless PostgreSQL hosting.
-   **Google Fonts**: Inter and Noto Sans SC font families.
-   **Polar.sh (planned)**: USD checkout for quarterly and six-month plans; not yet connected.
