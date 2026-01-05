# Test Database Connection

## Current DATABASE_URL Format

Your password: `gbZXQ/*E9y!!Ks#`

URL-encoded password: `gbZXQ%2F%2AE9y%21%21Ks%23`

Full connection string should be:
```
postgresql://postgres:gbZXQ%2F%2AE9y%21%21Ks%23@db.dkwewdazxjbmjihriplv.supabase.co:5432/postgres
```

## Common Issues

### Issue 1: Password Not URL-Encoded
If the password has special characters, they MUST be URL-encoded:
- `/` → `%2F`
- `*` → `%2A`
- `!` → `%21`
- `#` → `%23`

### Issue 2: Connection String Format
Make sure there are NO spaces or extra characters in the DATABASE_URL.

### Issue 3: Supabase Project Status
1. Go to Supabase dashboard
2. Check if project is "Active" (not paused)
3. Check if database is accessible

### Issue 4: Network Restrictions
Supabase might have IP restrictions. Check:
1. Supabase dashboard → Settings → Database
2. Look for "Connection pooling" or "Network restrictions"
3. Make sure Vercel's IPs are allowed (usually they are by default)

## Alternative: Use Connection Pooler

If direct connection (port 5432) doesn't work, use connection pooler (port 6543):

1. Go to Supabase → Settings → Database
2. Under "Connection pooling", copy the connection string
3. It will look like:
   ```
   postgresql://postgres.dkwewdazxjbmjihriplv:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
4. URL-encode the password in this string too
5. Update DATABASE_URL in Vercel

## Test Connection

You can test the connection string format locally (if you have psql):
```bash
psql "postgresql://postgres:gbZXQ%2F%2AE9y%21%21Ks%23@db.dkwewdazxjbmjihriplv.supabase.co:5432/postgres"
```

Or test from Supabase SQL Editor to verify the database is accessible.


