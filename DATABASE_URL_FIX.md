# Fix Database Connection Error

## Error: PrismaClientInitializationError

This means Prisma can't connect to your Supabase database. The issue is with the `DATABASE_URL` environment variable.

## Solution: Update DATABASE_URL in Vercel

### Step 1: Get the Correct Connection String from Supabase

1. Go to your Supabase dashboard
2. Go to **Settings → Database**
3. Under **"Connection string"**, select **"URI"** (not Session mode)
4. Copy the connection string
5. It should look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.dkwewdazxjbmjihriplv.supabase.co:5432/postgres
   ```

### Step 2: URL-Encode the Password

Your password is: `gbZXQ/*E9y!!Ks#`

URL-encoded it becomes: `gbZXQ%2F%2AE9y%21%21Ks%23`

Encoding breakdown:
- `/` = `%2F`
- `*` = `%2A`
- `!` = `%21`
- `#` = `%23`

### Step 3: Update DATABASE_URL in Vercel

1. Go to Vercel dashboard → Your project
2. Go to **Settings → Environment Variables**
3. Find `DATABASE_URL`
4. Update the value to:
   ```
   postgresql://postgres:gbZXQ%2F%2AE9y%21%21Ks%23@db.dkwewdazxjbmjihriplv.supabase.co:5432/postgres
   ```
5. Make sure it's enabled for **Production, Preview, and Development**
6. Click **"Save"**

### Step 4: Alternative - Use Connection Pooler

If direct connection doesn't work, try the connection pooler:

1. In Supabase dashboard → **Settings → Database**
2. Under **"Connection pooling"**, copy the connection string
3. It will use port **6543** instead of **5432**
4. Update `DATABASE_URL` in Vercel with this connection string

### Step 5: Redeploy

After updating the environment variable:
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**

## Verify Connection

After redeploying, test:
- Visit: `https://sme-loyalty-app1.vercel.app/api/smes`
- Should return `[]` (empty array) or your SMEs, not an error


