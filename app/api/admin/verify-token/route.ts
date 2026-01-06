import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    const expectedToken = process.env.ADMIN_ACCESS_TOKEN

    if (!expectedToken) {
      // If no admin token configured, allow access (development mode)
      const response = NextResponse.json({ success: true })
      response.cookies.set('admin_token', 'dev', {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })
      return response
    }

    if (token !== expectedToken) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Token is valid - set session cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set('admin_token', token, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    console.error('Error verifying admin token:', error)
    return NextResponse.json(
      { error: 'Failed to verify token' },
      { status: 500 }
    )
  }
}

