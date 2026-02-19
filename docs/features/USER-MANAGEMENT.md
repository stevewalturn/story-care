# User Management

## Overview

StoryCare implements a multi-role user system with an invitation-based onboarding flow. Users progress through lifecycle states (`pending_approval` -> `invited` -> `active` -> `inactive`/`deleted`). User records are created in the database before Firebase accounts exist, allowing admins to pre-configure roles and organization membership. On first login, the system automatically links the Firebase UID and activates the account.

## User Roles

| Role | Access Level |
|------|-------------|
| Super Admin | Creates organizations; manages all users platform-wide; changes user roles |
| Org Admin | Invites therapists and patients within their organization; manages org-scoped users |
| Therapist | Creates patients; assigns patients to themselves; manages their patient roster |
| Patient | Limited to viewing their own data; cannot manage other users |

## User Workflow

### Invitation Flow (Admin/Therapist Creates User)
1. Admin or therapist creates a user record in the database with `status: 'invited'` and assigns a role and organization.
2. System generates an invitation token with expiry and stores it on the user record.
3. An invitation email is sent via Paubox (HIPAA-compliant) with a setup link.
4. Invited user opens the link, validates the token via `/api/auth/validate-invitation-token`.
5. User creates a Firebase account (email/password).
6. Client calls `/api/auth/link-firebase-uid` to link Firebase UID and activate the account.
7. User is redirected to the dashboard.

### Self-Registration Flow (Therapist Default)
1. User signs up via `/sign-up` using Firebase `createUserWithEmailAndPassword`.
2. On first session creation (`POST /api/auth/session`), if no database user exists for the email, one is created with `role: 'therapist'` as default.
3. User is immediately active.

### Role Change Flow
1. Super Admin navigates to user management.
2. Submits role change via `POST /api/users/[id]/change-role` with `newRole` and `reason`.
3. System updates the role, creates an audit log entry.

### User Deactivation
1. Admin sets user status to `inactive` or performs a soft delete (`deletedAt`).
2. Deactivated users are blocked at the `verifyIdToken()` level on next request.
3. Deleted/inactive users cannot sign in, reset passwords, or access any endpoints.

## UI Pages

| Page | Path | Description |
|------|------|-------------|
| Super Admin Users | `/super-admin/users` | Platform-wide user management |
| Org Admin Dashboard | `/org-admin` | Organization user overview and management |
| Therapist Patients | `/patients` | Therapist's patient roster |
| Setup Account | `/setup-account` | Invited user account creation |

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/users/[id]/change-role` | Change user role (Super Admin only) | Bearer token (super_admin) |
| GET | `/api/super-admin/users` | List all platform users | Bearer token (super_admin) |
| GET | `/api/auth/check-invitation` | Check invitation status by email | None |
| POST | `/api/auth/validate-invitation-token` | Validate invitation token | None |
| POST | `/api/auth/link-firebase-uid` | Link Firebase UID and activate account | Bearer token |
| POST | `/api/auth/session` | Creates user record if not exists (auto-registration) | Firebase token |
| GET | `/api/therapists/me` | Get current therapist profile | Bearer token (therapist) |
| POST | `/api/therapists/upload-avatar` | Upload therapist avatar to GCS | Bearer token (therapist) |
| POST | `/api/therapists/[id]/assign-patients` | Assign patients to a therapist | Bearer token (therapist/admin) |

## Database Tables

| Table | Role in Feature |
|-------|----------------|
| `users` | Core user table with `id`, `firebaseUid`, `email`, `name`, `role`, `status`, `organizationId`, `therapistId`, `invitationToken`, `invitationTokenExpiresAt`, `passwordResetToken`, `passwordResetTokenExpiresAt`, `avatarUrl`, `referenceImageUrl`, `lastLoginAt`, `deletedAt` |
| `organizations` | Organization membership reference for users |
| `audit_logs` | Records role changes and user modifications |

## Key Files

| File | Purpose |
|------|---------|
| `src/app/api/users/[id]/change-role/route.ts` | Role change endpoint; validates with `canChangeUserRole` RBAC middleware; creates audit log |
| `src/app/api/auth/link-firebase-uid/route.ts` | Links Firebase UID to invited user; supports token-based and email-based lookup; clears invitation token on activation |
| `src/app/api/auth/check-invitation/route.ts` | Checks if email has a pending invitation; returns invitation details or already-activated status |
| `src/app/api/auth/session/route.ts` | Auto-creates user records for new Firebase users; auto-activates invited users on first login |
| `src/libs/FirebaseAdmin.ts` | `verifyIdToken()` handles automatic user activation for invited users found by email |
| `src/utils/AuthHelpers.ts` | `requireAuth`, `requireRole`, `canAccessPatient`, `verifyTherapistPatientAccess` helpers enforce RBAC |
| `src/middleware/RBACMiddleware.ts` | `requireSuperAdmin`, `requireOrgAdmin`, `canChangeUserRole` role-based middleware functions |
| `src/validations/OrganizationValidation.ts` | Zod schemas including `changeUserRoleSchema` |
| `src/services/EmailService.ts` | Sends invitation and password reset emails via Paubox |

## Technical Notes

- **User lifecycle states**: `pending_approval` (awaiting admin approval), `invited` (invitation sent, awaiting account creation), `active` (fully operational), `inactive` (deactivated by admin), `rejected` (invitation declined), `deleted` (soft-deleted via `deletedAt`).
- **Auto-activation**: When an invited user signs in for the first time, `verifyIdToken()` detects their `invited` status and `null` Firebase UID, links the UID, and sets status to `active` automatically.
- **Idempotent linking**: The `/api/auth/link-firebase-uid` endpoint checks if the UID is already linked and returns success without error (handles retry scenarios).
- **Therapist-patient relationship**: Patients have a `therapistId` foreign key. Therapists can only access patients assigned to them. `verifyTherapistPatientAccess()` enforces this at the API level.
- **Audit logging**: Role changes are recorded in `audit_logs` with old role, new role, reason, and the admin who performed the change.
- **Soft delete**: Users are soft-deleted by setting `deletedAt` timestamp. The `verifyIdToken()` function blocks soft-deleted users from authenticating.
