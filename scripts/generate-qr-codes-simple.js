const sqlite3 = require('sqlite3').verbose()
const { randomBytes } = require('crypto')
const path = require('path')

const dbPath = path.join(__dirname, '../prisma/dev.db')
const db = new sqlite3.Database(dbPath)

function generateQRCodeId() {
  return 'CUST-' + randomBytes(8).toString('hex').toUpperCase()
}

db.serialize(() => {
  db.all("SELECT id, name FROM Customer WHERE qrCodeId IS NULL OR qrCodeId = ''", (err, customers) => {
    if (err) {
      console.error('Error:', err)
      db.close()
      return
    }

    console.log(`Found ${customers.length} customers without QR codes`)

    customers.forEach((customer, index) => {
      let qrCodeId = generateQRCodeId()
      
      // Check uniqueness
      db.get("SELECT id FROM Customer WHERE qrCodeId = ?", [qrCodeId], (err, row) => {
        if (err) {
          console.error('Error checking uniqueness:', err)
          return
        }

        if (row) {
          // Regenerate if exists
          qrCodeId = generateQRCodeId()
        }

        // Update customer
        db.run("UPDATE Customer SET qrCodeId = ? WHERE id = ?", [qrCodeId, customer.id], (err) => {
          if (err) {
            console.error(`Error updating ${customer.name}:`, err)
          } else {
            console.log(`✅ Generated QR code for ${customer.name}: ${qrCodeId}`)
          }

          if (index === customers.length - 1) {
            console.log('\n✅ All QR codes generated!')
            db.close()
          }
        })
      })
    })

    if (customers.length === 0) {
      console.log('All customers already have QR codes')
      db.close()
    }
  })
})


