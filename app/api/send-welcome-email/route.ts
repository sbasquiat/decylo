import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendProductEmail, generateWelcomeEmail } from '@/lib/emails'

/**
 * API route to send welcome email after signup
 * Call this after user signs up (from client or server)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if welcome email was already sent
    const { data: existingLog } = await supabase
      .from('email_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('email_type', 'welcome')
      .limit(1)

    if (existingLog && existingLog.length > 0) {
      return NextResponse.json({ 
        message: 'Welcome email already sent',
        sent: false 
      })
    }

    // Send welcome email
    const emailData = generateWelcomeEmail(user.user_metadata?.display_name || undefined)
    const sent = await sendProductEmail(
      user.id,
      user.email,
      'welcome',
      emailData,
      null,
      30 // Don't resend within 30 days
    )

    return NextResponse.json({
      message: sent ? 'Welcome email sent' : 'Welcome email not sent',
      sent,
    })
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

