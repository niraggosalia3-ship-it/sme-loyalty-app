import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    // Verify customer exists (for data isolation)
    const customer = await prisma.customer.findUnique({
      where: { id: params.customerId },
      select: { id: true },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const transactions = await prisma.transaction.findMany({
      where: { customerId: params.customerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        customerId: true,
        points: true,
        description: true,
        amount: true,
        taxAmount: true,
        createdAt: true,
      },
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

