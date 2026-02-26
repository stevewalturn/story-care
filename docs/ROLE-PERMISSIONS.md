# StoryCare — Role Permissions Reference

> Who can **do** what, across every resource and action in the platform.
> Last updated: 2026-02-26

---

## Roles

| Role | Short name | Scope |
|------|-----------|-------|
| Super Admin | `super_admin` | Platform-wide, all orgs |
| Organisation Admin | `org_admin` | Their single organisation |
| Therapist | `therapist` | Their assigned patients only |
| Patient | `patient` | Their own data only |

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Allowed |
| ❌ | Blocked (returns 403) |
| ⚠️ | Allowed with conditions (see notes) |
| — | Not applicable |

---

## 1. Patients

| Action | super_admin | org_admin | therapist | patient | Conditions / Notes |
|--------|:-----------:|:---------:|:---------:|:-------:|-------------------|
| List all patients | ✅ | ✅ | ⚠️ | ❌ | Therapist: only their assigned patients |
| View patient profile | ✅ | ✅ | ⚠️ | ❌ | Therapist: `patient.therapistId === me` AND same org |
| Create patient | ✅ | ✅ | ⚠️ | ❌ | Therapist: created patient is auto-assigned to themselves |
| Edit patient details | ✅ | ✅ | ⚠️ | ❌ | Therapist: only their assigned patients |
| Reassign patient to another therapist | ✅ | ✅ | ⚠️ | ❌ | Therapist: API technically works but **no org boundary check on new therapist** — known gap |
| Delete patient | ✅ | ✅ | ❌ | ❌ | Hard-deletes all related data; must reassign first if therapist has patients |
| Archive patient (personal) | ✅ | ✅ | ✅ | ❌ | Archive = hide from own list only; does NOT change access for anyone else |
| Unarchive patient | ✅ | ✅ | ✅ | ❌ | Reverses personal archive |
| View own profile | — | — | — | ✅ | Patients see only themselves |

### Reassignment access impact

When `patient.therapistId` changes from **Therapist A → Therapist B**:

- **Therapist A** immediately loses access to the patient profile and all their sessions/notes/media — **unless** A is the creator of that specific resource (creator stamp is permanent).
- **Therapist B** immediately gains access to everything via the new `therapistId`.
- Only **one DB row changes** (`users.therapistId`). No cascade, no automation.

---

## 2. Sessions

| Action | super_admin | org_admin | therapist | patient | Conditions / Notes |
|--------|:-----------:|:---------:|:---------:|:-------:|-------------------|
| List sessions | ✅ | ✅ | ⚠️ | ❌ | Therapist: own sessions + assigned patients' sessions |
| View session | ✅ | ✅ | ⚠️ | ❌ | Therapist: must be creator OR currently assigned to that patient |
| Create session | ✅ | ✅ | ⚠️ | ❌ | Therapist: only for their assigned patients |
| Edit session metadata | ✅ | ✅ | ⚠️ | ❌ | Therapist: must be **creator** of the session (not just assigned) |
| Delete session | ✅ | ✅ | ⚠️ | ❌ | Therapist: must be creator AND currently assigned; soft-delete (`deletedAt`) |
| Archive session | ✅ | ✅ | ⚠️ | ❌ | Therapist: own sessions only |
| Upload audio | ✅ | ✅ | ⚠️ | ❌ | Same as edit |
| Trigger transcription | ✅ | ✅ | ⚠️ | ❌ | Same as edit |
| Assign treatment module | ✅ | ✅ | ⚠️ | ❌ | Therapist: must own session |

> **Reassignment note:** After reassignment, Therapist A retains **read-only** access to sessions they created (`session.therapistId === A`). Therapist B can read all sessions (current assignment), but can only edit/delete sessions they personally created.

---

## 3. Notes

