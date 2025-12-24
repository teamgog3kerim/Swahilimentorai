# Swahili Learning Platform for Chinese Speakers

## Overview

This is a **Swahili AI Tutor** - a language learning platform specifically designed for Chinese speakers to learn Swahili. The application combines AI-powered conversation practice with structured lessons across three proficiency levels (beginner, intermediate, advanced). Users can engage in real-time chat practice with an AI tutor, track their learning progress, and access comprehensive lesson materials that include vocabulary, phrases, dialogues, and pronunciation guides. The platform uses a freemium subscription model with USDT-based payments.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18+ with TypeScript, built using Vite for fast development and optimized production builds.

**UI Component System**: Radix UI primitives with shadcn/ui components following the "new-york" style variant. Tailwind CSS provides utility-first styling with custom design tokens for colors, spacing, and typography.

**Routing**: Wouter for lightweight client-side routing. The application has two main flows:
- Unauthenticated users see a marketing landing page (`Home.tsx`)
- Authenticated users access the full dashboard application (`Dashboard.tsx`)

**State Management**: TanStack Query (React Query) handles all server state with infinite stale time and disabled automatic refetching. Authentication state is managed through a custom `useAuth` hook that queries the user endpoint.

**Design System**: 
- Mobile-first responsive design following guidelines in `design_guidelines.md`
- Typography uses Inter for UI/English and Noto Sans SC for Chinese text
- Custom theme system supporting light/dark modes via `ThemeProvider`
- Consistent spacing primitives using Tailwind units (2, 4, 6, 8, 12, 16)
- Color system uses HSL CSS variables for dynamic theming

**Key Pages**:
- `Learn.tsx`: Browse and select lessons by proficiency level
- `Practice.tsx`: AI chat interface for conversation practice
- `Progress.tsx`: Learning analytics and completion tracking
- `Subscription.tsx`: Premium membership management

### Backend Architecture

**Framework**: Express.js server with TypeScript, running on Node.js.

**API Design**: RESTful endpoints under `/api` namespace:
- `/api/auth/*` - Authentication and user management
- `/api/lessons/*` - Lesson content retrieval
- `/api/progress` - User learning progress tracking
- `/api/chat/*` - Chat session and message management
- `/api/subscription` - Subscription status and creation

**Authentication**: Replit's OpenID Connect (OIDC) integration using Passport.js strategy. Session management via `express-session` with PostgreSQL session store (`connect-pg-simple`).

