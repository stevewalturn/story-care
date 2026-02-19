# RBAC Permission Matrix

> Role-Based Access Control matrix for StoryCare -- 4 roles with hierarchical permissions, organization boundaries, and therapist-patient assignment rules.

---

## Roles

| Role | Key | Description | Scope |
|---|---|---|---|
| **Super Admin** | `super_admin` | Platform-wide administrative access. Manages all organizations, users, system templates, AI models, and audit logs. | Global (all organizations) |
| **Org Admin** | `org_admin` | Organization-level management. Manages therapists, patients, modules, templates, and prompts within their organization. | Single organization |
| **Therapist** | `therapist` | Primary clinical user. Uploads sessions, analyzes transcripts, generates media, creates story pages, and manages assigned patients. | Own patients within organization |
| **Patient** | `patient` | End user / consumer. Views personalized story pages, watches media, answers reflection questions, and submits surveys. | Own data only |

---

## Authorization Helpers

The following functions in `src/utils/AuthHelpers.ts` enforce access control:

| Function | Allowed Roles | Description |
|---|---|---|
| `requireAuth(request)` | Any authenticated user | Verifies Bearer token, returns user object |
| `requireRole(request, roles)` | Specified roles | Verifies token + checks role membership |
| `requireTherapist(request)` | therapist, org_admin, super_admin | Convenience for clinical endpoints |
| `requireAdmin(request)` | org_admin, super_admin | Convenience for admin endpoints |
| `canAccessPatient(user, ...)` | Varies by role | Checks patient access per rules below |
| `verifyTherapistPatientAccess(user, patientId)` | Varies by role | Full DB lookup for patient access verification |

---

## Full Permission Matrix

Legend: **C** = Create, **R** = Read, **L** = List, **U** = Update, **D** = Delete, **--** = No access

### User Management

| Resource | Super Admin | Org Admin | Therapist | Patient |
|---|---|---|---|---|
| Users (all) | L, R | -- | -- | -- |
| Users (change role) | C | -- | -- | -- |
| Organizations | C, R, L, U, D | R, U (own) | -- | -- |
| Org Admins | C (invite) | -- | -- | -- |
| Therapists | L, R, U, D | C, L, R, U, D (own org) | R (self) | -- |
| Patients | L, R | L, R (own org) | C, L, R, U, D (assigned) | R (self) |
| Patient Archive | -- | -- | C, D (own patients) | -- |
| Pending Invitations | L, R, U | -- | -- | -- |

### Session Management

| Resource | Super Admin | Org Admin | Therapist | Patient |
|---|---|---|---|---|
| Sessions | L, R | -- | C, L, R, U, D | -- |
| Session Upload | -- | -- | C | -- |
| Session Transcribe | -- | -- | C | -- |
| Transcript | R | -- | R | -- |
| Speakers | R, U | -- | R, U | -- |
| Speaker Merge | -- | -- | C | -- |
| Utterances | R, U | -- | R, U | -- |
| Session Chat (AI) | -- | -- | C, R | -- |
| Session Summary | R | -- | R | -- |
| Session Archive | -- | -- | C, D | -- |
| Recordings | -- | -- | C, L, R, D | -- |
| Recording Links | -- | -- | C, L, R, D | -- |

### Content & Media

| Resource | Super Admin | Org Admin | Therapist | Patient |
|---|---|---|---|---|
| Media Library | R | -- | C, L, R, U, D | -- |
| Media Upload | -- | -- | C | -- |
| Media Signed URL | R | -- | R | -- |
| Quotes | R | -- | C, L, R, U, D | -- |
| Notes | R | -- | C, L, R, U, D | -- |
| Patient Ref Images | R | R | C, L, R, U, D | -- |

### AI Services

| Resource | Super Admin | Org Admin | Therapist | Patient |
|---|---|---|---|---|
| AI Chat | -- | -- | C | -- |
| AI Generate Image | -- | -- | C | -- |
| AI Generate Video | -- | -- | C | -- |
| AI Generate Music | -- | -- | C | -- |
| AI Generate Scenes | -- | -- | C | -- |
| AI Extract Quotes | -- | -- | C | -- |
| AI Optimize Prompt | -- | -- | C | -- |
| AI Models (admin) | C, L, R, U, D | -- | -- | -- |
| AI Models (list active) | R | R | R | -- |

### Scenes & Video

| Resource | Super Admin | Org Admin | Therapist | Patient |
|---|---|---|---|---|
| Scenes | R | -- | C, L, R, U, D | -- |
| Scene Clips | R | -- | C, L, R, U, D | -- |
| Scene Audio Tracks | R | -- | C, L, R, U, D | -- |
| Scene Assemble | -- | -- | C, R | -- |
| Video Transcode | -- | -- | C, R | -- |
| Video Jobs | R | -- | C, L, R, D | -- |

### Story Pages

| Resource | Super Admin | Org Admin | Therapist | Patient |
|---|---|---|---|---|
| Story Pages | R | -- | C, L, R, U, D | -- |
| Page Share Links | R | -- | C, L, R, D | -- |
| Page Responses | R | -- | R | C (via share link) |
| Shared Pages (public) | -- | -- | -- | R (via token) |

### Treatment Modules

