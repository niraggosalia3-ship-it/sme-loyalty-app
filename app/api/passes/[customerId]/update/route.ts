import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateApplePassJSON } from '@/lib/wallet/apple-pass'
import { generateGooglePassJWT } from '@/lib/wallet/google-pass'

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    // Get authentication token from headers (Apple Wallet sends this)
    const authToken = request.headers.get('authorization')?.replace('ApplePass ', '') ||
                     request.nextUrl.searchParams.get('authToken')

    if (!authToken) {
      return NextResponse.json(
        { error: 'Authentication token required' },
        { status: 401 }
      )
    }

    // Verify token and get wallet pass
    const walletPass = await prisma.walletPass.findUnique({
      where: { customerId: params.customerId },
      include: {
        customer: {
          include: {
            sme: {
              select: {
                companyName: true,
                uniqueLinkId: true,
              },
            },
          },
        },
      },
    })

    if (!walletPass) {
      return NextResponse.json({ error: 'Pass not found' }, { status: 404 })
    }

    if (walletPass.authenticationToken !== authToken) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const customer = walletPass.customer
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const webServiceUrl = `${baseUrl}/api/passes/${params.customerId}/update`

    // Return updated pass data (web-based pass)
    // This works for both iOS and Android without requiring certificates
    const passData = {
      customerId: customer.id,
      customerName: customer.name,
      points: customer.points,
      tier: customer.tier,
      qrCodeId: customer.qrCodeId,
      companyName: customer.sme.companyName,
      passTypeId: walletPass.passTypeId,
      serialNumber: walletPass.serialNumber,
      authenticationToken: walletPass.authenticationToken,
      webServiceUrl,
      lastUpdated: new Date().toISOString(),
    }

    // Update last updated timestamp
    await prisma.walletPass.update({
      where: { id: walletPass.id },
      data: { lastUpdated: new Date() },
    })

    return NextResponse.json(passData)
  } catch (error) {
    console.error('Error updating wallet pass:', error)
    return NextResponse.json(
      { error: 'Failed to update wallet pass' },
      { status: 500 }
    )
  }
}

