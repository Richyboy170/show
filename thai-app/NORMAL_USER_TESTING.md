# Normal User Testing Guide

## Overview

This document describes the comprehensive TDD test suite created for **normal (non-admin) users** of the Thai Lyrics Application. These tests ensure that regular users can access the site and use its features without admin privileges.

---

## Test Files Created

### 1. **Normal User Authentication Tests**
**File**: `__tests__/normal-user-auth.test.ts`

**What it tests**:
- ✅ Normal users can sign in with Google OAuth
- ✅ Regular `User` accounts are created (not `Admin` accounts)
- ✅ User information is updated on subsequent sign-ins
- ✅ JWT tokens correctly set `isAdmin=false`
- ✅ Sessions correctly reflect non-admin status
- ✅ Password login is rejected for non-admin emails
- ✅ Multiple normal users can be created independently

**Test Count**: 15 tests

**Key Assertions**:
```typescript
expect(result.user.isAdmin).toBe(false)
expect(prisma.user.create).toHaveBeenCalled()
expect(prisma.admin.create).not.toHaveBeenCalled()
```

---

### 2. **Favorites API Tests**
**File**: `__tests__/api/favorites.test.ts`

**What it tests**:
- ✅ Normal users can add favorites
- ✅ Normal users can remove favorites
- ✅ Normal users can view their favorites
- ✅ Normal users can check if a video is favorited
- ✅ Admin users CANNOT use favorites endpoints
- ✅ Unauthenticated users are rejected
- ✅ Proper validation (videoId required, etc.)
- ✅ Already favorited videos are handled correctly

**Test Count**: 18 tests

**Endpoints Tested**:
- `POST /api/favorites` - Add favorite
- `DELETE /api/favorites?videoId=X` - Remove favorite
- `GET /api/favorites` - Get all favorites
- `GET /api/favorites/check?videoId=X` - Check if favorited

---

### 3. **Access Control Tests**
**File**: `__tests__/api/access-control.test.ts`

**What it tests**:
- ✅ Normal users CANNOT create videos
- ✅ Normal users CANNOT update videos
- ✅ Normal users CANNOT delete videos
- ✅ Normal users CANNOT create/edit/delete lyrics
- ✅ Normal users CANNOT approve notifications
- ✅ Admin users CANNOT use favorites endpoints
- ✅ Unauthenticated requests are properly rejected
- ✅ Session validation works correctly
- ✅ Edge cases (null user, undefined isAdmin) are handled

**Test Count**: 17 tests

**Key Protection**: All admin endpoints return `403 Forbidden` for normal users

---

### 4. **UI Component Tests**
**File**: `__tests__/components/normal-user-features.test.tsx`

**What it tests**:
- ✅ Header shows "My Favorites" button for normal users
- ✅ Header does NOT show "Admin Panel" for normal users
- ✅ Header does NOT show "ADMIN" badge for normal users
- ✅ User profile information displays correctly
- ✅ "Music Lover" label appears for normal users
- ✅ Favorites page redirects unauthenticated users
- ✅ Favorites page redirects admin users to admin panel
- ✅ Favorites page fetches and displays user favorites
- ✅ Empty state shown when no favorites exist
- ✅ Loading states work correctly

**Test Count**: 15 tests

**UI Differences**:
- **Normal User**: "My Favorites" button, "Music Lover" label
- **Admin User**: "Admin Panel" button, "ADMIN" badge
- **Unauthenticated**: "Sign In" button only

---

## Running the Tests

### Run All Tests
```bash
cd thai-app
npm test
```

