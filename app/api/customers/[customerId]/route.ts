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
          select: {
            companyName: true,
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      points: customer.points,
      tier: customer.tier,
      sme: customer.sme,
    })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

