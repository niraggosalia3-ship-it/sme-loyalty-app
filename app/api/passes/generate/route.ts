import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateApplePassJSON } from '@/lib/wallet/apple-pass'
import { generateGooglePassJWT } from '@/lib/wallet/google-pass'
import { randomBytes } from 'crypto'

function generateAuthToken(): string {
  return randomBytes(16).toString('hex')
}

function generateSerialNumber(customerId: string): string {
  return `PASS-${customerId.substring(0, 8)}-${Date.now()}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, platform } = body

    if (!customerId || !platform) {
      return NextResponse.json(
        { error: 'Customer ID and platform are required' },
        { status: 400 }
      )
    }

    // Get customer data
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
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

    const serialNumber = generateSerialNumber(customerId)
    const authenticationToken = generateAuthToken()
    const webServiceUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/passes/${customerId}/update`

        if (platform === 'ios') {
          // For iOS: Create a web-based pass page (free alternative)
          // This works without Apple Developer account
          const passUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/passes/${customerId}`
          
          // Create or update wallet pass record
          await prisma.walletPass.upsert({
            where: { customerId },
            create: {
              customerId: customer.id,
              passTypeId: `web-pass-${customer.sme.uniqueLinkId}`,
              serialNumber,
              authenticationToken,
              platform: 'ios',
            },
            update: {
              serialNumber,
              authenticationToken,
              lastUpdated: new Date(),
            },
          })

          return NextResponse.json({
            platform: 'ios',
            passUrl,
            success: true,
            message: 'Web-based pass created. You can save this page or take a screenshot.',
          })
        } else if (platform === 'android') {
          // For Android: Create a web-based pass page (free alternative)
          // This works without Google Cloud setup
          const passUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/passes/${customerId}`
          
          // Create or update wallet pass record
          await prisma.walletPass.upsert({
            where: { customerId },
            create: {
              customerId: customer.id,
              passTypeId: `web-pass-${customer.sme.uniqueLinkId}`,
              serialNumber,
              authenticationToken,
              platform: 'android',
            },
            update: {
              serialNumber,
              authenticationToken,
              lastUpdated: new Date(),
            },
          })

          return NextResponse.json({
            platform: 'android',
            passUrl,
            success: true,
            message: 'Web-based pass created. You can save this page or add to Google Wallet later.',
          })
    } else {
      return NextResponse.json(
        { error: 'Invalid platform. Use "ios" or "android"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error generating wallet pass:', error)
    return NextResponse.json(
      { error: 'Failed to generate wallet pass' },
      { status: 500 }
    )
  }
}

