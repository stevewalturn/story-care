# Authentication API Reference

## Overview

The Authentication API handles user identity, session management, password reset, and invitation-based onboarding. StoryCare uses Google Identity Platform (Firebase Auth) for authentication, with a custom database role system. All auth endpoints are located under `/api/auth/`.

## Authentication

Most auth endpoints are public (login, password reset, invitation validation). Endpoints that return user data (e.g., `/api/auth/me`) require a valid Firebase ID token in the `Authorization` header:

```
Authorization: Bearer <firebase-id-token>
```

## Endpoints

---

### `GET /api/auth/check-invitation`

**Description**: Check if an email has a pending invitation. Used during sign-up to determine if a user should go through the invitation flow.

**Auth**: None required

**Request** (query params):
```
GET /api/auth/check-invitation?email=user@example.com
```

| Param   | Type   | Required | Description              |
|---------|--------|----------|--------------------------|
| `email` | string | Yes      | Email address to check   |

**Response** (200 - pending invitation):
```json
{
  "status": "pending",
  "role": "therapist",
  "name": "Jane Doe"
}
```

**Response** (200 - already activated):
```json
{
  "status": "already_activated"
}
```

**Response** (200 - not found):
```json
{
  "status": "not_found"
}
```

---

### `POST /api/auth/session`

**Description**: Create a session cookie for the authenticated user. The cookie has a 24-hour expiration (HIPAA compliance). Used after Firebase client-side authentication to establish a server-side session.

**Auth**: Firebase ID token required

**Request**:
```json
{
  "idToken": "firebase-id-token-string"
}
```

**Response** (200):
```json
{
  "status": "success"
}
```

Sets an HTTP-only `session` cookie with 24-hour expiration and `SameSite=Lax`.

**Error** (401):
```json
{
  "error": "Unauthorized"
}
```

---

### `DELETE /api/auth/session`

**Description**: Remove the session cookie (logout).

**Auth**: None required (clears existing cookie)

**Response** (200):
```json
{
  "status": "success"
}
```

---

### `GET /api/auth/me`

**Description**: Get the current authenticated user's profile, including role, organization, and signed avatar URL.

**Auth**: Firebase ID token required (any role)

**Response** (200):
```json
{
  "user": {
    "id": "uuid",
    "firebaseUid": "firebase-uid",
    "email": "user@example.com",
    "name": "Jane Doe",
    "role": "therapist",
    "organizationId": "uuid",
    "avatarUrl": "https://signed-gcs-url...",
    "referenceImageUrl": "https://signed-gcs-url...",
    "status": "active",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Error** (401):
```json
{
  "error": "Unauthorized"
}
```

---

### `POST /api/auth/forgot-password`

**Description**: Initiate password reset flow. Generates a reset token, stores it in the database with a 1-hour expiry, and sends a reset email via Paubox (HIPAA-compliant). Always returns a generic success message to prevent email enumeration. Deleted or inactive users receive an explicit error.

**Auth**: None required

**Rate Limit**: Yes (per IP)

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200 - always, unless rate limited or deleted user):
```json
{
  "message": "If an account exists with that email, a password reset link has been sent."
}
```

**Error** (403 - deleted/inactive user):
```json
{
  "error": "This account has been removed. Please contact your administrator."
}
```

**Error** (429 - rate limited):
```json
{
  "error": "Too many requests. Please try again later."
}
```

---

### `POST /api/auth/reset-password`

**Description**: Reset a user's password using a valid reset token. Updates the password in Firebase and clears the token from the database.

**Auth**: None required (token-based)

**Request**:
```json
{
  "token": "reset-token-string",
  "newPassword": "NewSecurePassword123!"
}
```

**Response** (200):
```json
{
  "message": "Password has been reset successfully."
}
```

**Error** (400):
```json
{
  "error": "Invalid or expired reset token"
}
```

---

### `POST /api/auth/validate-invitation-token`

**Description**: Validate an invitation token and return the associated user details. Used during the sign-up flow for invited users.

**Auth**: None required (token-based)

**Request**:
```json
{
  "token": "invitation-token-string"
}
```

**Response** (200):
```json
{
  "valid": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jane Doe",
    "role": "therapist"
  }
}
```

**Error** (400):
```json
{
  "error": "Invalid or expired invitation token"
}
```

---

### `POST /api/auth/link-firebase-uid`

**Description**: Link a Firebase UID to an invited user record. Called after the user completes Firebase account creation to bind the Firebase identity to the database user. Also activates the user account.

**Auth**: None required (token-based)

**Request**:
```json
{
  "token": "invitation-token-string",
  "firebaseUid": "firebase-uid-string"
}
```

**Response** (200):
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jane Doe",
    "role": "therapist"
  }
}
```

**Error** (400):
```json
{
  "error": "Invalid or expired invitation token"
}
```

---

### `POST /api/auth/rollback-firebase-account`

**Description**: Delete a Firebase account as part of error recovery. Used when the sign-up flow fails after Firebase account creation but before database linking completes.

**Auth**: None required

**Request**:
```json
{
  "firebaseUid": "firebase-uid-to-delete"
}
```

**Response** (200):
```json
{
  "success": true
}
```

---

### `POST /api/auth/debug-log-credentials`

**Description**: Debug endpoint that logs credentials when the `debug_credential_logging` feature toggle is enabled. Returns a no-op response when the toggle is disabled.

**Auth**: None required

**Feature Toggle**: `debug_credential_logging` must be enabled

**Request**:
```json
{
  "email": "user@example.com",
  "password": "user-password",
  "flow": "sign-in"
}
```

**Response** (200):
```json
{
  "ok": true
}
```

## Error Codes

| Status | Description                              |
|--------|------------------------------------------|
| 400    | Invalid request body or parameters       |
| 401    | Missing or invalid authentication token  |
| 403    | Account removed or inactive              |
| 429    | Rate limit exceeded                      |
| 500    | Internal server error                    |
