# Detailed Guide: Finding Connection Pooler in Supabase

## Your Project is Healthy ✅

Since your project shows "healthy" with a green dot, the database is active and running. Connection Pooler should be available.

## Where Connection Pooler Might Be

### Method 1: In Connection String Section (Most Likely)

1. Go to **Supabase** → Your project
2. Go to **Settings** → **Database**
3. Find the **"Connection string"** section (should be visible, not hidden)
4. **Look for tabs or dropdowns** in this section:
   - **"URI"** tab (what you probably looked at)
   - **"Transaction mode"** or **"Transaction"** - THIS IS THE POOLER!
   - **"Session mode"** or **"Session"**
   - **"Connection pooling"** tab
5. **Click on "Transaction mode"** (if you see it) - this uses Connection Pooler (port 6543)

### Method 2: Check Connection String Format

In the **"Connection string"** section under **"URI"** tab, the connection string format tells you if it's pooler:

**Pooler format:**
```
postgresql://postgres.dkwewdazxjbmjihriplv:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```
- Notice: `postgres.dkwewdazxjbmjihriplv` (username includes project ID)
- Notice: `pooler.supabase.com` (host includes "pooler")
- Notice: `:6543` (pooler port)

**Direct format:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.dkwewdazxjbmjihriplv.supabase.co:5432/postgres
```
- Notice: `postgres` (just "postgres")
- Notice: `db.dkwewdazxjbmjihriplv.supabase.co` (host starts with "db")
- Notice: `:5432` (direct port)

### Method 3: Look for "Connection Pooler" Section

1. In **Settings** → **Database**
2. **Scroll down** (might be below Connection string section)
3. Look for a separate section called:
   - **"Connection Pooler"**
   - **"Pooling"**
   - **"Connection Pooling"**

### Method 4: Check Project Settings

1. Go to **Settings** → **General** (or **Project Settings**)
2. Look for database-related options
3. Check for pooling settings

## What to Do Right Now

**Please do this:**

1. Go to **Settings** → **Database** → **"Connection string"** section
2. **Describe what you see:**
   - Are there **tabs** at the top? (What are the tab names?)
   - Is there a **dropdown** or **toggle**? (What are the options?)
   - What does the connection string look like? (Copy the format, not the password)
   - Do you see any mention of "pooler", "pooling", "transaction", or "session"?

3. **Take a screenshot** (if possible) or describe exactly what you see in the Connection string section

## Quick Test

If you can't find it, try this connection string format (Connection Pooler format):

```
postgresql://postgres.dkwewdazxjbmjihriplv:gbZXQ%2F%2AE9y%21%21Ks%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Key differences from direct:**
- Username: `postgres.dkwewdazxjbmjihriplv` (with project ID)
- Host: `aws-0-us-east-1.pooler.supabase.com` (pooler host)
- Port: `6543` (pooler port)

Try this in Vercel and see if it works!

## What to Share

Please share:
1. **What tabs/options you see** in the Connection string section
2. **The format** of the connection string shown (without password)
3. **Any mention** of "pooler", "pooling", "transaction", or "session"

With this info, I can help you find the exact Connection Pooler string!


