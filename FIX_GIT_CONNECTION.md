# Fix Git Repository Connection in Vercel

## Issue
Vercel is trying to connect to: `sme-loyalty-app1`
But your actual GitHub repo is: `sme-loyalty-app`

This mismatch prevents auto-deployment from working.

## Solution: Update Repository Link

### Step 1: Disconnect Current Repository
1. Go to Vercel dashboard → Your project: `sme-loyalty-app1`
2. Go to **Settings → Git**
3. Scroll down to find **"Disconnect"** or **"Repository"** section
4. Click **"Disconnect"** (this won't delete your project, just the Git link)

### Step 2: Connect to Correct Repository
1. Still in **Settings → Git**
2. Click **"Connect Git Repository"** or **"Connect Repository"**
3. Select **GitHub** as the provider
4. Search for or find: `sme-loyalty-app` (without the "1")
5. Click **"Import"** or **"Connect"**
6. Select **Production Branch:** `main`
7. Enable **Auto-deploy** if not already enabled
8. Click **"Save"** or **"Deploy"**

## Alternative: Update Repository in Project Settings

If you can't disconnect, try:
1. Go to **Settings → General**
2. Look for **"Repository"** or **"Source"** section
3. Click **"Change Repository"** or edit the repository link
4. Update to: `niraggosalia3-ship-it/sme-loyalty-app`
5. Save

## After Fixing

Once connected to the correct repository:
1. ✅ Auto-deployment will work (pushes to GitHub will auto-deploy)
2. ✅ Repository button will work (will open correct GitHub repo)
3. ✅ Future code changes will automatically deploy

## Verify

1. Go to **Settings → Git**
2. Verify:
   - Repository: `niraggosalia3-ship-it/sme-loyalty-app` ✅
   - Production Branch: `main` ✅
   - Auto-deploy: Enabled ✅

3. Test: Push code to GitHub → Should see new deployment automatically


