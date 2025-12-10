# Version History

## Version 0.3 (Current) - December 9, 2025

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

