# StoryCare Organization Multi-Tenancy - Implementation TODO List

**Project**: Organization Multi-Tenancy & Admin Hierarchy
**Status**: In Development (New App - No Legacy Data)
**Version**: 1.1
**Last Updated**: 2025-11-06

---

## Overview

This TODO list tracks the implementation of the Organization Multi-Tenancy feature as defined in PRD_ORG.md. All tasks are organized by implementation phase and priority.

**Legend**:
- ⬜ Not Started
- 🔄 In Progress
- ✅ Completed
- ⏸️ Blocked
- ❌ Cancelled

---

## Phase 1: Foundation (Weeks 1-3)

### Database Schema

#### Organizations Table
- ✅ **DB-001**: Create `organizations` table with all fields
  - Fields: id, name, slug, contact_email, logo_url, primary_color
  - Fields: join_code (unique), join_code_enabled
  - Fields: settings (JSONB), status, trial_ends_at
  - Fields: created_at, updated_at, created_by
  - Indexes: slug, join_code, status, created_by

#### Survey Templates Table
- ✅ **DB-002**: Create `survey_templates` table
  - Fields: id, scope, organization_id, created_by, approved_by, approved_at
  - Fields: title, description, category, questions (JSONB)
  - Fields: status, rejection_reason, use_count, metadata
  - Constraint: scope-org relationship check
  - Indexes: scope, organization_id, created_by, status, category

#### Reflection Templates Table
- ✅ **DB-003**: Create `reflection_templates` table
  - Fields: id, scope, organization_id, created_by, approved_by, approved_at
  - Fields: title, description, category, questions (JSONB)
  - Fields: status, rejection_reason, use_count, metadata
  - Constraint: scope-org relationship check
  - Indexes: scope, organization_id, created_by, status, category

#### Users Table Modifications
- ✅ **DB-004**: Add `organization_id` column to `users` table
  - Type: UUID, references organizations(id)
  - ON DELETE RESTRICT
  - Nullable initially (will be NOT NULL after constraints)

- ✅ **DB-005**: Add `status` column to `users` table
  - Type: VARCHAR(20)
  - Values: 'pending_approval', 'active', 'inactive'
  - Default: 'active'
  - NOT NULL

- ✅ **DB-006**: Add new role values to `user_role` enum
  - Add 'super_admin'
  - Add 'org_admin'

- ✅ **DB-007**: Add constraint `users_super_admin_org_check`
  - super_admin must have organization_id = NULL
  - Other roles must have organization_id NOT NULL

- ✅ **DB-008**: Add constraint `users_therapist_same_org_check`
  - Patient's therapist must be in same organization

- ✅ **DB-009**: Create indexes on users table
  - idx_users_organization_id
  - idx_users_role_org (role, organization_id)
  - idx_users_status
  - idx_users_org_status (organization_id, status)

#### Groups Table Modifications
- ✅ **DB-010**: Add `organization_id` column to `groups` table
  - Type: UUID, references organizations(id)
  - ON DELETE CASCADE
  - NOT NULL

- ✅ **DB-011**: Create index `idx_groups_organization_id`

#### Therapeutic Prompts Table Modifications
- ✅ **DB-012**: Add `scope` column to `therapeutic_prompts` table
  - Type: VARCHAR(20)
  - Values: 'system', 'organization', 'private'
  - Default: 'private'
  - NOT NULL

- ✅ **DB-013**: Add organization and approval columns to `therapeutic_prompts`
  - organization_id (UUID, references organizations)
  - approved_by (UUID, references users)
  - approved_at (TIMESTAMP)
  - status (VARCHAR(20), values: 'active', 'pending_approval', 'rejected', 'archived')
  - rejection_reason (TEXT)

- ✅ **DB-014**: Add constraint `therapeutic_prompts_scope_org_check`
  - System scope must have organization_id = NULL
  - Org/private scope must have organization_id NOT NULL

- ✅ **DB-015**: Create indexes on therapeutic_prompts
  - idx_therapeutic_prompts_scope
  - idx_therapeutic_prompts_org_id
  - idx_therapeutic_prompts_status

#### Audit Logs Table Modifications
- ✅ **DB-016**: Add `organization_id` column to `audit_logs` table
  - Type: UUID, references organizations(id)
  - ON DELETE SET NULL
  - Nullable

- ✅ **DB-017**: Create indexes on audit_logs
  - idx_audit_logs_organization_id
  - idx_audit_logs_org_action (organization_id, action)

#### Migration Scripts
- 🔄 **DB-018**: Create Drizzle migration for all schema changes
- ⬜ **DB-019**: Test migration on local development database
- ⬜ **DB-020**: Create rollback migration script

### Authentication & RBAC

#### Type Definitions
- ⬜ **AUTH-001**: Update `AuthenticatedUser` type in `src/types/`
  - Add organizationId: string | null
  - Update role enum: 'super_admin' | 'org_admin' | 'therapist' | 'patient'

- ⬜ **AUTH-002**: Create `OrganizationUser` type
  - Extends AuthenticatedUser with organization details

