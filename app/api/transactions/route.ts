import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAndUpgradeTier } from '@/lib/tier-upgrade'
import { notifyWalletPassUpdate } from '@/lib/push-notifications'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, amount, taxAmount, description, smeId, stampsEarned } = body

    // Verify customer exists and belongs to SME (data isolation)
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        sme: {
          include: {
            stampRewards: {
              orderBy: { stampsRequired: 'asc' },
            },
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

    const loyaltyType = customer.sme.loyaltyType || 'points'

    // Handle stamp-based transactions
    if (loyaltyType === 'stamps') {
      // Validate stamps
      const stampsToAdd = stampsEarned || 1
      if (stampsToAdd < 1) {
        return NextResponse.json(
          { error: 'Must add at least 1 stamp' },
          { status: 400 }
        )
      }

      // Update customer stamps
      const newStampsTotal = (customer.stamps || 0) + stampsToAdd

      await prisma.customer.update({
        where: { id: customerId },
        data: { stamps: newStampsTotal },
      })

      // Check for available rewards (milestones reached)
      const availableRewards = customer.sme.stampRewards.filter(
        (reward) => newStampsTotal >= reward.stampsRequired
      )

      // Create transaction record
      const transaction = await prisma.transaction.create({
        data: {
          customerId,
          points: 0, // No points for stamp transactions
          stampsEarned: stampsToAdd,
          description: description || 'Stamp added',
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

      // Fetch updated customer data to ensure we return complete info
      const updatedCustomer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: {
          stamps: true,
        },
      })

      return NextResponse.json({
        transaction: {
          id: transaction.id,
          customerId: transaction.customerId,
          points: 0,
          stampsEarned: transaction.stampsEarned,
          description: transaction.description,
          amount: null,
          taxAmount: null,
          createdAt: transaction.createdAt,
        },
        customer: {
          stamps: updatedCustomer?.stamps ?? newStampsTotal,
        },
        availableRewards: availableRewards.map((reward) => ({
          stampsRequired: reward.stampsRequired,
          rewardName: reward.rewardName,
          rewardDescription: reward.rewardDescription,
        })),
      })
    }

    // Handle points-based transactions (existing logic)
    // Validate required fields
    if (amount === undefined) {
      return NextResponse.json(
        { error: 'Amount is required for points-based transactions' },
        { status: 400 }
      )
    }

    // Get points multiplier from SME
    const pointsMultiplier = customer.sme.pointsMultiplier || 1.0

    // Calculate points earned (based on amount before tax)
    const pointsEarned = Math.round((amount || 0) * pointsMultiplier)

    // Update customer points
    const newPointsTotal = customer.points + pointsEarned

    await prisma.customer.update({
      where: { id: customerId },
      data: { points: newPointsTotal },
    })

    // Check and upgrade tier if needed
    const tierUpgrade = await checkAndUpgradeTier(customerId, newPointsTotal)

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        customerId,
        points: pointsEarned,
        stampsEarned: null,
        description: description || `Purchase of $${amount.toFixed(2)}`,
        amount: amount || null,
        taxAmount: taxAmount || null,
      },
    })

    // Send push notification to update wallet pass
    try {
      await notifyWalletPassUpdate(customerId)
    } catch (error) {
      console.error('Error sending wallet pass update notification:', error)
      // Don't fail the transaction if push notification fails
    }

    return NextResponse.json({
      transaction: {
        id: transaction.id,
        customerId: transaction.customerId,
        points: transaction.points,
        amount: transaction.amount,
        taxAmount: transaction.taxAmount,
        description: transaction.description,
        createdAt: transaction.createdAt,
      },
      customer: {
        points: newPointsTotal,
        tier: tierUpgrade.newTier,
      },
      tierUpgrade: tierUpgrade.upgraded
        ? {
            upgraded: true,
            oldTier: tierUpgrade.oldTier,
            newTier: tierUpgrade.newTier,
            unlockedBenefits: tierUpgrade.unlockedBenefits,
          }
        : null,
    })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}

