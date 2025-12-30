/**
 * Retention nudge utilities
 * Handles timezone-aware nudge logic
 */

/**
 * Get current date in user's timezone
 */
export function getTodayInTimezone(timezone: string = 'UTC'): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(now)
}

/**
 * Get current hour in user's timezone
 */
export function getCurrentHourInTimezone(timezone: string = 'UTC'): number {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  })
  return parseInt(formatter.format(now), 10)
}

/**
 * Get current minutes in user's timezone
 */
export function getCurrentMinutesInTimezone(timezone: string = 'UTC'): number {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    minute: 'numeric',
  })
  return parseInt(formatter.format(now), 10)
}

/**
 * Get current day of week in user's timezone (0 = Sunday, 6 = Saturday)
 */
export function getCurrentDayOfWeekInTimezone(timezone: string = 'UTC'): number {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
  })
  const dayName = formatter.format(now)
  const dayMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  }
  return dayMap[dayName] || 0
}

/**
 * Get ISO week string (YYYY-WW format)
 */
export function getISOWeekString(date: Date, timezone: string = 'UTC'): string {
  // Get date in timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const dateStr = formatter.format(date)
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)

  // Calculate ISO week
  const d2 = new Date(d)
  d2.setHours(0, 0, 0, 0)
  d2.setDate(d2.getDate() + 4 - (d2.getDay() || 7))
  const yearStart = new Date(d2.getFullYear(), 0, 1)
  const week = Math.ceil(((d2.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  const weekYear = d2.getFullYear()

  return `${weekYear}-${week.toString().padStart(2, '0')}`
}

/**
 * Get yesterday's date in user's timezone
 */
export function getYesterdayInTimezone(timezone: string = 'UTC'): string {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(yesterday)
}

