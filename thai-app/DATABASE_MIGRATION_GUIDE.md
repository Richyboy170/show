# Database Migration Guide: SQLite → PostgreSQL

## Why This Migration is Necessary

Currently, your app uses **SQLite** (a local file database). This means:
- ❌ Each admin has their own separate database on their machine
- ❌ Data is NOT shared between admins
- ❌ When you deploy to production, each instance has its own database

After migration to **PostgreSQL**:
- ✅ All admins connect to the SAME cloud database
- ✅ Everyone sees the same videos, lyrics, and data in real-time
- ✅ One central source of truth

---

## Step 1: Create PostgreSQL Database (Choose One)

### Option A: Supabase (Recommended - Free Forever ✅)

**Free Tier: 500 MB storage, unlimited requests, no credit card needed**

1. Go to https://supabase.com
2. Click "Start your project"
3. Create new organization and project
4. Wait for database to provision (~2 minutes)
5. Go to Settings → Database
6. Find "Connection string" → Select "URI" mode
7. Copy the connection string
8. Replace `[YOUR-PASSWORD]` with your actual database password

### Option B: Neon (Also Free Forever ✅)

**Free Tier: 0.5 GB storage, 10 GB data transfer/month**

1. Go to https://neon.tech
2. Sign up with GitHub
3. Create new project
4. Copy the connection string from the dashboard

### Option C: Render (Free with 90-day inactivity limit)

**Free Tier: 1 GB storage, spins down after 90 days of no activity**

1. Go to https://render.com
2. Sign up
3. New → PostgreSQL
4. Copy connection string

### ❌ Railway (NOT Recommended)

**Only 30 days free trial, then requires payment**

---

## Step 2: Update Environment Variables

**Both `.env` and `.env.local` have been updated with placeholder URLs.**

You need to replace the placeholder with your REAL database URL:

```bash
# Open .env file and replace this line:
DATABASE_URL="postgresql://user:password@host.railway.app:5432/railway"

# With your actual URL from Supabase/Neon/Render, examples:

# Supabase example:
DATABASE_URL="postgresql://postgres.xxxx:password@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

# Neon example:
DATABASE_URL="postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb"
```

**IMPORTANT:** Update BOTH files:
- `thai-app/.env`
- `thai-app/.env.local`

Make them IDENTICAL so all environments use the same database.

---

## Step 3: Install PostgreSQL Dependencies

```bash
cd "C:\Users\HP\Desktop\Special Code\show\thai-app"
npm install pg
```

---

## Step 4: Generate New Prisma Client

```bash
npx prisma generate
```

---

## Step 5: Migrate Database Schema

This will create all tables in your new PostgreSQL database:

```bash
npx prisma db push
```

You should see:
```
✔ Generated Prisma Client
Your database is now in sync with your Prisma schema.
```

---

## Step 6: Set Up Admin Account

Run the admin setup script:

```bash
npm run setup:admin
```

This creates admin accounts for:
- patiharn.liang@gmail.com
- richyboy170@gmail.com

---

## Step 7: (Optional) Migrate Existing Data

If you have existing videos/lyrics in SQLite that you want to keep:

### Option A: Manual Export/Import

1. Open old SQLite database:
```bash
npx prisma studio
```

2. Export data to JSON (screenshot each table)
3. Manually re-add videos through the admin panel

### Option B: Automated Migration Script

I can create a migration script to copy all data from SQLite → PostgreSQL if needed.

---

## Step 8: Share Database with Other Admins

**All admins need the SAME `DATABASE_URL` to see the same data.**

### For Each Admin:

1. Send them the PostgreSQL connection URL (from Supabase/Neon/Render)
2. They update their `.env` and `.env.local` files with:
   ```bash
   DATABASE_URL="postgresql://postgres:password@your-host.supabase.com:5432/postgres"
   ```
3. They run:
   ```bash
   npx prisma generate
   npm run dev
   ```

**That's it!** All admins will now connect to the same database.

---

## Step 9: Verify It's Working

### Test 1: Add a Video
1. Admin 1 adds a video through the admin panel
2. Admin 2 refreshes their page
3. Admin 2 should see the same video

### Test 2: Edit Lyrics
1. Admin 1 edits lyrics on a video
2. Admin 2 opens the same video
3. Admin 2 should see the updated lyrics

### Test 3: Check Database
Open Prisma Studio:
```bash
npm run db:studio
```

You should see all your data in the cloud database.

---

## Troubleshooting

### Error: "Can't reach database server"
- ✅ Check your `DATABASE_URL` is correct
- ✅ Make sure you're connected to the internet
- ✅ Verify the database is running in Railway/Supabase dashboard

### Error: "Connection timeout"
- ✅ Check if your IP is whitelisted (some providers require this)
- ✅ Railway doesn't need IP whitelisting
- ✅ Supabase: Go to Settings → Database → Network restrictions

### Error: "SSL connection required"
Add `?sslmode=require` to the end of your `DATABASE_URL`:
```bash
DATABASE_URL="postgresql://...?sslmode=require"
```

### Data not syncing between admins
- ✅ Confirm all admins have the EXACT SAME `DATABASE_URL`
- ✅ Each admin should run `npx prisma generate` after updating `.env`
- ✅ Restart dev server (`npm run dev`)

---

## Security Notes

**⚠️ NEVER commit your `.env` or `.env.local` files to Git!**

These files contain:
- Database credentials
- API keys
- Secrets

They're already in `.gitignore`, but double-check:
```bash
git status
```

If you see `.env` or `.env.local` in the list, DO NOT commit them.

---

## Cost Estimate (All FREE Forever ✅)

**Supabase** (Recommended):
- ✅ **500 MB database** (more than enough for thousands of songs)
- ✅ Unlimited API requests
- ✅ Free forever, no credit card
- ✅ Excellent for production

**Neon**:
- ✅ **0.5 GB storage**
- ✅ 10 GB data transfer/month
- ✅ Free forever, no credit card
- ✅ Modern and fast

**Render**:
- ✅ **1 GB storage**
- ✅ Free forever (spins down after 90 days of inactivity)
- ✅ Good alternative

**Storage Estimate:**
- Each video with lyrics: ~5-10 KB
- 500 MB = space for **50,000+ videos**
- You'll never hit the limit!

For your use case (Thai lyrics website), **Supabase free tier is perfect for production**.

---

## Next Steps

After migration:
1. Test thoroughly with all admins
2. Deploy to production with the same `DATABASE_URL`
3. Set up automated backups (Supabase/Neon provide this automatically)
4. Monitor database usage in the provider dashboard

**Need help?** Check the provider documentation:
- Supabase: https://supabase.com/docs/guides/database
- Neon: https://neon.tech/docs/introduction
- Render: https://render.com/docs/databases
