import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAndUpgradeTier } from '@/lib/tier-upgrade'
import { randomBytes } from 'crypto'

function generateQRCodeId(): string {
  return 'CUST-' + randomBytes(8).toString('hex').toUpperCase()
}

interface CustomerData {
  name: string
  email: string
  birthDate: string
  gender: string
  phone?: string
  externalId?: string
  ytdSpend?: number
  metadata?: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key')
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required. Include X-API-Key header.' },
        { status: 401 }
      )
    }

    // Verify API key and get SME
    const sme = await prisma.sME.findUnique({
      where: { apiKey },
      include: {
        tiers: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!sme) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const customerData: CustomerData = body.customer || body

    // Validate required fields
    if (!customerData.name || !customerData.email || !customerData.birthDate || !customerData.gender) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, birthDate, gender' },
        { status: 400 }
      )
    }

    // Check for duplicate email (within same SME)
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        smeId: sme.id,
        email: customerData.email,
      },
    })

    if (existingCustomer) {
      return NextResponse.json(
        { 
          error: 'Customer with this email already exists',
          customerId: existingCustomer.id,
          qrCodeId: existingCustomer.qrCodeId,
        },
        { status: 409 }
      )
    }

    // Generate QR code ID
    const qrCodeId = generateQRCodeId()

    // Calculate initial points if YTD spend provided
    let initialPoints = 0
    if (customerData.ytdSpend && customerData.ytdSpend > 0) {
      initialPoints = Math.round(customerData.ytdSpend * (sme.pointsMultiplier || 1.0))
    }

    // Determine initial tier based on points
    let initialTier = 'Bronze'
    if (sme.tiers && sme.tiers.length > 0) {
      // Find highest tier customer qualifies for
      const sortedTiers = [...sme.tiers].sort((a, b) => b.pointsRequired - a.pointsRequired)
      for (const tier of sortedTiers) {
        if (initialPoints >= tier.pointsRequired) {
          initialTier = tier.name
          break
        }
      }
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        smeId: sme.id,
        name: customerData.name,
        email: customerData.email,
        birthDate: new Date(customerData.birthDate),
        gender: customerData.gender,
        phone: customerData.phone || null,
        externalId: customerData.externalId || null,
        points: initialPoints,
        tier: initialTier,
        qrCodeId,
      },
    })

    // Create initial transaction if YTD spend provided
    if (customerData.ytdSpend && customerData.ytdSpend > 0) {
      await prisma.transaction.create({
        data: {
          customerId: customer.id,
          points: initialPoints,
          description: `Initial YTD balance: $${customerData.ytdSpend.toFixed(2)}`,
          amount: customerData.ytdSpend,
          taxAmount: null,
        },
      })

      // Check and upgrade tier if needed
      await checkAndUpgradeTier(customer.id, initialPoints)
      
      // Refresh customer to get updated tier
      const updatedCustomer = await prisma.customer.findUnique({
        where: { id: customer.id },
      })
      
      if (updatedCustomer) {
        customer.tier = updatedCustomer.tier
        customer.points = updatedCustomer.points
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    
    return NextResponse.json({
      success: true,
      customerId: customer.id,
      qrCodeId: customer.qrCodeId,
      points: customer.points,
      tier: customer.tier,
      dashboardUrl: `${baseUrl}/customer/${customer.id}`,
    })
  } catch (error: any) {
    console.error('Error creating customer via API:', error)
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Duplicate entry. Customer may already exist.' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create customer', details: error.message },
      { status: 500 }
    )
  }
}

