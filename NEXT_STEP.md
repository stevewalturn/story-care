# StoryCare - Next Steps Implementation Guide

**Last Updated**: October 29, 2025
**Current Phase**: Foundation Complete → UI Implementation

---

## ✅ Completed

1. **PRD.md** - Complete product requirements document
2. **CLAUDE.md** - Updated with StoryCare specifications
3. **LOG.md** - Session tracking document created
4. **Database Schema** - Complete schema in `/src/models/Schema.ts`
   - 20+ tables defined with DrizzleORM
   - All enums, relationships, and types
   - Ready for migration (run `npm run db:generate` when ready)

---

## 🎯 Next Steps (Priority Order)

### Phase 1: Core Infrastructure (2-3 hours)

#### 1.1 Firebase Authentication Setup
**Files to Create:**
- `/src/libs/Firebase.ts` - Firebase client config
- `/src/libs/FirebaseAdmin.ts` - Firebase Admin SDK (server-side)
- `/src/app/[locale]/(auth)/sign-in/page.tsx` - Sign in page
- `/src/app/[locale]/(auth)/sign-up/page.tsx` - Sign up page

**Environment Variables Needed:**
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

**Implementation:**
```typescript
// src/libs/Firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  // ... rest of config
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

#### 1.2 Google Cloud Storage Setup
**Files to Create:**
- `/src/libs/GCS.ts` - GCS client with signed URL generation

**Environment Variables Needed:**
```bash
GCS_PROJECT_ID=
GCS_CLIENT_EMAIL=
GCS_PRIVATE_KEY=
GCS_BUCKET_NAME=
```

**Implementation:**
```typescript
// src/libs/GCS.ts
import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

export const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!);

