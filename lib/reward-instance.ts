/**
 * Utility functions for managing RewardInstance records
 */

import { prisma } from './prisma'

/**
 * Calculate expiry date for a reward instance
 * Expires at end of next year from creation date
 * Example: Created 2025-01-15 → Expires 2026-12-31 23:59:59
 */
export function calculateExpiryDate(createdAt: Date): Date {
  const year = createdAt.getFullYear()
  const nextYear = year + 1
  // Return Dec 31 of next year at 23:59:59
  return new Date(nextYear, 11, 31, 23, 59, 59, 999)
}

/**
 * Check and mark expired reward instances
 * Updates status to "expired" for rewards that have passed their expiry date
 */
export async function checkAndMarkExpired(): Promise<number> {
  const now = new Date()
  
  const result = await prisma.rewardInstance.updateMany({
    where: {
      status: {
        not: 'redeemed', // Don't mark redeemed rewards as expired
      },
      expiresAt: {
        lt: now, // Expiry date has passed
      },
    },
    data: {
      status: 'expired',
    },
  })

  return result.count
}

/**
 * Create reward instances for a new card cycle
 * Creates all reward instances with status "locked" for the given card cycle
 */
export async function createRewardInstancesForCycle(
  customerId: string,
  cardCycleNumber: number,
  stampRewardIds: string[]
): Promise<void> {
  const now = new Date()
  const expiresAt = calculateExpiryDate(now)

  // Create reward instances for all stamp rewards
  const instances = stampRewardIds.map((stampRewardId) => ({
    customerId,
    stampRewardId,
    cardCycleNumber,
    status: 'locked' as const,
    createdAt: now,
    expiresAt,
    unlockedAt: null,
    redeemedAt: null,
  }))

  // Use createMany with skipDuplicates to handle race conditions
  await prisma.rewardInstance.createMany({
    data: instances,
    skipDuplicates: true, // Skip if already exists (unique constraint)
  })
}

/**
 * Update reward instance status from locked to available
 * Called when customer reaches the required stamp milestone
 */
export async function unlockRewardInstance(
  customerId: string,
  stampRewardId: string,
  cardCycleNumber: number
): Promise<void> {
  await prisma.rewardInstance.updateMany({
    where: {
      customerId,
      stampRewardId,
      cardCycleNumber,
      status: 'locked',
    },
    data: {
      status: 'available',
      unlockedAt: new Date(),
    },
  })
}

/**
 * Get reward instances for a customer, filtered by card cycles
 * Returns instances for current and previous card cycles
 */
export async function getRewardInstancesForCustomer(
  customerId: string,
  currentCardCycle: number,
  includeExpired: boolean = false
) {
  const where: any = {
    customerId,
    cardCycleNumber: {
      // Include current cycle and previous cycle (for unredeemed rewards)
      in: [currentCardCycle, currentCardCycle - 1],
    },
  }

  if (!includeExpired) {
    where.status = {
      not: 'expired',
    }
  }

  return prisma.rewardInstance.findMany({
    where,
    include: {
      stampReward: true,
    },
    orderBy: [
      { cardCycleNumber: 'desc' }, // Newer cycles first
      { stampReward: { order: 'asc' } }, // By reward order
    ],
  })
}

