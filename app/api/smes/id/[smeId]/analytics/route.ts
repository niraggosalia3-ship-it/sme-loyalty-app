import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type TimePeriod = 'ytd' | 'launch' | 'lastYear'

function getDateRange(period: TimePeriod, smeCreatedAt: Date): { start: Date; end: Date } {
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  switch (period) {
    case 'ytd':
      return {
        start: new Date(now.getFullYear(), 0, 1), // January 1st of current year
        end,
      }
    case 'launch':
      return {
        start: smeCreatedAt,
        end,
      }
    case 'lastYear':
      const lastYear = now.getFullYear() - 1
      return {
        start: new Date(lastYear, 0, 1),
        end: new Date(lastYear, 11, 31, 23, 59, 59, 999),
      }
    default:
      return {
        start: smeCreatedAt,
        end,
      }
  }
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
  return new Date(d.setDate(diff))
}

function groupByWeek(
  data: Array<{ date: Date; customers?: number; transactions?: number }>,
  startDate: Date,
  endDate: Date
): Array<{ week: string; weekStart: Date; customers: number; transactions: number }> {
  const weekMap = new Map<string, { weekStart: Date; customers: number; transactions: number }>()

  // Initialize all weeks in range
  const current = new Date(startDate)
  while (current <= endDate) {
    const weekStart = getWeekStart(new Date(current))
    const weekKey = weekStart.toISOString().split('T')[0]
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, {
        weekStart: new Date(weekStart),
        customers: 0,
        transactions: 0,
      })
    }
    current.setDate(current.getDate() + 7)
  }

  // Add data to weeks
  data.forEach((item) => {
    const weekStart = getWeekStart(item.date)
    const weekKey = weekStart.toISOString().split('T')[0]
    const weekData = weekMap.get(weekKey)
    if (weekData) {
      if (item.customers !== undefined) weekData.customers += item.customers
      if (item.transactions !== undefined) weekData.transactions += item.transactions
    }
  })

  // Convert to array and calculate cumulative values
  const weeks = Array.from(weekMap.entries())
    .map(([week, data]) => ({
      week: `${data.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      weekStart: data.weekStart,
      customers: data.customers,
      transactions: data.transactions,
    }))
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime())

  // Calculate cumulative values
  let cumulativeCustomers = 0
  let cumulativeTransactions = 0
  return weeks.map((week) => {
    cumulativeCustomers += week.customers
    cumulativeTransactions += week.transactions
    return {
      ...week,
      customers: cumulativeCustomers,
      transactions: cumulativeTransactions,
    }
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { smeId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = (searchParams.get('period') || 'ytd') as TimePeriod

    // Fetch SME to get createdAt for launch date
    const sme = await prisma.sME.findUnique({
      where: { id: params.smeId },
      select: {
        id: true,
        createdAt: true,
        loyaltyType: true,
      },
    })

    if (!sme) {
      return NextResponse.json({ error: 'SME not found' }, { status: 404 })
    }

    const { start, end } = getDateRange(period, sme.createdAt)

    // 1. Total Customers (cumulative up to end date)
    const totalCustomers = await prisma.customer.count({
      where: {
        smeId: params.smeId,
        createdAt: {
          lte: end,
        },
      },
    })

    // 2. Total Transactions (in period)
    const totalTransactions = await prisma.transaction.count({
      where: {
        customer: {
          smeId: params.smeId,
        },
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    })

    // 3. Total Benefits Redeemed (in period)
    let totalBenefitsRedeemed = 0
    if (sme.loyaltyType === 'stamps') {
      // Count redeemed RewardInstances
      totalBenefitsRedeemed = await prisma.rewardInstance.count({
        where: {
          customer: {
            smeId: params.smeId,
          },
          status: 'redeemed',
          redeemedAt: {
            gte: start,
            lte: end,
          },
        },
      })
    } else {
      // Count used CustomerBenefits for points programs
      totalBenefitsRedeemed = await prisma.customerBenefit.count({
        where: {
          customer: {
            smeId: params.smeId,
          },
          status: 'used',
          usedAt: {
            gte: start,
            lte: end,
          },
        },
      })
    }

    // 4. Customer Repeat Rate
    // Total customers who had at least one transaction in the period
    const customersWithTransactions = await prisma.customer.findMany({
      where: {
        smeId: params.smeId,
        createdAt: {
          lte: end, // Only count customers who existed by end of period
        },
        transactions: {
          some: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        },
      },
      select: {
        id: true,
      },
    })

    const customerRepeatRate =
      totalCustomers > 0 ? (customersWithTransactions.length / totalCustomers) * 100 : 0

    // 5. Weekly Trends
    // Get all customer creation dates in period
    const customerCreations = await prisma.customer.findMany({
      where: {
        smeId: params.smeId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        createdAt: true,
      },
    })

    // Get all transactions in period
    const transactions = await prisma.transaction.findMany({
      where: {
        customer: {
          smeId: params.smeId,
        },
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      select: {
        createdAt: true,
      },
    })

    // Group by week
    const customerData = customerCreations.map((c) => ({
      date: c.createdAt,
      customers: 1,
    }))

    const transactionData = transactions.map((t) => ({
      date: t.createdAt,
      transactions: 1,
    }))

    // Combine and group by week
    // Create a map to combine data by date
    const dateMap = new Map<string, { date: Date; customers: number; transactions: number }>()

    customerData.forEach((item) => {
      const dateKey = item.date.toISOString().split('T')[0]
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: item.date, customers: 0, transactions: 0 })
      }
      dateMap.get(dateKey)!.customers += item.customers
    })

    transactionData.forEach((item) => {
      const dateKey = item.date.toISOString().split('T')[0]
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: item.date, customers: 0, transactions: 0 })
      }
      dateMap.get(dateKey)!.transactions += item.transactions
    })

    const allDates = Array.from(dateMap.values())
    const weeklyTrends = groupByWeek(allDates, start, end)

    return NextResponse.json({
      summary: {
        totalCustomers,
        totalTransactions,
        totalBenefitsRedeemed,
        customerRepeatRate: Math.round(customerRepeatRate * 100) / 100, // Round to 2 decimal places
      },
      weeklyTrends,
      period,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

