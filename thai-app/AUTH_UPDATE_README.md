## 📋 How to Use

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Before Starting Development

**IMPORTANT**: You must regenerate the Prisma client after stopping the dev server:

```bash
# 1. Stop the dev server (Ctrl+C)

# 2. Regenerate Prisma client
npx prisma generate

# 3. Restart dev server
npm run dev
```

### Testing the Authentication Flow Manually

1. **Test Regular User Sign-In**:
   - Go to http://localhost:3000
   - Click "Sign In"
   - Choose "Continue with Google"
   - Sign in with any Google account (not the admin email)
   - Should redirect to home page
   - Should see "My Favorites" button in header
   - Should see your Google profile

2. **Test Admin Sign-In**:
   - Go to http://localhost:3000
   - Click "Sign In"
   - Choose "Continue with Google"
   - Sign in with the ADMIN_EMAIL Google account
   - Should redirect to home page
   - Should see "Admin Panel" button in header
   - Should see "ADMIN" badge

3. **Test Admin Credentials Sign-In**:
   - Go to http://localhost:3000/auth/signin
   - Enter admin email: `patiharn.liang@gmail.com`
   - Enter admin password: `thisisforyoulovelovemuah`
   - Click "Sign In 🎵"
   - Should redirect to home page with admin access

4. **Test Favorites Feature** (Regular Users Only):
   - Sign in as regular user
   - Navigate to any video
   - Click the heart icon to like it
   - Go to "My Favorites"
   - Should see the liked video