#### Middleware
- ⬜ **AUTH-003**: Create `requireSameOrg()` middleware
  - File: `src/middleware/RBACMiddleware.ts`
  - Check user.organizationId === resource.organizationId
  - Allow super_admin with audit logging
  - Throw ForbiddenError if violation

- ⬜ **AUTH-004**: Create `requireOrgAdmin()` middleware
  - Check user.role === 'org_admin' OR 'super_admin'
  - Throw ForbiddenError if not authorized

- ⬜ **AUTH-005**: Create `requireSuperAdmin()` middleware
  - Check user.role === 'super_admin'
  - Throw ForbiddenError if not authorized

- ⬜ **AUTH-006**: Update `verifyIdToken()` in FirebaseAdmin.ts
  - Fetch organizationId from database along with role
  - Return enhanced AuthenticatedUser object

- ⬜ **AUTH-007**: Create `requirePendingUserAccess()` middleware
  - Validate org admin can access pending user in their org

#### Helper Functions
- ⬜ **AUTH-008**: Create `canChangeUserRole()` helper
  - Only super_admin can change roles
  - User must stay in same org

- ⬜ **AUTH-009**: Create `canApproveUser()` helper
  - Org admin or super admin only
  - User must be in same org

### Testing
- ⬜ **TEST-001**: Unit tests for `requireSameOrg()` middleware
- ⬜ **TEST-002**: Unit tests for `requireOrgAdmin()` middleware
- ⬜ **TEST-003**: Unit tests for `requireSuperAdmin()` middleware
- ⬜ **TEST-004**: Integration tests for org boundary enforcement
- ⬜ **TEST-005**: Test database constraints (org-user relationships)

---

## Phase 2: Super Admin Features (Weeks 4-5)

### API Routes - Organization Management

#### Create Organization
- ⬜ **API-001**: `POST /api/super-admin/organizations`
  - File: `src/app/api/super-admin/organizations/route.ts`
  - Zod validation schema for request
  - Generate unique join code on creation
  - Auto-generate slug from name (with uniqueness check)
  - Set created_by to super admin's ID
  - Return organization object
  - Authorization: requireSuperAdmin()

#### List Organizations
- ⬜ **API-002**: `GET /api/super-admin/organizations`
  - File: `src/app/api/super-admin/organizations/route.ts`
  - Query params: status, search, page, limit
  - Calculate metrics for each org (therapists, patients, sessions)
  - Pagination support
  - Authorization: requireSuperAdmin()

#### Get Organization Details
- ⬜ **API-003**: `GET /api/super-admin/organizations/:id`
  - File: `src/app/api/super-admin/organizations/[id]/route.ts`
  - Return full org details with all metrics
  - Include usage stats (storage, AI credits, etc.)
  - Authorization: requireSuperAdmin()

#### Update Organization
- ⬜ **API-004**: `PATCH /api/super-admin/organizations/:id`
  - File: `src/app/api/super-admin/organizations/[id]/route.ts`
  - Update settings, status, subscription tier
  - Validate subscription tier changes
  - Audit log entry
  - Authorization: requireSuperAdmin()

#### Invite Organization Admin
- ⬜ **API-005**: `POST /api/super-admin/organizations/:id/invite-admin`
  - Create user with role='org_admin'
  - Assign to organization
  - Send Firebase invitation email
  - Cannot create org_admin without organization
  - Authorization: requireSuperAdmin()

#### Get Current User's Organization
- ⬜ **API-006**: `GET /api/organizations/me`
  - File: `src/app/api/organizations/me/route.ts`
  - Return org details for current user's organization
  - Auto-scoped to user.organizationId
  - Authorization: requireAuth()

### UI Components - Super Admin

#### Super Admin Dashboard
- ⬜ **UI-001**: Create `src/app/(auth)/super-admin/dashboard/page.tsx`
  - Platform metrics cards (Total Orgs, Active Orgs, Total Therapists, Total Patients)
  - Organization list table with filters
  - Recent activity feed
  - "Create Organization" button

- ⬜ **UI-002**: Create `OrganizationListTable` component
  - Columns: Name, Therapists, Patients, Status, Created, Actions
  - Sortable columns
  - Search functionality
  - Status filter dropdown

- ⬜ **UI-003**: Create `PlatformMetricsCard` component
  - Reusable metric display
  - Icon + label + value

#### Create Organization Modal
- ⬜ **UI-004**: Create `CreateOrganizationModal` component
  - Form fields: Name, Slug (auto-generated), Contact Email
  - Optional: Logo upload, Primary color picker
  - Subscription tier dropdown
  - Form validation with Zod
  - Success → redirect to org details page

#### Organization Details Page
- ⬜ **UI-005**: Create `src/app/(auth)/super-admin/organizations/[id]/page.tsx`
  - Tab navigation: Overview, Users, Templates, Settings, Audit Log
  - Actions: Edit, Suspend/Activate, View as Org

- ⬜ **UI-006**: Create `OrgOverviewTab` component
  - Org details display
  - Metrics cards
  - Subscription info with usage bars

- ⬜ **UI-007**: Create `OrgUsersTab` component
  - List all users in organization
  - Filter by role
  - "Create User" button
  - Deactivate user action

