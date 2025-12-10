import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Register device token for push notifications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, deviceToken, platform } = body

    if (!customerId || !deviceToken || !platform) {
      return NextResponse.json(
        { error: 'Customer ID, device token, and platform are required' },
        { status: 400 }
      )
    }

    // Update wallet pass with device token
    const walletPass = await prisma.walletPass.findUnique({
      where: { customerId },
    })

    if (!walletPass) {
      return NextResponse.json(
        { error: 'Wallet pass not found. Please generate pass first.' },
        { status: 404 }
      )
    }

    const updateData: any = {
      lastUpdated: new Date(),
    }

    if (platform === 'ios') {
      updateData.deviceToken = deviceToken
    } else if (platform === 'android') {
      updateData.fcmToken = deviceToken
    } else {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      )
    }

    await prisma.walletPass.update({
      where: { id: walletPass.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Device token registered successfully',
    })
  } catch (error) {
    console.error('Error registering device token:', error)
    return NextResponse.json(
      { error: 'Failed to register device token' },
      { status: 500 }
    )
  }
}

