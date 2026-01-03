import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

function getSupabaseAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase admin credentials not configured')
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const stripe = getStripe()
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const userId = session.metadata?.supabase_user_id

        if (userId && customerId) {
          // Get subscription to check status
          const subscriptionId = session.subscription as string
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)

          const supabaseAdmin = getSupabaseAdmin()
          await updateUserSubscription(supabaseAdmin, userId, customerId, subscription)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const stripe = getStripe()
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by customer ID
        const supabaseAdmin = getSupabaseAdmin()
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()

        if (profileError) {
          console.error('Error fetching profile in webhook:', profileError)
          // Don't return error - webhook should return 200 to prevent retries
          break
        }

        if (profile) {
          await updateUserSubscription(supabaseAdmin, profile.id, customerId, subscription)
        } else {
          console.warn('Webhook: No profile found for customer', customerId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const supabaseAdmin = getSupabaseAdmin()
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle()

        if (profileError) {
          console.error('Error fetching profile in webhook (deleted):', profileError)
          // Don't return error - webhook should return 200 to prevent retries
          break
        }

        if (profile) {
          await supabaseAdmin
            .from('profiles')
            .update({
              is_pro: false,
              stripe_subscription_status: 'canceled',
            })
            .eq('id', profile.id)
        } else {
          console.warn('Webhook (deleted): No profile found for customer', customerId)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // CRITICAL: Return 200 OK with proper JSON response
    // Stripe requires a 200 status code, not a redirect
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    // Still return 200 to prevent Stripe from retrying
    // Log the error for debugging
    return NextResponse.json({ error: error.message }, { status: 200 })
  }
}

async function updateUserSubscription(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  customerId: string,
  subscription: Stripe.Subscription
) {
  const isActive =
    subscription.status === 'active' || subscription.status === 'trialing'

  // Get current profile to check if this is a new upgrade
  const { data: currentProfile } = await supabaseAdmin
    .from('profiles')
    .select('is_pro, display_name')
    .eq('id', userId)
    .single()

  const wasPro = currentProfile?.is_pro || false
  const isNewUpgrade = !wasPro && isActive

  await supabaseAdmin
    .from('profiles')
    .update({
      is_pro: isActive,
      stripe_customer_id: customerId,
      stripe_subscription_status: subscription.status,
    })
    .eq('id', userId)

  // Log upgrade completion
  if (isActive) {
    console.log('upgrade_completed', { 
      user_id: userId, 
      subscription_status: subscription.status,
      was_pro: wasPro,
      is_new_upgrade: isNewUpgrade
    })
  }

  // Log update result
  const { data: updatedProfile, error: updateError } = await supabaseAdmin
    .from('profiles')
    .select('is_pro, stripe_subscription_status')
    .eq('id', userId)
    .single()

  if (updateError) {
    console.error('Error verifying subscription update:', updateError)
  } else {
    console.log('Subscription updated:', {
      user_id: userId,
      is_pro: updatedProfile?.is_pro,
      status: updatedProfile?.stripe_subscription_status
    })
  }

  // Send upgrade receipt email if this is a new upgrade
  if (isNewUpgrade) {
    try {
      // Get user email from auth
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
      const user = users?.find(u => u.id === userId)
      
      if (!user?.email) {
        console.warn('No email found for user', userId)
        return
      }

      // Check email preferences manually (webhook uses service role, no user session)
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email_preferences')
        .eq('id', userId)
        .single()

      // Upgrade receipts should always be sent (critical transactional email)
      // But respect user preference if they explicitly disabled it
      const emailPrefs = profile?.email_preferences as any
      const shouldSend = emailPrefs?.welcome !== false // Use welcome preference as proxy, or default to true

      if (!shouldSend) {
        console.log('Upgrade receipt email skipped - user preference disabled')
        return
      }

      // Check idempotency (don't resend within 30 days)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 30)
      const { data: existingLog } = await supabaseAdmin
        .from('email_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('email_type', 'upgrade_receipt')
        .is('target_id', null)
        .gte('sent_at', cutoffDate.toISOString())
        .limit(1)

      if (existingLog && existingLog.length > 0) {
        console.log('Upgrade receipt email skipped - already sent recently')
        return
      }

      // Send email directly (bypass sendProductEmail since we're in webhook context)
      const { sendEmail, generateUpgradeReceiptEmail } = await import('@/lib/emails')
      const { logEmailSent } = await import('@/lib/emails-utils')
      
      const emailData = generateUpgradeReceiptEmail(currentProfile?.display_name || undefined)
      const emailToSend = {
        ...emailData,
        to: user.email,
      }

      const sent = await sendEmail(emailToSend)

      if (sent) {
        // Log with service role
        await logEmailSent(userId, 'upgrade_receipt', null, process.env.SUPABASE_SERVICE_ROLE_KEY!)
        console.log('Upgrade receipt email sent successfully to', user.email)
      } else {
        console.error('Failed to send upgrade receipt email to', user.email)
      }
    } catch (error) {
      console.error('Error sending upgrade receipt email:', error)
      // Don't fail webhook if email fails
    }
  }
}

