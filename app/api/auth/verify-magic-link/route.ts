import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicToken } from '@/lib/magic-link'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const smeId = searchParams.get('smeId')

    if (!token || !smeId) {
      return NextResponse.json(
        { error: 'Token and SME ID are required' },
        { status: 400 }
      )
    }

    // Verify the magic token
    const verifiedSmeId = await verifyMagicToken(token)

    if (!verifiedSmeId || verifiedSmeId !== smeId) {
      // Invalid or expired token - redirect to request access page
      const url = new URL(`/sme/${smeId}/request-access`, request.url)
      url.searchParams.set('error', 'invalid_token')
      return NextResponse.redirect(url)
    }

    // Token is valid - create session cookie and redirect to dashboard
    const response = NextResponse.redirect(new URL(`/sme/${smeId}`, request.url))
    response.cookies.set('sme_session', smeId, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    console.error('Error verifying magic link:', error)
    const smeId = new URL(request.url).searchParams.get('smeId') || 'unknown'
    const url = new URL(`/sme/${smeId}/request-access`, request.url)
    url.searchParams.set('error', 'verification_failed')
    return NextResponse.redirect(url)
  }
}

