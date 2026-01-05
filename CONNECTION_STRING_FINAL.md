# Final Connection String - Direct Connection (Port 5432)

## Which One to Use?

**Use: Direct Connection (Port 5432)**

Since you can't find Connection Pooling in Supabase, use the **direct connection string**. It works perfectly fine!

## Final Connection String to Use

### Direct Connection (Port 5432) - Use This One

```
postgresql://postgres:gbZXQ%2F%2AE9y%21%21Ks%23@db.dkwewdazxjbmjihriplv.supabase.co:5432/postgres
```

### Breakdown:
- **Protocol:** `postgresql://`
- **Username:** `postgres`
- **Password:** `gbZXQ%2F%2AE9y%21%21Ks%23` (URL-encoded)
- **Host:** `db.dkwewdazxjbmjihriplv.supabase.co`
- **Port:** `5432` (direct connection)
- **Database:** `postgres`

## How to Get This in Supabase

1. Go to **Supabase** → Your project
2. Go to **Settings** → **Database**
3. Scroll to **"Connection string"** section
4. Click **"URI"** tab
5. Copy the connection string (should look like above, but with `[YOUR-PASSWORD]`)
6. Replace `[YOUR-PASSWORD]` with: `gbZXQ%2F%2AE9y%21%21Ks%23`

## Update DATABASE_URL in Vercel

1. Go to **Vercel** → Your project → **Settings** → **Environment Variables**
2. Find `DATABASE_URL`
3. Click **Edit**
4. **Value:** 
   ```
   postgresql://postgres:gbZXQ%2F%2AE9y%21%21Ks%23@db.dkwewdazxjbmjihriplv.supabase.co:5432/postgres
   ```
5. Make sure all three environments are checked:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
6. Click **Save**

## Redeploy

1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes
5. Test creating an SME

## Why Direct Connection (5432)?

- ✅ **Works for all Supabase plans** (free and paid)
- ✅ **Simple and reliable**
- ✅ **No special setup needed**
- ✅ **Perfect for your use case**

Connection Pooler (6543) is just a **nice-to-have optimization**, but direct connection works great for most apps, especially for demos and small-to-medium traffic!

## Summary

**Use this exact connection string:**
```
postgresql://postgres:gbZXQ%2F%2AE9y%21%21Ks%23@db.dkwewdazxjbmjihriplv.supabase.co:5432/postgres
```

Copy it exactly as shown above (it has the URL-encoded password already), paste it into Vercel's `DATABASE_URL`, redeploy, and you're good to go! 🚀


