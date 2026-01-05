# Verify DATABASE_URL Environment Variable

## The Issue

You're still getting: `Environment variable not found: DATABASE_URL`

## Important Notes

1. **You're on a Preview URL** (`sme-loyalty-app1-g60p3qayw-...`)
   - This means you're using a **Preview deployment**, not Production
   - `DATABASE_URL` must be enabled for **Preview** environment too!

2. **GET endpoint works** (page loads)
   - This is strange - if DATABASE_URL isn't set, GET should also fail
   - This suggests DATABASE_URL might be set for one environment but not another

## Step-by-Step Fix

### Step 1: Go to Environment Variables

1. Go to Vercel → Your project (`sme-loyalty-app1`)
2. Go to **Settings** → **Environment Variables**
3. Look for `DATABASE_URL` in the list

### Step 2: Check Current Settings

For `DATABASE_URL`, check:
- ✅ **Is it there?** (visible in the list)
- ✅ **Which environments is it enabled for?**
  - Look for checkmarks or badges next to it
  - Should show: Production, Preview, Development
  - **If Preview is NOT checked, that's the problem!**

### Step 3: Edit DATABASE_URL

1. **If DATABASE_URL exists:**
   - Click **Edit** (or the three dots → Edit)
   - Check the **Value** (make sure it's correct)
   - **IMPORTANT:** Under "Environment", check **ALL THREE boxes:**
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click **"Save"**

2. **If DATABASE_URL does NOT exist:**
   - Click **"Add New"**
   - **Key:** `DATABASE_URL`
   - **Value:** Your Supabase connection string:
     ```
     postgresql://postgres.dkwewdazxjbmjihriplv:gbZXQ%2F%2AE9y%21%21Ks%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres
     ```
     (Replace with your actual URL-encoded password)
   - **Environment:** Check **ALL THREE:**
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Click **"Save"**

### Step 4: Redeploy (CRITICAL!)

**After setting/updating the environment variable:**

1. Go to **Deployments** tab
2. Find the **latest deployment** (should be the one you're using)
3. Click **"..."** (three dots)
4. Click **"Redeploy"**
5. **OR** push a new commit to trigger a new deployment
6. Wait 2-3 minutes for deployment to complete

### Step 5: Try Production URL Instead

Try accessing your **Production URL** instead of the preview URL:
- Production URL: `https://sme-loyalty-app1.vercel.app`
- Preview URL: `sme-loyalty-app1-g60p3qayw-...` (what you're using now)

If Production URL works but Preview doesn't, it confirms that `DATABASE_URL` is only set for Production, not Preview.

## Verification Checklist

- [ ] `DATABASE_URL` exists in Vercel environment variables
- [ ] `DATABASE_URL` is enabled for **Production**
- [ ] `DATABASE_URL` is enabled for **Preview** ← **THIS IS LIKELY MISSING!**
- [ ] `DATABASE_URL` is enabled for **Development**
- [ ] Value is correct (Connection Pooler format, port 6543)
- [ ] Password is URL-encoded
- [ ] Redeployed after setting/updating

## What to Do Next

1. **Check if Preview is enabled** for `DATABASE_URL`
2. **If not, enable it** and redeploy
3. **Try creating an SME again**

Let me know:
- Is `DATABASE_URL` enabled for **Preview** environment?
- Did you redeploy after setting it?
- Does it work on the Production URL (`https://sme-loyalty-app1.vercel.app`)?


