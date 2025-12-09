import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { smeId: string } }
) {
  try {
    const sme = await prisma.sME.findUnique({
      where: { id: params.smeId },
      select: {
        id: true,
        companyName: true,
        bannerImageUrl: true,
      },
    })

    if (!sme) {
      return NextResponse.json({ error: 'SME not found' }, { status: 404 })
    }

    return NextResponse.json(sme)
  } catch (error) {
    console.error('Error fetching SME:', error)
    return NextResponse.json({ error: 'Failed to fetch SME' }, { status: 500 })
  }
}

