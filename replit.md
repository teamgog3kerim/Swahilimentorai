# Swahili Learning Platform for Chinese Speakers

## Overview
This project is a **Swahili AI Tutor**, a language learning platform for Chinese- and English-speaking learners. The app interface can be switched between Simplified Chinese and English, with the selection saved in the browser. It offers AI-powered conversational practice, structured lessons across three proficiency levels, and progress tracking. The platform operates on a freemium model with USDT-based payments.

## User Preferences
Preferred communication style: Simple, everyday language.
Chinese is the primary/default interface. English is optional and should only be enabled when a user selects it; keep their selection saved for later visits.

## System Architecture

### Frontend
The frontend is built with React 18+ (TypeScript, Vite), utilizing Radix UI primitives and shadcn/ui components with Tailwind CSS for styling. Wouter handles client-side routing, distinguishing between a marketing landing page and the authenticated user dashboard. State management is powered by TanStack Query for server state and a custom `useAuth` hook for authentication. The design system emphasizes mobile-first responsiveness, featuring Inter and Noto Sans SC fonts, a custom theme with light/dark modes, and consistent spacing and color systems. Key pages include Learn, Practice, Progress, and Subscription.

### Backend
The backend uses Express.js (Node.js, TypeScript) with a RESTful API. Authentication supports existing email/password accounts via Passport.js Local and verified Gmail accounts via Google OpenID Connect. Sessions use `express-session` and a PostgreSQL store. AI integration leverages Replit's AI Integrations service for OpenAI's GPT-5 model for conversational tutoring. Data interactions use Drizzle ORM.

### Google sign-in and application owner
- Configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` through Secrets. Set `GOOGLE_CALLBACK_URL` to the exact HTTPS URL ending in `/api/auth/google/callback`, and register it in the Google Cloud web OAuth client. Development has its own callback; configure the published app's callback separately in Production.
- Missing Google configuration must not stop email/password or other app features. Google sign-in is visibly disabled until configured.
- `APP_OWNER_EMAIL` reserves the owner account. Its full administrator access is established only after a verified Gmail sign-in. Local password registration/login must not grant access to the reserved owner address.
- Preserve existing accounts and their learning data. Ordinary existing accounts require password sign-in followed by “Connect Google account” in the dashboard before Google can be linked. This prevents silent linking to unverified, self-registered email identities.
- A pre-existing local owner account is recovered through verified Google ownership, removing its old password and sessions to prevent a previously claimed email from retaining admin access.
- Admin user controls allow name, role, and membership changes, plus permanent deletion with explicit email confirmation. Server-side checks protect the owner and prevent self-deletion/self-demotion. Do not return password hashes or Google subject IDs from management APIs.

Authentication checks: `node --import tsx --test server/tests/accountPolicy.test.ts`. Development database integration checks: `RUN_DB_TESTS=1 node --import tsx --test server/tests/googleAccounts.test.ts` (temporary test accounts are removed afterwards).

### Data Storage
PostgreSQL, hosted on Neon serverless, serves as the primary database. Key tables include `users`, `lessons`, `user_progress`, `chat_sessions`, `chat_messages`, and `subscriptions`. Lesson content is stored as JSONB, encompassing vocabulary, phrases, dialogues, and grammar across a 9-month, 90-lesson curriculum divided into Beginner, Intermediate, and Advanced levels. Drizzle Kit manages schema migrations.

### Recurring Subscription System
The platform offers monthly (90 USDT) and quarterly (250 USDT) premium subscriptions via Binance Pay (TRC20 network). Payments are manually verified by an admin against a specified wallet address. The system includes expiration checks, a 7-day free trial for new users, and a renewal process that extends subscriptions from their current end date. Security features include server-side expiration checks, practice count limits for expired users, and duplicate transaction ID detection.

### Admin Panel
An admin panel provides management capabilities for users with `isAdmin=true`. It includes a statistics dashboard, tabs for pending payments, active subscriptions, user management, and visit analytics. Admin API routes (`/api/admin/*`) are protected and facilitate actions like approving or rejecting subscriptions, and managing user data.

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

-   **Replit AI Integrations**: Proxied access to OpenAI API (GPT-5 model).
-   **Neon Database**: Serverless PostgreSQL hosting.
-   **Google Fonts**: Inter and Noto Sans SC font families.
-   **Binance Pay**: For USDT (TRC20) subscription payments.