- ⬜ **UI-008**: Create `OrgTemplatesTab` component
  - Show org-wide templates
  - Pending approvals count
  - View template details

- ⬜ **UI-009**: Create `OrgSettingsTab` component
  - Edit organization settings
  - Update branding
  - Configure defaults

- ⬜ **UI-010**: Create `OrgAuditLogTab` component
  - Filtered audit log for this org
  - Export audit log button

#### Super Admin Navigation
- ⬜ **UI-011**: Update sidebar for super_admin role
  - Dashboard
  - Organizations (with "All Organizations", "Create Organization")
  - System Templates
  - Audit Logs
  - Settings

### Testing
- ⬜ **TEST-006**: E2E test for organization creation workflow
- ⬜ **TEST-007**: E2E test for org suspension/reactivation
- ⬜ **TEST-008**: E2E test for super admin read-only org access
- ⬜ **TEST-009**: Test organization metrics calculations
- ⬜ **TEST-010**: Test super admin authorization on all endpoints

---

## Phase 3: Org Admin User Management & Self-Signup (Weeks 6-8)

### API Routes - User Management

#### Invite Therapist / Create Patient
- ⬜ **API-007**: `POST /api/organizations/users`
  - File: `src/app/api/organizations/users/route.ts`
  - Auto-set organizationId from authenticated user
  - Send Firebase invitation if therapist
  - Create with status='pending_setup' if invited
  - Validation: cannot create user in different org
  - Authorization: requireOrgAdmin()

#### List Organization Users
- ⬜ **API-008**: `GET /api/organizations/users`
  - File: `src/app/api/organizations/users/route.ts`
  - Filter by role, status
  - Search by name/email
  - Auto-scoped to user's organization
  - Authorization: requireAuth()

#### Update User
- ⬜ **API-009**: `PATCH /api/organizations/users/:id`
  - File: `src/app/api/organizations/users/[id]/route.ts`
  - Update status (active/inactive)
  - Org boundary check
  - Audit log entry
  - Authorization: requireOrgAdmin()

#### Transfer Patient Within Org
- ⬜ **API-010**: `POST /api/organizations/users/:patientId/transfer`
  - File: `src/app/api/organizations/users/[patientId]/transfer/route.ts`
  - Validate both therapists in same org
  - Update patient's therapistId
  - Audit log with reason
  - Email notifications to both therapists
  - Authorization: requireOrgAdmin()

#### Change User Role (Super Admin Only)
- ⬜ **API-011**: `PATCH /api/super-admin/users/:id/role`
  - File: `src/app/api/super-admin/users/[id]/role/route.ts`
  - Validate user stays in same org
  - Cannot change super_admin role
  - Require reason for audit log
  - Email notification to user
  - Authorization: requireSuperAdmin()

### API Routes - Self-Signup

#### Sign Up with Organization Code
- ⬜ **API-012**: `POST /api/auth/signup`
  - File: `src/app/api/auth/signup/route.ts`
  - Validate organization code exists and is enabled
  - Create Firebase user
  - Create database user with status='pending_approval'
  - Set organizationId from code
  - Send notification to org admin
  - Return pending approval message
  - Authorization: Public (no auth required)

#### Verify Organization Code
- ⬜ **API-013**: `POST /api/organizations/verify-code`
  - File: `src/app/api/organizations/verify-code/route.ts`
  - Check if code exists and is enabled
  - Return organization name and logo if valid
  - Return 404 if invalid
  - Authorization: Public (no auth required)

#### Get Pending Users
- ⬜ **API-014**: `GET /api/organizations/pending-users`
  - File: `src/app/api/organizations/pending-users/route.ts`
  - List users with status='pending_approval'
  - Auto-scoped to user's organization
  - Authorization: requireOrgAdmin()

#### Approve Pending User
- ⬜ **API-015**: `POST /api/organizations/users/:id/approve`
  - File: `src/app/api/organizations/users/[id]/approve/route.ts`
  - Set status='active'
  - Assign role (therapist or patient)
  - If therapist: update license_number and specialty
  - Send approval email to user
  - Audit log entry
  - Authorization: requireOrgAdmin()

#### Reject Pending User
- ⬜ **API-016**: `POST /api/organizations/users/:id/reject`
  - File: `src/app/api/organizations/users/[id]/reject/route.ts`
  - Delete user from database
  - Delete from Firebase Auth
  - Send rejection email with reason
  - Audit log entry
  - Authorization: requireOrgAdmin()

### API Routes - Organization Code Management

#### Regenerate Join Code
- ⬜ **API-017**: `POST /api/organizations/regenerate-code`
  - File: `src/app/api/organizations/regenerate-code/route.ts`
  - Generate new unique random code
  - Update organization record
  - Invalidate old code
  - Audit log entry
  - Authorization: requireOrgAdmin()

#### Toggle Join Code
- ⬜ **API-018**: `PATCH /api/organizations/toggle-code`
  - File: `src/app/api/organizations/toggle-code/route.ts`
  - Enable/disable join_code_enabled
  - Existing pending users unaffected
  - Audit log entry
  - Authorization: requireOrgAdmin()

