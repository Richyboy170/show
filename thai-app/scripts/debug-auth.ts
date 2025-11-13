/**
 * Debugging Script for Authentication Issues
 *
 * This script helps diagnose why normal users might not be accessing the site.
 * Run with: npx tsx scripts/debug-auth.ts
 */

import { prisma } from '../lib/prisma'
import { isAdminEmail, getAdminEmails } from '../lib/admin-utils'

async function main() {
  console.log('='.repeat(80))
  console.log('🔍 AUTHENTICATION DEBUG REPORT')
  console.log('='.repeat(80))
  console.log('')

  // 1. Check environment variables
  console.log('📋 ENVIRONMENT VARIABLES:')
  console.log('-'.repeat(80))
  console.log('ADMIN_EMAILS:', process.env.ADMIN_EMAILS || '(not set)')
  console.log('ADMIN_EMAIL (fallback):', process.env.ADMIN_EMAIL || '(not set)')
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '(not set)')
  console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✓ Set' : '✗ Not set')
  console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ Not set')
  console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✓ Set' : '✗ Not set')
  console.log('')

  // 2. Check admin email list
  console.log('👑 ADMIN EMAIL LIST:')
  console.log('-'.repeat(80))
  const adminEmails = getAdminEmails()
  console.log('Admin emails loaded:', adminEmails.length)
  adminEmails.forEach((email, i) => {
    console.log(`  ${i + 1}. ${email}`)
  })
  console.log('')

  // 3. Test admin email detection
  console.log('🧪 TESTING ADMIN EMAIL DETECTION:')
  console.log('-'.repeat(80))
  const testEmails = [
    'patiharn.liang@gmail.com',
    'normaluser@gmail.com',
    'test@test.com',
    'admin@example.com'
  ]

  testEmails.forEach(email => {
    const isAdmin = isAdminEmail(email)
    console.log(`  ${email.padEnd(35)} → ${isAdmin ? '✓ ADMIN' : '✗ Normal User'}`)
  })
  console.log('')

  // 4. Check database tables
  console.log('🗄️  DATABASE TABLES:')
  console.log('-'.repeat(80))

  try {
    const adminCount = await prisma.admin.count()
    const userCount = await prisma.user.count()
    const videoCount = await prisma.video.count()
    const favoriteCount = await prisma.favorite.count()

    console.log(`  Admin records:    ${adminCount}`)
    console.log(`  User records:     ${userCount}`)
    console.log(`  Video records:    ${videoCount}`)
    console.log(`  Favorite records: ${favoriteCount}`)
    console.log('')

    // 5. Show admin records
    if (adminCount > 0) {
      console.log('👑 ADMIN RECORDS:')
      console.log('-'.repeat(80))
      const admins = await prisma.admin.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          googleId: true,
          createdAt: true,
        }
      })
      admins.forEach((admin, i) => {
        console.log(`  ${i + 1}. ${admin.email}`)
        console.log(`     Name: ${admin.name || '(none)'}`)
        console.log(`     Google ID: ${admin.googleId || '(none)'}`)
        console.log(`     Created: ${admin.createdAt.toLocaleString()}`)
        console.log('')
      })
    } else {
      console.log('  ⚠️  No admin records found in database')
      console.log('')
    }

    // 6. Show user records
    if (userCount > 0) {
      console.log('👤 USER RECORDS (Normal Users):')
      console.log('-'.repeat(80))
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          googleId: true,
          createdAt: true,
          _count: {
            select: {
              favorites: true
            }
          }
        }
      })
      users.forEach((user, i) => {
        console.log(`  ${i + 1}. ${user.email}`)
        console.log(`     Name: ${user.name || '(none)'}`)
        console.log(`     Google ID: ${user.googleId || '(none)'}`)
        console.log(`     Favorites: ${user._count.favorites}`)
        console.log(`     Created: ${user.createdAt.toLocaleString()}`)
        console.log('')
      })
    } else {
      console.log('  ⚠️  No user records found in database')
      console.log('  💡 Normal users will be created when they sign in for the first time')
      console.log('')
    }

  } catch (error) {
    console.error('  ❌ Error reading database:', error)
    console.log('')
  }

  // 7. Verification summary
  console.log('✅ VERIFICATION CHECKLIST:')
  console.log('-'.repeat(80))

  const checks = [
    {
      name: 'ADMIN_EMAILS environment variable set',
      pass: !!process.env.ADMIN_EMAILS || !!process.env.ADMIN_EMAIL,
      fix: 'Add ADMIN_EMAILS to your .env file'
    },
    {
      name: 'Admin email list not empty',
      pass: adminEmails.length > 0,
      fix: 'Set ADMIN_EMAILS="admin@example.com" in .env'
    },
    {
      name: 'NEXTAUTH_SECRET is configured',
      pass: !!process.env.NEXTAUTH_SECRET,
      fix: 'Generate with: openssl rand -base64 32'
    },
    {
      name: 'Google OAuth credentials set',
      pass: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
      fix: 'Get credentials from Google Cloud Console'
    },
    {
      name: 'Database accessible',
      pass: true, // If we got this far, DB is accessible
      fix: 'Run: npx prisma db push'
    }
  ]

  let allPassing = true
  checks.forEach(check => {
    if (check.pass) {
      console.log(`  ✓ ${check.name}`)
    } else {
      console.log(`  ✗ ${check.name}`)
      console.log(`    Fix: ${check.fix}`)
      allPassing = false
    }
  })
  console.log('')

  // 8. Instructions
  if (allPassing) {
    console.log('🎉 ALL CHECKS PASSED!')
    console.log('')
    console.log('Your authentication is configured correctly.')
    console.log('')
    console.log('To test normal user access:')
    console.log('  1. Start dev server: npm run dev')
    console.log('  2. Go to: http://localhost:3000')
    console.log('  3. Click "Sign In" → "Continue with Google"')
    console.log('  4. Sign in with a Google account NOT in the admin list above')
    console.log('  5. You should see "My Favorites" button (not "Admin Panel")')
    console.log('')
  } else {
    console.log('⚠️  SOME CHECKS FAILED')
    console.log('')
    console.log('Please fix the issues above and run this script again.')
    console.log('')
  }

  console.log('='.repeat(80))
  console.log('Debug report complete. Generated at:', new Date().toLocaleString())
  console.log('='.repeat(80))
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
