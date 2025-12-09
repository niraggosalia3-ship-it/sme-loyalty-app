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
    const smes = await prisma.sME.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(smes)
  } catch (error) {
    console.error('Error fetching SMEs:', error)
    return NextResponse.json({ error: 'Failed to fetch SMEs' }, { status: 500 })
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

