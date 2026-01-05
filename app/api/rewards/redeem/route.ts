import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyWalletPassUpdate } from '@/lib/push-notifications'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, stampRewardId, smeId } = body

    // Validate required fields
    if (!customerId || !stampRewardId || !smeId) {
      return NextResponse.json(
        { error: 'Customer ID, reward ID, and SME ID are required' },
        { status: 400 }
      )
    }

    // Verify customer exists and belongs to SME
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        sme: {
          include: {
            stampRewards: true,
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    if (customer.smeId !== smeId) {
      return NextResponse.json(
        { error: 'Customer does not belong to this SME' },
        { status: 403 }
      )
    }

    // Verify it's a stamp program
    if (customer.sme.loyaltyType !== 'stamps') {
      return NextResponse.json(
        { error: 'This is not a stamp-based program' },
        { status: 400 }
      )
    }

    // Find the reward
    const reward = customer.sme.stampRewards.find((r) => r.id === stampRewardId)
    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 })
    }

    // Check if customer has enough stamps
    if ((customer.stamps || 0) < reward.stampsRequired) {
      return NextResponse.json(
        { error: 'Not enough stamps to redeem this reward' },
        { status: 400 }
      )
    }

    // Check if already redeemed (optional - you might want to allow multiple redemptions)
    const existingRedemption = await prisma.redeemedReward.findFirst({
      where: {
        customerId,
        stampRewardId,
      },
    })

    // Subtract stamps (keep remainder if they had more than required)
    const newStampsTotal = (customer.stamps || 0) - reward.stampsRequired

    // Update customer stamps
    await prisma.customer.update({
      where: { id: customerId },
      data: { stamps: Math.max(0, newStampsTotal) },
    })

    // Record redemption
    await prisma.redeemedReward.create({
      data: {
        customerId,
        stampRewardId,
      },
    })

    // Send push notification to update wallet pass
    try {
      await notifyWalletPassUpdate(customerId)
    } catch (error) {
      console.error('Error sending wallet pass update notification:', error)
    }

    return NextResponse.json({
      success: true,
      customer: {
        stamps: Math.max(0, newStampsTotal),
      },
      reward: {
        id: reward.id,
        rewardName: reward.rewardName,
        rewardDescription: reward.rewardDescription,
        stampsRequired: reward.stampsRequired,
      },
    })
  } catch (error) {
    console.error('Error redeeming reward:', error)
    return NextResponse.json(
      { error: 'Failed to redeem reward' },
      { status: 500 }
    )
  }
}

