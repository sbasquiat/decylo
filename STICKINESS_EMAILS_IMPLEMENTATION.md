# Stickiness Emails Implementation

## Overview
Implemented 7 high-impact stickiness emails using the provided Decylo dark, clean aesthetic templates.

## Email Types Implemented

### 1. Welcome Email ✅
- **Trigger**: After first verified login (in `app/auth/callback/route.ts`)
- **Template**: `generateWelcomeEmailHTML()` in `lib/email-templates.ts`
- **Subject**: "Welcome to Decylo — your first loop starts now"
- **Status**: Implemented and integrated

### 2. Outcome Due Today (Daily Digest) ✅
- **Trigger**: Daily cron job (`/api/cron/outcome-due`)
- **Template**: `generateOutcomeDueTodayEmailHTML()` 
- **Subject**: "Outcome due today: close the loop"
- **Status**: Implemented - groups decisions by user, sends one digest per user

### 3. Outcome Overdue ✅
- **Trigger**: TBD (can be added to cron or triggered on decision view)
- **Template**: `generateOutcomeOverdueEmailHTML()`
- **Subject**: "You're leaving learning on the table"
- **Status**: Template ready, needs trigger logic

### 4. Weekly Review ✅
- **Trigger**: Weekly cron job (`/api/cron/weekly-review`) - Sunday 6 PM UTC
- **Template**: `generateWeeklyReviewEmailHTML()`
- **Subject**: "Weekly Review: your judgment is trending {trend_word}"
- **Status**: Implemented - TODO: Add DHI, calibration gap, loop closure rate data

### 5. Streak Save ✅
- **Trigger**: TBD (needs streak tracking logic)
- **Template**: `generateStreakSaveEmailHTML()`
- **Subject**: "Don't break the streak — log one outcome"
- **Status**: Template ready, needs trigger logic

### 6. First Outcome Celebration ✅
- **Trigger**: TBD (when user logs first outcome)
- **Template**: `generateFirstOutcomeEmailHTML()`
- **Subject**: "That's your first loop closed"
- **Status**: Template ready, needs trigger in outcome logging flow

### 7. Pro Moment ✅
- **Trigger**: TBD (after 3rd outcome logged)
- **Template**: `generateProMomentEmailHTML()`
- **Subject**: "Your Decision Health is forming — unlock the full model"
- **Status**: Template ready, needs trigger in outcome logging flow

## Files Created/Modified

### New Files
- `lib/email-templates.ts` - All 7 email HTML templates with base wrapper

### Modified Files
- `lib/emails.ts` - Updated email generation functions to use new templates
- `lib/emails-utils.ts` - Added new email types to type definitions
- `lib/db/types.ts` - Updated EmailLog interface with new email types
- `app/api/cron/outcome-due/route.ts` - Updated to use daily digest format
- `app/api/cron/weekly-review/route.ts` - Updated to use new weekly review template
- `app/auth/callback/route.ts` - Updated to log welcome email in email_logs
- `supabase/migration_email_system.sql` - Updated comment with new email types

## Next Steps (Triggers to Implement)

### 1. Outcome Overdue Trigger
Add to decision detail page or create separate cron:
```typescript
// When viewing decision that's overdue
if (decision.decided_at && !outcome && daysSinceDecided > 7) {
  await sendProductEmail(userId, email, 'outcome_overdue', ...)
}
```

### 2. First Outcome Trigger
Add to outcome logging flow:
```typescript
// In outcome logging API/component
const outcomeCount = await getOutcomeCount(userId)
if (outcomeCount === 1) {
  await sendProductEmail(userId, email, 'first_outcome', ...)
}
```

### 3. Pro Moment Trigger
Add to outcome logging flow:
```typescript
// In outcome logging API/component
const outcomeCount = await getOutcomeCount(userId)
if (outcomeCount === 3 && !isPro) {
  await sendProductEmail(userId, email, 'pro_moment', ...)
}
```

### 4. Streak Save Trigger
Add to streak tracking logic:
```typescript
// Daily check for users with active streaks at risk
if (streak > 0 && lastActivity > 24h ago && lastActivity < 48h ago) {
  await sendProductEmail(userId, email, 'streak_save', ...)
}
```

## Email Template Features

All emails use:
- Dark background (#070B12, #0B1220)
- Blue CTA button (#4C7DFF)
- Subtle borders (rgba(255,255,255,0.08))
- Calm, direct tone
- One CTA max
- Preferences/unsubscribe links in footer
- Responsive design

## Testing

1. **Welcome Email**: Sign up new user → verify email → check inbox
2. **Outcome Due Today**: Create decision → mark as decided → wait for cron or trigger manually
3. **Weekly Review**: Make decisions this week → wait for Sunday cron or trigger manually
4. **Other emails**: Implement triggers as needed

## Database

All email types are logged in `email_logs` table for idempotency. The migration comment has been updated to include all new email types.

