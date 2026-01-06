import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createMagicLinkToken, getMagicLinkUrl } from '@/lib/magic-link'
import { sendMagicLinkEmail } from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: { smeId: string } }
) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Rate limiting by email (5 requests per hour)
    const emailKey = `magic-email:${email.trim()}`
    const emailAllowed = rateLimit(emailKey, 5, 60 * 60 * 1000) // 5 per hour
    if (!emailAllowed) {
      return NextResponse.json(
        { error: 'Too many requests from this email. Please wait before requesting another access link.' },
        { status: 429 }
      )
    }

    // Verify SME exists
    const sme = await prisma.sME.findUnique({
      where: { id: params.smeId },
    })

    if (!sme) {
      return NextResponse.json({ error: 'SME not found' }, { status: 404 })
    }

    // Generate new magic link token
    const token = await createMagicLinkToken(params.smeId, email.trim())
    const magicLinkUrl = getMagicLinkUrl(params.smeId, token)

    // Send magic link email
    const emailSent = await sendMagicLinkEmail({
      to: email.trim(),
      smeName: sme.companyName,
      magicLinkUrl,
    })

    // Update SME owner email if not set
    if (!sme.ownerEmail) {
      await prisma.sME.update({
        where: { id: params.smeId },
        data: { ownerEmail: email.trim() },
      })
    }

    return NextResponse.json({
      success: true,
      message: emailSent
        ? 'Access link sent to your email!'
        : 'Access link generated. Please check the response for the link.',
      magicLinkUrl, // Include in response in case email fails
    })
  } catch (error) {
    console.error('Error sending access link:', error)
    return NextResponse.json(
      { error: 'Failed to send access link' },
      { status: 500 }
    )
  }
}

