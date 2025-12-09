# SME Customer Management System - Plan

## Overview
A system where admins create SME companies with unique form links, and customers submit their information through these links to join loyalty programs.

## User Flow

### 1. Admin Flow
- **Action**: Admin adds a new SME company
- **Input**: Company name (and optionally other details)
- **Output**: Unique page link (e.g., `/form/{unique-id}`)
- **Storage**: SME record in database with unique identifier

### 2. Customer Flow
- **Action**: Customer accesses unique form link
- **Form Fields**: 
  - Name (text)
  - Birth Date (date picker)
  - Email ID (email)
  - Gender (dropdown: Male, Female, Other)
- **On Submit**: 
  - Create customer record
  - Initialize with 0 points
  - Set tier to "Bronze" (lowest tier)
  - Show transaction history table (initially empty)

### 3. Data Storage Structure

**SMEs Table:**
- id (unique identifier)
- company_name
- unique_link_id (for URL generation)
- created_at

**Customers Table:**
- id
- sme_id (foreign key to SMEs)
- name
- birth_date
- email
- gender
- points (default: 0)
- tier (default: "Bronze")
- created_at

**Transactions Table:**
- id
- customer_id (foreign key to Customers)
- points (can be positive or negative)
- description
- created_at

## Technical Architecture

### Frontend
- **Admin Dashboard**: Create SME, view list, copy links
- **Customer Form Page**: Dynamic route `/form/[linkId]` - form submission
- **Customer Dashboard**: After submission, show profile with points, tier, transaction history

### Backend
- **API Endpoints**:
  - `POST /api/smes` - Create new SME
  - `GET /api/smes` - List all SMEs
  - `POST /api/customers` - Submit customer form (requires linkId)
  - `GET /api/customers/:customerId` - Get customer details
  - `GET /api/customers/:customerId/transactions` - Get transaction history

### Database
- SQLite (for simplicity) or PostgreSQL
- Three tables: SMEs, Customers, Transactions

## Tech Stack Recommendation
- **Framework**: Next.js (React + API routes)
- **Database**: SQLite with Prisma ORM (or PostgreSQL for production)
- **Styling**: Tailwind CSS (modern, quick setup)
- **Form Handling**: React Hook Form
- **Validation**: Zod

## Implementation Steps
1. Set up Next.js project with TypeScript
2. Set up database schema (Prisma)
3. Create admin dashboard page
4. Create API route for SME creation
5. Create dynamic customer form page (`/form/[linkId]`)
6. Create customer submission API route
7. Create customer dashboard page (after submission)
8. Add transaction history display

## Key Features
- ✅ Unique link generation per SME
- ✅ Isolated data storage per SME
- ✅ Automatic tier assignment (Bronze)
- ✅ Points initialization (0)
- ✅ Transaction history table (ready for future point additions)

## Security Considerations
- Validate form inputs
- Ensure linkId uniqueness
- Prevent duplicate email submissions per SME (optional)
- Sanitize user inputs

