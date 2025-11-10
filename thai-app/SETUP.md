# Quick Setup Guide

This guide will help you get the Thai Lyrics website up and running quickly.

## Step 1: Install Dependencies

```bash
cd thai-lyrics-app
npm install
```

## Step 2: Set Up Google OAuth

### Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen (add your admin email to test users)
6. Create OAuth Client ID (Web application)
7. Add authorized redirect URIs:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
8. Copy the **Client ID** and **Client Secret**

## Step 3: Set Up YouTube API

### Get YouTube API Key

1. In the same Google Cloud project
2. Enable **YouTube Data API v3**
3. Go to **Credentials** → **Create Credentials** → **API Key**
4. Copy the API key

### Get Channel ID

1. Go to https://www.youtube.com/@josietso
2. Right-click → View Page Source
3. Search for "channelId" (Ctrl+F)
4. Copy the channel ID (starts with "UC")

## Step 4: Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"

# Google OAuth (from Step 2)
GOOGLE_CLIENT_ID="your-client-id-here"
GOOGLE_CLIENT_SECRET="your-client-secret-here"

# Admin (your girlfriend's email and a secure password)
ADMIN_EMAIL="her-email@gmail.com"
ADMIN_PASSWORD="secure-password-here"

# YouTube API (from Step 3)
YOUTUBE_API_KEY="your-api-key-here"
YOUTUBE_CHANNEL_ID="UCxxxxxxxxxxxxxxxxxxxxx"
```

## Step 5: Initialize Database

```bash
npm run db:push
npm run setup:admin
```

You should see:
```
✅ Admin user created/updated: her-email@gmail.com
✅ Channel monitor created for: @josietso
✨ Setup complete!
```

## Step 6: Run Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

## Step 7: Login and Add Your First Video

1. Click **Admin Login**
2. Sign in with Google (using admin email) OR use email + password
3. Go to **Add Video** tab
4. Paste a YouTube URL from @josietso channel
5. Click **Add Video**
6. Click the edit icon to add lyrics

## Adding Lyrics

1. Watch the video in the editor
2. Click **Add Lyric at Current Time** when you hear a line
3. Fill in:
   - **Thai Text**: ภาษาไทย
   - **Translation**: English translation
   - **Start/End Time**: Adjust timing as needed
4. Click **Save All Lyrics**
5. View the video on the main site with synchronized lyrics!

## Monitoring YouTube Channel

To automatically check for new videos:

### Option 1: Manual Check (for testing)

Create a simple script or use a REST client to POST to:
```
http://localhost:3000/api/youtube/check-channel
```

With your admin session cookie.

### Option 2: Automated (for production)

Set up a cron job using services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- Vercel Cron Jobs (if deployed on Vercel)

Schedule: Every hour
URL: `https://yourdomain.com/api/youtube/check-channel`
Method: POST

When new videos are detected, you'll see notifications in the admin dashboard.

## Database Management

View/edit database records:
```bash
npm run db:studio
```

Opens at: http://localhost:5555

## Troubleshooting

### "Invalid client" error
- Check Google OAuth credentials are correct
- Verify redirect URI matches exactly

### "YouTube API quota exceeded"
- The free tier has 10,000 units/day
- Each video search costs ~100 units
- Wait 24 hours or request quota increase

### Admin can't login
- Make sure the email in `.env` matches exactly
- Run `npm run setup:admin` again to reset password

### Videos not appearing
- Check YouTube API key is valid
- Ensure videos are public (not private/unlisted)

## Next Steps

- Customize the design in `app/globals.css`
- Add more features in the admin panel
- Deploy to production (see README.md)

## Need Help?

Check the full [README.md](./README.md) for detailed documentation.