### Run Specific Test Suites
```bash
# Normal user authentication tests
npm test normal-user-auth.test.ts

# Favorites API tests
npm test favorites.test.ts

# Access control tests
npm test access-control.test.ts

# UI component tests
npm test normal-user-features.test.tsx
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

---

## What Normal Users CAN Do

✅ **Authentication**
- Sign in with Google OAuth
- Create user account automatically
- Update profile on subsequent logins

✅ **Browse Content**
- View all videos on homepage (public)
- Watch videos with synchronized lyrics (public)
- See video thumbnails, titles, descriptions

✅ **Favorites**
- Add videos to favorites (heart icon)
- Remove videos from favorites
- View all favorited videos on `/favorites` page
- See heart icon fill when video is favorited

✅ **Navigation**
- Access home page (`/`)
- Access watch page (`/watch/[id]`)
- Access favorites page (`/favorites`)
- Sign out

---

## What Normal Users CANNOT Do

❌ **Admin Features**
- Access admin panel (`/admin`)
- Create new videos
- Edit existing videos
- Delete videos
- Create lyrics
- Edit lyrics
- Delete lyrics
- Approve/reject notifications
- Access YouTube channel monitoring

❌ **Privilege Escalation**
- Cannot promote themselves to admin
- Cannot access admin API endpoints
- Cannot view admin-only UI elements

---

## Test Coverage Summary

| Category | Tests | Status |
|----------|-------|--------|
| Normal User Authentication | 15 | ✅ Created |
| Favorites API | 18 | ✅ Created |
| Access Control | 17 | ✅ Created |
| UI Components | 15 | ✅ Created |
| **TOTAL** | **65** | **✅ Complete** |

---

## Key Security Features Tested

### 1. **Role Separation**
```typescript
// Normal users get isAdmin=false
token.isAdmin = isAdminEmail(user.email) // false for normal users

// Admin endpoints check this flag
if (!session.user?.isAdmin) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}
```

### 2. **Database Isolation**
```typescript
// Normal users go to User table
await prisma.user.create({ ... })

// Admins go to Admin table
await prisma.admin.create({ ... })
```

### 3. **Favorites Restriction**
```typescript
// Explicitly reject admins from favorites
if (!session || session.user.isAdmin) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

### 4. **UI Conditional Rendering**
```tsx
{/* Show only for normal users */}
{!session.user.isAdmin && (
  <Link href="/favorites">My Favorites</Link>
)}

{/* Show only for admins */}
{session.user.isAdmin && (
  <Link href="/admin">Admin Panel</Link>
)}
```

---

## Manual Testing Checklist

Use this checklist to manually verify normal user functionality:

### Sign-In Flow
- [ ] Visit `/auth/signin`
- [ ] Click "Continue with Google"
- [ ] Sign in with non-admin Google account
- [ ] Redirected to home page
- [ ] See "My Favorites" button in header
- [ ] Do NOT see "Admin Panel" button
- [ ] Do NOT see "ADMIN" badge

### Browse Videos
- [ ] See all videos on homepage
- [ ] Click on a video
- [ ] Video player loads correctly
- [ ] Lyrics display correctly
- [ ] Can click lyrics to jump to timestamp

### Favorites
- [ ] Click heart icon on video page
- [ ] Heart fills with color
- [ ] Click "My Favorites" button
- [ ] See the favorited video
- [ ] Click heart again to unfavorite
- [ ] Video removed from favorites page

### Access Restrictions
- [ ] Try to access `/admin` directly
- [ ] Should redirect to home page
- [ ] Try to access `/admin/videos/xyz/edit`
- [ ] Should redirect to home page

### Sign Out
- [ ] Click "Sign Out" button
- [ ] Redirected to home page
- [ ] Only see "Sign In" button
- [ ] Cannot access `/favorites` (redirects to sign-in)

---

## Debugging Failed Tests

If tests fail, check these common issues:

### 1. **Prisma Client Not Generated**
```bash
npx prisma generate
```

### 2. **Environment Variables Missing**
```bash
# Check .env file has:
ADMIN_EMAILS="admin@test.com"
NEXTAUTH_SECRET="your-secret"
```

### 3. **Mock Issues**
- Clear Jest cache: `npm test -- --clearCache`
- Check mock implementations match actual code

### 4. **Import Errors**
- Verify path aliases in `tsconfig.json`
- Check `jest.config.js` has correct module mappings

---

## Test Maintenance

### When Adding New Features

1. **New API Endpoint**: Add tests to `__tests__/api/`
2. **New UI Component**: Add tests to `__tests__/components/`
3. **New Authentication Flow**: Update `normal-user-auth.test.ts`
4. **New Access Rules**: Update `access-control.test.ts`

### Test Naming Convention

```typescript
describe('Feature Name', () => {
  describe('Specific Functionality', () => {
    it('should do something specific', async () => {
      // Test implementation
    })
  })
})
```

---

## Expected Test Output

