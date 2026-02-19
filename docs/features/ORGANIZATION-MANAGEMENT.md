# Organization Management

## Overview

StoryCare is a multi-tenant platform where users belong to organizations. Organizations are created by Super Admins and managed by Org Admins. Each organization has configurable settings including subscription tiers, feature limits (max therapists, patients, AI credits, storage), branding, and default configurations. All data is scoped to organizations to ensure tenant isolation.

## User Roles

| Role | Access Level |
|------|-------------|
| Super Admin | Creates, lists, updates, suspends, and deletes organizations; views platform-wide metrics |
| Org Admin | Views and updates their own organization (name, contact email); views org-scoped metrics |
| Therapist | Operates within their assigned organization; no org management access |
| Patient | Operates within their assigned organization; no org management access |

## User Workflow

### Organization Creation (Super Admin)
1. Super Admin navigates to `/super-admin` and opens the organization creation form.
2. Fills in organization name, slug, contact email, admin email, and admin name.
3. Submits the form, which calls `POST /api/organizations`.
4. System creates the organization record and an Org Admin user (status: `invited`) in a single database transaction.
5. An invitation email is sent to the Org Admin via Paubox with a setup link.
6. Org Admin completes account setup via the invitation flow.

### Organization Settings Update (Org Admin)
1. Org Admin navigates to `/org-admin`.
2. Views organization details and metrics (active therapists, patients, sessions).
3. Can update organization name and contact email via `PATCH /api/org-admin/organization`.

### Platform Metrics (Super Admin)
1. Super Admin views platform-wide metrics at `/super-admin`.
2. Metrics include total organizations, active organizations, total therapists, total patients.

## UI Pages

| Page | Path | Description |
|------|------|-------------|
| Super Admin Dashboard | `/super-admin` | Platform-wide organization and user management |
| Org Admin Dashboard | `/org-admin` | Organization-specific dashboard with metrics |
| Organization Settings | `/org-admin/organization` | View and update organization details |

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/organizations` | List all organizations with pagination and filtering | Bearer token (super_admin) |
| POST | `/api/organizations` | Create organization with Org Admin user | Bearer token (super_admin) |
| GET | `/api/organizations/[id]` | Get organization by ID with metrics | Bearer token (super_admin) |
| PUT | `/api/organizations/[id]` | Update organization (name, slug, settings, status) | Bearer token (super_admin) |
| DELETE | `/api/organizations/[id]` | Delete organization | Bearer token (super_admin) |
| GET | `/api/org-admin/organization` | Get own organization details | Bearer token (org_admin) |
| PATCH | `/api/org-admin/organization` | Update own organization (name, contact email only) | Bearer token (org_admin) |
| GET | `/api/org-admin/metrics` | Get organization dashboard metrics | Bearer token (org_admin) |
| GET | `/api/super-admin/metrics` | Get platform-wide metrics | Bearer token (super_admin) |

## Database Tables

| Table | Role in Feature |
|-------|----------------|
| `organizations` | Core organization table with `id`, `name`, `slug`, `contactEmail`, `logoUrl`, `primaryColor`, `settings` (JSONB), `status`, `createdBy`, `createdAt`, `updatedAt` |
| `users` | Users belong to organizations via `organizationId` foreign key |
| `sessions` | Sessions are organization-scoped via the therapist's organization |
| `audit_logs` | Organization-scoped audit trail |

## Key Files

| File | Purpose |
|------|---------|
| `src/services/OrganizationService.ts` | Core business logic: `createOrganization` (transactional org + admin user creation), `getOrganizationWithMetrics`, `listOrganizations`, `updateOrganization`, `deleteOrganization`, `getPlatformMetrics` |
| `src/services/OrgAdminService.ts` | `getOrgMetrics` - calculates active therapists, active patients, sessions in last 30 days for an organization |
| `src/app/api/organizations/route.ts` | Super Admin CRUD for organizations; handles duplicate key errors (slug, email) |
| `src/app/api/organizations/[id]/route.ts` | Single organization operations (GET, PUT, DELETE) |
| `src/app/api/org-admin/organization/route.ts` | Org Admin self-service: GET own org, PATCH name/contactEmail |
| `src/app/api/org-admin/metrics/route.ts` | Org Admin dashboard metrics |
| `src/app/api/super-admin/metrics/route.ts` | Platform-wide metrics |
| `src/validations/OrganizationValidation.ts` | Zod schemas for organization creation and update |
| `src/types/Organization.ts` | TypeScript types including `OrganizationSettings` |

## Technical Notes

- **Transactional creation**: Organization and Org Admin user are created in a single database transaction. If either fails, both are rolled back.
- **Subscription tiers**: Organizations have a `settings` JSONB column containing `subscriptionTier` (`basic`), feature limits (`maxTherapists: 5`, `maxPatients: 50`, `aiCreditsPerMonth: 1000`, `storageGB: 10`), defaults, and branding.
- **Default settings**: New organizations receive a `basic` tier with sensible defaults. Settings are deep-merged with any provided overrides.
- **Email after commit**: Invitation emails are sent after the transaction commits to avoid blocking the transaction and to prevent sending emails for failed transactions.
- **Org Admin restrictions**: Org Admins can only update `name` and `contactEmail` for their organization. They cannot change subscription tiers, feature limits, or status.
- **Organization status**: Can be `active` or `suspended`. Suspended organizations may have restricted access (enforcement TBD).
- **Duplicate detection**: The API handles PostgreSQL duplicate key errors for `slug` and `email` constraints with user-friendly messages (HTTP 409).
- **Metrics**: Organization metrics are computed on-the-fly by counting users and sessions. Storage and AI credit tracking are planned but not yet implemented.
