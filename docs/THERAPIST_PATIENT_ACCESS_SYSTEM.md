# Therapist–Patient Access & Reassignment System

> **Purpose:** Explains how patients are linked to therapists, who can see what, how reassignment works end-to-end, and what the edge cases are.

---

## 1. The Data Model

Everything is driven by one field on the `users` table:

```
users
 ├── id              (UUID, primary key)
 ├── role            (enum: super_admin | org_admin | therapist | patient)
 ├── organizationId  (UUID → organizations.id)
 ├── therapistId     (UUID → users.id)   ← THE LINK
 └── status          (active | invited | inactive | archived | deleted)
```

**`therapistId`** is set on a **patient** record and points to the therapist user assigned to them.

- One therapist → many patients (1:N)
- Nullable — a patient can exist unassigned (`therapistId = NULL`)
- Self-referential FK within the same table

There's also a secondary table for personal visibility:

```
therapist_patient_archives
 ├── therapistId   (who hid the patient from their list)
 └── patientId     (who was hidden)
```

This lets one therapist **hide** a patient from their personal list without affecting anyone else's access or the underlying assignment.

---

## 2. Access Control — Who Sees What

### Rule Summary

| Role | Patients They Can Access | Can Reassign? | Scope |
|---|---|---|---|
| **Super Admin** | Everyone, everywhere | Yes (any combo) | All organizations |
| **Org Admin** | All patients in their org | Yes (within org only) | Single organization |
| **Therapist** | Only their assigned patients | Not via UI — but API allows it\* | Own patients only |
| **Patient** | Themselves only | No | Self |

