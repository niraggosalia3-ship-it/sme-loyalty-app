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

    // Get current card cycle number
    const currentCardCycle = customer.cardCycleNumber || 1

    // Check if already redeemed in ANY cycle (rewards can only be redeemed once across all cycles)
    const existingRedemption = await prisma.redeemedReward.findFirst({
      where: {
        customerId,
        stampRewardId,
        // Don't filter by cardCycleNumber - check all cycles
      },
    })

    if (existingRedemption) {
      return NextResponse.json(
        { error: 'This reward has already been redeemed' },
        { status: 400 }
      )
    }

    // Note: We don't subtract stamps anymore - stamps remain unchanged
    // Only the redemption status is updated
    // Card cycle only resets when stamps exceed full card, not on redemption

    // Record redemption with current card cycle number
    await prisma.redeemedReward.create({
      data: {
        customerId,
        stampRewardId,
        cardCycleNumber: currentCardCycle,
      },
    })

    // Don't reset card cycle on redemption - only reset when stamps exceed full card
    // This allows customers to redeem rewards from previous cycles even after starting a new card

    // Create transaction record for redemption (negative stampsEarned)
    const transaction = await prisma.transaction.create({
      data: {
        customerId,
        points: 0,
        stampsEarned: -reward.stampsRequired, // Negative to show redemption
        description: `Reward redeemed: ${reward.rewardName}`,
        amount: null,
        taxAmount: null,
      },
    })

    // Send push notification to update wallet pass
    try {
      await notifyWalletPassUpdate(customerId)
    } catch (error) {
      console.error('Error sending wallet pass update notification:', error)
    }

    // Fetch updated customer data
    const updatedCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        stamps: true,
        cardCycleNumber: true,
      },
    })

    return NextResponse.json({
      success: true,
      customer: {
        stamps: updatedCustomer?.stamps || customer.stamps,
        cardCycleNumber: updatedCustomer?.cardCycleNumber || currentCardCycle,
      },
      reward: {
        id: reward.id,
        rewardName: reward.rewardName,
        rewardDescription: reward.rewardDescription,
        stampsRequired: reward.stampsRequired,
      },
      transaction: {
        id: transaction.id,
        stampsEarned: transaction.stampsEarned,
        description: transaction.description,
        createdAt: transaction.createdAt,
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

