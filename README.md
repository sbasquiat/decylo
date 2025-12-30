# DecisionOS

A premium, calm, mobile-first decision-making web app (PWA) that helps users capture decisions, evaluate options, commit, and track outcomes.

## Features

- **Daily Habit Tool**: Capture decisions, evaluate options, commit, and track outcomes
- **Decision Wizard**: 4-step process to create and score decisions
- **Outcome Tracking**: Log outcomes and learn from past decisions
- **Streak Tracking**: Build momentum with daily check-ins
- **Insights**: View analytics on your decision-making patterns
- **PWA Support**: Installable on mobile and desktop devices

## Tech Stack

- **Next.js 14** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **Supabase** for authentication, database, and storage
- **PWA** support with manifest and service worker

## Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

## Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd decisionOps
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up Supabase**

   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
   - Get your project URL and anon key from Settings > API

4. **Configure environment variables**

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The app uses the following Supabase tables:

- `profiles`: User profiles
- `decisions`: Decision records
- `options`: Options for each decision
- `checkins`: Daily check-ins
- `outcomes`: Outcome records for decisions

See `supabase/schema.sql` for the complete schema with RLS policies.

## Scoring Algorithm

Decylo uses a normalized, weighted scoring model:

**Step 1: Normalize dimensions (all 1-10, higher = better)**
- ImpactScore = impact_int
- EffortScore = 11 - effort_int (inverted: low effort = high score)
- RiskScore = 11 - risk_int (inverted: low risk = high score)

**Step 2: Weighted formula**
```
DecisionScore = (ImpactScore × 0.5) + (EffortScore × 0.3) + (RiskScore × 0.2)
```

**Step 3: Final score (1-10, rounded to 1 decimal)**
The option with the highest score becomes the Decylo Recommendation. The user still chooses the final option manually.

The suggested option is the one with the highest score. Tie-breakers:
1. Lowest risk
2. Lowest effort

## Testing

Run unit tests:

```bash
npm test
```

Tests are located in `lib/scoring.test.ts`.

## Building for Production

```bash
npm run build
npm start
```

## PWA Icons

Place PWA icons in the `public` directory:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

You can generate these using tools like [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator).

**Note:** The app will work without these icons, but they're required for a proper PWA installation experience.

## Project Structure

```
decisionOps/
├── app/                    # Next.js app directory
│   ├── app/               # Authenticated app routes
│   ├── signin/            # Sign in page
│   ├── signup/            # Sign up page
│   └── layout.tsx         # Root layout
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   └── ...                 # Feature components
├── lib/                    # Utility functions
│   ├── supabase/          # Supabase client setup
│   ├── db/                 # Database types
│   └── scoring.ts          # Scoring logic
├── public/                 # Static assets
├── supabase/               # Database schema
└── ...                     # Config files
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

## License

Private - All rights reserved

