const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function showDatabase() {
  try {
    console.log('\n' + '='.repeat(80))
    console.log('DATABASE LOCATION: prisma/dev.db (SQLite)')
    console.log('='.repeat(80) + '\n')

    // Fetch all SMEs
    const smes = await prisma.sME.findMany({
      include: {
        customers: {
          include: {
            transactions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📊 TOTAL SMEs: ${smes.length}\n`)

    smes.forEach((sme, index) => {
      console.log('─'.repeat(80))
      console.log(`\n🏢 SME #${index + 1}`)
      console.log('─'.repeat(80))
      console.log(`ID:              ${sme.id}`)
      console.log(`Company Name:    ${sme.companyName}`)
      console.log(`Unique Link ID:   ${sme.uniqueLinkId}`)
      console.log(`Form Link:       http://localhost:3000/form/${sme.uniqueLinkId}`)
      console.log(`Created At:      ${sme.createdAt.toLocaleString()}`)
      console.log(`Total Customers: ${sme.customers.length}`)

      if (sme.customers.length > 0) {
        console.log('\n  👥 CUSTOMERS:')
        console.log('  ' + '─'.repeat(76))
        sme.customers.forEach((customer, custIndex) => {
          console.log(`\n  Customer #${custIndex + 1}:`)
          console.log(`    ID:          ${customer.id}`)
          console.log(`    Name:        ${customer.name}`)
          console.log(`    Email:       ${customer.email}`)
          console.log(`    Birth Date:  ${customer.birthDate.toLocaleDateString()}`)
          console.log(`    Gender:      ${customer.gender}`)
          console.log(`    Points:      ${customer.points}`)
          console.log(`    Tier:        ${customer.tier}`)
          console.log(`    Created At:  ${customer.createdAt.toLocaleString()}`)
          console.log(`    Dashboard:   http://localhost:3000/customer/${customer.id}`)
          
          if (customer.transactions.length > 0) {
            console.log(`\n    📝 Transactions (${customer.transactions.length}):`)
            customer.transactions.forEach((tx, txIndex) => {
              console.log(`      ${txIndex + 1}. ${tx.description} | Points: ${tx.points >= 0 ? '+' : ''}${tx.points} | ${tx.createdAt.toLocaleString()}`)
            })
          } else {
            console.log(`    📝 Transactions: None (empty as expected for new customers)`)
          }
        })
      } else {
        console.log('\n  👥 CUSTOMERS: None yet')
      }
    })

    // Summary
    const totalCustomers = await prisma.customer.count()
    const totalTransactions = await prisma.transaction.count()
    
    console.log('\n' + '='.repeat(80))
    console.log('📈 DATABASE SUMMARY')
    console.log('='.repeat(80))
    console.log(`Total SMEs:        ${smes.length}`)
    console.log(`Total Customers:   ${totalCustomers}`)
    console.log(`Total Transactions: ${totalTransactions}`)
    console.log('='.repeat(80) + '\n')

  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

showDatabase()

