import { randomBytes } from 'crypto'
import { prisma } from './prisma'

/**
 * Generate a secure random token for magic links
 */
export function generateMagicToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Create a magic link token for an SME
 * @param smeId - The SME ID
 * @param email - Email address to send the link to
 * @returns The generated token
 */
export async function createMagicLinkToken(smeId: string, email: string): Promise<string> {
  const token = generateMagicToken()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24) // Expires in 24 hours

  // Delete existing token if any
  await prisma.sMEAccessToken.deleteMany({
    where: { smeId },
  })

  // Create new token
  await prisma.sMEAccessToken.create({
    data: {
      smeId,
      token,
      email,
      expiresAt,
    },
  })

  return token
}

/**
 * Verify a magic link token
 * @param token - The token to verify
 * @returns The SME ID if token is valid, null otherwise
 */
export async function verifyMagicToken(token: string): Promise<string | null> {
  const accessToken = await prisma.sMEAccessToken.findUnique({
    where: { token },
    include: { sme: true },
  })

  if (!accessToken) {
    return null
  }

  // Check if token has expired
  if (new Date() > accessToken.expiresAt) {
    // Delete expired token
    await prisma.sMEAccessToken.delete({
      where: { id: accessToken.id },
    })
    return null
  }

  return accessToken.smeId
}

/**
 * Get magic link URL for an SME
 * @param smeId - The SME ID
 * @param token - The magic link token
 * @returns The full magic link URL
 */
export function getMagicLinkUrl(smeId: string, token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  return `${baseUrl}/sme/${smeId}?token=${token}`
}

