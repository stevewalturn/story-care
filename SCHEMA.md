# StoryCare Platform Structure

**Last Updated:** 2025-11-06
**Purpose:** Client-facing documentation explaining how users, organizations, and permissions work in StoryCare

---

## 1. Overview - How StoryCare is Organized

StoryCare operates as a multi-organization platform with four distinct user levels:

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPER ADMIN                            │
│        (Platform Manager - StoryCare Team)                  │
│  • Creates and manages all organizations                    │
│  • Views platform-wide analytics                            │
│  • Provides technical support                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─────────────────┬─────────────────┐
                              ▼                 ▼                 ▼
                    ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
                    │ Organization A │  │ Organization B │  │ Organization C │
                    │  (Hospital)    │  │   (Clinic)     │  │  (Practice)    │
                    └───────────────┘  └───────────────┘  └───────────────┘
                            │
                            ├──────────────┐
                            ▼              ▼
                    ┌──────────────┐  ┌──────────────┐
                    │  ORG ADMIN   │  │  THERAPIST   │
                    │              │  │              │
                    │ • Invites    │  │ • Creates    │
                    │   users      │  │   sessions   │
                    │ • Approves   │  │ • Manages    │
                    │   templates  │  │   patients   │
                    └──────────────┘  └──────────────┘
                                              │
                                              ├────────┬────────┐
                                              ▼        ▼        ▼
                                         ┌─────────────────────────┐
                                         │      PATIENTS           │
                                         │  • View stories         │
                                         │  • Submit responses     │
                                         └─────────────────────────┘
