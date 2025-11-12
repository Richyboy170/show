# CLAUDE.md - Project Preferences & Architecture

## Project Overview

**Name**: Thai Lyrics Website (thai-lyrics-app)
**Purpose**: A personalized lyrics website for Josie Tso's YouTube channel (@josietso), featuring synchronized Thai lyrics with English translations
**Type**: Full-stack Next.js web application with admin dashboard and user features

## Tech Stack

### Core
- **Next.js 15** with App Router (React 19)
- **TypeScript** (strict mode)
- **Node.js** (ES2017 target)

### Database & ORM
- **Prisma ORM** v5.22.0
- **SQLite** (development) - migrate to PostgreSQL/MySQL for production
- Database location: `/prisma/dev.db`

### Authentication
- **NextAuth.js** v4.24.7 with Prisma adapter
- **bcryptjs** for password hashing
- Dual auth: Google OAuth + email/password credentials

### Styling & UI
- **Tailwind CSS** v3.4.15 with custom party theme
- **PostCSS** with autoprefixer
- **Lucide React** for icons
- **Google Fonts**: Noto Sans Thai for Thai language support

### External Services
- **YouTube Data API v3** for video metadata
- **react-youtube** v10.1.0 for embedded playback
- **axios** v1.7.7 for HTTP requests
- **youtube-transcript** v1.2.1 for fetching transcripts

### Development
- **ESLint** with Next.js configuration
- **tsx** for TypeScript script execution
- **Prisma Studio** for database management

## Project Structure

```
/thai-app/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (RESTful)
│   │   ├── auth/[...nextauth]/   # NextAuth handlers
│   │   ├── videos/               # Video CRUD operations
│   │   ├── lyrics/               # Lyrics CRUD operations
│   │   ├── favorites/            # User favorites management
│   │   ├── notifications/        # Admin notifications
│   │   └── youtube/              # YouTube channel monitoring
│   ├── admin/                    # Admin dashboard pages
│   │   └── videos/[id]/edit/     # Video lyrics editor
│   ├── auth/                     # Authentication pages
│   │   ├── signin/               # Sign-in page
│   │   └── error/                # Auth error page
│   ├── watch/[id]/               # Video player page
│   ├── favorites/                # User favorites page
│   ├── page.tsx                  # Home page
│   ├── layout.tsx                # Root layout
│   ├── providers.tsx             # SessionProvider wrapper
│   └── globals.css               # Global styles
├── components/
│   ├── admin/                    # Admin components
│   │   ├── AdminDashboard.tsx    # Main admin dashboard
│   │   ├── AddVideoForm.tsx      # Add video form
│   │   ├── VideoList.tsx         # Video management list
│   │   ├── VideoEditor.tsx       # Lyrics editor
│   │   └── NotificationPanel.tsx # Channel notifications
│   ├── lyrics/
│   │   └── VideoPlayer.tsx       # Synchronized video player
│   └── Header.tsx                # Global header component
├── lib/
│   ├── auth.ts                   # NextAuth configuration
│   ├── prisma.ts                 # Prisma client singleton
│   └── youtube.ts                # YouTube API utilities
├── prisma/
│   └── schema.prisma             # Database schema
├── scripts/
│   └── setup-admin.ts            # Admin setup script
├── types/
│   └── next-auth.d.ts            # NextAuth type extensions
└── Configuration files
```

## Database Schema

### Core Models

**Admin**
- Manages site content and videos
- Fields: id, email, name, googleId, password (hashed), image, timestamps
- Relations: videos (one-to-many), notifications (one-to-many)

**User**
- Regular site visitors (non-admin)
- Fields: id, email, name, image, googleId, timestamps
- Relations: favorites (one-to-many)

**Video**
- YouTube videos with lyrics
- Fields: youtubeId (unique), title, description, thumbnailUrl, publishedAt, duration, channelTitle
- Relations: admin (many-to-one), lyrics (one-to-many), favorites (one-to-many)
- Cascade delete: lyrics and favorites removed when video deleted

**Lyric**
- Time-synchronized lyric lines
- Fields: thaiText, translation, startTime, endTime, order
- Relations: video (many-to-one, cascade delete)
- Ordering: by order field ASC

**Favorite**
- User's favorite videos
- Compound unique constraint: userId + videoId
- Relations: user, video (both with cascade delete)

**ChannelMonitor**
- YouTube channel monitoring configuration
- Fields: channelId (unique), channelHandle, channelTitle, lastChecked, lastVideoId, lastVideoPublishedAt
- Single instance per channel

**Notification**
- Admin notifications for new videos
- Fields: type, title, message, youtubeId, isRead, isApproved, metadata (JSON)
- Relations: admin (many-to-one, cascade delete)

## API Architecture

### RESTful Patterns
All API routes follow REST conventions with proper HTTP methods:

