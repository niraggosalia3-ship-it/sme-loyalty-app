-- Prisma Schema converted to SQL for manual setup in Supabase
-- Run this in Supabase SQL Editor if Prisma push doesn't work

-- Create tables
CREATE TABLE IF NOT EXISTS "SME" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "uniqueLinkId" TEXT NOT NULL UNIQUE,
    "apiKey" TEXT UNIQUE,
    "bannerImageUrl" TEXT,
    "programName" TEXT,
    "programDescription" TEXT,
    "pointsEarningRules" TEXT,
    "pointsMultiplier" REAL NOT NULL DEFAULT 1.0,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Tier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "smeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pointsRequired" INTEGER NOT NULL,
    "benefits" TEXT NOT NULL,
    "color" TEXT,
    "order" INTEGER NOT NULL,
    FOREIGN KEY ("smeId") REFERENCES "SME"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "smeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "phone" TEXT,
    "externalId" TEXT UNIQUE,
    "points" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'Bronze',
    "qrCodeId" TEXT NOT NULL UNIQUE,
    "lastTierUpgradeDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("smeId") REFERENCES "SME"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL,
    "taxAmount" REAL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "CustomerBenefit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "tierId" TEXT NOT NULL,
    "benefitName" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'available',
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("tierId") REFERENCES "Tier"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "WalletPass" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL UNIQUE,
    "passTypeId" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL UNIQUE,
    "authenticationToken" TEXT NOT NULL UNIQUE,
    "deviceToken" TEXT,
    "fcmToken" TEXT,
    "platform" TEXT NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Tier_smeId_idx" ON "Tier"("smeId");
CREATE INDEX IF NOT EXISTS "Customer_smeId_idx" ON "Customer"("smeId");
CREATE INDEX IF NOT EXISTS "Customer_email_idx" ON "Customer"("email");
CREATE INDEX IF NOT EXISTS "Transaction_customerId_idx" ON "Transaction"("customerId");
CREATE INDEX IF NOT EXISTS "CustomerBenefit_customerId_idx" ON "CustomerBenefit"("customerId");
CREATE INDEX IF NOT EXISTS "CustomerBenefit_tierId_idx" ON "CustomerBenefit"("tierId");


