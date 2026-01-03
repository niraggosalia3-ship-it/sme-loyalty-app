import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { context } = body

    // Extract all context for personalized suggestions
    const companyName = context.companyName || ''
    const businessType = context.businessType?.toLowerCase() || ''
    const averageTransaction = context.averageTransaction || 0
    const visitFrequency = context.visitFrequency || ''
    const uniqueValues = context.uniqueValues || []
    const programObjective = context.programObjective?.toLowerCase() || ''

    const suggestions = []

    // Generate personalized suggestions based on ALL context
    // 1. Company name-based suggestions
    if (companyName) {
      const companyWords = companyName.split(' ').filter((w: string) => w.length > 2)
      const firstWord = companyWords[0] || companyName.substring(0, 8)
      
      suggestions.push(
        { 
          name: `${firstWord} Rewards`, 
          explanation: `Personalized with your company name - creates brand recognition` 
        },
        { 
          name: `${firstWord} Loyalty Club`, 
          explanation: `Builds community around your brand name` 
        }
      )
    }

    // 2. Objective-based suggestions
    if (programObjective) {
      if (programObjective.includes('retention') || programObjective.includes('loyal')) {
        suggestions.push(
          { name: 'Loyalty Circle', explanation: 'Focuses on building long-term customer relationships' },
          { name: 'Inner Circle Rewards', explanation: 'Creates exclusivity and belonging' }
        )
      }
      if (programObjective.includes('repeat') || programObjective.includes('visit')) {
        suggestions.push(
          { name: 'Regular Rewards', explanation: 'Encourages frequent visits' },
          { name: 'Comeback Club', explanation: 'Incentivizes return visits' }
        )
      }
      if (programObjective.includes('value') || programObjective.includes('order')) {
        suggestions.push(
          { name: 'Value Plus Program', explanation: 'Emphasizes getting more value' },
          { name: 'Spend & Save Rewards', explanation: 'Highlights earning through spending' }
        )
      }
    }

    // 3. Business type + unique values combinations
    if (businessType.includes('coffee')) {
      if (uniqueValues.includes('Sustainability') || uniqueValues.includes('Organic')) {
        suggestions.push(
          { name: 'Eco-Brew Rewards', explanation: 'Combines coffee culture with sustainability values' },
          { name: 'Green Bean Loyalty', explanation: 'Highlights eco-friendly and organic focus' }
        )
      }
      if (uniqueValues.includes('Single-origin') || uniqueValues.includes('Premium')) {
        suggestions.push(
          { name: 'Origin Points Club', explanation: 'Emphasizes premium single-origin focus' },
          { name: 'Connoisseur Circle', explanation: 'Appeals to coffee enthusiasts and premium customers' }
        )
      }
      if (uniqueValues.includes('Local') || uniqueValues.includes('Family-owned')) {
        suggestions.push(
          { name: 'Community Coffee Club', explanation: 'Highlights local and family-owned values' },
          { name: 'Neighborhood Brew Rewards', explanation: 'Creates local community connection' }
        )
      }
      // Default coffee suggestions
      if (suggestions.length < 3) {
        suggestions.push(
          { name: 'Bean Points Program', explanation: 'Simple, memorable, and coffee-focused' },
          { name: 'Daily Brew Rewards', explanation: 'Encourages daily visits' }
        )
      }
    } else if (businessType.includes('restaurant')) {
      if (uniqueValues.includes('Premium') || uniqueValues.includes('Organic')) {
        suggestions.push(
          { name: 'Culinary Excellence Club', explanation: 'Appeals to food connoisseurs' },
          { name: 'Fine Dining Rewards', explanation: 'Highlights premium dining experience' }
        )
      }
      if (uniqueValues.includes('Local') || uniqueValues.includes('Family-owned')) {
        suggestions.push(
          { name: 'Family Table Rewards', explanation: 'Emphasizes family-owned and local values' },
          { name: 'Community Kitchen Club', explanation: 'Creates local community feel' }
        )
      }
      // Default restaurant suggestions
      if (suggestions.length < 3) {
        suggestions.push(
          { name: 'Flavor Points Program', explanation: 'Appeals to food lovers' },
          { name: 'Regulars Rewards', explanation: 'Encourages repeat dining visits' }
        )
      }
    } else if (businessType.includes('retail')) {
      if (uniqueValues.includes('Premium') || uniqueValues.includes('Organic')) {
        suggestions.push(
          { name: 'Premium Shopper Club', explanation: 'Appeals to quality-focused customers' },
          { name: 'Select Rewards Program', explanation: 'Creates exclusivity' }
        )
      }
      if (uniqueValues.includes('Local') || uniqueValues.includes('Sustainability')) {
        suggestions.push(
          { name: 'Local Heroes Rewards', explanation: 'Highlights local and sustainable values' },
          { name: 'Community Shop Club', explanation: 'Builds local community connection' }
        )
      }
      // Default retail suggestions
      if (suggestions.length < 3) {
        suggestions.push(
          { name: 'Shopper Rewards Club', explanation: 'Clear and straightforward' },
          { name: 'Points & Perks Program', explanation: 'Highlights benefits' }
        )
      }
    } else {
      // Generic business type
      if (uniqueValues.includes('Premium')) {
        suggestions.push(
          { name: 'Elite Rewards Program', explanation: 'Creates premium exclusivity' },
          { name: 'VIP Membership Club', explanation: 'Appeals to high-value customers' }
        )
      }
      if (uniqueValues.includes('Local') || uniqueValues.includes('Family-owned')) {
        suggestions.push(
          { name: 'Community Rewards', explanation: 'Highlights local and family values' },
          { name: 'Neighborhood Club', explanation: 'Builds local connection' }
        )
      }
      // Default generic suggestions
      if (suggestions.length < 3) {
        suggestions.push(
          { name: 'Loyalty Rewards Program', explanation: 'Professional and clear' },
          { name: 'Member Benefits Club', explanation: 'Highlights membership benefits' }
        )
      }
    }

    // 4. Visit frequency-based suggestions
    if (visitFrequency.includes('Daily') || visitFrequency.includes('2-3')) {
      suggestions.push(
        { name: 'Daily Rewards Club', explanation: 'Perfect for frequent visitors' },
        { name: 'Regular Rewards Program', explanation: 'Encourages consistent visits' }
      )
    }

    // 5. Transaction amount-based suggestions
    if (averageTransaction >= 50) {
      suggestions.push(
        { name: 'Premium Rewards Club', explanation: 'Appeals to high-value customers' },
        { name: 'Elite Membership Program', explanation: 'Creates exclusivity for big spenders' }
      )
    } else if (averageTransaction < 10) {
      suggestions.push(
        { name: 'Quick Rewards Program', explanation: 'Perfect for small, frequent transactions' },
        { name: 'Every Visit Counts', explanation: 'Emphasizes that all purchases matter' }
      )
    }

    // Remove duplicates and limit to 5-6 best suggestions
    const uniqueSuggestions = suggestions.filter((s, index, self) => 
      index === self.findIndex(t => t.name === s.name)
    )

    // Prioritize: company name > objective > business type + values > frequency > transaction
    const prioritized = uniqueSuggestions.slice(0, 6)

    return NextResponse.json({
      suggestions: prioritized,
    })
  } catch (error) {
    console.error('Error generating program names:', error)
    return NextResponse.json(
      { error: 'Failed to generate program names' },
      { status: 500 }
    )
  }
}

