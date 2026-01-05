import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, benefitName, tierId, smeId } = body

    if (!customerId || !benefitName || !tierId || !smeId) {
      return NextResponse.json(
        { error: 'Customer ID, benefit name, tier ID, and SME ID are required' },
        { status: 400 }
      )
    }

    // Verify customer exists and belongs to SME
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
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

    // Find or create the benefit record
    let benefit = await prisma.customerBenefit.findFirst({
      where: {
        customerId,
        tierId,
        benefitName,
      },
    })

    if (!benefit) {
      // Create the benefit record if it doesn't exist
      benefit = await prisma.customerBenefit.create({
        data: {
          customerId,
          tierId,
          benefitName,
          status: 'used', // Mark as used immediately
          usedAt: new Date(),
        },
      })
    } else {
      // Update existing benefit if it's available
      if (benefit.status !== 'available') {
        return NextResponse.json(
          { error: 'Benefit has already been redeemed' },
          { status: 400 }
        )
      }

      benefit = await prisma.customerBenefit.update({
        where: { id: benefit.id },
        data: {
          status: 'used',
          usedAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      benefit: {
        id: benefit.id,
        name: benefit.benefitName,
        status: benefit.status,
        usedAt: benefit.usedAt,
      },
    })
  } catch (error) {
    console.error('Error redeeming benefit:', error)
    return NextResponse.json(
      { error: 'Failed to redeem benefit' },
      { status: 500 }
    )
  }
}


