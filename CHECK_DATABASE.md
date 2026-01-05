# Check Database Connection - Step by Step

## Current Issue
Getting "Application error: a client-side exception has occurred" - this is a generic error. We need to see the actual error.

## Step 1: Check Vercel Function Logs

1. Go to Vercel dashboard → Your project
2. Go to **"Logs"** tab (or **"Deployments"** → Latest → **"Function Logs"**)
3. Load your app page: `https://sme-loyalty-app1.vercel.app`
4. Look for errors in the logs
5. **Copy the exact error message** you see

## Step 2: Test API Endpoint Directly

Open this URL in your browser:
```
https://sme-loyalty-app1.vercel.app/api/smes
```

**What you should see:**
- `[]` (empty array) = Database is working!
- Error message = This shows the actual problem

**Copy the exact error message** you see.

## Step 3: Verify DATABASE_URL Format

In Vercel → Settings → Environment Variables → `DATABASE_URL`:

**For Direct Connection (port 5432):**
```
postgresql://postgres:gbZXQ%2F%2AE9y%21%21Ks%23@db.dkwewdazxjbmjihriplv.supabase.co:5432/postgres
```

**For Connection Pooler (port 6543) - RECOMMENDED:**
1. Go to Supabase → Settings → Database
2. Copy the "Connection pooling" connection string
3. Replace `[YOUR-PASSWORD]` with URL-encoded password: `gbZXQ%2F%2AE9y%21%21Ks%23`
4. It should look like:
   ```
   postgresql://postgres.dkwewdazxjbmjihriplv:gbZXQ%2F%2AE9y%21%21Ks%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

**Important:**
- No spaces before/after
- No quotes
- Password must be URL-encoded
- Enabled for Production, Preview, Development

## Step 4: Check Supabase Project

1. Go to Supabase dashboard
2. Verify project is **"Active"** (not paused)
3. Check Settings → Database → Connection pooling is enabled
4. Verify tables exist (go to Table Editor)

## Step 5: Common Issues

### Issue 1: Password Encoding
Make sure special characters are encoded:
- `/` → `%2F`
- `*` → `%2A`
- `!` → `%21`
- `#` → `%23`

### Issue 2: Connection Pooler vs Direct
- **Use Connection Pooler (6543)** for Vercel - it's more reliable
- Direct connection (5432) might have timeout issues

### Issue 3: Environment Variable Not Set
- Make sure `DATABASE_URL` is set in Vercel
- Make sure it's enabled for all environments
- Redeploy after changing

## What to Share

Please share:
1. **Exact error from `/api/smes` endpoint** (when you visit it directly)
2. **Error from Vercel Function Logs**
3. **Which connection string format you're using** (direct 5432 or pooler 6543)
4. **Whether Supabase project is Active**

This will help identify the exact issue!


