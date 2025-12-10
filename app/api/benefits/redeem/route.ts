import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, benefitId, smeId } = body

    if (!customerId || !benefitId || !smeId) {
      return NextResponse.json(
        { error: 'Customer ID, benefit ID, and SME ID are required' },
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

    // Get benefit and verify it's available
    const benefit = await prisma.customerBenefit.findUnique({
      where: { id: benefitId },
    })

    if (!benefit) {
      return NextResponse.json({ error: 'Benefit not found' }, { status: 404 })
    }

    if (benefit.customerId !== customerId) {
      return NextResponse.json(
        { error: 'Benefit does not belong to this customer' },
        { status: 403 }
      )
    }

    if (benefit.status !== 'available') {
      return NextResponse.json(
        { error: 'Benefit has already been redeemed' },
        { status: 400 }
      )
    }

    // Mark benefit as used
    const updatedBenefit = await prisma.customerBenefit.update({
      where: { id: benefitId },
      data: {
        status: 'used',
        usedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      benefit: {
        id: updatedBenefit.id,
        name: updatedBenefit.benefitName,
        status: updatedBenefit.status,
        usedAt: updatedBenefit.usedAt,
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

