# API Integration & Bulk Import Documentation

## Overview

This document describes the API integration and bulk import features that allow SME accounts to:
1. Create customers programmatically via API
2. Bulk import existing customers with YTD spending via CSV or JSON API

## Features

### 1. API Key Management

Each SME account has a unique API key for authentication:
- **Format**: `SME-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX` (32 hex characters)
- **Location**: Customer Management Dashboard → API Integration section
- **Actions**:
  - Generate new API key
  - Show/hide existing API key
  - Copy to clipboard
  - Regenerate (invalidates old key)

### 2. Single Customer Creation API

**Endpoint**: `POST /api/integration/customers`

**Authentication**: Include API key in header:
```
X-API-Key: SME-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
```

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "birthDate": "1990-01-15",
  "gender": "Male",
  "phone": "+1234567890",          // Optional
  "externalId": "CUST-12345",      // Optional - your internal ID
  "ytdSpend": 500.00                // Optional - initial spending amount
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "customerId": "clx...",
  "qrCodeId": "CUST-XXXXXXXX",
  "points": 500,
  "tier": "Silver",
  "dashboardUrl": "http://localhost:3000/customer/clx..."
}
```

**Response** (Duplicate - 409):
```json
{
  "error": "Customer with this email already exists",
  "customerId": "clx...",
  "qrCodeId": "CUST-XXXXXXXX"
}
```

**Features**:
- Validates required fields
- Checks for duplicate emails (within same SME)
- Calculates initial points if `ytdSpend` provided
- Determines initial tier based on points
- Creates initial transaction record for YTD spend
- Automatically upgrades tier if applicable

### 3. Bulk Customer Import (JSON API)

**Endpoint**: `POST /api/integration/customers/bulk`

**Authentication**: Include API key in header:
```
X-API-Key: SME-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
```

**Request Body**:
```json
{
  "customers": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "birthDate": "1990-01-15",
      "gender": "Male",
      "phone": "+1234567890",          // Optional
      "externalId": "CUST-12345",      // Optional
      "ytdSpend": 500.00,              // Optional
      "joinDate": "2024-01-01"         // Optional - transaction date
    },
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "birthDate": "1985-05-20",
      "gender": "Female",
      "ytdSpend": 1200.00
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0
  },
  "results": [
    {
      "success": true,
      "customerId": "clx...",
      "qrCodeId": "CUST-XXXXXXXX",
      "email": "john@example.com"
    },
    {
      "success": true,
      "customerId": "cly...",
      "qrCodeId": "CUST-YYYYYYYY",
      "email": "jane@example.com"
    }
  ]
}
```

**Limits**:
- Maximum 1,000 customers per batch
- Duplicate emails are skipped (not updated)
- Each customer processed independently (errors don't stop batch)

### 4. CSV Bulk Import (Web UI)

**Location**: Customer Management Dashboard → "Import Customers" button

**CSV Format**:
```csv
name,email,birthDate,gender,phone,externalId,ytdSpend,joinDate
John Doe,john@example.com,1990-01-15,Male,+1234567890,CUST-12345,500.00,2024-01-01
Jane Smith,jane@example.com,1985-05-20,Female,,CUST-12346,1200.00,2024-01-01
```

**Column Names** (case-insensitive, flexible):
- `name` or `customer name`
- `email` or `email address`
- `birthDate` or `birth date` or `date of birth`
- `gender`
- `phone` or `phone number` (optional)
- `externalId` or `external id` or `customer id` (optional)
- `ytdSpend` or `ytd spend` or `year to date spend` (optional)
- `joinDate` or `join date` or `member since` (optional)

**Features**:
- File size limit: 10MB
- Row limit: 10,000 customers
- Real-time progress indicator
- Detailed results table
- Error report download (CSV)
- Duplicate detection and skipping

**Process**:
1. Upload CSV file
2. System parses and validates data
3. Fetches/generates API key automatically
4. Calls bulk import API
5. Displays summary and detailed results
6. Allows download of error report

## YTD Spend Processing

When `ytdSpend` is provided:
1. **Points Calculation**: `points = ytdSpend × pointsMultiplier` (rounded)
2. **Tier Determination**: Finds highest tier customer qualifies for based on points
3. **Transaction Creation**: Creates initial transaction record:
   - Description: "Initial YTD balance: $X.XX"
   - Amount: YTD spend amount
   - Points: Calculated points
   - Date: Current date (or `joinDate` if provided)
4. **Tier Upgrade**: Automatically checks and upgrades tier if points qualify

## Error Handling

### API Errors

**401 Unauthorized**:
- Missing API key
- Invalid API key

**400 Bad Request**:
- Missing required fields
- Invalid data format

**409 Conflict**:
- Duplicate email (single customer API)
- Duplicate entry (database constraint)

**500 Internal Server Error**:
- Server-side processing error
- Database error

### Bulk Import Errors

- **Per-row errors**: Individual customer failures don't stop the batch
- **Error reporting**: Failed rows include error message
- **Summary**: Total, successful, and failed counts

## Security Considerations

1. **API Key Security**:
   - API keys are unique per SME
   - Stored securely in database
   - Should be kept confidential
   - Can be regenerated (invalidates old key)

2. **Data Isolation**:
   - All API operations are scoped to the SME's API key
   - Customers can only be created for the authenticated SME
   - No cross-SME data access

3. **Rate Limiting** (Future Enhancement):
   - Consider implementing rate limits for production use
   - Recommended: 100 requests/minute per API key

## Example Usage

### cURL - Single Customer
```bash
curl -X POST http://localhost:3000/api/integration/customers \
  -H "Content-Type: application/json" \
  -H "X-API-Key: SME-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "birthDate": "1990-01-15",
    "gender": "Male",
    "ytdSpend": 500.00
  }'
```

### cURL - Bulk Import
```bash
curl -X POST http://localhost:3000/api/integration/customers/bulk \
  -H "Content-Type: application/json" \
  -H "X-API-Key: SME-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX" \
  -d '{
    "customers": [
      {
        "name": "John Doe",
        "email": "john@example.com",
        "birthDate": "1990-01-15",
        "gender": "Male",
        "ytdSpend": 500.00
      }
    ]
  }'
```

### JavaScript/Node.js
```javascript
const apiKey = 'SME-XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX';
const baseUrl = 'http://localhost:3000';

// Single customer
async function createCustomer(customerData) {
  const response = await fetch(`${baseUrl}/api/integration/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify(customerData)
  });
  return await response.json();
}

// Bulk import
async function bulkImport(customers) {
  const response = await fetch(`${baseUrl}/api/integration/customers/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify({ customers })
  });
  return await response.json();
}
```

## Database Schema Changes

### SME Model
- Added `apiKey` field (String?, unique)

### Customer Model
- Added `phone` field (String?, optional)
- Added `externalId` field (String?, optional) - for mapping to external systems

## Next Steps / Future Enhancements

1. **Webhooks**: Notify external systems when customers are created/updated
2. **Rate Limiting**: Implement per-API-key rate limits
3. **API Key Scopes**: Different permissions for different operations
4. **Audit Logging**: Track all API operations
5. **Batch Status**: Track long-running bulk imports
6. **Customer Updates**: API endpoint to update existing customers
7. **Transaction API**: Create transactions via API

