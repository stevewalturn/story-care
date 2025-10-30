# 🔒 Authentication Fixes Needed

**Date:** 2025-10-30
**Status:** 🚧 In Progress
**Priority:** HIGH - Required for HIPAA security

---

## ✅ COMPLETED

### Authentication Helper Created:
- ✅ **src/utils/AuthenticatedFetch.ts** - Helper functions for authenticated API calls
  - `authenticatedFetch(url, user)` - GET requests
  - `authenticatedPost(url, user, body)` - POST requests
  - `authenticatedPut(url, user, body)` - PUT requests
  - `authenticatedDelete(url, user)` - DELETE requests
  - `getAuthHeaders(user)` - Get Authorization header

### Pages Fixed:
1. ✅ **src/components/sessions/UploadModal.tsx** - File upload
2. ✅ **src/app/(auth)/sessions/page.tsx** - Session CRUD operations
3. ✅ **src/app/(auth)/dashboard/page.tsx** - Dashboard stats

---

## 🚧 NEEDS FIXING

### High Priority (User-facing features):

#### 1. **src/app/(auth)/patients/page.tsx** (4 fetch calls)
```typescript
// Line ~40: GET /api/patients
const response = await fetch(`/api/patients?therapistId=${user.uid}`);
// FIX: Use authenticatedFetch

// Line ~70: PUT /api/patients/[id]
const response = await fetch(`/api/patients/${editingPatient.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(patientData),
});
// FIX: Use authenticatedPut

// Line ~95: POST /api/patients
const response = await fetch('/api/patients', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(patientData),
});
// FIX: Use authenticatedPost

// Line ~120: DELETE /api/patients/[id]
const response = await fetch(`/api/patients/${patientId}`, {
  method: 'DELETE',
});
// FIX: Use authenticatedDelete
```

#### 2. **src/app/(auth)/groups/page.tsx** (5 fetch calls)
```typescript
// GET /api/groups
// GET /api/patients
// PUT /api/groups/[id]
// POST /api/groups
// DELETE /api/groups/[id]
```

#### 3. **src/app/(auth)/sessions/[id]/speakers/SpeakerLabelingClient.tsx** (2 fetch calls)
```typescript
// GET /api/sessions/[id]/speakers
// PUT /api/sessions/[id]/speakers
```

#### 4. **src/app/(auth)/sessions/[id]/transcript/TranscriptViewerClient.tsx** (7 fetch calls)
```typescript
// GET /api/sessions/[id]
// GET /api/sessions/[id]/transcript
// POST /api/ai/generate-image
// POST /api/ai/generate-video
// GET /api/sessions/[id]/chat
// POST /api/ai/chat
// GET /api/media
// GET /api/quotes
```

#### 5. **src/app/(auth)/assets/AssetsClient.tsx** (4 fetch calls)
```typescript
// GET /api/patients
// GET /api/media
// GET /api/quotes
// GET /api/notes
```

#### 6. **src/app/(auth)/scenes/ScenesClient.tsx** (8 fetch calls)
```typescript
// GET /api/users?role=patient
// GET /api/scenes
// GET /api/scenes/[id]
// POST /api/scenes
// PUT /api/scenes/[id]
// POST /api/scenes/[id]/clips
// POST /api/scenes/[id]/assemble
// GET /api/scenes/[id]/assemble
```

#### 7. **src/app/(auth)/pages/PagesClient.tsx** (1+ fetch calls)
```typescript
// GET /api/pages
// Likely more CRUD operations
```

---

## 📋 FIX PATTERN

### Before (Unauthorized):
```typescript
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

### After (Authenticated):
```typescript
import { authenticatedPost } from '@/utils/AuthenticatedFetch';

const response = await authenticatedPost('/api/endpoint', user, data);
```

---

## 🔧 IMPLEMENTATION STEPS

For each file:

1. **Add import:**
   ```typescript
   import { authenticatedFetch, authenticatedPost, authenticatedPut, authenticatedDelete } from '@/utils/AuthenticatedFetch';
   ```

2. **Replace fetch calls:**
   - `fetch(url)` → `authenticatedFetch(url, user)`
   - `fetch(url, { method: 'POST', ... })` → `authenticatedPost(url, user, body)`
   - `fetch(url, { method: 'PUT', ... })` → `authenticatedPut(url, user, body)`
   - `fetch(url, { method: 'DELETE' })` → `authenticatedDelete(url, user)`

3. **Test the page:**
   - Ensure user is logged in
   - Verify API calls work
   - Check console for errors

---

## ⚠️ CRITICAL NOTES

### Why This Is Important:
- **HIPAA Compliance:** All PHI-accessing APIs require authentication
- **Security:** Prevents unauthorized access to patient data
- **Audit Trail:** Ensures all API calls are logged with user context

### What Happens Without Auth:
- ❌ `401 Unauthorized: Missing or invalid Authorization header`
- ❌ API routes reject the request
- ❌ Users cannot access data
- ❌ Application appears broken

### Testing Checklist:
- [ ] Dashboard loads stats correctly
- [ ] Patients page CRUD works
- [ ] Groups page CRUD works
- [ ] Sessions upload and list work
- [ ] Speaker labeling works
- [ ] Transcript viewer works
- [ ] Assets page loads media/quotes/notes
- [ ] Scenes editor works
- [ ] Pages editor works

---

## 📊 PROGRESS TRACKER

| Page/Component | Fetch Calls | Status |
|----------------|-------------|--------|
| UploadModal.tsx | 1 | ✅ Fixed |
| sessions/page.tsx | 4 | ✅ Fixed |
| dashboard/page.tsx | 1 | ✅ Fixed |
| patients/page.tsx | 4 | 🚧 Pending |
| groups/page.tsx | 5 | 🚧 Pending |
| SpeakerLabelingClient.tsx | 2 | 🚧 Pending |
| TranscriptViewerClient.tsx | 7 | 🚧 Pending |
| AssetsClient.tsx | 4 | 🚧 Pending |
| ScenesClient.tsx | 8 | 🚧 Pending |
| PagesClient.tsx | 1+ | 🚧 Pending |

**Total:** 6 Fixed / 37+ Pending

---

## 🚀 QUICK FIX SCRIPT

For automated fixing (be careful!):

```bash
# Add import to all Client components and pages
find src/app/\(auth\) -name "*.tsx" -type f -exec sed -i '' \
  "/import.*useAuth/a\\
import { authenticatedFetch, authenticatedPost, authenticatedPut, authenticatedDelete } from '@/utils/AuthenticatedFetch';" {} \;

# Then manually replace fetch calls (too complex to automate safely)
```

---

## 📝 RECOMMENDED APPROACH

**Option 1: Fix All Now (2-3 hours)**
- Systematically go through each file
- Replace all fetch calls
- Test each page
- Commit all at once

**Option 2: Fix As Needed (Ongoing)**
- Fix pages when users report 401 errors
- Lower priority for unused features
- Risk: Some features stay broken

**Option 3: Hybrid Approach (Recommended)**
- Fix high-traffic pages now (patients, sessions, dashboard) ✅
- Fix remaining pages in next session
- Document what's pending

---

**Document Version:** 1.0
**Created:** 2025-10-30
**Next Review:** After completing all fixes
**Owner:** Development Team
