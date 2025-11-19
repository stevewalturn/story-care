# Prompt Library System - Fine-Grained Access Control

## Overview

The Prompt Library is a centralized repository of AI prompts used for analyzing therapy transcripts, generating creative content, and extracting therapeutic insights. It features a hierarchical access control model that enables standardization while maintaining flexibility for customization at the organization and individual levels.

---

## What is a Prompt?

A **prompt** is a structured instruction set for AI models (GPT-4, etc.) to perform specific therapeutic analysis or creative tasks. Each prompt has:

- **Name**: Human-readable title (e.g., "Self-Resilience & Re-Authoring Analysis")
- **Prompt Text**: The actual AI instruction/system message
- **Category**: Type of analysis (analysis, creative, extraction, reflection)
- **Description**: What the prompt does and when to use it
- **Icon**: Visual identifier for UI
- **Scope**: Access level (system, organization, private)

---

## Access Control Hierarchy

### 1. Super Admin (System Level)
**Scope**: `system`
**Access Level**: Create and manage universal prompts available to all users

#### Permissions
- ✅ Create system-wide prompts
- ✅ Edit all system prompts
- ✅ Delete system prompts
- ✅ View all prompts (system, organization, private)
- ✅ Set default prompts for new organizations
- ✅ Archive/deprecate outdated prompts
- ✅ Publish prompt updates to all users
- ✅ View usage analytics across all organizations

#### Use Cases
- Create evidence-based therapeutic prompts
- Standardize best practices for AI analysis
- Provide starter prompt library for new organizations
- Maintain clinical quality standards
- Develop research-backed extraction methods

#### System Prompt Characteristics
- **Visibility**: Visible to all users across all organizations
- **Editability**: Read-only for org admins and therapists
- **Clonability**: Can be cloned to organization or private scope for customization
- **Updates**: When updated, changes affect all users (use cautiously)
- **Quality**: Should be peer-reviewed and evidence-based

---

### 2. Organization Admin (Organization Level)
**Scope**: `organization`
**Access Level**: Create and manage organization-specific prompts

#### Permissions
- ✅ Create organization-wide prompts
- ✅ Edit organization prompts (created by their org)
- ✅ Delete organization prompts (created by their org)
- ✅ View system prompts (read-only)
- ✅ View all organization prompts (read-write)
- ✅ View private prompts by therapists in their org (read-only, analytics only)
- ✅ Clone system prompts to organization scope
- ✅ Set recommended prompts for their organization
- ✅ View usage statistics for org prompts
- ❌ Edit system prompts
- ❌ Edit private prompts created by therapists

#### Use Cases
- Customize system prompts for organization's therapeutic approach
- Create organization-specific analysis frameworks
- Standardize AI workflows within their organization
- Share best practices among their therapist team
- Ensure compliance with organization protocols
- Adapt prompts for specific patient populations served

#### Organization Prompt Characteristics
- **Visibility**: Visible only to users within the same organization
- **Editability**: Editable by org admins, read-only for therapists
- **Clonability**: Can be cloned by therapists to private scope
- **Sharing**: Automatically available to all therapists in the organization
- **Branding**: Can include org-specific language/frameworks

---

### 3. Therapist (Individual Level)
**Scope**: `private`
**Access Level**: Create and manage personal prompts

#### Permissions
- ✅ Create private prompts (personal use)
- ✅ Edit private prompts (created by them)
- ✅ Delete private prompts (created by them)
- ✅ View system prompts (read-only)
- ✅ View organization prompts (read-only)
- ✅ View own private prompts (read-write)
- ✅ Clone system or organization prompts to private scope
- ✅ Test prompts on their own sessions
- ❌ Edit system prompts
- ❌ Edit organization prompts
- ❌ View other therapists' private prompts
- ❌ Share private prompts directly (must request promotion)

#### Use Cases
- Customize prompts for specific patient populations
- Experiment with new therapeutic approaches
- Create highly specialized extraction prompts
- Develop prompts tailored to personal therapeutic style
- Test prompts before proposing to organization
- Create patient-specific analysis frameworks

#### Private Prompt Characteristics
- **Visibility**: Visible only to the creator
- **Editability**: Full edit access by creator only
- **Clonability**: Cannot be shared (unless promoted to org level)
- **Isolation**: No impact on other users
- **Experimentation**: Safe space for testing new approaches

---

## Prompt Categories

Each prompt belongs to one of four categories:

