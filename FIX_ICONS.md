# Fix PWA Icons - Required for Install Prompt

## The Problem

The current icons are **1x1 pixel placeholders**. Browsers **reject these** and won't show the install prompt.

## The Solution

You need to generate proper **192x192** and **512x512** PNG icons.

### Option 1: Use the Icon Generator (Easiest)

1. **Open in your browser:**
   ```
   https://sme-loyalty-app1.vercel.app/icons/create-icons.html
   ```

2. **Icons will download automatically** (icon-192.png and icon-512.png)

3. **Upload them to the repo:**
   - Replace `public/icons/icon-192.png`
   - Replace `public/icons/icon-512.png`
   - Commit and push

### Option 2: Create Manually

Use any image editor to create:
- `public/icons/icon-192.png` (192x192 pixels)
- `public/icons/icon-512.png` (512x512 pixels)

Use your company logo or a wallet icon.

### Option 3: Use Online Tool

1. Go to https://realfavicongenerator.net/ or similar
2. Upload your logo
3. Download the 192x192 and 512x512 sizes
4. Save to `public/icons/`

## After Fixing Icons

1. Commit the new icon files
2. Push to GitHub
3. Wait for Vercel to deploy
4. **Clear browser cache** on your phone
5. **Refresh the page**
6. Click "Add to Wallet" - the install prompt should now appear!

## Why This Matters

Browsers check icon sizes before showing the install prompt. If icons are too small or invalid, the `beforeinstallprompt` event **never fires**, which is why you're seeing the fallback message.

