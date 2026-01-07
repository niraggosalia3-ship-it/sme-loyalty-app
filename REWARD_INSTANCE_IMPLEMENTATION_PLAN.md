# Reward Instance Implementation Plan

## Overview
Implement a robust reward tracking system using a `RewardInstance` table to track stamp rewards with timestamps, status, and card cycle association.

## Database Schema Changes

### 1. Add RewardInstance Model
```prisma
model RewardInstance {
  id                String      @id @default(cuid())
  customerId        String
  stampRewardId     String      // Reference to StampReward (template)
  cardCycleNumber   Int         // Which card cycle this reward belongs to
  status            String      // "locked" | "available" | "redeemed" | "expired"
  createdAt         DateTime    @default(now()) // When reward instance was created
  unlockedAt        DateTime?   // When customer earned enough stamps
  redeemedAt        DateTime?   // When SME redeemed it
  expiresAt         DateTime?   // Year-end expiry (Dec 31 of next year from creation)
  customer          Customer    @relation(fields: [customerId], references: [id], onDelete: Cascade)
  stampReward       StampReward @relation(fields: [stampRewardId], references: [id], onDelete: Cascade)
  
  @@unique([customerId, stampRewardId, cardCycleNumber]) // One reward instance per reward per cycle
  @@index([customerId, cardCycleNumber])
  @@index([customerId, status])
  @@index([expiresAt]) // For expiration queries
}
```

### 2. Update Relationships
- Add `rewardInstances` relation to `Customer` model
- Add `rewardInstances` relation to `StampReward` model
- Keep `RedeemedReward` model temporarily for migration

## Implementation Phases

### Phase 1: Schema Update
1. Add `RewardInstance` model to `prisma/schema.prisma`
2. Update `Customer` and `StampReward` models with new relations
3. Run `npx prisma db push` to update database
4. Generate Prisma client

### Phase 2: Migration Script
Create a migration script to backfill `RewardInstance` from existing data:

**Migration Logic:**
1. For each customer with stamps:
   - Calculate their current `cardCycleNumber` and `stamps`
   - For each `stampReward` in their SME's program:
     - Calculate which card cycles they've been through
     - For each cycle:
       - Calculate total stamps at that cycle
       - Determine status:
         - If `totalStamps >= reward.stampsRequired`: Check if redeemed
           - If redeemed in `RedeemedReward` for that cycle: status = "redeemed", set `redeemedAt`
           - Else: status = "available", set `unlockedAt` to when stamps were reached
         - Else: status = "locked"
       - Set `expiresAt` to Dec 31 of next year from `createdAt`
       - Create `RewardInstance` record

2. Handle edge cases:
   - Customers with stamps but no card cycle reset yet
   - Customers with partial stamps on current card
   - Multiple redemptions of same reward in different cycles

### Phase 3: Transaction API Updates
**File: `app/api/transactions/route.ts`**

**When new card cycle starts:**
1. After detecting card reset (stamps exceed `stampsRequired`):
   - Create all `RewardInstance` records for new card cycle
   - Status = "locked" (all rewards start locked)
   - Set `expiresAt` to Dec 31 of next year
   - Set `createdAt` to current time

**When stamps are added:**
1. Calculate new total stamps
2. For each `RewardInstance` with status = "locked":
   - If `totalStamps >= reward.stampsRequired`:
     - Update status to "available"
     - Set `unlockedAt` to current time

### Phase 4: Redemption API Updates
**File: `app/api/rewards/redeem/route.ts`**

**Changes:**
1. Find `RewardInstance` by `customerId`, `stampRewardId`, and current `cardCycleNumber`
2. Verify status is "available" (not locked, redeemed, or expired)
3. Update `RewardInstance`:
   - Set status = "redeemed"
   - Set `redeemedAt` = current time
4. Create `RedeemedReward` record (for historical tracking during transition)
5. Create transaction record (negative stampsEarned)

### Phase 5: Customer API Updates
**Files:**
- `app/api/customers/[customerId]/route.ts`
- `app/api/customer/qr/[qrCodeId]/route.ts`

**Changes:**
1. Query `RewardInstance` instead of calculating from stamps/cycles
2. Filter by:
   - `customerId`
   - Current and previous `cardCycleNumber`
   - Status != "expired"
3. Return reward instances with:
   - Status
   - Card cycle number
   - Timestamps
   - Reward details from `StampReward`

### Phase 6: UI Component Updates
**Files:**
- `app/customer/[customerId]/page.tsx`
- `app/sme/[smeId]/scan/page.tsx`

**Changes:**
1. Use `RewardInstance` data from API instead of calculating
2. Display logic:
   - **locked**: Gray background, "Not Available"
   - **available**: Green background, "Visit store to redeem" / "Redeem" button
   - **redeemed**: Gray background, strikethrough, "Redeemed"
   - **expired**: Gray background, strikethrough, "Expired"
3. Group by card cycle (Previous Card / New Card badges)

### Phase 7: Expiration Logic
**File: `lib/reward-expiration.ts` (new)**

**Functions:**
1. `checkAndMarkExpired()`: 
   - Query all `RewardInstance` with status != "redeemed" and `expiresAt < now()`
   - Update status to "expired"
   - Run periodically (cron job or scheduled task)

2. `calculateExpiryDate(createdAt: Date)`: 
   - Return Dec 31 of next year from creation date
   - Example: Created 2025-01-15 → Expires 2026-12-31 23:59:59

### Phase 8: Testing & Validation
1. Test migration script on development database
2. Verify all existing customers have correct reward instances
3. Test new card cycle creation
4. Test reward unlocking when milestones reached
5. Test redemption flow
6. Test expiration logic
7. Verify UI displays correctly

## Data Migration Strategy

### Backfill Algorithm
```typescript
For each Customer with stamps:
  For each StampReward in their SME's program:
    Calculate totalStamps = (cardCycleNumber - 1) * stampsRequired + currentStamps
    
    For cycle = 1 to cardCycleNumber:
      cycleStamps = min(stampsRequired, totalStamps - (cycle - 1) * stampsRequired)
      totalStampsAtCycle = (cycle - 1) * stampsRequired + cycleStamps
      
      Check RedeemedReward for this cycle:
        If exists: status = "redeemed", redeemedAt = redemption.redeemedAt
        Else if totalStampsAtCycle >= reward.stampsRequired: 
          status = "available", unlockedAt = estimated (use transaction timestamps)
        Else: 
          status = "locked"
      
      expiresAt = Dec 31 of (year(createdAt) + 1)
      
      Create RewardInstance
```

## Indexes & Performance
- `@@index([customerId, cardCycleNumber])` - Fast queries for customer's rewards by cycle
- `@@index([customerId, status])` - Fast filtering by status
- `@@index([expiresAt])` - Fast expiration queries

## Security Considerations
- All queries filter by `customerId` to ensure data isolation
- Status transitions are validated (locked → available → redeemed)
- Expired rewards cannot be redeemed

## Rollback Plan
- Keep `RedeemedReward` table during migration
- Can revert to old calculation-based logic if needed
- Migration script can be re-run safely (uses unique constraint)

