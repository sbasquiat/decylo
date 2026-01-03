# Welcome Email Implementation

## Overview
Welcome email is sent automatically after user verifies their email address via the auth callback route.

## Files Created/Modified

### 1. Database Migration
**File:** `supabase/migration_welcome_email.sql`
- Adds `welcome_email_sent_at TIMESTAMPTZ NULL` column to `profiles` table
- Creates index for faster lookups
- Run this in Supabase SQL editor

### 2. Auth Callback Route
**File:** `app/auth/callback/route.ts`
- Handles email verification code exchange
- Sends welcome email after successful verification
- Updates `welcome_email_sent_at` timestamp
- Idempotent: only sends once per user
- Non-blocking: email failures don't prevent login

### 3. TypeScript Types
**File:** `lib/db/types.ts`
- Updated `Profile` interface to include `welcome_email_sent_at?: string | null`

### 4. Email Functions (Already Exist)
**File:** `lib/emails.ts`
- `generateWelcomeEmail()` - Generates welcome email HTML
- `sendEmail()` - Sends email via Resend API

## Environment Variables Required

These should already be set (from previous setup):
- `RESEND_API_KEY` - Your Resend API key
- `RESEND_FROM_EMAIL` - Set to `Decylo <hello@decylo.com>`
- `NEXT_PUBLIC_APP_URL` - Set to `https://decylo.com` (or `https://www.decylo.com`)

## How It Works

1. User signs up and receives verification email from Supabase
2. User clicks verification link → redirects to `/auth/callback?code=...`
3. Callback route:
   - Exchanges code for session
   - Gets authenticated user
   - Checks if `welcome_email_sent_at` is null
   - If null, sends welcome email via Resend
   - Updates `welcome_email_sent_at` timestamp
   - Redirects to `/app`

## Idempotency

- Email is only sent if `welcome_email_sent_at` is `NULL`
- After sending, timestamp is set to prevent duplicates
- Safe to call multiple times - will only send once

## Error Handling

- Email send failures are logged but don't block login
- Database update failures are logged but don't block login
- User can always log in even if email fails
- Errors are logged for debugging

## Testing

1. **Run migration:**
   ```sql
   -- In Supabase SQL editor
   -- Run: supabase/migration_welcome_email.sql
   ```

2. **Test flow:**
   - Sign up a new user
   - Verify email via link
   - Check that welcome email is received
   - Check database: `welcome_email_sent_at` should be set
   - Try verifying again - should NOT send duplicate email

3. **Verify in database:**
   ```sql
   SELECT id, email, welcome_email_sent_at 
   FROM profiles 
   WHERE id = '<user_id>';
   ```

4. **Check logs:**
   - Vercel logs should show "Welcome email sent and logged for user: [id]"
   - Resend dashboard should show email delivery

## Email Content

The welcome email:
- Subject: "Welcome to Decylo"
- From: `hello@decylo.com` (via RESEND_FROM_EMAIL)
- Matches Decylo aesthetic (dark, minimal, personal)
- Includes CTA to open app

## Next Steps

1. Run the database migration in Supabase
2. Deploy the code changes
3. Test with a new user signup
4. Verify email is received
5. Check database timestamp is set

