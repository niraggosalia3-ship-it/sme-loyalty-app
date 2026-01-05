# Execution Plan - Version 0.4: Transaction Tracking & Benefit Redemption

## Overview
Implement QR code-based transaction tracking, configurable points system, automatic tier upgrades, and QR code-based benefit redemption.

---

## Phase 1: Database Schema Updates

### 1.1 Update SME Model
**Add fields:**
- `pointsMultiplier` (Float, default: 1.0) - Points per dollar spent
- `pointsCalculationMethod` (String, optional) - "simple" or "tiered"

**Files to modify:**
- `prisma/schema.prisma`

**Migration:**
```bash
npx prisma db push
npx prisma generate
```

### 1.2 Create CustomerBenefit Model
**New model:**
```prisma
model CustomerBenefit {
  id          String   @id @default(cuid())
  customerId String
  tierId     String
  benefitName String
  unlockedAt DateTime @default(now())
  usedAt     DateTime?
  status     String   @default("available") // "available" | "used" | "expired"
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
}
```

**Files to create:**
- Update `prisma/schema.prisma`

### 1.3 Update Customer Model
**Add fields:**
- `qrCodeId` (String, @unique) - Unique QR code identifier
- `lastTierUpgradeDate` (DateTime, optional)

**Files to modify:**
- `prisma/schema.prisma`

### 1.4 Update Transaction Model
**Verify fields exist:**
- ✅ `amount` (Float)
- ✅ `taxAmount` (Float, optional)
- ✅ `points` (Int) - Calculated points
- ✅ `description` (String)

**Files to check:**
- `prisma/schema.prisma`

---

## Phase 2: Points Multiplier Configuration

### 2.1 Update Program Editor UI
**Add to `/app/sme/[smeId]/program/page.tsx`:**
- Points multiplier input field
- Default value: 1.0
- Validation: Must be > 0
- Help text: "Points earned per $1 spent"

**UI Location:**
- Add after "How to Earn Points" section
- Before tier management section

**Files to modify:**
- `app/sme/[smeId]/program/page.tsx`

### 2.2 Update Program API
**Modify `/app/api/smes/id/[smeId]/program/route.ts`:**
- Accept `pointsMultiplier` in PUT request
- Save to database
- Return in GET response

**Files to modify:**
- `app/api/smes/id/[smeId]/program/route.ts`

### 2.3 Display Points Multiplier
**Update program page:**
- Show points multiplier in "How to Earn Points" section
- Example: "Earn 1.5 points for every $1 you spend"

**Files to modify:**
- `app/program/[linkId]/page.tsx`

---

## Phase 3: Customer QR Code Generation

### 3.1 Generate QR Code on Customer Creation
**Modify `/app/api/customers/route.ts`:**
- Generate unique `qrCodeId` when customer is created
- Use format: `CUST-{randomString}` or UUID
- Save to customer record

**Files to modify:**
- `app/api/customers/route.ts`

### 3.2 Create Customer QR Code Display
**New component/page:**
- Customer dashboard shows their QR code
- QR code contains: `{baseUrl}/customer/{customerId}/qr/{qrCodeId}`
- Download/print option

**Files to create:**
- `app/customer/[customerId]/qr/page.tsx` (optional - for customer to view)
- Update `app/customer/[customerId]/page.tsx` to show QR code

### 3.3 QR Code API Endpoint
**Create `/app/api/customer/qr/[qrCodeId]/route.ts`:**
- Verify QR code ID
- Return customer information (for SME scanning)
- Include: customerId, name, current tier, available benefits

**Files to create:**
- `app/api/customer/qr/[qrCodeId]/route.ts`

---

## Phase 4: QR Code Transaction Entry

### 4.1 Create QR Scanner Interface
**New page: `/app/sme/[smeId]/scan`**
- Camera/QR scanner interface
- Or manual QR code input field
- Scan/enter QR code → fetch customer data

**Files to create:**
- `app/sme/[smeId]/scan/page.tsx`

**Libraries needed:**
- `react-qr-reader` or `html5-qrcode` for scanning
- Or simple input field for manual entry

### 4.2 Transaction Entry Form
**After QR scan:**
- Display customer info (name, current tier, points)
- Transaction form:
  - Amount input (required)
  - Tax amount input (optional)
  - Description (optional, auto-filled)
- Calculate and show points to be earned (preview)
- Submit button

**UI Flow:**
```
Scan QR → Customer Found → Transaction Form → Submit → Success
```

**Files to create:**
- `app/sme/[smeId]/scan/page.tsx` (includes form)

### 4.3 Transaction Creation API
**Create `/app/api/transactions/route.ts`:**
- Accept: customerId, amount, taxAmount, description, smeId
- Calculate points: `amount × pointsMultiplier`
- Create transaction record
- Update customer points
- Check and update tier (if needed)
- Return transaction details

