# StoryCare Platform Structure

> **Purpose:** How users, organizations, and permissions work in StoryCare
> **Last Updated:** Nov 6, 2025

---

## Platform Hierarchy

**Super Admin** (StoryCare Team)
↓ Creates & manages
**Organizations** (Hospitals, Clinics, Practices)
↓ Contains
**Org Admins** + **Therapists**
↓ Manages
**Patients**

> **Key Rule:** Each organization's data is completely isolated. No cross-organization access.

## User Roles

### 🔧 Super Admin
**Who:** StoryCare platform team

**Can Do:**
- Create/manage all organizations
- View platform-wide analytics
- Access any org for support (logged)
- Manage user roles

**Cannot:**
- Shouldn't access org data without support reason

---

### 👔 Org Admin
**Who:** Hospital/clinic administrators

**Can Do:**
- Invite therapists and patients
- View all users in organization
- Approve/reject templates
- Manage org settings & join codes
- View org-wide metrics

**Cannot:**
- Access other organizations
- View therapy sessions
- Create clinical content

---

### 👨‍⚕️ Therapist
**Who:** Licensed clinicians

**Can Do:**
- Manage assigned patients only
- Upload sessions & view transcripts
- Generate AI media (images, videos)
- Create story pages & scenes
- Submit templates for approval
- View patient responses

**Cannot:**
- Access other therapists' patients
- Approve templates
- Invite users

---

### 🧑‍🦱 Patient
**Who:** Individuals in therapy

**Can Do:**
- View published story pages
- Answer reflection questions
- Submit survey responses
- View personal media library

**Cannot:**
- Create/edit content
- See other patients' data
- Access session recordings

## Organizations

Each organization (hospital/clinic/practice) has:

**Settings:**
- Branding: logo, colors, welcome message
- User limits based on subscription tier
- AI credits & storage quota
- Join code for user signup

**Subscription Tiers:**

| Tier | Therapists | Patients | Features |
|------|-----------|----------|----------|
| Free | Limited | Limited | Evaluation |
| Basic | 5 | 50 | Standard |
| Professional | 20 | 200 | Advanced |
| Enterprise | Unlimited | Unlimited | Custom |

**Privacy:**
- Complete data isolation between organizations
- All queries auto-filter by organization
- Cross-org access blocked & logged

## User Onboarding

### ✅ Email Invitation (Active)

1. Org Admin invites user with email + role
2. User receives invitation email
3. User creates password & activates account
4. Status: "Invited" → "Active"

### ⚠️ Join Code (In Progress)

1. Org has unique code (e.g., "CLINIC-2024")
2. User enters code at signup
3. Auto-added to organization
4. Org Admin can enable/disable code

**Use:** Bulk onboarding, self-service registration

## Data Privacy

### Access Rules

| Resource | Therapist | Org Admin | Patient |
|----------|-----------|-----------|---------|
| **Sessions** | Own sessions only | ❌ No access | ❌ No access |
| **Patient Data** | Assigned patients only | List only, no details | Own data only |
| **Media Library** | Own creations only | ❌ No access | Own media only |
| **Story Pages** | Own drafts & published | ❌ No access | Published only |

**Example:**
- Dr. Smith (ABC Clinic) has 10 patients
- Dr. Jones (ABC Clinic) has 8 patients
- They **cannot** see each other's patients, even in same clinic
- ABC Admin sees user lists, **not** session details

### HIPAA Audit Logging

Every patient data access logged:
- **Who:** User ID & name
- **What:** Resource type & ID
- **When:** Timestamp
- **Why:** Action (view/create/update/delete)
- **Where:** IP address

**Retention:** 7 years

## Template Sharing

Templates (reflection questions, surveys) have 3 scopes:

| Scope | Who Can Use | Approval | Examples |
|-------|------------|----------|----------|
| **Private** | Creator only | None | Custom questions for specific patient |
| **Organization** | All therapists in org | Org Admin approval | Shared resilience questions |
| **System** | Everyone | Super Admin only | Platform defaults |

**Workflow:**
1. Therapist creates template (private)
2. Optionally submits for org approval
3. Org Admin reviews → Approve/Reject
4. If approved → All org therapists can use

## Usage Examples

### Example 1: New Organization Setup
1. Super Admin creates "Healing Springs Clinic" (Professional tier)
2. Clinic Director invited as Org Admin
3. Director invites 5 therapists
4. Each therapist invites their patients

### Example 2: Therapist Workflow
**Week 1:** Upload session → Auto-transcription → Label speakers
**Week 2:** Generate AI image → Create video scene → Write reflection question
**Week 3:** Build story page → Publish for patient
**Week 4:** Patient views, answers reflection → Therapist reviews response

### Example 3: Privacy in Action
- Dr. Martinez: 3 patients (Carlos, Maria, David)
- Dr. Jones: 2 patients (Aisha, James)
- Same clinic, but **cannot** see each other's patients
- All access logged for HIPAA compliance

## Implementation Status

### ✅ Fully Working

**Core Features:**
- 4-tier role system (Super Admin, Org Admin, Therapist, Patient)
- Email invitation & account setup
- Organization isolation & privacy
- HIPAA audit logging (7-year retention)
- Template approval workflow
- Session transcription & AI media generation
- Story page builder
- Patient engagement tracking

### ⚠️ In Progress

**Join Code System:** API ready, needs database schema updates

### ❌ Planned

- Email notifications (invitations, reminders)
- Usage tracking (AI credits, storage)
- SSO integration
- Custom domains

## Security & HIPAA Compliance

### Data Protection
- ✅ Encryption at rest and in transit
- ✅ HIPAA-compliant hosting (Neon PostgreSQL, Google Cloud Storage)
- ✅ Business Associate Agreements (BAA) with all vendors
- ✅ Automatic session timeout (24 hours)
- ✅ MFA available

### Audit & Privacy
- ✅ All patient data access logged (who, what, when, where, why)
- ✅ 7-year immutable log retention
- ✅ Role-based access (users see only what they need)
- ✅ Organization data isolation
- ✅ 90-day soft delete for data removal

### Media Security
- Signed URLs with time-limited access
- Auto-transcription (original audio optional)
- Authorized access only

---

## Summary

**StoryCare Platform:**
- Multi-organization system (hospitals, clinics, practices)
- Complete data isolation between organizations
- 4 user roles with strict permissions
- HIPAA-compliant infrastructure
- Full audit logging for compliance
- Template sharing with approval workflow
- Production-ready core features

**User Flow:**
Super Admin creates orgs → Org Admin invites therapists → Therapists manage patients → Patients view personalized content

**Status:** Production-ready with email invitations (join codes in progress)