### UI Components - Org Admin Dashboard

#### Dashboard Page
- ⬜ **UI-012**: Create `src/app/(auth)/admin/dashboard/page.tsx`
  - Org metrics cards (including Pending Users)
  - Quick actions (Invite Therapist, Create Patient, Review Pending Users)
  - Recent activity feed
  - Therapist activity table

- ⬜ **UI-013**: Create `OrgMetricsCards` component
  - Active Therapists, Active Patients, Sessions, Pending Users

- ⬜ **UI-014**: Create `QuickActionsPanel` component
  - Button grid for common actions

### UI Components - User Management

#### User Management Page
- ⬜ **UI-015**: Create `src/app/(auth)/admin/users/page.tsx`
  - Tab navigation: Pending, Therapists, Patients
  - Search and filter functionality

- ⬜ **UI-016**: Create `PendingUsersTab` component
  - Table: Name, Email, Signup Date, Actions
  - Approve button → ApproveUserModal
  - Reject button → RejectUserModal

- ⬜ **UI-017**: Create `TherapistsTab` component
  - Table with therapist details
  - "Invite Therapist" button
  - View, Edit, Deactivate actions

- ⬜ **UI-018**: Create `PatientsTab` component
  - Table with patient details
  - Filter by therapist
  - "Create Patient" button
  - Transfer, Deactivate actions

#### Modals
- ⬜ **UI-019**: Create `ApproveUserModal` component
  - Select role dropdown
  - If therapist: license number and specialty fields
  - Confirm button

- ⬜ **UI-020**: Create `RejectUserModal` component
  - Reason textarea (optional)
  - Confirm rejection button

- ⬜ **UI-021**: Create `InviteTherapistModal` component
  - Email, Name, License #, Specialty fields
  - Send invitation button

- ⬜ **UI-022**: Create `CreatePatientModal` component
  - Name, Email, DOB fields
  - Assign to therapist dropdown
  - Create button

- ⬜ **UI-023**: Create `TransferPatientModal` component
  - Select new therapist dropdown
  - Reason textarea
  - Confirm transfer button

### UI Components - Settings (Organization Code)

#### Settings Page Update
- ⬜ **UI-024**: Update `src/app/(auth)/admin/settings/page.tsx`
  - Add "User Onboarding" section

- ⬜ **UI-025**: Create `UserOnboardingSettings` component
  - Display join code with copy button
  - Enable/disable toggle
  - Regenerate code button with confirmation

### UI Components - Public Sign-Up

#### Sign-Up Page
- ⬜ **UI-026**: Create `src/app/sign-up/page.tsx`
  - Form: Name, Email, Password, Confirm Password, Organization Code
  - Real-time code validation (calls verify-code API)
  - Show organization name when code valid
  - Error handling for invalid code
  - Success → redirect to pending approval page

- ⬜ **UI-027**: Create `OrganizationCodeInput` component
  - Input with validation
  - Shows org name when valid
  - Error state when invalid

#### Pending Approval Page
- ⬜ **UI-028**: Create `src/app/pending-approval/page.tsx`
  - Message: "Your account is pending approval..."
  - Display organization name
  - "Return to Sign In" link

### UI Components - Super Admin Role Change

#### Change Role Modal
- ⬜ **UI-029**: Create `ChangeUserRoleModal` component
  - Current role (read-only)
  - New role dropdown
  - Reason textarea (required)
  - Warning: "User will remain in current organization"
  - Confirm button

- ⬜ **UI-030**: Add "Change Role" action to OrgUsersTab
  - Button in user row actions
  - Opens ChangeUserRoleModal

### Validation Schemas
- ⬜ **VAL-001**: Create `SignupValidation.ts` with Zod schema
  - Name, email, password, organization code validation

- ⬜ **VAL-002**: Create `UserApprovalValidation.ts`
  - Role, license number (conditional), specialty validation

- ⬜ **VAL-003**: Create `UserRoleChangeValidation.ts`
  - New role, reason validation

### Services
- ⬜ **SVC-001**: Create `OrganizationCodeService.ts`
  - generateUniqueCode(): Generate random unique code
  - validateCode(code): Check if code exists and enabled

- ⬜ **SVC-002**: Update `EmailService.ts`
  - sendPendingUserNotification(orgAdminEmail, userName)
  - sendUserApprovalNotification(userEmail, orgName)
  - sendUserRejectionNotification(userEmail, reason)
  - sendRoleChangeNotification(userEmail, oldRole, newRole)

### Testing
- ⬜ **TEST-011**: E2E test for therapist invitation flow
- ⬜ **TEST-012**: E2E test for patient creation and transfer
- ⬜ **TEST-013**: E2E test for user self-signup flow (code validation → signup → pending → approval)
- ⬜ **TEST-014**: E2E test for org code management (regenerate, enable/disable)
- ⬜ **TEST-015**: E2E test for super admin role change
- ⬜ **TEST-016**: Test org boundary enforcement on user management
- ⬜ **TEST-017**: Test pending user approval workflow with different roles

---

## Phase 4: Template Library System (Weeks 9-11)

### API Routes - Therapeutic Prompts

