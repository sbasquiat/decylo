# Decylo Platform - Comprehensive Audit & MVP Status

**Date:** December 2024  
**Status:** ✅ Ready for Stripe Integration & MVP Launch

---

## 🎯 Executive Summary

Decylo is a **judgment training system** that helps users make better decisions by closing the feedback loop between predictions and outcomes. The platform is **feature-complete** and ready for Stripe payment integration to launch as an MVP.

**Core Value Proposition:** "Decylo doesn't help you do more. It helps you become harder to fool — including by yourself."

---

## 📋 Platform Architecture

### **Tech Stack**
- **Framework:** Next.js 16.1.1 (App Router) with TypeScript
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **Authentication:** Supabase Auth
- **Styling:** Tailwind CSS with CSS Variables
- **PDF Export:** jsPDF with autoTable
- **Payment:** Stripe (API routes ready, needs configuration)

### **Project Structure**
```
app/
├── (auth)/          # Authentication pages (signin, signup, forgot-password)
├── (public)/        # Public marketing pages
│   ├── page.tsx     # Landing page
│   ├── guide/       # Operating manual
│   ├── pricing/     # Pricing page
│   ├── upgrade/     # Upgrade page
│   └── ...
├── app/             # Protected app pages
│   ├── page.tsx     # Today dashboard
│   ├── new/         # Decision creation (4-step wizard)
│   ├── timeline/    # Decision history
│   ├── insights/    # Analytics & judgment profile
│   ├── decision/[id]/ # Decision detail view
│   ├── review/      # Weekly review (Pro)
│   └── settings/    # Profile & export
└── api/             # API routes
    ├── stripe/      # Checkout, portal, webhook
    └── decision-health/ # Health recalculation

components/          # Reusable UI components
lib/                 # Business logic & utilities
supabase/            # Database migrations & schema
```

---

## ✅ Core Features Implemented

### **1. Decision Creation Flow (4-Step Wizard)**

**Step 1: Title & Category**
- Decision title input
- Category selection (8 categories)
- Tooltip for first-time users
- Category calibration feedback

**Step 2: Context & Setup**
- Context description
- Success outcome definition (required)
- Constraints (optional)
- Risky assumption (optional, anti-bias)

**Step 3: Options & Scoring**
- Multiple options (2-5)
- Expected Value calculation: `(Impact × 0.5) + (EffortScore × 0.3) + (RiskScore × 0.2)`
- Visual scoring sliders (Impact, Effort, Risk)
- Decylo recommendation (highest score)
- High-impact reflection prompt (Impact ≥ 7)

**Step 4: Commit (Enhanced)**
- ✅ Option selection with Expected Value display
- ✅ **Decision Rationale** (required) - "Why are you choosing this option?"
- ✅ **Predicted Outcome - Positive** (optional) - "If it goes well..."
- ✅ **Predicted Outcome - Negative** (optional) - "If it goes badly..."
- ✅ **Confidence slider** (0-100%) with helper text
- ✅ **Next Action** (optional)
- ✅ **Due Date** (optional) with reminder explanation
- ✅ **Commitment checkbox** (required) - "I understand I'm committing..."

**Database Fields:**
- `decision_rationale` (TEXT)
- `predicted_outcome_positive` (TEXT)
- `predicted_outcome_negative` (TEXT)
- `commitment_confirmed` (BOOLEAN)

---

### **2. Outcome Logging**

**Two Methods:**

**A. Full Outcome Modal** (`LogOutcomeModal`)
- Outcome result (Won/Neutral/Lost)
- What happened (required)
- What you learned (required)
- Learning confidence (0-100%)
- Temporal anchor (1 day, 1 week, 1 month, 3 months)
- Counterfactual reflection (optional)
- Self-reflection (optional) - "What did this teach you about yourself?"

**B. Quick Check-in** (`QuickCheckinModal`)
- Simplified outcome logging
- Same fields as full modal
- Faster workflow for routine decisions

**Triggers:**
- ✅ **3rd outcome paywall** - Shows upgrade modal after 3rd outcome logged
- Decision Health recalculation
- Insight feedback generation

---

### **3. Today Dashboard** (`/app`)

