# Wallet Integration Setup Guide

## Overview

The wallet integration allows customers to add their loyalty cards to Apple Wallet (iOS) or Google Wallet (Android) with automatic updates when transactions are added.

## Current Implementation Status

✅ **Completed:**
- Database schema for wallet passes
- Pass generation API endpoints
- Pass update web service API
- "Add to Wallet" button on customer dashboard
- Push notification infrastructure (placeholder)
- Transaction hook to trigger updates

⚠️ **Requires Configuration:**
- Apple Developer account setup
- Google Cloud project setup
- Certificate/credential configuration

## Features Implemented

### 1. Database Schema
- `WalletPass` model stores:
  - Customer ID (unique)
  - Pass type ID / Class ID
  - Serial number
  - Authentication token
  - Device tokens (for push notifications)
  - Platform (ios/android)
  - Last updated timestamp

### 2. API Endpoints

#### Generate Pass
- **Endpoint:** `POST /api/passes/generate`
- **Body:** `{ customerId, platform }`
- **Returns:** Pass data (JSON for Apple, JWT for Google)

#### Update Pass (Web Service)
- **Endpoint:** `GET /api/passes/[customerId]/update`
- **Auth:** ApplePass token in Authorization header
- **Returns:** Updated pass data
- **Called by:** Wallet app (periodic + on push notification)

#### Register Device Token
- **Endpoint:** `POST /api/passes/register-device`
- **Body:** `{ customerId, deviceToken, platform }`
- **Purpose:** Register device for push notifications

### 3. Customer Dashboard
- "Add to Wallet" button (shown only on mobile devices)
- One-click pass generation
- Platform detection (iOS/Android)

### 4. Automatic Updates
- Transaction creation triggers push notification
- Wallet app checks web service URL
- Pass updates immediately

## Setup Instructions

### Apple Wallet (iOS)

#### 1. Apple Developer Account
- Sign up at https://developer.apple.com ($99/year)
- Create App ID
- Create Pass Type ID

#### 2. Certificates
- Download Pass Type ID certificate
- Download WWDR (Apple Worldwide Developer Relations) certificate
- Store in `certificates/` directory:
  - `wwdr.pem`
  - `signerCert.pem`
  - `signerKey.pem`

#### 3. Environment Variables
```env
APPLE_TEAM_ID=your-team-id
APPLE_PASS_TYPE_ID=pass.com.yourcompany.sme
APPLE_PASS_KEY_PASSPHRASE=your-key-passphrase
```

#### 4. Update Code
- Uncomment `generateApplePass` function in `lib/wallet/apple-pass.ts`
- Configure certificate paths
- Use `passkit-generator` to generate signed .pkpass files

### Google Wallet (Android)

#### 1. Google Cloud Project
- Create project at https://console.cloud.google.com
- Enable Google Wallet API
- Create service account
- Download service account key (JSON)

#### 2. Environment Variables
```env
GOOGLE_WALLET_ISSUER_ID=your-issuer-id
GOOGLE_WALLET_ISSUER_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_WALLET_KEY_FILE=path/to/service-account-key.json
```

#### 3. Update Code
- Implement Google Wallet REST API calls in `lib/wallet/google-pass.ts`
- Use service account to sign JWTs
- Create loyalty classes and objects via API

### Push Notifications

#### Apple Push Notifications (APNs)
1. Generate APNs key in Apple Developer account
2. Install `apn` npm package: `npm install apn`
3. Configure in `lib/push-notifications.ts`:
   ```typescript
   const apn = require('apn')
   const apnProvider = new apn.Provider({
     token: {
       key: process.env.APPLE_APNS_KEY_PATH,
       keyId: process.env.APPLE_APNS_KEY_ID,
       teamId: process.env.APPLE_TEAM_ID,
     },
     production: process.env.NODE_ENV === 'production',
   })
   ```

#### Firebase Cloud Messaging (FCM)
1. Create Firebase project
2. Install Firebase Admin SDK: `npm install firebase-admin`
3. Download service account key
4. Configure in `lib/push-notifications.ts`:
   ```typescript
   const admin = require('firebase-admin')
   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount),
   })
   ```

## How It Works

### Pass Generation Flow
1. Customer clicks "Add to Wallet" button
2. Frontend detects platform (iOS/Android)
3. Calls `/api/passes/generate` with customer ID and platform
4. Backend generates pass data
5. Creates/updates `WalletPass` record
6. Returns pass data
7. Frontend opens wallet app or downloads pass
8. Customer adds to wallet

### Update Flow
1. SME adds transaction via scan page
2. Transaction API creates transaction
3. Calls `notifyWalletPassUpdate(customerId)`
4. Push notification sent to device
5. Wallet app receives notification
6. Wallet app calls web service URL
7. Web service returns updated pass data
8. Pass updates in wallet (points, tier, etc.)

## Testing

### Without Certificates (Current State)
- Pass generation returns JSON structure
- Shows alert with setup instructions
- Database records are created
- Update API is functional

### With Certificates (Production)
- Passes are signed and downloadable
- Can be added to wallet
- Push notifications work
- Updates happen automatically

## Next Steps

1. **Set up Apple Developer account** (if targeting iOS)
2. **Set up Google Cloud project** (if targeting Android)
3. **Configure certificates/credentials**
4. **Update pass generation code** to use actual certificates
5. **Test pass generation** on real devices
6. **Test push notifications** for immediate updates
7. **Monitor update frequency** and optimize if needed

## Notes

- Current implementation provides the infrastructure
- Pass generation works but requires certificates for signing
- Push notifications are placeholder (need APNs/FCM setup)
- Web service URL updates work (tested structure)
- All database operations are functional

## Support

For issues or questions:
- Check API logs for errors
- Verify environment variables are set
- Ensure certificates are valid and not expired
- Test web service URL manually: `GET /api/passes/[customerId]/update?authToken=[token]`

