import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.customerId },
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

    // Get benefits from eligible tiers
    const tierBenefits = eligibleTiers.map((tier) => {
      const benefits = parseBenefits(tier.benefits || '')
      const customerBenefitsForTier = (customer.customerBenefits || []).filter(
        (cb) => cb.tierId === tier.id
      )

      return {
        tierId: tier.id,
        tierName: tier.name,
        tierColor: tier.color || null,
        benefits: benefits.map((benefitName) => {
          const customerBenefit = customerBenefitsForTier.find(
            (cb) => cb.benefitName === benefitName
          )
          return {
            name: benefitName,
            status: customerBenefit?.status || 'available',
            unlockedAt: customerBenefit?.unlockedAt ? customerBenefit.unlockedAt.toISOString() : null,
            usedAt: customerBenefit?.usedAt ? customerBenefit.usedAt.toISOString() : null,
          }
        }),
      }
    })

    // Check if there was a recent tier upgrade (within last 24 hours)
    const recentTierUpgrade = customer.lastTierUpgradeDate && 
      new Date(customer.lastTierUpgradeDate).getTime() > (Date.now() - 24 * 60 * 60 * 1000)

    // Get previous tier info if there was a recent upgrade
    let tierUpgradeInfo = null
    if (recentTierUpgrade && customer.sme.tiers) {
      const currentTier = customer.sme.tiers.find(t => t.name === customer.tier)
      const previousTierOrder = (currentTier?.order ?? 1) - 1
      const previousTier = customer.sme.tiers.find(t => t.order === previousTierOrder)
      
      if (previousTier) {
        const newTierBenefits = parseBenefits(currentTier?.benefits || '')
        tierUpgradeInfo = {
          upgraded: true,
          oldTier: previousTier.name,
          newTier: customer.tier,
          unlockedBenefits: newTierBenefits,
        }
      }
    }

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
    // When customer.stamps === stampsRequired, show stampsRequired (complete card: 10/10)
    // Otherwise, show remainder for new cards (1/10, 2/10, etc.)
    const displayStamps = stampsRequired > 0
      ? ((customer.stamps || 0) === stampsRequired ? stampsRequired : (customer.stamps || 0) % stampsRequired)
      : (customer.stamps || 0)
    // Calculate total accumulated stamps across all cycles
    // totalStamps = (cardCycleNumber - 1) * stampsRequired + currentStamps
    // Example: Card 2, 1 stamp = (2-1)*10 + 1 = 11 total stamps
    const totalStamps = stampsRequired > 0 
      ? ((currentCardCycle - 1) * stampsRequired) + (customer.stamps || 0)
      : (customer.stamps || 0)

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      points: customer.points,
      stamps: customer.stamps || 0,
      tier: customer.tier,
      qrCodeId: customer.qrCodeId,
      lastTierUpgradeDate: customer.lastTierUpgradeDate,
      cardCycleNumber: currentCardCycle,
      sme: {
        id: customer.sme.id,
        companyName: customer.sme.companyName,
        bannerImageUrl: customer.sme.bannerImageUrl || null,
        uniqueLinkId: customer.sme.uniqueLinkId,
        loyaltyType: customer.sme.loyaltyType || 'points',
        stampsRequired: customer.sme.stampsRequired || null,
        primaryColor: customer.sme.primaryColor || null,
        secondaryColor: customer.sme.secondaryColor || null,
        stampRewards: customer.sme.stampRewards || [],
      },
      tierBenefits,
      tierUpgrade: tierUpgradeInfo,
      redeemedRewardIds, // Include for stamp programs (current cycle only - for display filtering)
      allRedeemedRewardIds, // All redeemed rewards (any cycle - for eligibility check)
      displayStamps, // Stamps for current card visualization (0 to stampsRequired-1)
      totalStamps, // Total accumulated stamps (for reward eligibility)
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

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
    // If not JSON, split by comma or newline
    return benefits.split(/[,\n]/).map((b) => b.trim()).filter((b) => b.length > 0)
  }
  return []
}