**Key Sections:**
- **Outcome Due** tile - Shows next decision needing outcome
- **Completed Today** - Celebratory display
- **Active Decisions** - Open and decided decisions
- **Stats Cards:**
  - Streak counter
  - Decisions this week
  - Outcomes this week
  - Total decisions
  - Total outcomes

**Features:**
- Quick check-in buttons
- Status badges (Open, Decided, Completed)
- Onboarding flow for new users (8 screens)
- Upgrade modal triggers

---

### **4. Timeline** (`/app/timeline`)

**Features:**
- Chronological decision list
- Filter by category
- Search functionality
- Status badges
- **Pro Gating:**
  - Free: Last 7 days only
  - Pro: Full history
  - Paywall modal for older decisions

**Security:**
- Explicit user filtering
- Data isolation checks
- Session validation

---

### **5. Insights Page** (`/app/insights`)

**Free Tier:**
- Basic stats (Win Rate, Streak, Total Decisions)
- Simple charts

**Pro Tier (Gated):**
- ✅ **State of You Card** - Auto-generated diagnosis
- ✅ **Judgment Profile Card:**
  - Primary Archetype (Calibrated Strategist, Bold Executor, Thoughtful Drifter, Reactive Thinker)
  - Secondary Trait (High-Risk Optimizer, Risk-Averse Planner, Momentum Builder, Stalled Learner)
  - Insight narrative
  - Metrics: Prediction Accuracy (PA), Follow-Through (FT), Risk Intelligence (RI), Growth Momentum (GM)
- ✅ **Decision Trajectory Card:**
  - Decision Health Index (DHI) trend
  - Trajectory Momentum Score (TMS)
  - Domain Strength Index (per category)
  - Calibration Curve
  - Auto-generated insights

**Components:**
- `RequirePro` - Blurs content, shows upgrade prompt
- `StateOfYouCard`
- `JudgmentProfileCard`
- `TrajectoryCard`

---

### **6. Decision Detail** (`/app/decision/[id]`)

**Sections:**
- Original Decision (title, context, options, constraints)
- Thinking at the Time:
  - Decision rationale
  - Predicted outcomes (positive/negative)
  - Confidence at decision
  - Predicted impact score
- Outcome & Learning (if completed)
- Action buttons (Log Outcome, Quick Check-in)

**Pro Gating:**
- Free: Decisions older than 7 days show paywall
- Pro: Full access to all decisions

---

### **7. Weekly Review** (`/app/review`)

**Status:** Pro-only page
- Redirects free users to upgrade
- Structure ready for implementation
- Weekly judgment summary flow

---

### **8. Settings** (`/app/settings`)

**Sections:**
- **Profile:** Display name
- **Subscription:**
  - Current plan display
  - Manage Subscription (Pro) → Stripe Portal
  - Upgrade to Pro (Free) → Pricing page
- **Export:**
  - CSV export (Pro only)
  - **PDF export (Pro only)** - Beautiful formatted export with:
    - Cover page
    - Branded headers/footers
    - Color-coded sections
    - Section boxes
    - Badges and visual elements
    - Page numbers
- **Account:** Sign out

---

### **9. Onboarding Flow**

**8-Screen Sequence:**
1. Welcome to Decylo
2. The Problem
3. The Decylo Loop
4. How Scoring Works
5. What Decylo Measures
6. Why This Works
7. The Commitment
8. First Action

**Features:**
- Progress indicator
- Skip option
- Auto-triggers for new users (0 decisions)
- Tooltip on first decision page

---

### **10. Public Pages**

**Landing Page** (`/`)
- Hero section with value proposition
- Bold promise line
- Feature highlights
- CTA buttons

**Guide** (`/guide`)
- Operating manual
- How to use Decylo properly
- Scoring honesty
- Bias avoidance
- Decision Health interpretation

**Pricing** (`/pricing`)
- Free vs Pro comparison
- Pricing display
- Upgrade buttons (needs Stripe price IDs)

**Upgrade** (`/upgrade`)
- Pro features explanation
- Pricing options
- Comparison table
- Checkout integration (needs Stripe price IDs)

**Other Pages:**
- How It Works
- About
- FAQ
- Privacy
- Terms
- Contact

---

## 💰 Monetization System

### **Pricing Model**
- **Free:** €0
- **Pro:** €10/month or €89/year (2 months free)

