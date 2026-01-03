# Version History

## Version 0.7 (Current) - December 10, 2025

### Features Included:
✅ **AI-Native Program Creation (Conversational Setup)**
- New AI-powered program creation flow: `/create-ai`
- Hybrid UI combining conversational chat with interactive cards
- Lower barrier to entry for SME onboarding
- Step-by-step guided setup process

✅ **AI-Powered Suggestions**
- **Program Name Generation**: AI suggests multiple program names with explanations
- **Tier Structure Suggestions**: AI recommends tier thresholds based on business context
- **Tier Name Suggestions**: Context-aware tier naming (not just Bronze/Silver/Gold)
- **Benefit Recommendations**: AI suggests benefits per tier based on business type and tier level
- **Banner Image Generation**: Gradient-based banner style previews (Professional & Modern, Vibrant & Energetic, Minimalist & Clean)

✅ **Interactive Program Builder**
- Clickable and editable suggestions (no need to type everything)
- Inline editing of tier names and point thresholds
- Benefit selection/deselection per tier
- Live preview sidebar showing program configuration
- Automatic step progression with user control

✅ **Gradient Banner System**
- Three pre-designed banner styles with gradient previews
- Automatic banner image generation from selected gradient style
- Canvas-based image generation with program name
- Data URL storage for banner images
- Custom image upload option still available

✅ **Enhanced Banner Display**
- Banner consistently displayed at top of all pages
- Banner on SME customer management page (moved to top)
- Banner on program pages
- Banner on customer forms
- Consistent styling across all pages

✅ **Improved User Experience**
- Fixed tier editing (points threshold editing works correctly)
- Fixed benefit selection flow (no premature step advancement)
- Fixed image selector display (gradient previews visible)
- Better error handling and loading states
- Smooth step transitions

✅ **New Pages**
- `/create-ai` - AI-powered program creation interface
- Enhanced admin dashboard with "Create Program with AI" button

✅ **New Components**
- `ChatInterface` - Conversational UI with context gathering
- `ProgramNameSelector` - Interactive program name selection
- `TierBuilder` - Editable tier structure builder
- `BenefitSelector` - Per-tier benefit selection
- `ImageSelector` - Banner style/image selection
- `LivePreview` - Real-time program preview sidebar

✅ **New Hooks**
- `useProgramBuilder` - Centralized state management for AI program creation
- Handles context gathering, AI suggestions, and final program save

✅ **New API Endpoints**
- `POST /api/ai/program/name` - Generate program name suggestions
- `POST /api/ai/program/tiers` - Generate tier structure suggestions
- `POST /api/ai/program/benefits` - Generate benefit suggestions per tier
- `POST /api/ai/program/image` - Generate banner image style options

✅ **Technical Improvements**
- Canvas-based gradient banner generation
- Improved state management for complex multi-step flows
- Better error handling and user feedback
- Fixed JSX structure issues in SME customer management page

### Technical Stack:
- Next.js 14 (App Router)
- TypeScript
- Prisma ORM with SQLite
- Tailwind CSS
- React QR Code library
- HTML5 Canvas API (for banner generation)
- React Hooks for state management

### Git Tag:
```bash
git checkout v0.7
```

### Commit Hash:
Check with: `git log --oneline -1`

### How to Revert to This Version:
```bash
# View this version
git show v0.7

# Checkout this version (creates detached HEAD)
git checkout v0.7

# Or create a new branch from this version
git checkout -b restore-v0.7 v0.7
```

---

## Version 0.6 - December 10, 2025

### Features Included:
✅ **API Integration System**
- API key management per SME account
- Generate, show/hide, and regenerate API keys
- Secure API key format: `SME-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX`
- API key displayed in Customer Management Dashboard

✅ **Single Customer Creation API**
- `POST /api/integration/customers` endpoint
- API key authentication via `X-API-Key` header
- Support for optional fields: phone, externalId, ytdSpend
- Automatic points and tier calculation from YTD spend
- Initial transaction record creation for YTD spend
- Duplicate email detection (returns existing customer info)
- Comprehensive error handling