**AI Integration**: OpenAI API (via Replit's AI Integrations service) for chat completions. Uses GPT-5 model for conversational AI tutor responses. No API key required as it leverages Replit's managed service.

**Data Layer**: Drizzle ORM with type-safe schema definitions in `shared/schema.ts`. All database interactions go through a storage abstraction (`DbStorage` class) implementing `IStorage` interface.

**Request Handling**: 
- JSON body parsing with raw body preservation for webhook verification
- Request logging middleware with duration tracking
- Credential-based session cookies (httpOnly, secure, 7-day TTL)

### Data Storage

**Database**: PostgreSQL via Neon serverless with WebSocket connections.

**Schema Design** (key tables):
- `users` - User accounts with Replit ID mapping, premium status, practice counts
- `lessons` - Lesson content stored as JSONB with metadata (level, category, estimated time, order)
- `user_progress` - Tracks completion status and last accessed timestamps
- `chat_sessions` - Conversation practice sessions linked to users and optional lessons
- `chat_messages` - Individual messages with role (user/assistant) and content
- `subscriptions` - Premium subscription records with status and expiration
- `sessions` - Express session storage managed by connect-pg-simple

**Content Structure**: Lessons contain JSONB with:
- Vocabulary arrays (Swahili, Chinese, English, pronunciation)
- Phrases with translations
- Multi-line dialogues with speaker attribution
- Grammar explanations (intermediate/advanced)

**9-Month Curriculum**: Complete structured learning path with 90 lessons:
- **Beginner Level** (Lessons 1-30, Months 1-3): Foundation topics including greetings, numbers, family, colors, basic verbs, food, transportation, body parts, time, weather, shopping, and essential grammar
- **Intermediate Level** (Lessons 31-60, Months 4-6): Past/future tenses, market conversations, directions, health, work, technology, sports, comparisons, cooking, celebrations, environment, housing, emergency situations, finance, cultural customs, and religion
- **Advanced Level** (Lessons 61-90, Months 7-9): Business meetings, academic language, complex grammar, legal/medical terminology, literature, environmental issues, idioms, economic policy, international relations, scientific research, philosophy, technology innovation, history, social issues, leadership, digital economy, crisis management, and professional writing

**Migration Strategy**: Drizzle Kit manages schema migrations in `./migrations` directory via `db:push` script.

### External Dependencies

**Third-Party Services**:
- **Replit Auth**: OAuth/OIDC identity provider for user authentication
- **Replit AI Integrations**: Proxied OpenAI API access (no direct OpenAI key needed)
- **Neon Database**: Serverless PostgreSQL hosting
- **Google Fonts**: Inter and Noto Sans SC font families

**Payment Integration**: Binance Pay (USDT TRC20) - Recurring monthly subscriptions at 90 USDT per 30 days. Manual verification workflow via admin (see ADMIN_PAYMENT_VERIFICATION.md). Supports subscription renewals starting 4 days before expiration.

### Recurring Subscription System

**Subscription Model**: 
- Two pricing tiers:
  - Monthly: 90 USDT per 30 days
  - Quarterly: 250 USDT per 90 days (saves 20 USDT vs 3x monthly)
- Payment via Binance Pay (TRC20 network)
- Wallet address: TCdeZjG39zU9SjtoLwfXmcedJhnXyNd8zB
- Payment method: Manual transaction ID submission + admin verification

**Expiration Handling**:
- Frontend and backend check: `subscriptionEndsAt < now` for expiration
- Expired users automatically downgrade to free tier (10 practice limit)
- Real-time expiration detection (no day-based delays)
- Expiration alerts shown 4 days before and when expired
- New users get 7-day free trial automatically

**Renewal Flow**:
- Renewal window opens 4 days before expiration
- Users submit new transaction ID via payment dialog
- System extends subscription from current end date (preserves remaining days)
- Renewal creates pending subscription requiring admin approval
- Formula: `newEndDate = max(currentEndDate, now) + 30 days`

**Security Features**:
- Server-side expiration checks prevent API abuse
- Practice count increments for expired premium users
- Duplicate transaction ID detection
- Renewal blocked if more than 4 days remaining

**Admin Verification Process** (see ADMIN_PAYMENT_VERIFICATION.md):
1. User submits transaction ID
2. System creates pending subscription
3. Admin verifies payment on blockchain
4. Admin activates subscription and updates user premium status

**NPM Packages** (key dependencies):
- `@tanstack/react-query` - Server state management
- `drizzle-orm` & `drizzle-zod` - Database ORM and validation
- `@neondatabase/serverless` - Neon database driver
- `openai` - AI chat completions
- `passport` & `openid-client` - Authentication
- `react-hook-form` & `zod` - Form handling and validation
- Complete Radix UI component suite for accessible UI primitives
- `wouter` - Lightweight routing
- `date-fns` - Date manipulation

**Development Tools**:
- `@replit/vite-plugin-*` - Development experience plugins (error overlay, cartographer, banner)
- `tsx` - TypeScript execution for development server
- `esbuild` - Production server bundling

**Asset Management**: Generated images stored in `attached_assets/generated_images/` directory, imported via Vite aliases (`@assets`).

### Progressive Web App (PWA) Features

**Service Worker**: Custom service worker (`client/public/sw.js`) registered on app load provides offline functionality:
- **Caching Strategies**:
  - Static assets: Cache-first with STATIC_CACHE
  - API lessons (`/api/lessons`): Network-first with LESSONS_CACHE fallback
  - Dynamic assets: Cache-first with DYNAMIC_CACHE
  - Navigation requests: Network-first with index.html fallback for offline SPA routing
- **Offline Navigation**: Handles `request.mode === 'navigate'` to serve cached index.html when offline, enabling deep-linking and page reloads on any route (/learn, /practice, /dashboard)
- **Update Detection**: Prompts users for reload when new service worker version available

**Offline Lesson Storage**: IndexedDB-based persistent storage for lessons:
- **Database**: SwahiliLearnDB with `lessons` object store
- **Schema**: Stores lesson ID (string/UUID), title, level, category, content (JSONB), downloadedAt timestamp
- **API**: `saveLessonOffline()`, `getOfflineLesson()`, `deleteLessonOffline()`, `getAllOfflineLessons()`, `isLessonDownloaded()`
- **UI Integration**: Download buttons on each lesson card with three states (download, downloading, downloaded)

**Online/Offline Detection**:
- `useOnlineStatus()` hook monitors browser online/offline events
- `<OfflineIndicator>` component displays prominent alert when disconnected
- Download buttons and offline badges provide visual feedback of offline-available content

**Web App Manifest**: `client/public/manifest.json` defines PWA metadata:
- App name: "斯瓦希里语学习 - Swahili Learning"
- Theme color: #6366f1 (indigo)
- Display mode: standalone
- Icons: 192x192 and 512x512 PNG (maskable, generated)
- Start URL: /
- Category: education, productivity

**Installation**:
- Mobile browsers (iOS Safari, Android Chrome) prompt to "Add to Home Screen"
- Desktop browsers show install icon in address bar
- Runs as standalone app when installed

**Key Files**:
- `client/public/sw.js` - Service worker with caching logic
- `client/public/manifest.json` - PWA metadata
- `client/src/lib/offlineStorage.ts` - IndexedDB utilities
- `client/src/lib/registerSW.ts` - Service worker registration
- `client/src/hooks/useOnlineStatus.ts` - Online/offline detection hook
- `client/src/components/OfflineIndicator.tsx` - Offline status UI component

### Social Sharing Feature

**ShareButton Component**: `client/src/components/ShareButton.tsx` enables viral marketing through social media sharing.

**Supported Platforms**:
- WeChat (微信) - Copies message to clipboard for pasting in WeChat
- WhatsApp - Direct share via Web API
- Telegram - Direct share via Telegram API
- X (Twitter) - Direct share via Twitter intent
- Facebook - Direct share via Facebook sharer

**Share Message** (Chinese):
The share message is an attractive Chinese invitation encouraging friends to learn Swahili together:
- Highlights AI tutor benefits (24/7 availability)
- Emphasizes design for Chinese speakers
- Mentions 90 lessons and 9-month curriculum
- Includes 7-day free trial call-to-action
- Uses Swahili greeting "Karibu!" (Welcome!)

**Placement**:
- Hero section on landing page (for visitors)
- Dashboard sidebar (for logged-in users)

**Key Test IDs**:
- `button-share`: Main share button trigger
- `dialog-share`: Share dialog container
- `button-copy-share`: Copy to clipboard button
- `button-share-{platform}`: Individual platform buttons (微信, whatsapp, telegram, x, facebook)