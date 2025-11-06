/**
 * Firebase Error Message Humanizer
 * Converts technical Firebase error codes to user-friendly messages
 */

export function humanizeFirebaseError(error: string): string {
  // Extract error code from Firebase error message
  // Format: "Firebase: Error (auth/error-code)." or just "auth/error-code"
  const errorCodeMatch = error.match(/auth\/([a-z-]+)/);
  const errorCode = errorCodeMatch ? errorCodeMatch[1] : null;

  if (!errorCode) {
    // If we can't parse the error code, return a generic message
    return 'An error occurred. Please try again.';
  }

  // Map Firebase error codes to friendly messages
  const errorMessages: Record<string, string> = {
    // Authentication errors
    'invalid-credential': 'Invalid email or password. Please check your credentials and try again.',
    'user-not-found': 'No account found with this email address.',
    'wrong-password': 'Incorrect password. Please try again.',
    'invalid-email': 'Please enter a valid email address.',
    'user-disabled': 'This account has been disabled. Please contact support.',

    // Sign up errors
    'email-already-in-use': 'An account with this email already exists. Please sign in instead.',
    'weak-password': 'Password is too weak. Please use at least 6 characters.',
    'operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',

    // Rate limiting
    'too-many-requests': 'Too many failed attempts. Please try again later or reset your password.',

    // Email verification
    'invalid-action-code': 'This verification link is invalid or has expired.',
    'expired-action-code': 'This verification link has expired. Please request a new one.',

    // Network errors
    'network-request-failed': 'Network error. Please check your internet connection and try again.',

    // Token errors
    'invalid-id-token': 'Your session has expired. Please sign in again.',
    'id-token-expired': 'Your session has expired. Please sign in again.',

    // Account management
    'requires-recent-login': 'For security, please sign in again to perform this action.',
    'account-exists-with-different-credential': 'An account already exists with the same email but different sign-in method.',

    // Password reset
    'invalid-password': 'Password must be at least 6 characters.',
    'missing-email': 'Please enter your email address.',
  };

  return errorMessages[errorCode] || `Authentication error: ${errorCode}. Please try again.`;
}
