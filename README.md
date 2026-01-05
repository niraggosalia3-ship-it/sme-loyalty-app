# SME Customer Management System

A Next.js application for managing SME companies and their customer loyalty programs.

## Features

- **Admin Dashboard**: Create SME companies and get unique form links
- **Customer Form**: Collect customer information (Name, Birth Date, Email, Gender)
- **Customer Dashboard**: View points balance, tier status, and transaction history
- **Data Isolation**: Each SME's customer data is stored separately

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Admin Flow

1. Navigate to the home page (admin dashboard)
2. Enter a company name and click "Create SME"
3. Copy the generated unique link
4. Share this link with the SME to distribute to their customers

### Customer Flow

1. Customer accesses the unique form link (e.g., `/form/abc123`)
2. Fills in the form with:
   - Name
   - Birth Date
   - Email ID
   - Gender
3. Submits the form
4. Automatically redirected to their dashboard showing:
   - 0 points (initial)
   - Bronze tier (lowest tier)
   - Empty transaction history table

## Database Schema

- **SMEs**: Stores company information and unique link IDs
- **Customers**: Stores customer data linked to specific SMEs
- **Transactions**: Stores point transactions for customers (ready for future use)

## API Endpoints

- `GET /api/smes` - List all SMEs
- `POST /api/smes` - Create a new SME
- `GET /api/smes/[linkId]` - Get SME by link ID
- `POST /api/customers` - Create a new customer
- `GET /api/customers/[customerId]` - Get customer details
- `GET /api/customers/[customerId]/transactions` - Get customer transactions

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Form Handling**: React hooks

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── smes/          # SME API routes
│   │   └── customers/     # Customer API routes
│   ├── form/[linkId]/     # Customer form page
│   ├── customer/[customerId]/  # Customer dashboard
│   └── page.tsx           # Admin dashboard
├── lib/
│   └── prisma.ts          # Prisma client
└── prisma/
    └── schema.prisma      # Database schema
```