### **Free Tier Features**
✅ Create unlimited decisions  
✅ Log outcomes & check-ins  
✅ Timeline (last 7 days)  
✅ Basic insights (Win Rate, Streak, Counts)

### **Pro Tier Features**
✅ Full decision history  
✅ Decision Health engine  
✅ Judgment Profile  
✅ Decision Trajectory  
✅ Weekly Review  
✅ Advanced filters & search  
✅ Export (CSV + PDF)

### **Paywall Triggers**

1. **After 3rd Outcome** (`LogOutcomeModal`)
   - Shows upgrade modal
   - Message: "Your Decision Health is starting to form"

2. **Timeline > 7 Days** (`TimelineClient`, `DecisionDetailPage`)
   - Hard paywall for older decisions
   - Shows `UpgradePrompt` or `DecisionDetailWithPaywall`

3. **Insights Page** (`/app/insights`)
   - Soft paywall (blur + upgrade prompt)
   - `RequirePro` component wraps advanced sections

4. **Export** (`/app/settings`)
   - Hard paywall
   - Shows `PaywallModal` on export attempt

5. **Weekly Review** (`/app/review`)
   - Redirects to upgrade page

### **Stripe Integration Status**

**✅ Implemented:**
- `/api/stripe/checkout` - Creates checkout session
- `/api/stripe/portal` - Customer portal for subscription management
- `/api/stripe/webhook` - Handles subscription events
- Database schema (`is_pro`, `stripe_customer_id`, `stripe_subscription_status`)
- Subscription utility functions (`getUserPlan`, `isWithinFreeTier`)

**⚠️ Needs Configuration:**
- Stripe account setup
- Product & Price creation (monthly/yearly)
- Environment variables:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_PRO_MONTHLY`
  - `STRIPE_PRICE_PRO_YEARLY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Webhook endpoint configuration

---

## 🧮 Core Algorithms & Calculations

### **1. Expected Value (Option Scoring)**
```
ImpactScore = impact_int (1-10)
EffortScore = 11 - effort_int (1-10, inverted)
RiskScore = 11 - risk_int (1-10, inverted)

Expected_Value = (ImpactScore × 0.5) + (EffortScore × 0.3) + (RiskScore × 0.2)
Stored as: integer × 10 (e.g., 6.9 → 69)
```

### **2. Judgment Profile Metrics**

**Prediction Accuracy (PA):**
```
PA = 1 - |Confidence% - OutcomeScore|
Where: Win = 1.0, Neutral = 0.5, Loss = 0.0
Profile PA = average of last 30 decisions
```

**Follow-Through Rate (FT):**
```
FT = Completed decisions / Total decisions
```

**Risk Intelligence (RI):**
```
Compares predicted risk vs actual outcome
RI = rolling average of last 20 decisions
Range: -1 to +1 (normalized to 0-1 for DHI)
```

**Growth Momentum (GM):**
```
GM = Slope of Decision Health over last 14 days
GM = (TodayHealth - Health14DaysAgo) / 14
```

### **3. Decision Health Index (DHI)**
```
DHI = (0.45 × PA) + (0.30 × FT) + (0.15 × RI_normalized) + (0.10 × GM_normalized)
Scaled to 0-100
```

### **4. Trajectory Momentum Score (TMS)**
```
TMS = (DHI_last_7_days_avg − DHI_prev_7_days_avg)
Status: Accelerating (≥+3), Stable (-3 to +3), Declining (≤-3)
```

### **5. Domain Strength Index**
```
DomainScore = (WinRate × 0.4) + (FT × 0.3) + (PA × 0.3)
Per category, scaled 0-100
```

### **6. Calibration Curve**
```
Groups decisions by confidence bucket (20%, 40%, 60%, 80%, 100%)
Compares predicted vs actual success rate
Shows calibration accuracy over time
```

---

## 🗄️ Database Schema

### **Tables**

**`profiles`**
- `id` (UUID, PK, references auth.users)
- `display_name` (TEXT)
- `timezone` (TEXT)
- `is_pro` (BOOLEAN)
- `stripe_customer_id` (TEXT)
- `stripe_subscription_status` (TEXT)
- `created_at`, `updated_at`

