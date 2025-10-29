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

**Migration Strategy**: Drizzle Kit manages schema migrations in `./migrations` directory via `db:push` script.

### External Dependencies

**Third-Party Services**:
- **Replit Auth**: OAuth/OIDC identity provider for user authentication
- **Replit AI Integrations**: Proxied OpenAI API access (no direct OpenAI key needed)
- **Neon Database**: Serverless PostgreSQL hosting
- **Google Fonts**: Inter and Noto Sans SC font families

**Payment Integration**: Binance Pay (USDT) mentioned but not yet implemented - displays "coming soon" toast.

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