### 1. Analysis Prompts
**Purpose**: Therapeutic analysis and insight extraction
**Icon**: 🎯 (target)
**Color**: Blue
**Examples**:
- "Self-Resilience & Re-Authoring Analysis"
- "Grounding & Regulation Analysis"
- "Relational Healing & Integration Analysis"

**Typical Output**: Structured therapeutic insights, identified patterns, clinical observations

**Use When**: Analyzing transcript sections for specific therapeutic themes

---

### 2. Creative Prompts
**Purpose**: Generate visual media suggestions and creative content
**Icon**: ✨ (sparkles)
**Color**: Purple
**Examples**:
- "Create A Scene"
- "Potential Images"
- "Video Concept Generation"
- "Metaphor Visualization"

**Typical Output**: Image descriptions, scene suggestions, visual metaphors, DALL-E prompts

**Use When**: Generating media to illustrate patient's narrative

---

### 3. Extraction Prompts
**Purpose**: Pull specific elements from transcripts
**Icon**: 📝 (extract)
**Color**: Green
**Examples**:
- "Extract Meaningful Quotes"
- "Identify Key Moments"
- "Find Strength Statements"
- "Locate Metaphors"

**Typical Output**: Lists, quotes, timestamps, key phrases

**Use When**: Building content libraries, finding specific elements

---

### 4. Reflection Prompts
**Purpose**: Generate patient-facing questions and reflections
**Icon**: 💭 (thought bubble)
**Color**: Orange
**Examples**:
- "Generate Reflection Questions"
- "Create Post-Session Prompts"
- "Patient Journaling Suggestions"

**Typical Output**: Questions, writing prompts, reflection exercises

**Use When**: Creating story page content, building patient engagement

---

## Database Schema

### `module_ai_prompts` Table

```typescript
{
  id: uuid (PK),
  name: varchar(255),               // "Self-Resilience & Re-Authoring Analysis"
  promptText: text,                 // The actual AI instruction
  description: text nullable,       // What this prompt does
  category: varchar(100),           // analysis, creative, extraction, reflection
  icon: varchar(50),                // Icon name (e.g., 'sparkles', 'target')
  scope: template_scope enum,       // system, organization, private
  organizationId: uuid (FK) nullable, // null for system, set for org/private
  createdBy: uuid (FK),             // user who created
  isActive: boolean,                // soft delete flag
  useCount: integer,                // analytics
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Junction Table: `module_prompt_links`
Links prompts to treatment modules (many-to-many)

```typescript
{
  id: uuid (PK),
  moduleId: uuid (FK) → treatment_modules,
  promptId: uuid (FK) → module_ai_prompts,
  sortOrder: integer,               // display order in module
  createdAt: timestamp
}
```

---

## Prompt Library UI

### Super Admin View (`/super-admin/prompts`)

**Tab-Based Layout**:

```
┌─────────────────────────────────────────────────────────────┐
│ System Prompt Library                         [+ Create New] │
├─────────────────────────────────────────────────────────────┤
│ [All] [Analysis] [Creative] [Extraction] [Reflection]        │ ← Tabs by Category
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Search: [________________]  Sort by: [Usage ▼]  [Grid/List]  │
│                                                               │
│ Showing: All Categories (48 prompts)                         │
│                                                               │
│ 🎯 Analysis Prompts (18)                                     │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ 🎯 Self-Resilience & Re-Authoring Analysis        SYSTEM  ││
│ │ Analyze for moments of personal agency, strength...       ││
│ │ Used in 145 sessions • Linked to 8 modules                ││
│ │ [Edit] [Delete] [View Usage] [Duplicate]                 ││
│ └──────────────────────────────────────────────────────────┘│
│ ┌──────────────────────────────────────────────────────────┐│
│ │ 🎯 Grounding & Regulation Analysis                SYSTEM  ││
│ │ Identify dysregulation patterns and coping mechanisms...  ││
│ │ Used in 89 sessions • Linked to 5 modules                 ││
│ │ [Edit] [Delete] [View Usage] [Duplicate]                 ││
│ └──────────────────────────────────────────────────────────┘│
│                                                               │
│ ✨ Creative Prompts (12)                                     │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ ✨ Create A Scene                                  SYSTEM  ││
│ │ Generate therapeutic scene visualization from transcript   ││
│ │ Used in 234 sessions • Linked to 12 modules               ││
│ │ [Edit] [Delete] [View Usage] [Duplicate]                 ││
│ └──────────────────────────────────────────────────────────┘│
│                                                               │
│ 📝 Extraction Prompts (10)                                   │
│ 💭 Reflection Prompts (8)                                    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Tab Filtering**:
- **All Tab**: Shows all prompts across all categories (default)
- **Analysis Tab**: Only shows `category='analysis'` prompts
- **Creative Tab**: Only shows `category='creative'` prompts
- **Extraction Tab**: Only shows `category='extraction'` prompts
- **Reflection Tab**: Only shows `category='reflection'` prompts

