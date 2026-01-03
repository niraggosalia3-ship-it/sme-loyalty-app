import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

function generateQRCodeId(): string {
  return 'CUST-' + randomBytes(8).toString('hex').toUpperCase()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, birthDate, email, gender, linkId } = body

    // Validate required fields
    if (!name || !birthDate || !email || !gender || !linkId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Find SME by linkId
    const sme = await prisma.sME.findUnique({
      where: { uniqueLinkId: linkId },
    })

    if (!sme) {
      return NextResponse.json({ error: 'Invalid form link' }, { status: 404 })
    }

    // Check if email already exists for this SME
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        smeId: sme.id,
        email: email.trim().toLowerCase(),
      },
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Email already registered for this company' },
        { status: 400 }
      )
    }

    // Generate unique QR code ID
    let qrCodeId = generateQRCodeId()
    let exists = await prisma.customer.findUnique({
      where: { qrCodeId },
    })
    
    // Ensure uniqueness
    while (exists) {
      qrCodeId = generateQRCodeId()
      exists = await prisma.customer.findUnique({
        where: { qrCodeId },
      })
    }

    // Create customer with default values
    const customer = await prisma.customer.create({
      data: {
        smeId: sme.id,
        name: name.trim(),
        birthDate: new Date(birthDate),
        email: email.trim().toLowerCase(),
        gender,
        points: 0,
        tier: 'Bronze',
        qrCodeId,
      },
    })

    return NextResponse.json({
      customerId: customer.id,
      message: 'Customer created successfully',
    })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}

