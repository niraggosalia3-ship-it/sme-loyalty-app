import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

function generateUniqueId(length: number = 10): string {
  return randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length)
}

export async function GET() {
  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not set')
      return NextResponse.json({ 
        error: 'Database configuration error',
        details: 'DATABASE_URL environment variable is not set'
      }, { status: 500 })
    }

    const smes = await prisma.sME.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(smes)
  } catch (error: any) {
    console.error('Error fetching SMEs:', error)
    // Return more detailed error for debugging
    return NextResponse.json({ 
      error: 'Failed to fetch SMEs',
      details: error?.message || 'Unknown error',
      type: error?.name || 'Error',
      code: error?.code || 'UNKNOWN',
      // Don't expose full connection string, but show if it's a connection issue
      isConnectionError: error?.name === 'PrismaClientInitializationError'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyName, bannerImageUrl } = body

    if (!companyName || typeof companyName !== 'string' || !companyName.trim()) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    // Generate unique link ID
    const uniqueLinkId = generateUniqueId(10)

    const sme = await prisma.sME.create({
      data: {
        companyName: companyName.trim(),
        uniqueLinkId,
        bannerImageUrl: bannerImageUrl || null,
      },
    })

    return NextResponse.json({
      id: sme.id,
      companyName: sme.companyName,
      uniqueLinkId: sme.uniqueLinkId,
      bannerImageUrl: sme.bannerImageUrl,
      createdAt: sme.createdAt,
    })
  } catch (error) {
    console.error('Error creating SME:', error)
    return NextResponse.json({ error: 'Failed to create SME' }, { status: 500 })
  }
}