#### Get Prompts
- ⬜ **API-019**: `GET /api/templates/prompts`
  - File: `src/app/api/templates/prompts/route.ts`
  - Filter by scope (system, organization, private, all)
  - Filter by category, status
  - Search by title
  - Auto-scope to user's organization
  - Authorization: requireAuth()

#### Create Prompt
- ⬜ **API-020**: `POST /api/templates/prompts`
  - File: `src/app/api/templates/prompts/route.ts`
  - Therapist: scope='private' or 'pending_approval'
  - Org Admin: scope='organization' (immediate)
  - Super Admin: scope='system'
  - Auto-set organizationId from user
  - Authorization: requireAuth()

#### Submit Prompt for Approval
- ⬜ **API-021**: `POST /api/templates/prompts/:id/submit-for-approval`
  - File: `src/app/api/templates/prompts/[id]/submit-for-approval/route.ts`
  - Validate ownership
  - Change status to 'pending_approval'
  - Notify org admin
  - Prompt remains in therapist's library during review
  - Authorization: requireAuth()

#### Get Pending Prompts
- ⬜ **API-022**: `GET /api/templates/prompts/pending`
  - File: `src/app/api/templates/prompts/pending/route.ts`
  - List prompts with status='pending_approval'
  - Auto-scoped to org
  - Authorization: requireOrgAdmin()

#### Approve/Reject Prompt
- ⬜ **API-023**: `POST /api/templates/prompts/:id/approve`
  - File: `src/app/api/templates/prompts/[id]/approve/route.ts`
  - If approved: scope='organization', status='active'
  - If rejected: status='rejected', scope='private'
  - Notify therapist via email
  - Audit log entry
  - Authorization: requireOrgAdmin()

#### Import System Prompt
- ⬜ **API-024**: `POST /api/templates/prompts/:id/import`
  - File: `src/app/api/templates/prompts/[id]/import/route.ts`
  - Only system templates can be imported
  - Create new template with scope='organization'
  - Copy all content from system template
  - Track source in metadata
  - Authorization: requireOrgAdmin()

### API Routes - Survey Templates

#### Survey Template CRUD
- ⬜ **API-025**: `GET /api/templates/surveys` (same pattern as prompts)
- ⬜ **API-026**: `POST /api/templates/surveys`
- ⬜ **API-027**: `POST /api/templates/surveys/:id/submit-for-approval`
- ⬜ **API-028**: `GET /api/templates/surveys/pending`
- ⬜ **API-029**: `POST /api/templates/surveys/:id/approve`
- ⬜ **API-030**: `POST /api/templates/surveys/:id/import`

### API Routes - Reflection Templates

#### Reflection Template CRUD
- ⬜ **API-031**: `GET /api/templates/reflections` (same pattern as prompts)
- ⬜ **API-032**: `POST /api/templates/reflections`
- ⬜ **API-033**: `POST /api/templates/reflections/:id/submit-for-approval`
- ⬜ **API-034**: `GET /api/templates/reflections/pending`
- ⬜ **API-035**: `POST /api/templates/reflections/:id/approve`
- ⬜ **API-036**: `POST /api/templates/reflections/:id/import`

### UI Components - Org Admin Template Library

#### Template Library Page
- ⬜ **UI-031**: Create `src/app/(auth)/admin/templates/page.tsx`
  - Tab navigation: Prompts, Surveys, Reflections
  - Each tab has filter tabs: System, Organization, Pending Approval

- ⬜ **UI-032**: Create `PromptsTab` component
  - Template grid/list view
  - Filter by category
  - Sort by name, use count, created date
  - Search bar

- ⬜ **UI-033**: Create `SystemTemplatesView` component
  - Shows all system templates
  - "Import to Org" button on each template

- ⬜ **UI-034**: Create `OrgTemplatesView` component
  - Shows org-wide templates
  - "Create Template" button
  - Edit, Archive actions

- ⬜ **UI-035**: Create `PendingApprovalsView` component
  - Shows pending templates
  - Template preview
  - Submitter name, date, note
  - Approve/Reject buttons

#### Modals
- ⬜ **UI-036**: Create `CreateTemplateModal` component
  - Title, category, content fields
  - Different forms for prompts/surveys/reflections
  - Save button

- ⬜ **UI-037**: Create `ImportTemplateModal` component
  - Confirmation message
  - Creates org copy button

- ⬜ **UI-038**: Create `ApproveTemplateModal` component
  - Template preview
  - Approve/Reject buttons
  - Rejection reason field (if reject)

### UI Components - Therapist Template Library (Enhanced)

#### Template Library Page Update
- ⬜ **UI-039**: Update `src/app/(auth)/templates/page.tsx`
  - Add "Scope" filter: System, Organization, My Private
  - Add scope badges to templates

- ⬜ **UI-040**: Create `SubmitForApprovalModal` component
  - Note textarea for org admin
  - Submit button

- ⬜ **UI-041**: Add "Submit for Org Sharing" button to private templates
  - Opens SubmitForApprovalModal

### Validation Schemas
- ⬜ **VAL-004**: Create `PromptValidation.ts`
  - Title, category, promptText, scope validation

