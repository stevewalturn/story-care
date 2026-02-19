# UI Overview

> StoryCare frontend architecture -- Next.js App Router with role-based navigation, server components, and Tailwind CSS 4.

---

## At a Glance

| Metric | Value |
|---|---|
| **Total Pages** | 58 |
| **Authenticated Pages** | 53 |
| **Public Pages** | 5 |
| **User Roles** | 4 (super_admin, org_admin, therapist, patient) |
| **Framework** | Next.js 16 + React 19 |
| **Styling** | Tailwind CSS 4 |
| **Icons** | Lucide React |

---

## Page Count by Role

| Role | Nav Items | Dedicated Pages | Shared Pages | Description |
|---|---|---|---|---|
| **Super Admin** | 10 | 16 | 0 | Platform-wide management |
| **Org Admin** | 7 | 8 | 1 (patients) | Organization-level management |
| **Therapist** | 11 | 18 | 7 (sessions, assets, scenes, pages, patients) | Clinical workflow |
| **Patient** | 1 | 2 | 0 | Story viewing |

---

## Complete Site Map

```
StoryCare
|
+-- Public Pages (no auth required)
|   +-- /sign-in                          Sign in page
|   +-- /setup-account                    Account setup (from invitation)
|   +-- /forgot-password                  Password reset request
|   +-- /reset-password                   Password reset form
|   +-- /share/[token]                    Public shared story page
|   +-- /story/[storyId]                  Public story viewer
|   +-- /record/[token]                   Public recording page
|
+-- Therapist Pages
|   +-- /dashboard                        Overview and recent activity
|   +-- /dashboard/user-profile           User profile settings
|   +-- /sessions                         Session library
|   |   +-- /sessions/new                 New session upload
|   |   +-- /sessions/[id]/transcript     Transcript viewer + AI chat
|   |   +-- /sessions/[id]/speakers       Speaker diarization
|   |   +-- /sessions/recordings          Voice recordings list
|   |   +-- /sessions/recordings/new      New recording
|   +-- /patients                         Patient list (shared with org_admin)
|   +-- /assets                           Content library (images, video, audio)
|   +-- /scenes                           Scene editor
|   +-- /pages                            Story pages list
|   |   +-- /pages/new                    New story page
|   |   +-- /pages/[id]                   Story page viewer
|   |   +-- /pages/[id]/edit              Story page editor
|   +-- /assessments/[sessionId]          Clinical assessment
|   +-- /therapist/modules                Personal treatment modules
|   +-- /therapist/responses              Patient responses overview
|   |   +-- /therapist/responses/[pageId] Responses for specific page
|   +-- /therapist/templates              Templates library
|   +-- /therapist/prompts                AI prompts (deprecated view)
|   +-- /therapist/prompt-library         AI prompt library
|   |   +-- /therapist/prompt-library/create     Create prompt
|   |   +-- /therapist/prompt-library/[id]/edit  Edit prompt
|
+-- Org Admin Pages
|   +-- /org-admin/dashboard              Organization overview
|   +-- /org-admin/modules                Organization modules
|   +-- /org-admin/therapists             Therapist management
|   |   +-- /org-admin/therapists/[id]    Therapist detail
|   +-- /org-admin/templates              Organization templates
|   +-- /org-admin/prompts                Organization AI prompts
|   +-- /org-admin/settings               Organization settings
|   +-- /org-admin/patients/[id]          Patient detail (from org admin)
|   +-- /patients                         Patient list (shared)
|
+-- Super Admin Pages
|   +-- /super-admin/dashboard            Platform-wide metrics
|   +-- /super-admin/module-templates     System module templates
|   +-- /super-admin/templates            System reflection/survey templates
|   +-- /super-admin/prompts              System AI prompts
|   |   +-- /super-admin/prompts/create   Create system prompt
|   |   +-- /super-admin/prompts/[id]/edit Edit system prompt
|   +-- /super-admin/ai-models            AI model management
|   +-- /super-admin/form-registry        Clinical assessment instruments
|   +-- /super-admin/organizations        Organization management
|   |   +-- /super-admin/organizations/[id] Organization detail
|   +-- /super-admin/users                User management
|   +-- /super-admin/pending-invitations  Invitation approval queue
|   +-- /super-admin/audit                Audit logs viewer
|   +-- /super-admin/settings             Platform settings
|
+-- Patient Pages
|   +-- /patient/story                    Stories for You (list)
|   +-- /patient/story/[id]              Story page viewer
|   +-- /patient/messages                 Messages
|   +-- /patient/sessions                 Patient sessions
|
+-- Legacy / Admin
    +-- /admin                            Legacy admin page
    +-- /admin/modules                    Legacy modules
    +-- /admin/patients/[id]              Legacy patient detail
```

---

## Navigation Configuration

The sidebar navigation is defined in `src/config/navigation.ts` and rendered based on the authenticated user's role.

### Super Admin Navigation (10 items)

