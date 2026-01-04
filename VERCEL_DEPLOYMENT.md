# Vercel Deployment - Step by Step

## ✅ Code is on GitHub!
Repository: https://github.com/niraggosalia3-ship-it/sme-loyalty-app

## 🚀 Deploy to Vercel

### Step 1: Create Vercel Account & Project
1. Go to https://vercel.com
2. Sign in with GitHub (use the same GitHub account)
3. Click **"New Project"**
4. You should see your repository `sme-loyalty-app`
5. Click **"Import"** next to it

### Step 2: Configure Project
1. **Project Name**: Keep default or change to `sme-loyalty-app1`
2. **Framework Preset**: Should auto-detect "Next.js" ✓
3. **Root Directory**: Leave as `./` (default)
4. **Build Command**: Should be `prisma generate && next build` (already in package.json)
5. **Output Directory**: Leave as default
6. Click **"Deploy"** (don't add environment variables yet - we'll do that after)

### Step 3: Wait for First Deployment
- Vercel will build and deploy your app
- This will take 2-3 minutes
- The build will fail (expected - we need to add environment variables)
- Note your deployment URL (e.g., `https://sme-loyalty-app1.vercel.app`)

### Step 4: Set up Vercel Blob Storage
1. In Vercel dashboard, go to your project
2. Click **"Storage"** tab (in left sidebar)
3. Click **"Create Database"**
4. Select **"Blob"**
5. Name it (e.g., "loyalty-app-blob") or leave default
6. Click **"Create"**
7. This automatically creates `BLOB_READ_WRITE_TOKEN` environment variable

### Step 5: Add Environment Variables
Go to **Settings → Environment Variables** and add:

**1. DATABASE_URL**
- Key: `DATABASE_URL`
- Value: `postgresql://postgres:gbZXQ%2F%2AE9y%21%21Ks%23@db.dkwewdazxjbmjihriplv.supabase.co:5432/postgres`
- Environment: Production, Preview, Development (select all)

**2. NEXT_PUBLIC_APP_URL**
- Key: `NEXT_PUBLIC_APP_URL`
- Value: `https://sme-loyalty-app1.vercel.app` (replace with your actual Vercel URL)
- Environment: Production, Preview, Development (select all)

**3. BLOB_READ_WRITE_TOKEN**
- Key: `BLOB_READ_WRITE_TOKEN`
- Value: Copy from Storage tab (after creating Blob storage)
- Environment: Production, Preview, Development (select all)

### Step 6: Redeploy
1. Go to **"Deployments"** tab
2. Click **"..."** (three dots) on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete (~2-3 minutes)

### Step 7: Test on Phone! 📱
Once deployment succeeds:
- Visit your Vercel URL on your phone
- Test creating an SME
- Test customer form submission
- Test QR code scanning
- Test file uploads

## 🎉 Done!

Your app is now live and accessible from any phone!

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Make sure all environment variables are set
- Verify DATABASE_URL is correct

### Database Connection Issues
- Verify Supabase project is active
- Check DATABASE_URL format (password should be URL-encoded)
- Make sure tables exist in Supabase

### File Upload Issues
- Verify BLOB_READ_WRITE_TOKEN is set
- Check Vercel Blob storage is created
- Review Vercel logs for errors