- ⬜ **VAL-005**: Create `SurveyValidation.ts`
  - Title, description, questions array validation

- ⬜ **VAL-006**: Create `ReflectionValidation.ts`
  - Title, description, questions array validation

### Services
- ⬜ **SVC-003**: Create `TemplateService.ts`
  - getTemplatesForUser(userId, scope): Filter templates by user's org and scope
  - submitForApproval(templateId, userId): Change status to pending
  - approveTemplate(templateId, approverId): Promote to org scope
  - importSystemTemplate(systemTemplateId, orgId): Create org copy

### Testing
- ⬜ **TEST-018**: E2E test for template creation and approval workflow
- ⬜ **TEST-019**: E2E test for system template import
- ⬜ **TEST-020**: E2E test for org scoping on templates
- ⬜ **TEST-021**: Test template approval notifications
- ⬜ **TEST-022**: Test template use count increments

---

## Phase 5: Org Settings & Defaults (Weeks 12-13)

### API Routes - Organization Settings

#### Get Organization Settings
- ⬜ **API-037**: `GET /api/organizations/settings`
  - File: `src/app/api/organizations/settings/route.ts`
  - Return full settings object
  - Auto-scoped to user's org
  - Authorization: requireOrgAdmin()

#### Update Organization Settings
- ⬜ **API-038**: `PATCH /api/organizations/settings`
  - File: `src/app/api/organizations/settings/route.ts`
  - Update defaults (reflection questions, survey template)
  - Update branding (welcome message, support email)
  - Cannot update subscription tier (super admin only)
  - Validate template IDs belong to system or org scope
  - Audit log entry
  - Authorization: requireOrgAdmin()

#### Export Organization Templates
- ⬜ **API-039**: `GET /api/organizations/export-templates`
  - File: `src/app/api/organizations/export-templates/route.ts`
  - Query param: format (json or csv)
  - Include all org and therapist-approved templates
  - Exclude system templates
  - Audit log entry
  - Authorization: requireOrgAdmin()

### UI Components - Settings Page

#### Settings Page Update
- ⬜ **UI-042**: Update `src/app/(auth)/admin/settings/page.tsx`
  - Add all settings sections

- ⬜ **UI-043**: Create `DefaultTemplatesSettings` component
  - Multi-select for default reflection questions
  - Single-select for default survey
  - Save button

- ⬜ **UI-044**: Create `BrandingSettings` component
  - Welcome message textarea
  - Support email input
  - Save button

- ⬜ **UI-045**: Create `AdvancedSettings` component
  - Export templates button (JSON/CSV toggle)
  - View audit log link

### Integration - Story Page Builder

#### Apply Defaults
- ⬜ **INT-001**: Update story page creation logic
  - Pre-populate default reflection questions from org settings
  - Pre-populate default survey from org settings
  - Allow therapist to remove or add to defaults

### Services
- ⬜ **SVC-004**: Create `TemplateExportService.ts`
  - exportToJSON(organizationId): Generate JSON export
  - exportToCSV(organizationId): Generate CSV export

### Testing
- ⬜ **TEST-023**: Test default templates applied to new story pages
- ⬜ **TEST-024**: Test template export (JSON, CSV)
- ⬜ **TEST-025**: Test branding applied in org context
- ⬜ **TEST-026**: Test settings validation (template IDs exist)

---

## Phase 6: Deployment & Initial Setup (Weeks 14-15)

### Database Setup

#### Run Migrations
- ⬜ **DEP-001**: Run all database migrations on development environment
  - `npm run db:generate`
  - `npm run db:migrate`

- ⬜ **DEP-002**: Verify all tables created correctly
  - Check constraints
  - Check indexes
  - Check foreign keys

#### Create First Super Admin
- ⬜ **DEP-003**: Create super admin account
  - Create Firebase user manually
  - Insert into database with role='super_admin'
  - organization_id = NULL
  - Document credentials securely

#### Create Seed Data (Development Only)
- ⬜ **DEP-004**: Create seed script for development
  - Create 3 test organizations
  - Create org admins for each
  - Create sample therapists and patients
  - Create system templates (prompts, surveys, reflections)

### Environment Configuration

#### Environment Variables
- ⬜ **DEP-005**: Update `.env.local` with required variables
  - All Firebase config variables
  - Database URL
  - GCS credentials
  - Deepgram API key
  - OpenAI API key

- ⬜ **DEP-006**: Update `.env.production` template
  - Document all required environment variables

### Deployment

#### Vercel Setup
- ⬜ **DEP-007**: Configure environment variables in Vercel dashboard
- ⬜ **DEP-008**: Deploy to staging environment
- ⬜ **DEP-009**: Run database migrations on staging
- ⬜ **DEP-010**: Smoke test all features on staging

#### Production Deployment
- ⬜ **DEP-011**: Deploy to production
- ⬜ **DEP-012**: Run database migrations on production
- ⬜ **DEP-013**: Create first production super admin account
- ⬜ **DEP-014**: Verify all features working in production

### Documentation

