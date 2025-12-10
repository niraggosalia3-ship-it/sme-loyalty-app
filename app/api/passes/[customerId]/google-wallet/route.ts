import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Generate a simple Google Wallet-compatible pass
// This works without requiring Google Cloud setup
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
            uniqueLinkId: true,
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Create a simple wallet pass structure
    // This can be saved as a web-based pass or used with Google Wallet API later
    const walletPass = {
      type: 'loyalty',
      id: `customer-${customer.id}`,
      classId: `loyalty-${customer.sme.uniqueLinkId}`,
      state: 'ACTIVE',
      barcode: {
        type: 'QR_CODE',
        value: customer.qrCodeId,
      },
      accountName: customer.name,
      accountId: customer.id,
      loyaltyPoints: {
        label: 'Points',
        balance: {
          int: customer.points.toString(),
        },
      },
      textModulesData: [
        {
          header: 'Tier',
          body: customer.tier,
        },
        {
          header: 'Company',
          body: customer.sme.companyName,
        },
      ],
      linksModuleData: {
        uris: [
          {
            uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/customer/${customer.id}`,
            description: 'View Full Dashboard',
          },
        ],
      },
    }

    return NextResponse.json(walletPass)
  } catch (error) {
    console.error('Error generating Google Wallet pass:', error)
    return NextResponse.json(
      { error: 'Failed to generate wallet pass' },
      { status: 500 }
    )
  }
}

