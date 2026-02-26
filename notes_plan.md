# Notes Signature Block & Credentials Rename

## Context

Two features requested by Noah:
1. Every **locked note** must display a signature block at the bottom: `Electronically signed by [Name], [Credentials] on [Date] at [Time]`
2. Rename therapist **"Specialty"** field → **"Credentials"** in invite/edit modals (no DB migration needed — UI label change only)

**Re: Noah's unlock/delete question** — A locked note CAN be unlocked by its creator (or an admin), then deleted. Every action (lock, unlock, delete) is recorded in the `audit_logs` table with timestamp, user ID, and action metadata. After deletion, the audit trail entries remain; the note content itself is gone.

---

## What Already Exists

| Item | Status |
|---|---|
| `notes.lockedAt` / `notes.lockedBy` DB fields | ✅ In schema already |
| `note_status` enum: `draft` \| `locked` | ✅ Exists |
| Locked badge in NotesTab UI | ✅ Exists |
| Signature block displayed | ❌ Missing |
| Locker name/credentials returned from API | ❌ Missing (lockedBy is UUID only) |
| "Specialty" → "Credentials" label rename | ❌ Not done |
| Copy-to-clipboard includes signature | ❌ Missing |

---

## Files to Change

| File | Change |
|---|---|
| `src/app/api/notes/route.ts` | JOIN users on lockedBy → return `lockedByName`, `lockedByCredentials` |
| `src/app/api/notes/[id]/route.ts` | Same join for single-note GET |
| `src/app/(auth)/admin/patients/[id]/tabs/NotesTab.tsx` | Add signature block UI + update Note type + update copy handler |
| `src/components/org-admin/InviteTherapistModal.tsx` | Rename label + placeholder |
| `src/components/therapists/EditTherapistModal.tsx` | Rename label + placeholder |

---

## Implementation Steps

### Step 1 — Update `GET /api/notes` to return locker info
**File:** `src/app/api/notes/route.ts`

Left-join `usersSchema` on `notesSchema.lockedBy` to get the locking therapist's `name` and `specialty`.

Add to the select:
```ts
lockedByName: lockerUser.name,
lockedByCredentials: lockerUser.specialty,
```

Do the same in `src/app/api/notes/[id]/route.ts`.

---

### Step 2 — Update Note type in NotesTab
**File:** `src/app/(auth)/admin/patients/[id]/tabs/NotesTab.tsx` (lines 16–26)

Extend the `Note` type:
```ts
type Note = {
  // ...existing fields...
  lockedAt?: string | null;
  lockedByName?: string | null;
  lockedByCredentials?: string | null;
};
```

---

### Step 3 — Render signature block for locked notes
**File:** `src/app/(auth)/admin/patients/[id]/tabs/NotesTab.tsx`

After the note content area, for locked notes render:
```tsx
{note.status === 'locked' && note.lockedAt && (
  <div className="mt-4 border-t border-amber-200 pt-3 text-xs italic text-amber-700">
    Electronically signed by{' '}
    <span className="font-medium">{note.lockedByName ?? 'Unknown'}</span>
    {note.lockedByCredentials && `, ${note.lockedByCredentials}`}
    {' '}on{' '}
    {new Date(note.lockedAt).toLocaleDateString('en-US', {
      month: '2-digit', day: '2-digit', year: 'numeric',
    })}{' '}
    at{' '}
    {new Date(note.lockedAt).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true,
    })}
  </div>
)}
```

**Example output:** `Electronically signed by Some Therapist, APRN FNP-C PMHNP-C on 02/03/2026 at 3:42 PM`

---

### Step 4 — Include signature in copy-to-clipboard
**File:** `src/app/(auth)/admin/patients/[id]/tabs/NotesTab.tsx`

For locked notes, append the signature line to the text copied to clipboard:
```ts
const signature = note.status === 'locked' && note.lockedAt
  ? `\n\n---\nElectronically signed by ${note.lockedByName ?? 'Unknown'}` +
    `${note.lockedByCredentials ? `, ${note.lockedByCredentials}` : ''}` +
    ` on ${formatDate(note.lockedAt)} at ${formatTime(note.lockedAt)}`
  : '';

navigator.clipboard.writeText(markdownContent + signature);
```

---

### Step 5 — Rename "Specialty" → "Credentials" in invite modal
**File:** `src/components/org-admin/InviteTherapistModal.tsx` (lines 138–145)

```diff
- label="Specialty (Optional)"
- placeholder="e.g., Narrative Therapy, Trauma Therapy"
+ label="Credentials (Optional)"
+ placeholder="e.g., APRN FNP-C PMHNP-C"
```

Add helper text:
```tsx
<p className="mt-1 text-xs text-gray-500">
  Credentials appear alongside the therapist's name on all locked notes.
</p>
```

---

### Step 6 — Rename "Specialty" → "Credentials" in edit modal
**File:** `src/components/therapists/EditTherapistModal.tsx` (lines 161–168)

Same label/placeholder/helper-text change as Step 5.

---

## No DB Migration Required

The `specialty` column in the `users` table is reused as-is. Only UI labels and placeholders change.

---

## Verification Checklist

- [ ] Lock a note → signature block appears with correct name, credentials, date/time
- [ ] Lock a note as therapist with no credentials → shows name only (no trailing comma)
- [ ] Copy a locked note → pasted text includes signature line at the bottom
- [ ] Invite therapist modal → field labeled "Credentials (Optional)" with new placeholder
- [ ] Edit therapist modal → same label check
- [ ] Unlock → delete a note → both events appear in audit logs