| Action | super_admin | org_admin | therapist | patient | Conditions / Notes |
|--------|:-----------:|:---------:|:---------:|:-------:|-------------------|
| List notes | ✅ | ✅ | ⚠️ | ⚠️ | Therapist: own notes + assigned patients' notes; Patient: own notes only |
| View note | ✅ | ✅ | ⚠️ | ⚠️ | Therapist: creator OR currently assigned to patient; Patient: own notes only |
| Create note | ✅ | ✅ | ⚠️ | ❌ | Therapist: assigned patients only |
| Edit note (unlocked) | ✅ | ✅ | ⚠️ | ⚠️ | Therapist: **any currently-assigned therapist** (not creator-only); Patient: own notes only |
| Edit note (locked) | ❌ | ❌ | ❌ | ❌ | **Nobody** can edit a locked note |
| Delete note | ✅ | ✅ | ⚠️ | ❌ | Therapist: currently-assigned to patient; locked notes block deletion for everyone |
| Lock note | ✅ | ✅ | ⚠️ | ❌ | Therapist: must be currently assigned to patient |
| Unlock note | ✅ | ✅ | ⚠️ | ❌ | Only the **person who locked it** (`note.lockedBy === me`) can unlock, even admins cannot override |
| Copy note (with signature) | ✅ | ✅ | ✅ | ✅ | Locked notes append `Electronically signed by…` to clipboard text |
| Download note (with signature) | ✅ | ✅ | ✅ | ✅ | Locked notes append signature to `.txt` download |

### Digital signature block

Every locked note displays and exports: **name + credentials + date/time locked**

```
Electronically signed by Jane Smith, LCSW on 02/26/2026 at 3:45 PM
```

Visible in:
- Note card (inline below content)
- View/detail modal
- Clipboard copy text
- Downloaded `.txt` file

---

## 4. Media / Assets

| Action | super_admin | org_admin | therapist | patient | Conditions / Notes |
|--------|:-----------:|:---------:|:---------:|:-------:|-------------------|
| List media | ✅ | ✅ | ⚠️ | ⚠️ | Therapist: own media + assigned patients' media; Patient: own media only |
| View media item | ✅ | ✅ | ⚠️ | ⚠️ | Therapist: creator OR currently assigned to patient |
| Generate image | ✅ | ✅ | ⚠️ | ❌ | Therapist: must have access to the patient |
| Generate video | ✅ | ✅ | ⚠️ | ❌ | Same |
| Upload media file | ✅ | ✅ | ⚠️ | ❌ | Same |
| Edit media metadata | ✅ | ✅ | ⚠️ | ❌ | Therapist: creator or currently assigned |
| Delete media | ✅ | ✅ | ❌ | ❌ | Admin-only; soft-delete (`deletedAt`) |
| Extract video frame | ✅ | ✅ | ⚠️ | ❌ | Session/media owner or admin |

---

## 5. Scenes

| Action | super_admin | org_admin | therapist | patient | Conditions / Notes |
|--------|:-----------:|:---------:|:---------:|:-------:|-------------------|
| List scenes | ✅ | ✅ | ⚠️ | ❌ | Therapist: their scenes only |
| View scene | ✅ | ✅ | ⚠️ | ❌ | Therapist: creator or assigned to patient |
| Create scene | ✅ | ✅ | ⚠️ | ❌ | Therapist: for assigned patients only |
| Edit scene / timeline | ✅ | ✅ | ⚠️ | ❌ | Therapist: creator only |
| Delete scene | ✅ | ✅ | ⚠️ | ❌ | Therapist: creator only |
| Trigger video processing | ✅ | ✅ | ⚠️ | ❌ | Therapist: creator only |

---

## 6. Story Pages