---

### Organization Admin View (`/org-admin/prompts`)

**Tab-Based Layout**:

```
┌─────────────────────────────────────────────────────────────┐
│ Prompt Library                                [+ Create New] │
├─────────────────────────────────────────────────────────────┤
│ [System Prompts] [Organization Prompts] [Therapist Usage]    │ ← Tabs by Scope
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 📚 System Prompts (48) - Read Only                           │
│                                                               │
│ Filter by category: [All ▼] Search: [________________]       │
│                                                               │
│ 🎯 Analysis (18)                                             │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ 🎯 Self-Resilience & Re-Authoring Analysis        SYSTEM  ││
│ │ Analyze for moments of personal agency, strength...       ││
│ │ [View Details] [Clone to Organization] [Add to Module]   ││
│ └──────────────────────────────────────────────────────────┘│
│                                                               │
│ ✨ Creative (12)                                             │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ ✨ Create A Scene                                  SYSTEM  ││
│ │ Generate therapeutic scene visualization...               ││
│ │ [View Details] [Clone to Organization] [Add to Module]   ││
│ └──────────────────────────────────────────────────────────┘│
│                                                               │
│ 📝 Extraction (10) • 💭 Reflection (8)                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**When "Organization Prompts" Tab is Selected**:

```
┌─────────────────────────────────────────────────────────────┐
│ Prompt Library                                [+ Create New] │
├─────────────────────────────────────────────────────────────┤
│ [System Prompts] [Organization Prompts] [Therapist Usage]    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 🏢 Our Organization Prompts (15)                             │
│                                                               │
│ Filter by category: [All ▼] Search: [________________]       │
│                                                               │
│ 🎯 Analysis (6)                                              │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ 🎯 Trauma-Informed Safety Analysis                    ORG  ││
│ │ Analyzes for signs of dysregulation and need for grounding ││
│ │ Created by: Dr. Johnson • Used in 23 sessions             ││
│ │ [Edit] [Delete] [View Usage] [Add to Module]             ││
│ └──────────────────────────────────────────────────────────┘│
│ ┌──────────────────────────────────────────────────────────┐│
│ │ 🎯 EMDR Integration Points                            ORG  ││
│ │ Identify moments suitable for EMDR processing...          ││
│ │ Created by: Dr. Martinez • Used in 18 sessions            ││
│ │ [Edit] [Delete] [View Usage] [Add to Module]             ││
│ └──────────────────────────────────────────────────────────┘│
│                                                               │
│ ✨ Creative (4) • 📝 Extraction (3) • 💭 Reflection (2)      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**When "Therapist Usage" Tab is Selected**:

```
┌─────────────────────────────────────────────────────────────┐
│ Prompt Library                                                │
├─────────────────────────────────────────────────────────────┤
│ [System Prompts] [Organization Prompts] [Therapist Usage]    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 👥 Therapist Private Prompts (View Only - Analytics)         │
│                                                               │
│ Search therapist: [___________] Category: [All ▼]            │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Dr. Sarah Smith                               12 prompts  ││
│ │ ├─ 🎯 Veterans PTSD Trigger Analysis (analysis)          ││
│ │ ├─ ✨ Child-Friendly Scene Creator (creative)            ││
│ │ ├─ 📝 Metaphor Extractor - Custom (extraction)           ││
│ │ └─ ... and 9 more                                        ││
│ │ Most used: Veterans PTSD Trigger Analysis (34 sessions)  ││
│ │ [View Details] [Request Promotion to Org]                ││
│ └──────────────────────────────────────────────────────────┘│
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Dr. Michael Jones                             8 prompts   ││
│ │ ├─ 🎯 Teen Identity Work - Specialized (analysis)        ││
│ │ ├─ 💭 Journaling Prompts Generator (reflection)          ││
│ │ └─ ... and 6 more                                        ││
│ │ [View Details] [Request Promotion to Org]                ││
│ └──────────────────────────────────────────────────────────┘│
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Tab Summary**:

| Tab | Content | Actions Available |
|-----|---------|------------------|
| **System Prompts** | Read-only system prompts from super admins | View, Clone to Org, Add to Module |
| **Organization Prompts** | Editable org-wide prompts | Create, Edit, Delete, View Usage, Add to Module |
| **Therapist Usage** | View therapists' private prompts (analytics) | View, Request Promotion |

---

### Therapist View (`/therapist/prompt-library`)

**Traditional Three-Section Layout** (No tabs - therapists see all accessible prompts):

```
┌─────────────────────────────────────────────────────────────┐
│ Prompt Library                                    [+ Create] │
├─────────────────────────────────────────────────────────────┤
│ Search: [________________]  Category: [All ▼]  Scope: [All ▼]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 📚 System Prompts (48)                                       │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │🎯 Analysis│ │✨ Creative│ │📝 Extract│ │💭 Reflect│        │
│ │ Self-Res..│ │ Create A │ │ Meaning..│ │ Generate │        │
│ │ [View]    │ │ [View]   │ │ [View]   │ │ [View]   │        │
│ │ [Clone]   │ │ [Clone]  │ │ [Clone]  │ │ [Clone]  │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                               │
│ 🏢 Organization Prompts (15)                                 │
│ ┌──────────┐ ┌──────────┐                                   │
│ │🎯 Trauma  │ │✨ Child   │                                   │
│ │ Informed  │ │ Centered │                                   │
│ │ [View]    │ │ [View]   │                                   │
│ │ [Clone]   │ │ [Clone]  │                                   │
│ └──────────┘ └──────────┘                                   │
│                                                               │
│ 🔒 My Private Prompts (12)                                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│ │🎯 Sarah's │ │📝 Veteran │ │💭 Grief   │                      │
│ │ Journey   │ │ Extract  │ │ Prompts  │                      │
│ │ [Edit]    │ │ [Edit]   │ │ [Edit]   │                      │
│ │ [Delete]  │ │ [Delete] │ │ [Delete] │                      │
│ └──────────┘ └──────────┘ └──────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Usage Workflows

### Workflow 1: Using Prompts in Transcript Analysis

**Location**: `/sessions/[id]/transcript`

**Steps**:
1. User selects text in transcript
2. Clicks "Analyze Selection"
3. Modal opens showing prompts in 2 sections:

**Section 1: Module Prompts** (Top)
```
📖 Prompts from "Self-Resilience & Re-Authoring"
├─ 🎯 Self-Resilience & Re-Authoring Analysis
├─ ✨ Create A Scene
└─ 📝 Extract Meaningful Quotes
```

**Section 2: All Available Prompts** (Expandable)
```
🔍 All Available Prompts (36)
├─ System Prompts (24)
│  ├─ Analysis (8)
│  ├─ Creative (6)
│  ├─ Extraction (5)
│  └─ Reflection (5)
├─ Organization Prompts (8)
└─ My Private Prompts (4)
```

4. User selects a prompt
5. AI processes with:
   - Selected text (highlight)
   - Full transcript (context)
   - Prompt instructions
6. Result displayed in chat or modal

---

### Workflow 2: Creating a Private Prompt

**Location**: `/therapist/prompt-library`

**Steps**:
1. Click "[+ Create]" button
2. Prompt Editor Modal opens:

```
┌─────────────────────────────────────┐
│ Create New Prompt            [Save] │
├─────────────────────────────────────┤
│ Name: [____________________________]│
│                                     │
│ Category: [Analysis ▼]              │
│ Icon: [🎯] [Choose Icon...]         │
│                                     │
│ Description:                        │
│ [_________________________________] │
│ [_________________________________] │
│                                     │
│ Prompt Instructions:                │
│ [_________________________________] │
│ [_________________________________] │
│ [_________________________________] │
│ [_________________________________] │
│                                     │
│ Preview:                            │
│ ┌─────────────────────────────────┐ │
│ │ 🎯 [Name]                       │ │
│ │ [Description]                   │ │
│ │ Category: Analysis              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Cancel]                     [Save] │
└─────────────────────────────────────┘
```