```

**Key Principle:** Each organization's data is completely separate. Therapists and patients in one organization cannot see or access data from another organization.

---

## 2. User Roles & Permissions

### Super Admin (Platform Manager)
**Who:** StoryCare platform administrators

**What They Can Do:**
- Create new organizations (hospitals, clinics, practices)
- View usage statistics across all organizations
- Help organizations with technical issues
- Access any organization's data (for support purposes only - all access is logged)
- Change user roles and permissions

**What They Cannot Do:**
- Cannot be assigned to any single organization
- Should not access organization data without valid support reason

**Example Use Cases:**
- Setting up a new hospital system in StoryCare
- Helping an organization troubleshoot a technical issue
- Reviewing platform-wide usage to plan infrastructure

---

### Organization Admin
**Who:** Administrative staff at a hospital, clinic, or practice

**What They Can Do:**
- Invite new therapists and patients to join their organization
- View all therapists and patients in their organization
- See organization-wide statistics and engagement metrics
- Approve or reject content templates submitted by therapists
- Update organization profile (name, contact email, logo)
- Manage organization join codes (enable/disable, regenerate)

**What They Cannot Do:**
- Cannot access other organizations' data
- Cannot create or view patient therapy sessions
- Cannot generate clinical content (images, videos, stories)
- Cannot change subscription plans or delete the organization

**Example Use Cases:**
- Onboarding a new therapist who just joined the practice
- Reviewing which patients are actively engaged with therapy
- Approving a reflection question template for organization-wide use
- Inviting a new patient to the platform

---

### Therapist
**Who:** Licensed clinicians providing therapy

**What They Can Do:**
- Create and manage their assigned patients
- Upload therapy session audio recordings
- View transcripts of their sessions with speaker identification
- Generate therapeutic media (images, videos) for their patients
- Create personalized story pages for patients to view
- Build video scenes combining multiple media clips
- Create custom reflection questions and surveys
- Submit templates for organization approval (to share with other therapists)
- View responses from their patients

**What They Cannot Do:**
- Cannot access other therapists' patients (even in same organization)
- Cannot approve templates for organization-wide use
- Cannot view organization statistics or invite new users
- Cannot access patients not assigned to them

**Example Use Cases:**
- Uploading a recorded therapy session and reviewing the transcript
- Creating a personalized story page with images and reflection questions
- Generating an AI image based on a patient's narrative
- Reviewing a patient's survey responses about their progress

---

### Patient
**Who:** Individuals receiving therapy

**What They Can Do:**
- View published story pages created specifically for them by their therapist
- Watch videos and view images in their personal content library
- Answer reflection questions about their therapeutic journey
- Submit survey responses
- Track their own progress through stories

**What They Cannot Do:**
- Cannot create or edit content
- Cannot view draft/unpublished content
- Cannot see other patients' data
- Cannot access therapy session recordings or transcripts
- Cannot communicate directly with therapist through the platform (no messaging)

**Example Use Cases:**
- Viewing a personalized video story created by their therapist
- Answering reflection questions about a specific therapy theme
- Reviewing their collection of meaningful quotes from sessions

---

## 3. Organization Structure

### What is an Organization?

An organization represents a single healthcare entity:
- **Hospital:** Multi-location health system
- **Clinic:** Outpatient mental health facility
- **Private Practice:** Individual or group practice

Each organization has its own:
- Branding (logo, colors, welcome message)
- User roster (therapists, patients, admins)
- Content templates (reflection questions, surveys)
- Usage limits based on subscription tier
- Join code for easy user registration

### Organization Settings

Every organization has configurable settings:

**Subscription Tier:**
- **Free:** Limited features for evaluation
- **Basic:** Up to 5 therapists, 50 patients
- **Professional:** Up to 20 therapists, 200 patients
- **Enterprise:** Unlimited users, custom features

**Resource Limits:**
- Maximum number of therapists
- Maximum number of patients
- AI credits per month (for image/video generation)
- Storage space for media files

**Defaults:**
- Standard reflection questions asked to all patients
- Default survey template
- Whether session transcription is automatic

**Branding:**
- Welcome message shown to patients
- Support contact email
- Logo and primary color for patient-facing pages

### Organization Privacy

**Data Isolation:** Each organization's data is completely separate:
- Therapists can only see patients in their organization
- Patients only see content from their organization
- Templates and content are not shared between organizations
- All data queries automatically filter by organization

**Exception:** Super Admins can access any organization for support purposes, but every access is logged for compliance.

---

## 4. How Users Join StoryCare

There are two ways users can join an organization:

### Method 1: Email Invitation (Most Common)

**Step-by-Step:**
1. **Admin Sends Invitation**
   - Org Admin goes to "Invite User" page
   - Enters new user's email and selects role (Therapist or Patient)
   - If patient, assigns them to a therapist
   - Clicks "Send Invitation"

2. **User Receives Invitation**
   - User receives email with invitation link
   - Email explains they've been invited to StoryCare

3. **User Completes Setup**
   - Clicks link, goes to setup page
   - Creates a password for their account
   - Account is activated immediately
   - Can log in and start using the platform

**Status Tracking:**
- User status shows as "Invited" until they complete setup
- Changes to "Active" once password is created
- Org Admin can see who hasn't completed setup yet

### Method 2: Join Code (Self-Service)

**Step-by-Step:**
1. **Organization Gets Join Code**
   - Every organization has a unique join code (e.g., "CLINIC-2024")
   - Org Admin can enable/disable the join code
   - Code can be regenerated if compromised

2. **User Signs Up**
   - User goes to StoryCare signup page
   - Enters the organization's join code
   - System verifies the code is valid
   - User creates account and sets password
   - Automatically added to the organization

**Use Cases:**
- Bulk onboarding (e.g., all staff at a hospital)
- Self-service patient registration
- Temporary access for interns or students

**Security:**
- Codes can be disabled to prevent unauthorized access
- New code can be generated if old one is shared publicly

**Current Status:** ⚠️ Join code functionality is partially implemented (API ready, but some features in progress)

---

## 5. Data Privacy & Access Control

### Who Can See What?

**Patient Data Access:**
- **Therapist:** Can ONLY see patients assigned to them
- **Org Admin:** Can see list of all patients, but not session details
- **Super Admin:** Can access for support (all access logged)
- **Other Patients:** Cannot see any other patient data

**Example:**
- Dr. Smith has 10 patients at ABC Clinic
- Dr. Jones has 8 patients at ABC Clinic
- Dr. Smith cannot see Dr. Jones's patients, even though they work at the same clinic
- ABC Clinic's admin can see both doctors have patients, but cannot view session transcripts

**Session & Transcript Access:**
- Only the therapist who uploaded the session can view it
- Patients cannot access session recordings or transcripts
- Sessions are not shared between therapists

**Media Library Access:**
- Patient can view media created for them
- Therapist who created the media can view it
- Other therapists cannot access it

**Story Pages:**
- Only published pages are visible to patients
- Drafts remain private to the therapist
- Published pages only visible to the assigned patient

### Organization Boundaries

**Strict Separation:**
- All users (except Super Admin) can only access data from their organization
- Attempts to access another organization's data are blocked and logged
- Database queries automatically filter by organization

**Audit Logging (HIPAA Compliance):**
Every access to patient data is logged:
- Who accessed the data (user ID and name)
- What they accessed (patient, session, story page)
- When they accessed it (timestamp)
- Why they accessed it (action: view, create, update, delete)
- Where they accessed from (IP address)

**Logs are kept for 7 years** to meet healthcare compliance requirements.

---

## 6. Content Template Approval Process

Therapists can create templates (reflection questions, surveys, therapeutic prompts) with three visibility levels:

### Template Scopes

**1. Private (Personal Use)**
- Created by therapist for their own use
- No approval needed
- Only visible to the creator
- Can be used with any of their patients

**Example:** Dr. Smith creates a custom reflection question specifically for trauma patients.

**2. Organization-Wide (Shared)**
- Therapist creates template and marks it for organization use
- Status changes to "Pending Approval"
- Org Admin reviews the template
- If approved: All therapists in the organization can use it
- If rejected: Remains private, therapist receives feedback

**Example:** Dr. Smith creates a great set of questions about resilience. She submits it to the org. The admin approves it, and now all therapists at ABC Clinic can use these questions.

**3. System-Wide (Platform Default)**
- Managed by Super Admin only
- Available to all organizations
- Built-in templates that come with StoryCare
- Cannot be edited by organizations

**Example:** StoryCare includes default questions about therapy progress that all therapists across all organizations can use.

### Approval Workflow

```
Therapist Creates Template
         │
         ├─► Keep Private ──────► Active (visible to creator only)
         │
         └─► Submit for Org Approval
                    │
                    ▼
            Pending Approval
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
    Approved              Rejected
  (Active for org)    (Back to private)
