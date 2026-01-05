# PWA Install Debugging Guide

## Why the Install Prompt Might Not Appear

The `beforeinstallprompt` event is **browser-controlled** and may not fire for several reasons:

### 1. User Previously Dismissed It
- Browsers remember if a user dismissed the install prompt
- The event won't fire again for that user
- **Solution**: User must manually add via browser menu

### 2. PWA Requirements Not Met
- Manifest must be valid and accessible
- Service worker must be registered
- Must be HTTPS (or localhost)
- Icons must be valid

### 3. Browser Timing
- Event might fire before our listener is set up
- Event might fire after user interaction
- Some browsers delay the event

### 4. Browser Doesn't Support It
- Not all browsers support `beforeinstallprompt`
- iOS Safari doesn't support it at all

## How to Debug

### Check in Browser Console

1. **Open DevTools** (F12)
2. **Go to Application tab**
3. **Check Manifest:**
   - Should show your manifest.json
   - Should list icons
   - Should show "Add to Home Screen" if installable

4. **Check Service Workers:**
   - Should show registered service worker
   - Status should be "activated and is running"

5. **Check Installability:**
   ```javascript
   // In console, check if event was captured
   window.addEventListener('beforeinstallprompt', (e) => {
     console.log('Install prompt event fired!', e);
   });
   ```

### Common Issues

**Issue**: Event never fires
- **Check**: Is manifest.json accessible? Try opening `/manifest.json` directly
- **Check**: Is service worker registered? Check Application → Service Workers
- **Check**: Are you on HTTPS? (required for production)

**Issue**: Event fires but prompt doesn't show
- **Check**: Did you call `e.preventDefault()`? (We do this)
- **Check**: Are you calling `prompt()` correctly? (We do this)
- **Check**: Browser console for errors

**Issue**: User sees fallback message
- **Reason**: Event didn't fire (see reasons above)
- **Solution**: User must add manually via browser menu

## Testing Checklist

- [ ] Manifest.json is accessible at `/manifest.json`
- [ ] Service worker is registered (Application → Service Workers)
- [ ] Icons exist and are valid PNG files
- [ ] Site is served over HTTPS (or localhost)
- [ ] Browser supports PWA install (Chrome/Edge on Android)
- [ ] User hasn't dismissed prompt before
- [ ] App isn't already installed

## Manual Install Instructions

If the prompt doesn't appear, users can still install:

### Android Chrome
1. Tap menu (three dots)
2. Select "Add to Home screen" or "Install app"
3. Tap "Add" or "Install"

### iOS Safari
1. Tap Share button
2. Scroll to "Add to Home Screen"
3. Tap "Add"

### Desktop Chrome/Edge
1. Look for install icon in address bar
2. Or: Menu → "Install [App Name]"

