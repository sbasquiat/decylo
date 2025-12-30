/**
 * Security event logging
 * Logs security-relevant events for monitoring and auditing
 */

interface SecurityEvent {
  type: string
  data?: Record<string, any>
  timestamp?: number
  ip?: string
  userAgent?: string
}

/**
 * Log a security event
 * In production, this should send to a logging service (Sentry, LogRocket, etc.)
 */
export function logSecurityEvent(
  eventType: string,
  data?: Record<string, any>,
  request?: Request
): void {
  const event: SecurityEvent = {
    type: eventType,
    data,
    timestamp: Date.now(),
  }

  // Extract IP and user agent from request if provided
  if (request) {
    const forwarded = request.headers.get('x-forwarded-for')
    event.ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown'
    event.userAgent = request.headers.get('user-agent') || 'unknown'
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY EVENT]', event)
  }

  // In production, you would send this to:
  // - Sentry (for error tracking)
  // - LogRocket (for session replay)
  // - Your own logging service
  // - Database audit log table

  // Example: Send to external service
  // if (process.env.NODE_ENV === 'production') {
  //   fetch('https://your-logging-service.com/events', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(event),
  //   }).catch(err => console.error('Failed to log security event:', err))
  // }
}

/**
 * Log authentication events
 */
export function logAuthEvent(
  eventType: 'login_success' | 'login_failure' | 'logout' | 'signup' | 'password_reset_request' | 'password_reset_success',
  data?: Record<string, any>,
  request?: Request
): void {
  logSecurityEvent(`auth_${eventType}`, data, request)
}

/**
 * Log rate limiting events
 */
export function logRateLimitEvent(
  endpoint: string,
  ip: string,
  request?: Request
): void {
  logSecurityEvent('rate_limit_exceeded', { endpoint, ip }, request)
}