export async function generateSignedUploadUrl(filename: string) {
  const file = bucket.file(filename);
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });
  return url;
}
```

#### 1.3 AI Services Setup
**Files to Create:**
- `/src/libs/Deepgram.ts` - Transcription API
- `/src/libs/OpenAI.ts` - GPT-4 and DALL-E

**Environment Variables Needed:**
```bash
DEEPGRAM_API_KEY=
OPENAI_API_KEY=
```

---

### Phase 2: Base Layout & Navigation (2 hours)

#### 2.1 Create UI Components Library
**Files to Create:**
- `/src/components/ui/Button.tsx`
- `/src/components/ui/Input.tsx`
- `/src/components/ui/Modal.tsx`
- `/src/components/ui/Card.tsx`
- `/src/components/ui/Dropdown.tsx`

**Reference**: See PRD.md Section "UI/UX Specifications → Component Specifications"

**Example Button Component:**
```typescript
// src/components/ui/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon';
  children: ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const baseStyles = 'font-semibold text-sm rounded-lg transition-all duration-200';
  const variants = {
    primary: 'bg-indigo-600 text-white px-5 py-2.5 hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-600/30',
    secondary: 'bg-white text-gray-700 border border-gray-300 px-5 py-2.5 hover:bg-gray-50',
    icon: 'w-10 h-10 rounded-lg bg-transparent text-gray-500 hover:bg-gray-100',
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
```

#### 2.2 Create Layout Components
**Files to Create:**
- `/src/components/layout/Sidebar.tsx` ⭐ **PRIORITY**
- `/src/components/layout/TopBar.tsx`
- `/src/components/layout/UserMenu.tsx`

**Sidebar Specifications** (Match Screenshot):
- Width: 240px
- Background: White with subtle shadow
- Logo at top: "StoryCare" with purple icon
- 6 navigation items:
  1. Dashboard (grid icon)
  2. Sessions (folder icon)
  3. Assets (image icon)
  4. Scenes (film icon)
  5. Pages (document icon)
  6. Admin (shield icon)
- User section at bottom with logout

**Example Sidebar Component:**
```typescript
// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Folder, Image, Film, FileText, Shield, LogOut } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Sessions', href: '/sessions', icon: Folder },
  { name: 'Assets', href: '/assets', icon: Image },
  { name: 'Scenes', href: '/scenes', icon: Film },
  { name: 'Pages', href: '/pages', icon: FileText },
  { name: 'Admin', href: '/admin', icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">S</span>
        </div>
        <span className="ml-3 font-semibold text-lg">StoryCare</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">NH</span>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">Noah Hendler</p>
            <p className="text-xs text-gray-500">noahhendler@gmail.com</p>
          </div>
        </div>
        <button className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
    </aside>
  );
}
```

#### 2.3 Create Auth Layout
**Files to Update:**
- `/src/app/[locale]/(auth)/layout.tsx`

```typescript
// src/app/[locale]/(auth)/layout.tsx
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
```

---

### Phase 3: Dashboard Page (1 hour)

**Files to Create:**
- `/src/app/[locale]/(auth)/dashboard/page.tsx` ⭐
- `/src/components/dashboard/MetricCard.tsx`
- `/src/components/dashboard/ResponseTable.tsx`
- `/src/components/dashboard/EngagementList.tsx`

**Dashboard Specifications** (Match Screenshot 15):
- 4 metric cards at top:
  - 8 Active Patients
  - 1 Published Pages
  - 3 Survey Responses
  - 3 Written Reflections
- "Recent Reflection Responses" table
- "Recent Survey Responses" table
- "Patient Engagement" expandable list

---

### Phase 4: Sessions Feature (3-4 hours)

#### 4.1 Session Library Page
**Files to Create:**
- `/src/app/[locale]/(auth)/sessions/page.tsx` ⭐⭐ **HIGH PRIORITY**
- `/src/components/sessions/SessionCard.tsx`
- `/src/components/sessions/UploadModal.tsx`

**Reference Screenshots**: 2, 3, 4

#### 4.2 Session Upload Flow
**API Routes to Create:**
- `/src/app/[locale]/api/sessions/route.ts` - POST (create session)
- `/src/app/[locale]/api/sessions/upload-url/route.ts` - GET (signed URL)

#### 4.3 Speaker Labeling
**Files to Create:**
- `/src/app/[locale]/(auth)/sessions/[id]/speakers/page.tsx`
- `/src/components/sessions/SpeakerLabeling.tsx`

**Reference Screenshot**: 5

---

### Phase 5: Transcript Analysis (3-4 hours)

**Files to Create:**
- `/src/app/[locale]/(auth)/sessions/[id]/page.tsx` ⭐⭐
- `/src/components/transcript/TranscriptView.tsx`
- `/src/components/transcript/AIAssistant.tsx`
- `/src/components/transcript/AnalyzeModal.tsx`

**API Routes:**
- `/src/app/[locale]/api/transcripts/[id]/route.ts`
- `/src/app/[locale]/api/ai/analyze/route.ts`
- `/src/app/[locale]/api/ai/chat/route.ts`

**Reference Screenshots**: 6, 7

---

### Phase 6: Media Generation (2-3 hours)

**Files to Create:**
- `/src/components/media/GenerateImage.tsx`
- `/src/components/media/GenerateVideo.tsx`
- `/src/components/media/MediaGrid.tsx`

**API Routes:**
- `/src/app/[locale]/api/media/generate-image/route.ts`
- `/src/app/[locale]/api/media/generate-video/route.ts`

**Reference Screenshots**: 8, 9

---

### Phase 7: Patient Library (2 hours)

**Files to Create:**
- `/src/app/[locale]/(auth)/assets/page.tsx`
- `/src/components/media/MediaLibrary.tsx`
- `/src/components/media/QuotesLibrary.tsx`

**Reference Screenshots**: 10, 11

---

### Phase 8: Scene Editor (3-4 hours)

**Files to Create:**
- `/src/app/[locale]/(auth)/scenes/page.tsx`
- `/src/components/scenes/SceneEditor.tsx`
- `/src/components/scenes/Timeline.tsx`
- `/src/components/scenes/ClipLibrary.tsx`

**API Routes:**
- `/src/app/[locale]/api/scenes/route.ts`
- `/src/app/[locale]/api/scenes/[id]/assemble/route.ts`

**Reference Screenshot**: 12

---

### Phase 9: Story Page Builder (3-4 hours)

**Files to Create:**
- `/src/app/[locale]/(auth)/pages/page.tsx`
- `/src/app/[locale]/(auth)/pages/[id]/edit/page.tsx`
- `/src/components/pages/PageEditor.tsx`
- `/src/components/pages/ContentBlock.tsx`
- `/src/components/pages/MobilePreview.tsx`

**Reference Screenshots**: 13, 14

---

### Phase 10: Patient Story Viewer (2 hours)

**Files to Create:**
- `/src/app/[locale]/(patient)/story/[id]/page.tsx`
- `/src/components/patient/StoryViewer.tsx`
- `/src/components/patient/ReflectionForm.tsx`

**API Routes:**
- `/src/app/[locale]/api/reflections/submit/route.ts`
- `/src/app/[locale]/api/surveys/submit/route.ts`

---

## 🗂️ File Structure Summary

```
src/
├── app/[locale]/
│   ├── (auth)/
│   │   ├── dashboard/page.tsx          ← Phase 3
│   │   ├── sessions/
│   │   │   ├── page.tsx                ← Phase 4.1 ⭐⭐
│   │   │   ├── [id]/page.tsx           ← Phase 5 ⭐⭐
│   │   │   └── [id]/speakers/page.tsx  ← Phase 4.3
│   │   ├── assets/page.tsx             ← Phase 7
│   │   ├── scenes/page.tsx             ← Phase 8
│   │   ├── pages/
│   │   │   ├── page.tsx                ← Phase 9
│   │   │   └── [id]/edit/page.tsx
│   │   └── layout.tsx                  ← Phase 2.3 ⭐
│   ├── (patient)/
│   │   └── story/[id]/page.tsx         ← Phase 10
│   └── api/
│       ├── sessions/route.ts
│       ├── transcripts/[id]/route.ts
│       ├── ai/analyze/route.ts
│       ├── media/generate-image/route.ts
│       ├── scenes/[id]/assemble/route.ts
│       └── ... (20+ API routes total)
├── components/
│   ├── ui/                             ← Phase 2.1 ⭐
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   └── Dropdown.tsx
│   ├── layout/                         ← Phase 2.2 ⭐
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── UserMenu.tsx
│   ├── dashboard/
│   ├── sessions/
│   ├── transcript/
│   ├── media/
│   ├── scenes/
│   ├── pages/
│   └── patient/
├── libs/
│   ├── Firebase.ts                     ← Phase 1.1
│   ├── GCS.ts                          ← Phase 1.2
│   ├── Deepgram.ts                     ← Phase 1.3
│   └── OpenAI.ts                       ← Phase 1.3
└── services/
    ├── SessionService.ts
    ├── MediaService.ts
    └── AnalyticsService.ts
