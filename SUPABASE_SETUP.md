# Supabase Setup Guide (5 Minutes)

**Why Supabase?**
- ✅ **FREE FOREVER** (no 30-day trial BS)
- ✅ 500 MB database (enough for 50,000+ songs)
- ✅ No credit card required
- ✅ Unlimited API requests
- ✅ Built-in backups
- ✅ Easy to use dashboard

---

## Step 1: Create Supabase Account (2 minutes)

1. Open https://supabase.com in your browser
2. Click **"Start your project"**
3. Sign up with **GitHub** (easiest) or email
4. You'll be redirected to the dashboard

---

## Step 2: Create a New Project (2 minutes)

1. Click **"New Project"**
2. Fill in:
   - **Name**: `thai-lyrics` (or anything you want)
   - **Database Password**: Create a STRONG password (save this!)
     - Example: `MySecurePass123!@#`
     - **IMPORTANT**: Write this down! You'll need it later.
   - **Region**: Choose closest to you
     - US East (if in USA)
     - Southeast Asia (if in Thailand)
3. Click **"Create new project"**
4. Wait 2 minutes while database provisions (grab coffee ☕)

---

## Step 3: Get Your Database URL (1 minute)

1. In your project dashboard, click **"Settings"** (bottom left)
2. Click **"Database"** from the sidebar
3. Scroll down to **"Connection string"**
4. Select **"URI"** tab (NOT "Session pooling")
5. You'll see something like:
   ```
   postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```
6. **Replace `[YOUR-PASSWORD]`** with your actual database password from Step 2
7. **Copy the full URL** (with your password in it)

**Example final URL:**
```
postgresql://postgres.abcdefghijk:MySecurePass123!@#@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

---

## Step 4: Update Your .env Files

1. Open `thai-app/.env` in your code editor
2. Find the line:
   ```bash
   DATABASE_URL="postgresql://postgres.xxxx:yourpassword@..."
   ```
3. Replace it with your REAL Supabase URL:
   ```bash
   DATABASE_URL="postgresql://postgres.abcdefghijk:MySecurePass123!@#@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
   ```

4. **Do the SAME in `thai-app/.env.local`**

---

## Step 5: Run Migration Commands

Open terminal in your project directory:

```bash
cd "C:\Users\HP\Desktop\Special Code\show\thai-app"

# Install PostgreSQL dependency
npm install pg

# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma db push

# Setup admin accounts
npm run setup:admin
```

You should see:
```
✔ Generated Prisma Client
✔ Your database is now in sync with your Prisma schema.
```

---

## Step 6: Verify It's Working

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Sign in as admin (with Google or email)

4. Open **Prisma Studio** to see your data:
   ```bash
   npm run db:studio
   ```

5. You should see all your tables (Admin, Video, Lyric, etc.)

---

## Step 7: Share with Other Admins

**All admins need the SAME database URL to see the same data.**

### Send to other admins:

```
Hey! Update your .env and .env.local files with this:

DATABASE_URL="postgresql://postgres.abcdefghijk:MySecurePass123!@#@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

Then run:
npx prisma generate
npm run dev

Now we're all connected to the same database!
```

---

## Troubleshooting

### Error: "Can't reach database server"

**Check 1:** Is your DATABASE_URL correct?
- Make sure you replaced `[YOUR-PASSWORD]` with your actual password
- No spaces in the URL
- No missing characters

**Check 2:** Are you connected to the internet?

**Check 3:** Is the password correct?
- Go back to Supabase → Settings → Database
- You can reset the password if you forgot it

### Error: "SSL connection required"

Add `?sslmode=require` to the end of your URL:
```bash
DATABASE_URL="postgresql://...postgres?sslmode=require"
```

### Error: "Password authentication failed"

Your password has special characters. Supabase needs them URL-encoded:
- `@` becomes `%40`
- `#` becomes `%23`
- `!` becomes `%21`
- Space becomes `%20`

Example:
- Password: `My Pass@123!`
- Encoded: `My%20Pass%40123%21`

Or just reset your password in Supabase to use only letters and numbers.

### Can't see data from other admins

1. Make sure ALL admins have the EXACT SAME `DATABASE_URL`
2. Each admin must run `npx prisma generate` after updating .env
3. Restart dev server (`npm run dev`)
4. Hard refresh the browser (Ctrl + Shift + R)

---

## Monitoring Your Database

### Check Usage

1. Go to Supabase dashboard
2. Click your project
3. Click **"Settings"** → **"Usage"**
4. See:
   - Database size
   - API requests
   - Bandwidth

### Backup Your Data

Supabase automatically backs up your database daily!

To manually backup:
1. Click **"Database"** in sidebar
2. Click **"Backups"** tab
3. Click **"Create backup"**

---

## Free Tier Limits

Your free tier includes:
- ✅ **500 MB database** (you'll likely never hit this)
- ✅ **Unlimited API requests**
- ✅ **1 GB file storage** (for thumbnails if needed)
- ✅ **2 GB bandwidth/month** (more than enough)
- ✅ **Automatic daily backups** (7-day retention)

**Will you ever hit the limit?**

Storage calculation:
- Each video + lyrics: ~5 KB
- 500 MB ÷ 5 KB = **100,000 videos**

Josie Tso has ~200 videos. You could add **500x more** and still be fine! 🎉

---

## Next Steps

After setup:
1. ✅ Add videos through admin panel
2. ✅ Test with multiple admins
3. ✅ Deploy to production (use the same DATABASE_URL)
4. ✅ Monitor usage in Supabase dashboard

**That's it! You now have a professional, free, cloud database that all admins share!** 🚀

---

## Quick Reference

**Supabase Dashboard:** https://supabase.com/dashboard

**Your Project URL:** https://supabase.com/dashboard/project/YOUR_PROJECT_ID

**Useful Commands:**
```bash
# See database in GUI
npm run db:studio

# Push schema changes
npm run db:push

# Generate Prisma client
npx prisma generate

# Setup admin
npm run setup:admin
```

**Need Help?**
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Prisma Docs: https://www.prisma.io/docs
