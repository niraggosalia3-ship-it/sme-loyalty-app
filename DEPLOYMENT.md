# Deployment Guide - Vercel + Supabase (Production Ready)

## Quick Setup for Demo (15-20 minutes)

### Step 1: Set up Supabase Database (5 minutes)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project (choose a name and password)
3. Wait for project to initialize (~2 minutes)
4. Go to **Settings → Database**
5. Copy the **Connection string** (URI format)
   - It will look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - Replace `[YOUR-PASSWORD]` with the password you set during project creation

### Step 2: Update Local Environment (2 minutes)

Create `.env.local` file in project root:
```bash
# For local development (SQLite)
DATABASE_URL="file:./dev.db"

# For production (PostgreSQL - from Supabase)
# DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# App URL (optional - will auto-detect)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 3: Push Schema to Supabase (2 minutes)

```bash
# Update DATABASE_URL in .env.local to Supabase connection string first
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Push schema to Supabase
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### Step 4: Deploy to Vercel (5 minutes)

1. **Push code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click **"New Project"**
   - Import your repository
   - Click **"Deploy"** (Vercel will auto-detect Next.js)

3. **Set up Vercel Blob Storage** (for file uploads):
   - In Vercel dashboard, go to your project
   - Go to **Storage** tab
   - Click **"Create Database"** → Select **"Blob"**
   - This automatically creates `BLOB_READ_WRITE_TOKEN` environment variable

4. **Add Environment Variables** in Vercel dashboard:
   - Go to Project → Settings → Environment Variables
   - Add:
     - `DATABASE_URL` = Your Supabase connection string
     - `NEXT_PUBLIC_APP_URL` = Your Vercel URL (e.g., `https://yourproject.vercel.app`)
     - `BLOB_READ_WRITE_TOKEN` = Auto-created when you set up Blob storage
   - Click **"Redeploy"** after adding variables

### Step 5: Test on Phone

Once deployed:
- Your app will be at: `https://yourproject.vercel.app`
- All links work: `/form/[linkId]`, `/program/[linkId]`, `/customer/[customerId]`, etc.
- QR codes work when scanned from phone
- All features work on mobile browsers
- File uploads work and are served via CDN (fast on mobile)

## Domain Recommendation

**For Demo:** Use Vercel's free domain (`yourproject.vercel.app`) - it works perfectly!

**When Ready for Production:** Consider buying a domain:
- **Recommended:** `.com` domain (most professional)
- **Where to buy:** Namecheap, Google Domains, or Cloudflare
- **Cost:** ~$10-15/year
- **Setup:** Add custom domain in Vercel dashboard (takes 5 minutes)

**Domain Name Ideas:**
- `yourbrand-loyalty.com`
- `loyaltyapp.com`
- `smerewards.com`
- Or use your company name

## What Changed (Minimal)

✅ **Database**: Now uses `DATABASE_URL` env var (works with SQLite locally, PostgreSQL in production)
✅ **File Upload**: Uses Vercel Blob Storage (CDN-backed, fast on mobile)
✅ **URLs**: All hardcoded localhost URLs replaced with environment variables
✅ **Build**: Added Prisma generate to build script

## Environment Variables

### Local Development (.env.local)
```
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Production (Vercel)
```
DATABASE_URL="postgresql://..." (from Supabase)
NEXT_PUBLIC_APP_URL="https://yourproject.vercel.app"
BLOB_READ_WRITE_TOKEN="..." (auto-created by Vercel Blob)
```

Vercel automatically provides `VERCEL_URL` which we use as fallback.

## File Storage (Vercel Blob)

**Why Vercel Blob?**
- ✅ Free tier: 1GB storage, 10GB bandwidth/month
- ✅ CDN-backed (fast on mobile)
- ✅ No additional setup needed
- ✅ Works immediately after deployment
- ✅ Automatic image optimization available

**How it works:**
- Files uploaded via `/api/upload` are stored in Vercel Blob
- URLs are public and CDN-accelerated
- Perfect for demo and production use

## Cost

- **Vercel**: Free tier (generous limits)
- **Vercel Blob**: Free tier (1GB storage, 10GB bandwidth/month)
- **Supabase**: Free tier (500MB database, 1GB file storage)
- **Total**: $0/month for demo

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct (check password in Supabase)
- Make sure Supabase project is active
- Check network access in Supabase settings (should allow all by default)

### Build Errors
- Make sure `prisma generate` runs (it's in build script)
- Check Vercel build logs for specific errors
- Verify all environment variables are set

### File Upload Issues
- Make sure Vercel Blob storage is created in Vercel dashboard
- Verify `BLOB_READ_WRITE_TOKEN` is set in environment variables
- Check Vercel logs for blob upload errors

## Next Steps After Demo

1. **Add Custom Domain** (optional, ~$10-15/year)
   - Buy domain from Namecheap/Google/Cloudflare
   - Add in Vercel dashboard → Settings → Domains
   - SSL certificate auto-generated

2. **Monitor Usage**
   - Check Vercel dashboard for bandwidth/storage usage
   - Monitor Supabase dashboard for database size

3. **Scale as Needed**
   - Upgrade Vercel plan if needed ($20/month for Pro)
   - Upgrade Supabase if database grows ($25/month for Pro)
