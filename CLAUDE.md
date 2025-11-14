# CLAUDE.md - Thai Lyrics Website Quick Reference

## 1. Quick Start Commands

### Continue Work on the Project
```bash
# Navigate to project directory
cd "C:\Users\HP\Desktop\Special Code\show\thai-app"

# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# Open in browser: http://localhost:3000
```

### Database Management
```bash
# Push schema changes to database
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio

# Setup admin user
npm run setup:admin
```

### Production Commands
```bash
# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

### Ngrok (Expose Local Server)
```bash
# Expose local development server to internet (useful for OAuth testing)
ngrok http 3000

# With custom domain (requires ngrok paid plan)
ngrok http 3000 --domain=your-domain.ngrok-free.app

# After running ngrok:
# 1. Copy the forwarding URL (e.g., https://abc123.ngrok-free.app)
# 2. Update NEXTAUTH_URL in .env.local with the ngrok URL
# 3. Add the ngrok URL to Google OAuth authorized redirect URIs
# 4. Restart your dev server (npm run dev)
```

---

## 2. Architectural Structure

### Tech Stack
- **Framework**: Next.js 15 with App Router (React 19)
- **Language**: TypeScript (strict mode)
- **Database**: Prisma ORM v5.22.0 + SQLite (dev) → PostgreSQL/MySQL (production)
- **Authentication**: NextAuth.js v4.24.7 (Google OAuth + email/password)
- **Styling**: Tailwind CSS v3.4.15 with custom party theme
- **External APIs**: YouTube Data API v3, youtube-transcript

### Project Structure
```
/thai-app/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (RESTful endpoints)
│   │   ├── auth/[...nextauth]/   # NextAuth authentication handlers
│   │   ├── videos/               # Video CRUD operations
│   │   ├── lyrics/               # Lyrics CRUD operations
│   │   ├── favorites/            # User favorites management
│   │   ├── notifications/        # Admin notifications
│   │   └── youtube/              # YouTube channel monitoring
│   ├── admin/                    # Admin dashboard pages
│   │   └── videos/[id]/edit/     # Video lyrics editor
│   ├── auth/                     # Authentication pages
│   ├── watch/[id]/               # Video player page
│   ├── favorites/                # User favorites page
│   ├── page.tsx                  # Home page
│   └── layout.tsx                # Root layout
├── components/
│   ├── admin/                    # Admin-only components
│   │   ├── AdminDashboard.tsx    # Main admin dashboard
│   │   ├── AddVideoForm.tsx      # Add video form
│   │   ├── VideoList.tsx         # Video management list
│   │   ├── VideoEditor.tsx       # Lyrics editor with drag-drop
│   │   └── NotificationPanel.tsx # New video notifications
│   ├── lyrics/
│   │   └── VideoPlayer.tsx       # Synchronized video player
│   └── Header.tsx                # Global navigation header
├── lib/
│   ├── auth.ts                   # NextAuth configuration
│   ├── prisma.ts                 # Prisma client singleton
│   └── youtube.ts                # YouTube API utilities
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── dev.db                    # SQLite database file
├── scripts/
│   └── setup-admin.ts            # Admin initialization script
└── types/
    └── next-auth.d.ts            # NextAuth type extensions
```

### Database Schema Overview
```
Admin (manages videos)
├── videos (one-to-many)
└── notifications (one-to-many)

User (regular visitors)
└── favorites (one-to-many)

Video (YouTube videos with lyrics)
├── lyrics (one-to-many, cascade delete)
├── favorites (one-to-many, cascade delete)
└── admin (many-to-one)

Lyric (time-synchronized lines)
└── video (many-to-one, cascade delete)