#### Code Documentation
- ⬜ **DOC-001**: Update CLAUDE.md with organization structure
  - Add organization multi-tenancy section
  - Document new API endpoints
  - Document RBAC patterns

- ⬜ **DOC-002**: Update README.md
  - Add multi-tenancy overview
  - Update setup instructions

- ⬜ **DOC-003**: Create API documentation
  - Document all new endpoints
  - Request/response examples
  - Authorization requirements

#### User Guides
- ⬜ **DOC-004**: Create Super Admin User Guide
  - How to create organizations
  - How to manage org admins
  - How to support organizations

- ⬜ **DOC-005**: Create Org Admin User Guide
  - How to manage users
  - How to approve pending signups
  - How to manage templates
  - How to configure settings

- ⬜ **DOC-006**: Create User Sign-Up Guide
  - How to get organization code
  - How to sign up
  - What to expect during approval

### Testing
- ⬜ **TEST-027**: Full regression testing on staging
- ⬜ **TEST-028**: Performance testing (query optimization)
- ⬜ **TEST-029**: Security testing (org boundary enforcement)
- ⬜ **TEST-030**: User acceptance testing with stakeholders

---

## Phase 7: Polish & Optimization (Weeks 16-17)

### Performance Optimization

#### Database Optimization
- ⬜ **OPT-001**: Analyze slow queries with Drizzle Studio
- ⬜ **OPT-002**: Add missing indexes if needed
- ⬜ **OPT-003**: Optimize org-scoped queries
- ⬜ **OPT-004**: Implement connection pooling for Neon
- ⬜ **OPT-005**: Add database query caching where appropriate

#### Caching
- ⬜ **OPT-006**: Implement caching for org settings
  - Redis or in-memory cache
  - Cache invalidation on settings update

- ⬜ **OPT-007**: Cache organization details
  - Reduce database queries for org info

- ⬜ **OPT-008**: Cache system templates
  - These rarely change

### UX Enhancements

#### Bulk Operations
- ⬜ **UX-001**: Add bulk user invite (CSV upload)
  - Upload CSV with therapist emails
  - Send invitations in batch

- ⬜ **UX-002**: Add bulk patient import
  - CSV upload for patient data
  - Assign to therapists

#### Analytics
- ⬜ **UX-003**: Add template usage analytics
  - Track which templates are most used
  - Show usage trends to org admins

- ⬜ **UX-004**: Add org admin notification system
  - Notify when user signs up
  - Notify when template submitted for approval
  - Email + in-app notifications

#### Mobile Responsiveness
- ⬜ **UX-005**: Test and fix org admin UI on mobile
  - Dashboard
  - User management
  - Template library
  - Settings

### Security & Compliance

#### HIPAA Compliance
- ⬜ **SEC-001**: Sign Business Associate Agreements (BAAs)
  - Neon (database)
  - Google Cloud Platform (Firebase, GCS)
  - Vercel (hosting)
  - Deepgram (transcription)
  - Sentry (error tracking)

- ⬜ **SEC-002**: Complete HIPAA risk assessment for multi-tenancy
- ⬜ **SEC-003**: Document data isolation architecture
- ⬜ **SEC-004**: Create incident response procedures
- ⬜ **SEC-005**: Implement data retention policies (7-year audit logs)

#### Security Enhancements
- ⬜ **SEC-006**: Implement rate limiting per organization (Arcjet)
- ⬜ **SEC-007**: Add IP allowlisting for sensitive operations
- ⬜ **SEC-008**: Implement MFA for org admin accounts
- ⬜ **SEC-009**: Add session timeout warnings
- ⬜ **SEC-010**: Implement CSRF protection

### Bug Fixes & Refinement
- ⬜ **BUG-001**: Address issues found during rollout
- ⬜ **BUG-002**: Refine RBAC edge cases
- ⬜ **BUG-003**: Improve error messages
- ⬜ **BUG-004**: Fix any UI/UX issues reported in testing

### Monitoring & Alerting
- ⬜ **MON-001**: Set up Sentry error alerts for org-related errors
- ⬜ **MON-002**: Create PostHog dashboards for org metrics
- ⬜ **MON-003**: Set up Better Stack logging for org operations
- ⬜ **MON-004**: Create alerts for:
  - Failed user approvals
  - Org join code usage spikes
  - Cross-org access attempts
  - Template approval backlogs

---

## Additional Tasks

### Audit Logging

#### Audit Log Enhancements
- ⬜ **AUD-001**: Add all new audit log action types
  - ORG_CREATED
  - ORG_SUSPENDED
  - ORG_REACTIVATED
  - ORG_JOIN_CODE_REGENERATED
  - ORG_JOIN_CODE_TOGGLED
  - USER_ROLE_CHANGED
  - USER_SIGNED_UP_PENDING
  - USER_APPROVED
  - USER_REJECTED
  - USER_TRANSFERRED_WITHIN_ORG
  - PATIENT_TRANSFERRED_CROSS_ORG
  - TEMPLATE_APPROVED
  - TEMPLATE_REJECTED
  - SUPER_ADMIN_ORG_ACCESS
  - ORG_SETTINGS_UPDATED
  - TEMPLATE_EXPORTED