3. Fill in details:
   - **Name**: "Veterans PTSD - Trigger Analysis"
   - **Category**: Analysis
   - **Icon**: 🎯
   - **Description**: "Identifies potential PTSD triggers in veteran narratives"
   - **Prompt Text**:
     ```
     You are a trauma-informed therapist analyzing a session with a military veteran.

     Context: This patient served in combat zones and experiences PTSD symptoms.

     Task: Analyze the selected text and identify:
     1. Potential trauma triggers mentioned
     2. Coping mechanisms demonstrated
     3. Support systems referenced
     4. Signs of post-traumatic growth

     Format your response as a structured analysis with specific quotes.
     ```

4. Click "Save"
5. Prompt created with `scope='private'`, `createdBy=current_user_id`

---

### Workflow 3: Cloning a System Prompt (Therapist)

**Scenario**: Therapist wants to customize the "Create A Scene" prompt for child therapy

**Steps**:
1. Browse System Prompts in Prompt Library
2. Find "Create A Scene" (creative prompt)
3. Click "View Details"
4. Modal shows:
   ```
   ┌─────────────────────────────────────┐
   │ ✨ Create A Scene (System)          │
   ├─────────────────────────────────────┤
   │ Generate a therapeutic scene        │
   │ visualization from transcript       │
   │ moments                             │
   │                                     │
   │ Category: Creative                  │
   │ Scope: System                       │
   │ Created By: Super Admin             │
   │ Used In: 45 modules                 │
   │                                     │
   │ Prompt Text:                        │
   │ [Full prompt shown...]              │
   │                                     │
   │ [Clone to Private] [Add to Module]  │
   └─────────────────────────────────────┘
   ```
5. Click "Clone to Private"
6. Prompt duplicated with `scope='private'`
7. User redirected to edit the cloned version
8. Customize for children:
   - Rename: "Create A Scene - Child Friendly"
   - Modify prompt to use age-appropriate language
   - Add instructions about animated characters
9. Save

**Result**: User now has a private version they can edit freely

---

### Workflow 4: Organization Admin Creates Org Prompt

**Location**: `/org-admin/prompts`

**Scenario**: Org admin wants to create a trauma-informed prompt for their organization

**Steps**:
1. Navigate to `/org-admin/prompts`
2. Click "[+ Create Organization Prompt]"
3. Fill in details:
   - **Name**: "Trauma-Informed Safety Analysis"
   - **Category**: Analysis
   - **Scope**: Organization (auto-set)
   - **Description**: "Analyzes for signs of dysregulation and need for grounding"
   - **Prompt Text**: [Organization-specific trauma framework]
4. Save

**Result**:
- Prompt visible to all therapists in organization
- Appears in "Organization Prompts" section for therapists
- Therapists can clone to private for further customization
- Read-only for therapists, editable by org admins

---

## Linking Prompts to Modules

### In Module Editor

When creating/editing a module, the AI Prompts section now shows:

```
┌─────────────────────────────────────────┐
│ AI Prompts (3)                          │
├─────────────────────────────────────────┤
│ [Browse Prompt Library]                 │
│                                         │
│ Linked Prompts:                         │
│ ┌─────────────────────────────────────┐ │
│ │ ⋮ 🎯 Self-Resilience Analysis  [×] │ │
│ │ ⋮ ✨ Create A Scene             [×] │ │
│ │ ⋮ 📝 Extract Quotes              [×] │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ (Drag to reorder)                       │
└─────────────────────────────────────────┘
```

**"Browse Prompt Library" Modal**:
```
┌─────────────────────────────────────────┐
│ Add Prompts to Module                   │
├─────────────────────────────────────────┤
│ Search: [__________]  Category: [All ▼] │
│                                         │
│ System Prompts (24)                     │
│ ☑ Self-Resilience Analysis              │
│ ☐ Grounding & Regulation                │
│ ☑ Create A Scene                        │
│ ☐ Relational Healing                    │
│                                         │
│ Organization Prompts (8)                │
│ ☐ Trauma-Informed Safety                │
│ ☑ Extract Quotes                        │
│                                         │
│ My Private Prompts (12)                 │
│ ☐ Veterans PTSD Trigger Analysis        │
│                                         │
│ [Cancel]              [Add Selected (3)]│
└─────────────────────────────────────────┘
```

**How It Works**:
1. User clicks "Browse Prompt Library"
2. Modal shows all accessible prompts
3. User can search/filter by category
4. Select multiple prompts
5. Click "Add Selected"
6. Prompts added to module with default sortOrder
7. Junction table (`module_prompt_links`) updated
8. User can drag to reorder prompts

---

