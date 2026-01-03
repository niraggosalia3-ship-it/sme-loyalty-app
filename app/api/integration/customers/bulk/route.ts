import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkAndUpgradeTier } from '@/lib/tier-upgrade'
import { randomBytes } from 'crypto'

function generateQRCodeId(): string {
  return 'CUST-' + randomBytes(8).toString('hex').toUpperCase()
}

interface BulkCustomerData {
  name: string
  email: string
  birthDate: string
  gender: string
  phone?: string
  externalId?: string
  ytdSpend?: number
  joinDate?: string
  metadata?: Record<string, any>
}

interface ImportResult {
  success: boolean
  customerId?: string
  qrCodeId?: string
  email: string
  error?: string
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
    const customers: BulkCustomerData[] = body.customers || []

    if (!Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json(
        { error: 'customers array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Limit batch size
    const MAX_BATCH_SIZE = 1000
    if (customers.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_BATCH_SIZE} customers per batch` },
        { status: 400 }
      )
    }

    const results: ImportResult[] = []
    const existingEmails = new Set<string>()

    // Get existing emails for this SME to check duplicates
    const existingCustomers = await prisma.customer.findMany({
      where: { smeId: sme.id },
      select: { email: true },
    })
    existingCustomers.forEach(c => existingEmails.add(c.email.toLowerCase()))

    // Process customers in batch
    for (let i = 0; i < customers.length; i++) {
      const customerData = customers[i]
      
      try {
        // Validate required fields
        if (!customerData.name || !customerData.email || !customerData.birthDate || !customerData.gender) {
          results.push({
            success: false,
            email: customerData.email || `Row ${i + 1}`,
            error: 'Missing required fields: name, email, birthDate, gender',
          })
          continue
        }

        // Check for duplicate email
        const emailLower = customerData.email.toLowerCase()
        if (existingEmails.has(emailLower)) {
          results.push({
            success: false,
            email: customerData.email,
            error: 'Duplicate email - customer already exists',
          })
          continue
        }

        // Generate QR code ID
        const qrCodeId = generateQRCodeId()

        // Calculate initial points if YTD spend provided
        let initialPoints = 0
        if (customerData.ytdSpend && customerData.ytdSpend > 0) {
          initialPoints = Math.round(customerData.ytdSpend * (sme.pointsMultiplier || 1.0))
        }

        // Determine initial tier
        let initialTier = 'Bronze'
        if (sme.tiers && sme.tiers.length > 0) {
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

        // Add to existing emails set
        existingEmails.add(emailLower)

        // Create initial transaction if YTD spend provided
        if (customerData.ytdSpend && customerData.ytdSpend > 0) {
          const transactionDate = customerData.joinDate 
            ? new Date(customerData.joinDate)
            : new Date()

          await prisma.transaction.create({
            data: {
              customerId: customer.id,
              points: initialPoints,
              description: `Initial YTD balance: $${customerData.ytdSpend.toFixed(2)}`,
              amount: customerData.ytdSpend,
              taxAmount: null,
              createdAt: transactionDate,
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

        results.push({
          success: true,
          customerId: customer.id,
          qrCodeId: customer.qrCodeId,
          email: customerData.email,
        })
      } catch (error: any) {
        console.error(`Error processing customer ${i + 1}:`, error)
        results.push({
          success: false,
          email: customerData.email || `Row ${i + 1}`,
          error: error.message || 'Unknown error',
        })
      }
    }

    // Calculate summary
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      summary: {
        total: customers.length,
        successful,
        failed,
      },
      results,
    })
  } catch (error: any) {
    console.error('Error in bulk customer import:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk import', details: error.message },
      { status: 500 }
    )
  }
}

