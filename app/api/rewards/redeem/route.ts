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

    // Calculate total accumulated stamps across all cycles
    const stampsRequired = customer.sme.stampsRequired || 10
    const currentCardCycle = customer.cardCycleNumber || 1
    const currentStamps = customer.stamps || 0
    const totalStamps = stampsRequired > 0
      ? ((currentCardCycle - 1) * stampsRequired) + currentStamps
      : currentStamps

    // Check if customer has enough TOTAL stamps (not just current card stamps)
    if (totalStamps < reward.stampsRequired) {
      return NextResponse.json(
        { error: 'Not enough stamps to redeem this reward' },
        { status: 400 }
      )
    }

    // Find the RewardInstance for this reward and card cycle
    // Check both current cycle and previous cycle (for unredeemed rewards from old cards)
    const rewardInstance = await prisma.rewardInstance.findFirst({
      where: {
        customerId,
        stampRewardId,
        cardCycleNumber: {
          in: [currentCardCycle, currentCardCycle - 1], // Current or previous cycle
        },
        status: 'available', // Must be available to redeem
      },
      orderBy: {
        cardCycleNumber: 'desc', // Prefer current cycle, then previous
      },
    })

    if (!rewardInstance) {
      // Check if it exists but is not available
      const existingInstance = await prisma.rewardInstance.findFirst({
        where: {
          customerId,
          stampRewardId,
          cardCycleNumber: {
            in: [currentCardCycle, currentCardCycle - 1],
          },
        },
      })

      if (existingInstance) {
        if (existingInstance.status === 'redeemed') {
          return NextResponse.json(
            { error: 'This reward has already been redeemed' },
            { status: 400 }
          )
        }
        if (existingInstance.status === 'locked') {
          return NextResponse.json(
            { error: 'This reward is not yet available (not enough stamps)' },
            { status: 400 }
          )
        }
        if (existingInstance.status === 'expired') {
          return NextResponse.json(
            { error: 'This reward has expired' },
            { status: 400 }
          )
        }
      }

      return NextResponse.json(
        { error: 'Reward instance not found. Please ensure the reward is available.' },
        { status: 404 }
      )
    }

    // Update RewardInstance status to redeemed
    const updatedInstance = await prisma.rewardInstance.update({
      where: { id: rewardInstance.id },
      data: {
        status: 'redeemed',
        redeemedAt: new Date(),
      },
    })

    // Also create RedeemedReward record for historical tracking (during transition)
    await prisma.redeemedReward.create({
      data: {
        customerId,
        stampRewardId,
        cardCycleNumber: rewardInstance.cardCycleNumber,
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

