const { PrismaClient } = require('@prisma/client')
const { randomBytes } = require('crypto')

const prisma = new PrismaClient()

function generateQRCodeId() {
  return 'CUST-' + randomBytes(8).toString('hex').toUpperCase()
}

async function generateMissingQRCodes() {
  try {
    const customersWithoutQR = await prisma.customer.findMany({
      where: { qrCodeId: null },
    })

    console.log(`Found ${customersWithoutQR.length} customers without QR codes`)

    for (const customer of customersWithoutQR) {
      let qrCodeId = generateQRCodeId()
      
      // Ensure uniqueness
      let exists = await prisma.customer.findUnique({
        where: { qrCodeId },
      })
      
      while (exists) {
        qrCodeId = generateQRCodeId()
        exists = await prisma.customer.findUnique({
          where: { qrCodeId },
        })
      }

      await prisma.customer.update({
        where: { id: customer.id },
        data: { qrCodeId },
      })

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


