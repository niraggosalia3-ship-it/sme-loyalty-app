import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAndUpgradeTier } from '@/lib/tier-upgrade'
import { notifyWalletPassUpdate } from '@/lib/push-notifications'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, amount, taxAmount, description, smeId } = body

    // Validate required fields
    if (!customerId || amount === undefined || !smeId) {
      return NextResponse.json(
        { error: 'Customer ID, amount, and SME ID are required' },
        { status: 400 }
      )
    }

    // Verify customer exists and belongs to SME (data isolation)
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        sme: true,
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

