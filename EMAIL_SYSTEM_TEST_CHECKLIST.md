# Email System Test Checklist

## Setup Checklist

- [ ] Run database migration: `supabase/migration_email_system.sql` in Supabase SQL editor
- [ ] Set `CRON_SECRET` environment variable in Vercel (for cron route authentication)
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` in Vercel (for cron jobs to access admin functions)
- [ ] Verify `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are set
- [ ] Configure Vercel cron jobs in `vercel.json` (or Vercel dashboard)

## Manual Tests

### 1. Welcome Email
- [ ] Sign up a new user
- [ ] Call `/api/send-welcome-email` POST endpoint (or trigger from signup flow)
- [ ] Verify email received at user's email address
- [ ] Verify email_logs entry created
- [ ] Try calling again - should skip (idempotency check)

### 2. Email Preferences
- [ ] Navigate to `/app/settings/email-preferences`
- [ ] Toggle each preference on/off
- [ ] Save preferences
- [ ] Verify preferences saved in database

### 3. Outcome Reminder Cron
- [ ] Create a decision and mark it as decided (has `decided_at` and `chosen_option_id`)
- [ ] Ensure no outcome exists for that decision
- [ ] Manually call `/api/cron/outcome-due` with `Authorization: Bearer <CRON_SECRET>`
- [ ] Verify email sent to decision owner
- [ ] Verify email_logs entry created
- [ ] Call again - should skip (idempotency)

### 4. Weekly Review Cron
- [ ] Create decisions this week for a user
- [ ] Manually call `/api/cron/weekly-review` with `Authorization: Bearer <CRON_SECRET>`
- [ ] Verify email sent to users who made decisions this week
- [ ] Verify email_logs entry created
- [ ] Call again - should skip (idempotency)

### 5. Preference Enforcement
- [ ] Disable "reminders" preference for a user
- [ ] Trigger outcome reminder cron
- [ ] Verify email NOT sent to that user
- [ ] Re-enable preference
- [ ] Trigger again - should send

### 6. Idempotency
- [ ] Send an email (any type)
- [ ] Check email_logs table for entry
- [ ] Try to send same email again within 7 days
- [ ] Verify second email NOT sent

## Production Deployment

- [ ] Deploy to Vercel
- [ ] Configure cron jobs in Vercel dashboard (if not using vercel.json)
- [ ] Set all environment variables in Vercel
- [ ] Test cron jobs in production
- [ ] Monitor Resend dashboard for delivery rates
- [ ] Monitor email_logs table for spam prevention

## Notes

- Auth emails (signup confirmation, password reset) use Supabase SMTP (configure in Supabase dashboard)
- Product emails use Resend API
- Cron jobs run with service role key for admin access
- All emails respect user preferences
- All emails are logged for idempotency