| Action | super_admin | org_admin | therapist | patient | Conditions / Notes |
|--------|:-----------:|:---------:|:---------:|:-------:|-------------------|
| List pages | ✅ | ✅ | ⚠️ | ⚠️ | Therapist: created + assigned patients'; Patient: published pages assigned to them only |
| View page | ✅ | ✅ | ⚠️ | ⚠️ | Therapist: creator OR currently assigned; Patient: must be the assigned patient |
| Create page | ✅ | ✅ | ✅ | ❌ | Created as `draft` by default |
| Edit page / blocks | ✅ | ✅ | ⚠️ | ❌ | Therapist: must be **creator** AND currently assigned to patient |
| Publish page | ✅ | ✅ | ⚠️ | ❌ | Same as edit |
| Share page (link) | ✅ | ✅ | ⚠️ | ❌ | Same as edit |
| Delete page | ✅ | ✅ | ⚠️ | ❌ | Therapist: creator AND currently assigned; hard-deletes blocks + responses |
| View published page | — | — | — | ✅ | Patient: only pages published and assigned to them |
| Submit reflection response | — | — | — | ✅ | Patient: on published pages assigned to them |
| Submit survey response | — | — | — | ✅ | Patient: on published pages assigned to them |

---

## 7. Therapists (User Management)

| Action | super_admin | org_admin | therapist | patient | Conditions / Notes |
|--------|:-----------:|:---------:|:---------:|:-------:|-------------------|
| List therapists | ✅ | ✅ | ❌ | ❌ | Org admin: their org only; Super admin: all |
| View therapist profile | ✅ | ✅ | ❌ | ❌ | Org admin: their org only |
| Invite / create therapist | ✅ | ✅ | ❌ | ❌ | Creates with `status = 'invited'`; auto-activates on first login |
| Edit therapist (name, credentials) | ✅ | ✅ | ❌ | ❌ | Org admin: their org only |
| Activate / deactivate therapist | ✅ | ✅ | ❌ | ❌ | Deactivation blocks login but does NOT auto-reassign patients |
| Delete therapist | ✅ | ✅ | ❌ | ❌ | Blocked if therapist still has assigned patients — must reassign first |
| Resend invitation | ✅ | ✅ | ❌ | ❌ | For `status = 'invited'` accounts only |
| Bulk assign patients to therapist | ✅ | ✅ | ❌ | ❌ | Org boundary enforced; **⚠️ no audit log written** — known gap |
| View own profile / settings | — | — | ✅ | ✅ | Each user can view/edit their own profile |

---

## 8. Organisations

| Action | super_admin | org_admin | therapist | patient | Conditions / Notes |
|--------|:-----------:|:---------:|:---------:|:-------:|-------------------|
| List all orgs | ✅ | ❌ | ❌ | ❌ | |
| View org details | ✅ | ⚠️ | ❌ | ❌ | Org admin: their own org only |
| Create org | ✅ | ❌ | ❌ | ❌ | Creates org + initial admin user |
| Edit org settings | ✅ | ⚠️ | ❌ | ❌ | Org admin: their own org only |
| Delete / archive org | ✅ | ❌ | ❌ | ❌ | |

---

## 9. Treatment Modules

| Action | super_admin | org_admin | therapist | patient | Conditions / Notes |
|--------|:-----------:|:---------:|:---------:|:-------:|-------------------|
| List modules | ✅ | ✅ | ✅ | ❌ | Each role sees: system (all) + org (same org) + private (own) |
| View module | ✅ | ✅ | ✅ | ❌ | System: all; Org: same org; Private: creator only |
| Create `system` module | ✅ | ❌ | ❌ | ❌ | |
| Create `organization` module | ✅ | ✅ | ❌ | ❌ | |
| Create `private` module | ✅ | ✅ | ✅ | ❌ | |
| Edit module | ✅ | ⚠️ | ⚠️ | ❌ | System: super_admin only; Org: admins only; Private: creator only |
| Delete / archive module | ✅ | ⚠️ | ⚠️ | ❌ | Same as edit |
| Generate story page from module | ✅ | ✅ | ✅ | ❌ | Must have read access to the module |

---

## 10. Templates

