import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { context } = body

    const averageTransaction = context.averageTransaction || 10
    const visitFrequency = context.visitFrequency || 'weekly'
    const pointsMultiplier = 1.0

    // Calculate monthly points estimate
    let monthlyPoints = 0
    if (visitFrequency.includes('daily')) {
      monthlyPoints = averageTransaction * 30 * pointsMultiplier
    } else if (visitFrequency.includes('2-3x')) {
      monthlyPoints = averageTransaction * 10 * pointsMultiplier // ~2.5 visits/week
    } else if (visitFrequency.includes('weekly')) {
      monthlyPoints = averageTransaction * 4 * pointsMultiplier
    } else if (visitFrequency.includes('monthly')) {
      monthlyPoints = averageTransaction * pointsMultiplier
    }

    // Generate tier structure
    const tiers = [
      {
        order: 0,
        name: 'Bronze',
        pointsRequired: 0,
        color: '#CD7F32',
        benefits: [],
      },
      {
        order: 1,
        name: 'Silver',
        pointsRequired: Math.round(monthlyPoints * 3), // ~3 months
        color: '#C0C0C0',
        benefits: [],
      },
      {
        order: 2,
        name: 'Gold',
        pointsRequired: Math.round(monthlyPoints * 6), // ~6 months
        color: '#FFD700',
        benefits: [],
      },
      {
        order: 3,
        name: 'Platinum',
        pointsRequired: Math.round(monthlyPoints * 12), // ~12 months
        color: '#E5E4E2',
        benefits: [],
      },
    ]

    return NextResponse.json({
      tiers,
      analysis: {
        monthlyPointsEstimate: Math.round(monthlyPoints),
        recommendation: 'Tiers are well-spaced for customer engagement',
      },
    })
  } catch (error) {
    console.error('Error generating tier suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate tier suggestions' },
      { status: 500 }
    )
  }
}

