# Get Your Supabase Database Connection String

## Your Supabase Project
**Dashboard URL:** https://owupnggnrvzugyjfgzss.supabase.co

⚠️ **This is NOT your database URL!** You need the PostgreSQL connection string.

---

## Step-by-Step: Get Your PostgreSQL Connection String

### 1. Open Your Supabase Dashboard
Go to: https://owupnggnrvzugyjfgzss.supabase.co

### 2. Click "Settings" (Left Sidebar, Bottom)
Look for the gear icon ⚙️

### 3. Click "Database"
In the settings sidebar menu

### 4. Scroll Down to "Connection string"
You'll see multiple tabs

### 5. Click the "URI" Tab
**IMPORTANT:** Click "URI" tab, NOT:
- ❌ Session pooling
- ❌ Connection parameters
- ❌ Transaction pooling

### 6. Copy the Connection String
You'll see something like:
```
postgresql://postgres.owupnggnrvzugyjfgzss:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

### 7. Replace [YOUR-PASSWORD]
Replace `[YOUR-PASSWORD]` with your actual database password (the one you set when creating the project)

**Example:**
If your password is `MySecure123`, the final URL should be:
```
postgresql://postgres.owupnggnrvzugyjfgzss:MySecure123@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

---

## Don't Remember Your Password?

### Option A: Find It in Your Notes
Check where you wrote it down when you created the project

### Option B: Reset Your Password
1. In Supabase → Settings → Database
2. Scroll to "Database password"
3. Click **"Reset database password"**
4. Enter a NEW password (example: `ThaiLyrics2025!`)
5. Click "Reset password"
6. **Write it down!**
7. Use this new password in your connection string

---

## Update Your .env Files

Once you have the CORRECT connection string, update these files:

### 1. Update `thai-app/.env`
Replace line 5 with your real connection string:

```bash
DATABASE_URL="postgresql://postgres.owupnggnrvzugyjfgzss:YourPassword@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

### 2. Update `thai-app/.env.local`
Replace line 11 with the SAME connection string:

```bash
DATABASE_URL="postgresql://postgres.owupnggnrvzugyjfgzss:YourPassword@aws-0-us-west-1.pooler.supabase.com:5432/postgres"
```

**Make sure both files have the EXACT SAME connection string!**

---

## Then Run These Commands

After updating both .env files:

```bash
# Navigate to project
cd "C:\Users\HP\Desktop\Special Code\show\thai-app"

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Setup admin account
npm run setup:admin

# Start dev server
npm run dev
```

You should see:
```
✅ Admin user created/updated: patiharn.liang@gmail.com
✅ Channel monitor created for: @josietso
```

---

## Troubleshooting

### Still getting "Tenant or user not found"?

**Check 1:** Is your DATABASE_URL correct?
- Must start with `postgresql://`
- Must have your password (no `[YOUR-PASSWORD]` text)
- Must have `.pooler.supabase.com` in it
- No extra spaces or line breaks

**Check 2:** Password has special characters?
Some characters need to be URL-encoded:
- `@` → `%40`
- `#` → `%23`
- `!` → `%21`
- `$` → `%24`
- `%` → `%25`
- Space → `%20`

Example:
- Password: `Thai@123!`
- Encoded: `Thai%40123%21`
- Full URL: `postgresql://postgres.owupnggnrvzugyjfgzss:Thai%40123%21@aws-0-us-west-1.pooler.supabase.com:5432/postgres`

**Check 3:** Try resetting your password
Use a simple password with no special characters (example: `ThaiLyrics2025`)

---

## Visual Guide

```
Wrong URL (dashboard):
https://owupnggnrvzugyjfgzss.supabase.co
❌ This won't work!

Correct URL (database):
postgresql://postgres.owupnggnrvzugyjfgzss:YourPassword@aws-0-us-west-1.pooler.supabase.com:5432/postgres
✅ This is what you need!
```

---

## Need Help?

After you get the correct connection string, paste it here and I'll help you update the files!
