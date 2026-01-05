const { PrismaClient } = require('@prisma/client')
const { randomBytes } = require('crypto')

const prisma = new PrismaClient()

function generateQRCodeId() {
  return 'CUST-' + randomBytes(8).toString('hex').toUpperCase()
}

async function generateMissingQRCodes() {
  try {
    // Get all customers using raw query to avoid schema issues
    const customers = await prisma.$queryRaw`
      SELECT id, name FROM Customer
    `

    console.log(`Found ${customers.length} customers`)

    for (const customer of customers) {
      // Check if has QR code
      const existing = await prisma.$queryRaw`
        SELECT qrCodeId FROM Customer WHERE id = ${customer.id}
      `
      
      if (existing && existing[0] && existing[0].qrCodeId) {
        console.log(`Customer ${customer.name} already has QR code`)
        continue
      }

      let qrCodeId = generateQRCodeId()
      
      // Check uniqueness
      let exists = await prisma.$queryRaw`
        SELECT id FROM Customer WHERE qrCodeId = ${qrCodeId}
      `
      
      let attempts = 0
      while (exists && exists.length > 0 && attempts < 10) {
        qrCodeId = generateQRCodeId()
        exists = await prisma.$queryRaw`
          SELECT id FROM Customer WHERE qrCodeId = ${qrCodeId}
        `
        attempts++
      }

      // Update using raw SQL
      await prisma.$executeRaw`
        UPDATE Customer SET qrCodeId = ${qrCodeId} WHERE id = ${customer.id}
      `

      console.log(`✅ Generated QR code for ${customer.name}: ${qrCodeId}`)
    }

    console.log('\n✅ All QR codes generated successfully!')
  } catch (error) {
    console.error('Error generating QR codes:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateMissingQRCodes()


