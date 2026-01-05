import { prisma } from './prisma'

interface TierUpgradeResult {
  upgraded: boolean
  oldTier: string
  newTier: string
  unlockedBenefits: string[]
}

export async function checkAndUpgradeTier(
  customerId: string,
  newPointsTotal: number
): Promise<TierUpgradeResult> {
  try {
    // Get customer with SME
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        sme: {
          include: {
            tiers: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    if (!customer) {
      throw new Error('Customer not found')
    }

    const oldTier = customer.tier

    // Find highest tier that customer qualifies for
    let newTier = customer.tier
    let highestQualifyingTier = null

    for (const tier of customer.sme.tiers) {
      if (newPointsTotal >= tier.pointsRequired) {
        if (!highestQualifyingTier || tier.pointsRequired > highestQualifyingTier.pointsRequired) {
          highestQualifyingTier = tier
        }
      }
    }

    // If found a higher tier, upgrade
    if (highestQualifyingTier && highestQualifyingTier.name !== customer.tier) {
      newTier = highestQualifyingTier.name

      // Update customer tier
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          tier: newTier,
          lastTierUpgradeDate: new Date(),
        },
      })

      // Parse and unlock benefits for the new tier
      const benefits = parseBenefits(highestQualifyingTier.benefits)
      const unlockedBenefits: string[] = []

      // Create CustomerBenefit records for each benefit
      for (const benefit of benefits) {
        // Check if benefit already exists
        const existing = await prisma.customerBenefit.findFirst({
          where: {
            customerId,
            tierId: highestQualifyingTier.id,
            benefitName: benefit,
          },
        })

        if (!existing) {
          await prisma.customerBenefit.create({
            data: {
              customerId,
              tierId: highestQualifyingTier.id,
              benefitName: benefit,
              status: 'available',
            },
          })
          unlockedBenefits.push(benefit)
        }
      }

      return {
        upgraded: true,
        oldTier,
        newTier,
        unlockedBenefits,
      }
    }

    return {
      upgraded: false,
      oldTier,
      newTier: oldTier,
      unlockedBenefits: [],
    }
  } catch (error) {
    console.error('Error checking tier upgrade:', error)
    throw error
  }
}

function parseBenefits(benefits: string): string[] {
  try {
    const parsed = JSON.parse(benefits)
    if (Array.isArray(parsed)) {
      return parsed
    }
  } catch {
    // If not JSON, split by comma or newline
    return benefits.split(/[,\n]/).map(b => b.trim()).filter(b => b.length > 0)
  }
  return []
}