✅ **Bulk Customer Import (JSON API)**
- `POST /api/integration/customers/bulk` endpoint
- Batch processing (up to 1,000 customers per request)
- Per-row error handling (failures don't stop batch)
- Detailed results with success/failure status
- Summary statistics (total, successful, failed)

✅ **CSV Bulk Import (Web UI)**
- New import page: `/sme/[smeId]/import`
- CSV file upload with validation
- Flexible column name matching (handles various formats)
- Auto-detection of headers (works with or without header row)
- Progress indicator during import
- Results table with success/failure details
- Error report download (CSV format)
- File size limit: 10MB, Row limit: 10,000
- Improved file reading with modern File API + FileReader fallback

✅ **YTD Spend Processing**
- Calculates initial points: `points = ytdSpend × pointsMultiplier`
- Determines initial tier based on accumulated points
- Creates initial transaction record for transparency
- Automatically upgrades tier if applicable
- Supports optional `joinDate` for transaction dating

✅ **Enhanced Customer Model**
- Added `phone` field (optional)
- Added `externalId` field (optional) - for mapping to external systems
- Better integration with existing customer management

✅ **Database Updates**
- Added `apiKey` field to SME model (unique, optional)
- Added `phone` field to Customer model (optional)
- Added `externalId` field to Customer model (optional)

✅ **New API Endpoints**
- `POST /api/integration/customers` - Single customer creation
- `POST /api/integration/customers/bulk` - Bulk customer import
- `POST /api/smes/id/[smeId]/api-key` - Generate/regenerate API key
- `GET /api/smes/id/[smeId]/api-key` - Get API key status
- `POST /api/customers` - Export `generateQRCodeId` function

✅ **New Pages**
- `/sme/[smeId]/import` - CSV bulk import interface
- Enhanced Customer Management Dashboard with API key section

✅ **New Utilities**
- `lib/api-key.ts` - API key generation and validation
- Enhanced CSV parsing with header auto-detection
- Improved file reading with multiple fallback methods

### Technical Stack:
- Next.js 14 (App Router)
- TypeScript
- Prisma ORM with SQLite
- Tailwind CSS
- React QR Code library
- FileReader API + Modern File API

### Git Tag:
```bash
git checkout v0.6
```

### Commit Hash:
`cd42edf`

### How to Revert to This Version:
```bash
# View this version
git show v0.6

# Checkout this version (creates detached HEAD)
git checkout v0.6

# Or create a new branch from this version
git checkout -b restore-v0.6 v0.6
```

---

## Version 0.5 - December 10, 2025

### Features Included:
✅ **Free Wallet Integration**
- Web-based wallet pass solution (100% free, no paid accounts)
- One-click "Add to Wallet" button on customer dashboard
- Wallet pass page with beautiful card design
- Auto-updating points and tier (refreshes every 30 seconds)
- Save to home screen functionality (iOS/Android)
- Works on all devices (mobile and desktop)
- QR code included in wallet card

✅ **Customer Management Enhancements**
- "View Customer" link in SME customer management page
- Direct access to customer scan view from customer list
- Improved customer workflow

✅ **Scan Page Improvements**
- Transaction form moved to top (after customer name)
- Transaction history table added at bottom
- Complete customer view in one page
- Real-time transaction updates

✅ **Customer Dashboard Enhancements**
- Navigation buttons (QR Code, Benefits, History, Program)
- Smooth scroll navigation
- Link to loyalty program page
- Tier upgrade notifications
- Enhanced benefits display

✅ **Database Updates**
- Added `WalletPass` model for wallet pass tracking
- Stores device tokens for future push notifications
- Tracks pass authentication tokens

✅ **New Pages**
- `/passes/[customerId]` - Wallet pass page
- Auto-refreshing pass display
- Professional wallet card design

✅ **New API Endpoints**
- `POST /api/passes/generate` - Generate wallet pass
- `GET /api/passes/[customerId]/update` - Update pass data
- `POST /api/passes/register-device` - Register device tokens
- `GET /api/passes/[customerId]/google-wallet` - Google Wallet pass data

### Technical Stack:
- Next.js 14 (App Router)
- TypeScript
- Prisma ORM with SQLite
- Tailwind CSS
- React QR Code library
- Web-based wallet solution (no certificates needed)

### Git Tag:
```bash
git checkout v0.5
```

### Commit Hash:
Check with: `git log --oneline -1`

### How to Revert to This Version:
```bash
# View this version
git show v0.5

# Checkout this version (creates detached HEAD)
git checkout v0.5

# Or create a new branch from this version
git checkout -b restore-v0.5 v0.5
```

---

## Version 0.4 - December 9, 2025

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