When all tests pass, you should see:

```
PASS  __tests__/normal-user-auth.test.ts
  Normal User Authentication
    Google OAuth Sign-In for Normal Users
      ✓ should create a regular user account for non-admin email (5ms)
      ✓ should update existing user on subsequent sign-ins (3ms)
      ✓ should NOT create an admin account for normal user (2ms)
    JWT Token for Normal Users
      ✓ should set isAdmin=false for normal user email (2ms)
      ✓ should maintain isAdmin=false on token refresh (3ms)
    ... (15 tests total)

PASS  __tests__/api/favorites.test.ts
  Favorites API - Normal User Access
    POST /api/favorites - Add Favorite
      ✓ should allow normal user to add a favorite (8ms)
      ✓ should reject admin user from adding favorites (4ms)
    ... (18 tests total)

PASS  __tests__/api/access-control.test.ts
  Access Control - Normal Users
    Video API - Admin Only
      ✓ should reject normal user from creating videos (6ms)
      ✓ should reject normal user from updating videos (4ms)
    ... (17 tests total)

PASS  __tests__/components/normal-user-features.test.tsx
  Normal User UI Features
    Header Component - Normal User View
      ✓ should show My Favorites button for normal users (12ms)
      ✓ should display user profile information correctly (8ms)
    ... (15 tests total)

Test Suites: 4 passed, 4 total
Tests:       65 passed, 65 total
Snapshots:   0 total
Time:        4.523 s
```

---

## Troubleshooting Authentication Issues

If normal users cannot access the site:

### 1. Check Environment Variables
```bash
# In thai-app/.env
ADMIN_EMAILS="admin1@example.com,admin2@example.com"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
```

### 2. Verify Database Schema
```bash
npx prisma db push
npx prisma generate
```

### 3. Check Admin Email List
```typescript
// lib/admin-utils.ts
export function getAdminEmails(): string[] {
  const emails = process.env.ADMIN_EMAILS
    .split(',')
    .map(email => email.trim())
  console.log('Admin emails:', emails) // Debug output
  return emails
}
```

### 4. Test isAdminEmail Function
```bash
# In Node.js REPL or test file
const { isAdminEmail } = require('./lib/admin-utils')
console.log(isAdminEmail('normaluser@gmail.com')) // Should be false
console.log(isAdminEmail('admin@test.com')) // Should be true if in ADMIN_EMAILS
```

### 5. Inspect Session in Browser
```javascript
// In browser console on the site
console.log(await fetch('/api/auth/session').then(r => r.json()))
// Should show: { user: { ..., isAdmin: false } }
```

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Run all tests: `npm test`
- [ ] All 65 tests pass
- [ ] Environment variables set on hosting platform
- [ ] Google OAuth redirect URLs updated for production domain
- [ ] Database migrated to PostgreSQL/MySQL
- [ ] `ADMIN_EMAILS` contains only authorized emails
- [ ] `NEXTAUTH_SECRET` is strong and unique
- [ ] Test normal user sign-in on production
- [ ] Test admin user cannot see normal user favorites
- [ ] Test normal user cannot access `/admin` routes

---

## Success Criteria

Your normal user system is working correctly when:

✅ Any user with a Google account can sign in
✅ Non-admin emails create `User` records (not `Admin`)
✅ Normal users see "My Favorites" button
✅ Normal users do NOT see "Admin Panel" button
✅ Normal users can add/remove favorites
✅ Normal users can view their favorites page
✅ Normal users get `403 Forbidden` when accessing admin APIs
✅ Normal users get redirected from `/admin` pages
✅ All 65 tests pass

---

## Additional Resources

- **Authentication Flow**: See `lib/auth.ts`
- **Admin Utils**: See `lib/admin-utils.ts`
- **API Routes**: See `app/api/` directory
- **UI Components**: See `components/` directory
- **Prisma Schema**: See `prisma/schema.prisma`

---

## Support

If you encounter issues:

1. Check this testing guide first
2. Run the test suite to identify failures
3. Review the test output for specific errors
4. Check environment variables and database setup
5. Verify Google OAuth configuration

---

**Last Updated**: 2025-11-12
**Test Coverage**: 65 tests covering authentication, API access, and UI components
**Status**: ✅ All test files created and ready to run
