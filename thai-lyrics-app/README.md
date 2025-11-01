# Thai Lyrics Website

A beautiful Next.js website for displaying Thai song lyrics with English translations, featuring synchronized lyrics playback with YouTube videos.

## Features

- **Admin-Only Access**: Secure authentication with Google OAuth and password protection
- **Video Management**: Add YouTube videos and manage their lyrics
- **Synchronized Lyrics**: Real-time lyrics display synchronized with video playback
- **YouTube Channel Monitoring**: Automatic notifications when new videos are published
- **Thai Language Support**: Beautiful Thai font rendering with Noto Sans Thai
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **UI Components**: Custom React components with Lucide icons
- **Video Player**: react-youtube

## Setup Instructions

### 1. Prerequisites

- Node.js 18 or higher
- npm or yarn
- A Google Cloud account (for OAuth)
- A YouTube Data API key

### 2. Install Dependencies

```bash
cd thai-lyrics-app
npm install
```

### 3. Configure Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Then edit `.env` and fill in the required values:

#### Database
```
DATABASE_URL="file:./dev.db"
```

#### NextAuth Configuration
```
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

Generate a secret with:
```bash
openssl rand -base64 32
```

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen
6. Create OAuth client ID (Web application)
7. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)
8. Copy the Client ID and Client Secret to your `.env`:

```
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

#### Admin Configuration
```
ADMIN_EMAIL="your-girlfriend-email@gmail.com"
ADMIN_PASSWORD="your-special-admin-password"
```

#### YouTube API Setup

1. In Google Cloud Console, enable the "YouTube Data API v3"
2. Go to "Credentials" → "Create Credentials" → "API Key"
3. Copy the API key to your `.env`:

```
YOUTUBE_API_KEY="your-youtube-api-key"
```

4. Get the Channel ID:
   - Go to https://www.youtube.com/@josietso
   - View page source and search for "channelId"
   - Copy the channel ID to your `.env`:

```
YOUTUBE_CHANNEL_ID="UCxxxxxxxxxxxxxxxxxxxxx"
```

### 4. Initialize Database

Run Prisma migrations to create the database:

```bash
npx prisma db push
npx prisma generate
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the website.

## Usage Guide

### Admin Login

1. Go to the website and click "Admin Login"
2. Sign in with Google (using the admin email) OR use the email + password
3. You'll be redirected to the admin dashboard

### Adding Videos

1. In the admin dashboard, click the "Add Video" tab
2. Paste a YouTube URL (from @josietso channel)
3. Click "Add Video"
4. The video details will be fetched automatically

### Managing Lyrics

1. In the "My Videos" tab, click the edit icon on any video
2. Watch the video and click "Add Lyric at Current Time" to add a lyric line
3. Fill in:
   - Thai text (ภาษาไทย)
   - English translation
   - Start time and end time (in seconds)
4. Click "Save All Lyrics" when done

### Channel Monitoring

The system can automatically check for new videos on the YouTube channel:

1. Set up a cron job to hit the endpoint: `POST /api/youtube/check-channel`
2. Or manually trigger it from your admin panel
3. When new videos are detected, you'll receive notifications
4. Approve or reject the notifications to add them to your site

Example cron setup (using cron-job.org or similar):
```
Schedule: Every hour
URL: https://yourdomain.com/api/youtube/check-channel
Method: POST
Headers: Cookie: (your admin session cookie)
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy!

Note: For production, you should use a proper database (PostgreSQL, MySQL, etc.) instead of SQLite.

Update `schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Render
- AWS Amplify
- Self-hosted with Docker

## Database Schema

- **Admin**: User accounts with Google OAuth and password
- **Video**: YouTube videos with metadata
- **Lyric**: Synchronized lyrics with timestamps
- **ChannelMonitor**: Tracks YouTube channel for new videos
- **Notification**: Alerts admin about channel changes

## API Routes

- `POST /api/videos` - Add a new video
- `GET /api/videos` - List all videos
- `DELETE /api/videos/[id]` - Delete a video
- `PUT /api/videos/[id]` - Update video details
- `POST /api/lyrics` - Add a lyric
- `PUT /api/lyrics` - Update a lyric
- `DELETE /api/lyrics` - Delete a lyric
- `POST /api/youtube/check-channel` - Check for new videos
- `POST /api/notifications/[id]/approve` - Approve a notification
- `POST /api/notifications/[id]/reject` - Reject a notification
- `POST /api/notifications/[id]/read` - Mark as read

## Development Tips

### Reset Database

```bash
rm prisma/dev.db
npx prisma db push
```

### View Database

```bash
npx prisma studio
```

This opens a GUI to view and edit database records at `http://localhost:5555`

### Check Logs

All API errors are logged to the console. Check the terminal where `npm run dev` is running.

## Troubleshooting

**Issue**: "YouTube API quota exceeded"
- Solution: The YouTube API has daily quota limits. Wait 24 hours or request a quota increase.

**Issue**: "Authentication error"
- Solution: Check that your Google OAuth credentials are correct and the redirect URIs are properly configured.

**Issue**: "Video not found"
- Solution: Ensure the YouTube API key has access to the video and it's not private.

**Issue**: "Lyrics not syncing"
- Solution: Check that the start and end times are set correctly for each lyric.

## License

MIT

## Credits

- Built with Next.js, React, and Tailwind CSS
- Icons by Lucide
- Thai font: Noto Sans Thai by Google Fonts
