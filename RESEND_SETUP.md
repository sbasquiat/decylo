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

## Current Setup Status

✅ **API Key**: Configured  
✅ **Domain**: `decylo.com` verified in Resend  
✅ **From Email**: `hello@decylo.com`  
✅ **Ready for**: Production use  

**Everything is configured and ready to send emails!**

Your setup is complete:
- Domain verified in Resend
- From address configured: `Decylo <hello@decylo.com>`
- All 6 email templates ready to use
- Production-ready configuration

## Email Types

The app sends 6 types of emails:

1. **Welcome Email** - Sent on signup
2. **Outcome Reminder** - When decision due_date or temporal_anchor window reached
3. **Inactivity Nudge** - After 48h of no activity
4. **First Insight Unlocked** - When first Judgment Profile is generated
5. **Weekly Review** - Weekly summary email
6. **Upgrade Receipt** - When user upgrades to Pro

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

- [x] Domain verified in Resend (`decylo.com`)
- [x] `RESEND_API_KEY` configured
- [x] `RESEND_FROM_EMAIL` uses verified domain (`hello@decylo.com`)
- [ ] `NEXT_PUBLIC_APP_URL` points to production URL (update when deploying)
- [ ] Test email sending in production

**Status**: Ready for production! Just make sure to set `NEXT_PUBLIC_APP_URL` to your production URL when deploying.

