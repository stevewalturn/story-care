# Authentication

## Overview

StoryCare uses Google Identity Platform (Firebase Auth) for authentication, with a custom role system stored in the PostgreSQL database. The system supports email/password authentication, invitation-based onboarding, session cookie management, and HIPAA-compliant security headers applied via Next.js middleware.

> **Note:** User roles are fetched from the database, **not** from Firebase custom claims. The `verifyIdToken()` function in `FirebaseAdmin.ts` always queries the `users` table for role information.

## User Roles

| Role | Access Level |
|------|-------------|
| Super Admin | Platform-wide access; manages all organizations |
| Org Admin | Manages users and settings within their organization |
| Therapist | Creates sessions, generates media, manages patients |
| Patient | Views story pages, submits reflections and surveys |

## User Workflow

### Sign-In Flow
1. User navigates to `/sign-in`.
2. User enters email and password.
3. Client calls `signInWithEmailAndPassword` via Firebase JS SDK.
4. On success, `AuthContext` fires `onAuthStateChanged` callback.
5. Client obtains Firebase ID token and sends it to `POST /api/auth/session`.
6. Server verifies token, checks user in database (blocks deleted/inactive/pending/rejected users), sets an `httpOnly` session cookie (24-hour max age).
7. Client fetches database profile from `GET /api/auth/me`.
8. User is redirected to `/dashboard`.

### Invitation / Sign-Up Flow
1. Admin creates a user record in the database with `status: 'invited'` and an invitation token.
2. Invited user receives an email with a setup link containing the token.
3. User navigates to `/setup-account?token=...`.
4. Client calls `POST /api/auth/validate-invitation-token` to verify the token.
5. User creates a Firebase account via `createUserWithEmailAndPassword`.
6. Client calls `POST /api/auth/link-firebase-uid` to link the Firebase UID to the database user and set `status: 'active'`.
7. Invitation token is cleared from the database after successful activation.

### Password Reset Flow
1. User submits email to `POST /api/auth/forgot-password`.
2. Server generates a reset token (1-hour expiry) and sends a HIPAA-compliant email via Paubox.
3. User clicks the reset link and navigates to `/reset-password?token=...`.
4. User submits new password to `POST /api/auth/reset-password`.
5. Server validates token, updates password in Firebase Admin SDK, and clears the token.

### Session Management
- Firebase ID tokens are refreshed every 50 minutes (before the 1-hour expiry).
- Session cookies are `httpOnly`, `secure` in production, `sameSite: lax`, and expire after 24 hours.
- An idle timeout of 6 hours triggers automatic sign-out.
- User activity (mouse, keyboard, scroll, touch, click) resets the idle timer.

## UI Pages

| Page | Path | Description |
|------|------|-------------|
| Sign In | `/sign-in` | Email/password login form |
| Setup Account | `/setup-account` | Invitation-based account creation |
| Reset Password | `/reset-password` | Password reset form |
| Dashboard | `/dashboard` | Post-login landing page (protected) |

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth/session` | Set session cookie from Firebase ID token | Firebase token |
| DELETE | `/api/auth/session` | Clear session cookie (sign out) | None |
| GET | `/api/auth/me` | Get current user profile from database | Bearer token |
| GET | `/api/auth/check-invitation` | Check invitation status by email | None |
| POST | `/api/auth/validate-invitation-token` | Validate invitation token and return user details | None |
| POST | `/api/auth/link-firebase-uid` | Link Firebase UID to invited user, activate account | Bearer token |
| POST | `/api/auth/rollback-firebase-account` | Delete Firebase account on failed linking (error recovery) | Bearer token |
| POST | `/api/auth/forgot-password` | Generate password reset token and send email | None (rate-limited) |
| POST | `/api/auth/reset-password` | Reset password using token | None (rate-limited) |

## Database Tables

| Table | Role in Feature |
|-------|----------------|
| `users` | Stores `firebaseUid`, `email`, `role`, `status`, `organizationId`, `invitationToken`, `invitationTokenExpiresAt`, `passwordResetToken`, `passwordResetTokenExpiresAt`, `lastLoginAt` |
| `audit_logs` | Records authentication events for HIPAA compliance |

## Key Files

| File | Purpose |
|------|---------|
| `src/libs/Firebase.ts` | Client-side Firebase SDK initialization; exports `signIn`, `signUp`, `logOut`, `onAuthChange` |
| `src/libs/FirebaseAdmin.ts` | Server-side Firebase Admin SDK; `verifyIdToken()` validates token and fetches role from database; auto-activates invited users |
| `src/middleware.ts` | Protects routes by verifying session cookies; applies HIPAA security headers (CSP, HSTS, X-Frame-Options, etc.) |
| `src/contexts/AuthContext.tsx` | React context provider managing `user` (Firebase) and `dbUser` (database) state; handles idle timeout and token refresh |
| `src/utils/AuthHelpers.ts` | `requireAuth`, `requireRole`, `requireTherapist`, `requireAdmin` helpers for API routes; HIPAA-compliant access control |
| `src/app/api/auth/session/route.ts` | Session cookie management (set/delete); updates `lastLoginAt`; links invited users on first login |
| `src/app/api/auth/me/route.ts` | Returns authenticated user profile with presigned avatar URL |
| `src/app/api/auth/link-firebase-uid/route.ts` | Links Firebase UID to database user during invitation flow; supports token-based and email-based lookup |
| `src/app/api/auth/forgot-password/route.ts` | Generates reset token, sends email via Paubox; rate-limited; prevents email enumeration |
| `src/app/api/auth/reset-password/route.ts` | Validates reset token, updates password via Firebase Admin SDK; rate-limited |
| `src/utils/InvitationTokens.ts` | Token generation and expiry checking utilities |
| `src/utils/RateLimiter.ts` | In-memory rate limiting for auth endpoints |

## Technical Notes

- **Token verification flow**: `verifyIdToken()` first verifies the Firebase ID token, then queries the `users` table by `firebaseUid`. If not found, it falls back to email lookup for invited users without a linked UID, automatically linking and activating them.
- **Status blocking**: Users with `pending_approval`, `rejected`, `inactive`, or soft-deleted (`deletedAt`) status are blocked at the token verification level.
- **Middleware matcher**: The middleware skips `/_next`, `/_vercel`, `monitoring`, API upload routes (to avoid body consumption issues), and static files. API routes handle their own authentication.
- **HIPAA security headers**: All responses include CSP, HSTS (1 year with preload), X-Frame-Options DENY, X-Content-Type-Options nosniff, Permissions-Policy, and strict Referrer-Policy.
- **Rate limiting**: Forgot-password and reset-password endpoints use per-IP rate limiting to prevent brute-force attacks.
- **Rollback mechanism**: If Firebase account creation succeeds but database linking fails, the `/api/auth/rollback-firebase-account` endpoint deletes the orphaned Firebase account.