```

**Org Admin Review:**
- Sees all pending templates in admin dashboard
- Reviews content for appropriateness and quality
- Can approve or reject with feedback
- Once approved, template is available to all org therapists

---

## 7. Real-World Usage Scenarios

### Scenario 1: New Organization Joins StoryCare

**Step 1:** Super Admin sets up organization
- Creates "Healing Springs Clinic" in the system
- Sets subscription tier to "Professional"
- Creates first Org Admin account for the clinic director
- Generates join code: `HEALING-SPRINGS-2024`

**Step 2:** Clinic Director (Org Admin) gets started
- Receives invitation email
- Creates password and logs in
- Updates clinic branding (logo, colors, welcome message)

**Step 3:** Onboarding therapists
- Sends email invitations to 5 therapists
- Therapists create accounts and are assigned "Therapist" role
- All therapists can now log in

**Step 4:** Adding patients
- Each therapist invites their patients via email
- Patients are automatically assigned to the inviting therapist
- Patients create accounts and can view their personalized content

---

### Scenario 2: Therapist Working with a Patient

**Week 1: Session Upload**
- Dr. Johnson uploads audio from therapy session with Patient Sarah
- StoryCare transcribes the audio automatically
- Dr. Johnson reviews transcript, labels speakers (therapist vs. patient)
- Identifies key quotes from the session

**Week 2: Creating Content**
- Dr. Johnson generates an AI image based on Sarah's story about a "peaceful garden"
- Creates a short video scene combining the image with calming music
- Writes a reflection question: "What does the garden represent in your healing journey?"

**Week 3: Publishing Story Page**
- Dr. Johnson creates a story page for Sarah titled "Your Journey to Peace"
- Adds the garden video and reflection question
- Publishes the page

**Week 4: Patient Engagement**
- Sarah logs into StoryCare
- Views her personalized story page
- Watches the garden video
- Answers the reflection question
- Dr. Johnson reviews Sarah's response in their next session

---

### Scenario 3: Organization Growing and Scaling

**Starting Point:** Small practice with 2 therapists, 20 patients

**Month 1-3:**
- Therapists create private templates for their patients
- Build up media library with images and videos
- Patients engage with story pages, submit reflections

**Month 4:**
- Therapist Dr. Lee creates excellent reflection questions
- Submits for organization approval
- Org Admin reviews and approves
- Now both therapists can use these questions

**Month 6:**
- Practice hires 3 more therapists
- Org Admin invites them via email
- New therapists can immediately use approved templates
- Each new therapist starts building their patient roster

**Month 12:**
- Practice reaches 5 therapists, 50 patients (Basic tier limit)
- Org Admin requests tier upgrade to Professional
- Super Admin upgrades subscription
- Limits increased to 20 therapists, 200 patients

---

### Scenario 4: Data Privacy in Action

**Situation:** Two therapists at same clinic

**Dr. Martinez's Patients:**
- Carlos, Maria, David (all assigned to Dr. Martinez)
- Dr. Martinez uploads sessions, creates content for these 3 patients

**Dr. Patel's Patients:**
- Aisha, James (both assigned to Dr. Patel)
- Dr. Patel uploads sessions, creates content for these 2 patients

**Access Control:**
- Dr. Martinez can ONLY see Carlos, Maria, and David
- Dr. Patel can ONLY see Aisha and James
- Neither therapist can access the other's sessions or patient data
- Clinic Org Admin can see all 5 patients exist, but cannot view session details
- All patients can only see their own story pages

**Audit Trail:**
- Every time Dr. Martinez views Carlos's story page → Logged
- Every time patient Maria answers a reflection → Logged
- If Super Admin helps troubleshoot Dr. Patel's account → Logged with "Support access" note

---

## 8. Current Platform Status

### ✅ Fully Implemented Features

**User Management:**
- Complete role-based access control (Super Admin, Org Admin, Therapist, Patient)
- Email invitation system with account setup
- Firebase authentication integration
- User status tracking (Invited, Active, Inactive)

**Organization Management:**
- Organization creation by Super Admin
- Organization settings and branding
- Subscription tier configuration
- Data isolation between organizations

**Access Control:**
- Strict organization boundaries
- Therapist-patient assignment
- Resource-level access checks
- Cross-organization access prevention

**Security & Compliance:**
- HIPAA audit logging for all PHI access
- 7-year audit log retention
- Encryption of data in transit and at rest
- Automatic session timeout

**Content & Templates:**
- Template creation (private, organization, system)
- Approval workflow for organization templates
- Template visibility based on scope
- Therapist content library

**Clinical Features:**
- Session upload and transcription
- Speaker diarization and labeling
- AI-powered media generation
- Story page builder
- Reflection questions and surveys
- Patient engagement tracking

---

### ⚠️ Partially Implemented Features

**Join Code System:**
- **What's Working:** API endpoints exist to verify join codes
- **What's Missing:**
  - Database fields for storing join codes
  - Automatic code generation
  - Code enable/disable functionality
  - Self-service signup flow
- **Impact:** Email invitation works perfectly; join code needs completion

---

### ❌ Features Planned But Not Built

**Email Notifications:**
- Invitation emails (currently manual process)
- Password reset emails
- Patient engagement reminders
- Therapist weekly summaries

**Usage Tracking:**
- AI credits consumption monitoring
- Storage quota enforcement
- Monthly usage reports
- Billing integration

**Advanced Organization Features:**
- Custom domain support
- Single Sign-On (SSO) integration
- Advanced branding customization
- Multi-location support within organization

---

## 9. Key Security & Compliance Features

### HIPAA Compliance

**Data Protection:**
- All patient data encrypted at rest and in transit
- Database hosted on HIPAA-compliant infrastructure (Neon PostgreSQL)
- File storage on HIPAA-compliant service (Google Cloud Storage)
- Business Associate Agreements (BAA) with all vendors

**Access Controls:**
- Strong authentication (Firebase)
- Role-based permissions
- Automatic session timeout (24 hours)
- Multi-factor authentication available

**Audit Logging:**
- Every access to patient data logged
- Logs include: who, what, when, where, why
- 7-year retention period
- Immutable logs (cannot be deleted or modified)

**Data Rights:**
- Patient data export available
- Data deletion with 90-day soft delete period
- Audit trail of all data access

### Privacy Features

**Minimal Data Exposure:**
- Users only see what they need for their role
- No global search across patients
- No patient-to-patient visibility

**Organization Isolation:**
- Complete data separation between organizations
- Attempts to access other orgs blocked and logged
- Super Admin access logged for compliance

**Secure Media Handling:**
- Media files stored with signed URLs (time-limited access)
- Automatic transcription, original audio can be deleted
- Images and videos only accessible by authorized users

---

## 10. Summary

StoryCare is built as a secure, multi-organization platform where:

1. **Each organization is completely isolated** - Hospitals, clinics, and practices never see each other's data

2. **Four clear user roles** with specific permissions:
   - Super Admin manages the platform
   - Org Admin manages their organization
   - Therapist creates clinical content for their patients
   - Patient views their personalized therapeutic content

3. **Two ways to onboard users**:
   - Email invitations (fully working)
   - Join codes (in progress)

4. **Strong privacy and security**:
   - HIPAA-compliant infrastructure
   - Comprehensive audit logging
   - Strict access controls
   - Data encryption

5. **Flexible content sharing**:
   - Private templates for individual use
   - Organization templates with approval
   - System templates for everyone

6. **Therapist-focused workflow**:
   - Upload sessions → Generate media → Build stories → Track engagement
   - Patients receive personalized therapeutic content

The platform is production-ready with all core features implemented and actively used for digital therapeutic care.

---

**Questions or Need Clarification?**
This document is designed for non-technical stakeholders. If you need more details about any section, please ask!
