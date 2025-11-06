# HIPAA Compliance Documentation - StoryCare

This document outlines the HIPAA (Health Insurance Portability and Accountability Act) compliance measures implemented in the StoryCare application, specifically for the Story Pages and Patient Responses features.

## Table of Contents
1. [Overview](#overview)
2. [Protected Health Information (PHI)](#protected-health-information-phi)
3. [Technical Safeguards](#technical-safeguards)
4. [Administrative Safeguards](#administrative-safeguards)
5. [Audit Logging](#audit-logging)
6. [Access Control](#access-control)
7. [Data Security](#data-security)
8. [Compliance Checklist](#compliance-checklist)

## Overview

StoryCare is a digital therapeutic platform that handles Protected Health Information (PHI) including:
- Patient reflection responses
- Survey responses
- Story page assignments
- Therapy session data
- Patient-therapist relationships

All features have been implemented with HIPAA Security Rule compliance as a primary requirement.

## Protected Health Information (PHI)

### What is PHI in StoryCare?

The following data types are considered PHI and are protected accordingly:

1. **Patient Responses**
   - Reflection question answers (free text)
   - Survey responses (ratings, choices)
   - Completion timestamps
   - Response history

2. **Patient Identifiers**
   - Patient names
   - Email addresses
   - Database UUIDs linked to patient records
   - Therapist-patient assignments

3. **Clinical Content**
   - Story pages assigned to specific patients
   - Reflection and survey questions
   - Progress tracking data

## Technical Safeguards

### 1. Authentication & Authorization

#### Firebase Authentication
- **Token-based authentication**: All API requests require valid Firebase ID tokens
- **Email verification required**: Users must verify email before accessing PHI
- **Session management**: 24-hour token expiration (configurable)
- **Idle timeout**: 15-minute automatic logout after inactivity

#### Role-Based Access Control (RBAC)
Implemented using `requireAuth()` and `requireRole()` helpers from `/src/utils/AuthHelpers.ts`:

```typescript
// Patients can only submit responses for their own pages
const user = await requireRole(request, ['patient']);

// Therapists can only access their assigned patients
const user = await requireRole(request, ['therapist', 'org_admin', 'super_admin']);
```

#### Access Control Matrix

| Role | Questions API | Submit Responses | View Responses |
|------|--------------|------------------|----------------|
| **Patient** | Own published pages only | Own pages only | Own responses only |
| **Therapist** | Assigned patients' pages | ❌ Not allowed | Assigned patients only |
| **Org Admin** | Organization patients | ❌ Not allowed | Organization patients |
| **Super Admin** | All pages (audited) | ❌ Not allowed | All patients (audited) |

### 2. Input Validation

All user inputs are validated using **Zod schemas** to prevent:
- SQL injection (via Drizzle ORM parameterized queries)
- XSS attacks (input sanitization)
- Data integrity issues
- Oversized payloads

Example from `/src/app/api/responses/reflection/route.ts`:

```typescript
const reflectionResponseSchema = z.object({
  responses: z.array(
    z.object({
      questionId: z.string().uuid('Invalid question ID format'),
      pageId: z.string().uuid('Invalid page ID format'),
      responseText: z.string()
        .min(1, 'Response text cannot be empty')
        .max(10000, 'Response text too long'),
    }),
  ).min(1, 'At least one response is required').max(100, 'Too many responses in one request'),
});
```

### 3. Data Encryption

#### In Transit
- **TLS 1.2+** required for all API communications
- HTTPS enforced via Vercel edge network
- Certificate pinning available for mobile apps

#### At Rest
- **Neon PostgreSQL** with encryption at rest enabled
- Firebase Authentication uses Google's encrypted infrastructure
- Database backups are encrypted

### 4. Organization Boundaries

Multi-tenancy isolation ensures:
- Therapists only access patients in their organization
- Org admins cannot access other organizations' data
- Super admins require explicit authorization (BAA signed)

Example from `/src/app/api/therapist/responses/route.ts`:

```typescript
// Org Admins: Only patients in their organization
if (user.role === 'org_admin') {
  if (!user.organizationId) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 400 });
  }
  patientsQuery = patientsQuery.where(eq(users.organizationId, user.organizationId));
}
```

## Administrative Safeguards

### 1. User Management

- **Invite-only system**: No public registration
- **Status tracking**: `invited`, `active`, `inactive`
- **Email verification**: Required before PHI access
- **MFA support**: Available via Firebase (recommended for production)

### 2. Minimum Necessary Standard

APIs return only data necessary for the specific task:
- Patients receive only their assigned pages
- Therapists receive only their patients' data
- Summary endpoints exclude detailed PHI

### 3. Training & Documentation

- **CLAUDE.md**: Developer guidance on HIPAA requirements
- **Code comments**: Security notes on all PHI-handling functions
- **Error messages**: Generic messages to avoid PHI leakage

## Audit Logging

### Comprehensive Audit Trail

All PHI access is logged via `/src/services/AuditService.ts`:

#### What is Logged

| Action | Resource Type | Details Captured |
|--------|--------------|------------------|
| Read questions | `reflection_question` / `survey_question` | Block IDs, question count, page IDs |
| Create response | `reflection_response` / `survey_response` | Response ID, patient ID |
| Update response | `reflection_response` | Response ID, patient ID |
| Delete response | `survey_response` | Response ID, patient ID |
| View patient responses | `reflection_response` (bulk) | Patient IDs, response count |

#### Audit Log Schema

```typescript
{
  userId: string; // Who accessed
  organizationId: string; // Which organization
  action: 'create' | 'read' | 'update' | 'delete';
  resourceType: string; // What type of data
  resourceId: string; // Specific resource ID
  ipAddress: string; // From where
  userAgent: string; // Which client
  requestMethod: string; // HTTP method
  requestPath: string; // API endpoint
  metadata: object; // Additional context
  timestamp: Date; // When
}
```

### Retention Policy

- **Minimum 7 years** (HIPAA requirement)
- Logs are **write-only** for non-admin users
- **Tamper-proof**: PostgreSQL audit trail with database-level constraints

### Audit Examples

```typescript
// Individual PHI creation
await logPHIAccess(
  request,
  user,
  'create',
  'reflection_response',
  responseId,
  patientId
);

// Bulk PHI access
await logBulkPHIAccess(
  request,
  user,
  'reflection_response',
  totalResponseCount,
  [patientId1, patientId2]
);
```

## Access Control

### Patient Access Controls

**Questions API** (`/api/questions/reflection`, `/api/questions/survey`):
- ✅ Requires authentication
- ✅ Verifies page is published
- ✅ Verifies page is assigned to patient
- ✅ Blocks access to draft pages
- ✅ Logs all question retrievals

**Submit Responses** (`/api/responses/reflection`, `/api/responses/survey`):
- ✅ Only patients can submit
- ✅ Validates all input with Zod
- ✅ Verifies page ownership
- ✅ Prevents cross-patient submissions
- ✅ Logs every response creation/update

### Therapist Access Controls

**View Responses** (`/api/therapist/responses`, `/api/therapist/responses/[patientId]`):
- ✅ Requires therapist/admin role
- ✅ Enforces patient-therapist assignments
- ✅ Organization boundary checks
- ✅ Bulk access logging
- ✅ Cannot modify patient responses (read-only)

### Access Verification Flow

```typescript
// 1. Authenticate user
const user = await requireRole(request, ['patient']);

// 2. Verify resource ownership
const [page] = await db.select().from(storyPages).where(eq(storyPages.id, pageId));

if (page.patientId !== user.dbUserId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// 3. Check page status
if (page.status !== 'published') {
  return NextResponse.json({ error: 'Page not published' }, { status: 403 });
}

// 4. Log access
await logPHIAccess(request, user, 'read', 'story_page', pageId, patientId);
```

## Data Security

### 1. SQL Injection Prevention

**Drizzle ORM** with parameterized queries:

```typescript
// ✅ SAFE - Parameterized query
const [page] = await db
  .select()
  .from(storyPages)
  .where(eq(storyPages.id, pageId));

// ❌ UNSAFE - String concatenation (never used)
// const query = `SELECT * FROM story_pages WHERE id = '${pageId}'`;
```

### 2. XSS Prevention

- **Input validation**: Maximum length checks (10,000 chars for reflections)
- **Output encoding**: React automatically escapes HTML
- **Content Security Policy**: Configured in Next.js middleware

### 3. Rate Limiting

**Arcjet integration** (configured in `src/libs/Arcjet.ts`):
- API endpoint rate limiting
- Bot detection
- WAF protection against OWASP Top 10

### 4. Error Handling

Generic error messages prevent information leakage:

```typescript
// ✅ GOOD - Generic message
return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

// ❌ BAD - Leaks patient info
// return NextResponse.json({ error: `Patient ${patientName} not found` }, { status: 404 });
```

## Compliance Checklist

### Implemented ✅

- [x] **Authentication**: Firebase Authentication with token verification
- [x] **Authorization**: Role-based access control (RBAC)
- [x] **Encryption in transit**: HTTPS/TLS 1.2+
- [x] **Encryption at rest**: Neon PostgreSQL encrypted storage
- [x] **Audit logging**: Comprehensive audit trail for all PHI access
- [x] **Access controls**: Organization boundaries, therapist-patient assignments
- [x] **Input validation**: Zod schemas on all endpoints
- [x] **SQL injection prevention**: Parameterized queries via Drizzle ORM
- [x] **XSS prevention**: Input sanitization and React auto-escaping
- [x] **Session management**: 24-hour token expiration, 15-min idle timeout
- [x] **Error handling**: Generic error messages
- [x] **Minimum necessary**: APIs return only required data

### Required for Production 🔲

- [ ] **Business Associate Agreements (BAA)**:
  - [ ] Neon (database)
  - [ ] Google Cloud / Firebase (authentication)
  - [ ] Vercel (hosting)
  - [ ] Deepgram (transcription)
  - [ ] Sentry (error tracking)

- [ ] **Security Measures**:
  - [ ] Enable MFA for all therapist accounts
  - [ ] Implement automatic session timeout warnings
  - [ ] Configure data retention policies (7-year minimum)
  - [ ] Set up automated security scanning
  - [ ] Implement data backup encryption verification

- [ ] **Compliance Documentation**:
  - [ ] Risk assessment documentation
  - [ ] Incident response plan
  - [ ] Data breach notification procedures
  - [ ] Employee training records
  - [ ] Access control review logs

- [ ] **Monitoring & Alerts**:
  - [ ] Set up alerts for audit log failures
  - [ ] Monitor failed authentication attempts
  - [ ] Track unusual data access patterns
  - [ ] Configure uptime monitoring (Checkly)

## API Security Summary

### Questions APIs

| Endpoint | Auth | RBAC | Validation | Audit | Notes |
|----------|------|------|------------|-------|-------|
| `GET /api/questions/reflection` | ✅ | ✅ | ✅ | ✅ | Verifies page access, logs question retrieval |
| `GET /api/questions/survey` | ✅ | ✅ | ✅ | ✅ | Verifies page access, logs question retrieval |

### Response Submission APIs

| Endpoint | Auth | RBAC | Validation | Audit | Notes |
|----------|------|------|------------|-------|-------|
| `POST /api/responses/reflection` | ✅ | ✅ | ✅ Zod | ✅ | Patients only, validates ownership, logs create/update |
| `POST /api/responses/survey` | ✅ | ✅ | ✅ Zod | ✅ | Patients only, validates ownership, logs create/delete |

### Therapist Responses APIs

| Endpoint | Auth | RBAC | Validation | Audit | Notes |
|----------|------|------|------------|-------|-------|
| `GET /api/therapist/responses` | ✅ | ✅ | ✅ | ✅ | Therapist/admin only, bulk logging, patient filtering |
| `GET /api/therapist/responses/[patientId]` | ✅ | ✅ | ✅ | ✅ | Verifies patient assignment, bulk logging |

## Contact & Support

For HIPAA compliance questions or security concerns:
- **Security Issues**: Report via GitHub Security Advisory
- **Compliance Questions**: Contact your organization's compliance officer
- **Technical Support**: See README.md for contact information

---

**Last Updated**: 2025-01-06
**Version**: 1.0
**Maintained By**: StoryCare Development Team
**Next Review Date**: 2025-04-06 (Quarterly review required)
