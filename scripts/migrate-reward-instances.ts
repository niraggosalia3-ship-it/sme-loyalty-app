/**
 * Migration script to backfill RewardInstance from existing data
 * 
 * This script:
 * 1. Reads all customers with stamps
 * 2. For each customer, calculates their card cycles
 * 3. Creates RewardInstance records for each reward in each cycle
 * 4. Determines status based on stamps and RedeemedReward records
 * 
 * Run with: npx tsx scripts/migrate-reward-instances.ts
 */

import { PrismaClient } from '@prisma/client'
import { calculateExpiryDate } from '../lib/reward-instance'

const prisma = new PrismaClient()

interface MigrationStats {
  customersProcessed: number
  rewardInstancesCreated: number
  errors: number
}

async function migrateRewardInstances(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    customersProcessed: 0,
    rewardInstancesCreated: 0,
    errors: 0,
  }

  console.log('Starting RewardInstance migration...')

  try {
    // Get all customers with stamps (stamp-based programs)
    const customers = await prisma.customer.findMany({
      where: {
        stamps: {
          gt: 0,
        },
      },
      include: {
        sme: {
          include: {
            stampRewards: {
              orderBy: { stampsRequired: 'asc' },
            },
          },
        },
        redeemedRewards: {
          include: {
            stampReward: true,
          },
        },
        transactions: {
          where: {
            stampsEarned: {
              not: null,
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    console.log(`Found ${customers.length} customers with stamps`)

    for (const customer of customers) {
      try {
        // Skip if not a stamp program
        if (customer.sme.loyaltyType !== 'stamps' || !customer.sme.stampsRequired) {
          continue
        }

        const stampsRequired = customer.sme.stampsRequired || 10
        const currentCardCycle = customer.cardCycleNumber || 1
        const currentStamps = customer.stamps || 0

        // Calculate total accumulated stamps
        const totalStamps =
          stampsRequired > 0
            ? (currentCardCycle - 1) * stampsRequired + currentStamps
            : currentStamps

        // Process each stamp reward
        for (const reward of customer.sme.stampRewards) {
          // Process each card cycle the customer has been through
          for (let cycle = 1; cycle <= currentCardCycle; cycle++) {
            // Calculate stamps at this cycle
            let stampsAtCycle = 0
            if (cycle < currentCardCycle) {
              // Previous cycles: full card
              stampsAtCycle = stampsRequired
            } else {
              // Current cycle: actual stamps
              stampsAtCycle = currentStamps
            }

            // Calculate total stamps accumulated by end of this cycle
            const totalStampsAtCycleEnd =
              stampsRequired > 0
                ? (cycle - 1) * stampsRequired + stampsAtCycle
                : stampsAtCycle

            // Check if reward was redeemed in this cycle
            const redemption = customer.redeemedRewards.find(
              (r) =>
                r.stampRewardId === reward.id &&
                r.cardCycleNumber === cycle
            )

            // Determine status
            let status: 'locked' | 'available' | 'redeemed' = 'locked'
            let unlockedAt: Date | null = null
            let redeemedAt: Date | null = null

            if (redemption) {
              status = 'redeemed'
              redeemedAt = redemption.redeemedAt
              // Estimate unlockedAt from transactions
              // Find transaction where total stamps reached reward.stampsRequired
              let runningTotal = 0
              for (const transaction of customer.transactions) {
                if (transaction.stampsEarned && transaction.stampsEarned > 0) {
                  runningTotal += transaction.stampsEarned
                  const cycleForTransaction = Math.floor(runningTotal / stampsRequired) + 1
                  if (
                    cycleForTransaction === cycle &&
                    runningTotal >= reward.stampsRequired &&
                    !unlockedAt
                  ) {
                    unlockedAt = transaction.createdAt
                    break
                  }
                }
              }
            } else if (totalStampsAtCycleEnd >= reward.stampsRequired) {
              status = 'available'
              // Estimate unlockedAt from transactions
              let runningTotal = 0
              for (const transaction of customer.transactions) {
                if (transaction.stampsEarned && transaction.stampsEarned > 0) {
                  runningTotal += transaction.stampsEarned
                  const cycleForTransaction = Math.floor(runningTotal / stampsRequired) + 1
                  if (
                    cycleForTransaction === cycle &&
                    runningTotal >= reward.stampsRequired &&
                    !unlockedAt
                  ) {
                    unlockedAt = transaction.createdAt
                    break
                  }
                }
              }
            }

            // Calculate expiry date (Dec 31 of next year from customer creation or cycle start)
            // Use customer creation date as base, or estimate cycle start
            const cycleStartDate =
              cycle === 1
                ? customer.createdAt
                : new Date(
                    customer.createdAt.getTime() +
                      (cycle - 1) * 30 * 24 * 60 * 60 * 1000
                  ) // Estimate 30 days per cycle
            const expiresAt = calculateExpiryDate(cycleStartDate)

            // Check if reward instance already exists
            const existing = await prisma.rewardInstance.findUnique({
              where: {
                customerId_stampRewardId_cardCycleNumber: {
                  customerId: customer.id,
                  stampRewardId: reward.id,
                  cardCycleNumber: cycle,
                },
              },
            })

            if (!existing) {
              await prisma.rewardInstance.create({
                data: {
                  customerId: customer.id,
                  stampRewardId: reward.id,
                  cardCycleNumber: cycle,
                  status,
                  createdAt: cycleStartDate,
                  unlockedAt,
                  redeemedAt,
                  expiresAt,
                },
              })
              stats.rewardInstancesCreated++
            }
          }
        }

        stats.customersProcessed++
        if (stats.customersProcessed % 10 === 0) {
          console.log(`Processed ${stats.customersProcessed} customers...`)
        }
      } catch (error) {
        console.error(`Error processing customer ${customer.id}:`, error)
        stats.errors++
      }
    }

    console.log('\nMigration completed!')
    console.log(`Customers processed: ${stats.customersProcessed}`)
    console.log(`Reward instances created: ${stats.rewardInstancesCreated}`)
    console.log(`Errors: ${stats.errors}`)

    return stats
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateRewardInstances()
    .then(() => {
      console.log('Migration script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration script failed:', error)
      process.exit(1)
    })
}

export { migrateRewardInstances }

