# PRD: Organization Multi-Tenancy & Admin Hierarchy

**Product**: StoryCare Digital Therapeutic Platform
**Feature**: Organization-Level Multi-Tenancy with Super Admin & Org Admin Roles
**Version**: 2.0
**Date**: 2025-11-06
**Status**: Planning

---

## Executive Summary

This PRD defines the transformation of StoryCare from a single-tenant application to a multi-tenant SaaS platform where multiple healthcare organizations (hospitals, clinics, private practices) can operate independently while sharing the same infrastructure. This includes a complete role hierarchy overhaul with **Super Admin** (platform-level) and **Organization Admin** (hospital-level) roles, along with a sophisticated template library system for sharing therapeutic content within organizations.

### Core Objectives

1. **Complete Data Isolation**: Each organization operates in a secure, HIPAA-compliant silo with no data leakage between organizations
2. **Scalable Administration**: Enable organizations to self-manage their therapists, patients, and content without platform intervention
3. **Standardized Therapeutic Content**: Allow organizations to create, approve, and share templates (prompts, surveys, reflections) across their therapists
4. **Flexible Support Model**: Super Admins can assist organizations when needed while delegating day-to-day management to Org Admins

---

## Table of Contents

1. [Background & Problem Statement](#1-background--problem-statement)
2. [User Personas](#2-user-personas)
3. [User Stories](#3-user-stories)
4. [Organization Management](#4-organization-management)
5. [Role Hierarchy & Permissions](#5-role-hierarchy--permissions)
6. [Template Library System](#6-template-library-system)
7. [Database Schema](#7-database-schema)
8. [API Specifications](#8-api-specifications)
9. [User Interface Requirements](#9-user-interface-requirements)
10. [Security & Compliance](#10-security--compliance)
11. [Migration Strategy](#11-migration-strategy)
12. [Success Metrics](#12-success-metrics)
13. [Implementation Phases](#13-implementation-phases)

---

## 1. Background & Problem Statement

### Current State

StoryCare currently operates as a **single-tenant application** where:
- All users (therapists, patients, admins) exist in one global namespace
- Admin role has unrestricted access to all data
- No organizational boundaries or hierarchies
- Therapists cannot share content (prompts, surveys) with colleagues
- No self-service organization management
- Not suitable for multi-hospital deployments

### Problems

1. **Not Scalable for B2B SaaS**: Cannot onboard multiple hospitals onto shared infrastructure
2. **No Data Isolation**: Hospital A can theoretically access Hospital B's patient data
3. **No Organizational Structure**: No way to represent "St. Mary's Hospital" as an entity
4. **Content Silos**: Each therapist recreates the same prompts/surveys instead of sharing org-wide
5. **Centralized Administration**: Platform admins must manage every organization's users manually
6. **No Hospital Branding**: Cannot customize experience per organization

### Desired State

A **multi-tenant SaaS platform** where:
- Organizations (hospitals) are first-class entities with complete data isolation
- Each organization has its own admin(s) who manage users and content
- Super Admins oversee the platform but delegate day-to-day management
- Organizations can standardize therapeutic approaches via shared template libraries
- Hospitals can self-onboard, configure settings, and manage their own users
- Complete HIPAA compliance with audit trails for cross-org access

---

## 2. User Personas

### Persona 1: Super Admin (Platform Administrator)

**Name**: Sarah Chen
**Role**: StoryCare Platform Administrator
**Organization**: StoryCare (the company)
**Responsibilities**:
- Onboard new healthcare organizations
- Create and manage Organization Admins
- Monitor platform health and usage
- Provide tier-2 support for organizations
- Manage system-wide template library
- Handle data migrations and emergency interventions

**Goals**:
- Scale StoryCare to 100+ organizations
- Minimize support tickets by enabling org self-service
- Ensure HIPAA compliance across all organizations
- Monitor platform usage and growth metrics

**Pain Points**:
- Currently must manually manage every user across all organizations
- No visibility into which users belong to which organization
- No way to delegate administrative tasks to hospitals

**Needs**:
- Dashboard showing all organizations and their status
- Ability to view (read-only) any organization's data for support
- Quick organization creation and setup workflow
- Audit logs showing cross-org access

---

### Persona 2: Organization Admin (Hospital Administrator)

**Name**: Dr. Michael Torres
**Role**: Clinical Director
**Organization**: Healing Waters Treatment Center
**Responsibilities**:
- Onboard new therapists to the organization
- Create patient accounts for therapists
- Standardize therapeutic approaches across the clinic
- Review and approve therapist-created content for org-wide sharing
- Configure organization settings and branding
- Monitor therapist productivity and patient engagement

**Goals**:
- Ensure consistent quality of care across all therapists
- Reduce therapist onboarding time by providing standardized templates
- Maintain compliance with hospital policies and HIPAA
- Track organizational KPIs (patient engagement, therapist utilization)

**Pain Points**:
- Therapists recreate the same prompts and surveys independently
- No way to enforce standardized reflection questions
- Cannot see org-level analytics
- Must contact StoryCare support to add new therapists

**Needs**:
- Self-service user management (invite therapists, create patients)
- Template library for prompts, surveys, reflections
- Approval workflow for therapist-created content
- Organization settings dashboard
- Org-level analytics and reporting

---

### Persona 3: Therapist (Organizational User)

**Name**: Jessica Martinez, LMFT
**Role**: Licensed Marriage and Family Therapist
**Organization**: Healing Waters Treatment Center
**Responsibilities**:
- (Same as current StoryCare therapist role)
- Use org-approved templates for consistency
- Submit useful prompts for org-wide sharing

**Goals**:
- Access pre-approved therapeutic prompts from colleagues
- Save time by using org templates instead of creating from scratch
- Share successful therapeutic content with team

**Pain Points**:
- Currently recreates same reflection questions for every patient
- No way to see what prompts other therapists find effective
- No standardization from organizational leadership

**Needs**:
- Access to organization template library
- Ability to submit personal templates for org approval
- Search/filter org templates by category and rating

---

### Persona 4: Patient (Organizational End-User)

**Name**: Alex Johnson
**Role**: Patient
**Organization**: Healing Waters Treatment Center (through therapist)
**Responsibilities**:
- (Unchanged from current StoryCare patient role)

**Impact of Changes**:
- Transparent to patient - they don't see organizational structure
- May see org-branded story pages (future enhancement)
- Benefits from standardized, high-quality therapeutic content

---

## 3. User Stories

### Epic 1: Organization Management

#### Story 1.1: Create New Organization (Super Admin)
**As a** Super Admin
**I want to** create a new organization with basic details
**So that** a new hospital can start using StoryCare

**Acceptance Criteria**:
- [ ] Can create organization with: name, slug (URL-safe), contact email
- [ ] System auto-generates unique organization ID (UUID)
- [ ] Can optionally set: logo, primary color, subscription tier
- [ ] Organization appears in Super Admin dashboard immediately
- [ ] Audit log records organization creation

**Story 1.2: Invite Organization Admin (Super Admin)**
**As a** Super Admin
**I want to** create the first Organization Admin account for a new hospital
**So that** they can manage their organization independently

**Acceptance Criteria**:
- [ ] Can create user with role "org_admin" and assign to organization
- [ ] System sends email invitation with setup link
- [ ] Org Admin can set password via Firebase Authentication
- [ ] Org Admin automatically has access to their org's admin panel
- [ ] Cannot create org admin without assigning to an organization

**Story 1.3: View Organization Dashboard (Super Admin)**
**As a** Super Admin
**I want to** see all organizations and their key metrics
**So that** I can monitor platform health and identify issues

**Acceptance Criteria**:
- [ ] Dashboard shows list of all organizations
- [ ] For each org: name, # therapists, # patients, # active sessions (last 30 days), created date, status
- [ ] Can filter by: status (active, suspended), subscription tier
- [ ] Can search by organization name
- [ ] Can click to drill down into specific organization

**Story 1.4: Suspend/Reactivate Organization (Super Admin)**
**As a** Super Admin
**I want to** suspend an organization's access
**So that** I can enforce billing or compliance issues

**Acceptance Criteria**:
- [ ] Can mark organization as "suspended"
- [ ] All users in suspended org cannot log in (auth blocked)
- [ ] Data remains intact (soft suspension)
- [ ] Can reactivate with one click
- [ ] Audit log records suspension reason and timestamp

---

### Epic 2: Organization Admin Management

**Story 2.1: Invite Therapist (Organization Admin)**
**As an** Organization Admin
**I want to** invite a therapist to join my organization
**So that** they can start creating sessions for their patients

**Acceptance Criteria**:
- [ ] Can enter therapist email, name, license number, specialty
- [ ] System creates user with role "therapist" in my organization
- [ ] System sends email invitation with setup link
- [ ] Therapist appears in my organization's user list immediately
- [ ] Cannot invite therapist to a different organization
- [ ] Duplicate email check (across all orgs)

**Story 2.2: Create Patient (Organization Admin)**
**As an** Organization Admin
**I want to** create patient accounts and assign them to therapists
**So that** I can manage patient onboarding centrally

**Acceptance Criteria**:
- [ ] Can create patient with: name, email, date of birth
- [ ] Must assign to a therapist in my organization
- [ ] System creates user with role "patient" in my organization
- [ ] Patient appears in assigned therapist's patient list
- [ ] Cannot assign patient to therapist in different org

**Story 2.3: View Organization Users (Organization Admin)**
**As an** Organization Admin
**I want to** see all users in my organization
**So that** I can manage access and monitor activity

**Acceptance Criteria**:
- [ ] User list showing: name, email, role, status, last login, created date
- [ ] Can filter by role: therapist, patient
- [ ] Can search by name or email
- [ ] Can sort by: name, created date, last login
- [ ] Can view user details and activity

**Story 2.4: Deactivate User (Organization Admin)**
**As an** Organization Admin
**I want to** deactivate a therapist or patient
**So that** I can offboard users while preserving data

**Acceptance Criteria**:
- [ ] Can mark user as "inactive"
- [ ] Inactive users cannot log in
- [ ] Data remains intact (soft delete)
- [ ] Can reactivate users later
- [ ] Deactivating therapist does not delete their patients

**Story 2.5: Transfer Patient Between Therapists (Organization Admin)**
**As an** Organization Admin
**I want to** transfer a patient from one therapist to another
**So that** I can handle therapist transitions or workload balancing

**Acceptance Criteria**:
- [ ] Can select patient and new therapist (must be in same org)
- [ ] All patient data (sessions, media, pages) transfers to new therapist
- [ ] Audit log records transfer with reason
- [ ] Old therapist loses access to patient
- [ ] New therapist gains access immediately

---

### Epic 3: Template Library System

**Story 3.1: View System Templates (All Roles)**
**As a** therapist or org admin
**I want to** browse StoryCare's curated system templates
**So that** I can use professionally-designed therapeutic content

**Acceptance Criteria**:
- [ ] Can view all system templates (prompts, surveys, reflections)
- [ ] System templates marked with "System" badge
- [ ] Can filter by category: analysis, image-generation, video-generation, reflection
- [ ] Can preview full template content
- [ ] Cannot edit system templates
- [ ] Can copy system template to org library

**Story 3.2: Copy System Template to Org Library (Organization Admin)**
**As an** Organization Admin
**I want to** import a system template into my organization's library
**So that** my therapists can use it and I can customize it for our needs

**Acceptance Criteria**:
- [ ] Can click "Import to Org" on any system template
- [ ] Template copied to org library with "Imported from System" note
- [ ] Can edit imported template (creates org-specific version)
- [ ] Original system template unchanged
- [ ] Imported template immediately available to all org therapists

**Story 3.3: Create Organization Template (Organization Admin)**
**As an** Organization Admin
**I want to** create a new therapeutic prompt/survey/reflection
**So that** I can standardize approaches across my organization

**Acceptance Criteria**:
- [ ] Can create template with: title, category, content
- [ ] Template marked as "Organization" scope
- [ ] Immediately available to all therapists in org
- [ ] Not visible to other organizations
- [ ] Can edit or delete org templates

**Story 3.4: Submit Template for Org Approval (Therapist)**
**As a** therapist
**I want to** submit my personal template for organization-wide use
**So that** my colleagues can benefit from content I've created

**Acceptance Criteria**:
- [ ] Can click "Submit for Org Sharing" on private template
- [ ] Template status changes to "pending_approval"
- [ ] Org Admin notified of pending template
- [ ] Template remains in my private library during review
- [ ] Can include note to org admin explaining use case

**Story 3.5: Review and Approve Template (Organization Admin)**
**As an** Organization Admin
**I want to** review therapist-submitted templates and approve/reject them
**So that** I can maintain quality control over org-wide content

**Acceptance Criteria**:
- [ ] See list of pending templates with: submitter, title, category, submission date
- [ ] Can preview full template content
- [ ] Can approve, reject, or request changes
- [ ] If approved: template moved to org library, visible to all therapists
- [ ] If rejected: template remains private, submitter notified with reason
- [ ] Audit log records approval decision

**Story 3.6: Set Default Questions (Organization Admin)**
**As an** Organization Admin
**I want to** configure default reflection questions and surveys
**So that** every story page includes consistent therapeutic prompts

**Acceptance Criteria**:
- [ ] Can select up to 5 default reflection questions
- [ ] Can select default survey (e.g., PHQ-9, GAD-7)
- [ ] Defaults auto-populate when therapist creates new story page
- [ ] Therapist can remove or add to defaults (not enforced)
- [ ] Settings saved in organization config

---

### Epic 4: Super Admin Support & Access

**Story 4.1: View Organization as Super Admin (Read-Only)**
**As a** Super Admin
**I want to** view any organization's data in read-only mode
**So that** I can troubleshoot support tickets

**Acceptance Criteria**:
- [ ] Can "impersonate" organization context (read-only)
- [ ] See all data as if I were org admin: users, sessions, templates
- [ ] Cannot create, edit, or delete data
- [ ] "Super Admin View" banner displayed prominently
- [ ] Audit log records which org I accessed and when
- [ ] Can exit to return to super admin dashboard

**Story 4.2: Emergency Patient Transfer (Super Admin)**
**As a** Super Admin
**I want to** transfer a patient between organizations
**So that** I can handle data migration or hospital mergers

**Acceptance Criteria**:
- [ ] Can select patient and target organization
- [ ] System validates target org has available therapist
- [ ] Must enter reason for cross-org transfer
- [ ] All patient data moves to new org
- [ ] Audit log records transfer with full details
- [ ] Requires confirmation (irreversible action)
- [ ] Email notification sent to both org admins

**Story 4.3: Change User Role (Super Admin)**
**As a** Super Admin
**I want to** change a user's role within their organization
**So that** I can handle promotions, demotions, or role corrections

**Acceptance Criteria**:
- [ ] Can change user role to any role (patient, therapist, org_admin)
- [ ] User must stay in same organization (cannot change org via role change)
- [ ] Must enter reason for role change
- [ ] Requires confirmation
- [ ] Audit log records role change with reason
- [ ] Email notification sent to user
- [ ] Common use cases: promote therapist to org_admin, convert patient to peer support therapist

**Story 4.4: Export Org Templates (Organization Admin)**
**As an** Organization Admin
**I want to** export my organization's templates as JSON/CSV
**So that** I can back up our content or migrate to another system

**Acceptance Criteria**:
- [ ] Can click "Export Templates" button
- [ ] Select format: JSON (full data) or CSV (summary)
- [ ] System generates downloadable file
- [ ] Includes all org and therapist-approved templates
- [ ] Does not include system templates (already accessible)
- [ ] Audit log records export

---

### Epic 5: User Onboarding & Self-Signup

**Story 5.1: Sign Up with Organization Code (New User)**
**As a** new user
**I want to** sign up for StoryCare using my organization's code
**So that** I can join my hospital's StoryCare organization

**Acceptance Criteria**:
- [ ] Sign-up page includes "Organization Code" field
- [ ] Can enter organization code (e.g., "HEAL-WATERS-2025")
- [ ] System validates code exists and is enabled
- [ ] If valid: creates user account with status "pending_approval"
- [ ] If invalid: shows error "Invalid organization code"
- [ ] User assigned to organization matching the code
- [ ] Org Admin notified of pending user
- [ ] User sees "Pending Approval" message after sign-up

**Story 5.2: Approve Pending User (Organization Admin)**
**As an** Organization Admin
**I want to** approve users who signed up with my org code
**So that** I can control who joins my organization

**Acceptance Criteria**:
- [ ] See "Pending Users" count in dashboard
- [ ] Can view list of pending users with: name, email, signup date
- [ ] Can approve pending user (sets status to "active", assigns role)
- [ ] Can reject pending user (deletes account, sends notification)
- [ ] Must select role when approving (therapist or patient typically)
- [ ] If therapist: can optionally assign patients during approval
- [ ] User notified via email when approved or rejected
- [ ] Audit log records approval decision

**Story 5.3: Manage Organization Join Code (Organization Admin)**
**As an** Organization Admin
**I want to** manage my organization's join code
**So that** I can control access and maintain security

**Acceptance Criteria**:
- [ ] Can view current organization code in settings
- [ ] Can regenerate code (creates new random code)
- [ ] Can enable/disable code (temporarily prevent new signups)
- [ ] Can copy code to clipboard for sharing
- [ ] Old code immediately invalidated when regenerated
- [ ] Audit log records code regeneration
- [ ] Warning shown before regenerating (users with old code can't join)

---

## 4. Organization Management

### Organization Entity

**Definition**: An organization represents a healthcare entity (hospital, clinic, private practice group) that operates independently within StoryCare.

**Key Attributes**:
```typescript
Organization {
  id: UUID (primary key)
  name: string (e.g., "Healing Waters Treatment Center")
  slug: string (URL-safe, unique, e.g., "healing-waters")
  contactEmail: string
  logoUrl: string | null
  primaryColor: string | null (hex code for branding)

  // Self-signup join code
  joinCode: string (unique, e.g., "HEAL-WATERS-2025")
  joinCodeEnabled: boolean (default: true)

  settings: JSONB {
    subscriptionTier: 'free' | 'basic' | 'professional' | 'enterprise'
    features: {
      maxTherapists: number | null (null = unlimited)
      maxPatients: number | null
      aiCreditsPerMonth: number
      storageGB: number
    }
    defaults: {
      reflectionQuestions: UUID[] (template IDs)
      surveyTemplate: UUID | null
      sessionTranscriptionEnabled: boolean
    }
    branding: {
      welcomeMessage: string | null
      supportEmail: string | null
    }
  }
  status: 'active' | 'suspended' | 'trial'
  trialEndsAt: timestamp | null
  createdAt: timestamp
  updatedAt: timestamp
  createdBy: UUID (super admin who created it)
}
```

### Organization Lifecycle

**1. Creation (Super Admin)**
```
Super Admin creates org →
Org record created in DB →
Unique slug generated →
Default settings applied →
Audit log entry created
```

**2. Setup (Super Admin)**
```
Invite first Org Admin →
Admin receives email →
Admin sets password (Firebase) →
Admin logs in →
Admin sees setup wizard
```

**3. Configuration (Organization Admin)**
```
Org Admin completes setup wizard:
1. Upload logo (optional)
2. Import system templates
3. Configure default questions
4. Invite first therapist
```

**4. Daily Operations (Organization Admin)**
```
- Invite therapists
- Create patients
- Review template approvals
- Monitor org analytics
- Adjust settings
```

**5. Growth & Scaling**
```
Org hits subscription limits →
Super Admin upgrades tier →
New limits applied →
Org can continue growth
```

**6. Suspension (Super Admin)**
```
Payment failure / compliance issue →
Super Admin suspends org →
All org users blocked from login →
Data preserved (read-only) →
Org Admin notified via email
```

**7. Reactivation (Super Admin)**
```
Issue resolved →
Super Admin reactivates →
Users can log in again →
Full functionality restored
```

---

## 5. Role Hierarchy & Permissions

### Role Definitions

```typescript
enum UserRole {
  SUPER_ADMIN = 'super_admin', // Platform administrator
  ORG_ADMIN = 'org_admin', // Organization administrator
  THERAPIST = 'therapist', // Clinical therapist
  PATIENT = 'patient' // Patient/client
}
```

### Organizational Membership

| Role | Organization Required | Organization Access |
|------|----------------------|---------------------|
| Super Admin | No (global) | All organizations (read-only, special write for support) |
| Org Admin | Yes (one org) | Own organization only |
| Therapist | Yes (one org) | Own organization only |
| Patient | Yes (one org, via therapist) | Own data only |

### Permission Matrix

| Action | Super Admin | Org Admin | Therapist | Patient |
|--------|-------------|-----------|-----------|---------|
| **Organizations** |
| Create organization | ✅ | ❌ | ❌ | ❌ |
| View all organizations | ✅ | ❌ | ❌ | ❌ |
| View own organization | ✅ | ✅ | ✅ (limited) | ❌ |
| Edit organization settings | ✅ (all orgs) | ✅ (own org) | ❌ | ❌ |
| Suspend organization | ✅ | ❌ | ❌ | ❌ |
| Delete organization | ✅ | ❌ | ❌ | ❌ |
| **Users (within org)** |
| Create org admin | ✅ | ❌ | ❌ | ❌ |
| Create therapist | ✅ (any org) | ✅ (own org) | ❌ | ❌ |
| Create patient | ✅ (any org) | ✅ (own org) | ✅ (for self) | ❌ |
| View all users in org | ✅ (all orgs) | ✅ (own org) | ✅ (assigned patients) | ❌ |
| Edit user in org | ✅ (all orgs) | ✅ (own org) | ✅ (assigned patients) | ❌ |
| Change user role | ✅ (any user, same org) | ❌ | ❌ | ❌ |
| Deactivate user | ✅ (all orgs) | ✅ (own org) | ❌ | ❌ |
| Approve pending user | ✅ (all orgs) | ✅ (own org) | ❌ | ❌ |
| Transfer patient (within org) | ✅ (all orgs) | ✅ (own org) | ❌ | ❌ |
| Transfer patient (cross-org) | ✅ | ❌ | ❌ | ❌ |
| **Templates** |
| View system templates | ✅ | ✅ | ✅ | ❌ |
| Edit system templates | ✅ | ❌ | ❌ | ❌ |
| Create org template | ✅ (any org) | ✅ (own org) | ❌ | ❌ |
| View org templates | ✅ (all orgs) | ✅ (own org) | ✅ (own org) | ❌ |
| Edit org templates | ✅ (any org) | ✅ (own org) | ❌ | ❌ |
| Approve therapist templates | ✅ (any org) | ✅ (own org) | ❌ | ❌ |
| Create private template | ✅ | ✅ | ✅ | ❌ |
| Submit template for approval | ✅ | ✅ | ✅ | ❌ |
| Export org templates | ✅ (all orgs) | ✅ (own org) | ❌ | ❌ |
| **Sessions & Patient Data** |
| View any org's sessions | ✅ (read-only) | ✅ (own org) | ✅ (assigned patients) | ✅ (own) |
| Create session | ✅ (any org) | ✅ (own org) | ✅ | ❌ |
| Edit session | ✅ (any org) | ✅ (own org) | ✅ (own) | ❌ |
| Delete session | ✅ (any org) | ✅ (own org) | ✅ (own) | ❌ |
| **Analytics** |
| View platform analytics | ✅ | ❌ | ❌ | ❌ |
| View org analytics | ✅ (all orgs) | ✅ (own org) | ❌ | ❌ |
| View therapist analytics | ✅ (all orgs) | ✅ (own org) | ✅ (own) | ❌ |
| **Audit Logs** |
| View all audit logs | ✅ | ❌ | ❌ | ❌ |
| View org audit logs | ✅ | ✅ (own org) | ❌ | ❌ |

### Role Enforcement

**At Database Level**:
- Foreign key constraints ensure users belong to valid organization
- Check constraints prevent invalid role-org combinations
  - Example: `super_admin` must have `organizationId = NULL`
  - Example: `org_admin`, `therapist`, `patient` must have `organizationId NOT NULL`

**At Application Level (Middleware)**:
```typescript
// Org boundary check
function requireSameOrg(userOrgId: string, resourceOrgId: string): void {
  if (userOrgId !== resourceOrgId) {
    throw new ForbiddenError('Cannot access resource from different organization');
  }
}

// Role-based access check
function requireOrgAdmin(user: AuthenticatedUser): void {
  if (user.role !== 'org_admin' && user.role !== 'super_admin') {
    throw new ForbiddenError('Org Admin role required');
  }
}

// Super admin special access (with audit logging)
function allowSuperAdminReadOnly(user: AuthenticatedUser, orgId: string): void {
  if (user.role === 'super_admin') {
    auditLog({
      action: 'SUPER_ADMIN_ORG_ACCESS',
      userId: user.dbUserId,
      organizationId: orgId,
      accessType: 'read',
      timestamp: new Date()
    });
    return; // Allow access
  }
  throw new ForbiddenError('Insufficient permissions');
}
```

---

## 6. Template Library System

### Template Scopes

StoryCare implements a **three-tier template system**:

| Scope | Created By | Visible To | Editable By | Use Case |
|-------|-----------|------------|-------------|----------|
| **System** | Super Admin | All users (all orgs) | Super Admin only | StoryCare's curated, professionally-designed templates |
| **Organization** | Org Admin or Approved Therapist | All users in org | Org Admin only | Organization-standardized templates (e.g., hospital-specific protocols) |
| **Private** | Therapist | Creator only | Creator only | Therapist's personal templates (draft or specialized) |

### Template Types

**1. Therapeutic Prompts**
```typescript
TherapeuticPrompt {
  id: UUID
  scope: 'system' | 'organization' | 'private'
  organizationId: UUID | null  // null for system, required for org/private
  createdBy: UUID (user ID)
  approvedBy: UUID | null (org admin who approved, if org scope)
  approvedAt: timestamp | null

  title: string
  category: 'analysis' | 'image-generation' | 'video-generation' | 'reflection'
  promptText: text
  variables: string[] | null  // e.g., ['patientName', 'sessionTopic']

  status: 'active' | 'pending_approval' | 'rejected' | 'archived'
  rejectionReason: string | null

  isFavorite: boolean (per-user favorite flag)
  useCount: number

  createdAt: timestamp
  updatedAt: timestamp
}
```

**2. Survey Templates**
```typescript
SurveyTemplate {
  id: UUID
  scope: 'system' | 'organization' | 'private'
  organizationId: UUID | null
  createdBy: UUID
  approvedBy: UUID | null
  approvedAt: timestamp | null

  title: string
  description: text
  category: 'screening' | 'outcome' | 'satisfaction' | 'custom'

  questions: JSONB[] {
    questionText: string
    questionType: 'multiple_choice' | 'scale' | 'yes_no' | 'text'
    options: string[] | null  // for multiple_choice
    scaleMin: number | null   // for scale (e.g., 1)
    scaleMax: number | null   // for scale (e.g., 10)
    scaleLabels: { min: string, max: string } | null  // e.g., {min: 'Not at all', max: 'Extremely'}
    required: boolean
    order: number
  }[]

  status: 'active' | 'pending_approval' | 'rejected' | 'archived'
  rejectionReason: string | null

  useCount: number

  createdAt: timestamp
  updatedAt: timestamp
}
```

**3. Reflection Templates**
```typescript
ReflectionTemplate {
  id: UUID
  scope: 'system' | 'organization' | 'private'
  organizationId: UUID | null
  createdBy: UUID
  approvedBy: UUID | null
  approvedAt: timestamp | null

  title: string
  description: text
  category: 'narrative' | 'emotion' | 'goal-setting' | 'custom'

  questions: JSONB[] {
    questionText: string
    placeholder: string | null  // hint for patient
    required: boolean
    order: number
  }[]

  status: 'active' | 'pending_approval' | 'rejected' | 'archived'
  rejectionReason: string | null

  useCount: number

  createdAt: timestamp
  updatedAt: timestamp
}
```

### Template Approval Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ Therapist Creates Private Template                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
       ┌──────────────────────┐
       │ Private Template      │ ◄─── Therapist can use immediately
       │ status: 'active'      │
       └──────────┬────────────┘
                  │
                  │ Therapist clicks "Submit for Org Sharing"
                  ▼
       ┌──────────────────────┐
       │ status:               │
       │ 'pending_approval'    │
       └──────────┬────────────┘
                  │
                  ▼
       ┌──────────────────────────────────┐
       │ Org Admin Reviews in             │
       │ "Pending Templates" Queue        │
       └──────────┬───────────────────────┘
                  │
       ┌──────────┴─────────┐
       ▼                    ▼
┌──────────────┐    ┌─────────────────┐
│ APPROVE      │    │ REJECT          │
└──────┬───────┘    └────────┬────────┘
       │                     │
       ▼                     ▼
┌──────────────────┐  ┌──────────────────────┐
│ scope: 'org'     │  │ status: 'rejected'   │
│ status: 'active' │  │ scope: 'private'     │
│ approvedBy: ID   │  │ rejectionReason: ... │
│ approvedAt: now  │  │                      │
└──────┬───────────┘  └──────────────────────┘
       │
       ▼
┌──────────────────────────┐
│ Visible to all org       │
│ therapists in library    │
└──────────────────────────┘
```

### Template Import/Export

**Import from System Library**:
1. Org Admin browses system templates
2. Clicks "Import to Org" on desired template
3. System creates new template record:
   - `scope: 'organization'`
   - `organizationId: [org_admin's_org_id]`
   - `createdBy: [org_admin_id]`
   - `metadata.importedFrom: [system_template_id]`
   - Copy all content fields
4. Template immediately available to all org therapists

**Export Org Templates**:
1. Org Admin clicks "Export Templates" in settings
2. Selects format: JSON (full) or CSV (summary)
3. System generates file with all templates where:
   - `scope: 'organization'` AND `organizationId: [org_id]`
   - OR `scope: 'private'` AND `createdBy IN [org_therapists]` AND `status: 'active'`
4. File downloaded locally
5. Audit log records export action

---

## 7. Database Schema

### New Tables

#### 7.1 Organizations Table

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7),  -- Hex color code

  -- Self-signup join code
  join_code VARCHAR(50) UNIQUE NOT NULL,
  join_code_enabled BOOLEAN NOT NULL DEFAULT true,

  settings JSONB NOT NULL DEFAULT '{
    "subscriptionTier": "trial",
    "features": {
      "maxTherapists": 5,
      "maxPatients": 50,
      "aiCreditsPerMonth": 1000,
      "storageGB": 10
    },
    "defaults": {
      "reflectionQuestions": [],
      "surveyTemplate": null,
      "sessionTranscriptionEnabled": true
    },
    "branding": {
      "welcomeMessage": null,
      "supportEmail": null
    }
  }'::jsonb,

  status VARCHAR(20) NOT NULL DEFAULT 'trial'
    CHECK (status IN ('active', 'trial', 'suspended')),
  trial_ends_at TIMESTAMP,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id)  -- Super admin who created it
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_join_code ON organizations(join_code);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_created_by ON organizations(created_by);
```

#### 7.2 Survey Templates Table

```sql
CREATE TABLE survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scope & Ownership
  scope VARCHAR(20) NOT NULL CHECK (scope IN ('system', 'organization', 'private')),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,

  -- Content
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('screening', 'outcome', 'satisfaction', 'custom')),

  questions JSONB NOT NULL,  -- Array of question objects

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending_approval', 'rejected', 'archived')),
  rejection_reason TEXT,

  -- Metadata
  use_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT survey_templates_scope_org_check
    CHECK (
      (scope = 'system' AND organization_id IS NULL) OR
      (scope IN ('organization', 'private') AND organization_id IS NOT NULL)
    )
);

CREATE INDEX idx_survey_templates_scope ON survey_templates(scope);
CREATE INDEX idx_survey_templates_org_id ON survey_templates(organization_id);
CREATE INDEX idx_survey_templates_created_by ON survey_templates(created_by);
CREATE INDEX idx_survey_templates_status ON survey_templates(status);
CREATE INDEX idx_survey_templates_category ON survey_templates(category);
```

#### 7.3 Reflection Templates Table

```sql
CREATE TABLE reflection_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scope & Ownership (same pattern as survey_templates)
  scope VARCHAR(20) NOT NULL CHECK (scope IN ('system', 'organization', 'private')),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP,

  -- Content
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('narrative', 'emotion', 'goal-setting', 'custom')),

  questions JSONB NOT NULL,  -- Array of question objects

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending_approval', 'rejected', 'archived')),
  rejection_reason TEXT,

  -- Metadata
  use_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT reflection_templates_scope_org_check
    CHECK (
      (scope = 'system' AND organization_id IS NULL) OR
      (scope IN ('organization', 'private') AND organization_id IS NOT NULL)
    )
);

CREATE INDEX idx_reflection_templates_scope ON reflection_templates(scope);
CREATE INDEX idx_reflection_templates_org_id ON reflection_templates(organization_id);
CREATE INDEX idx_reflection_templates_created_by ON reflection_templates(created_by);
CREATE INDEX idx_reflection_templates_status ON reflection_templates(status);
CREATE INDEX idx_reflection_templates_category ON reflection_templates(category);
```

### Modified Tables

#### 7.4 Users Table (Add organizationId)

```sql
-- Add organization_id column
ALTER TABLE users
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE RESTRICT;

-- Add user status for approval workflow
ALTER TABLE users
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending_approval', 'active', 'inactive'));

-- Update role enum to include new roles
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'org_admin';

-- Add constraint: super_admin must have NULL org_id
ALTER TABLE users
  ADD CONSTRAINT users_super_admin_org_check
  CHECK (
    (role = 'super_admin' AND organization_id IS NULL) OR
    (role IN ('org_admin', 'therapist', 'patient') AND organization_id IS NOT NULL)
  );

-- Add constraint: therapist_id must be in same org as patient
ALTER TABLE users
  ADD CONSTRAINT users_therapist_same_org_check
  CHECK (
    role != 'patient' OR
    therapist_id IS NULL OR
    EXISTS (
      SELECT 1 FROM users t
      WHERE t.id = therapist_id
      AND t.organization_id = organization_id
    )
  );

-- Create indexes
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_role_org ON users(role, organization_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_org_status ON users(organization_id, status);
```

#### 7.5 Groups Table (Add organizationId)

```sql
ALTER TABLE groups
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Backfill: set org_id from therapist's org_id
UPDATE groups g
SET organization_id = (
  SELECT u.organization_id
  FROM users u
  WHERE u.id = g.therapist_id
);

ALTER TABLE groups
  ALTER COLUMN organization_id SET NOT NULL;

CREATE INDEX idx_groups_organization_id ON groups(organization_id);
```

#### 7.6 Therapeutic Prompts Table (Add scope & organizationId)

```sql
-- Add new columns
ALTER TABLE therapeutic_prompts
  ADD COLUMN scope VARCHAR(20) NOT NULL DEFAULT 'private'
    CHECK (scope IN ('system', 'organization', 'private')),
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN approved_by UUID REFERENCES users(id),
  ADD COLUMN approved_at TIMESTAMP,
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending_approval', 'rejected', 'archived')),
  ADD COLUMN rejection_reason TEXT;

-- Add constraint: scope and org_id relationship
ALTER TABLE therapeutic_prompts
  ADD CONSTRAINT therapeutic_prompts_scope_org_check
  CHECK (
    (scope = 'system' AND organization_id IS NULL) OR
    (scope IN ('organization', 'private') AND organization_id IS NOT NULL)
  );

-- Backfill existing prompts
UPDATE therapeutic_prompts
SET organization_id = (
  SELECT u.organization_id
  FROM users u
  WHERE u.id = therapeutic_prompts.therapist_id
)
WHERE therapist_id IS NOT NULL;

-- System prompts (therapist_id IS NULL) keep org_id as NULL

-- Create indexes
CREATE INDEX idx_therapeutic_prompts_scope ON therapeutic_prompts(scope);
CREATE INDEX idx_therapeutic_prompts_org_id ON therapeutic_prompts(organization_id);
CREATE INDEX idx_therapeutic_prompts_status ON therapeutic_prompts(status);
```

#### 7.7 Audit Logs Table (Add organizationId)

```sql
ALTER TABLE audit_logs
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Backfill: set org_id from user's org_id
UPDATE audit_logs a
SET organization_id = (
  SELECT u.organization_id
  FROM users u
  WHERE u.id = a.user_id
)
WHERE user_id IS NOT NULL;

CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_org_action ON audit_logs(organization_id, action);
```

### Database Constraints Summary

**Organization Isolation**:
- ✅ Users belong to one organization (except super_admin)
- ✅ Patients can only be assigned to therapists in same org
- ✅ Groups scoped to organization
- ✅ Templates scoped to system/org/private

**Data Integrity**:
- ✅ Cascade delete: org deleted → users, groups, templates deleted
- ✅ Restrict delete: org deleted → blocked if has patients with data
- ✅ Foreign key constraints enforce relationships

**Role Validation**:
- ✅ super_admin must have NULL organization_id
- ✅ Other roles must have non-NULL organization_id
- ✅ Template scope matches organization_id (system=NULL, org/private=NOT NULL)

---

## 8. API Specifications

### 8.1 Organization Management APIs

#### `POST /api/super-admin/organizations`
**Description**: Create new organization (Super Admin only)

**Request**:
```json
{
  "name": "Healing Waters Treatment Center",
  "slug": "healing-waters",
  "contactEmail": "admin@healingwaters.com",
  "logoUrl": "https://storage.googleapis.com/...",
  "primaryColor": "#4F46E5",
  "subscriptionTier": "professional"
}
```

**Response** (201):
```json
{
  "organization": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Healing Waters Treatment Center",
    "slug": "healing-waters",
    "contactEmail": "admin@healingwaters.com",
    "status": "trial",
    "trialEndsAt": "2025-12-06T00:00:00Z",
    "createdAt": "2025-11-06T10:30:00Z"
  }
}
```

**Authorization**: `requireRole(['super_admin'])`

---

#### `GET /api/super-admin/organizations`
**Description**: List all organizations with metrics (Super Admin only)

**Query Params**:
- `status` (optional): 'active' | 'trial' | 'suspended'
- `search` (optional): Search by name
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response** (200):
```json
{
  "organizations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Healing Waters Treatment Center",
      "slug": "healing-waters",
      "status": "active",
      "metrics": {
        "therapistCount": 12,
        "patientCount": 145,
        "activeSessionsLast30Days": 87
      },
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

**Authorization**: `requireRole(['super_admin'])`

---

#### `GET /api/super-admin/organizations/:id`
**Description**: Get organization details with full metrics (Super Admin only)

**Response** (200):
```json
{
  "organization": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Healing Waters Treatment Center",
    "slug": "healing-waters",
    "contactEmail": "admin@healingwaters.com",
    "logoUrl": "https://...",
    "primaryColor": "#4F46E5",
    "settings": {
      "subscriptionTier": "professional",
      "features": {
        "maxTherapists": 20,
        "maxPatients": 200,
        "aiCreditsPerMonth": 5000
      },
      "defaults": {
        "reflectionQuestions": ["uuid1", "uuid2"]
      }
    },
    "status": "active",
    "metrics": {
      "therapistCount": 12,
      "activeTherapistCount": 10,
      "patientCount": 145,
      "activePatientCount": 120,
      "totalSessions": 856,
      "sessionsLast30Days": 87,
      "storageUsedGB": 3.2,
      "aiCreditsUsedThisMonth": 1240
    },
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-11-01T08:15:00Z"
  }
}
```

**Authorization**: `requireRole(['super_admin'])`

---

#### `PATCH /api/super-admin/organizations/:id`
**Description**: Update organization settings or status (Super Admin only)

**Request**:
```json
{
  "status": "suspended",
  "settings": {
    "subscriptionTier": "enterprise",
    "features": {
      "maxTherapists": null,
      "maxPatients": null
    }
  }
}
```

**Response** (200):
```json
{
  "organization": { /* updated org object */ }
}
```

**Authorization**: `requireRole(['super_admin'])`

---

#### `GET /api/organizations/me`
**Description**: Get current user's organization details (Org Admin, Therapist)

**Response** (200):
```json
{
  "organization": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Healing Waters Treatment Center",
    "slug": "healing-waters",
    "logoUrl": "https://...",
    "primaryColor": "#4F46E5",
    "settings": {
      "defaults": {
        "reflectionQuestions": ["uuid1"],
        "surveyTemplate": "uuid2"
      }
    }
  }
}
```

**Authorization**: `requireAuth()` (auto-scoped to user's org)

---

### 8.2 User Management APIs

#### `POST /api/organizations/users`
**Description**: Create user within organization (Org Admin)

**Request**:
```json
{
  "email": "therapist@example.com",
  "name": "Dr. Sarah Johnson",
  "role": "therapist",
  "licenseNumber": "LMFT-12345",
  "specialty": "Family Therapy"
}
```

**Response** (201):
```json
{
  "user": {
    "id": "uuid",
    "email": "therapist@example.com",
    "name": "Dr. Sarah Johnson",
    "role": "therapist",
    "organizationId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending_setup",
    "invitationSent": true
  }
}
```

**Business Logic**:
- Automatically sets `organizationId` from authenticated org admin's org
- Cannot create user in different organization
- Sends email invitation via Firebase
- Audit log entry created

**Authorization**: `requireRole(['org_admin', 'super_admin'])`

---

#### `GET /api/organizations/users`
**Description**: List users in organization (Org Admin, Therapist)

**Query Params**:
- `role` (optional): 'therapist' | 'patient'
- `status` (optional): 'active' | 'inactive'
- `search` (optional): Search by name or email

**Response** (200):
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Dr. Sarah Johnson",
      "email": "therapist@example.com",
      "role": "therapist",
      "status": "active",
      "lastLogin": "2025-11-05T14:22:00Z",
      "patientCount": 12,
      "createdAt": "2025-01-20T09:00:00Z"
    }
  ]
}
```

**Authorization**: `requireAuth()` + org scoping

---

#### `PATCH /api/organizations/users/:id`
**Description**: Update user or deactivate (Org Admin)

**Request**:
```json
{
  "status": "inactive"
}
```

**Response** (200):
```json
{
  "user": { /* updated user */ }
}
```

**Business Logic**:
- Can only update users in same organization
- Status 'inactive' blocks login via middleware
- Audit log entry created

**Authorization**: `requireRole(['org_admin', 'super_admin'])` + org scoping

---

#### `POST /api/organizations/users/:patientId/transfer`
**Description**: Transfer patient to different therapist (Org Admin)

**Request**:
```json
{
  "newTherapistId": "uuid",
  "reason": "Therapist caseload balancing"
}
```

**Response** (200):
```json
{
  "patient": {
    "id": "uuid",
    "therapistId": "new-uuid",
    "transferredAt": "2025-11-06T10:30:00Z"
  }
}
```

**Business Logic**:
- Both therapists must be in same organization
- All patient data (sessions, media, pages) transfers
- Audit log entry with reason
- Email notification to old and new therapist

**Authorization**: `requireRole(['org_admin', 'super_admin'])` + org scoping

---

#### `PATCH /api/super-admin/users/:id/role`
**Description**: Change user's role (Super Admin only)

**Request**:
```json
{
  "newRole": "org_admin",
  "reason": "Promoted to clinical director"
}
```

**Response** (200):
```json
{
  "user": {
    "id": "uuid",
    "role": "org_admin",
    "roleChangedAt": "2025-11-06T10:30:00Z",
    "roleChangedBy": "super-admin-uuid"
  }
}
```

**Business Logic**:
- User must stay in same organization
- Cannot change super_admin role
- Must provide reason
- Audit log entry created with reason
- Email notification sent to user

**Authorization**: `requireRole(['super_admin'])`

---

#### `POST /api/auth/signup`
**Description**: Sign up new user with organization code

**Request**:
```json
{
  "email": "newuser@example.com",
  "name": "John Doe",
  "password": "secure_password",
  "organizationCode": "HEAL-WATERS-2025"
}
```

**Response** (201):
```json
{
  "user": {
    "id": "uuid",
    "email": "newuser@example.com",
    "name": "John Doe",
    "organizationId": "org-uuid",
    "status": "pending_approval"
  },
  "message": "Account created. Pending approval from your organization administrator."
}
```

**Business Logic**:
- Validates organization code exists and is enabled
- Creates user with status='pending_approval', role will be assigned on approval
- Sends notification to org admin
- User cannot log in until approved

**Authorization**: Public (no auth required)

---

#### `POST /api/organizations/verify-code`
**Description**: Verify organization code is valid (before signup)

**Request**:
```json
{
  "code": "HEAL-WATERS-2025"
}
```

**Response** (200):
```json
{
  "valid": true,
  "organization": {
    "id": "uuid",
    "name": "Healing Waters Treatment Center",
    "logoUrl": "https://..."
  }
}
```

**Response** (404):
```json
{
  "valid": false,
  "message": "Invalid organization code"
}
```

**Authorization**: Public (no auth required)

---

#### `GET /api/organizations/pending-users`
**Description**: Get users pending approval (Org Admin)

**Response** (200):
```json
{
  "pendingUsers": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "signupDate": "2025-11-05T14:30:00Z",
      "status": "pending_approval"
    }
  ]
}
```

**Authorization**: `requireRole(['org_admin', 'super_admin'])` + org scoping

---

#### `POST /api/organizations/users/:id/approve`
**Description**: Approve pending user (Org Admin)

**Request**:
```json
{
  "role": "therapist",
  "licenseNumber": "LMFT-12345",
  "specialty": "Family Therapy"
}
```

**Response** (200):
```json
{
  "user": {
    "id": "uuid",
    "status": "active",
    "role": "therapist",
    "approvedAt": "2025-11-06T10:30:00Z",
    "approvedBy": "org-admin-uuid"
  }
}
```

**Business Logic**:
- Sets user status to 'active'
- Assigns role (therapist or patient typically)
- If therapist: requires license number and specialty
- Email notification sent to user
- Audit log entry created

**Authorization**: `requireRole(['org_admin', 'super_admin'])` + org scoping

---

#### `POST /api/organizations/users/:id/reject`
**Description**: Reject pending user (Org Admin)

**Request**:
```json
{
  "reason": "Unable to verify credentials"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "User application rejected"
}
```

**Business Logic**:
- Deletes user account from database
- Email notification sent to user with reason
- Audit log entry created

**Authorization**: `requireRole(['org_admin', 'super_admin'])` + org scoping

---

#### `POST /api/organizations/regenerate-code`
**Description**: Regenerate organization join code (Org Admin)

**Response** (200):
```json
{
  "joinCode": "HEAL-WATERS-2026",
  "regeneratedAt": "2025-11-06T10:30:00Z"
}
```

**Business Logic**:
- Generates new random unique code
- Old code immediately invalidated
- Audit log entry created
- Warning: users with old code can no longer join

**Authorization**: `requireRole(['org_admin', 'super_admin'])` + org scoping

---

#### `PATCH /api/organizations/toggle-code`
**Description**: Enable/disable organization join code (Org Admin)

**Request**:
```json
{
  "enabled": false
}
```

**Response** (200):
```json
{
  "joinCodeEnabled": false,
  "updatedAt": "2025-11-06T10:30:00Z"
}
```

**Business Logic**:
- Temporarily enables/disables self-signup
- Existing pending users unaffected
- Audit log entry created

**Authorization**: `requireRole(['org_admin', 'super_admin'])` + org scoping

---

### 8.3 Template Library APIs

#### `GET /api/templates/prompts`
**Description**: Get therapeutic prompts (filtered by scope)

**Query Params**:
- `scope` (optional): 'system' | 'organization' | 'private' | 'all' (default: 'all')
- `category` (optional): Filter by category
- `status` (optional): Filter by status (default: 'active')
- `search` (optional): Search by title

**Response** (200):
```json
{
  "prompts": [
    {
      "id": "uuid",
      "scope": "system",
      "title": "Therapeutic Alliance Assessment",
      "category": "analysis",
      "promptText": "Analyze the therapeutic alliance...",
      "isFavorite": false,
      "useCount": 1240,
      "createdBy": {
        "name": "StoryCare System",
        "role": "super_admin"
      }
    },
    {
      "id": "uuid2",
      "scope": "organization",
      "title": "Trauma-Informed Image Generation",
      "category": "image-generation",
      "promptText": "Generate a safe, healing image...",
      "approvedBy": {
        "name": "Dr. Michael Torres",
        "role": "org_admin"
      },
      "approvedAt": "2025-10-15T12:00:00Z"
    }
  ]
}
```

**Business Logic**:
- Returns system templates (visible to all)
- Returns org templates if user belongs to org
- Returns private templates if user is creator
- Auto-scopes to user's organization

**Authorization**: `requireAuth()`

---

#### `POST /api/templates/prompts`
**Description**: Create therapeutic prompt (Therapist, Org Admin)

**Request**:
```json
{
  "title": "Family Narrative Exploration",
  "category": "analysis",
  "promptText": "Explore the family's narrative by...",
  "scope": "private" // or "organization" if org_admin
}
```

**Response** (201):
```json
{
  "prompt": {
    "id": "uuid",
    "scope": "private",
    "organizationId": "org-uuid",
    "createdBy": "user-uuid",
    "status": "active",
    "title": "Family Narrative Exploration",
    "category": "analysis"
  }
}
```

**Business Logic**:
- Therapist can create `scope: 'private'` or submit for approval
- Org Admin can create `scope: 'organization'` directly
- Super Admin can create `scope: 'system'`
- Auto-sets organizationId from user's org

**Authorization**: `requireAuth()`

---

#### `POST /api/templates/prompts/:id/submit-for-approval`
**Description**: Submit private prompt for org-wide sharing (Therapist)

**Request**:
```json
{
  "note": "This prompt has been very effective with trauma patients"
}
```

**Response** (200):
```json
{
  "prompt": {
    "id": "uuid",
    "status": "pending_approval",
    "submittedAt": "2025-11-06T10:30:00Z"
  }
}
```

**Business Logic**:
- Prompt must be owned by requesting user
- Status changes to 'pending_approval'
- Org Admin notified via email/notification
- Prompt remains in therapist's private library during review

**Authorization**: `requireAuth()` + ownership check

---

#### `GET /api/templates/prompts/pending`
**Description**: Get prompts pending approval (Org Admin)

**Response** (200):
```json
{
  "pendingPrompts": [
    {
      "id": "uuid",
      "title": "Family Narrative Exploration",
      "category": "analysis",
      "submittedBy": {
        "id": "user-uuid",
        "name": "Dr. Jessica Martinez",
        "role": "therapist"
      },
      "submittedAt": "2025-11-05T14:20:00Z",
      "note": "This prompt has been very effective..."
    }
  ]
}
```

**Authorization**: `requireRole(['org_admin', 'super_admin'])` + org scoping

---

#### `POST /api/templates/prompts/:id/approve`
**Description**: Approve prompt for org-wide use (Org Admin)

**Request**:
```json
{
  "decision": "approve"  // or "reject"
  "rejectionReason": "Does not meet clinical standards" // if reject
}
```

**Response** (200):
```json
{
  "prompt": {
    "id": "uuid",
    "scope": "organization",
    "status": "active",
    "approvedBy": "org-admin-uuid",
    "approvedAt": "2025-11-06T10:30:00Z"
  }
}
```

**Business Logic**:
- If approved: scope changes to 'organization', status to 'active'
- If rejected: status to 'rejected', scope remains 'private'
- Therapist notified via email
- Audit log entry created

**Authorization**: `requireRole(['org_admin', 'super_admin'])` + org scoping

---

#### `POST /api/templates/prompts/:id/import`
**Description**: Import system template to org library (Org Admin)

**Response** (201):
```json
{
  "prompt": {
    "id": "new-uuid",
    "scope": "organization",
    "title": "Therapeutic Alliance Assessment (Org Copy)",
    "importedFrom": "system-template-uuid",
    "createdBy": "org-admin-uuid"
  }
}
```

**Business Logic**:
- Only system templates can be imported
- Creates new template record with scope='organization'
- Copies all content from system template
- Metadata tracks source template

**Authorization**: `requireRole(['org_admin', 'super_admin'])`

---

#### `GET /api/templates/surveys`
**Description**: Get survey templates (same pattern as prompts)

**Response** (200):
```json
{
  "surveys": [
    {
      "id": "uuid",
      "scope": "system",
      "title": "PHQ-9 Depression Screening",
      "category": "screening",
      "questions": [
        {
          "questionText": "Little interest or pleasure in doing things?",
          "questionType": "scale",
          "scaleMin": 0,
          "scaleMax": 3,
          "scaleLabels": {
            "min": "Not at all",
            "max": "Nearly every day"
          }
        }
      ],
      "useCount": 5240
    }
  ]
}
```

**Authorization**: `requireAuth()` + org scoping

---

#### `POST /api/templates/surveys`
**Description**: Create survey template (same pattern as prompts)

**Authorization**: `requireAuth()`

---

#### `GET /api/templates/reflections`
**Description**: Get reflection templates (same pattern as prompts/surveys)

**Authorization**: `requireAuth()` + org scoping

---

#### `POST /api/templates/reflections`
**Description**: Create reflection template (same pattern as prompts/surveys)

**Authorization**: `requireAuth()`

---

### 8.4 Organization Settings APIs

#### `GET /api/organizations/settings`
**Description**: Get organization settings (Org Admin)

**Response** (200):
```json
{
  "settings": {
    "subscriptionTier": "professional",
    "features": {
      "maxTherapists": 20,
      "maxPatients": 200,
      "aiCreditsPerMonth": 5000,
      "storageGB": 50
    },
    "defaults": {
      "reflectionQuestions": [
        {
          "id": "uuid1",
          "title": "What resonated with you today?"
        }
      ],
      "surveyTemplate": {
        "id": "uuid2",
        "title": "Weekly Check-In"
      },
      "sessionTranscriptionEnabled": true
    },
    "branding": {
      "welcomeMessage": "Welcome to Healing Waters",
      "supportEmail": "support@healingwaters.com"
    }
  }
}
```

**Authorization**: `requireRole(['org_admin', 'super_admin'])` + org scoping

---

#### `PATCH /api/organizations/settings`
**Description**: Update organization settings (Org Admin)

**Request**:
```json
{
  "defaults": {
    "reflectionQuestions": ["uuid1", "uuid2", "uuid3"],
    "surveyTemplate": "uuid4"
  },
  "branding": {
    "welcomeMessage": "Welcome to Healing Waters Treatment Center",
    "supportEmail": "support@healingwaters.com"
  }
}
```

**Response** (200):
```json
{
  "settings": { /* updated settings */ }
}
```

**Business Logic**:
- Can only update allowed fields (not subscription tier)
- Template IDs must belong to system or org scope
- Audit log entry created

**Authorization**: `requireRole(['org_admin', 'super_admin'])` + org scoping

---

#### `GET /api/organizations/export-templates`
**Description**: Export all org templates as JSON or CSV (Org Admin)

**Query Params**:
- `format`: 'json' | 'csv' (default: 'json')

**Response** (200):
```json
{
  "prompts": [],
  "surveys": [],
  "reflections": [],
  "exportedAt": "2025-11-06T10:30:00Z",
  "organizationId": "uuid",
  "organizationName": "Healing Waters Treatment Center"
}
```

**Business Logic**:
- Includes all templates with `scope: 'organization'` or `scope: 'private' AND status: 'active'`
- Does not include system templates (already accessible)
- Audit log entry created

**Authorization**: `requireRole(['org_admin', 'super_admin'])` + org scoping

---

### 8.5 Super Admin Support APIs

#### `GET /api/super-admin/organizations/:id/view`
**Description**: View organization's data (read-only) for support (Super Admin)

**Response** (200):
```json
{
  "organization": { /* full org details */ },
  "users": [],
  "sessions": [],
  "templates": [],
  "viewMode": "read_only",
  "accessGranted": "2025-11-06T10:30:00Z"
}
```

**Business Logic**:
- Super Admin can view any org's data
- Read-only access (no create/update/delete)
- Audit log entry with reason for access
- Displayed with "Super Admin View" banner in UI

**Authorization**: `requireRole(['super_admin'])`

---

#### `POST /api/super-admin/patients/:id/transfer-org`
**Description**: Transfer patient between organizations (Super Admin, emergency only)

**Request**:
```json
{
  "targetOrganizationId": "uuid",
  "targetTherapistId": "uuid",
  "reason": "Hospital merger - patient care continuity"
}
```

**Response** (200):
```json
{
  "patient": {
    "id": "uuid",
    "organizationId": "new-org-uuid",
    "therapistId": "new-therapist-uuid",
    "transferredAt": "2025-11-06T10:30:00Z"
  }
}
```

**Business Logic**:
- Target therapist must exist in target org
- All patient data moves to new org
- Requires reason (logged in audit)
- Email notification to both org admins
- Irreversible operation (requires confirmation)

**Authorization**: `requireRole(['super_admin'])`

---

## 9. User Interface Requirements

### 9.1 Super Admin Dashboard

**URL**: `/super-admin/dashboard`

**Components**:
1. **Organization List Table**
   - Columns: Name, Therapists, Patients, Status, Created, Actions
   - Filters: Status (active, trial, suspended), Search by name
   - Sorting: Name, Created date, Patient count
   - Actions: View, Edit, Suspend/Activate

2. **Platform Metrics Cards**
   - Total Organizations
   - Active Organizations
   - Total Therapists (all orgs)
   - Total Patients (all orgs)
   - AI Credits Used (this month)

3. **Recent Activity Feed**
   - New org creations
   - Support access events (audit log)
   - Org suspensions/reactivations

**Actions**:
- "Create Organization" button → Modal
- Click org row → Org details page
- "View as Org" → Read-only org view

---

### 9.2 Create Organization Modal (Super Admin)

**Trigger**: "Create Organization" button

**Form Fields**:
- Organization Name* (text)
- Slug* (text, auto-generated from name, editable)
- Contact Email* (email)
- Logo (image upload, optional)
- Primary Color (color picker, optional)
- Subscription Tier (dropdown: trial, basic, professional, enterprise)

**Actions**:
- Cancel
- Create Organization → Success toast → Redirect to org details

---

### 9.3 Organization Details Page (Super Admin)

**URL**: `/super-admin/organizations/:id`

**Tabs**:
1. **Overview**
   - Org details (name, slug, contact, status)
   - Metrics (therapists, patients, sessions, storage)
   - Subscription info (tier, limits, usage)

2. **Users**
   - List of all users (therapists, patients, org admins)
   - Create user button
   - Deactivate user action

3. **Templates**
   - Org-wide templates (prompts, surveys, reflections)
   - Pending approvals count
   - View templates

4. **Settings**
   - Organization settings (branding, defaults)
   - Edit settings button

5. **Audit Log**
   - Filtered to this org only
   - Export audit log

**Actions**:
- Edit Organization
- Suspend/Activate Organization
- View as Org (read-only mode)
- Transfer Patient (emergency)

---

### 9.4 Organization Admin Dashboard

**URL**: `/admin/dashboard` (org admin lands here after login)

**Components**:
1. **Org Metrics Cards**
   - Active Therapists
   - Active Patients
   - Sessions (last 30 days)
   - **Pending Users** (new signups)
   - Pending Approvals (templates)

2. **Quick Actions**
   - Invite Therapist
   - Create Patient
   - **Review Pending Users** (new)
   - Review Pending Templates

3. **Recent Activity**
   - **New user signups (pending)**
   - New therapist signups (invited)
   - New patients created
   - Template submissions
   - Patient transfers

4. **Therapist Activity Table**
   - Columns: Therapist Name, Patients, Sessions (30d), Last Active
   - Click row → Therapist details

---

### 9.5 Org Admin - User Management Page

**URL**: `/admin/users`

**Tabs**:
1. **Pending** (new)
   - Table: Name, Email, Signup Date, Actions
   - Shows users with status='pending_approval'
   - Actions: Approve, Reject
   - No filters needed

2. **Therapists**
   - Table: Name, Email, License #, Patients, Status, Actions
   - Filter: Active/Inactive
   - Search by name/email
   - Actions: View, Edit, Deactivate, "Invite Therapist" button

3. **Patients**
   - Table: Name, Email, Therapist, Last Active, Status, Actions
   - Filter: Active/Inactive, By Therapist
   - Search by name/email
   - Actions: View, Edit, Transfer, Deactivate, "Create Patient" button

**Modals**:
- **Approve User**: Select Role (therapist/patient), If therapist: License #, Specialty → Approve
- **Reject User**: Reason (optional) → Confirm rejection
- **Invite Therapist**: Email, Name, License #, Specialty → Send invitation
- **Create Patient**: Name, Email, DOB, Assign to Therapist → Create
- **Transfer Patient**: Select New Therapist, Reason → Confirm transfer

---

### 9.6 Org Admin - Template Library Page

**URL**: `/admin/templates`

**Tabs**:
1. **Prompts**
2. **Surveys**
3. **Reflections**

**Each Tab Has**:
- **Filter Tabs**: System | Organization | Pending Approval
- **Template Grid/List**:
  - Card view showing: Title, Category, Use count, Scope badge
  - Search bar
  - Category filter dropdown
  - Sort: Name, Use count, Created date

**System Tab**:
- All StoryCare system templates
- Action: "Import to Org" button on each template

**Organization Tab**:
- All org-wide templates (approved)
- Action: "Edit" | "Archive" buttons
- "Create Template" button

**Pending Approval Tab**:
- Templates submitted by therapists
- Shows: Template preview, Submitter name, Submission date, Note
- Actions: "Approve" | "Reject" buttons

**Modals**:
- **Create Template**: Title, Category, Content → Save
- **Import Template**: Confirmation → Creates org copy
- **Approve/Reject**: Reason field (if reject) → Confirm

---

### 9.7 Org Admin - Settings Page

**URL**: `/admin/settings`

**Sections**:
1. **Organization Info**
   - Name, Logo, Primary Color
   - Contact Email
   - Edit button

2. **Subscription**
   - Current tier (read-only, managed by Super Admin)
   - Usage: Therapists (12/20), Patients (145/200), AI Credits (1240/5000)
   - Storage: 3.2 GB / 50 GB

3. **User Onboarding** (new)
   - **Organization Join Code**: `HEAL-WATERS-2025` (copy button)
   - **Code Status**: Enabled/Disabled (toggle)
   - **Regenerate Code** button (with confirmation warning)
   - Info text: "Share this code with new users to join your organization"

4. **Default Templates**
   - **Default Reflection Questions** (multi-select from org templates)
   - **Default Survey** (single-select from org templates)
   - Save button

5. **Branding**
   - Welcome Message (textarea)
   - Support Email (email input)
   - Save button

6. **Advanced**
   - Export Templates (JSON/CSV)
   - Audit Log (view org audit log)

---

### 9.8 Therapist - Template Library Page (Enhanced)

**URL**: `/templates`

**Changes from Current**:
- **Add "Scope" filter**: System | Organization | My Private
- **System Templates**: Badge, "Copy to Private" action
- **Organization Templates**: Badge, "Use" action
- **My Private Templates**: "Submit for Org Sharing" button

**New Actions**:
- **Submit for Approval**: Opens modal with note field → Submits to org admin
- **Use Org Template**: Copies to current session/page context

---

### 9.9 Sign-Up Page (Public - New User)

**URL**: `/sign-up`

**Form Fields**:
1. **Name** (text, required)
2. **Email** (email, required)
3. **Password** (password, required, min 8 chars)
4. **Confirm Password** (password, required)
5. **Organization Code** (text, required, uppercase, format: XXXX-XXXX-XXXX)
   - Placeholder: "Enter your organization's code"
   - Real-time validation (checks if code exists)
   - Shows organization name when valid
   - Error message if invalid

**Validation Flow**:
```
User enters code →
POST /api/organizations/verify-code →
If valid: Show org name, enable submit →
If invalid: Show error "Invalid code"
```

**Submit Flow**:
```
User clicks "Create Account" →
POST /api/auth/signup →
Success: Show "Pending Approval" screen →
Email sent to org admin →
User redirected to /pending-approval page
```

**Pending Approval Screen**:
- Message: "Your account has been created and is pending approval from [Organization Name] administrators."
- "You will receive an email when your account is approved."
- "Return to Sign In" link

---

### 9.10 Super Admin - User Role Change

**Location**: Organization Details → Users Tab → User Row Actions

**Modal**: "Change User Role"
- **Current Role**: therapist (read-only, displayed)
- **New Role**: Dropdown (patient, therapist, org_admin)
- **Reason**: Textarea (required)
- **Warning**: "User will remain in their current organization"
- **Confirm** button

**After Submit**:
- Success toast: "User role changed successfully"
- User notified via email
- Audit log entry created

---

### 9.11 Navigation Changes

**Super Admin Sidebar**:
```
- Dashboard
- Organizations
  - All Organizations
  - Create Organization
- System Templates
- Audit Logs
- Settings
```

**Org Admin Sidebar**:
```
- Dashboard (org metrics)
- Users
  - Therapists
  - Patients
- Templates
  - Prompts
  - Surveys
  - Reflections
- Settings
- [Existing therapist menu items]
  - Sessions
  - Assets
  - Scenes
  - Pages
```

**Therapist Sidebar** (unchanged, but templates enhanced):
```
- Dashboard
- Sessions
- Assets
- Scenes
- Pages
- Templates (now shows system + org + private)
```

---

## 10. Security & Compliance

### 10.1 HIPAA Compliance Requirements

**1. Organization Data Isolation**
- ✅ Database-level enforcement via foreign keys and constraints
- ✅ Application-level checks in middleware
- ✅ Query-level org filtering on all endpoints
- ✅ Audit logging for all cross-org access attempts

**2. Role-Based Access Control**
- ✅ Enhanced user roles: super_admin, org_admin, therapist, patient
- ✅ Permission matrix enforced at API level
- ✅ Org boundary checks on all data access
- ✅ Super admin read-only access with audit logging

**3. Audit Logging Enhancements**
```typescript
AuditLog {
  // Existing fields...
  organizationId: UUID | null,  // Track which org data was accessed

  // New actions
  action:
    | 'ORG_CREATED'
    | 'ORG_SUSPENDED'
    | 'ORG_REACTIVATED'
    | 'ORG_JOIN_CODE_REGENERATED'
    | 'ORG_JOIN_CODE_TOGGLED'
    | 'USER_ROLE_CHANGED'
    | 'USER_SIGNED_UP_PENDING'
    | 'USER_APPROVED'
    | 'USER_REJECTED'
    | 'USER_TRANSFERRED_WITHIN_ORG'
    | 'PATIENT_TRANSFERRED_CROSS_ORG'
    | 'TEMPLATE_APPROVED'
    | 'TEMPLATE_REJECTED'
    | 'SUPER_ADMIN_ORG_ACCESS'
    | 'ORG_SETTINGS_UPDATED'
    | 'TEMPLATE_EXPORTED'
    // ... existing actions
}
```

**4. Data Transfer Safeguards**
- Patient transfer within org: Audit log with reason
- Patient transfer cross-org: Super admin only, email notification, requires confirmation
- Template import/export: Audit log entry

**5. Encryption**
- Database: Existing Neon PostgreSQL AES-256 (no changes)
- Transit: Existing TLS 1.3 (no changes)
- File storage: Existing GCS encryption (no changes)

### 10.2 Security Enhancements

**1. Enhanced Middleware**

```typescript
// New middleware: Organization boundary enforcement
export async function requireSameOrg(
  request: Request,
  resourceOrgId: string
): Promise<void> {
  const user = await requireAuth(request);

  // Super admin bypass (with audit log)
  if (user.role === 'super_admin') {
    await auditLog({
      action: 'SUPER_ADMIN_ORG_ACCESS',
      userId: user.dbUserId,
      organizationId: resourceOrgId,
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
      metadata: { accessType: 'read' }
    });
    return;
  }

  // Org boundary check
  if (user.organizationId !== resourceOrgId) {
    await auditLog({
      action: 'ORG_BOUNDARY_VIOLATION_ATTEMPT',
      userId: user.dbUserId,
      organizationId: user.organizationId,
      metadata: {
        attemptedOrgId: resourceOrgId,
        blocked: true
      }
    });

    throw new ForbiddenError(
      'Cannot access resource from different organization'
    );
  }
}

// Enhanced auth context
type AuthenticatedUser = {
  uid: string; // Firebase UID
  dbUserId: string; // Database UUID
  organizationId: string | null; // null for super_admin
  email: string | null;
  emailVerified: boolean;
  role: 'super_admin' | 'org_admin' | 'therapist' | 'patient';
};
```

**2. Query-Level Org Filtering**

All database queries auto-scope to organization:

```typescript
// Example: Get sessions
async function getSessions(user: AuthenticatedUser) {
  const query = db
    .select()
    .from(sessions)
    .innerJoin(users, eq(sessions.therapistId, users.id));

  // Auto-scope to org (unless super admin)
  if (user.role !== 'super_admin') {
    query.where(eq(users.organizationId, user.organizationId));
  }

  return await query;
}
```

**3. Rate Limiting (Arcjet)**

Add org-level rate limiting:
```typescript
// Existing: Per-user rate limits
// New: Per-organization rate limits

const arcjetOrgLimit = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    rateLimit({
      mode: 'LIVE',
      match: (req) => {
        const user = req.user as AuthenticatedUser;
        return user.organizationId || user.dbUserId;
      },
      characteristics: ['organizationId'],
      max: 10000, // 10k requests per hour per org
      window: '1h'
    })
  ]
});
```

**4. Data Residency**

Organizations may require data residency:
```typescript
Organization {
  settings: {
    // ...
    dataResidency: {
      region: 'us-west' | 'us-east' | 'eu' | 'asia',
      enforced: boolean
    }
  }
}
```

Plan for future multi-region deployment.

### 10.3 Business Associate Agreements (BAA)

**Required BAAs for Multi-Tenancy**:
- ✅ Neon (database) - Already signed
- ✅ Google Cloud Platform (Firebase, GCS) - Already signed
- ✅ Vercel (hosting) - Need to sign
- ✅ Deepgram (transcription) - Need to sign
- ✅ Sentry (error tracking) - Need to sign

Each organization inherits these BAAs (no separate BAAs needed per org).

---

## 11. Migration Strategy

### 11.1 Database Migration Plan

**Phase 1: Add Tables & Columns (Non-Breaking)**

```sql
-- 1. Create organizations table
CREATE TABLE organizations (...);

-- 2. Add organization_id to users (nullable initially)
ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id);

-- 3. Add new role values
ALTER TYPE user_role ADD VALUE 'super_admin';
ALTER TYPE user_role ADD VALUE 'org_admin';

-- 4. Create template tables
CREATE TABLE survey_templates (...);
CREATE TABLE reflection_templates (...);

-- 5. Add columns to existing tables
ALTER TABLE groups ADD COLUMN organization_id UUID;
ALTER TABLE therapeutic_prompts ADD COLUMN scope VARCHAR(20);
ALTER TABLE therapeutic_prompts ADD COLUMN organization_id UUID;
-- ... etc
```

**Phase 2: Data Migration**

```sql
-- 1. Create "Default Organization" for existing data
INSERT INTO organizations (id, name, slug, contact_email, created_by, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'StoryCare Legacy',
  'legacy',
  'support@storycare.com',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
  'active'
);

-- 2. Migrate existing users to default org
UPDATE users
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE role IN ('therapist', 'patient', 'admin');

-- 3. Convert existing admin to org_admin
UPDATE users
SET role = 'org_admin'
WHERE role = 'admin';

-- 4. Backfill organization_id in related tables
UPDATE groups g
SET organization_id = (
  SELECT u.organization_id
  FROM users u
  WHERE u.id = g.therapist_id
);

UPDATE therapeutic_prompts
SET
  scope = CASE
    WHEN therapist_id IS NULL THEN 'system'
    ELSE 'private'
  END,
  organization_id = (
    SELECT u.organization_id
    FROM users u
    WHERE u.id = therapeutic_prompts.therapist_id
  )
WHERE therapist_id IS NOT NULL;

-- 5. Migrate audit logs
UPDATE audit_logs a
SET organization_id = (
  SELECT u.organization_id
  FROM users u
  WHERE u.id = a.user_id
)
WHERE user_id IS NOT NULL;
```

**Phase 3: Add Constraints (Breaking)**

```sql
-- Make organization_id NOT NULL (except for super_admin)
ALTER TABLE users
  ALTER COLUMN organization_id SET NOT NULL
  WHERE role != 'super_admin';

-- Add check constraints
ALTER TABLE users ADD CONSTRAINT users_super_admin_org_check ...;
ALTER TABLE users ADD CONSTRAINT users_therapist_same_org_check ...;
ALTER TABLE therapeutic_prompts ADD CONSTRAINT therapeutic_prompts_scope_org_check ...;
-- ... etc

-- Add indexes
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_groups_organization_id ON groups(organization_id);
-- ... etc
```

**Phase 4: Create First Super Admin**

```sql
-- Promote one existing admin to super_admin
UPDATE users
SET role = 'super_admin', organization_id = NULL
WHERE email = 'super-admin@storycare.com';
```

### 11.2 Application Deployment Plan

**Step 1: Deploy Schema Changes** (Downtime: None)
- Run Phase 1 migrations (add tables, add nullable columns)
- Deploy code with backward-compatible changes
- Verify existing functionality works

**Step 2: Migrate Data** (Downtime: Maintenance window, 1-2 hours)
- Run Phase 2 migrations (backfill data)
- Verify data integrity
- Test queries with new org scoping

**Step 3: Add Constraints** (Downtime: None)
- Run Phase 3 migrations (add constraints, indexes)
- Deploy updated code with org boundary enforcement
- Verify all endpoints enforce org scoping

**Step 4: Enable New Features** (Downtime: None)
- Enable super admin dashboard
- Enable org admin features
- Enable template library system
- Notify users of new features

**Step 5: Onboard New Organizations** (Downtime: None)
- Super admin can now create new organizations
- Invite org admins
- Organizations operate independently

### 11.3 Rollback Plan

**If Migration Fails**:
1. **Before Phase 3**: Simply drop new columns and tables (no data loss)
2. **After Phase 3**: Restore from database backup, redeploy previous code version
3. **Emergency**: Super admin can manually fix data inconsistencies via SQL

**Safeguards**:
- Full database backup before migration
- Test migration on staging environment first
- Gradual rollout: staging → canary → production
- Monitor error rates and rollback triggers

---

## 12. Success Metrics

### 12.1 Platform Metrics (Super Admin)

**Organization Growth**:
- Total organizations onboarded
- Organizations by status (active, trial, suspended)
- Organizations by subscription tier
- Churn rate (orgs that suspend/cancel)

**User Growth (Across All Orgs)**:
- Total therapists
- Total patients
- Monthly active users (MAU)
- New users per month

**Platform Usage**:
- Sessions created per month (all orgs)
- AI credits consumed per month
- Storage used (total GB)
- API request volume

**Template Library Adoption**:
- System templates used per month
- Org templates created per month
- Template approval rate (approved / submitted)
- Most popular templates

### 12.2 Organization Metrics (Org Admin)

**User Management**:
- Active therapists in org
- Active patients in org
- Therapist utilization (avg patients per therapist)
- Patient engagement rate

**Clinical Productivity**:
- Sessions created per therapist per month
- Story pages published per month
- Patient response rate (reflections, surveys)
- Avg time from session to story page

**Template Library Adoption**:
- Org templates created
- Therapist submissions for approval
- Org templates used per therapist
- Template standardization rate (% of therapists using org templates)

### 12.3 Success Criteria (Launch)

**Must-Have (P0)**:
- ✅ Super Admin can create 10+ organizations
- ✅ Each org has complete data isolation (no cross-org leaks)
- ✅ Org Admins can self-manage users (invite therapists, create patients)
- ✅ Template library system functional (system, org, private scopes)
- ✅ Template approval workflow operational
- ✅ All existing features work with org scoping (sessions, media, pages)
- ✅ Zero HIPAA compliance violations
- ✅ Audit logging for all org-level actions

**Should-Have (P1)**:
- ✅ Org settings (defaults, branding) configurable
- ✅ Template import/export working
- ✅ Patient transfer within org
- ✅ Org-level analytics dashboard
- ✅ Super admin read-only org view

**Nice-to-Have (P2)**:
- Template usage analytics
- Org admin notification system
- Advanced RBAC (custom roles per org)
- Multi-region data residency

---

## 13. Implementation Phases

### Phase 1: Foundation (Weeks 1-3)

**Database Schema**:
- Create `organizations` table
- Create `survey_templates`, `reflection_templates` tables
- Add `organization_id` to `users`, `groups`, `therapeutic_prompts`
- Add `scope`, `status`, approval fields to templates
- Add constraints and indexes

**Authentication & RBAC**:
- Update `AuthenticatedUser` type to include `organizationId`
- Implement `requireSameOrg()` middleware
- Implement `requireOrgAdmin()` middleware
- Update Firebase Admin token verification to fetch org_id

**Testing**:
- Unit tests for new RBAC helpers
- Integration tests for org boundary enforcement
- Migration scripts tested on staging DB

---

### Phase 2: Super Admin Features (Weeks 4-5)

**Super Admin APIs**:
- `POST /api/super-admin/organizations` (create org)
- `GET /api/super-admin/organizations` (list orgs)
- `GET /api/super-admin/organizations/:id` (org details)
- `PATCH /api/super-admin/organizations/:id` (update org, suspend)
- `POST /api/super-admin/organizations/:id/invite-admin` (create first org admin)

**Super Admin UI**:
- Super Admin dashboard (`/super-admin/dashboard`)
- Organization list page
- Create organization modal
- Organization details page
- View as org (read-only mode)

**Testing**:
- E2E tests for org creation workflow
- Test org suspension/reactivation
- Test super admin read-only access

---

### Phase 3: Org Admin User Management & Self-Signup (Weeks 6-8)

**Org Admin APIs**:
- `POST /api/organizations/users` (invite therapist, create patient)
- `GET /api/organizations/users` (list org users)
- `PATCH /api/organizations/users/:id` (deactivate user)
- `POST /api/organizations/users/:id/transfer` (transfer patient within org)
- `PATCH /api/super-admin/users/:id/role` (change user role - super admin)
- `POST /api/auth/signup` (user self-signup with org code)
- `POST /api/organizations/verify-code` (validate org code)
- `GET /api/organizations/pending-users` (list pending approvals)
- `POST /api/organizations/users/:id/approve` (approve pending user)
- `POST /api/organizations/users/:id/reject` (reject pending user)
- `POST /api/organizations/regenerate-code` (regenerate join code)
- `PATCH /api/organizations/toggle-code` (enable/disable join code)

**Org Admin UI**:
- Org Admin dashboard (`/admin/dashboard`) - add Pending Users metric
- User management page (pending, therapists, patients tabs)
- Approve user modal
- Reject user modal
- Invite therapist modal
- Create patient modal
- Transfer patient modal
- Settings page - add User Onboarding section

**Public UI**:
- Sign-up page (`/sign-up`) with organization code field
- Pending approval page (`/pending-approval`)

**Super Admin UI**:
- Change user role modal (in org details page)

**Testing**:
- E2E tests for therapist invitation
- E2E tests for patient creation and transfer
- E2E tests for user self-signup flow (code validation → signup → pending → approval)
- E2E tests for org code management (regenerate, enable/disable)
- E2E tests for super admin role change
- Test org boundary enforcement on user management
- Test pending user approval workflow

---

### Phase 4: Template Library System (Weeks 8-10)

**Template APIs**:
- `GET /api/templates/prompts` (get prompts with scope filtering)
- `POST /api/templates/prompts` (create prompt)
- `POST /api/templates/prompts/:id/submit-for-approval` (therapist)
- `GET /api/templates/prompts/pending` (org admin)
- `POST /api/templates/prompts/:id/approve` (org admin)
- `POST /api/templates/prompts/:id/import` (import system template)
- Mirror APIs for surveys and reflections

**Template UI**:
- Enhanced template library page (system/org/private tabs)
- Create template modal
- Submit for approval workflow
- Org admin pending approvals page
- Approve/reject template modal
- Import system template

**Testing**:
- E2E tests for template creation and approval workflow
- Test system template import
- Test org scoping on templates

---

### Phase 5: Org Settings & Defaults (Weeks 11-12)

**Settings APIs**:
- `GET /api/organizations/settings` (get org settings)
- `PATCH /api/organizations/settings` (update defaults, branding)
- `GET /api/organizations/export-templates` (export org templates)

**Settings UI**:
- Organization settings page (`/admin/settings`)
- Default templates configuration
- Branding settings (welcome message, support email)
- Export templates action

**Integration**:
- Story page builder pre-populates default reflection questions
- Story page builder pre-populates default survey
- Default templates applied when therapist creates new page

**Testing**:
- Test default templates applied to new story pages
- Test template export (JSON, CSV)
- Test branding applied in org context

---

### Phase 6: Data Migration & Rollout (Weeks 13-14)

**Migration**:
- Run database migrations on staging
- Create "Legacy" default organization
- Migrate existing users to default org
- Convert existing admin to org_admin
- Create first super admin account
- Verify data integrity

**Deployment**:
- Deploy to staging
- Full regression testing
- Deploy to production (maintenance window)
- Post-deployment verification

**Rollout**:
- Enable super admin features
- Enable org admin features for legacy org
- Create first new organization (pilot)
- Monitor metrics and error rates

**Documentation**:
- Update CLAUDE.md with org structure
- Update README.md with multi-tenancy info
- Create admin user guides
- Create migration runbook

---

### Phase 7: Polish & Optimization (Weeks 15-16)

**Performance**:
- Optimize org-scoped queries (add indexes)
- Implement caching for org settings
- Monitor query performance in production

**UX Enhancements**:
- Add bulk user invite (CSV upload)
- Add template usage analytics
- Add org admin notification system
- Improve mobile responsiveness for org admin UI

**Compliance**:
- Sign BAAs with all vendors
- Complete HIPAA risk assessment for multi-tenancy
- Document data isolation architecture
- Create incident response procedures

**Bug Fixes**:
- Address issues found during rollout
- Refine RBAC edge cases
- Improve error messages

---

## Appendix A: API Response Examples

### Organization Object (Full)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Healing Waters Treatment Center",
  "slug": "healing-waters",
  "contactEmail": "admin@healingwaters.com",
  "logoUrl": "https://storage.googleapis.com/storycare/orgs/healing-waters/logo.png",
  "primaryColor": "#4F46E5",
  "settings": {
    "subscriptionTier": "professional",
    "features": {
      "maxTherapists": 20,
      "maxPatients": 200,
      "aiCreditsPerMonth": 5000,
      "storageGB": 50
    },
    "defaults": {
      "reflectionQuestions": [
        "550e8400-e29b-41d4-a716-446655440001",
        "550e8400-e29b-41d4-a716-446655440002"
      ],
      "surveyTemplate": "550e8400-e29b-41d4-a716-446655440003",
      "sessionTranscriptionEnabled": true
    },
    "branding": {
      "welcomeMessage": "Welcome to Healing Waters Treatment Center",
      "supportEmail": "support@healingwaters.com"
    }
  },
  "status": "active",
  "trialEndsAt": null,
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-11-01T08:15:00Z",
  "createdBy": "super-admin-uuid"
}
```

### User Object (with Org)

```json
{
  "id": "user-uuid",
  "firebaseUid": "firebase-uid",
  "email": "therapist@example.com",
  "name": "Dr. Sarah Johnson",
  "role": "therapist",
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "organization": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Healing Waters Treatment Center",
    "slug": "healing-waters"
  },
  "licenseNumber": "LMFT-12345",
  "specialty": "Family Therapy",
  "status": "active",
  "lastLogin": "2025-11-05T14:22:00Z",
  "createdAt": "2025-01-20T09:00:00Z"
}
```

### Template Object (Survey)

```json
{
  "id": "template-uuid",
  "scope": "organization",
  "organizationId": "550e8400-e29b-41d4-a716-446655440000",
  "createdBy": "therapist-uuid",
  "creator": {
    "name": "Dr. Jessica Martinez",
    "role": "therapist"
  },
  "approvedBy": "org-admin-uuid",
  "approver": {
    "name": "Dr. Michael Torres",
    "role": "org_admin"
  },
  "approvedAt": "2025-10-15T12:00:00Z",
  "title": "Weekly Progress Check-In",
  "description": "Brief weekly survey to track patient progress",
  "category": "outcome",
  "questions": [
    {
      "questionText": "How would you rate your overall mood this week?",
      "questionType": "scale",
      "scaleMin": 1,
      "scaleMax": 10,
      "scaleLabels": {
        "min": "Very Poor",
        "max": "Excellent"
      },
      "required": true,
      "order": 1
    },
    {
      "questionText": "What strategies did you use to cope with stress?",
      "questionType": "text",
      "required": false,
      "order": 2
    }
  ],
  "status": "active",
  "useCount": 47,
  "createdAt": "2025-09-20T11:00:00Z",
  "updatedAt": "2025-10-15T12:00:00Z"
}
```

---

## Appendix B: Database ER Diagram (Org Multi-Tenancy)

```
┌──────────────────┐
│  organizations   │
│──────────────────│
│ id (PK)          │
│ name             │
│ slug (UNIQUE)    │
│ contact_email    │
│ settings (JSONB) │
│ status           │
└────────┬─────────┘
         │
         │ 1:N
         │
┌────────▼─────────┐
│      users       │
│──────────────────│
│ id (PK)          │
│ organization_id  │◄──┐
│ role             │   │
│ therapist_id     │   │ (same org constraint)
│ email            │   │
└────────┬─────────┘   │
         │             │
         │ 1:N         │
         │             │
┌────────▼─────────┐   │
│     groups       │   │
│──────────────────│   │
│ id (PK)          │   │
│ organization_id  │   │
│ therapist_id     │───┘
└──────────────────┘

┌────────────────────────┐
│  therapeutic_prompts   │
│────────────────────────│
│ id (PK)                │
│ scope                  │ ('system', 'organization', 'private')
│ organization_id        │◄─── NULL if scope='system'
│ created_by             │
│ approved_by            │
│ status                 │
└────────────────────────┘

┌────────────────────────┐
│   survey_templates     │
│────────────────────────│
│ id (PK)                │
│ scope                  │
│ organization_id        │◄─── NULL if scope='system'
│ created_by             │
│ approved_by            │
│ questions (JSONB)      │
│ status                 │
└────────────────────────┘

┌────────────────────────┐
│ reflection_templates   │
│────────────────────────│
│ id (PK)                │
│ scope                  │
│ organization_id        │◄─── NULL if scope='system'
│ created_by             │
│ approved_by            │
│ questions (JSONB)      │
│ status                 │
└────────────────────────┘
```

---

## Appendix C: Glossary

**Organization**: A healthcare entity (hospital, clinic, group practice) operating independently within StoryCare. Has its own users, data, and settings.

**Super Admin**: Platform-level administrator who manages organizations, not patients. Has read-only access to all orgs for support purposes. Can create organizations, change user roles, and perform emergency interventions.

**Organization Admin (Org Admin)**: Hospital-level administrator who manages users, templates, and settings within their organization. Cannot create new organizations (Super Admin only).

**Organization Join Code**: Unique code (e.g., "HEAL-WATERS-2025") that allows users to self-signup and request to join an organization. Can be enabled/disabled and regenerated by Org Admins.

**Pending User**: User who signed up with an organization code but has not yet been approved by the Org Admin. Status is "pending_approval" and cannot log in until approved.

**User Status**:
- **pending_approval**: User signed up but awaiting org admin approval
- **active**: User is approved and can access the system
- **inactive**: User is deactivated (soft delete, can be reactivated)

**Template Scope**:
- **System**: StoryCare-curated templates visible to all organizations
- **Organization**: Templates shared across all therapists in one organization
- **Private**: Templates visible only to the creator (therapist)

**Template Approval Workflow**: Process where therapists submit private templates for org admin review, and upon approval, they become org-wide templates.

**Data Isolation**: Complete separation of data between organizations. Hospital A cannot see Hospital B's data under any circumstance (except Super Admin for support).

**Org Boundary**: The security perimeter around an organization's data. All API requests enforce that users can only access data within their org boundary.

**Multi-Tenancy**: Architecture pattern where multiple independent customers (organizations) share the same application infrastructure while maintaining data isolation.

**Role Change**: Super Admin capability to change a user's role (e.g., promote therapist to org_admin). User must remain in same organization during role change.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-06 | AI Assistant | Initial PRD creation |
| 1.1 | 2025-11-06 | AI Assistant | Added: (1) Super Admin role change capability, (2) User self-signup with organization code, (3) Clarified Super Admin-only org creation |

---

**END OF DOCUMENT**
