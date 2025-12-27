/**
 * Utility functions for admin management
 */

/**
 * Get list of admin emails from environment variable
 * Supports comma-separated list
 */
export function getAdminEmails(): string[] {
  const adminEmailsEnv = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '';

  // Split by comma and trim whitespace
  const emails = adminEmailsEnv
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0);

  return emails;
}

/**
 * Check if an email belongs to an admin
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;

  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.toLowerCase());
}
