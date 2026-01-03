# Supabase Database Setup - Alternative Method

If `prisma db push` isn't working, you can create the tables manually:

## Option 1: Use Supabase SQL Editor (Easiest)

1. Go to your Supabase project dashboard
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New query"**
4. Copy the entire contents of `supabase-schema.sql` file
5. Paste it into the SQL editor
6. Click **"Run"** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"
8. Go to **"Table Editor"** to verify tables were created

## Option 2: Fix Connection String

1. In Supabase dashboard, go to **Settings → Database**
2. Under **"Connection string"**, select **"URI"**
3. Copy the connection string (it should look like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```
4. Update `.env` file with this exact string
5. Run: `npx prisma db push`

## Option 3: Check Connection Settings

1. In Supabase dashboard, go to **Settings → Database**
2. Check **"Connection pooling"** settings
3. Make sure there are no IP restrictions
4. Try using the **"Connection pooling"** connection string (port 6543)

## After Tables Are Created

Once tables exist in Supabase:
- You can see them in **"Table Editor"**
- You can proceed with Vercel deployment
- The app will work once deployed