**Files to create:**
- `app/api/transactions/route.ts`

**Logic:**
```typescript
1. Get customer and SME
2. Get SME's pointsMultiplier
3. Calculate points = amount × multiplier
4. Update customer.points += points
5. Check tier thresholds
6. If points >= next tier threshold:
   - Update customer.tier
   - Unlock new tier benefits
7. Create transaction record
8. Return success
```

### 4.4 Add Navigation to SME Dashboard
**Update `/app/sme/[smeId]/page.tsx`:**
- Add "Scan QR Code" button in header
- Prominent placement (top right or main CTA)

**Files to modify:**
- `app/sme/[smeId]/page.tsx`

---

## Phase 5: Automatic Tier Upgrade Logic

### 5.1 Tier Upgrade Function
**Create utility function:**
- `lib/tier-upgrade.ts` or similar
- Function: `checkAndUpgradeTier(customerId, newPointsTotal)`
- Logic:
  1. Get customer's SME
  2. Get all tiers for SME (ordered by pointsRequired)
  3. Find highest tier where points >= pointsRequired
  4. If different from current tier:
     - Update customer.tier
     - Unlock new tier benefits (create CustomerBenefit records)
     - Set lastTierUpgradeDate
  5. Return upgrade info

**Files to create:**
- `lib/tier-upgrade.ts`

### 5.2 Integrate with Transaction API
**Update transaction creation:**
- After updating points, call tier upgrade function
- Handle tier upgrades automatically

**Files to modify:**
- `app/api/transactions/route.ts`

### 5.3 Tier Upgrade Notification
**Optional enhancement:**
- Return upgrade notification in API response
- Display in UI: "Customer upgraded to Silver tier!"
- Show newly unlocked benefits

**Files to modify:**
- `app/api/transactions/route.ts`
- `app/sme/[smeId]/scan/page.tsx`

---

## Phase 6: Benefit Unlock System

### 6.1 Unlock Benefits on Tier Upgrade
**In tier upgrade function:**
- When tier upgrades, get all benefits for new tier
- Create CustomerBenefit records for each benefit
- Status: "available"
- Set unlockedAt timestamp

**Files to modify:**
- `lib/tier-upgrade.ts`

### 6.2 Display Available Benefits
**Update customer view in SME dashboard:**
- Show available benefits for each customer
- Display in customer card or expandable section
- Show: benefit name, tier, status

**Files to modify:**
- `app/sme/[smeId]/page.tsx`

### 6.3 Benefit Redemption Interface
**Add to customer card:**
- "Redeem Benefit" button
- Modal/dropdown showing available benefits
- Select benefit → Confirm → Mark as used

**Files to modify:**
- `app/sme/[smeId]/page.tsx`

---

## Phase 7: QR Code Benefit Redemption

### 7.1 Benefit Redemption Scanner
**Update scan page:**
- After scanning customer QR code
- Show customer info + available benefits
- "Redeem Benefit" section
- Select benefit from list
- Confirm redemption

**Files to modify:**
- `app/sme/[smeId]/scan/page.tsx`

### 7.2 Benefit Redemption API
**Create `/app/api/benefits/redeem/route.ts`:**
- Accept: customerId, benefitId, smeId
- Verify benefit is available for customer
- Update CustomerBenefit:
  - Set status to "used"
  - Set usedAt timestamp
- Optional: Create redemption transaction record
- Return success

**Files to create:**
- `app/api/benefits/redeem/route.ts`

### 7.3 Prevent Double Redemption
**In redemption API:**
- Check if benefit status is "available"
- If already "used", return error
- Ensure atomic update (database transaction)

**Files to modify:**
- `app/api/benefits/redeem/route.ts`

---

## Phase 8: Customer QR Code Display

### 8.1 Generate QR Code for Customer
**Update customer dashboard:**
- Display customer's QR code
- QR code data: `{baseUrl}/api/customer/qr/{qrCodeId}`
- Download/print option
- Instructions: "Show this QR code at the store"

**Files to modify:**
- `app/customer/[customerId]/page.tsx`

**QR Code content:**
- URL that SME can scan
- Or direct customer ID + QR code ID

### 8.2 QR Code Component
**Use existing library:**
- `react-qr-code` (already installed)
- Generate QR code with customer's unique QR ID

**Files to modify:**
- `app/customer/[customerId]/page.tsx`

---

## Phase 9: Testing & Validation

### 9.1 Test Transaction Flow
- Create transaction via QR scan
- Verify points calculation
- Verify tier upgrade
- Verify benefit unlock

### 9.2 Test Benefit Redemption
- Scan customer QR code
- Redeem benefit
- Verify benefit marked as used
- Verify cannot redeem again

