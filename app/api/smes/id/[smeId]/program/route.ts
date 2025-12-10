import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { smeId: string } }
) {
  try {
    const sme = await prisma.sME.findUnique({
      where: { id: params.smeId },
      include: {
        tiers: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!sme) {
      return NextResponse.json({ error: 'SME not found' }, { status: 404 })
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { smeId: string } }
) {
  try {
    const body = await request.json()
    const {
      programName,
      programDescription,
      pointsEarningRules,
      primaryColor,
      secondaryColor,
      tiers,
    } = body

    // Verify SME exists
    const sme = await prisma.sME.findUnique({
      where: { id: params.smeId },
    })

    if (!sme) {
      return NextResponse.json({ error: 'SME not found' }, { status: 404 })
    }

    // Update SME program info
    const updatedSME = await prisma.sME.update({
      where: { id: params.smeId },
      data: {
        ...(programName !== undefined && { programName }),
        ...(programDescription !== undefined && { programDescription }),
        ...(pointsEarningRules !== undefined && { pointsEarningRules }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(secondaryColor !== undefined && { secondaryColor }),
      },
    })

    // Update tiers if provided
    if (tiers && Array.isArray(tiers)) {
      // Delete existing tiers
      await prisma.tier.deleteMany({
        where: { smeId: params.smeId },
      })

      // Create new tiers
      if (tiers.length > 0) {
        await prisma.tier.createMany({
          data: tiers.map((tier: any) => ({
            smeId: params.smeId,
            name: tier.name,
            pointsRequired: tier.pointsRequired,
            benefits: tier.benefits,
            color: tier.color || null,
            order: tier.order,
          })),
        })
      }
    }

    // Return updated program with tiers
    const program = await prisma.sME.findUnique({
      where: { id: params.smeId },
      include: {
        tiers: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json(program)
  } catch (error) {
    console.error('Error updating program:', error)
    return NextResponse.json(
      { error: 'Failed to update program' },
      { status: 500 }
    )
  }
}