| Item | Path | Icon | Description |
|---|---|---|---|
| Platform Dashboard | `/super-admin/dashboard` | LayoutDashboard | Platform-wide metrics and analytics |
| Module Templates | `/super-admin/module-templates` | Layers | Manage system-wide module templates |
| Templates Library | `/super-admin/templates` | FileText | Manage system reflection and survey templates |
| Prompt Library | `/super-admin/prompts` | Sparkles | Manage system-wide AI prompts |
| AI Models | `/super-admin/ai-models` | Cpu | Manage AI model availability and pricing |
| Form Registry | `/super-admin/form-registry` | FileCheck | Manage clinical assessment instruments |
| Organizations | `/super-admin/organizations` | Building2 | Manage all organizations |
| All Users | `/super-admin/users` | Users | User management across organizations |
| Pending Invitations | `/super-admin/pending-invitations` | UserCheck | Review and approve user invitation requests |
| Audit Logs | `/super-admin/audit` | ClipboardList | Security and access logs |

### Org Admin Navigation (7 items)

| Item | Path | Icon | Description |
|---|---|---|---|
| Dashboard | `/org-admin/dashboard` | LayoutDashboard | Organization overview |
| Treatment Modules | `/org-admin/modules` | Layers | Manage organization modules |
| Therapists | `/org-admin/therapists` | Users | Manage therapist accounts |
| Patients | `/patients` | Users | View all patients |
| Templates Library | `/org-admin/templates` | FileText | Manage organization templates |
| Prompt Library | `/org-admin/prompts` | Sparkles | Manage organization AI prompts |
| Organization Settings | `/org-admin/settings` | Settings | Org settings and defaults |

### Therapist Navigation (11 items)

| Item | Path | Icon | Description |
|---|---|---|---|
| Dashboard | `/dashboard` | LayoutDashboard | Overview and recent activity |
| My Modules | `/therapist/modules` | Layers | Personal treatment modules |
| My Patients | `/patients` | Users | Manage patients |
| Sessions | `/sessions` | Folder | Session recordings and transcripts |
| Recordings | `/sessions/recordings` | Mic | Voice recordings and shareable links |
| Content Library | `/assets` | Image | Media library (images, videos) |
| Scenes | `/scenes` | Film | Video scene editor |
| Story Pages | `/pages` | FileText | Create patient story pages |
| Patient Responses | `/therapist/responses` | MessageSquare | View patient reflections and survey responses |
| Templates Library | `/therapist/templates` | Library | Browse and manage templates |
| Prompt Library | `/therapist/prompt-library` | Sparkles | Browse and manage AI analysis prompts |

### Patient Navigation (1 item)

| Item | Path | Icon | Description |
|---|---|---|---|
| Stories for You | `/patient/story` | BookOpen | Personalized story pages |

---

## Layout Structure

```
+---------------------------------------------------------------+
| TopBar (sticky)                                                |
|  [Logo]  [Search?]                     [Notifications] [User] |
+----------+----------------------------------------------------+
| Sidebar  | Main Content Area                                  |
| (240px)  |                                                    |
|          |  +----------------------------------------------+  |
| [Nav]    |  | Page Header                                  |  |
| [Nav]    |  +----------------------------------------------+  |
| [Nav]    |  |                                              |  |
| [Nav]    |  | Page Content                                 |  |
| [Nav]    |  | (Server Components by default)               |  |
| [Nav]    |  |                                              |  |
| ...      |  |                                              |  |
|          |  +----------------------------------------------+  |
+----------+----------------------------------------------------+
```

- **Root Layout** (`src/app/layout.tsx`): Wraps entire app with providers, analytics
- **Auth Layout** (`src/app/(auth)/layout.tsx`): Sidebar + TopBar for authenticated pages
- **Sidebar**: 240px fixed width on desktop, collapsible on mobile
- **Color scheme**: Primary #4F46E5 (Indigo), Background #F9FAFB, Accent gradient #6366F1 to #8B5CF6
- **Typography**: Inter font family, 14px base size
- **Components**: Custom design with Lucide React icons (20x20px)

---

## Route Protection

Routes are protected at two levels:

1. **Middleware** (`src/middleware.ts`): Checks `session` cookie for all protected paths. Redirects to `/sign-in` if missing or expired.
2. **Navigation config** (`src/config/navigation.ts`): `canAccessRoute()` verifies the user's role has a matching nav item for the path.

Protected route prefixes:
```
/dashboard, /sessions, /assets, /scenes, /pages, /patients,
/groups, /prompts, /admin, /super-admin, /org-admin, /patient
```

---

## Key Source Files

| File | Purpose |
|---|---|
| `src/config/navigation.ts` | Role-based navigation configuration |
| `src/app/(auth)/layout.tsx` | Authenticated layout with sidebar |
| `src/middleware.ts` | Route protection and security headers |
| `src/components/layout/` | Sidebar, TopBar, UserMenu components |
