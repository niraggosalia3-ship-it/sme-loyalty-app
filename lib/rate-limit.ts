/**
 * Simple in-memory rate limiting
 * For production, consider using Redis (Upstash) or Vercel Edge Config
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

const store: RateLimitStore = {}

/**
 * Simple rate limiter using in-memory store
 * @param key - Unique identifier (IP address, API key, etc.)
 * @param limit - Maximum number of requests
 * @param windowMs - Time window in milliseconds
 * @returns true if allowed, false if rate limited
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const record = store[key]

  // If no record or window expired, create new record
  if (!record || now > record.resetAt) {
    store[key] = {
      count: 1,
      resetAt: now + windowMs,
    }
    return true
  }

  // Increment count
  record.count++

  // Check if limit exceeded
  if (record.count > limit) {
    return false
  }

  return true
}

/**
 * Get rate limit info for a key
 */
export function getRateLimitInfo(key: string): { count: number; resetAt: number } | null {
  return store[key] || null
}

/**
 * Clear rate limit for a key (useful for testing)
 */
export function clearRateLimit(key: string): void {
  delete store[key]
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const key in store) {
    if (store[key].resetAt < now) {
      delete store[key]
    }
  }
}

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000)
}

