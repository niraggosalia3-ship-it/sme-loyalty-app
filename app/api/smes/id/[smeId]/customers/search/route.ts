import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { smeId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const emailQuery = searchParams.get('email')?.trim().toLowerCase()

    if (!emailQuery || emailQuery.length < 3) {
      return NextResponse.json(
        { error: 'Email query must be at least 3 characters' },
        { status: 400 }
      )
    }

    // Verify SME exists
    const sme = await prisma.sME.findUnique({
      where: { id: params.smeId },
    })

    if (!sme) {
      return NextResponse.json({ error: 'SME not found' }, { status: 404 })
    }

    // Search customers by email (filtered by SME for data isolation)
    // Use case-insensitive search with contains
    // Note: PostgreSQL requires the field to be searched in lowercase for case-insensitive search
    const customers = await prisma.customer.findMany({
      where: {
        smeId: params.smeId,
        email: {
          contains: emailQuery,
          mode: 'insensitive', // Case-insensitive search (works with PostgreSQL)
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        qrCodeId: true,
        points: true,
        stamps: true,
        tier: true,
        sme: {
          select: {
            loyaltyType: true,
          },
        },
      },
      orderBy: [
        // Prioritize exact matches, then starts with, then contains
        { email: 'asc' },
      ],
      take: 10, // Limit to 10 results
    })

    // Sort results: exact matches first, then starts with, then contains
    const sortedCustomers = customers.sort((a, b) => {
      const aEmail = a.email.toLowerCase()
      const bEmail = b.email.toLowerCase()
      const query = emailQuery.toLowerCase()

      // Exact match
      if (aEmail === query && bEmail !== query) return -1
      if (bEmail === query && aEmail !== query) return 1

      // Starts with
      if (aEmail.startsWith(query) && !bEmail.startsWith(query)) return -1
      if (bEmail.startsWith(query) && !aEmail.startsWith(query)) return 1

      // Alphabetical
      return aEmail.localeCompare(bEmail)
    })

    return NextResponse.json(sortedCustomers)
  } catch (error) {
    console.error('Error searching customers:', error)
    return NextResponse.json(
      { error: 'Failed to search customers' },
      { status: 500 }
    )
  }
}