**Videos** (`/api/videos`)
- `GET /api/videos` - List all videos
- `POST /api/videos` - Create video (admin only)
- `GET /api/videos/[id]` - Get single video
- `PUT /api/videos/[id]` - Update video (admin only)
- `DELETE /api/videos/[id]` - Delete video (admin only)

**Lyrics** (`/api/lyrics`)
- `POST /api/lyrics` - Create lyric line
- `PUT /api/lyrics` - Update lyric line
- `DELETE /api/lyrics?id={id}` - Delete lyric line

**Favorites** (`/api/favorites`)
- `GET /api/favorites` - Get user's favorites
- `POST /api/favorites` - Add to favorites
- `DELETE /api/favorites?videoId={id}` - Remove from favorites
- `GET /api/favorites/check?videoId={id}` - Check if favorited

**Notifications** (`/api/notifications`)
- `POST /api/notifications/[id]/approve` - Approve new video notification
- `POST /api/notifications/[id]/reject` - Reject notification
- `POST /api/notifications/[id]/read` - Mark as read

**YouTube** (`/api/youtube`)
- `POST /api/youtube/check-channel` - Check for new videos on monitored channel

### Authentication Strategy
- **Admin Authentication**: Google OAuth OR email/password credentials
- **User Authentication**: Google OAuth only
- **Role Determination**: By email match with `ADMIN_EMAIL` environment variable
- **Session Strategy**: JWT-based (no database sessions)
- **Protection**: All API routes check session with `getServerSession`

## Architectural Patterns

### 1. Server-Side Rendering (SSR)
- Pages use server components by default
- Data fetching with Prisma on server
- Authentication checked server-side
- SEO-friendly content rendering

### 2. Client Components
- Use `'use client'` directive for interactive components
- State management with React hooks (useState, useEffect)
- Real-time updates with polling intervals
- Optimistic UI updates

### 3. Database Access
- **Singleton Pattern**: Single Prisma client instance via `lib/prisma.ts`
- **Cascade Deletes**: Automatic cleanup of related data
- **Eager Loading**: Include relations in queries to prevent N+1 problems
- **Indexing**: Unique constraints on frequently queried fields

### 4. Error Handling
- Comprehensive console logging with context
- Try-catch blocks in all API routes
- User-friendly error messages
- NextResponse with appropriate status codes

### 5. YouTube Integration
- Video ID extraction from multiple URL formats
- ISO 8601 duration parsing
- Channel monitoring with notification system
- API quota management (10,000 units/day)
- Error logging for API failures

## Design System

### Color Palette (Party Theme)
```css
coral: #FF6B6B     /* Primary actions */
salmon: #FFA07A    /* Accent */
teal: #4ECDC4      /* Secondary */
mint: #95E1D3      /* Accent */
gold: #FFD166      /* Highlights */
peach: #FFBE76     /* Accent */
```

### Visual Design Patterns
- **Polaroid/Scrapbook Style**: Rotated cards with borders, washi tape effects
- **Lantern Decorations**: Floating colored circles throughout pages
- **Gradient Buttons**: Multi-color gradients for CTAs
- **Shadow System**: Custom party shadows with colored layers (`shadow-party`)
- **Responsive**: Mobile-first design with Tailwind breakpoints

### Typography
- **Primary**: Geist Sans (system font)
- **Monospace**: Geist Mono
- **Thai Text**: Noto Sans Thai (loaded globally)
- **Headings**: Cursive font for playful feel

### Animations
- Bounce animations with delays for decorative elements
- Pulse for active/loading states
- Smooth transitions: `transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1)`
- Scale transforms on hover

## Development Preferences

### Code Style
- **TypeScript**: Strict mode enabled, explicit types preferred
- **File Naming**: kebab-case for files, PascalCase for React components
- **Path Aliases**: `@/*` maps to project root
- **Formatting**: Consistent indentation, no trailing semicolons in JSX
- **Component Structure**: Props interface at top, component below

### Naming Conventions
- **Components**: PascalCase (e.g., `VideoPlayer.tsx`)
- **Utilities**: camelCase (e.g., `youtube.ts`)
- **API Routes**: kebab-case segments (e.g., `check-channel`)
- **Database Models**: PascalCase singular (e.g., `Video`, `Lyric`)
- **Environment Variables**: SCREAMING_SNAKE_CASE

### Component Patterns
```typescript
// Prefer this structure:
'use client';

import { useState } from 'react';

interface ComponentProps {
  prop1: string;
  prop2: number;
}

export default function ComponentName({ prop1, prop2 }: ComponentProps) {
  const [state, setState] = useState<Type>(initialValue);

  // Event handlers
  const handleEvent = () => {
    // logic
  };

  return (
    // JSX
  );
}
```

### API Route Patterns
```typescript
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Logic here

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error context:', error);
    return NextResponse.json(
      { error: 'Error message' },
      { status: 500 }
    );
  }
}
```

