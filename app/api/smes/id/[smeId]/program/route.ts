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
        stampRewards: {
          orderBy: { stampsRequired: 'asc' },
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
      pointsMultiplier,
      primaryColor,
      secondaryColor,
      loyaltyType,
      stampsRequired,
      tiers,
      stampRewards,
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
        ...(pointsMultiplier !== undefined && { pointsMultiplier: parseFloat(pointsMultiplier) || 1.0 }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(secondaryColor !== undefined && { secondaryColor }),
        ...(loyaltyType !== undefined && { loyaltyType }),
        ...(stampsRequired !== undefined && { stampsRequired: stampsRequired ? parseInt(stampsRequired) : null }),
      },
    })

    // Update tiers if provided (only for points programs)
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

    // Update stamp rewards if provided (only for stamp programs)
    if (stampRewards && Array.isArray(stampRewards)) {
      // Delete existing stamp rewards
      await prisma.stampReward.deleteMany({
        where: { smeId: params.smeId },
      })

      // Create new stamp rewards
      if (stampRewards.length > 0) {
        await prisma.stampReward.createMany({
          data: stampRewards.map((reward: any, index: number) => ({
            smeId: params.smeId,
            stampsRequired: parseInt(reward.stampsRequired) || 0,
            rewardName: reward.rewardName || '',
            rewardDescription: reward.rewardDescription || null,
            order: index,
          })),
        })
      }
    }

    // Return updated program with tiers and stamp rewards
    const program = await prisma.sME.findUnique({
      where: { id: params.smeId },
      include: {
        tiers: {
          orderBy: { order: 'asc' },
        },
        stampRewards: {
          orderBy: { stampsRequired: 'asc' },
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

