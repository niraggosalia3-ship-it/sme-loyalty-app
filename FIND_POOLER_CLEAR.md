# Finding Connection Pooler in Supabase - Clear Instructions

## Why Connection Pooler is Required

- **Direct connection (5432)**: Works from your computer, but **BLOCKED from Vercel**
- **Connection Pooler (6543)**: **REQUIRED for Vercel** - allows external connections

## How to Find Connection Pooler

### Method 1: In Database Settings

1. Go to **Supabase** → Your project
2. Click **"Settings"** (gear icon in left sidebar)
3. Click **"Database"**
4. **Scroll all the way down** the page
5. Look for section called:
   - **"Connection Pooler"**
   - **"Connection pooling"**
   - **"Pooling"**

### Method 2: In Connection String Section

1. Go to **Settings** → **Database**
2. Look for **"Connection string"** section
3. Check if there are **multiple tabs** or **options**:
   - **Direct connection** (what you tried)
   - **Connection Pooler** ← Look for this!
   - **Transaction mode**
   - **Session mode**

### Method 3: Check Project Settings

1. Go to **Settings** → **General** (or **Project Settings**)
2. Look for **"Connection Pooler"** or **"Database Connection"** options
3. Check if there's an **"Enable Pooling"** option

### Method 4: Check Supabase Dashboard Home

1. Go to your **Supabase project dashboard** (home page)
2. Look for any **banner** or **notification** about Connection Pooler
3. Check for **"Enable Pooling"** or **"Setup Pooling"** buttons

## If You Still Can't Find It

Connection Pooler might not be available on all Supabase plans. Check:

1. **What plan are you on?** (Free, Pro, Team?)
2. **Connection Pooler is usually available on Free tier** for Supabase
3. But it might be in a different location or need to be enabled

## Alternative: Contact Supabase Support

If you absolutely cannot find Connection Pooler:
1. Go to Supabase dashboard
2. Look for **"Help"** or **"Support"** 
3. Ask: "How do I enable Connection Pooler for my project?"
4. Or check Supabase documentation: https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler

## What to Check

Please check:
1. **Scroll ALL the way down** in Settings → Database
2. Look for **tabs** in Connection String section
3. Check if there's an **"Enable"** or **"Activate"** button for pooling
4. What plan are you on? (Free/Pro/etc.)

Let me know what you find!