## API Endpoints

### Super Admin APIs
```
GET    /api/super-admin/prompts              # List all system prompts
POST   /api/super-admin/prompts              # Create system prompt
GET    /api/super-admin/prompts/[id]         # Get prompt details
PATCH  /api/super-admin/prompts/[id]         # Edit any prompt
DELETE /api/super-admin/prompts/[id]         # Delete any prompt
GET    /api/super-admin/prompts/analytics    # Usage statistics
```

### Organization Admin APIs
```
GET    /api/org-admin/prompts                # List system + org prompts
POST   /api/org-admin/prompts                # Create org prompt
GET    /api/org-admin/prompts/[id]           # Get prompt details
PATCH  /api/org-admin/prompts/[id]           # Edit org prompt
DELETE /api/org-admin/prompts/[id]           # Delete org prompt
POST   /api/org-admin/prompts/[id]/clone     # Clone to org scope
GET    /api/org-admin/prompts/analytics      # Org usage stats
```

### Therapist APIs
```
GET    /api/therapist/prompts                # List accessible prompts
POST   /api/therapist/prompts                # Create private prompt
GET    /api/therapist/prompts/[id]           # Get prompt details
PATCH  /api/therapist/prompts/[id]           # Edit own private prompt
DELETE /api/therapist/prompts/[id]           # Delete own private prompt
POST   /api/therapist/prompts/[id]/clone     # Clone to private scope
```

### Session-Specific APIs
```
GET    /api/sessions/[id]/ai-prompts         # Get prompts for session
POST   /api/sessions/[id]/analyze            # Execute prompt on selection
```

**`GET /api/sessions/[id]/ai-prompts` Response**:
```json
{
  "module": {
    "id": "uuid",
    "name": "Self-Resilience & Re-Authoring"
  },
  "modulePrompts": [
    {
      "id": "uuid",
      "name": "Self-Resilience Analysis",
      "category": "analysis",
      "icon": "target",
      "sortOrder": 1,
      "isInModule": true
    }
  ],
  "allPrompts": [
    {
      "id": "uuid",
      "name": "Grounding & Regulation",
      "category": "analysis",
      "icon": "target",
      "scope": "system",
      "isInModule": false
    }
  ]
}
```

---

## Prompt Validation

### Required Fields
- `name` (3-255 characters)
- `promptText` (minimum 50 characters)
- `category` (enum: analysis, creative, extraction, reflection)
- `scope` (auto-set based on user role)

### Optional Fields
- `description` (recommended for discoverability)
- `icon` (defaults based on category)

### Validation Rules (Zod Schema)
```typescript
const promptSchema = z.object({
  name: z.string().min(3).max(255),
  promptText: z.string().min(50).max(5000),
  description: z.string().max(500).optional(),
  category: z.enum(['analysis', 'creative', 'extraction', 'reflection']),
  icon: z.string().max(50).optional(),
  scope: z.enum(['system', 'organization', 'private']),
  organizationId: z.string().uuid().optional(),
});
```

---

## Best Practices

### For Super Admins
1. **Quality Control**: Only create evidence-based, peer-reviewed prompts
2. **Documentation**: Include clear descriptions and use cases
3. **Versioning**: Use naming conventions (e.g., "v2", "2024")
4. **Testing**: Test prompts on diverse transcripts before publishing
5. **Updates**: Communicate changes to users before updating
6. **Categories**: Ensure prompts are correctly categorized

### For Organization Admins
1. **Customization**: Clone system prompts before customizing
2. **Consistency**: Maintain org-specific language and frameworks
3. **Training**: Document how to use org prompts effectively
4. **Feedback**: Collect therapist feedback on prompt effectiveness
5. **Review**: Periodically audit and archive outdated prompts
6. **Sharing**: Encourage therapists to share successful private prompts

### For Therapists
1. **Start Simple**: Use system/org prompts before creating private ones
2. **Clone First**: Clone existing prompts instead of starting from scratch
3. **Test Thoroughly**: Test private prompts on multiple sessions
4. **Document**: Add clear descriptions for future reference
5. **Organize**: Use consistent naming conventions
6. **Archive**: Delete or deactivate unsuccessful prompts
7. **Share**: Request promotion of successful prompts to org level

---

## Cloning & Inheritance

### Clone Rules

