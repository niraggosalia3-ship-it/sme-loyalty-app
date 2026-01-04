# Immediate Fix for Client-Side Crash

## Issue
Page loads for a second, then crashes with "Application error: a client-side exception has occurred"

## Root Cause
The API call to `/api/smes` is failing, and the error handling is causing the entire React app to crash.

## Immediate Fix (3 Steps)

### Step 1: Update NEXT_PUBLIC_APP_URL (Critical!)
Since Vercel renamed your project to `sme-loyalty-app1`:

1. Go to Vercel dashboard → Your project
2. Go to **Settings → Environment Variables**
3. Find `NEXT_PUBLIC_APP_URL`
4. Update value to: `https://sme-loyalty-app1.vercel.app`
5. Make sure it's enabled for **Production, Preview, Development**
6. Click **"Save"**

### Step 2: Verify DATABASE_URL
Make sure `DATABASE_URL` is still set correctly:
- Use Connection Pooler format (port 6543) - more reliable
- Password must be URL-encoded
- Should be: `postgresql://postgres.dkwewdazxjbmjihriplv:gbZXQ%2F%2AE9y%21%21Ks%23@aws-0-[region].pooler.supabase.com:6543/postgres`

### Step 3: Clear Vercel Build Cache & Redeploy
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Or create a new deployment: Click **"..."** → **"Redeploy"** → Check **"Use existing Build Cache"** = **OFF**
5. Wait for deployment (2-3 minutes)

## Why This Happens

When Vercel renamed the project:
1. The URL changed from `sme-loyalty-app.vercel.app` to `sme-loyalty-app1.vercel.app`
2. `NEXT_PUBLIC_APP_URL` might still point to the old URL
3. Or it wasn't set at all
4. The API calls are failing, causing React to crash

## After Fix

Once you update `NEXT_PUBLIC_APP_URL` and redeploy:
1. The page should load without crashing
2. You might see an empty list (if database still has issues)
3. But the page won't crash anymore

## Next: Fix Database Connection

After the page stops crashing, we still need to fix the database connection. But at least the app will work and show error messages instead of crashing.

