# Testing PWA Locally

## Quick Start

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open in browser:**
   - Desktop: `http://localhost:3000`
   - Mobile (same WiFi): `http://YOUR_LOCAL_IP:3000`

## Finding Your Local IP Address

### Mac:
```bash
ipconfig getifaddr en0
# or
ipconfig getifaddr en1
```

### Windows:
```bash
ipconfig
# Look for "IPv4 Address" under your WiFi adapter
```

### Linux:
```bash
hostname -I
# or
ip addr show
```

## Testing on Your Phone

### Option 1: Same WiFi Network (Easiest)

1. Make sure your phone and computer are on the same WiFi
2. Find your computer's local IP (see above)
3. On your phone, open: `http://YOUR_IP:3000`
   - Example: `http://192.168.1.100:3000`

**Note:** Service workers may have issues over HTTP (non-localhost). If install prompt doesn't appear, use Option 2 or 3.

### Option 2: Use ngrok (Recommended for Full PWA Testing)

1. **Install ngrok:**
   ```bash
   # Mac
   brew install ngrok
   
   # Or download from https://ngrok.com/
   ```

2. **Start your dev server:**
   ```bash
   npm run dev
   ```

3. **In another terminal, start ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Open on your phone** using the ngrok URL

**Benefits:**
- ✅ HTTPS (required for full PWA features)
- ✅ Works from anywhere (not just same WiFi)
- ✅ Service workers work properly

### Option 3: Test on Deployed Version (Easiest)

Just test on your Vercel deployment:
- `https://sme-loyalty-app1.vercel.app`

This is the most reliable way since it's already HTTPS.

## What to Test

### 1. Check PWA Requirements

Open browser DevTools (F12) → Application tab:

- ✅ **Manifest**: Should show your manifest.json
- ✅ **Service Workers**: Should show registered service worker
- ✅ **Icons**: Should show icon-192.png and icon-512.png

### 2. Test Install Prompt (Android Chrome)

1. Navigate to a customer dashboard: `/customer/[customerId]`
2. Look for "Add to Wallet" button
3. Click it
4. **Expected**: Browser install prompt appears immediately
5. Click "Install"
6. **Expected**: App installs to home screen

### 3. Test iOS Instructions (iPhone Safari)

1. Navigate to customer dashboard on iPhone Safari
2. Click "Add to Wallet"
3. **Expected**: Instructions modal appears
4. Follow instructions to manually add to home screen

### 4. Test Offline Functionality

1. Install the PWA
2. Open the installed app
3. Turn on airplane mode (or disconnect WiFi)
4. **Expected**: App still loads (shows cached data)
5. Navigate around - should work offline

### 5. Check Service Worker

**In DevTools → Application → Service Workers:**

- Status should be "activated and is running"
- Check "Offline" checkbox
- Refresh page - should still work

## Common Issues

### Install Prompt Doesn't Appear

**Possible causes:**
1. **Not HTTPS** (except localhost)
   - Solution: Use ngrok or test on Vercel
   
2. **Already installed**
   - Check if app is already on home screen
   - Uninstall and try again

3. **Browser doesn't support PWA**
   - Use Chrome/Edge on Android
   - Use Safari on iOS

4. **Service worker not registered**
   - Check DevTools → Application → Service Workers
   - Look for errors in Console

### Service Worker Not Registering

**Check:**
1. `public/sw.js` exists
2. No errors in browser console
3. Service worker path is correct (`/sw.js`)

**Debug:**
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(console.log)
```

### Icons Not Showing

**Check:**
1. Icons exist: `public/icons/icon-192.png` and `icon-512.png`
2. Manifest.json references correct paths
3. Icons are valid PNG files (not placeholders)

**Replace placeholders:**
- Open `public/icons/create-icons.html` in browser
- Or create proper icons manually

## Quick Test Checklist

- [ ] Dev server running (`npm run dev`)
- [ ] Can access on phone (via IP or ngrok)
- [ ] Manifest loads (DevTools → Application → Manifest)
- [ ] Service worker registers (DevTools → Application → Service Workers)
- [ ] "Add to Wallet" button appears
- [ ] Install prompt appears on click (Android)
- [ ] Instructions modal appears (iOS)
- [ ] App installs successfully
- [ ] App opens in standalone mode (no browser UI)
- [ ] Offline mode works

## Debug Commands

```bash
# Check if service worker file exists
ls -la public/sw.js

# Check if manifest exists
ls -la public/manifest.json

# Check if icons exist
ls -la public/icons/*.png

# Clear browser cache (in DevTools)
# Application → Storage → Clear site data
```

## Testing on Different Devices

### Android Chrome (Best Experience)
- Full PWA support
- Install prompt works
- Offline works

### iOS Safari
- Manual install required
- Instructions modal guides user
- Offline works after install

### Desktop Chrome/Edge
- Install prompt in address bar or as popup
- Can install as desktop app
- Offline works

## Next Steps After Testing

1. **Replace placeholder icons** with proper branding
2. **Test on production** (Vercel deployment)
3. **Monitor install rates** in analytics
4. **Gather user feedback** on install experience

