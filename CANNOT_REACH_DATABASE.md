# Can't Reach Database Server - Solutions

## The Error

```
Can't reach database server at `db.dkwewdazxjbmjihriplv.supabase.co:5432`
```

## What This Means

Supabase is **blocking direct connections (port 5432)** from external IPs (like Vercel). This is a **security feature** - Supabase doesn't allow direct database connections from serverless environments.

## Solutions

### Solution 1: Use Connection Pooler (RECOMMENDED)

Connection Pooler **IS available** on Supabase, but it might be in a different location or need to be enabled.

#### How to Find Connection Pooler:

1. Go to **Supabase** → Your project
2. Go to **Settings** → **Database**
3. Look for **"Connection pooling"** section (might be lower on the page)
4. OR look for **"Connection string"** and check if there's a **"Pooler"** option/tab
5. OR check if there's a section called **"Pooling"** or **"Connection Pooler"**

#### Connection Pooler Format:

If you find it, use this format:
```
postgresql://postgres.dkwewdazxjbmjihriplv:gbZXQ%2F%2AE9y%21%21Ks%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Key differences:**
- Username: `postgres.dkwewdazxjbmjihriplv` (includes project ID)
- Host: `aws-0-us-east-1.pooler.supabase.com` (pooler host)
- Port: `6543` (pooler port)

### Solution 2: Check If Supabase Project is Paused

Free tier Supabase projects **pause after 7 days of inactivity**. Check:

1. Go to **Supabase** → Your project dashboard
2. Look for a **"Resume"** or **"Unpause"** button
3. If paused, click **"Resume"** or **"Unpause"**
4. Wait a few minutes for the database to start
5. Try again

### Solution 3: Check Supabase Database Status

1. Go to **Supabase** → Your project
2. Check the project status (should be **"Active"**)
3. Go to **Settings** → **Database**
4. Check if database is running
5. Look for any error messages or warnings

### Solution 4: Enable Connection Pooler

If you can't find Connection Pooler, it might need to be enabled:

1. Go to **Supabase** → Your project
2. Go to **Settings** → **Database**
3. Look for **"Connection Pooler"** or **"Pooling"** section
4. Check if there's an **"Enable"** or **"Activate"** button
5. Enable it if available

### Solution 5: Check Connection String in Supabase

1. Go to **Supabase** → Settings → Database
2. Look for **"Connection string"** section
3. Check if there are **multiple tabs** or **options**:
   - Direct connection (port 5432)
   - **Connection pooler** (port 6543) ← Look for this!
   - Session mode
   - Transaction mode
4. If you see pooler options, use the **Transaction mode** pooler string

## Most Likely Issue

**Your Supabase project might be PAUSED** (free tier auto-pauses after inactivity).

## Quick Checklist

- [ ] Check if Supabase project is paused (look for "Resume" button)
- [ ] Look for Connection Pooler in Settings → Database (scroll down)
- [ ] Check if Connection Pooler needs to be enabled
- [ ] Verify database is active/running in Supabase dashboard
- [ ] Look for any error messages in Supabase project dashboard

## What to Do Next

1. **First**: Check if your Supabase project is **paused** - if yes, resume it
2. **Second**: Look more carefully for **Connection Pooler** in Settings → Database (might need to scroll down)
3. **Third**: Try the Connection Pooler connection string (port 6543) instead of direct (5432)

Let me know:
1. Is your Supabase project paused or active?
2. Can you find Connection Pooler anywhere in Settings → Database?
3. What sections do you see in Settings → Database?