| Action | super_admin | org_admin | therapist | patient | Conditions / Notes |
|--------|:-----------:|:---------:|:---------:|:-------:|-------------------|
| List templates | ✅ | ✅ | ✅ | ❌ | All see: private (own) + org + system |
| View template | ✅ | ✅ | ✅ | ❌ | System: all; Org: same org; Private: creator only |
| Create `system` template | ✅ | ❌ | ❌ | ❌ | super_admin creates system-scoped templates |
| Create `organization` template | ✅ | ✅ | ❌ | ❌ | |
| Create `private` template | ✅ | ✅ | ✅ | ❌ | |
| Edit template | ✅ | ⚠️ | ⚠️ | ❌ | super_admin: any template; others: own private only |
| Delete template | ✅ | ⚠️ | ⚠️ | ❌ | super_admin: any template; others: own private only |

---

## 11. AI / Chat

| Action | super_admin | org_admin | therapist | patient | Conditions / Notes |
|--------|:-----------:|:---------:|:---------:|:-------:|-------------------|
| Send message / chat | ✅ | ✅ | ✅ | ❌ | Therapist: session must be accessible to them |
| View chat history | ✅ | ✅ | ✅ | ❌ | Same access as parent session |
| Generate image (Vertex AI) | ✅ | ✅ | ✅ | ❌ | |
| Generate music (Suno) | ✅ | ✅ | ✅ | ❌ | |
| Trigger transcription (Deepgram) | ✅ | ✅ | ✅ | ❌ | Must have write access to the session |

---

## 12. Audit Logs

| Action | super_admin | org_admin | therapist | patient | Conditions / Notes |
|--------|:-----------:|:---------:|:---------:|:-------:|-------------------|
| View audit logs | ✅ | ⚠️ | ❌ | ❌ | Org admin: their org's logs only |
| Export audit logs | ✅ | ⚠️ | ❌ | ❌ | Same scope |

---

## Known Gaps / Open Issues

| # | Description | Affected endpoint | Risk | Status |
|---|-------------|-------------------|------|--------|
| G-1 | Bulk patient assign had no audit log | `POST /therapists/{id}/assign-patients` | Medium — HIPAA gap | ✅ Fixed (BUG-03) |
| G-2 | Therapist self-reassign via API had no org boundary check on new therapist | `PUT /patients/{id}` | High | ✅ Fixed (BUG-01) |
| G-3 | Deactivated therapist's JWT remains valid until 24-hour expiry | All routes | Low (time-bounded) | Open |
| G-4 | `super_admin` blocked from all template routes | `GET/POST /api/therapist/templates`, `PUT/DELETE /api/therapist/templates/[id]` | Low | ✅ Fixed |

---

## Access Check Logic (Therapists)

Both conditions must pass. Fail either → **403 Forbidden**.

```
patient.therapistId === therapist.dbUserId     ← currently assigned?
          AND
patient.organizationId === therapist.organizationId  ← same org?
```

For resource-level access (sessions, notes, pages, media):

```
resource.createdByTherapistId === therapist.dbUserId   ← I created it?
          OR
patient.therapistId === therapist.dbUserId              ← I currently own the patient?
```

Read vs Write:
- **Read** — either condition is sufficient
- **Write / Delete** — the second condition (current assignment) must also pass

---

## Audit Trail Coverage

| Operation | Logged? | Function |
|-----------|---------|----------|
| PHI read (note, session, patient) | ✅ | `logAudit` / `logPHIAccess` |
| PHI create | ✅ | `logPHICreate` |
| PHI update (including reassignment) | ✅ | `logPHIUpdate` — logs `changedFields` |
| PHI delete | ✅ | `logPHIDelete` |
| Bulk patient assign | ❌ | **Known gap — G-1** |
| Login / logout events | ✅ | Firebase Identity Platform |
| Org boundary violation attempt | ✅ | Auto-logged by `requireSameOrg` |
| Cross-org access by super admin | ✅ | Auto-logged |
