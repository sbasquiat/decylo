/**
 * Email URL utilities
 * Ensures email links always use production domain, never localhost
 */

/**
 * Get the production app URL for emails
 * Never returns localhost - always uses production domain
 */
export function getEmailAppUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL
  
  // If env var is set and not localhost, use it
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl
  }
  
  // Always default to production domain
  return 'https://decylo.com'
}

/**
 * Build a full URL for email links
 */
export function buildEmailUrl(path: string): string {
  const baseUrl = getEmailAppUrl()
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

