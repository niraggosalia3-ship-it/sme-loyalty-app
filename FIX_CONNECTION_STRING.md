# Fix "Tenant or user not found" Error

## The Error

```
FATAL: Tenant or user not found
```

## What This Means

✅ **Good news:** `DATABASE_URL` is now being found (environment variable is set correctly)

❌ **Problem:** The database connection string is incorrect

## Most Likely Causes

1. **Wrong connection string format** (using direct instead of pooler, or vice versa)
2. **Password not URL-encoded** (special characters need to be encoded)
3. **Wrong username/tenant** in the connection string
4. **Connection string copied incorrectly** (extra spaces, missing characters)

## Solution: Get the Correct Connection String from Supabase

### Step 1: Go to Supabase

1. Go to https://supabase.com
2. Log in to your account
3. Select your project: `dkwewdazxjbmjihriplv`

### Step 2: Get Connection String (Connection Pooler - RECOMMENDED)

1. Go to **Settings** → **Database**
2. Scroll down to **"Connection pooling"** section
3. Under **"Connection string"**, select **"Transaction"** mode
4. Copy the connection string (it will look like):
   ```
   postgresql://postgres.dkwewdazxjbmjihriplv:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
5. **Replace `[YOUR-PASSWORD]`** with your actual password, **URL-encoded**

### Step 3: URL-Encode the Password

Your password is: `gbZXQ/*E9y!!Ks#`

**URL-encoded password:** `gbZXQ%2F%2AE9y%21%21Ks%23`

Encoding:
- `/` → `%2F`
- `*` → `%2A`
- `!` → `%21`
- `#` → `%23`

**Final connection string should be:**
```
postgresql://postgres.dkwewdazxjbmjihriplv:gbZXQ%2F%2AE9y%21%21Ks%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### Step 4: Update DATABASE_URL in Vercel

1. Go to Vercel → Your project → **Settings** → **Environment Variables**
2. Find `DATABASE_URL`
3. Click **Edit**
4. **Value:** Paste the connection string from Step 3 (the URL-encoded one)
5. Make sure **ALL THREE environments** are checked:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
6. Click **Save**

### Step 5: Redeploy

1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes

### Step 6: Test

After redeployment, try creating an SME again. It should work now!

## Alternative: Use Direct Connection (if Pooler doesn't work)

If the Connection Pooler doesn't work:

1. Go to Supabase → Settings → Database
2. Scroll down to **"Connection string"** (NOT Connection pooling)
3. Select **"URI"**
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with URL-encoded password
6. It will look like:
   ```
   postgresql://postgres:gbZXQ%2F%2AE9y%21%21Ks%23@db.dkwewdazxjbmjihriplv.supabase.co:5432/postgres
   ```
7. Update `DATABASE_URL` in Vercel with this value
8. Redeploy

## Verification Checklist

- [ ] Connection string format is correct
- [ ] Password is URL-encoded (special characters encoded)
- [ ] Using Connection Pooler (port 6543) - recommended
- [ ] No extra spaces in the connection string
- [ ] Connection string copied correctly (no missing characters)
- [ ] `DATABASE_URL` updated in Vercel
- [ ] Enabled for Production, Preview, Development
- [ ] Redeployed after updating

## What to Check

Please verify:
1. **What connection string format are you using?** (Pooler 6543 or Direct 5432?)
2. **Is the password URL-encoded?** (special characters like `/`, `*`, `!`, `#` should be encoded)
3. **Did you copy the connection string directly from Supabase?** (should match exactly)

Let me know what connection string format you're using and I can help verify it's correct!


