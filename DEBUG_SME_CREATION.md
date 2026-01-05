# Debug SME Creation Error

## Current Error
- Error: "Failed to create SME"
- Error Code: UNKNOWN
- Fix suggestion: Check DATABASE_URL format

## Important Notes

1. **GET endpoint works** (page loads), so DATABASE_URL is set
2. **POST endpoint fails** (creating SME), so there might be:
   - Different error type not being caught
   - Connection pool issue
   - Schema/permissions issue
   - Different error code format

## Next Steps

### Step 1: Check Vercel Logs (MOST IMPORTANT)

1. Go to Vercel → Your project (`sme-loyalty-app1`)
2. Go to **Logs** tab
3. Try creating an SME again
4. Look for errors with:
   - "Error creating SME:"
   - "Error details:"
5. **Copy the FULL error message** from logs

The logs will show:
- Actual error name (PrismaClientInitializationError, etc.)
- Actual error message
- Actual error code (P1001, P1013, etc.)
- Full stack trace

### Step 2: Verify DATABASE_URL in Vercel

1. Go to Vercel → Your project → **Settings** → **Environment Variables**
2. Check if `DATABASE_URL` is set
3. **DO NOT share the actual URL** (contains password), but check:
   - Is it set?
   - Does it use port 6543 (Connection Pooler) or 5432 (Direct)?
   - Is the password URL-encoded? (special characters like `/`, `*`, `!`, `#` should be encoded)

### Step 3: Test Database Connection

The GET endpoint works, so the database IS accessible. The issue might be:
- Write permissions
- Schema differences
- Transaction errors

## What to Share

Please share:
1. **FULL error from Vercel Logs** (look for "Error creating SME:" or "Error details:")
2. **DATABASE_URL format** (just the format, NOT the actual password):
   - Port number (6543 or 5432)?
   - Does password have special characters?

With the actual error from logs, I can fix it immediately!


