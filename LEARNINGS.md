# Learnings & Troubleshooting Guide

This document captures common errors, their solutions, and best practices to avoid repeating mistakes.

---

## 🔴 Critical Issues & Solutions

### 1. Next.js Build Cache Corruption (Webpack Module Error)

**Error Symptoms:**
- Blank page on refresh
- Error: `Cannot find module './329.js'` or similar webpack runtime errors
- Status 500 errors in browser
- Page shows error page instead of content

**Root Cause:**
- Corrupted `.next` build cache folder
- Stale webpack artifacts after code changes
- Hot reload issues during development

**Solution:**
```bash
# Quick fix - Clear cache and restart
rm -rf .next
npm run dev

# Or use the helper script
npm run clean
npm run dev

# Or combined command
npm run dev:clean
```

**Prevention:**
- Clear cache when making significant changes
- Restart dev server if you see webpack errors
- Use `npm run dev:clean` if page goes blank unexpectedly

**When to Use:**
- ✅ Page goes blank after refresh
- ✅ Webpack module errors in console
- ✅ 500 errors on any route
- ✅ "Cannot find module" errors in build output

---

### 2. QR Code Import Error

**Error:**
```
Type error: Module '"react-qr-code"' has no exported member 'QRCode'
```

**Solution:**
- Use default import instead of named import:
```typescript
// ❌ Wrong
import { QRCode } from 'react-qr-code'

// ✅ Correct
import QRCode from 'react-qr-code'
```

**Prevention:**
- Check package documentation for correct import syntax
- Verify import type (default vs named) before using

---

### 3. Missing Closing Tags in JSX

**Error:**
```
Unexpected token `div`. Expected jsx identifier
```

**Solution:**
- Always verify closing tags match opening tags
- Check nested div structure carefully
- Use proper indentation to track tag pairs

**Prevention:**
- Count opening and closing tags
- Use IDE/editor that highlights matching tags
- Test build after structural changes: `npm run build`

---

### 4. Prisma Schema Changes Not Applied

**Error:**
- Database schema out of sync
- Type errors in Prisma client
- Missing fields in database

**Solution:**
```bash
# After schema changes, always run:
npx prisma generate
npx prisma db push

# Or use scripts:
npm run db:generate
npm run db:push
```

**Prevention:**
- Always run Prisma commands after schema changes
- Check for TypeScript errors after generating client
- Verify database structure matches schema

---

## 🟡 Common Patterns & Best Practices

### Development Workflow

1. **After Code Changes:**
   - Check for TypeScript errors: `npm run build`
   - Clear cache if page goes blank: `npm run clean`
   - Restart dev server if needed

2. **Before Committing:**
   - Run build to catch errors: `npm run build`
   - Check all pages load correctly
   - Verify database migrations if schema changed

3. **When Adding New Features:**
   - Update TypeScript interfaces
   - Update API routes to return new fields
   - Test both frontend and backend
   - Clear cache if issues arise

### File Upload Best Practices

- Always validate file type and size on server
- Store uploads in `public/uploads/` for Next.js
- Use unique filenames to prevent conflicts
- Add uploads folder to `.gitignore`

### Database Best Practices

- Use Prisma migrations for production
- Use `db push` for development
- Always generate Prisma client after schema changes
- Keep schema and database in sync

---

## 📝 Quick Reference Commands

### Fix Blank Page / Cache Issues
```bash
npm run clean && npm run dev
# or
npm run dev:clean
```

### Fix Prisma Issues
```bash
npm run db:generate
npm run db:push
```

### Check for Errors
```bash
npm run build
```

### View Database
```bash
npm run db:studio
```

---

## 🔄 Recurring Issues Checklist

When page goes blank or errors occur, check in this order:

1. ✅ Clear Next.js cache: `rm -rf .next`
2. ✅ Restart dev server
3. ✅ Check browser console for JavaScript errors
4. ✅ Verify all imports are correct
5. ✅ Check for missing closing tags
6. ✅ Run build to catch TypeScript errors: `npm run build`
7. ✅ Verify Prisma client is generated after schema changes
8. ✅ Check API routes return correct data structure

---

## 📚 Session-Specific Learnings

### Session 1: Initial Setup
- **Issue:** Node.js not found
- **Solution:** Use nvm path: `/Users/[username]/.nvm/versions/node/[version]/bin`
- **Learning:** Always check Node.js installation path before running commands

### Session 2: QR Code Implementation
- **Issue:** QR codes not working on phone (localhost)
- **Solution:** Need public URL for QR codes to work
- **Learning:** localhost URLs don't work when scanned from different devices

### Session 3: Banner Images
- **Issue:** Image upload API needed
- **Solution:** Created `/api/upload` route with file validation
- **Learning:** Next.js file uploads require FormData, not JSON

### Session 4: Cache Corruption
- **Issue:** Blank page after refresh (multiple times)
- **Solution:** Clear `.next` folder and restart
- **Learning:** Next.js cache can corrupt during hot reload - always have cleanup script ready

---

## 🎯 Action Items for Future

1. **Always add cleanup scripts** when setting up new projects
2. **Document common errors** as they occur
3. **Create helper scripts** for frequent operations
4. **Test after major changes** before moving forward
5. **Keep this document updated** with new learnings

---

## 📌 How to Update This Document

### When User Says "Remember This Learning"
- Add to appropriate section
- Include error message, solution, and prevention
- Add to quick reference if frequently used

### When Errors Repeat
- Move to "Recurring Issues" section
- Add to checklist
- Create helper script if applicable

### When New Patterns Emerge
- Add to "Common Patterns" section
- Include best practices
- Add examples

---

**Last Updated:** December 9, 2025  
**Version:** 1.0

