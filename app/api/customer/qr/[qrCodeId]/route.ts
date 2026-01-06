import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function parseBenefits(benefits: string | null | undefined): string[] {
  if (!benefits) {
    return []
  }
  try {
    const parsed = JSON.parse(benefits)
    if (Array.isArray(parsed)) {
      return parsed
    }
  } catch {
    return benefits.split(/[,\n]/).map((b) => b.trim()).filter((b) => b.length > 0)
  }
  return []
}

export async function GET(
  request: NextRequest,
  { params }: { params: { qrCodeId: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { qrCodeId: params.qrCodeId },
      include: {
        sme: {
          include: {
            tiers: {
              orderBy: { order: 'asc' },
            },
            stampRewards: {
              orderBy: { stampsRequired: 'asc' },
            },
          },
        },
        customerBenefits: {
          orderBy: { unlockedAt: 'desc' },
        },
        redeemedRewards: {
          include: {
            stampReward: true,
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get all tiers up to and including customer's current tier
    const currentTierOrder = customer.sme.tiers?.find(
      (t) => t.name === customer.tier
    )?.order ?? 0

    const eligibleTiers = (customer.sme.tiers || []).filter(
      (t) => t.order <= currentTierOrder
    )

    // Get all benefits from eligible tiers
    const allBenefits = eligibleTiers.flatMap((tier) => {
      const benefits = parseBenefits(tier.benefits)
      const customerBenefitsForTier = customer.customerBenefits.filter(
        (cb) => cb.tierId === tier.id
      )

      return benefits.map((benefitName) => {
        const customerBenefit = customerBenefitsForTier.find(
          (cb) => cb.benefitName === benefitName
        )
        
        return {
          id: customerBenefit?.id || null,
          name: benefitName,
          tierId: tier.id,
          tierName: tier.name,
          tierColor: tier.color || null,
          status: customerBenefit?.status || 'available',
          unlockedAt: customerBenefit?.unlockedAt ? customerBenefit.unlockedAt.toISOString() : null,
          usedAt: customerBenefit?.usedAt ? customerBenefit.usedAt.toISOString() : null,
        }
      })
    })

    // Get current card cycle number
    const currentCardCycle = customer.cardCycleNumber || 1

    // Get redeemed reward IDs for CURRENT card cycle only
    // This allows fresh rewards to show on new cards, while hiding redeemed ones from current card
    const currentCycleRedemptions = await prisma.redeemedReward.findMany({
      where: {
        customerId: customer.id,
        cardCycleNumber: currentCardCycle,
      },
      select: { stampRewardId: true },
    })
    const redeemedRewardIds = currentCycleRedemptions.map(r => r.stampRewardId)
    
    // Also get ALL redeemed rewards (any cycle) for eligibility check
    // A reward can only be redeemed once across all cycles
    const allRedeemedRewards = await prisma.redeemedReward.findMany({
      where: { customerId: customer.id },
      select: { stampRewardId: true },
    })
    const allRedeemedRewardIds = Array.from(new Set(allRedeemedRewards.map(r => r.stampRewardId)))

    // Calculate display stamps for current card visualization
    const stampsRequired = customer.sme.stampsRequired || 10
    const displayStamps = stampsRequired > 0 ? (customer.stamps || 0) % stampsRequired : (customer.stamps || 0)
    const totalStamps = customer.stamps || 0 // Total accumulated stamps (for eligibility)

    return NextResponse.json({
      customerId: customer.id,
      name: customer.name,
      email: customer.email,
      points: customer.points,
      stamps: customer.stamps || 0,
      tier: customer.tier,
      qrCodeId: customer.qrCodeId,
      cardCycleNumber: currentCardCycle,
      sme: {
        id: customer.sme.id,
        companyName: customer.sme.companyName,
        loyaltyType: customer.sme.loyaltyType || 'points',
        stampsRequired: customer.sme.stampsRequired || null,
        primaryColor: customer.sme.primaryColor || null,
        secondaryColor: customer.sme.secondaryColor || null,
        stampRewards: customer.sme.stampRewards?.map((reward) => ({
          id: reward.id,
          stampsRequired: reward.stampsRequired,
          rewardName: reward.rewardName,
          rewardDescription: reward.rewardDescription,
        })) || [],
      },
      availableBenefits: allBenefits.filter((b) => b.status === 'available'),
      allBenefits, // Include all benefits (available and used) for display
      redeemedRewardIds, // Include redeemed reward IDs for stamp programs (current cycle only - for display filtering)
      allRedeemedRewardIds, // All redeemed rewards (any cycle - for eligibility check)
      displayStamps, // Stamps for current card visualization (0 to stampsRequired-1)
      totalStamps: customer.stamps || 0, // Total accumulated stamps (for eligibility)
    })
  } catch (error) {
    console.error('Error fetching customer by QR code:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