| Resource | Super Admin | Org Admin | Therapist | Patient |
|---|---|---|---|---|
| System Module Templates | C, L, R, U, D | -- | -- | -- |
| Org Modules | R | C, L, R, U, D | -- | -- |
| Therapist Modules | R | R | C, L, R, U, D | -- |
| Module Assignment | -- | -- | C | -- |
| Module Analysis | -- | -- | C, R | -- |
| Generate Story Page | -- | -- | C | -- |

### Templates (Reflection & Survey)

| Resource | Super Admin | Org Admin | Therapist | Patient |
|---|---|---|---|---|
| System Templates | C, L, R, U | -- | -- | -- |
| Org Templates | R | C, L, R, U | -- | -- |
| Therapist Templates | R | R | C, L, R, U, D | -- |
| Pending Templates | L, R | L, R | -- | -- |
| Template Approval | C (approve/reject) | -- | -- | -- |
| Reflection Questions | R | R | R | R |
| Survey Questions | R | R | R | R |

### AI Prompts

| Resource | Super Admin | Org Admin | Therapist | Patient |
|---|---|---|---|---|
| System Prompts | C, L, R, U, D | -- | -- | -- |
| Org Prompts | R | C, L, R, U, D | -- | -- |
| Therapist Prompts | R | R | C, L, R, U, D | -- |
| Prompt Ordering | -- | -- | R, U, D | -- |

### Assessments

| Resource | Super Admin | Org Admin | Therapist | Patient |
|---|---|---|---|---|
| Assessment Instruments | C, L, R, U, D | -- | L, R | -- |
| Assessment Sessions | R | -- | C, L, R, U, D | -- |
| Assessment Responses | R | -- | C, R | -- |
| Complete Assessment | -- | -- | C | -- |

### Responses

| Resource | Super Admin | Org Admin | Therapist | Patient |
|---|---|---|---|---|
| Reflection Responses | R | -- | R (own patients) | C |
| Survey Responses | R | -- | R (own patients) | C |
| Patient Responses | R | R (own org) | R (own patients) | R (own) |

### Platform Administration

| Resource | Super Admin | Org Admin | Therapist | Patient |
|---|---|---|---|---|
| Platform Metrics | R | -- | -- | -- |
| Org Metrics | R | R (own) | -- | -- |
| Dashboard Stats | R | R | R | -- |
| Patient Engagement | R | R | R | -- |
| Platform Settings | R, U | -- | -- | -- |
| Org Settings | R | R, U | -- | -- |
| Audit Logs | L, R | -- | -- | -- |

### Other

| Resource | Super Admin | Org Admin | Therapist | Patient |
|---|---|---|---|---|
| Notifications | L, R | L, R | L, R, C | L, R |
| Groups | -- | -- | C, L, R, U, D | -- |
| Workflows | -- | -- | C, R, U | -- |
| Health Check | Public | Public | Public | Public |

---

## Organization Boundary Rules

Organization boundaries are enforced to ensure multi-tenant data isolation:

1. **Org Admin** can only access resources within their own organization (`user.organizationId === resource.organizationId`)
2. **Therapists** can only access patients assigned to them within the same organization
3. **Patients** can only access their own data
4. **Super Admin** bypasses organization boundaries (with audit logging)

```typescript
// src/utils/AuthHelpers.ts - canAccessPatient()
if (user.role === 'super_admin') return true;  // Global access
if (user.role === 'org_admin' && user.organizationId === patientOrgId) return true;
if (user.role === 'patient' && user.dbUserId === patientId) return true;
if (user.role === 'therapist'
    && user.dbUserId === patientTherapistId
    && user.organizationId === patientOrgId) return true;
return false;
```

---

## Therapist-Patient Assignment Rules

Patient access for therapists is strictly controlled by the assignment relationship:

1. **Assignment**: Patients are assigned to therapists via `users.therapistId` (FK to therapist's `users.id`)
2. **Creation**: Therapists can create patients within their organization; new patients are auto-assigned to the creating therapist
3. **Reassignment**: Org admins and super admins can reassign patients to different therapists via `/api/therapists/[id]/assign-patients`
4. **Access after reassignment**: If a patient is reassigned, the previous therapist **loses access** to that patient's data immediately
5. **Content ownership**: Media, pages, and notes created for a patient remain in the library but are only accessible by the currently assigned therapist
6. **HIPAA enforcement**: `verifyTherapistPatientAccess()` performs a fresh database lookup to verify the current assignment before granting access
7. **Bulk filtering**: `getTherapistPatientIds()` returns only currently assigned patient IDs for list/search operations

```typescript
// src/utils/AuthHelpers.ts - verifyTherapistPatientAccess()
if (user.role === 'therapist') {
  if (patient.therapistId === user.dbUserId) {
    return { hasAccess: true, patient };
  }
  return { hasAccess: false, error: 'Forbidden: You do not have access to this patient' };
}
```

---

## Key Source Files

| File | Purpose |
|---|---|
| `src/utils/AuthHelpers.ts` | All auth/RBAC functions (requireAuth, requireRole, canAccessPatient, etc.) |
| `src/config/navigation.ts` | Role-based navigation configuration |
| `src/middleware.ts` | Route protection (session cookie check) |
| `src/libs/FirebaseAdmin.ts` | Token verification + database role lookup |
| `src/models/Schema.ts` | User role enum, organization relationships |
