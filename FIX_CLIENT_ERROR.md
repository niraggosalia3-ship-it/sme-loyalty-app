# Fix Client-Side Error After Page Load

## Issue: Page loads then crashes

The page loads for a second, then shows "Application error: a client-side exception has occurred".

This suggests:
1. Server-side rendering works (initial page load)
2. Client-side code fails (likely the API fetch in useEffect)

## Root Cause

The `fetchSMEs()` function in `app/page.tsx` is called in `useEffect` and tries to fetch from `/api/smes`. If this fails, it might be causing the crash.

## Solution 1: Update NEXT_PUBLIC_APP_URL

Since you renamed the project to `sme-loyalty-app1`, make sure:

1. Go to Vercel → Settings → Environment Variables
2. Find `NEXT_PUBLIC_APP_URL`
3. Update to: `https://sme-loyalty-app1.vercel.app`
4. Make sure it's enabled for Production, Preview, Development
5. **Redeploy**

## Solution 2: Add Error Boundary

The client-side error might be crashing the entire app. We should add better error handling.

## Solution 3: Check API Response

The API might be returning an error that crashes the client. Check:
1. Visit: `https://sme-loyalty-app1.vercel.app/api/smes`
2. See what error is returned
3. The improved error handling should now show detailed errors

## Immediate Action

1. **Update NEXT_PUBLIC_APP_URL** in Vercel to match the new project name
2. **Redeploy** after updating
3. **Test the API endpoint** directly to see the actual error
4. Check **Vercel Function Logs** for detailed errors

## Most Likely Issue

The `NEXT_PUBLIC_APP_URL` is still set to the old URL, or the API is failing and the error isn't being caught properly, causing a React crash.

