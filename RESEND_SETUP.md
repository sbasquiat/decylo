# Resend Email Setup Guide

## Quick Start

1. **Get your Resend API Key**
   - Sign up at [resend.com](https://resend.com)
   - Go to API Keys section
   - Create a new API key
   - Copy the key (starts with `re_`)

2. **Verify your domain** (required for production)
   - In Resend dashboard, go to Domains
   - Add your domain (e.g., `yourdomain.com`)
   - Add the DNS records Resend provides to your domain's DNS
   - Wait for verification (usually a few minutes)

3. **Set environment variables**

   Create a `.env.local` file in the root directory:

   ```bash
   # Resend Configuration
   RESEND_API_KEY=re_your_actual_api_key_here
   RESEND_FROM_EMAIL=Decylo <noreply@yourdomain.com>
   
   # App URL (for email links)
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

4. **For development/testing**
   - You can use Resend's test domain: `onboarding@resend.dev`
   - Or use your verified domain

## Email Types

The app sends 4 types of emails:

1. **Decision Reminder** - When a decision's due date arrives
2. **Weekly Review** - When weekly review is ready
3. **Judgment Shift Milestone** - When Decision Health crosses thresholds (50, 65, 80)
4. **Streak Protection** - When user is about to break their streak

## Testing

To test email sending, you can:

1. Use Resend's test mode (emails go to a test inbox)
2. Send to your own email address
3. Check Resend dashboard for delivery status

## Troubleshooting

- **Emails not sending**: Check that `RESEND_API_KEY` is set correctly
- **Domain verification errors**: Make sure DNS records are correct
- **From address errors**: Ensure the domain in `RESEND_FROM_EMAIL` matches your verified domain in Resend

## Production Checklist

- [ ] Domain verified in Resend
- [ ] `RESEND_API_KEY` set in production environment
- [ ] `RESEND_FROM_EMAIL` uses your verified domain
- [ ] `NEXT_PUBLIC_APP_URL` points to production URL
- [ ] Test email sending in production

