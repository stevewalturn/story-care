# Access Control Findings — Recent Commits vs. Therapist–Patient Access System

> Checked against: `docs/THERAPIST_PATIENT_ACCESS_SYSTEM.md`
> Commits reviewed: `4129b1e`, `cba59be`, `a4b9ef7`, `b947c20`, `0c41347`

---

## Summary

| Area | Follows the Doc? | Notes |
|---|---|---|
| **Sessions — old therapist read access** | ✅ CORRECT | Via `session.therapistId === me` |
| **Sessions — new therapist read access** | ✅ CORRECT | Fixed in `4129b1e` via `patient.therapistId === me` |
| **Story pages — new therapist read access** | ✅ CORRECT | Fixed in `4129b1e` via `patient.therapistId === me` |
| **Notes — old therapist list** | ✅ CORRECT | Fixed in `4129b1e` (was broken before) |
| **Notes — new therapist list** | ✅ CORRECT | Via `inArray(notes.patientId, therapistPatientIds)` |
| **Notes — old therapist single GET** | ✅ CORRECT | Via `note.therapistId === me` |
| **Notes — edit/delete after reassignment** | ⚠️ GAP | Old AND new therapist write restrictions differ from doc |
| **SessionPatients refactor** | ✅ CORRECT | `b947c20` — logic-equivalent, no access regression |

---

## 1. Sessions — CORRECT ✅

**File:** `src/middleware/RBACMiddleware.ts` (commit `4129b1e`)

### Before (was wrong)
`requireSessionAccess` only checked `session.therapistId === me`. After reassignment, a new therapist would be blocked from accessing the patient's historical sessions.

### After (fixed)
```ts
// Old therapist: kept their own sessions
if (session.therapistId === user.dbUserId) return user;

// New therapist: gets all historical sessions via patient.therapistId
if (session.patientId) {
  const patient = await db.query.users.findFirst({ where: eq(users.id, session.patientId) });
  if (patient?.therapistId === user.dbUserId) return user;
}
```

**Result:** Matches the doc — old therapist keeps sessions they created; new therapist gets all sessions through patient assignment.

---

## 2. Story Pages — CORRECT ✅

**File:** `src/middleware/RBACMiddleware.ts` (commit `4129b1e`)

Same pattern added to `requireStoryPageAccess`:
```ts
// New therapist: gets all pages via patient.therapistId
const patient = await db.query.users.findFirst({ where: eq(users.id, page.patientId) });
if (patient?.therapistId === user.dbUserId) return user;
```

**Result:** Matches the doc.

---

## 3. Notes — Partially Correct ⚠️

Notes don't appear in the access table in the doc, but the Golden Rule still applies: creator keeps read access, new therapist gets everything.

### 3a. List endpoint — CORRECT ✅

**File:** `src/app/api/notes/route.ts`

**Before `4129b1e`:** Only returned notes for currently assigned patients. Old therapist would lose all their notes after patient was reassigned.

**After `4129b1e`:**
```ts
const accessConditions = [
  eq(notes.therapistId, user.dbUserId),            // Notes I created (permanent)
  inArray(notes.patientId, therapistPatientIds),    // Notes for currently assigned patients
];
filters.push(or(...accessConditions)!);
```

✅ Old therapist keeps their notes. New therapist gets all notes for their patients.

### 3b. Single GET — CORRECT ✅

**File:** `src/app/api/notes/[id]/route.ts`

```ts
// Old therapist: note.therapistId === me → ALLOW
// New therapist: patient.therapistId === me → ALLOW
// Old therapist on other's note (patient reassigned): patient.therapistId !== me → 403
```

✅ Matches the Golden Rule.

### 3c. Edit (PUT) — GAP ⚠️

**File:** `src/app/api/notes/[id]/route.ts`

```ts
// Requires BOTH conditions:
if (existingNote.therapistId !== user.dbUserId) return 403; // creator only
if (!therapistPatientIds.includes(existingNote.patientId)) return 403; // still assigned
```

**Impact:**
- Old therapist: **cannot edit** their own notes after patient is reassigned — even though they created them.
- New therapist: **cannot edit** notes created by the previous therapist — even for their currently assigned patient.

The doc only specifies *read* access for the old therapist and doesn't explicitly address who can write notes for the new therapist. This restriction is likely **intentional** (clinical notes should only be editable by the author while they still hold the patient relationship). However, it should be documented as an explicit policy decision.

### 3d. Lock/Unlock — CORRECT ✅

**File:** `src/app/api/notes/[id]/lock/route.ts`

- Lock: `note.therapistId === me` — old therapist can lock their own notes even after reassignment.
- Unlock: `note.therapistId === me` — same. Old therapist can still unlock their own locked notes.

✅ Creator stamp is honored.

### 3e. Delete — GAP ⚠️ (same as edit)

Requires creator + currently assigned. Old therapist loses delete ability after reassignment. Same rationale as edit — likely intentional but undocumented.

---

## 4. SessionPatients.ts Refactor — CORRECT ✅

**File:** `src/utils/SessionPatients.ts` (commit `b947c20`)

Replaced nested Drizzle `.with()` queries with explicit separate queries:

```ts
// Before: db.query.sessions.findFirst({ with: { patient: ..., group: { with: { members: ... } } } })
// After:  Separate db.select() queries per patientId / groupId
```

**Access logic is identical** — no regressions. The fix resolves a Drizzle relation error, not an access control issue.

---

## 5. Known Gaps vs. the Document

### GAP-N1 — Notes write restriction is undocumented

The doc's access table covers sessions, media, and story pages but not notes. Notes apply the same creator-stamp logic for **reads**, but **writes** (edit/delete) additionally require current patient assignment. This should be added to the doc:

> **Notes:** Old therapist retains *read* access to notes they created. Write access (edit, delete) requires the patient to still be assigned to them.

### GAP-N2 — New therapist cannot edit previous therapist's notes

Even with patient.therapistId === me, the new therapist cannot edit notes created by the previous therapist. The API returns 403 because `note.therapistId !== newTherapist`. This protects the integrity of clinical records. Should be documented as policy.

---

## 6. Pre-existing Bugs from the Doc (not introduced by recent commits)

These are flagged in `THERAPIST_PATIENT_ACCESS_SYSTEM.md §6` and remain unresolved:

| Bug | Severity | Status |
|---|---|---|
| BUG-01: Therapist can reassign patient cross-org | Critical | Open |
| BUG-02: Inactive therapist retains access until token expires | Critical | Open |
| BUG-03: Bulk assign has no audit log | Critical | Open |
| BUG-04: Patient creation has no audit log | Critical | Open |
| BUG-05: "Active Sessions" metric equals total sessions | High | Open |
| BUG-06: Session counts wrong for inherited patients in therapist tab | High | Open |

None of the recent commits touched these.

---

## 7. Verdict on Recent Commits

The commits `4129b1e`, `cba59be`, `a4b9ef7`, `b947c20` **correctly implement the Golden Rule** from the access system doc:

- Old therapist → keeps read access to content they created (sessions ✅, notes ✅, story pages via RBAC ✅)
- New therapist → gets full access via patient.therapistId (sessions ✅, notes ✅, story pages ✅, media follows same RBAC pattern)

The only undocumented behavior is the **write restriction on notes** (edit/delete requires creator + current assignment). This is a reasonable clinical safety decision but should be written into the policy doc.