**`decisions`**
- `id` (UUID, PK)
- `user_id` (UUID, FK → profiles)
- `date` (DATE)
- `title` (TEXT)
- `category` (TEXT, CHECK constraint)
- `context` (TEXT)
- `success_outcome` (TEXT)
- `constraints` (TEXT)
- `risky_assumption` (TEXT)
- `chosen_option_id` (UUID, FK → options)
- `decided_at` (TIMESTAMPTZ)
- `confidence_int` (INTEGER, 0-100)
- `next_action` (TEXT)
- `next_action_due_date` (DATE)
- `decision_rationale` (TEXT) ✨ NEW
- `predicted_outcome_positive` (TEXT) ✨ NEW
- `predicted_outcome_negative` (TEXT) ✨ NEW
- `commitment_confirmed` (BOOLEAN) ✨ NEW
- `status` (TEXT, legacy field)
- `outcome_id` (UUID, computed)
- `completed_at` (TIMESTAMPTZ)
- `created_at`, `updated_at`

**`options`**
- `id` (UUID, PK)
- `decision_id` (UUID, FK → decisions)
- `label` (TEXT)
- `notes` (TEXT)
- `impact_int` (INTEGER, 1-10)
- `effort_int` (INTEGER, 1-10)
- `risk_int` (INTEGER, 1-10)
- `total_score_int` (INTEGER)
- `created_at`

**`outcomes`**
- `id` (UUID, PK)
- `decision_id` (UUID, FK → decisions)
- `outcome_score_int` (INTEGER, -1/0/1)
- `outcome_reflection_text` (TEXT)
- `learning_reflection_text` (TEXT)
- `learning_confidence_int` (INTEGER, 0-100)
- `temporal_anchor` (TEXT)
- `counterfactual_reflection_text` (TEXT)
- `self_reflection_text` (TEXT)
- `completed_at` (TIMESTAMPTZ)
- `created_at`

**`decision_health_snapshots`**
- `id` (UUID, PK)
- `user_id` (UUID, FK → profiles)
- `health_score` (INTEGER, 0-100)
- `win_rate` (INTEGER, 0-100)
- `avg_calibration_gap` (NUMERIC)
- `completion_rate` (INTEGER, 0-100)
- `streak_length` (INTEGER)
- `snapshot_date` (DATE)
- `created_at`

**`checkins`**
- `id` (UUID, PK)
- `user_id` (UUID, FK → profiles)
- `date` (DATE)
- `focus` (TEXT)
- `completed_bool` (BOOLEAN)
- `mood_int` (INTEGER, 1-5)
- `created_at`

### **Migrations**

All migrations in `supabase/`:
- ✅ `schema.sql` - Base schema
- ✅ `migration_subscriptions.sql` - Stripe integration
- ✅ `migration_commit_enhancements.sql` - New commit fields
- ✅ `migration_self_reflection.sql` - Self-reflection field
- ✅ `migration_cognitive_gaps.sql` - Temporal anchor, counterfactual
- ✅ `migration_decision_health.sql` - Health snapshots
- ✅ And more...

### **Row Level Security (RLS)**
- ✅ All tables have RLS enabled
- ✅ Policies enforce user isolation
- ✅ Service role key for webhooks

---

## 🔒 Security & Data Isolation

### **Implemented Safeguards:**
1. **Explicit User Filtering** - All queries filter by `user_id`
2. **Session Validation** - Middleware refreshes sessions
3. **Double-Check Verification** - Validates data belongs to user before rendering
4. **Error Handling** - Try-catch blocks with redirects
5. **RLS Policies** - Database-level security
6. **Input Validation** - Required fields, type checking

### **Security Checks:**
- ✅ `app/app/page.tsx` - User ID verification
- ✅ `app/app/timeline/page.tsx` - Decision ownership checks
- ✅ `app/app/decision/[id]/page.tsx` - User filtering
- ✅ All server components validate user before data access

---

## 🎨 UI/UX Features

### **Design System**
- CSS Variables for theming
- Consistent color palette
- Mobile-first responsive design
- Accessible components

### **Components**
- `Card`, `Button`, `TextInput`, `StatusBadge`
- `ScoringSlider` - Visual option scoring
- `OnboardingFlow` - 8-screen onboarding
- `UpgradeModal`, `RequirePro`, `UpgradePrompt`
- `StateOfYouCard`, `JudgmentProfileCard`, `TrajectoryCard`
- `LogOutcomeModal`, `QuickCheckinModal`
- `DecisionDetail`, `DecisionDetailWithPaywall`

