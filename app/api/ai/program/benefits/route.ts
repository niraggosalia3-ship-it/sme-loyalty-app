import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { context, tiers } = body

    if (!tiers || !Array.isArray(tiers) || tiers.length === 0) {
      console.error('Benefits API: Invalid tiers data', tiers)
      return NextResponse.json(
        { error: 'Tiers array is required and must not be empty', benefits: {} },
        { status: 400 }
      )
    }

    const businessType = context?.businessType?.toLowerCase() || ''
    const averageTransaction = context?.averageTransaction || 10

    const benefits: Record<string, any[]> = {}

    // Sort tiers by order to determine tier level
    const sortedTiers = [...tiers].sort((a, b) => (a.order || 0) - (b.order || 0))
    
    sortedTiers.forEach((tier: any, index: number) => {
      const tierBenefits: any[] = []
      const tierLevel = index // 0 = first tier, 1 = second tier, etc.
      const totalTiers = sortedTiers.length

      // Determine tier level based on order and points
      if (tier.pointsRequired === 0 || tierLevel === 0) {
        // Entry tier (Bronze or first tier)
        tierBenefits.push(
          { name: 'Welcome Bonus', description: '50 bonus points on first purchase', tierName: tier.name },
          { name: '5% Off All Purchases', description: 'Standard entry-level discount', tierName: tier.name },
          { name: 'Free Birthday Item', description: 'Annual benefit for customer retention', tierName: tier.name }
        )
      } else if (tierLevel === 1 || (tier.pointsRequired > 0 && tier.pointsRequired < 500)) {
        // Second tier (Silver or similar)
        tierBenefits.push(
          { name: '10% Off All Purchases', description: 'Increased discount for loyal customers', tierName: tier.name },
          { name: 'Free Item Every 10th Visit', description: 'Rewards frequent visits', tierName: tier.name },
          { name: 'Priority Access', description: 'Early access to new items or promotions', tierName: tier.name }
        )
      } else if (tierLevel === 2 || (tier.pointsRequired >= 500 && tier.pointsRequired < 1000)) {
        // Third tier (Gold or similar)
        tierBenefits.push(
          { name: '15% Off All Purchases', description: 'Premium discount level', tierName: tier.name },
          { name: 'Free Item Every 5th Visit', description: 'More frequent rewards', tierName: tier.name },
          { name: 'Monthly Free Specialty Item', description: 'Exclusive monthly benefit', tierName: tier.name },
          { name: 'VIP Events Access', description: 'Invitation to special events', tierName: tier.name }
        )
      } else {
        // Highest tier (Platinum or similar)
        tierBenefits.push(
          { name: '20% Off All Purchases', description: 'Maximum discount level', tierName: tier.name },
          { name: 'Free Item Every 3rd Visit', description: 'Highest reward frequency', tierName: tier.name },
          { name: 'Monthly Free Specialty Item + Bonus', description: 'Enhanced monthly benefit', tierName: tier.name },
          { name: 'Exclusive VIP Events', description: 'Private events and tastings', tierName: tier.name },
          { name: 'Personalized Service', description: 'Customized experience', tierName: tier.name }
        )
      }

      benefits[tier.name] = tierBenefits
    })

    console.log('Benefits API: Generated benefits for', Object.keys(benefits).length, 'tiers')
    console.log('Benefits API: Tier names:', Object.keys(benefits))

    return NextResponse.json({
      benefits,
    })
  } catch (error) {
    console.error('Error generating benefit suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate benefit suggestions' },
      { status: 500 }
    )
  }
}

