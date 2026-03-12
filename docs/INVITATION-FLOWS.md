# StoryCare — Invitation & Account Setup Flows

> How users are invited to the platform and how they activate their accounts.

---

## User Roles

```
Super Admin
  └── invites → Org Admin
                  └── invites → Therapist
                                  └── invites → Patient
```

| Role | Invited by | Setup method |
|---|---|---|
| Org Admin | Super Admin | Email (token link) |
| Therapist | Org Admin | Email (token link) or Phone (OTP) |
| Patient | Therapist | Email (token link) or Phone (OTP) |

---

## Flow 1 — Email / Token Setup

Used when the user is invited **with an email address** and receives a setup link.

```mermaid
sequenceDiagram
    actor Admin
    actor User
    participant DB
    participant Email as Paubox Email
    participant Web as StoryCare Web
    participant Firebase

    Admin->>DB: Create user record (status=invited, token=xyz)
    Admin->>Email: Send invitation email with link
    Email-->>User: /setup-account?token=xyz

    User->>Web: Open setup link
    Web->>DB: GET /api/auth/check-invitation?token=xyz
    DB-->>Web: Return name, email, role, org

    User->>Web: Enter password & submit
    Web->>Firebase: createUserWithEmailAndPassword(email, password)
    Firebase-->>Web: Firebase User + ID token

    Web->>DB: POST /api/auth/link-firebase-uid { token, email }
    DB->>DB: Validate token, match email
    DB->>DB: Set firebaseUid, status=active, clear token
    DB->>Firebase: Mark emailVerified=true
    DB-->>Web: { success: true }

    Web->>User: Redirect to /sign-in
```

---

## Flow 2 — Phone / OTP Setup

Used when the user is invited **with a phone number** and no email token is required.

```mermaid
sequenceDiagram
    actor Admin
    actor User
    participant DB
    participant Web as StoryCare Web
    participant Firebase

    Admin->>DB: Create user record (status=invited, phoneNumber=+1...)
    Note over Admin,DB: No token needed — identity proved by phone OTP

    User->>Web: Open /setup-account-phone
    Web->>DB: GET /api/features/public (check enablePhoneVerification flag)

    User->>Web: Enter phone number
    Web->>DB: GET /api/auth/check-phone-invitation?phone=+1...
    DB-->>Web: { email, name, role, organizationName }

    Web->>User: Show confirmation screen (email + role + org)

    User->>Web: Click "Send Verification Code"
    Web->>Firebase: sendPhoneOtp(phone, recaptcha)
    Firebase-->>User: SMS with 6-digit code

    User->>Web: Enter 6-digit code
    Web->>Firebase: confirmPhoneOtp(code)
    Firebase-->>Web: Firebase User (phone auth)

    User->>Web: Enter password & submit
    Web->>Firebase: createUserWithEmailAndPassword(email, password)
    Firebase-->>Web: Firebase User (email/password) + ID token

    Web->>DB: POST /api/auth/link-firebase-uid { email, phoneVerified: true }
    DB->>DB: Match by phone number, validate status=invited
    DB->>DB: Set firebaseUid, status=active, phoneVerified=true
    DB->>Firebase: Mark emailVerified=true
    DB-->>Web: { success: true }

    Web->>User: Redirect to /sign-in
```

---

## Database State Transitions

```
User Record Lifecycle
─────────────────────

[invited]
  - firebaseUid: null
  - status: 'invited'
  - invitationToken: 'abc123' (email flow) or null (phone flow)
  - phoneNumber: '+1...' (phone flow) or null

        │
        │  User completes setup
        ▼

[active]
  - firebaseUid: 'firebase-uid-xyz'
  - status: 'active'
  - invitationToken: null (cleared)
  - phoneVerified: true (phone flow only)
```

---

## Who Can Invite Whom

```mermaid
flowchart TD
    SA[Super Admin] -->|POST /api/org-admins| OA[Org Admin]
    OA[Org Admin] -->|POST /api/therapists| T[Therapist]
    OA[Org Admin] -->|POST /api/patients| P[Patient]
    T[Therapist] -->|POST /api/patients| P[Patient]
```

### Invitation API Summary

| Endpoint | Caller | Creates |
|---|---|---|
| `POST /api/org-admins` | Super Admin | Org Admin |
| `POST /api/therapists` | Org Admin or Super Admin | Therapist |
| `POST /api/patients` | Therapist, Org Admin, or Super Admin | Patient |

---

## Pre-Check: Phone Invitation Validation

Before any OTP is sent, the phone number is validated against the database.

```mermaid
flowchart TD
    A[User enters phone number] --> B{Check /api/auth/check-phone-invitation}
    B -->|Not found / not invited| C[Show error — no OTP sent]
    B -->|Found| D[Show confirmation screen\nEmail · Role · Organization]
    D -->|User clicks Send Code| E[Send OTP via Firebase]
    D -->|User clicks Use different number| A
    E --> F[User enters 6-digit code]
    F -->|Invalid| G[Show error — try again]
    F -->|Valid| H[Proceed to create password]
```

---

## Security Notes

- **Phone flow**: No invitation token required — ownership is proved by receiving and entering the SMS OTP.
- **Email flow**: Token is single-use and expires in **7 days**. Cleared from DB on activation.
- **Duplicate prevention**: `link-firebase-uid` checks `firebaseUid IS NULL` before activating. Returns `409` if already active.
- **Organization boundary**: Each user is scoped to a single `organizationId`. Admins cannot see or manage users outside their org.
- **HIPAA audit**: All PHI access is logged to the `audit_logs` table.
