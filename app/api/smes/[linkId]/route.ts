import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { linkId: string } }
) {
  try {
    const sme = await prisma.sME.findUnique({
      where: { uniqueLinkId: params.linkId },
    })

    if (!sme) {
      return NextResponse.json({ error: 'SME not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: sme.id,
      companyName: sme.companyName,
      uniqueLinkId: sme.uniqueLinkId,
      bannerImageUrl: sme.bannerImageUrl,
    })
  } catch (error) {
    console.error('Error fetching SME:', error)
    return NextResponse.json({ error: 'Failed to fetch SME' }, { status: 500 })
  }
}

