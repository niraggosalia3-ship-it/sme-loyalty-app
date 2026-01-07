import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAndUpgradeTier } from '@/lib/tier-upgrade'
import { notifyWalletPassUpdate } from '@/lib/push-notifications'
import {
  createRewardInstancesForCycle,
  unlockRewardInstance,
  calculateExpiryDate,
} from '@/lib/reward-instance'

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

      const stampsRequired = customer.sme.stampsRequired || 10
      const previousStamps = customer.stamps || 0
      const newStampsTotal = previousStamps + stampsToAdd
      const previousCardCycle = customer.cardCycleNumber || 1
      
      // Card reset logic:
      // - At 10/10, show 10/10 (card is complete but not reset yet)
      // - Only reset when we EXCEED stampsRequired (11th stamp triggers reset to 1/10 on new card)
      let cardWasReset = false
      let newCardCycle = previousCardCycle
      let finalStamps = newStampsTotal

      // Check if this is the first stamp for this customer (need to create reward instances for cycle 1)
      const existingInstances = await prisma.rewardInstance.findFirst({
        where: {
          customerId,
          cardCycleNumber: 1,
        },
      })

      // If no reward instances exist yet, create them for the first card cycle
      if (!existingInstances && customer.sme.stampRewards.length > 0) {
        const stampRewardIds = customer.sme.stampRewards.map((r) => r.id)
        await createRewardInstancesForCycle(customerId, 1, stampRewardIds)
      }

      // Only reset when we EXCEED the required stamps (not when we reach it)
      // At 10/10, show 10/10. At 11th stamp, reset to 1/10 on new card
      if (newStampsTotal > stampsRequired) {
        // Calculate how many full cards have been completed
        const fullCardsCompleted = Math.floor(newStampsTotal / stampsRequired)
        // Remainder goes to new card
        finalStamps = newStampsTotal % stampsRequired
        // Increment card cycle by number of full cards completed
        newCardCycle = previousCardCycle + fullCardsCompleted
        cardWasReset = true

        // Create reward instances for new card cycles
        // Create instances for all newly started cycles
        for (let cycle = previousCardCycle + 1; cycle <= newCardCycle; cycle++) {
          const stampRewardIds = customer.sme.stampRewards.map((r) => r.id)
          await createRewardInstancesForCycle(customerId, cycle, stampRewardIds)
        }
      }

      // Update customer stamps and card cycle
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          stamps: finalStamps,
          cardCycleNumber: newCardCycle,
        },
      })

      // Calculate total accumulated stamps for unlocking rewards
      const unlockCardCycle = newCardCycle
      const unlockStamps = finalStamps
      const unlockTotalStamps = stampsRequired > 0
        ? ((unlockCardCycle - 1) * stampsRequired) + unlockStamps
        : unlockStamps

      // Unlock reward instances when milestones are reached
      // Check each reward to see if it should be unlocked
      for (const reward of customer.sme.stampRewards) {
        // Check if total stamps reached this reward's requirement
        if (unlockTotalStamps >= reward.stampsRequired) {
          // Unlock for all card cycles where the customer has enough stamps
          // Calculate which cycles should have this reward unlocked
          for (let cycle = 1; cycle <= unlockCardCycle; cycle++) {
            // Calculate total stamps at end of this cycle
            const stampsAtCycleEnd = cycle < unlockCardCycle
              ? stampsRequired // Previous cycles are full
              : unlockStamps // Current cycle has current stamps
            
            const totalStampsAtCycle = stampsRequired > 0
              ? ((cycle - 1) * stampsRequired) + stampsAtCycleEnd
              : stampsAtCycleEnd
            
            // If customer had enough stamps at this cycle, unlock the reward
            if (totalStampsAtCycle >= reward.stampsRequired) {
              await unlockRewardInstance(customerId, reward.id, cycle)
            }
          }
        }
      }

      // Get available rewards for response
      const availableRewards = customer.sme.stampRewards.filter(
        (reward) => unlockTotalStamps >= reward.stampsRequired
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
          cardCycleNumber: true,
        },
      })

      // Calculate display stamps for current card visualization
      const currentStamps = updatedCustomer?.stamps || finalStamps
      const currentCardCycle = updatedCustomer?.cardCycleNumber || newCardCycle
      // When customer.stamps === stampsRequired, show stampsRequired (complete card: 10/10)
      // Otherwise, show remainder for new cards (1/10, 2/10, etc.)
      const displayStamps = stampsRequired > 0
        ? (currentStamps === stampsRequired ? stampsRequired : currentStamps % stampsRequired)
        : currentStamps
      // Calculate total accumulated stamps across all cycles
      // totalStamps = (cardCycleNumber - 1) * stampsRequired + currentStamps
      // Example: Card 2, 1 stamp = (2-1)*10 + 1 = 11 total stamps
      const totalStamps = stampsRequired > 0
        ? ((currentCardCycle - 1) * stampsRequired) + currentStamps
        : currentStamps

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
          stamps: updatedCustomer?.stamps ?? finalStamps,
          cardCycleNumber: updatedCustomer?.cardCycleNumber ?? newCardCycle,
          displayStamps,
          totalStamps,
        },
        cardWasReset,
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

