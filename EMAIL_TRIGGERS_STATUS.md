# Email Triggers & Links Status

## ✅ All Triggers Functional

### 1. Welcome Email
- **Trigger**: `app/auth/callback/route.ts` - After email verification
- **Status**: ✅ Functional
- **Logic**: Checks `welcome_email_sent_at`, sends email, logs in `email_logs`
- **Link**: `/app/new` ✅ (route exists)

### 2. First Outcome Email
- **Trigger**: `components/LogOutcomeModal.tsx` & `components/QuickCheckinModal.tsx`
- **Status**: ✅ Functional
- **Logic**: After outcome saved, checks if `outcomeCount === 1`, sends via `triggerFirstOutcomeEmail()`
- **Link**: `/app` ✅ (route exists, updated from `/app/insights`)

### 3. Pro Moment Email
- **Trigger**: `components/LogOutcomeModal.tsx` & `components/QuickCheckinModal.tsx`
- **Status**: ✅ Functional
- **Logic**: After outcome saved, checks if `outcomeCount === 3` and user not Pro, sends via `triggerProMomentEmail()`
- **Link**: `/app/settings` ✅ (route exists, updated from `/pricing`)

### 4. Outcome Due Today
- **Trigger**: `app/api/cron/outcome-due/route.ts` - Daily cron (9 AM UTC)
- **Status**: ✅ Functional
- **Logic**: Groups decisions by user, sends daily digest
- **Link**: `/app` ✅ (route exists)

### 5. Outcome Overdue
- **Trigger**: `app/api/cron/outcome-overdue/route.ts` - Daily cron (10 AM UTC)
- **Status**: ✅ Functional
- **Logic**: Finds decisions overdue >7 days, sends stronger nudge
- **Link**: `/app/decision/{id}?logOutcome=true` ✅ (route exists)

### 6. Weekly Review
- **Trigger**: `app/api/cron/weekly-review/route.ts` - Weekly cron (Sunday 6 PM UTC)
- **Status**: ✅ Functional
- **Logic**: Sends weekly summary to users with decisions this week
- **Link**: `/app` ✅ (route exists, updated from `/app/review`)

### 7. Streak Save
- **Trigger**: `app/api/cron/streak-save/route.ts` - Daily cron (6 PM UTC)
- **Status**: ✅ Functional
- **Logic**: Finds users with streaks at risk (last activity 24-48h ago)
- **Link**: `/app` ✅ (route exists)

## ✅ All Email Links Functional

All email links now point to existing routes:

| Email Type | CTA Link | Status |
|------------|----------|--------|
| Welcome | `/app/new` | ✅ Exists |
| First Outcome | `/app` | ✅ Exists |
| Pro Moment | `/app/settings` | ✅ Exists |
| Outcome Due Today | `/app` | ✅ Exists |
| Outcome Overdue | `/app/decision/{id}?logOutcome=true` | ✅ Exists |
| Weekly Review | `/app` | ✅ Exists |
| Streak Save | `/app` | ✅ Exists |
| Preferences/Unsubscribe | `/app/settings/email-preferences` | ✅ Exists |

## Email URL Configuration

- **Production Domain**: All emails use `https://decylo.com` (via `getEmailAppUrl()`)
- **No Localhost**: Helper function ensures emails never use localhost
- **Fallback**: Defaults to `https://decylo.com` if env var not set or contains localhost

## Cron Job Configuration

All cron jobs configured in `vercel.json`:
- Outcome Due: `0 9 * * *` (9 AM UTC daily)
- Outcome Overdue: `0 10 * * *` (10 AM UTC daily)
- Streak Save: `0 18 * * *` (6 PM UTC daily)
- Weekly Review: `0 18 * * 0` (Sunday 6 PM UTC)

## Testing

To test triggers manually:
1. **Welcome**: Sign up new user → verify email → check inbox
2. **First Outcome**: Log first outcome → check inbox
3. **Pro Moment**: Log 3rd outcome (as free user) → check inbox
4. **Cron Jobs**: Trigger manually via API or wait for scheduled time

All triggers are functional and all links point to working routes! ✅

