import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, generateWelcomeEmail } from '@/lib/emails'

/**
 * Auth callback route for Supabase email verification
 * Handles the OAuth callback and email verification code exchange
 * Sends welcome email after successful verification
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/app'

  if (code) {
    const supabase = await createClient()
    
    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      // Redirect to signin with error
      const errorUrl = new URL('/signin', requestUrl.origin)
      errorUrl.searchParams.set('error', 'verification_failed')
      return NextResponse.redirect(errorUrl)
    }

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('Error getting user after verification:', userError)
      // Still redirect to app - don't block login
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }

    // Check if welcome email was already sent
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('welcome_email_sent_at, display_name')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      // Continue anyway - don't block login
    } else if (profile && !profile.welcome_email_sent_at && user.email) {
      // Send welcome email if not already sent
      try {
        const emailData = generateWelcomeEmail(profile.display_name || undefined)
        const emailToSend = {
          ...emailData,
          to: user.email,
        }

        const sent = await sendEmail(emailToSend)
        
        // Also log in email_logs for idempotency
        if (sent) {
          const { logEmailSent } = await import('@/lib/emails-utils')
          await logEmailSent(user.id, 'welcome', null)
        }

        if (sent) {
          // Update profile to mark welcome email as sent
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ welcome_email_sent_at: new Date().toISOString() })
            .eq('id', user.id)

          if (updateError) {
            console.error('Error updating welcome_email_sent_at:', updateError)
            // Don't fail - email was sent, just logging failed
          } else {
            console.log('Welcome email sent and logged for user:', user.id)
          }
        } else {
          console.warn('Welcome email failed to send for user:', user.id)
          // Don't block login - allow retry later
        }
      } catch (error) {
        console.error('Error sending welcome email:', error)
        // Don't block login - email send failure should not prevent authentication
      }
    }

    // Redirect to app (or next URL)
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  // No code provided - redirect to signin
  return NextResponse.redirect(new URL('/signin', requestUrl.origin))
}