### 9.3 Test Edge Cases
- Customer with no QR code (backward compatibility)
- Transaction with 0 amount
- Tier upgrade at exact threshold
- Multiple rapid transactions
- Benefit redemption for locked benefit

---

## Phase 10: UI/UX Enhancements

### 10.1 Transaction Success Feedback
- Show points earned
- Show tier upgrade (if applicable)
- Show newly unlocked benefits
- Success animation

### 10.2 Customer Search Fallback
- If QR scanning fails, allow manual customer search
- Autocomplete customer list
- Select customer → proceed with transaction

### 10.3 Recent Transactions Display
- Show last 5-10 transactions in scan page
- Quick reference for SME
- Filter by customer (optional)

### 10.4 Benefit History
- Show used benefits in customer view
- Date redeemed
- Status indicators

---

## Implementation Order (Recommended)

### Week 1: Foundation
1. ✅ Phase 1: Database schema updates
2. ✅ Phase 2: Points multiplier configuration
3. ✅ Phase 3: Customer QR code generation

### Week 2: Core Features
4. ✅ Phase 4: QR code transaction entry
5. ✅ Phase 5: Automatic tier upgrade logic
6. ✅ Phase 6: Benefit unlock system

### Week 3: Redemption & Polish
7. ✅ Phase 7: QR code benefit redemption
8. ✅ Phase 8: Customer QR code display
9. ✅ Phase 9: Testing & validation
10. ✅ Phase 10: UI/UX enhancements

---

## Dependencies & Libraries

### New Libraries Needed:
- `html5-qrcode` or `react-qr-reader` - QR code scanning
- `react-qr-code` - Already installed (for generating QR codes)

### Installation:
```bash
npm install html5-qrcode
# or
npm install react-qr-reader
```

---

## Database Migration Checklist

- [ ] Add `pointsMultiplier` to SME model
- [ ] Create `CustomerBenefit` model
- [ ] Add `qrCodeId` to Customer model
- [ ] Add `lastTierUpgradeDate` to Customer model
- [ ] Verify Transaction model has all needed fields
- [ ] Run migrations: `npx prisma db push`
- [ ] Generate Prisma client: `npx prisma generate`

---

## API Endpoints to Create

1. `POST /api/transactions` - Create transaction with auto-calc
2. `GET /api/customer/qr/[qrCodeId]` - Get customer by QR code
3. `POST /api/benefits/redeem` - Redeem a benefit
4. `GET /api/customers/[customerId]/benefits` - Get customer benefits

---

## Files to Create

1. `lib/tier-upgrade.ts` - Tier upgrade logic
2. `app/api/transactions/route.ts` - Transaction creation
3. `app/api/customer/qr/[qrCodeId]/route.ts` - QR code lookup
4. `app/api/benefits/redeem/route.ts` - Benefit redemption
5. `app/sme/[smeId]/scan/page.tsx` - QR scanner & transaction entry
6. `app/customer/[customerId]/qr/page.tsx` - Customer QR code view (optional)

---

## Files to Modify

1. `prisma/schema.prisma` - Add new models/fields
2. `app/sme/[smeId]/program/page.tsx` - Add points multiplier input
3. `app/api/smes/id/[smeId]/program/route.ts` - Handle points multiplier
4. `app/api/customers/route.ts` - Generate QR code on creation
5. `app/sme/[smeId]/page.tsx` - Add scan button, show benefits
6. `app/customer/[customerId]/page.tsx` - Show customer QR code
7. `app/program/[linkId]/page.tsx` - Display points multiplier

---

## Risk Mitigation

### Backward Compatibility:
- Existing customers without QR codes: Generate on next access
- Existing transactions: Keep as-is
- Missing points multiplier: Default to 1.0

### Data Integrity:
- Use database transactions for tier upgrades
- Validate QR code before processing
- Prevent duplicate benefit redemptions

### Error Handling:
- Invalid QR code → Show error message
- Customer not found → Clear error
- Transaction failure → Rollback points update

---

## Success Criteria

✅ SME can configure points multiplier
✅ Customer QR codes generated automatically
✅ SME can scan QR code to add transaction
✅ Points calculated and added automatically
✅ Tier upgrades happen automatically
✅ Benefits unlock on tier upgrade
✅ SME can redeem benefits via QR scan
✅ Benefits cannot be redeemed twice
✅ Customer can view their QR code
✅ All existing features still work

---

## Notes

- Start with Phase 1-3 to establish foundation
- Test each phase before moving to next
- Keep existing functionality intact
- Add feature flags if needed for gradual rollout
- Document API changes
- Update LEARNINGS.md with any new issues

---

**Ready to start implementation!**


