import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const body = await request.json()
    const { name, email, birthDate, gender, points, tier } = body

    // Verify customer exists and get SME ID for data isolation
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: params.customerId },
      select: { smeId: true },
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Update customer (only fields provided)
    const updatedCustomer = await prisma.customer.update({
      where: { id: params.customerId },
      data: {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.trim().toLowerCase() }),
        ...(birthDate && { birthDate: new Date(birthDate) }),
        ...(gender && { gender }),
        ...(points !== undefined && { points: parseInt(points) }),
        ...(tier && { tier }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        birthDate: true,
        gender: true,
        points: true,
        tier: true,
        createdAt: true,
      },
    })

    return NextResponse.json(updatedCustomer)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}


