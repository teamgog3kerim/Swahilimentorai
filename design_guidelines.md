# Design Guidelines: Swahili Learning Platform (Chinese Speakers)

## Design Approach

**Selected Approach:** Reference-Based, drawing inspiration from modern learning platforms (Duolingo's gamification + Linear's clean aesthetics + Notion's organization)

**Core Principles:**
- Mobile-first responsive design optimized for touch interactions
- Bilingual clarity (Chinese + Swahili) with clear language hierarchy
- Learning-focused UX that minimizes cognitive load
- Confidence-building through progressive disclosure and visual feedback

## Typography System

**Font Families:**
- Primary (UI/English): Inter (400, 500, 600, 700) via Google Fonts
- Chinese: Noto Sans SC (400, 500, 600, 700) via Google Fonts
- Swahili Content: Inter (optimized for readability)

**Type Scale:**
- Hero/Page Titles: text-4xl md:text-5xl font-bold
- Section Headers: text-2xl md:text-3xl font-semibold
- Lesson Titles: text-xl font-semibold
- Body Text (Chinese): text-base font-normal
- Body Text (Swahili): text-lg font-medium (larger for learning clarity)
- Captions/Meta: text-sm font-medium
- Buttons: text-base font-semibold

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16 consistently
- Component padding: p-4 (mobile), p-6 (tablet), p-8 (desktop)
- Section spacing: space-y-8 (mobile), space-y-12 (desktop)
- Card gaps: gap-4 (mobile), gap-6 (desktop)

**Container Strategy:**
- Max width: max-w-7xl for landing pages, max-w-4xl for lesson content, max-w-2xl for chat interface
- Padding: px-4 md:px-6 lg:px-8
- Vertical rhythm: py-12 md:py-16 lg:py-20 for sections

## Core Component Library

### Navigation
**Top Navigation Bar:**
- Fixed position with backdrop blur effect
- Height: h-16 md:h-20
- Logo (left), Level selector (center on desktop), Profile + Subscription badge (right)
- Mobile: Hamburger menu revealing slide-in drawer

**Bottom Tab Bar (Mobile):**
- Fixed bottom navigation with 4 tabs: Learn, Practice, Progress, Profile
- Icon + label, h-16, safe-area-inset-bottom support

### Hero Section (Landing)
**Layout:**
- Full-width container with two-column layout (60/40 split on desktop)
- Left: Headline (Chinese + Swahili tagline), feature bullets, dual CTAs (Start Free Trial + View Pricing)
- Right: Hero image showing diverse learners using the app on mobile devices
- Height: min-h-screen on desktop, auto on mobile
- Background: Subtle gradient overlay with geometric patterns

**Hero Image:** 
- Large, high-quality photograph showing happy Chinese learners engaging with mobile phones displaying the Swahili app interface
- Position: Right side on desktop, above content on mobile
- Treatment: Rounded corners (rounded-2xl), subtle shadow

### Learning Dashboard

**Level Selection Cards:**
- Three prominent cards: Beginner (初学者), Intermediate (中级), Advanced (高级)
- Grid: grid-cols-1 md:grid-cols-3, gap-6
- Each card: p-6, rounded-xl, includes level icon, proficiency description, lesson count, progress bar
- Hover state: subtle lift effect (transform scale)

**Lesson Cards:**
- Masonry-style grid showcasing lesson topics
- Each card: Swahili title + Chinese translation, lesson number, estimated time, completion status
- Lock icon for premium lessons (non-subscribers)
- Audio preview icon visible on hover

### AI Chat Interface

**Chat Container:**
- Full-height layout with header, message area, input footer
- Message bubbles: User (right-aligned, different treatment), AI Tutor (left-aligned, avatar included)
- Bubble styling: p-4, rounded-2xl, max-w-xs md:max-w-md
- Audio playback controls inline within AI messages for Swahili pronunciation

**Input Area:**
- Sticky bottom position
- Microphone button (voice input), text input field, send button
- Height: auto-expanding up to 6 lines
- Character counter for practice exercises

### Audio Player Component

**Compact Player:**
- Horizontal layout: Play/pause button, waveform visualization, speed control (0.5x, 1x, 1.5x)
- Width: w-full, height: h-16
- Progress bar with scrubbing capability
- Swahili text displayed above player, Chinese translation below

### Progress Tracking

**Progress Visualization:**
- Circular progress rings for overall completion, weekly streak counter, total practice hours
- Grid layout: grid-cols-2 md:grid-cols-4, gap-4
- Achievement badges in card format with unlock animations
- Line chart showing learning consistency over time

### Subscription Components

**Pricing Card:**
- Prominent card with gradient background
- Price display: "90 USDT/月" in large text-4xl
- Feature list with checkmarks: Unlimited practice, All levels, AI tutor access, Offline mode
- Binance Pay button: Full-width, h-12, with Binance logo
- Trial indicator: "7-day free trial" badge

**Subscription Badge:**
- Small pill-shaped indicator next to user profile
- Premium users: Gold gradient background
- Free users: Neutral gray with "Upgrade" CTA

### Supporting Sections (Landing)

**Features Section:**
- Three-column grid on desktop, single column on mobile
- Each feature: Icon (top), Chinese heading, Swahili example, description
- Icons: 64x64px, modern line-style from Heroicons

**How It Works Section:**
- Numbered steps (1-4) in horizontal timeline layout
- Each step: Large number, heading, description, supporting illustration
- Responsive: Vertical on mobile, horizontal on desktop

**Social Proof Section:**
- Two-column testimonial cards
- Each card: User photo (rounded-full, w-12 h-12), Chinese name, learning level, quote in Chinese, Swahili phrase they learned
- Star rating visible

**Footer:**
- Multi-column layout: Product links, Learning resources, Legal, Social media, Language selector (中文/English)
- Newsletter signup: "Get free Swahili lessons weekly" with email input
- Binance Pay logo with "Powered by Binance Pay" text

## Images

**Hero Image:** 
High-quality photograph showing 2-3 Chinese learners (diverse ages) happily engaged with smartphones displaying colorful Swahili lesson interface. Natural lighting, modern casual setting (café or study space). Shows app UI clearly on phone screens.

**Feature Section Images:**
- Three supporting illustrations: AI chat conversation, audio waveform with Swahili text, progress dashboard with graphs
- Style: Modern, clean illustrations with primary brand accent colors

**How It Works Section:**
- Four simple, iconic illustrations per step: Sign up → Choose level → Practice with AI → Track progress
- Minimal, line-art style maintaining visual consistency

## Responsive Behavior

**Breakpoints:**
- Mobile: base (up to 768px)
- Tablet: md (768px - 1024px)
- Desktop: lg (1024px+)

**Key Adaptations:**
- Navigation: Top bar + bottom tabs (mobile), full horizontal nav (desktop)
- Lesson grid: Single column (mobile), 2 columns (tablet), 3 columns (desktop)
- Chat interface: Full screen (mobile), sidebar layout (desktop)
- Typography: Scale up 1.2x from mobile to desktop for headings

## Interactions & States

**Button States:**
- Primary CTA: Solid fill, hover scale(1.02), active scale(0.98)
- Secondary: Outline style, hover fill transition
- Disabled: Reduced opacity (0.5), no interactions

**Card Interactions:**
- Hover: Subtle lift (translateY(-2px)), shadow increase
- Active lesson: Border accent, slightly elevated
- Locked content: Grayscale filter with lock overlay

**Loading States:**
- Skeleton screens for lesson cards during fetch
- Animated ellipsis for AI typing indicator
- Progress spinner for audio loading

## Accessibility Features

- Focus indicators on all interactive elements (2px outline offset)
- Semantic HTML throughout (nav, main, article, section)
- ARIA labels for icon-only buttons (Chinese + English)
- Text contrast minimum 4.5:1 for body, 7:1 for headings
- Touch targets minimum 44x44px on mobile
- Skip navigation links for keyboard users