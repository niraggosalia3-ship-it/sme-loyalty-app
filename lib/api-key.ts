import { randomBytes } from 'crypto'

/**
 * Generate a secure API key for SME integration
 * Format: SME-XXXXXXXX-XXXXXXXX-XXXXXXXX (32 hex characters)
 */
export function generateAPIKey(): string {
  const bytes = randomBytes(16) // 16 bytes = 32 hex characters
  const hex = bytes.toString('hex').toUpperCase()
  
  // Format as SME-XXXXXXXX-XXXXXXXX-XXXXXXXX
  return `SME-${hex.substring(0, 8)}-${hex.substring(8, 16)}-${hex.substring(16, 24)}-${hex.substring(24, 32)}`
}

/**
 * Validate API key format
 */
export function isValidAPIKeyFormat(apiKey: string): boolean {
  const pattern = /^SME-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}$/
  return pattern.test(apiKey)
}


