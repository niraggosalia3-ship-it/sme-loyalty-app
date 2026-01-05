import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    const sme = await prisma.sME.findUnique({
      where: { uniqueLinkId: params.linkId },
      include: {
        tiers: {
          orderBy: { order: 'asc' },
        },
        stampRewards: {
          orderBy: { stampsRequired: 'asc' },
        },
      },
    })

    if (!sme) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    return NextResponse.json(sme)
  } catch (error) {
    console.error('Error fetching program:', error)
    return NextResponse.json(
      { error: 'Failed to fetch program' },
      { status: 500 }
    )
  }
}

