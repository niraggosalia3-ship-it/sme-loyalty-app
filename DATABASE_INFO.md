# Database Information

## Database Location
**File Path:** `prisma/dev.db`  
**Type:** SQLite Database  
**Size:** ~32KB (grows as data is added)

## Database Structure

### 1. **SME Table** (`SME`)
Stores all SME companies created by admin.

**Columns:**
- `id` (String, Primary Key) - Unique identifier (CUID format)
- `companyName` (String) - Name of the company
- `uniqueLinkId` (String, Unique) - 10-character unique ID for form links
- `createdAt` (DateTime) - Timestamp when SME was created

**Relationships:**
- Has many `Customer` records (one-to-many)

**Example Data:**
```
ID: cmiz3esjj0000patsjylqvxdm
Company Name: Nirag testing
Unique Link ID: 4d51b8a934
Created At: 12/9/2025, 1:28:57 PM
```

---

### 2. **Customer Table** (`Customer`)
Stores all customer information submitted through forms.

**Columns:**
- `id` (String, Primary Key) - Unique identifier (CUID format)
- `smeId` (String, Foreign Key) - Links to SME table
- `name` (String) - Customer's full name
- `birthDate` (DateTime) - Customer's date of birth
- `email` (String) - Customer's email address
- `gender` (String) - Customer's gender (Male/Female/Other)
- `points` (Integer, Default: 0) - Current points balance
- `tier` (String, Default: "Bronze") - Current loyalty tier
- `createdAt` (DateTime) - Timestamp when customer registered

**Relationships:**
- Belongs to one `SME` (many-to-one)
- Has many `Transaction` records (one-to-many)

**Example Data:**
```
ID: cmiz3fii70002patsyyu2vxr2
SME ID: cmiz3esjj0000patsjylqvxdm
Name: Testing user 1
Email: test@gmail.com
Birth Date: 12/31/1990
Gender: Male
Points: 0
Tier: Bronze
Created At: 12/9/2025, 1:29:30 PM
```

---

### 3. **Transaction Table** (`Transaction`)
Stores all point transactions for customers (ready for future use).

**Columns:**
- `id` (String, Primary Key) - Unique identifier (CUID format)
- `customerId` (String, Foreign Key) - Links to Customer table
- `points` (Integer) - Points added or deducted (can be negative)
- `description` (String) - Description of the transaction
- `createdAt` (DateTime) - Timestamp when transaction occurred

**Relationships:**
- Belongs to one `Customer` (many-to-one)

**Current Status:** Empty (new customers start with 0 transactions)

---

## Data Isolation

Each SME's data is completely isolated:
- Customers are linked to their SME via `smeId` foreign key
- When querying customers, you filter by `smeId` to get only that SME's customers
- Transactions are linked to customers, which are linked to SMEs
- Deleting an SME will cascade delete all its customers and their transactions

## How to View Database

### Option 1: Use Prisma Studio (Visual Interface)
```bash
npx prisma studio
```
Opens a web interface at http://localhost:5555 to browse and edit data.

### Option 2: Use the Script
```bash
node scripts/show-db.js
```
Shows a formatted view of all data in the terminal.

### Option 3: Use SQLite CLI (if installed)
```bash
sqlite3 prisma/dev.db
.tables
SELECT * FROM SME;
SELECT * FROM Customer;
SELECT * FROM Transaction;
```

## Current Database Contents

Based on your test data:

- **1 SME Company:** "Nirag testing"
  - Unique Link: `http://localhost:3000/form/4d51b8a934`
  
- **1 Customer:** "Testing user 1"
  - Email: test@gmail.com
  - Points: 0
  - Tier: Bronze
  - Dashboard: `http://localhost:3000/customer/cmiz3fii70002patsyyu2vxr2`
  
- **0 Transactions:** (Empty as expected for new customers)


