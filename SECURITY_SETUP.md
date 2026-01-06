# Security Setup Guide

## Overview

This guide explains the low-friction security implementation that protects your app without adding password complexity.

## What Was Implemented

### ✅ Magic Link Authentication for SMEs
- SMEs receive a secure link via email (no password needed)
- Click link → Instantly logged in
- Session persists for 30 days
- Can request new link if expired

### ✅ Admin Token Authentication
- Simple token-based access for admin dashboard
- Token stored in environment variable
- One-time entry, remembered for 30 days

### ✅ Rate Limiting
- Public endpoints: 100 requests/minute per IP
- API key endpoints: 1000 requests/minute per API key
- Magic link requests: 5 requests/hour per email

### ✅ Security Headers
- X-Frame-Options: DENY (prevents clickjacking)
- X-Content-Type-Options: nosniff
- X-XSS-Protection: enabled
- Referrer-Policy: strict-origin-when-cross-origin

### ✅ Authorization Checks
- SMEs can only access their own dashboard
- Customers remain public (via QR code - no change)

---

## Environment Variables Required

Add these to your `.env.local` (for local) and Vercel environment variables (for production):

```bash
# Admin Access Token (set your own secret)
ADMIN_ACCESS_TOKEN=your-secret-admin-token-here

# Email Service (Resend - free tier: 3,000 emails/month)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=Loyalty Program <onboarding@resend.dev>

# App URL (already set, but verify)
NEXT_PUBLIC_APP_URL=https://yourproject.vercel.app
```

---

## Setup Steps

### 1. Set Admin Token

**Local (.env.local):**
```bash
ADMIN_ACCESS_TOKEN=my-secret-admin-token-123
```

**Production (Vercel):**
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add `ADMIN_ACCESS_TOKEN` with your secret token
- Redeploy

### 2. Set Up Resend (Email Service)

1. **Sign up at [resend.com](https://resend.com)** (free tier: 3,000 emails/month)
2. **Get API Key:**
   - Go to API Keys section
   - Create new API key
   - Copy the key (starts with `re_`)

3. **Add to Environment Variables:**
   ```bash
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=Loyalty Program <onboarding@resend.dev>
   ```

4. **Verify Domain (Optional but Recommended):**
   - Add your domain in Resend dashboard
   - Add DNS records they provide
   - Update `RESEND_FROM_EMAIL` to use your domain

### 3. Test the Setup

**Admin Dashboard:**
1. Visit `/` (admin dashboard)
2. Should redirect to `/admin/login`
3. Enter your `ADMIN_ACCESS_TOKEN`
4. Should redirect back to admin dashboard
5. Token remembered for 30 days

**SME Dashboard:**
1. Create a new SME with owner email
2. Check email for magic link
3. Click link → Should instantly access SME dashboard
4. Session persists for 30 days

**Request Access:**
1. Visit `/sme/[smeId]` without token
2. Should redirect to `/sme/[smeId]/request-access`
3. Enter email → Receive magic link
4. Click link → Access dashboard

---

## How It Works

### Magic Link Flow

```
1. Admin creates SME with owner email
   ↓
2. System generates secure token
   ↓
3. Email sent with magic link: /sme/[smeId]?token=[secure-token]
   ↓
4. SME clicks link
   ↓
5. Middleware verifies token → Creates session cookie
   ↓
6. Redirects to /sme/[smeId] (token removed from URL)
   ↓
7. Session cookie valid for 30 days
```

### Admin Token Flow

```
1. Visit admin dashboard (/)
   ↓
2. Middleware checks for admin_token cookie
   ↓
3. If missing → Redirect to /admin/login
   ↓
4. Enter token → Verify → Create cookie
   ↓
5. Redirect to admin dashboard
   ↓
6. Cookie valid for 30 days
```

---

## Security Features

### ✅ What's Protected

- **Admin Dashboard:** Requires `ADMIN_ACCESS_TOKEN`
- **SME Dashboards:** Require valid magic link token or session cookie
- **API Endpoints:** Rate limited by IP/API key
- **All Pages:** Security headers applied

### ✅ What's Not Protected (By Design)

- **Customer Dashboards:** Remain public via QR code (as intended)
- **Program Pages:** Remain public (as intended)
- **Form Pages:** Remain public (as intended)

---

## Troubleshooting

### "Admin login page not showing"
- Check `ADMIN_ACCESS_TOKEN` is set in environment variables
- Clear browser cookies and try again
- Check middleware is running (should see in build output)

### "Magic link email not received"
- Check `RESEND_API_KEY` is set correctly
- Check spam folder
- In development, check console logs (link is logged if email fails)
- Magic link URL is also returned in API response (can copy manually)

### "Rate limit errors"
- Normal behavior if too many requests
- Wait a few minutes and try again
- For API endpoints, use API key for higher limits

### "SME dashboard redirects to request-access"
- Token may have expired (24 hours)
- Request new access link
- Check session cookie is set (in browser dev tools)

---

## Cost

- **Resend:** Free (3,000 emails/month)
- **Rate Limiting:** Free (in-memory, resets on server restart)
- **Total:** $0/month

---

## Next Steps (Optional Enhancements)

1. **Upgrade to Redis for Rate Limiting:**
   - Use Upstash Redis (free tier available)
   - Better for production (persists across restarts)
   - Update `lib/rate-limit.ts` to use Redis

2. **Add Email Templates:**
   - Customize magic link email design
   - Add your branding
   - Update `lib/email.ts`

3. **Add Audit Logging:**
   - Track who accessed what
   - Log all admin actions
   - Create `AuditLog` model in Prisma

4. **Add Two-Factor Authentication (Optional):**
   - SMS-based 2FA for admin
   - Email-based 2FA for SMEs
   - Only if needed for higher security

---

## Files Created/Modified

### New Files:
- `lib/magic-link.ts` - Magic link generation/verification
- `lib/email.ts` - Email sending utilities
- `lib/rate-limit.ts` - Rate limiting utilities
- `middleware.ts` - Authentication, authorization, rate limiting
- `app/admin/login/page.tsx` - Admin login page
- `app/api/admin/verify-token/route.ts` - Admin token verification
- `app/api/smes/id/[smeId]/send-access-link/route.ts` - Resend magic link
- `app/sme/[smeId]/request-access/page.tsx` - Request access page

### Modified Files:
- `prisma/schema.prisma` - Added `SMEAccessToken` model, `ownerEmail` field
- `app/api/smes/route.ts` - Generate magic link on SME creation
- `app/page.tsx` - Added owner email field
- `next.config.js` - Added security headers

---

## Testing Checklist

- [ ] Admin dashboard requires token
- [ ] Admin token remembered for 30 days
- [ ] SME creation sends magic link email
- [ ] Magic link grants access to SME dashboard
- [ ] Session persists for 30 days
- [ ] Request access page works
- [ ] Rate limiting works (test by making many requests)
- [ ] Security headers present (check in browser dev tools)
- [ ] Customer dashboards still public (no change)

---

## Support

If you encounter issues:
1. Check environment variables are set correctly
2. Check Resend API key is valid
3. Check browser console for errors
4. Check server logs for detailed error messages