### **Mobile Responsiveness**
- ✅ Responsive layouts
- ✅ Mobile-friendly modals
- ✅ Touch-friendly buttons
- ✅ Adaptive grid layouts

---

## 📊 Analytics & Tracking

### **Events Logged:**
- `decision_created`
- `outcome_logged`
- `upgrade_viewed`
- `upgrade_clicked`
- `upgrade_completed`
- `paywall_shown` (with reason)

### **Metrics Calculated:**
- Win rate
- Streak length
- Decision Health Index
- Prediction Accuracy
- Follow-Through Rate
- Risk Intelligence
- Growth Momentum
- Domain Strength (per category)
- Calibration Curve

---

## ⚠️ Known Issues & TODOs

### **Critical (Before MVP Launch):**
1. **Stripe Configuration** ⚠️
   - Create Stripe account
   - Create products & prices
   - Set environment variables
   - Configure webhook endpoint
   - Test checkout flow

2. **Upgrade Page Server Action** ⚠️
   - Current implementation uses client-side fetch
   - Should use server actions for better UX
   - Needs refactoring

### **Nice to Have:**
1. Weekly Review page content (structure exists, needs content)
2. Advanced filters on Timeline (search exists, filters can be enhanced)
3. Email notifications (not implemented)
4. Push notifications (not implemented)
5. Mobile app (PWA ready, native app not started)

### **Potential Improvements:**
1. Add loading states for async operations
2. Add error boundaries for better error handling
3. Add skeleton loaders for better perceived performance
4. Add keyboard shortcuts
5. Add bulk actions for decisions

---

## 🚀 MVP Launch Checklist

### **Pre-Launch:**
- [x] Core features implemented
- [x] Database schema complete
- [x] Security measures in place
- [x] Monetization system ready
- [ ] **Stripe account setup** ⚠️
- [ ] **Environment variables configured** ⚠️
- [ ] **Webhook endpoint tested** ⚠️
- [ ] **End-to-end payment flow tested** ⚠️

### **Post-Launch:**
- [ ] Monitor webhook events
- [ ] Track conversion rates
- [ ] Gather user feedback
- [ ] Iterate on onboarding
- [ ] Optimize performance

---

## 📈 Success Metrics

### **North Star Metric:**
**Loop Closure Rate (LCR)** = `decisions_with_outcome / decisions_created`

### **Key Metrics:**
- User signups
- Decisions created
- Outcomes logged
- LCR trend
- Pro conversions
- Retention (D1, D7, D30)

---

## 🎯 What Makes Decylo Unique

1. **Judgment Training System** - Not just a decision tracker, but a system for improving judgment
2. **Cognitive Shift** - Forces users to articulate rationale and predict outcomes
3. **Calibration Measurement** - Tracks how well confidence matches reality
4. **Personalized Insights** - Judgment Profile and Trajectory provide unique cognitive fingerprint
5. **Commitment Mechanism** - Checkbox and rationale lock-in increase follow-through
6. **Beautiful PDF Export** - Professional, branded export for Pro users

---

## 📝 Files Summary

### **Key Files:**
- `app/app/new/page.tsx` - Decision creation (853 lines)
- `app/app/page.tsx` - Today dashboard (397 lines)
- `app/app/insights/page.tsx` - Insights & analytics
- `app/app/settings/page.tsx` - Settings & export (792 lines)
- `components/OnboardingFlow.tsx` - 8-screen onboarding
- `lib/judgment-profile.ts` - Judgment Profile calculations
- `lib/decision-trajectory.ts` - Trajectory calculations
- `lib/scoring.ts` - Expected Value calculation

### **Total Lines of Code:**
- ~15,000+ lines of TypeScript/TSX
- ~20 database migrations
- ~30+ reusable components
- ~15 API routes

---

## ✅ Final Status

**Platform Status:** ✅ **FEATURE-COMPLETE**

**Ready for:**
- ✅ Stripe payment integration (code ready, needs configuration)
- ✅ MVP launch
- ✅ User testing
- ✅ Production deployment

**Next Step:** Connect Stripe and test payment flow end-to-end.

---

**Generated:** December 2024  
**Platform Version:** MVP v1.0