> \* See [API Gap note](#5-reassignment-in-depth) below.

### The Exact Check (for Therapists)

```typescript
// RBACMiddleware.ts:requirePatientAccess()
patient.therapistId === therapist.dbUserId
  AND
patient.organizationId === therapist.organizationId
```

Both conditions must be true. Fail either → **403 Forbidden**.

### Org Boundary is Always Enforced

No user (except super admin) can cross org boundaries. Every failed attempt writes an entry to `audit_logs` with `note: "Organization boundary violation attempt"`. Super admin access always succeeds but writes `note: "Super admin cross-org access"` to the audit log.

---

## 3. Access Control Diagrams

### Patient Data Access

```
Incoming Request
      │
      ▼
  requirePatientAccess()
      │
      ├── super_admin ──► log audit entry ──────────────────────► ALLOW
      │
      ├── org_admin ───► same org? ──YES──────────────────────── ► ALLOW
      │                           └─NO──────────────────────────► 403
      │
      ├── patient ─────► patient.id === caller.id ──YES─────────► ALLOW
      │                                            └─NO─────────► 403
      │
      └── therapist ──► same org? ──NO──────────────────────────► 403
                                 └─YES──► patient.therapistId ──► ALLOW
                                              === caller.id?  └──► 403
```

### Session Access (includes post-reassignment)

```
Incoming Request
      │
      ▼
  requireSessionAccess()
      │
      ├── super_admin ─────────────────────────────────────────── ► ALLOW
      │
      ├── org_admin ──► session.therapist in same org? ────────── ► ALLOW / 403
      │
      ├── therapist ──► session.therapistId === me? ─────────────► ALLOW (own session)
      │             └──► session.patient.therapistId === me? ─────► ALLOW (currently assigned patient)
      │             └──► patient in session.group with therapistId === me? ──► ALLOW (group session)
      │
      └── patient ───► session.patientId === me? ───────────────► ALLOW (individual)
                    └──► active group member? ───────────────────► ALLOW (group)
```

### Media & Story Page Access

Same pattern as patient access, with one extra check:

- **Therapist** gets access if `media.createdByTherapistId === me` (even after reassignment)
- **Therapist** also gets access if `media.patient.therapistId === me` (currently assigned)

The `createdByTherapistId` stamp is permanent, so the creator always retains access to what they made regardless of later reassignment.

---

## 4. Two Reassignment Entry Points

### A. Bulk Assign — via Therapist Detail Page

**Who can trigger:** Org Admin, Super Admin
**UI Path:** Org Admin → Therapists → [Therapist] → Assign Patients button
**Component:** `src/components/therapists/AssignPatientsModal.tsx`
**API:** `POST /api/therapists/{therapistId}/assign-patients`

```
Admin clicks "Assign Patients"
         │
         ▼
AssignPatientsModal opens
  - Fetches ALL patients in org (including those already assigned to other therapists)
  - Excludes patients already assigned to THIS therapist
  - Shows current therapist name for already-assigned patients ("Currently assigned to: X")
  - Admin checks multiple patients
         │
         ▼
POST /api/therapists/{therapistId}/assign-patients
  Body: { patientIds: ["uuid1", "uuid2"] }
         │
         ▼
API validates:
  1. Caller is org_admin or super_admin
  2. Target therapist exists and has role = 'therapist'
  3. For org_admin: therapist is in caller's organization
  4. All patientIds exist and have role = 'patient'
  5. For org_admin: all patients are in caller's organization
         │
         ▼
db.update(users).set({ therapistId }).where(inArray(users.id, patientIds))
         │
         ▼
Returns: { success: true, assignedCount: N }
```

**Note:** This is a **hard overwrite** — it assigns the patients to the new therapist regardless of who they were assigned to before. No warning about patients moving away from another therapist.

---

### B. Single Reassign — via Therapist Patients Tab

**Who can trigger:** Org Admin (through the UI)
**UI Path:** Org Admin → Therapists → [Therapist] → Patients tab → Reassign button
**Component:** `src/components/therapists/TherapistPatientsTab.tsx`
**API:** `PUT /api/patients/{patientId}`

```
Admin clicks "Reassign" on a patient row
         │
         ▼
Inline modal opens
  - Fetches all therapists in org
  - Excludes the current therapist from the dropdown
  - Shows therapist name + patient count
         │
         ▼
PUT /api/patients/{patientId}
  Body: { therapistId: "new-therapist-uuid" }
         │
         ▼
API validates:
  1. Caller has access to this patient (requirePatientAccess)
  2. New therapist exists and has role = 'therapist'
  3. For org_admin: new therapist is in caller's organization
  ⚠️  No org check if caller is a therapist (see gap below)
         │
         ▼
db.update(users).set({ therapistId }).where(eq(users.id, patientId))
         │
         ▼
PHI audit log written (logPHIUpdate) with changedFields: ['therapistId', 'updatedAt']
         │
         ▼
Returns: { patient: updatedPatient }
         │
         ▼
UI: closes modal, calls onPatientReassigned(), page refreshes
```

---

## 5. Important Details & Edge Cases

### Therapist Deletion is Blocked if Patients Exist

```
DELETE /api/therapists/{id}
         │
         ▼
Check: COUNT(patients where therapistId = id AND deletedAt IS NULL)
         │
         ├── count > 0 ──► 409 Conflict
         │                 "Cannot delete therapist with N assigned patient(s).
         │                  Please reassign patients first."
         │
         └── count = 0 ──► Soft delete (sets deletedAt + status = 'deleted')
```

The UI also enforces this: the Delete button is **disabled** when `totalPatients > 0` and shows a warning with a "View Patients" link.

---

### Therapist Detail Shows Only Top 10 Patients

The `GET /api/therapists/{id}` endpoint fetches `recentPatients` with `.limit(10)`. So `TherapistPatientsTab` only shows the 10 most recently created patients. If a therapist has more than 10, the rest are not visible in this view. This is a **display-only limitation** — all patients remain correctly assigned in the database.

---

### What Happens to Data After Reassignment

| Resource | Old Therapist Can Access? | New Therapist Can Access? |
|---|---|---|
| Patient profile | No (therapistId no longer matches) | Yes |
| Sessions they **created** | Yes — via `session.therapistId === me` | Yes — via `patient.therapistId === me` |
| Sessions **another therapist** created | Only if patient is in a group they manage | Yes — via `patient.therapistId === me` |
| Media they created | Yes — via `media.createdByTherapistId === me` | Yes — via `patient.therapistId === me` |
| Story pages they created | Yes — via `page.createdByTherapistId === me` | Yes — via `patient.therapistId === me` |
| Story pages another therapist created | No | Yes |

**Key principle:** Creator stamps (`createdByTherapistId`) are permanent. After reassignment, the old therapist keeps read access to content they personally created. The new therapist gets broad access via the patient relationship.

---

### No Automatic Reassignment — Always Manual

There is **zero automatic reassignment logic** in the codebase. No triggers on:
- Therapist deactivation (just blocks login — patients stay linked)
- Therapist archiving
- Org configuration changes
- Any scheduled job

The admin must explicitly reassign patients before deleting a therapist (the API enforces this with a 409).

---

### Archive vs. Reassignment — These are Different Things

| | Archive | Reassignment |
|---|---|---|
| What changes | `therapist_patient_archives` table (new row) | `users.therapistId` field (update) |
| Who it affects | Only the therapist who archived | The entire system |
| Access changes | None — just visibility | Yes — old therapist loses patient access |
| Reversible | Yes (`DELETE /api/patients/{id}/archive`) | Yes (reassign again) |
| Use case | "Hide from my personal list" | "Move to a different therapist permanently" |

---

## 6. Known Bugs & Gaps

The following issues were found by auditing every file in this system end-to-end. Severity is based on actual impact.

---

### CRITICAL

---

#### BUG-01 — Therapist can reassign patients to any org (cross-org hole)
**File:** `src/app/api/patients/[id]/route.ts:279–311`
**Severity:** Critical

The `PUT /api/patients/{id}` endpoint runs `requirePatientAccess()` to verify the caller can touch this patient, but when updating `therapistId`, the org-boundary check is **only applied for `org_admin`**:

```typescript
// line 302–308
if (user.role === 'org_admin' && therapist.organizationId !== user.organizationId) {
  return 403;
}
// ← no equivalent check for role === 'therapist'
```

A therapist can call this endpoint on their own patient and pass any `therapistId` UUID — including a therapist from a completely different organization. The new therapist will gain access to the patient with no boundary enforcement.

**Impact:** Cross-org patient data exposure.

---

#### BUG-02 — Inactive therapist retains full patient access
**File:** `src/middleware/RBACMiddleware.ts`
**Severity:** Critical

`requirePatientAccess()` (and other RBAC functions) granted access to a therapist if `patient.therapistId === therapist.dbUserId`, never checking whether the therapist's `status` is `active`. Deactivating a therapist via `PATCH /api/therapists/{id}/status` blocks their login through Firebase but does **not** prevent existing JWT tokens from still passing API access checks.

**Impact:** Deactivated therapists could keep accessing PHI until their 24-hour token expired — across all resource types (patients, sessions, media, story pages).

**Fix applied to all RBAC functions:** `requirePatientAccess`, `requireSessionAccess`, `requireMediaAccess`, `requireStoryPageAccess`, and `canCreateForPatient` each now check `user.status !== 'active'` in the therapist branch and throw `403` immediately.

---

#### BUG-03 — Bulk patient assignment writes no audit log
**File:** `src/app/api/therapists/[id]/assign-patients/route.ts`
**Severity:** Critical

The bulk assign endpoint reassigns N patients to a new therapist in a single call. There is zero `logAudit*` or `logPHI*` call anywhere in the file. Verified by grep — no match.

**Impact:** HIPAA violation — bulk care-team changes leave no audit trail. Regulators and incident responders cannot reconstruct who moved which patients to whom, or when.

---

#### BUG-04 — Patient creation writes no audit log
**File:** `src/app/api/patients/route.ts` (POST handler)
**Severity:** Critical

Creating a patient record is a PHI-creation event. The POST handler has no `logAudit*` or `logPHI*` call — verified by grep. Compare: the DELETE handler explicitly calls `logPHIDelete`.

**Impact:** HIPAA gap — patient onboarding is unaudited.

---

### HIGH

---

#### BUG-05 — "Active Sessions" metric equals "Total Sessions" (filter never applied)
**File:** `src/app/api/therapists/[id]/route.ts:93–105`
**Severity:** High

The comment says "sessions created in the last 30 days" and the code even computes `thirtyDaysAgo`, but that variable is **never used** in the query:

```typescript
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const activeSessionsResult = await db
  .select({ count: count() })
  .from(sessions)
  .where(
    and(
      eq(sessions.therapistId, therapist.id),
      // ← thirtyDaysAgo never referenced
    ),
  );
```

So `metrics.activeSessions` always equals `metrics.totalSessions`. The therapist dashboard shows two identical numbers with different labels.

**Impact:** Misleading metrics for org admins; intended 30-day activity signal is broken.

---

#### BUG-06 — Session counts in therapist patients tab are wrong after reassignment
**File:** `src/app/api/therapists/[id]/route.ts:143–171`
**Severity:** High

When building `recentPatientsWithSessionCount`, the session count query filters by **both** `patientId` and `therapistId`:

```typescript
.where(
  and(
    eq(sessions.patientId, patient.id),
    eq(sessions.therapistId, therapist.id), // ← only sessions THIS therapist created
  ),
)
```

After a patient is reassigned, the new therapist's view shows `sessionCount: 0` and `lastSessionDate: null` for that patient, even if the patient had a full history with the previous therapist. All historical session data is invisible.

**Impact:** New therapist has no visibility into a patient's prior session history through this view.

---

#### BUG-07 — Session counts include soft-deleted sessions
**File:** `src/app/api/therapists/[id]/route.ts`
**Severity:** High

Neither the `totalSessions` query, the `activeSessions` query, nor the `recentSessions` list excluded soft-deleted sessions. Deleted sessions were counted in both metrics and could appear in the 10-session preview panel.

**Impact:** Inflated session counts on the therapist overview; deleted sessions visible in the recent sessions list.

**Fix:** `isNull(sessions.deletedAt)` added to all three queries (`totalSessions`, `activeSessions`, `recentSessions`).

---

#### BUG-08 — Soft-deleted patient leaves orphaned archive records
**File:** `src/app/api/patients/[id]/route.ts:379–490` and `src/models/Schema.ts:1070–1083`
**Severity:** High

The `therapist_patient_archives` table has `onDelete: 'cascade'` on its FKs — but **only hard deletes** trigger cascades. Patient deletion is a **soft delete** (sets `deletedAt`, the row stays). The DELETE handler never cleans up `therapist_patient_archives`.

After deletion, stale `(therapistId, patientId)` rows sit in the archives table forever. If a new patient is ever created with the same ID (unlikely but possible with UUIDs), they would inherit the archived status incorrectly.

**Impact:** Database pollution; edge case data integrity risk.

---

#### BUG-09 — Patient email can be changed to a duplicate on PUT
**File:** `src/app/api/patients/[id]/route.ts:213–214`
**Severity:** High

Updating a patient's email does not check for uniqueness:

```typescript
if (email !== undefined) {
  updateData.email = email; // ← no EXISTS check
}
```

Two patients can end up with the same email address, which breaks invitation token lookup and future auth flows.

**Impact:** Data integrity failure; invitation resend flows break silently.

---

### MEDIUM

---

#### BUG-10 — "Active sessions" label is misleading (same as totalSessions — see BUG-05)
See BUG-05. The label displayed in the UI is "Active Sessions" but the value is total sessions. A separate UI label issue to fix regardless of the query fix.

---

#### BUG-11 — Therapist detail shows at most 10 patients with no indication more exist
**File:** `src/app/api/therapists/[id]/route.ts:121–141`
**Severity:** Medium

```typescript
.limit(10); // ← hard cap, no pagination, no total count returned
```

The `TherapistPatientsTab` component receives `recentPatients` and renders them as if they are all patients. If the therapist has 11+ patients, the extras are silently omitted. No "showing 10 of N" indicator is returned by the API or shown in the UI.

**Impact:** Org admins may miss patients when reviewing a therapist's workload.

---

#### BUG-12 — Setting `therapistId` to null orphans the patient from all therapist views
**File:** `src/app/api/patients/[id]/route.ts:310`
**Severity:** Medium

```typescript
updateData.therapistId = therapistId || null;
```

If `therapistId` is sent as an empty string or `null`, the patient's `therapistId` is cleared. That patient becomes invisible to all therapists (no therapist passes the `patient.therapistId === me` check) and invisible to themselves (they only see their own data). Only an org_admin can find them.

There is no warning, confirmation prompt, or validation before this happens.

**Impact:** Patients silently fall off every therapist's view; potential care continuity break.

---

#### BUG-13 — `?view=archived` query param silently ignored for org_admin
**File:** `src/app/api/patients/route.ts:80–92`
**Severity:** Medium

The archive-view filtering (lines 71–92) is inside an `else if (authUser.role === 'therapist')` block. If an `org_admin` or `super_admin` calls `GET /api/patients?view=archived`, the parameter is silently ignored and all patients are returned. No error, no indication the filter was dropped.

**Impact:** Confusing behaviour for any admin-role caller who expects archive filtering.

---

#### BUG-14 — Concurrent reassignment — last write wins with no conflict detection
**File:** `src/app/api/therapists/[id]/assign-patients/route.ts:107–113`
**File:** `src/app/api/patients/[id]/route.ts:315–323`
**Severity:** Medium

Both reassignment paths do a plain `UPDATE` with no transaction or optimistic locking. If two org admins simultaneously reassign the same patient to different therapists, one update silently overwrites the other.

**Impact:** Unpredictable patient assignment under concurrent admin activity; no conflict error surfaced.

---

### LOW

---

#### BUG-15 — `view` param accepted but undefined for `super_admin`
**File:** `src/app/api/patients/route.ts:49–108`
**Severity:** Low

Related to BUG-13. Super admin hits the no-filter path, meaning `view=archived` and `view=active` both return the same set. Low risk but confusing if building tooling on top of this API.

---

#### BUG-16 — Stale archive entry persists after patient is reassigned away from therapist
**File:** `src/app/api/therapists/[id]/assign-patients/route.ts` and `src/app/api/patients/[id]/route.ts`
**Severity:** Low

When a therapist archives patient P, an entry `(therapistId: A, patientId: P)` is created. If an admin then reassigns P to therapist B, the stale archive row for therapist A remains. When P is eventually reassigned back to A, P will still appear as "archived" for therapist A from the old hide action — which may be surprising.

**Impact:** Unexpected UX if a patient bounces between therapists; stale archive entries accumulate.

---

#### BUG-17 — `activeSessionsResult` query has a redundant `and()` wrapper
**File:** `src/app/api/therapists/[id]/route.ts:100–104`
**Severity:** Low (cosmetic, but signals the missing filter — see BUG-05)

```typescript
.where(
  and(
    eq(sessions.therapistId, therapist.id),
    // ← and() called with a single argument, the 30-day filter clearly fell off
  ),
)
```

The `and()` with one argument is a code smell showing the date filter was removed/forgotten. Minor but confirms BUG-05.

---

### Bug Summary Table

| ID | Severity | File | Description | Status |
|---|---|---|---|---|
| BUG-01 | Critical | `api/patients/[id]/route.ts` | Therapist can reassign patient cross-org | ✅ Fixed |
| BUG-02 | Critical | `middleware/RBACMiddleware.ts` | Inactive therapist retains access to all resources | ✅ Fixed (all 5 RBAC functions) |
| BUG-03 | Critical | `api/therapists/[id]/assign-patients/route.ts` | Bulk assign has no audit log | ✅ Fixed |
| BUG-04 | Critical | `api/patients/route.ts` (POST) | Patient creation has no audit log | ✅ Fixed |
| BUG-05 | High | `api/therapists/[id]/route.ts` | 30-day session filter computed but never applied | ✅ Fixed |
| BUG-06 | High | `api/therapists/[id]/route.ts` | Session counts wrong for inherited patients | ✅ Fixed |
| BUG-07 | High | `api/therapists/[id]/route.ts` | Session counts and list include soft-deleted sessions | ✅ Fixed (all 3 queries) |
| BUG-08 | High | `api/patients/[id]/route.ts` | Soft-deleted patient leaves orphaned archive rows | ✅ Fixed |
| BUG-09 | High | `api/patients/[id]/route.ts` | Email uniqueness not enforced on PUT | ✅ Fixed |
| BUG-10 | Medium | `api/therapists/[id]/route.ts` | "Active sessions" UI label is wrong (same as total) | ✅ Fixed (via BUG-05) |
| BUG-11 | Medium | `api/therapists/[id]/route.ts` | 10-patient hard cap, no pagination or indicator | ✅ Fixed (comment in API response) |
| BUG-12 | Medium | `api/patients/[id]/route.ts` | `therapistId=null` silently orphans patient | ✅ Fixed |
| BUG-13 | Medium | `api/patients/route.ts` | `?view=archived` silently ignored for org_admin | ✅ Fixed |
| BUG-14 | Medium | Both assign routes | Concurrent reassignment — last write wins | ⚠️ Documented (deferred — requires DB transactions) |
| BUG-15 | Low | `api/patients/route.ts` | `view` param undefined for super_admin | ✅ Fixed |
| BUG-16 | Low | Assign routes | Stale archive entry after patient reassignment | ✅ Fixed |
| BUG-17 | Low | `api/therapists/[id]/route.ts` | Redundant `and()` confirming missing 30-day filter | ✅ Fixed (via BUG-05) |

---

## 7. Audit Trail

| Action | What Gets Logged |
|---|---|
| Single reassignment via `PUT /api/patients/{id}` | `logPHIUpdate` — logs `changedFields: ['therapistId', 'updatedAt']` |
| Bulk assignment via `POST /api/therapists/{id}/assign-patients` | `logAuditFromRequest` — logs `bulk_patient_assignment` with patient IDs and count |
| Cross-org access by super admin | `requireSameOrg` writes to `audit_logs` automatically |
| Org boundary violation attempt | `requireSameOrg` writes blocked attempt to `audit_logs` |
| Therapist deletion | `logAuditFromRequest` with action `delete` |

> **Gap:** Bulk assignment via the `assign-patients` endpoint does not write a dedicated audit log entry. Only single-patient reassignment via `PUT /api/patients/{id}` logs the `therapistId` change.

---

## 7. Full System Diagram

```
                    ┌──────────────────────────────┐
                    │         Organization          │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │          Org Admin           │
                    │  (can reassign any patient   │
                    │   within the organization)   │
                    └──────┬───────────┬───────────┘
                           │           │
                    Assign │           │ Reassign
                    (bulk) │           │ (single)
                           │           │
               ┌───────────▼──┐  ┌────▼──────────┐
               │  Therapist A │  │  Therapist B  │
               └───────┬──────┘  └──────┬────────┘
                       │                │
               assigned│        assigned│
                       │                │
           ┌───────────▼──┐  ┌──────────▼──┐  ┌─────────────┐
           │  Patient 1   │  │  Patient 2  │  │  Patient 3  │
           │              │  │             │  │ (unassigned)│
           └──────┬───────┘  └──────┬──────┘  └─────────────┘
                  │                 │
          ┌───────┼──────┐  ┌───────┼──────┐
          ▼       ▼      ▼  ▼       ▼      ▼
       Sessions Media Pages Sessions Media Pages
       (stamped with therapistId at creation)
```

---

## 8. Recent Commits (Last 7 Days)

| Date | Commit | What Changed |
|---|---|---|
| Feb 25 | `0c41347` | Fix quotes tabs UI |
| Feb 25 | `b947c20` | Optimize session patient retrieval logic |
| Feb 25 | `a4b9ef7` | Fix sessions and notes tab |
| Feb 25 | `cba59be` | Add notes & quotes management to patient detail (new `NotesTab`, `QuotesTab`, counts in API) |
| Feb 25 | `23d6740` | Clean up `displayUrl` — removed from DB persistence, fixed stale presigned URL bug |
| Feb 25 | `4129b1e` | Note locking functionality |
| Feb 24 | `f2ffcdc` | Fix chatbox speaker dropdown showing raw Deepgram labels instead of resolved names |
| Feb 24 | `f97ddfe` | Fix empty patient metadata in Langfuse traces (added speakers-table fallback) |

---

## 9. Key Files Reference

| File | Purpose |
|---|---|
| `src/models/Schema.ts` | All DB tables — `users.therapistId` is the core FK |
| `src/middleware/RBACMiddleware.ts` | All access control logic (`requirePatientAccess`, `requireSessionAccess`, etc.) |
| `src/app/api/therapists/[id]/assign-patients/route.ts` | Bulk patient assignment |
| `src/app/api/therapists/[id]/route.ts` | DELETE enforces reassignment-before-delete constraint |
| `src/app/api/patients/[id]/route.ts` | Single patient update including `therapistId` |
| `src/app/api/patients/[id]/archive/route.ts` | Archive/unarchive (visibility only) |
| `src/components/therapists/TherapistPatientsTab.tsx` | Reassign UI in therapist detail page |
| `src/components/therapists/AssignPatientsModal.tsx` | Bulk assign modal |
| `src/app/(auth)/org-admin/therapists/[id]/page.tsx` | Therapist detail page (wires everything together) |
| `src/utils/AuthHelpers.ts` | `requireAuth()`, `requireAdmin()` helpers |
| `src/libs/FirebaseAdmin.ts` | `verifyIdToken()` — fetches user + role from DB |
| `src/libs/AuditLogger.ts` | PHI access/update/delete logging |
