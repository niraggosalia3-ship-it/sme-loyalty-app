# Version History

## Version 0.4 (Current) - December 9, 2025

### Features Included:
✅ **QR Code Transaction Tracking**
- QR code scanning for customer lookup
- Quick transaction entry form (moved to top)
- Real-time points calculation based on configurable multiplier
- Automatic tier upgrades on transaction
- Transaction history display on scan page

✅ **Points & Tier Management**
- Configurable points multiplier per SME (in program editor)
- Automatic tier upgrade logic
- Tier upgrade notifications (SME scan page + customer dashboard)
- Points calculation: amount × multiplier

✅ **Benefit System**
- Automatic benefit unlocking on tier upgrade
- QR code-based benefit redemption
- Benefits display from current tier + all previous tiers
- Benefit status tracking (available/used)
- Redemption tracking with dates

✅ **Customer QR Codes**
- Automatic QR code generation on customer creation
- QR code display on customer dashboard (small, scannable)
- QR code display on SME scan page
- Unique QR code ID format: CUST-XXXXXXXX

✅ **Enhanced Customer Dashboard**
- Tier upgrade notification (if upgraded in last 24 hours)
- Navigation buttons (QR Code, Benefits, History, Program)
- Benefits display from all eligible tiers
- Smooth scroll navigation
- Link to loyalty program page

✅ **Enhanced SME Scan Page**
- Transaction form at top (after customer name)
- Customer QR code display
- All benefits from eligible tiers
- Transaction history table at bottom
- Real-time transaction updates

✅ **Database Updates**
- Added `pointsMultiplier` to SME model
- Created `CustomerBenefit` model
- Added `qrCodeId` to Customer model
- Added `lastTierUpgradeDate` to Customer model

✅ **New API Endpoints**
- `POST /api/transactions` - Create transaction with auto-calc
- `GET /api/customer/qr/[qrCodeId]` - Get customer by QR code
- `POST /api/benefits/redeem` - Redeem benefit by ID
- `POST /api/benefits/redeem-by-name` - Redeem benefit by name

### Technical Stack:
- Next.js 14 (App Router)
- TypeScript
- Prisma ORM with SQLite
- Tailwind CSS
- React QR Code library
- html5-qrcode library

### Git Tag:
```bash
git checkout v0.4
```

### Commit Hash:
Check with: `git log --oneline -1`

### How to Revert to This Version:
```bash
# View this version
git show v0.4

# Checkout this version (creates detached HEAD)
git checkout v0.4

# Or create a new branch from this version
git checkout -b restore-v0.4 v0.4
```

---

## Version 0.3 - December 9, 2025

### Features Included:
✅ **Program Page with Expanded Benefits**
- Always-expanded tier cards showing all benefits
- No click-to-expand functionality
- Better visibility for all rewards

✅ **Program Editor**
- Full program customization interface
- Edit program name, description, earning rules
- Brand color customization (primary & secondary)
- Tier management (add, edit, remove tiers)
- Set tier names, points required, benefits, colors

✅ **Security Improvements**
- Removed admin dashboard access from SME pages
- SME owners can only access their own data
- Better data isolation and privacy

✅ **Enhanced Program Features**
- Visual tier progression
- Brand-colored UI elements
- Program preview link
- Join program flow to registration form

### Technical Stack:
- Next.js 14 (App Router)
- TypeScript
- Prisma ORM with SQLite
- Tailwind CSS
- React QR Code library

### Git Tag:
```bash
git checkout v0.3
```

### Commit Hash:
Check with: `git log --oneline -1`

### How to Revert to This Version:
```bash
# View this version
git show v0.3

# Checkout this version (creates detached HEAD)
git checkout v0.3

# Or create a new branch from this version
git checkout -b restore-v0.3 v0.3
```

---

## Version 0.2 - December 9, 2025

### Features Included:
✅ **SME Customer Management Dashboard**
- New page for each SME to view their customers
- Inline editing of customer information (Name, Email, Birth Date, Gender, Points, Tier)
- Expandable customer cards showing transaction history
- Transaction table with: Transaction ID, Customer ID, Date, Amount (ex. tax), Tax Amount, Points, Description
- Data isolation - each SME can only view their own customers

✅ **Admin Dashboard Updates**
- "View Customers" button added under each SME
- Renamed "Copy Link" to "Customer Registration Link"
- Vertical button layout (buttons stacked)

✅ **Database Updates**
- Added `amount` and `taxAmount` fields to Transaction model
- Enhanced transaction tracking capabilities

✅ **API Routes**
- `/api/smes/id/[smeId]` - Get SME by ID
- `/api/smes/id/[smeId]/customers` - Get customers for SME (with data isolation)
- `/api/customers/[customerId]/update` - Update customer information
- Enhanced transaction endpoints with amount/tax data

### Technical Stack:
- Next.js 14 (App Router)
- TypeScript
- Prisma ORM with SQLite
- Tailwind CSS
- React QR Code library

### Git Tag:
```bash
git checkout v0.2
```

### Commit Hash:
Check with: `git log --oneline -1`

### How to Revert to This Version:
```bash
# View this version
git show v0.2

# Checkout this version (creates detached HEAD)
git checkout v0.2

# Or create a new branch from this version
git checkout -b restore-v0.2 v0.2
```

---

## Version 0.1 - December 9, 2025

### Features Included:
✅ **Admin Dashboard**
- Create new SME companies
- Generate unique form links for each SME
- View all existing SMEs
- Copy links to clipboard

✅ **QR Code Generation**
- Automatic QR code generation for each SME link
- Display QR codes in admin dashboard
- QR codes link directly to customer forms

✅ **Banner Image Support**
- Upload banner images for each SME (optional)
- Image preview before submission
- Banner displays at top of customer form
- Horizontal rectangle format (1200x300px recommended)
- Max file size: 5MB

✅ **Customer Form**
- Dynamic form accessible via unique links
- Collects: Name, Birth Date, Email, Gender
- Displays SME banner image at top (if uploaded)
- Form validation and error handling

✅ **Customer Dashboard**
- Shows points balance (starts at 0)
- Displays tier status (starts at "Bronze")
- Transaction history table (ready for future use)

✅ **Database**
- SQLite database with Prisma ORM
- Three tables: SMEs, Customers, Transactions
- Data isolation per SME

### Technical Stack:
- Next.js 14 (App Router)
- TypeScript
- Prisma ORM with SQLite
- Tailwind CSS
- React QR Code library

### Git Tag:
```bash
git checkout v0.1
```

### Commit Hash:
`05a8ea6`

### How to Revert to This Version:
```bash
# View this version
git show v0.1

# Checkout this version (creates detached HEAD)
git checkout v0.1

# Or create a new branch from this version
git checkout -b restore-v0.1 v0.1
```