### Database Query Patterns
```typescript
// Prefer including relations inline
const video = await prisma.video.findUnique({
  where: { id },
  include: {
    lyrics: {
      orderBy: { order: 'asc' }
    },
    admin: {
      select: { name: true, email: true }
    }
  }
});

// Use select for performance when not all fields needed
const videos = await prisma.video.findMany({
  select: {
    id: true,
    title: true,
    thumbnailUrl: true
  },
  orderBy: { publishedAt: 'desc' }
});
```

## Key Features

### 1. Synchronized Lyrics Playback
- Real-time lyric highlighting during video playback
- Auto-scroll to active lyric line
- Click lyric to jump to specific timestamp
- Smooth transitions between lyric lines

### 2. Admin Dashboard
- Video management (add, edit, delete)
- Lyrics editor with live preview
- Drag-and-drop lyric reordering
- YouTube channel monitoring
- Notification panel for new videos
- One-click video import from notifications

### 3. YouTube Channel Monitoring
- Automatic detection of new videos on monitored channel
- Notification system for admin approval
- Scheduled checks (can be manual or automated)
- Video metadata pre-fetched for quick import

### 4. User Features
- Favorites system (for non-admin users only)
- Gallery view with all videos
- Individual video watch pages
- Google OAuth sign-in

### 5. Role-Based Access Control
- Admin: Full CRUD on videos and lyrics
- Users: Read-only access, favorites management
- Admin identification by email match

## Environment Variables

```bash
# Database
DATABASE_URL="file:./dev.db"  # SQLite for dev

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"  # Update for production
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="<your-client-id>.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="<your-client-secret>"

# Admin Credentials
ADMIN_EMAIL="<admin-email@example.com>"  # Determines admin role
ADMIN_PASSWORD="<secure-password>"       # For credential auth

# YouTube API (from Google Cloud Console)
YOUTUBE_API_KEY="<your-youtube-api-key>"
YOUTUBE_CHANNEL_ID="<optional-channel-id-for-monitoring>"
```

## Scripts & Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Prisma Studio (localhost:5555)
npm run postinstall      # Generate Prisma client (auto-runs)

# Setup
npm run setup:admin      # Initialize admin user and channel monitor
```

## Deployment Considerations

### Production Checklist
- [ ] Migrate from SQLite to PostgreSQL or MySQL
- [ ] Update `DATABASE_URL` in environment variables
- [ ] Set `NEXTAUTH_URL` to production domain
- [ ] Update Google OAuth redirect URIs in Google Cloud Console
- [ ] Configure secure `NEXTAUTH_SECRET`
- [ ] Set up cron job or scheduled function for YouTube monitoring
- [ ] Enable environment variable protection

### Recommended Platforms
1. **Vercel** (optimal for Next.js)
2. Netlify
3. Railway (includes database)
4. Render
5. AWS Amplify

### Database Migration
```prisma
// Update prisma/schema.prisma datasource:
datasource db {
  provider = "postgresql"  // or "mysql"
  url      = env("DATABASE_URL")
}
```

## Important Notes

### Thai Language Support
- Noto Sans Thai font loaded globally in layout
- Ensure proper character encoding (UTF-8)
- Test Thai text rendering on all browsers

### YouTube API Limitations
- Free tier: 10,000 quota units/day
- Video list API: 100 units per request
- Video details: 1 unit per video
- Monitor quota in Google Cloud Console

### SQLite Limitations
- Single file database
- Not suitable for high concurrency
- No concurrent writes
- Switch to PostgreSQL/MySQL for production

### Security Considerations
- Admin role based on email match (ensure `ADMIN_EMAIL` is secure)
- Passwords hashed with bcryptjs (10 rounds)
- All API routes protected with session checks
- No sensitive data in client-side code
- Image optimization with Next.js Image component

### Performance Optimizations
- Server-side rendering for SEO
- Image optimization with Next.js Image
- YouTube thumbnails cached
- Database queries optimized with indexes
- Prisma query optimization with select/include

## Special Patterns to Follow

1. **Always check authentication** in API routes before processing
2. **Use cascade deletes** to maintain referential integrity
3. **Log errors comprehensively** with context for debugging
4. **Validate user input** before database operations
5. **Handle YouTube API errors gracefully** with fallbacks
6. **Maintain consistent error response format** across API routes
7. **Use TypeScript strict mode** and avoid `any` types
8. **Prefer server components** unless interactivity required
9. **Test with Thai characters** to ensure proper rendering
10. **Keep admin features separate** from user features

## Future Enhancements (Ideas)

- [ ] Add testing suite (Jest/Vitest)
- [ ] Implement search functionality
- [ ] Add lyrics export feature
- [ ] Support multiple languages beyond Thai/English
- [ ] User playlists
- [ ] Comments system
- [ ] Social sharing
- [ ] PWA support for offline access
- [ ] Analytics dashboard for admin

---

**Last Updated**: 2025-11-12
**Project Status**: Active Development
**Target Audience**: Thai music enthusiasts, Josie Tso's YouTube community