- ⬜ **AUD-002**: Create `AuditLogService.ts`
  - logOrgCreation(orgId, adminId)
  - logUserRoleChange(userId, oldRole, newRole, changedBy, reason)
  - logUserApproval(userId, approvedBy)
  - logTemplateApproval(templateId, approvedBy)
  - logSuperAdminAccess(adminId, orgId, action)
  - etc.

### Email Notifications

#### Email Templates
- ⬜ **EMAIL-001**: Create email template for pending user notification (to org admin)
- ⬜ **EMAIL-002**: Create email template for user approval (to user)
- ⬜ **EMAIL-003**: Create email template for user rejection (to user)
- ⬜ **EMAIL-004**: Create email template for role change (to user)
- ⬜ **EMAIL-005**: Create email template for template approval (to therapist)
- ⬜ **EMAIL-006**: Create email template for template rejection (to therapist)
- ⬜ **EMAIL-007**: Create email template for patient transfer (to therapists)

### Error Handling

#### Error Messages
- ⬜ **ERR-001**: Define user-friendly error messages for all new errors
  - Invalid organization code
  - User pending approval (cannot log in)
  - Org boundary violation
  - Insufficient permissions for role change
  - Template approval errors

- ⬜ **ERR-002**: Create error pages
  - /pending-approval (already created)
  - /suspended-org (when org is suspended)
  - /unauthorized-org-access

---

## Testing Checklist

### Unit Tests
- ⬜ All RBAC middleware functions
- ⬜ Organization code generation and validation
- ⬜ Template scope logic
- ⬜ Audit logging functions
- ⬜ Email notification functions

### Integration Tests
- ⬜ Organization CRUD operations
- ⬜ User management workflows
- ⬜ Template library operations
- ⬜ Settings management
- ⬜ Org boundary enforcement

### E2E Tests
- ⬜ Super admin creates organization
- ⬜ Super admin invites org admin
- ⬜ Org admin approves pending user
- ⬜ User self-signup with org code
- ⬜ Therapist submits template for approval
- ⬜ Org admin approves template
- ⬜ Template appears in org library
- ⬜ Story page uses default templates
- ⬜ Super admin changes user role
- ⬜ Patient transfer within org

### Security Tests
- ⬜ Org boundary violations are blocked
- ⬜ Unauthorized role changes are blocked
- ⬜ Cross-org data access is blocked
- ⬜ Invalid org codes are rejected
- ⬜ Pending users cannot log in
- ⬜ Audit logs capture all actions

---

## Success Criteria

### Must-Have (P0) - Launch Blockers
- ✅ Super Admin can create 10+ organizations
- ✅ Each org has complete data isolation (no cross-org leaks)
- ✅ Org Admins can self-manage users (invite therapists, create patients, approve signups)
- ✅ Users can self-signup with organization code
- ✅ Org Admin can approve/reject pending users
- ✅ Super Admin can change user roles
- ✅ Template library system functional (system, org, private scopes)
- ✅ Template approval workflow operational
- ✅ All existing features work with org scoping (sessions, media, pages)
- ✅ Zero HIPAA compliance violations
- ✅ Audit logging for all org-level actions
- ✅ Organization join code management works

### Should-Have (P1) - Important Features
- ✅ Org settings (defaults, branding) configurable
- ✅ Template import/export working
- ✅ Patient transfer within org
- ✅ Org-level analytics dashboard
- ✅ Super admin read-only org view
- ✅ Email notifications for all workflows

### Nice-to-Have (P2) - Future Enhancements
- ⬜ Template usage analytics
- ⬜ Org admin notification system (in-app)
- ⬜ Advanced RBAC (custom roles per org)
- ⬜ Multi-region data residency
- ⬜ Bulk operations (CSV import)
- ⬜ MFA for org admins

---

## Notes

### Development Guidelines
1. **No Legacy Data**: This is a brand new app, so no migration scripts for existing data needed
2. **Test Coverage**: Aim for 80%+ coverage on all new features
3. **Type Safety**: All new code must be fully typed with TypeScript strict mode
4. **HIPAA First**: Every feature must be audited for HIPAA compliance before implementation
5. **Org Scoping**: Every query must be scoped to user's organization (except super_admin)
6. **Audit Everything**: All mutations must create audit log entries
7. **Email Notifications**: User-facing actions must trigger email notifications

### Decisions to Make
- [ ] Join code format (currently: XXXX-XXXX-XXXX, 15 chars)
- [ ] Default subscription tier for new orgs (recommend: trial)
- [ ] Trial period duration (recommend: 14 or 30 days)
- [ ] Max pending users per org (to prevent spam)
- [ ] Rate limits per organization
- [ ] Email service provider (SendGrid vs Resend vs Postmark)

### Dependencies
- Drizzle ORM (database migrations)
- Zod (validation schemas)
- Firebase Auth (authentication)
- React Hook Form (form handling)
- Tailwind CSS (styling)
- Lucide React (icons)
- Sentry (error tracking)
- PostHog (analytics)

---

**Last Updated**: 2025-11-06
**Total Tasks**: 300+
**Estimated Effort**: 16-17 weeks with 2-3 developers
