import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'
import { logSecurityEvent } from '@/lib/security-logging'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export async function POST(request: NextRequest) {
  // Rate limiting: 5 requests per minute per IP
  const clientIP = getClientIP(request)
  const rateLimit = checkRateLimit(`checkout:${clientIP}`, {
    windowMs: 60000, // 1 minute
    maxRequests: 5,
  })

  if (!rateLimit.allowed) {
    logSecurityEvent('rate_limit_exceeded', {
      endpoint: '/api/stripe/checkout',
      ip: clientIP,
    })
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(rateLimit.resetTime),
        },
      }
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { priceId } = await request.json()

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID required' }, { status: 400 })
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    const stripe = getStripe()

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${request.nextUrl.origin}/app/settings?success=true`,
      cancel_url: `${request.nextUrl.origin}/app/settings?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
      },
    })

    logSecurityEvent('checkout_session_created', {
      userId: user.id,
      priceId,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)

    // Enhanced Stripe error handling
    let statusCode = 500
    let errorMessage = 'Payment processing error. Please try again.'

    if (error.type) {
      switch (error.type) {
        case 'StripeCardError':
          statusCode = 400
          errorMessage = error.message || 'Your card was declined. Please try a different payment method.'
          logSecurityEvent('stripe_card_error', {
            userId: user?.id,
            errorCode: error.code,
          })
          break
        case 'StripeRateLimitError':
          statusCode = 429
          errorMessage = 'Too many requests. Please try again in a moment.'
          break
        case 'StripeInvalidRequestError':
          statusCode = 400
          errorMessage = error.message || 'Invalid request. Please check your information.'
          logSecurityEvent('stripe_invalid_request', {
            userId: user?.id,
            errorCode: error.code,
          })
          break
        case 'StripeAPIError':
          statusCode = 502
          errorMessage = 'Payment service temporarily unavailable. Please try again later.'
          break
        case 'StripeConnectionError':
          statusCode = 503
          errorMessage = 'Unable to connect to payment service. Please try again later.'
          break
        case 'StripeAuthenticationError':
          statusCode = 500
          errorMessage = 'Payment service configuration error. Please contact support.'
          logSecurityEvent('stripe_auth_error', {
            userId: user?.id,
          })
          break
        default:
          errorMessage = error.message || 'An unexpected error occurred. Please try again.'
      }
    } else if (error.message) {
      errorMessage = error.message
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}

