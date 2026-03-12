# Testing Procedure: Setup Account Flows

## Overview

Two flows exist for invited users to activate their account. **Both flows are always available simultaneously** — it is not an either/or choice:

| Flow | URL | When available |
|------|-----|----------------|
| **Flow A** — Token (email) | `/setup-account?token=xxx` | Always — token link is included in every invitation email |
| **Flow B** — Phone OTP | `/setup-account-phone` | Feature flag ON + invited user has a phone number stored in DB |

Both flows end at `/sign-in?setup=complete` with no "check email" step.

### How the two flows coexist

When you invite a user **with a phone number** and `enablePhoneVerification` is ON:

- The invitation email **always** contains the token link (`/setup-account?token=xxx`) → Flow A always works
- The user **can also** navigate to `/setup-account-phone` and verify via SMS → Flow B also works
- The user can choose whichever method they prefer — it is not forced to one or the other

When you invite a user **without a phone number**, or `enablePhoneVerification` is OFF:

- Only Flow A (token link) is available

---

## Where Phone Numbers Are Collected (Invite Forms)

The **Phone Number** field appears in invite forms **only when the `enablePhoneVerification` feature flag is ON** (Super Admin → Settings → Platform Settings → Phone Verification toggle).

| Form | Location | Field label |
|------|----------|-------------|
| Invite Therapist modal | Org Admin panel → Therapists → New Therapist | Phone Number (Optional) |
| Add New Patient modal | Patients page → New Patient | Phone Number (Optional) |
| Assign Org Admin (edit org) | Super Admin → Organizations → [org] → Edit | Admin Phone Number (Optional) |

In all three forms:
- The field appears **after the Email field**
- It is optional — leaving it blank is always fine
- The helper text reads: *"If provided, the [user] can also set up their account via SMS."*
- The field is hidden entirely when `enablePhoneVerification` is OFF

---

## Firebase Dashboard Setup

Before testing, ensure Firebase is configured to allow email/password and phone auth.

### 1. Enable Sign-in Providers

1. Go to **Firebase Console → Authentication → Sign-in method**
2. Enable **Email/Password** (do NOT require email verification — the app handles that via Admin SDK)
3. Enable **Phone** (required for Flow B)

### 2. Allow Test Phone Numbers (for Flow B in dev)

Firebase blocks real SMS in test environments unless you add test numbers.

1. Go to **Authentication → Sign-in method → Phone → Phone numbers for testing**
2. Add a test number, e.g. `+15555550100` with code `123456`
3. Use this number and code during Flow B testing — no real SMS is sent

### 3. Verify Authorized Domains

1. Go to **Authentication → Settings → Authorized domains**
2. Ensure `localhost` is listed (added by default)
3. For production, add your custom domain

### 4. Firebase Admin SDK — `emailVerified` update

The server sets `emailVerified: true` via Admin SDK when an account is activated. Verify the service account has the **Firebase Authentication Admin** role:

1. Go to **Google Cloud Console → IAM → Service Accounts**
2. Find the service account used in `FIREBASE_ADMIN_CLIENT_EMAIL`
3. Confirm it has the `Firebase Authentication Admin` role (or `Firebase Admin`)

---

## Flow A — Token-Based Setup (`/setup-account?token=xxx`)

### Prerequisites
- Feature flag `enablePhoneVerification` can be ON or OFF — doesn't matter for this flow
- Every invitation email includes a token link regardless of whether a phone number was provided

### Steps

1. **Invite a user** from the appropriate panel (phone field optional)
2. **Copy the invitation link** from the email — format: `/setup-account?token=<uuid>`
3. Open the link in a browser
4. Verify the invitation banner shows the user's name, role, and organization
5. Enter a password (≥ 6 chars) and confirm it
6. Click **Create Account & Sign In**
7. Verify the green **"Account Created!"** screen appears
8. Verify automatic redirect to `/sign-in?setup=complete` within ~2 seconds
9. At sign-in, verify the green banner: *"Account created successfully! You can now sign in."*
10. Sign in with the email and password
11. Verify successful login and redirect to `/dashboard`

