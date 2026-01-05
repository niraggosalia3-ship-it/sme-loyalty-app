# Vercel URLs Explained

## Your Three URLs

1. **`sme-loyalty-app1.vercel.app`** ← **Use this one for NEXT_PUBLIC_APP_URL**
   - This is your **production URL** (main domain)
   - Use this for `NEXT_PUBLIC_APP_URL`

2. **`sme-loyalty-app1-git-main-nirags-projects-3b5903d9.vercel.app`**
   - This is a **preview/deployment URL** (auto-generated)
   - Don't use this for environment variables

3. **`sme-loyalty-app1-ecbieyvx8-nirags-projects-3b5903d9.vercel.app`**
   - This is another **preview/deployment URL** (auto-generated)
   - Don't use this for environment variables

## Which URL to Use

### For NEXT_PUBLIC_APP_URL
Use: `https://sme-loyalty-app1.vercel.app`

This is your main production URL that will work consistently.

## Complete Environment Variables

### 1. DATABASE_URL
```
postgresql://postgres.dkwewdazxjbmjihriplv:gbZXQ%2F%2AE9y%21%21Ks%23@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 2. NEXT_PUBLIC_APP_URL
```
https://sme-loyalty-app1.vercel.app
```

### 3. BLOB_READ_WRITE_TOKEN
```
[Copy from Vercel Storage tab]
```

## Important Notes

- **Always use the production URL** (`sme-loyalty-app1.vercel.app`) for `NEXT_PUBLIC_APP_URL`
- The preview URLs are temporary and change with each deployment
- Your production URL is stable and won't change
- Make sure to include `https://` (not `http://`)


