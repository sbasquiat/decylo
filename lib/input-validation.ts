/**
 * Input validation utilities
 * Provides validation functions for user inputs
 */

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate text input
 */
export function validateText(
  value: string,
  options: {
    minLength?: number
    maxLength?: number
    required?: boolean
    pattern?: RegExp
    patternMessage?: string
  } = {}
): ValidationResult {
  const { minLength = 0, maxLength = 10000, required = false, pattern, patternMessage } = options

  // Check required
  if (required && (!value || value.trim().length === 0)) {
    return { valid: false, error: 'This field is required' }
  }

  // Skip other checks if empty and not required
  if (!value || value.trim().length === 0) {
    return { valid: true }
  }

  // Check min length
  if (value.trim().length < minLength) {
    return {
      valid: false,
      error: `Must be at least ${minLength} character${minLength !== 1 ? 's' : ''}`,
    }
  }

  // Check max length
  if (value.trim().length > maxLength) {
    return {
      valid: false,
      error: `Must be no more than ${maxLength} character${maxLength !== 1 ? 's' : ''}`,
    }
  }

  // Check pattern
  if (pattern && !pattern.test(value)) {
    return { valid: false, error: patternMessage || 'Invalid format' }
  }

  return { valid: true }
}

/**
 * Validate email
 */
export function validateEmail(email: string, required: boolean = false): ValidationResult {
  if (required && (!email || email.trim().length === 0)) {
    return { valid: false, error: 'Email is required' }
  }

  if (!email || email.trim().length === 0) {
    return { valid: true }
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' }
  }

  // Check length
  if (email.length > 254) {
    return { valid: false, error: 'Email is too long' }
  }

  return { valid: true }
}

/**
 * Validate number
 */
export function validateNumber(
  value: number | string,
  options: {
    min?: number
    max?: number
    required?: boolean
    integer?: boolean
  } = {}
): ValidationResult {
  const { min, max, required = false, integer = false } = options

  // Check required
  if (required && (value === null || value === undefined || value === '')) {
    return { valid: false, error: 'This field is required' }
  }

  // Skip other checks if empty and not required
  if (value === null || value === undefined || value === '') {
    return { valid: true }
  }

  // Convert to number
  const num = typeof value === 'string' ? parseFloat(value) : value

  // Check if valid number
  if (isNaN(num)) {
    return { valid: false, error: 'Must be a valid number' }
  }

  // Check integer
  if (integer && !Number.isInteger(num)) {
    return { valid: false, error: 'Must be a whole number' }
  }

  // Check min
  if (min !== undefined && num < min) {
    return { valid: false, error: `Must be at least ${min}` }
  }

  // Check max
  if (max !== undefined && num > max) {
    return { valid: false, error: `Must be no more than ${max}` }
  }

  return { valid: true }
}

/**
 * Validate date
 */
export function validateDate(
  value: string | Date,
  options: {
    min?: Date
    max?: Date
    required?: boolean
  } = {}
): ValidationResult {
  const { min, max, required = false } = options

  // Check required
  if (required && (!value || value === '')) {
    return { valid: false, error: 'Date is required' }
  }

  // Skip other checks if empty and not required
  if (!value || value === '') {
    return { valid: true }
  }

  // Parse date
  const date = typeof value === 'string' ? new Date(value) : value

  // Check if valid date
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Please enter a valid date' }
  }

  // Check min
  if (min && date < min) {
    return { valid: false, error: `Date must be on or after ${min.toLocaleDateString()}` }
  }

  // Check max
  if (max && date > max) {
    return { valid: false, error: `Date must be on or before ${max.toLocaleDateString()}` }
  }

  return { valid: true }
}

/**
 * Validate UUID
 */
export function validateUUID(value: string, required: boolean = false): ValidationResult {
  if (required && (!value || value.trim().length === 0)) {
    return { valid: false, error: 'ID is required' }
  }

  if (!value || value.trim().length === 0) {
    return { valid: true }
  }

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidPattern.test(value)) {
    return { valid: false, error: 'Invalid ID format' }
  }

  return { valid: true }
}

/**
 * Sanitize text input (basic XSS prevention)
 * Note: React already escapes content, but this adds an extra layer
 */
export function sanitizeText(text: string): string {
  if (!text) return ''
  
  // Remove potentially dangerous characters
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Validate decision title
 */
export function validateDecisionTitle(title: string): ValidationResult {
  return validateText(title, {
    required: true,
    minLength: 3,
    maxLength: 200,
  })
}

/**
 * Validate decision context
 */
export function validateDecisionContext(context: string): ValidationResult {
  return validateText(context, {
    required: true,
    minLength: 10,
    maxLength: 5000,
  })
}

/**
 * Validate confidence score
 */
export function validateConfidence(confidence: number): ValidationResult {
  return validateNumber(confidence, {
    required: true,
    min: 0,
    max: 100,
    integer: true,
  })
}

/**
 * Validate option scores (impact, effort, risk)
 */
export function validateOptionScore(score: number, fieldName: string): ValidationResult {
  return validateNumber(score, {
    required: true,
    min: 1,
    max: 10,
    integer: true,
  })
}