| From Scope | To Scope | Who Can Clone | Button Label |
|------------|----------|---------------|--------------|
| system | organization | Org Admin | "Clone to Organization" |
| system | private | Therapist | "Clone to Private" |
| organization | private | Therapist | "Clone to Private" |
| private | organization | Not Allowed | Request promotion |
| private | system | Not Allowed | N/A |

### What Gets Cloned
- ✅ Name (editable)
- ✅ Prompt Text (editable)
- ✅ Description (editable)
- ✅ Category (editable)
- ✅ Icon (editable)
- ❌ Usage statistics (reset to 0)
- ❌ Module links (not copied)

### Promotion Workflow (Future Feature)
Therapists can request private prompts be promoted to org level:
1. Click "Request Promotion" on private prompt
2. Organization admin receives notification
3. Admin reviews prompt for quality and org fit
4. If approved, prompt copied to `scope='organization'`
5. Original private version remains unchanged
6. Therapist credited in metadata

---

## Security & Compliance

### Row-Level Security
- Users can only access prompts within their scope
- API queries automatically filter by scope + organizationId
- Middleware enforces role-based access control

### Audit Logging
- Track who created/edited/deleted prompts
- Log scope changes and cloning operations
- Monitor usage statistics (useCount)
- Record which sessions used which prompts

### HIPAA Compliance
- No PHI stored in prompt definitions
- Prompt text contains no patient-specific information
- AI responses stored separately with proper encryption
- Audit trail for all prompt usage

### Injection Prevention
- Prompts are system messages, not user input
- User selections are passed as separate parameters
- No direct string concatenation with user data
- Sanitize any user-provided context

---

## Analytics & Insights

### Prompt Usage Metrics

**Per Prompt**:
- Total uses across all sessions
- Most common modules using this prompt
- Average response quality (future: user ratings)
- Most active users

**Per Organization**:
- Most used prompts
- Custom vs. system prompt ratio
- Therapist adoption rates
- Category distribution

**Per Therapist**:
- Personal prompt library size
- Most frequently used prompts
- Custom prompt effectiveness

---

## Integration with Modules

### Module-Prompt Relationship

One module can have many prompts (via junction table)
One prompt can be in many modules (reusable)

**Benefits of Linking**:
1. **Contextualized Recommendations**: Show relevant prompts first
2. **Workflow Efficiency**: Quick access to module-specific prompts
3. **Consistency**: Same prompts used across similar sessions
4. **Discovery**: Users find new prompts through modules

**Example Module Configuration**:
```
Module: "Self-Resilience & Re-Authoring"
Prompts (4):
  1. Self-Resilience Analysis (analysis)
  2. Create A Scene (creative)
  3. Extract Meaningful Quotes (extraction)
  4. Generate Reflection Questions (reflection)
```

Each module should ideally have 2-6 prompts covering different categories.

---

## Future Enhancements

### Version Control
- Track prompt changes over time
- Allow reverting to previous versions
- Show version history with diffs
- Non-breaking updates

### Collaborative Features
- Comments/feedback on prompts
- Rating system (1-5 stars)
- Share prompts with specific therapists
- Prompt templates with variables

### Advanced Analytics
- A/B testing different prompt versions
- Effectiveness metrics (outcome correlation)
- Natural language prompt generation
- AI-suggested prompt improvements

### Prompt Composition
- Combine multiple prompts
- Conditional prompts (if-then logic)
- Prompt chains (sequential execution)
- Dynamic prompt parameters

---

## Migration from Hardcoded Prompts

### Current State (Before Migration)
Prompts hardcoded in `AnalyzeSelectionModal.tsx`:
- "Create A Scene"
- "Self-Resilience & Re-Authoring Analysis"
- "Extract Meaningful Quotes"
- "Potential Images"

### Migration Steps
1. Create database records for each hardcoded prompt
2. Set `scope='system'`, `createdBy=super_admin`
3. Assign appropriate categories
4. Link to existing modules via junction table
5. Update UI to fetch from database
6. Remove hardcoded arrays from components
7. Test backward compatibility

### Data Migration Script
```typescript
// migrations/seed-system-prompts.ts
const systemPrompts = [
  {
    name: 'Create A Scene',
    promptText: 'Generate a therapeutic scene visualization...',
    category: 'creative',
    icon: 'sparkles',
    scope: 'system',
  },
  // ... other prompts
];

// Insert and link to modules
```

---

**Last Updated**: 2025-11-19
**Version**: 2.0
**Related**: See `MODULES_SYSTEM.md` for Treatment Module management
