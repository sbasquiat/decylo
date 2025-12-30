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

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
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
    console.log('upgrade_completed', { user_id: userId, subscription_status: subscription.status })
  }
}