Favorite (user's saved videos)
├── user (many-to-one, cascade delete)
└── video (many-to-one, cascade delete)

ChannelMonitor (YouTube channel tracking)
└── Single instance per channel

Notification (admin alerts for new videos)
└── admin (many-to-one, cascade delete)
```

### Authentication Flow
1. **Admin**: Identified by `ADMIN_EMAIL` environment variable
   - Can use Google OAuth OR email/password credentials
   - Full access to video/lyrics management
2. **Users**: Regular visitors
   - Google OAuth only
   - Can favorite videos, read-only access

### API Architecture
All routes follow RESTful conventions:
- **GET**: Retrieve data
- **POST**: Create new resources
- **PUT**: Update existing resources
- **DELETE**: Remove resources

All API routes protected with `getServerSession(authOptions)` checks.

---

## 3. Every Function in Detail

### Core API Endpoints

#### **Videos API** (`/api/videos`)

**GET /api/videos**
- **Purpose**: List all videos with lyrics
- **Auth**: Required (any authenticated user)
- **Returns**: Array of videos with admin info
- **Query**: Includes related admin data
- **Order**: Most recent first (`publishedAt: 'desc'`)

**POST /api/videos**
- **Purpose**: Create new video entry
- **Auth**: Admin only
- **Body**: `{ youtubeId, title?, description?, thumbnailUrl?, duration?, publishedAt?, channelTitle? }`
- **Process**:
  1. Validate session + admin role
  2. Extract YouTube ID from URL if needed
  3. Fetch metadata from YouTube API if minimal data provided
  4. Create video in database linked to admin
- **Returns**: Created video object

**GET /api/videos/[id]**
- **Purpose**: Get single video with full details
- **Auth**: Required
- **Returns**: Video with lyrics (ordered by `order` ASC) and admin info

**PUT /api/videos/[id]**
- **Purpose**: Update video metadata
- **Auth**: Admin only
- **Body**: `{ title?, description?, thumbnailUrl?, duration?, publishedAt?, channelTitle? }`
- **Process**: Updates video fields, preserves existing lyrics
- **Returns**: Updated video object

**DELETE /api/videos/[id]**
- **Purpose**: Delete video and all related data
- **Auth**: Admin only
- **Process**: Cascade deletes lyrics and favorites automatically
- **Returns**: Success message

---

#### **Lyrics API** (`/api/lyrics`)

**POST /api/lyrics**
- **Purpose**: Add new lyric line to video
- **Auth**: Admin only
- **Body**: `{ videoId, thaiText, translation, startTime, endTime, order }`
- **Process**:
  1. Validate all required fields
  2. Create lyric linked to video
- **Returns**: Created lyric object

**PUT /api/lyrics**
- **Purpose**: Update existing lyric line
- **Auth**: Admin only
- **Body**: `{ id, thaiText?, translation?, startTime?, endTime?, order? }`
- **Process**: Updates specified fields only
- **Returns**: Updated lyric object

**DELETE /api/lyrics?id={id}**
- **Purpose**: Remove lyric line
- **Auth**: Admin only
- **Query Param**: `id` (lyric ID)
- **Returns**: Success message

---

#### **Favorites API** (`/api/favorites`)

**GET /api/favorites**
- **Purpose**: Get current user's favorite videos
- **Auth**: User only (non-admin)
- **Process**:
  1. Find User record by email (creates if doesn't exist)
  2. Query favorites with video details
- **Returns**: Array of favorited videos

**POST /api/favorites**
- **Purpose**: Add video to user's favorites
- **Auth**: User only (non-admin)
- **Body**: `{ videoId }`
- **Process**:
  1. Find/create User record
  2. Create favorite with compound unique constraint (userId + videoId)
- **Returns**: Created favorite object

**DELETE /api/favorites?videoId={id}**
- **Purpose**: Remove video from favorites
- **Auth**: User only (non-admin)
- **Query Param**: `videoId`
- **Process**: Deletes favorite record
- **Returns**: Success message

**GET /api/favorites/check?videoId={id}**
- **Purpose**: Check if video is in user's favorites
- **Auth**: User only (non-admin)
- **Query Param**: `videoId`
- **Returns**: `{ isFavorite: boolean }`

---

#### **Notifications API** (`/api/notifications`)

**POST /api/notifications/[id]/approve**
- **Purpose**: Approve new video notification and import video
- **Auth**: Admin only
- **Process**:
  1. Mark notification as approved
  2. Extract YouTube ID from metadata
  3. Create new video entry
  4. Link to admin account
- **Returns**: Created video object

**POST /api/notifications/[id]/reject**
- **Purpose**: Reject and dismiss notification
- **Auth**: Admin only
- **Process**: Deletes notification record
- **Returns**: Success message

**POST /api/notifications/[id]/read**
- **Purpose**: Mark notification as read
- **Auth**: Admin only
- **Process**: Sets `isRead: true`
- **Returns**: Updated notification

---

#### **YouTube API** (`/api/youtube`)

**POST /api/youtube/check-channel**
- **Purpose**: Check monitored channel for new videos
- **Auth**: Admin only
- **Process**:
  1. Fetch channel monitor record
  2. Query YouTube API for latest video
  3. Compare with `lastVideoId`
  4. Create notification if new video found
  5. Update monitor with new `lastVideoId` and `lastChecked`
- **Returns**: `{ newVideo: boolean, notification?: object }`
- **Quota**: Uses 100 units per check

---

### Key Components

#### **AdminDashboard** (`components/admin/AdminDashboard.tsx`)
- **Purpose**: Main admin control panel
- **Features**:
  - Display video count and recent activity
  - Notification panel integration
  - Navigation to video management
- **State**: Session-based admin check
- **Polling**: Checks for new notifications every 60 seconds

#### **AddVideoForm** (`components/admin/AddVideoForm.tsx`)
- **Purpose**: Form to add new videos
- **Features**:
  - YouTube URL input (auto-extracts ID)
  - Optional metadata override
  - Automatic YouTube API metadata fetch
  - Form validation
- **State**: Form data, loading, error states
- **Submission**: POST to `/api/videos`

#### **VideoList** (`components/admin/VideoList.tsx`)
- **Purpose**: Display and manage all videos
- **Features**:
  - Grid/list view of videos
  - Edit button (links to lyrics editor)
  - Delete button with confirmation
  - Thumbnail display
- **State**: Videos array, loading state
- **Actions**: DELETE `/api/videos/[id]`

#### **VideoEditor** (`components/admin/VideoEditor.tsx`)
- **Purpose**: Edit video metadata and lyrics
- **Features**:
  - Video metadata editing form
  - Lyrics editor with drag-drop reordering
  - Add new lyric lines
  - Edit existing lyrics inline
  - Delete lyric lines
  - Live preview with video player
  - Time input helpers (MM:SS format)
- **State**: Video, lyrics array, edit modes
- **Actions**: PUT `/api/videos/[id]`, POST/PUT/DELETE `/api/lyrics`

#### **NotificationPanel** (`components/admin/NotificationPanel.tsx`)
- **Purpose**: Display and manage new video notifications
- **Features**:
  - Badge counter for unread notifications
  - Dropdown panel with notification list
  - Approve button (imports video)
  - Reject button (dismisses)
  - Mark as read
- **State**: Notifications array, panel open/closed
- **Polling**: Refreshes every 60 seconds
- **Actions**: POST to `/api/notifications/[id]/{approve|reject|read}`

#### **VideoPlayer** (`components/lyrics/VideoPlayer.tsx`)
- **Purpose**: Synchronized video playback with lyrics
- **Features**:
  - YouTube iframe embed
  - Real-time lyric highlighting based on playback time
  - Auto-scroll to active lyric
  - Click lyric to jump to timestamp
  - Thai text + English translation display
- **State**: Current time, active lyric index, player ready
- **Update Rate**: Checks time every 100ms
- **Logic**: Finds lyric where `currentTime >= startTime && currentTime < endTime`

#### **Header** (`components/Header.tsx`)
- **Purpose**: Global navigation and user menu
- **Features**:
  - Logo/home link
  - Admin dashboard link (admin only)
  - Favorites link (users only)
  - User profile dropdown
  - Sign in/out buttons
- **State**: Session data from NextAuth
- **Conditional Rendering**: Based on user role (admin vs user)

---

### Utility Functions

#### **YouTube Utilities** (`lib/youtube.ts`)

**extractYouTubeId(url: string): string | null**
- **Purpose**: Extract video ID from various YouTube URL formats
- **Supports**:
  - `youtube.com/watch?v=ID`
  - `youtu.be/ID`
  - `youtube.com/embed/ID`
  - Direct ID input
- **Returns**: 11-character video ID or null

**fetchYouTubeVideoData(videoId: string): Promise<VideoData>**
- **Purpose**: Fetch video metadata from YouTube API
- **Process**:
  1. Call YouTube Data API v3 videos.list
  2. Parse response for title, description, thumbnail, duration, published date
  3. Convert ISO 8601 duration to seconds
- **Returns**: Video metadata object
- **Error Handling**: Logs errors, throws for API failures

**parseDuration(isoDuration: string): number**
- **Purpose**: Convert ISO 8601 duration to seconds
- **Example**: `PT3M45S` → 225 seconds
- **Regex**: Extracts hours, minutes, seconds
- **Returns**: Total duration in seconds

**checkChannelForNewVideos(): Promise<NewVideoData | null>**
- **Purpose**: Check monitored channel for new uploads
- **Process**:
  1. Query channel's uploads playlist
  2. Get latest video
  3. Compare with stored `lastVideoId`
- **Returns**: New video data or null if no changes
- **Quota**: 100 units per call

---

#### **Prisma Client** (`lib/prisma.ts`)

**prisma (singleton)**
- **Purpose**: Single Prisma client instance across app
- **Pattern**: Prevents multiple connections in dev mode
- **Implementation**: Stores client in `globalThis` during development
- **Production**: Creates new client per deployment

---

#### **Auth Configuration** (`lib/auth.ts`)

**authOptions (NextAuth config)**
- **Providers**:
  1. **Google OAuth**: For both admin and users
  2. **Credentials**: Email/password for admin only
- **Callbacks**:
  - `signIn`: Determines role based on `ADMIN_EMAIL` match
  - `jwt`: Adds `isAdmin` flag to token
  - `session`: Exposes `isAdmin` to client
- **Adapter**: Prisma adapter (uses Admin/User models)
- **Session**: JWT strategy (no database sessions)
- **Pages**: Custom sign-in page at `/auth/signin`

---

### Database Operations

#### **Cascade Delete Behavior**
- **Video deleted** → All lyrics + favorites deleted automatically
- **Admin deleted** → All videos, notifications deleted (chain reaction)
- **User deleted** → All favorites deleted

#### **Query Optimization Patterns**
```typescript
// Always include relations needed
const video = await prisma.video.findUnique({
  where: { id },
  include: {
    lyrics: { orderBy: { order: 'asc' } },
    admin: { select: { name: true, email: true } }
  }
});

// Use select for minimal data
const videos = await prisma.video.findMany({
  select: { id: true, title: true, thumbnailUrl: true },
  orderBy: { publishedAt: 'desc' }
});
```

---

### Environment Configuration

Required variables in `.env.local`:
```bash
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"

# Google OAuth
GOOGLE_CLIENT_ID="<from-google-cloud-console>"
GOOGLE_CLIENT_SECRET="<from-google-cloud-console>"

# Admin
ADMIN_EMAIL="<your-admin-email>"
ADMIN_PASSWORD="<hashed-by-bcrypt>"

# YouTube API
YOUTUBE_API_KEY="<from-google-cloud-console>"
YOUTUBE_CHANNEL_ID="<optional-for-monitoring>"
```

---

### Design System

**Color Palette (Party Theme)**
- `coral: #FF6B6B` - Primary actions
- `salmon: #FFA07A` - Accent
- `teal: #4ECDC4` - Secondary
- `mint: #95E1D3` - Accent
- `gold: #FFD166` - Highlights
- `peach: #FFBE76` - Accent

**Visual Elements**
- Polaroid/scrapbook-style cards with rotation
- Floating lantern decorations (bounce animations)
- Custom `shadow-party` utility class
- Gradient buttons with multiple colors
- Washi tape effects on cards

**Typography**
- Primary: Geist Sans
- Monospace: Geist Mono
- Thai: Noto Sans Thai (loaded globally)

---

## Important Development Notes

### Code Patterns to Follow
1. Always check authentication in API routes before processing
2. Use TypeScript strict mode, avoid `any` types
3. Prefer server components unless interactivity required
4. Include relations in Prisma queries to prevent N+1 problems
5. Log errors comprehensively with context
6. Test with Thai characters to ensure proper rendering

### Security Considerations
- Admin role determined by `ADMIN_EMAIL` match
- Passwords hashed with bcryptjs (10 rounds)
- All API routes protected with session checks
- No sensitive data in client-side code

### YouTube API Quota
- Free tier: 10,000 units/day
- Video list: 100 units per request
- Video details: 1 unit per video
- Monitor usage in Google Cloud Console

### Database Limitations (SQLite in dev)
- Single file database
- No concurrent writes
- Switch to PostgreSQL/MySQL for production

---

**Last Updated**: 2025-11-13
**Project**: Thai Lyrics Website for Josie Tso (@josietso)
**Status**: Active Development