### Expected: No "Check your email" screen

### Verify `emailVerified` flag

After step 6, in Firebase Console → Authentication → Users, find the user and confirm:
- `Email verified: true`

---

## Flow B — Phone OTP Setup (`/setup-account-phone`)

### Prerequisites
- Feature flag `enablePhoneVerification` must be **ON** (Super Admin → Settings → Platform Settings)
- Invited user must have a **phone number** stored in the DB (entered in the invite form)
- Add a test phone number in Firebase Console (see above)

### Steps

1. **Invite a user** with a phone number (phone field is visible when flag is ON)
2. The invitation email still contains the token link (Flow A is also available)
3. Navigate to `/setup-account-phone` (either via a direct link or by choosing it instead of the token link)
4. Verify redirect does NOT happen (flag is ON)
5. Enter the phone number (must match what was stored for the invited user)
6. Click **Send Verification Code**
7. Enter the OTP (use your Firebase test number code, e.g. `123456`)
8. Verify the green **"Phone verified!"** banner appears with the user's name
9. Enter and confirm a password
10. Click **Create Account & Sign In**
11. Verify the green **"Account Created!"** screen and auto-redirect to `/sign-in?setup=complete`
12. Sign in with email + password
13. Verify successful login

### Gate test — flag OFF

1. Turn OFF `enablePhoneVerification` in platform settings
2. Navigate to `/setup-account-phone`
3. Verify automatic redirect to `/setup-account`
4. Also verify the phone number field disappears from all invite forms

### Invalid phone test

1. On `/setup-account-phone`, enter a phone number **not** associated with any invited user
2. Complete OTP
3. Verify error: *"No pending invitation found for this phone number."*

### Already activated test

1. Complete Flow B once to activate an account
2. Try Flow B again with the same phone number
3. Verify 409 error → redirect to `/sign-in`

---

## Both Flows Available Simultaneously

To verify both flows work for the same invited user:

1. Turn ON `enablePhoneVerification`
2. Invite a therapist with name, email, **and** phone number
3. Confirm the DB record has `phone_number` populated
4. Open the token link from the email → complete Flow A → account activated
5. OR: navigate to `/setup-account-phone`, enter the phone, complete OTP → complete Flow B

Both paths reach the same end state. Only one needs to succeed to activate the account.

---

## Already Activated (Both Flows)

1. Complete setup once for a user
2. Try visiting the same `/setup-account?token=xxx` again
3. Verify: **"Already Activated"** error screen with a "Go to Sign In" button

---

## API Routes That Handle Phone Storage

| Route | Phone field |
|-------|-------------|
| `POST /api/therapists` | `phoneNumber` from `inviteTherapistSchema` |
| `POST /api/patients` | `phoneNumber` from `invitePatientSchema` |
| `POST /api/org-admins` | `phoneNumber` from `inviteOrgAdminSchema` |
| `PATCH /api/organizations/[id]` | `adminPhone` mapped to `phoneNumber` on the created admin user |

All four routes store the value in the `users.phone_number` column. The invitation email always uses the token URL — the phone setup page looks up the user by phone number independently.

---

## Checklist

- [ ] Phone field hidden in all invite forms when `enablePhoneVerification` is OFF
- [ ] Phone field visible in all invite forms when `enablePhoneVerification` is ON
- [ ] Invite therapist with phone → DB `phone_number` populated
- [ ] Invite patient with phone → DB `phone_number` populated
- [ ] Assign org admin with phone → DB `phone_number` populated
- [ ] Invitation email always contains token link regardless of phone number
- [ ] Flow A: token path → no "check email" → sign in works immediately
- [ ] Flow A: `user.emailVerified === true` in Firebase after activation
- [ ] Flow B: phone OTP → password → sign in works immediately
- [ ] Flow B: flag OFF → redirects to `/setup-account`
- [ ] Flow B: unknown phone → error message
- [ ] Both flows available for same user when phone + flag ON
- [ ] Both: already-activated token/phone → 409 → redirect to sign-in
- [ ] Both: expired token (Flow A) → "Invitation Expired" screen
