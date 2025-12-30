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

export async function GET(request: NextRequest) {
  // Rate limiting: 10 requests per minute per IP
  const clientIP = getClientIP(request)
  const rateLimit = checkRateLimit(`portal:${clientIP}`, {
    windowMs: 60000, // 1 minute
    maxRequests: 10,
  })

  if (!rateLimit.allowed) {
    logSecurityEvent('rate_limit_exceeded', {
      endpoint: '/api/stripe/portal',
      ip: clientIP,
    })
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }

    const stripe = getStripe()

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${request.nextUrl.origin}/app/settings`,
    })

    logSecurityEvent('portal_session_created', {
      userId: user.id,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe portal error:', error)

    // Enhanced Stripe error handling
    let statusCode = 500
    let errorMessage = 'Unable to access billing portal. Please try again.'

    if (error.type) {
      switch (error.type) {
        case 'StripeAPIError':
          statusCode = 502
          errorMessage = 'Billing service temporarily unavailable. Please try again later.'
          break
        case 'StripeConnectionError':
          statusCode = 503
          errorMessage = 'Unable to connect to billing service. Please try again later.'
          break
        case 'StripeInvalidRequestError':
          statusCode = 400
          errorMessage = error.message || 'Invalid request. Please contact support.'
          logSecurityEvent('stripe_portal_error', {
            userId: user?.id,
            errorCode: error.code,
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

