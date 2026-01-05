const { PrismaClient } = require('@prisma/client')
const { randomBytes } = require('crypto')

const prisma = new PrismaClient()

function generateQRCodeId() {
  return 'CUST-' + randomBytes(8).toString('hex').toUpperCase()
}

async function generateMissingQRCodes() {
  try {
    // Get all customers
    const customers = await prisma.customer.findMany()

    console.log(`Found ${customers.length} customers`)

    for (const customer of customers) {
      // Check if already has QR code
      const existing = await prisma.$queryRaw`
        SELECT qrCodeId FROM Customer WHERE id = ${customer.id}
      `
      
      if (existing && existing[0] && existing[0].qrCodeId) {
        console.log(`Customer ${customer.name} already has QR code: ${existing[0].qrCodeId}`)
        continue
      }

      let qrCodeId = generateQRCodeId()
      
      // Ensure uniqueness by checking database directly
      let exists = await prisma.$queryRaw`
        SELECT id FROM Customer WHERE qrCodeId = ${qrCodeId}
      `
      
      while (exists && exists.length > 0) {
        qrCodeId = generateQRCodeId()
        exists = await prisma.$queryRaw`
          SELECT id FROM Customer WHERE qrCodeId = ${qrCodeId}
        `
      }

      // Update using raw SQL
      await prisma.$executeRaw`
        UPDATE Customer SET qrCodeId = ${qrCodeId} WHERE id = ${customer.id}
      `

      console.log(`Generated QR code for ${customer.name}: ${qrCodeId}`)
    }

    console.log('✅ All QR codes generated successfully!')
  } catch (error) {
    console.error('Error generating QR codes:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateMissingQRCodes()


