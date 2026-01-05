# Fix DATABASE_URL Not Found Error

## The Error
```
error: Environment variable not found: DATABASE_URL.
```

## Why This Happens

The error says Prisma can't find `DATABASE_URL` at runtime, even though:
- You say it's set in Vercel
- GET endpoint works (so it must be accessible sometimes)

This usually means:
1. **Environment variable not set** in Vercel (most likely)
2. **Not enabled for Production** environment
3. **Not redeployed** after setting it
4. **Different environment** (Preview vs Production)

## Solution

### Step 1: Verify DATABASE_URL is Set

1. Go to Vercel → Your project (`sme-loyalty-app1`)
2. Go to **Settings** → **Environment Variables**
3. Look for `DATABASE_URL`
4. Check:
   - ✅ Is it there?
   - ✅ What environments is it enabled for? (Should check: Production, Preview, Development)
   - ✅ What's the value? (Don't share it, but verify it's correct)

### Step 2: If NOT Set or Wrong Scope

1. Click **"Add New"** (or edit existing)
2. **Key:** `DATABASE_URL`
3. **Value:** Your Supabase connection string (use Connection Pooler port 6543)
   ```
   postgresql://postgres.dkwewdazxjbmjihriplv:ENCODED_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
   (Replace `ENCODED_PASSWORD` with URL-encoded password: `gbZXQ%2F%2AE9y%21%21Ks%23`)
4. **Environment:** Check ALL THREE:
   - ✅ Production
   - ✅ Preview  
   - ✅ Development
5. Click **"Save"**

### Step 3: Redeploy (CRITICAL!)

After setting/updating environment variables, you MUST redeploy:

1. Go to **Deployments** tab
2. Click **"..."** (three dots) on the latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes for deployment to complete
5. Try creating an SME again

### Step 4: Verify It Works

After redeployment:
1. Try creating an SME
2. It should work now!

## Important Notes

- **Environment variables are NOT active until you redeploy** after setting them
- Make sure `DATABASE_URL` is enabled for **Production** (your main deployment)
- Use **Connection Pooler** (port 6543) for better reliability
- Password must be **URL-encoded** (special characters encoded)

## If Still Not Working

If it still doesn't work after redeploying:

1. Double-check the `DATABASE_URL` value:
   - Correct format?
   - Password URL-encoded?
   - Connection Pooler (port 6543)?

2. Check Vercel Logs again:
   - Look for any other errors
   - Verify the deployment completed successfully

3. Verify Supabase:
   - Is the project active?
   - Can you connect to it manually?