```

---

## 🎨 Design Tokens (Use These Consistently)

```css
/* Colors */
--primary: #4F46E5;          /* Indigo-600 */
--primary-hover: #4338CA;    /* Indigo-700 */
--primary-light: #EEF2FF;    /* Indigo-50 */

--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-500: #6B7280;
--gray-700: #374151;
--gray-900: #111827;

/* Typography */
font-family: 'Inter', sans-serif;
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */

/* Spacing */
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */

/* Border Radius */
--radius-lg: 0.75rem;  /* 12px */
--radius-xl: 1rem;     /* 16px */
```

---

## 📦 Dependencies to Install

```bash
# Firebase
npm install firebase firebase-admin

# Google Cloud Storage
npm install @google-cloud/storage

# AI Services
npm install @deepgram/sdk openai

# UI Icons
npm install lucide-react

# Additional utilities
npm install date-fns clsx tailwind-merge
```

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Generate database migration
npm run db:generate

# Run migrations
npm run db:migrate

# Start dev server
npm run dev

# Open Drizzle Studio (database GUI)
npm run db:studio
```

---

## 📋 Implementation Checklist

### Immediate Next Steps (Do These First)

- [ ] **Phase 2.1**: Create UI components (Button, Input, Modal, Card, Dropdown)
- [ ] **Phase 2.2**: Create Sidebar component (matches screenshots exactly)
- [ ] **Phase 2.3**: Update auth layout with Sidebar
- [ ] **Phase 3**: Create Dashboard page with metric cards
- [ ] **Phase 4.1**: Create Sessions Library page (grid view of sessions)
- [ ] **Phase 4.2**: Create Upload Modal (drag-drop audio upload)

### Can Be Done in Parallel

- **Frontend Team**: Phases 2-4 (UI components, layouts, session pages)
- **Backend Team**: Phase 1 (Firebase, GCS, AI integrations)
- **Full Stack**: Phases 5-10 (features requiring both front + back)

---

## 💡 Tips for Implementation

1. **Match Screenshots Exactly**: Use `/Screenshots/` folder as visual reference
2. **Use Tailwind CSS**: All styling with utility classes
3. **Server Components First**: Only add `'use client'` when needed
4. **Type Safety**: Use types from Schema.ts (`User`, `Session`, etc.)
5. **Error Handling**: Wrap all API calls in try-catch, show user-friendly errors
6. **Loading States**: Add loading spinners for async operations
7. **Responsive Design**: Mobile-first, works on tablets and desktops

---

## 🐛 Common Gotchas

- **Firebase Init**: Must initialize in both client (`libs/Firebase.ts`) and server (`libs/FirebaseAdmin.ts`)
- **GCS Signed URLs**: Expire after 15 minutes, generate fresh URLs
- **Deepgram**: Audio files must be accessible via public URL or uploaded to GCS first
- **OpenAI Images**: Use patient reference image for consistency
- **Database Enums**: Must match enum definitions in Schema.ts exactly

---

## 📚 Reference Documents

- **PRD.md**: Full feature specifications, user flows, database schema
- **CLAUDE.md**: Development guidelines, tech stack, patterns
- **LOG.md**: Session history, decisions made
- **Screenshots/**: 16 UI reference screenshots

---

**Last Updated**: October 29, 2025, 22:45 UTC
**Ready to Code**: YES ✅
**Next Task**: Phase 2.1 - Create UI Components Library
