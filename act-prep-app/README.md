# ACT Prep Application

A comprehensive ACT test preparation application built with React, TypeScript, and Supabase.

## Features

### Core Functionality
- **Onboarding Wizard**: Comprehensive setup collecting user preferences, test date, accommodations, and goals
- **Diagnostic Test**: Quick 25-30 minute baseline assessment
- **Practice Drills**: Untimed focused practice on weak topics
- **Timed Sections**: Realistic ACT section practice with accommodations support
- **Spaced Repetition Review**: Smart review system for wrong answers
- **Progress Dashboard**: Visual tracking of accuracy, streaks, and XP
- **Admin Import**: Secure TSV content import for administrators

### Key Technical Features
- **Mobile-first responsive design**
- **Accessibility support** (reduced motion, dyslexia font)
- **Time accommodations** (100%, 150%, 200% time)
- **Secure RLS policies** for data isolation
- **Autosave and session recovery**
- **Choice shuffling** with consistent grading

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Supabase Edge Functions
- **Query Management**: TanStack Query
- **Routing**: TanStack Router

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env`
3. Add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_URL=http://localhost:5173
```

### Database Setup

1. Create a new Supabase project
2. Run the migration in `supabase/migrations/001_initial_schema.sql`
3. Deploy the Edge Function in `supabase/functions/admin-import/`

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The application will be available at http://localhost:5173

### Build

```bash
npm run build
```

### Type Checking

```bash
npm run typecheck
```

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── onboarding/  # Onboarding wizard
│   ├── practice/    # Practice mode components
│   └── ui/          # Base UI components
├── contexts/        # React contexts (Auth)
├── lib/            # Utilities and helpers
├── pages/          # Route pages
├── stores/         # Zustand stores
└── types/          # TypeScript type definitions
```

## Database Schema

### Content Tables (Read-only)
- `forms`: Test forms
- `passages`: Reading passages
- `questions`: Question bank
- `form_questions`: Form-question mapping
- `skills`: Skill taxonomy

### User Tables (RLS protected)
- `sessions`: Practice sessions
- `attempts`: Answer attempts
- `review_queue`: Spaced repetition queue
- `user_prefs`: User preferences
- `goal`: Test goals
- `accommodations`: Time accommodations
- `study_plan_days`: Daily study plans
- `study_tasks`: Individual tasks

## Security

- Row Level Security (RLS) enforced on all tables
- Users can only access their own data
- Admin functions protected by `is_admin()` check
- Content import restricted to Edge Functions with service role

## ACT Section Timings

- **English**: 45 minutes
- **Math**: 60 minutes
- **Reading**: 35 minutes
- **Science**: 35 minutes

Time accommodations multiply these base times by 1.5x or 2x.

## Scoring

Simplified monotone mapping from percent correct to ACT scale (1-36).

## Success Metrics

- **Activation**: ≥60% complete onboarding + first session within 24h
- **Engagement**: D7 retention ≥35% complete ≥3 sessions
- **Learning**: ≥10-pt median increase in weak skills over 7 days
- **Reliability**: Session loss rate <0.5%
- **Security**: Zero cross-user data reads/writes

## License

Proprietary - All rights reserved

## Disclaimer

This application is not affiliated with ACT, Inc. It is an independent study tool.