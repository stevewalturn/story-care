/**
 * Invitation Token Utilities
 * Secure token generation and validation for user invitations
 */

import { randomBytes } from 'node:crypto';

/**
 * Generate a cryptographically secure invitation token
 * @returns A 64-character hex string token
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString('hex'); // 64-char secure token
}

/**
 * Calculate token expiration date
 * @param days - Number of days until expiration (default: 7)
 * @returns Date object for the expiration time
 */
export function calculateExpirationDate(days: number = 7): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Check if a token has expired
 * @param expiresAt - The expiration timestamp
 * @returns True if the token has expired
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
}

/**
 * Format expiry date for display in emails
 * @param expiresAt - The expiration timestamp
 * @returns Human-readable date string
 */
export function formatExpiryForEmail(expiresAt: Date): string {
  return expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
