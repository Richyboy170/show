import { NextResponse } from 'next/server';

/**
 * Health check endpoint to verify environment variables are set
 */
export async function GET() {
  const envCheck = {
    FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
  };

  const missing = Object.entries(envCheck)
    .filter(([key, value]) => value === false || value === 'NOT SET')
    .map(([key]) => key);

  return NextResponse.json({
    status: missing.length === 0 ? 'healthy' : 'missing_env_vars',
    environment: envCheck,
    missing: missing,
    timestamp: new Date().toISOString(),
  });
}
