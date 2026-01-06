import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit } from './lib/rate-limit'

// Rate limit configuration
const RATE_LIMITS = {
  public: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  apiKey: { limit: 1000, windowMs: 60 * 1000 }, // 1000 requests per minute
  magicLink: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 requests per hour
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIP || 'unknown'
  return ip
}

/**
 * Check if user is authenticated as admin
 */
function isAdminAuthenticated(request: NextRequest): boolean {
  const adminToken = request.cookies.get('admin_token')?.value
  const expectedToken = process.env.ADMIN_ACCESS_TOKEN

  if (!expectedToken) {
    // If no admin token configured, allow access (development mode)
    return true
  }

  return adminToken === expectedToken
}


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = getClientIP(request)

  // Apply rate limiting
  if (pathname.startsWith('/api/')) {
    // API endpoints - rate limit by IP
    const apiKey = request.headers.get('x-api-key') || request.headers.get('X-API-Key')
    
    if (apiKey) {
      // API key endpoint - higher limit
      const allowed = rateLimit(`api:${apiKey}`, RATE_LIMITS.apiKey.limit, RATE_LIMITS.apiKey.windowMs)
      if (!allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
    } else {
      // Public API endpoint
      const allowed = rateLimit(`ip:${ip}`, RATE_LIMITS.public.limit, RATE_LIMITS.public.windowMs)
      if (!allowed) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        )
      }
    }
  }

  // Admin dashboard protection
  if (pathname === '/') {
    if (!isAdminAuthenticated(request)) {
      // Redirect to admin login if not authenticated
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  // SME dashboard protection
  if (pathname.startsWith('/sme/') && pathname.split('/').length === 3) {
    const smeId = pathname.split('/')[2]
    
    // Allow access to request-access page
    if (pathname.includes('/request-access')) {
      return NextResponse.next()
    }

    // Check for magic link token in query params
    // If present, redirect to verification API route (which handles Prisma)
    const token = request.nextUrl.searchParams.get('token')
    if (token) {
      const verifyUrl = new URL('/api/auth/verify-magic-link', request.url)
      verifyUrl.searchParams.set('token', token)
      verifyUrl.searchParams.set('smeId', smeId)
      return NextResponse.redirect(verifyUrl)
    }

    // Check for existing session cookie
    const session = request.cookies.get('sme_session')?.value
    if (session === smeId) {
      return NextResponse.next()
    }

    // Not authenticated - redirect to request access page
    const url = request.nextUrl.clone()
    url.pathname = `/sme/${smeId}/request-access`
    return NextResponse.redirect(url)
  }

  // Magic link request endpoint - special rate limiting
  if (pathname.includes('/send-access-link')) {
    // Extract email from request body (we'll check it in the API route)
    const allowed = rateLimit(`magic:${ip}`, RATE_LIMITS.magicLink.limit, RATE_LIMITS.magicLink.windowMs)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before requesting another access link.' },
        { status: 429 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

