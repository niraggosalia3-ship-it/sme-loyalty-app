# Deployment Steps - Quick Guide

## ✅ Step 1: Database Setup - DONE!
- Tables created in Supabase ✓

## 🚀 Step 2: Deploy to Vercel

### 2.1 Push Code to GitHub (if not already)
```bash
git add .
git commit -m "Prepare for production deployment"
git push
```

### 2.2 Deploy to Vercel
1. Go to https://vercel.com
2. Sign in with GitHub
3. Click **"New Project"**
4. Import your repository
5. Click **"Deploy"** (Vercel auto-detects Next.js)

### 2.3 Set up Vercel Blob Storage
1. After first deployment, go to your project in Vercel
2. Click **"Storage"** tab
3. Click **"Create Database"**
4. Select **"Blob"**
5. This automatically creates `BLOB_READ_WRITE_TOKEN`

### 2.4 Add Environment Variables
Go to **Settings → Environment Variables** and add:

**DATABASE_URL**
```
postgresql://postgres:gbZXQ%2F%2AE9y%21%21Ks%23@db.dkwewdazxjbmjihriplv.supabase.co:5432/postgres
```

**NEXT_PUBLIC_APP_URL**
```
https://yourproject.vercel.app
```
(Replace `yourproject` with your actual Vercel project name)

**BLOB_READ_WRITE_TOKEN**
(Auto-created when you set up Blob storage - copy from Storage tab)

### 2.5 Redeploy
After adding environment variables:
1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**

## 📱 Step 3: Test on Phone

Once deployed:
- Visit `https://yourproject.vercel.app` on your phone
- Test creating an SME
- Test customer form submission
- Test QR code scanning
- Test file uploads

## 🎉 Done!

Your app is now live and accessible from any phone!


