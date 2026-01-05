# How to Find Connection String in Supabase

## If You Can't Find Connection Pooling

That's okay! Connection Pooling is a premium feature and might not be available for all Supabase projects. **We can use the direct connection string instead** - it works just as well!

## Step-by-Step: Get Direct Connection String

### Step 1: Go to Supabase Dashboard

1. Go to https://supabase.com
2. Log in
3. Select your project: `dkwewdazxjbmjihriplv`

### Step 2: Navigate to Database Settings

1. In the left sidebar, click **"Settings"** (gear icon)
2. Click **"Database"**
3. Scroll down to find **"Connection string"** section

### Step 3: Copy Connection String

You should see a section called **"Connection string"** with options like:
- URI
- JDBC
- Python
- etc.

1. Select **"URI"** tab
2. You'll see something like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.dkwewdazxjbmjihriplv.supabase.co:5432/postgres
   ```
3. **Copy this entire string** (including `[YOUR-PASSWORD]` placeholder)

### Step 4: Replace Password with URL-Encoded Password

Your password is: `gbZXQ/*E9y!!Ks#`

**URL-encoded password:** `gbZXQ%2F%2AE9y%21%21Ks%23`

Replace `[YOUR-PASSWORD]` in the connection string with the URL-encoded password.

**Final connection string should be:**
```
postgresql://postgres:gbZXQ%2F%2AE9y%21%21Ks%23@db.dkwewdazxjbmjihriplv.supabase.co:5432/postgres
```

### Step 5: Alternative - Where to Look

If you still can't find it, try:

1. **Settings** → **Database** → Look for any section with "Connection" or "Connection string"
2. **Settings** → **API** → Sometimes connection strings are here too
3. Check the top of the Database settings page - sometimes it's at the top

## Quick Reference: Direct Connection String Format

```
postgresql://postgres:YOUR_URL_ENCODED_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
```

For your project, it should be:
```
postgresql://postgres:gbZXQ%2F%2AE9y%21%21Ks%23@db.dkwewdazxjbmjihriplv.supabase.co:5432/postgres
```

## What to Do Next

1. Find the connection string in Supabase (Direct connection - port 5432)
2. Replace `[YOUR-PASSWORD]` with URL-encoded password
3. Update `DATABASE_URL` in Vercel with this value
4. Make sure it's enabled for Production, Preview, Development
5. Redeploy
6. Test!

## Important Notes

- **Direct connection (port 5432) works fine** - Connection Pooling is just recommended for better performance
- **Password MUST be URL-encoded** (special characters: `/` → `%2F`, `*` → `%2A`, `!` → `%21`, `#` → `%23`)
- **No spaces** in the connection string
- **Copy the exact format** from Supabase, just replace the password part

Let me know what you find in the Database settings!


