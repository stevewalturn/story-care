# Modules, Prompts, and Templates: Complete Architecture Guide

**StoryCare Digital Therapeutic Platform**
**Last Updated**: 2025-11-27
**Audience**: Designers, Developers, Product Team

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Overview: How They Work Together](#overview-how-they-work-together)
3. [Part 1: Treatment Modules](#part-1-treatment-modules)
4. [Part 2: Prompt Library](#part-2-prompt-library)
5. [Part 3: Template Library](#part-3-template-library)
6. [Part 4: Integration & Workflows](#part-4-integration--workflows)
7. [Part 5: Mock Data Examples](#part-5-mock-data-examples)
8. [Part 6: Designer Implementation Guide](#part-6-designer-implementation-guide)

---

## Quick Reference

### Visual Comparison

| Aspect | **Treatment Modules** | **Prompt Library** | **Template Library** |
|--------|----------------------|-------------------|---------------------|
| **What is it?** | Complete therapeutic framework | AI analysis instructions | Patient question sets |
| **For whom?** | Therapists (to organize treatment) | AI + Therapists (to analyze) | Patients (to respond) |
| **Contains** | Prompts + Templates + AI context | Single AI instruction | Multiple questions |
| **Reusable?** | Yes (across sessions) | Yes (across modules) | Yes (across modules) |
| **Database** | `treatment_modules` | `module_ai_prompts` | `reflection_templates` + `survey_templates` |
| **Scope Levels** | System, Organization, Private | System, Organization, Private | System, Organization, Private |
| **Relationship** | Container (has many) | Building block (linked) | Building block (referenced) |
| **Example** | "Self-Resilience Framework" | "Extract Strength Moments" | "Resilience Reflection Questions" |
| **Icon** | 🎯 Target/Module icon | ✨ Sparkle (varies by type) | 📋 Clipboard |
| **Primary Color** | Indigo (#4F46E5) | Varies by category | Green (reflection), Blue (survey) |

### Key Differences at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                     TREATMENT MODULE                         │
│  "Self-Resilience & Re-Authoring" (Therapist creates/uses)  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Contains:                                             │   │
│  │                                                       │   │
│  │ 🤖 AI Analysis (INLINE)                              │   │
│  │    └─ Core prompt text stored on module              │   │
│  │                                                       │   │
│  │ 🔗 AI Prompts (FROM LIBRARY - Optional)              │   │
│  │    ├─ "Extract Resilience Moments" (Extraction)      │   │
│  │    ├─ "Identify Growth Patterns" (Analysis)          │   │
│  │    └─ "Generate Visual Metaphors" (Creative)         │   │
│  │                                                       │   │
│  │ 📝 Reflection Templates (FROM LIBRARY)               │   │
│  │    ├─ "Resilience Discovery Questions" (4 Qs)       │   │
│  │    └─ "Personal Strengths Reflection" (3 Qs)        │   │
│  │                                                       │   │
│  │ 📊 Survey Templates (FROM LIBRARY)                   │   │
│  │    └─ "Session Impact Survey" (5 Qs)                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

When therapist uses module:
  1. Analyzes transcript with AI prompts ──────> Therapist reviews
  2. Generates Story Page from module ─────────> Includes questions
  3. Patient views Story Page ─────────────────> Answers questions
```

---

## Overview: How They Work Together

### The Big Picture

**StoryCare** uses a hierarchical, modular approach to digital therapeutics:

1. **Modules** are the **top-level containers** that represent complete therapeutic approaches
2. **Prompts** are **AI instructions** that modules use to analyze therapy sessions
3. **Templates** are **question sets** that modules include in patient-facing Story Pages

### Three-Tier Access Control

All three systems use the same scope hierarchy:

```
┌─────────────────────────────────────────────────────────┐
│ SYSTEM LEVEL (Super Admin creates)                      │
│ - Available to ALL organizations                        │
│ - Cannot be modified by org admins or therapists        │
│ - Examples: Evidence-based therapeutic frameworks       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ ORGANIZATION LEVEL (Org Admin creates)                  │
│ - Available to their organization only                  │
│ - Can customize/extend system-level items              │
│ - Examples: Clinic-specific protocols                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ PRIVATE LEVEL (Individual Therapist creates)            │
│ - Available to creator only                             │
│ - Fully customizable                                    │
│ - Examples: Personalized therapeutic approaches         │
└─────────────────────────────────────────────────────────┘
```

### Complete User Journey

```
Session Upload → Module Assignment → AI Analysis → Story Page → Patient Response
     (1)              (2)                 (3)          (4)           (5)

(1) Therapist uploads audio of therapy session
(2) Selects module: "Self-Resilience & Re-Authoring"
(3) AI analyzes using module's prompts
(4) Therapist creates Story Page (questions auto-populated from module's templates)
(5) Patient answers reflection + survey questions
```

---

## Part 1: Treatment Modules

### What Are Treatment Modules?

**Treatment Modules** are complete therapeutic frameworks that combine:
- **AI Analysis Configuration** (how to analyze the therapy session)
- **Therapeutic Context** (domain, description, clinical approach)
- **Linked AI Prompts** (from the Prompt Library)
- **Linked Question Templates** (from the Template Library)

Think of modules as **therapeutic playbooks** that:
- Guide AI analysis of therapy sessions
- Standardize clinical approaches across therapists
- Auto-populate patient-facing content with appropriate questions
- Enable outcome tracking and research

### Database Schema

**Table**: `treatment_modules`

```typescript
{
  // Identity
  id: uuid (primary key)
  name: varchar(255)                     // "Self-Resilience & Re-Authoring"
  description: text                      // Therapeutic approach description

  // Therapeutic Classification
  domain: therapeutic_domain             // Enum (see below)

  // Access Control
  scope: template_scope                  // 'system' | 'organization' | 'private'
  organizationId: uuid | null           // Required if scope = organization
  createdBy: uuid                        // FK to users table (therapist/admin)

  // AI Analysis Configuration
  aiPromptText: text (required)          // INLINE core prompt (50-10000 chars)
  aiPromptMetadata: jsonb                // Structured AI context
    {
      temperature?: number,              // AI creativity (0.0-1.0)
      maxTokens?: number,               // Response length limit
      modelPreference?: string,         // 'gpt-4' | 'gpt-3.5-turbo'
      contextWindow?: string[]          // Additional context to include
    }

  // Linked Items (From Libraries)
  reflectionTemplateIds: uuid[]          // Array of reflection template IDs
  surveyTemplateIds: uuid[]              // Array of survey template IDs
  // Note: AI Prompts linked via junction table (see Prompt Library section)

  // Status & Approval
  status: module_status                  // 'active' | 'archived' | 'pending_approval'

  // Analytics
  useCount: integer (default 0)         // Times used in sessions

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Enums Explained

**therapeutic_domain** (What area of therapy this module addresses):
```typescript
'self_strength'            // Self-resilience, identity, personal power
'relationships_repair'     // Relational healing, connection repair
'identity_transformation'  // Identity work, re-authoring narratives
'purpose_future'          // Purpose discovery, future visioning
```

**template_scope** (Who can see/use this module):
```typescript
'system'       // Created by Super Admin, visible to all organizations
'organization' // Created by Org Admin, visible to their org only
'private'      // Created by Therapist, visible to them only
```

**module_status** (Lifecycle state):
```typescript
'active'             // Ready to use
'archived'           // Hidden from active lists, but data preserved
'pending_approval'   // Org-level modules awaiting admin approval
```

### Module Properties Explained

#### 1. Core Properties

- **name**: Display name (e.g., "Self-Resilience & Re-Authoring")
- **description**: Therapeutic approach, clinical context, when to use
  - Example: "This module helps patients identify and strengthen their personal resilience through narrative re-authoring. Use after sessions focused on overcoming adversity."

#### 2. AI Configuration

- **aiPromptText**: The MAIN prompt for AI analysis (REQUIRED)
  - This is the core instruction the AI uses to analyze the session
  - 50-10,000 characters
  - Example: "Analyze this therapy transcript through a narrative therapy lens, focusing on moments where the client demonstrated resilience, strength, or agency. Identify key turning points in their story..."

- **aiPromptMetadata**: Additional AI settings (OPTIONAL)
  ```json
  {
    "temperature": 0.7,           // Higher = more creative
    "maxTokens": 2000,           // Response length
    "modelPreference": "gpt-4",  // Which AI model to use
    "contextWindow": [
      "previousSessions",        // Include past session context
      "patientGoals"            // Include patient's stated goals
    ]
  }
  ```

#### 3. Linked Resources

- **reflectionTemplateIds**: Array of UUIDs pointing to `reflection_templates`
  - Example: `["uuid-1", "uuid-2"]` → Links "Resilience Reflections" and "Growth Questions"
  - These questions will be CLONED into Story Pages generated from this module

- **surveyTemplateIds**: Array of UUIDs pointing to `survey_templates`
  - Example: `["uuid-3"]` → Links "Session Impact Survey"
  - Used for quantitative outcome tracking

- **Linked AI Prompts**: Via `module_prompt_links` junction table (see Prompt Library section)
  - Example: Module links to "Extract Strength Moments" and "Identify Growth Patterns"
  - Therapist can execute these prompts on transcript selections

### Scope Hierarchy Examples

#### System-Level Module (created by Super Admin)
```json
{
  "id": "uuid-system-1",
  "name": "Evidence-Based Self-Resilience Framework",
  "scope": "system",
  "organizationId": null,
  "createdBy": "super-admin-uuid",
  "status": "active",
  "domain": "self_strength",
  "description": "Based on peer-reviewed narrative therapy research. Standard protocol for resilience work."
}
```
- ✅ Visible to ALL therapists in ALL organizations
- ❌ Cannot be edited by org admins or therapists
- 🎯 Use case: Evidence-based therapeutic frameworks

#### Organization-Level Module (created by Org Admin)
```json
{
  "id": "uuid-org-1",
  "name": "City Wellness Clinic - Resilience Protocol",
  "scope": "organization",
  "organizationId": "org-uuid-123",
  "createdBy": "org-admin-uuid",
  "status": "active",
  "domain": "self_strength",
  "description": "Customized resilience framework for our clinic's patient population."
}
```
- ✅ Visible to all therapists in "City Wellness Clinic"
- ❌ Not visible to other organizations
- 🎯 Use case: Clinic-specific protocols, cultural adaptations

#### Private Module (created by Therapist)
```json
{
  "id": "uuid-private-1",
  "name": "Dr. Smith's Trauma-Informed Resilience",
  "scope": "private",
  "organizationId": "org-uuid-123",
  "createdBy": "therapist-uuid",
  "status": "active",
  "domain": "self_strength",
  "description": "My personalized approach combining narrative therapy with somatic practices."
}
```
- ✅ Visible ONLY to Dr. Smith
- ✅ Fully customizable
- 🎯 Use case: Individual therapist innovations, experimental approaches

### Module Workflows

#### Workflow 1: Creating a Module

```
1. Therapist navigates to "Modules" page
   └─> Sees: System modules, Org modules, Their private modules

2. Clicks "Create New Module"
   └─> Opens ModuleEditor component

3. Fills in basic info:
   ├─ Name: "Relational Repair Framework"
   ├─ Description: "For couples therapy focused on..."
   ├─ Domain: "relationships_repair"
   └─ Scope: "private" (auto-set for therapists)

4. Configures AI Analysis:
   ├─ Writes inline prompt text (REQUIRED)
   ├─ Sets temperature, max tokens (optional)
   └─ Selects context window preferences

5. Links AI Prompts from Library (OPTIONAL):
   ├─> Opens PromptSelector component
   ├─> Filters by category: "analysis"
   ├─> Selects: "Identify Relational Patterns"
   └─> Selects: "Extract Repair Moments"

6. Links Reflection Templates (OPTIONAL):
   ├─> Opens TemplateSelector component
   ├─> Selects: "Relationship Reflection Questions" (4 questions)
   └─> Selects: "Partner Perspective Questions" (3 questions)

7. Links Survey Templates (OPTIONAL):
   └─> Selects: "Relationship Satisfaction Scale" (5 questions)

8. Saves module
   └─> Status: "active" (therapist) or "pending_approval" (org admin)
```

#### Workflow 2: Using a Module in Session Analysis

```
1. Therapist uploads session audio
   └─> Creates session record in database

2. Deepgram transcribes audio
   └─> Stores transcript with speaker diarization

3. Therapist assigns module to session:
   ├─> Opens "Assign Module" modal
   ├─> Sees modules filtered by domain
   └─> Selects "Self-Resilience & Re-Authoring"

4. AI analyzes transcript:
   ├─> Uses module's inline aiPromptText
   ├─> Applies aiPromptMetadata settings
   └─> Generates insights, themes, key moments

5. Therapist reviews AI analysis:
   ├─> Sees extracted quotes, patterns
   ├─> Can select text and execute linked prompts
   └─> "Extract Strength Moments" → highlights resilience examples

6. Therapist generates Story Page from module:
   └─> Clicks "Create Story Page from Module"

7. Story Page auto-populates:
   ├─> Questions cloned from reflection templates
   ├─> Questions cloned from survey templates
   └─> Therapist can customize cloned questions before publishing
```

#### Workflow 3: Browsing and Filtering Modules

```
User: Therapist at "City Wellness Clinic"
Organization: org-uuid-123

Therapist sees modules in this order:

┌─────────────────────────────────────────────────────────┐
│ MY MODULES (Private, scope='private')                   │
├─────────────────────────────────────────────────────────┤
│ • Dr. Smith's Trauma-Informed Resilience                │
│ • My Couples Relational Repair (Draft)                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ORGANIZATION MODULES (scope='organization')             │
├─────────────────────────────────────────────────────────┤
│ • City Wellness Clinic - Resilience Protocol            │
│ • City Wellness Clinic - Teen Identity Work             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ SYSTEM MODULES (scope='system')                         │
├─────────────────────────────────────────────────────────┤
│ • Evidence-Based Self-Resilience Framework              │
│ • Narrative Therapy Foundation                          │
│ • Identity Re-Authoring Protocol                        │
└─────────────────────────────────────────────────────────┘

Filters available:
- Domain (self_strength, relationships_repair, etc.)
- Scope (show only mine / org / system / all)
- Status (active only / include archived)
- Most used (sort by useCount)
```

### Module UI/UX Design Guidelines

#### ModuleCard Component
```
┌─────────────────────────────────────────────────┐
│ 🎯 Self-Resilience & Re-Authoring              │  ← Icon + Name
│                                                 │
│ Helps patients identify and strengthen...      │  ← Description (truncated)
│                                                 │
│ Domain: Self-Strength                          │  ← Badge/chip
│ Scope: System                                  │  ← Badge (color: blue)
│                                                 │
│ ┌──────────────────────────────────────────┐  │
│ │ 3 AI Prompts • 2 Reflections • 1 Survey  │  │  ← Linked resources count
│ └──────────────────────────────────────────┘  │
│                                                 │
│ Used 47 times                                  │  ← useCount
│                                                 │
│ [View Details] [Use in Session]                │  ← Actions
└─────────────────────────────────────────────────┘
```

**Colors**:
- System modules: Blue border/badge (#3B82F6)
- Organization modules: Purple border/badge (#8B5CF6)
- Private modules: Green border/badge (#10B981)

**Domain Icons**:
- `self_strength`: 💪 (Flexed bicep) or Target icon
- `relationships_repair`: 🤝 (Handshake) or Heart icon
- `identity_transformation`: 🦋 (Butterfly) or Compass icon
- `purpose_future`: 🌟 (Star) or Telescope icon

#### ModuleDetailsModal Component
```
┌────────────────────────────────────────────────────────┐
│ 🎯 Self-Resilience & Re-Authoring          [X]         │
│────────────────────────────────────────────────────────│
│ [Overview] [Questions] [AI Prompts] [Usage Stats]      │  ← Tabs
│────────────────────────────────────────────────────────│
│                                                         │
│ OVERVIEW TAB:                                          │
│                                                         │
│ Description:                                           │
│ This module helps patients identify and strengthen...  │
│                                                         │
│ Therapeutic Domain: Self-Strength                      │
│ Scope: System (Created by Super Admin)                │
│ Created: Jan 15, 2025                                 │
│ Used: 47 sessions                                     │
│                                                         │
│ AI Analysis Configuration:                            │
│ ┌───────────────────────────────────────────────────┐│
│ │ Inline Prompt: (Expandable)                      ││
│ │ "Analyze this therapy transcript through a...    ││
│ │                                                   ││
│ │ Settings:                                        ││
│ │ • Temperature: 0.7                               ││
│ │ • Max Tokens: 2000                               ││
│ │ • Model: GPT-4                                   ││
│ └───────────────────────────────────────────────────┘│
│                                                         │
│ [Use This Module] [Duplicate to My Modules]           │
└────────────────────────────────────────────────────────┘
```

### Module API Endpoints

```
GET    /api/modules
       Query params: ?scope=all|system|organization|private
                    &domain=self_strength|relationships_repair|...
                    &status=active|archived
       Returns: Array of modules accessible to user

POST   /api/modules
       Body: { name, description, domain, aiPromptText, ... }
       Creates: New module (scope auto-set based on user role)

GET    /api/modules/[id]
       Returns: Full module details including linked prompts/templates

PUT    /api/modules/[id]
       Body: Updated fields
       Updates: Module (with permission check)

DELETE /api/modules/[id]
       Soft delete: Sets status='archived'

GET    /api/modules/[id]/linked-prompts
       Returns: AI prompts linked via junction table

POST   /api/modules/[id]/link-prompt
       Body: { promptId, sortOrder }
       Links: Prompt to module via junction table

GET    /api/sessions/[sessionId]/module
       Returns: Module assigned to this session
```

### Module Component Architecture

```
src/components/modules/
├── ModuleLibrary.tsx           # Main grid view
│   ├── Uses: ModuleCard
│   ├── Features: Filter, search, sort
│   └── Role-based visibility
│
├── ModuleCard.tsx              # Card in grid
│   ├── Shows: Name, description, badges
│   ├── Actions: View, Use, Duplicate
│   └── Click: Opens ModuleDetailsModal
│
├── ModuleDetailsModal.tsx      # Full details modal
│   ├── Tabs: Overview, Questions, AI Prompts, Stats
│   ├── Shows: All linked resources
│   └── Actions: Use, Duplicate, Edit (if permitted)
│
├── ModuleEditor.tsx            # Create/Edit form
│   ├── Uses: PromptSelector, TemplateSelector
│   ├── Validation: Zod schema
│   └── Save: API POST/PUT
│
├── ModulePicker.tsx            # Select module for session
│   ├── Used in: Session assignment flow
│   ├── Filters: By domain, scope
│   └── Selection: Single module
│
└── ModuleBadge.tsx             # Scope/domain badge
    └── Colors: Blue (system), Purple (org), Green (private)
```

---

## Part 2: Prompt Library

### What Are AI Prompts?

**AI Prompts** are reusable instructions that tell the AI how to analyze therapy content. They are:
- **Single-purpose** (do one thing well)
- **Reusable** (can be linked to multiple modules)
- **Categorized** (analysis, creative, extraction, reflection)
- **Scoped** (system, organization, or private)

Think of prompts as **specialized AI tools** that therapists can:
- Execute on selected transcript text
- Link to modules for automatic analysis
- Share across their organization
- Customize for specific therapeutic approaches

### Two Types of Prompts in StoryCare

#### 1. Inline Module Prompts (PRIMARY)
- Stored directly on `treatment_modules.aiPromptText`
- **Required** for every module
- The "core" AI analysis for that module
- NOT in the Prompt Library
- Example: The main resilience analysis prompt for "Self-Resilience Module"

#### 2. Library Prompts (OPTIONAL)
- Stored in `module_ai_prompts` table
- **Optional** add-ons to modules
- Linked via `module_prompt_links` junction table
- Reusable across multiple modules
- Example: "Extract Strength Moments" can be used in multiple resilience-focused modules

### Database Schema

#### Table 1: `module_ai_prompts` (The Library)

```typescript
{
  // Identity
  id: uuid (primary key)
  name: varchar(255)                     // "Extract Resilience Moments"
  description: text | null               // What this prompt does

  // The Actual Prompt
  promptText: text (required)            // AI instruction

  // Classification
  category: varchar(100)                 // See categories below
  icon: varchar(50)                      // Icon name for UI (e.g., 'sparkles', 'target')

  // Output Configuration
  outputType: varchar(50)                // 'text' | 'json'
  jsonSchema: jsonb | null              // If outputType='json', define structure

  // Access Control
  scope: template_scope                  // 'system' | 'organization' | 'private'
  organizationId: uuid | null           // Required if scope = organization
  createdBy: uuid                        // FK to users table

  // Status
  isActive: boolean (default true)

  // Analytics
  useCount: integer (default 0)

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Table 2: `module_prompt_links` (Junction Table)

```typescript
{
  id: uuid (primary key)
  moduleId: uuid                         // FK to treatment_modules
  promptId: uuid                         // FK to module_ai_prompts
  sortOrder: integer (default 0)        // Display order in module
  createdAt: timestamp
}
```

**Relationship**:
```
treatment_modules (1) ←→ (many) module_prompt_links (many) ←→ (1) module_ai_prompts

One module can have many prompts
One prompt can be in many modules
```

### Prompt Categories

Each prompt belongs to ONE category, which determines its icon, color, and typical use case:

#### 1. **Analysis** (icon: 🎯, color: Blue #3B82F6)
- **Purpose**: Therapeutic analysis, pattern identification, clinical insights
- **Examples**:
  - "Identify Resilience Patterns"
  - "Analyze Relational Dynamics"
  - "Detect Cognitive Distortions"
- **Output**: Usually text (narrative analysis)
- **Use case**: Core therapeutic interpretation

#### 2. **Creative** (icon: ✨, color: Purple #8B5CF6)
- **Purpose**: Generate visual concepts, scene ideas, metaphors
- **Examples**:
  - "Suggest Visual Metaphors for Strength"
  - "Generate Scene Concepts from Key Moment"
  - "Create Image Prompt for Patient Story"
- **Output**: Usually JSON (structured suggestions)
- **Use case**: Media generation workflow

#### 3. **Extraction** (icon: 📝, color: Green #10B981)
- **Purpose**: Pull specific elements from transcript
- **Examples**:
  - "Extract Meaningful Quotes"
  - "List Turning Points in Session"
  - "Identify Speaker Emotions"
- **Output**: Usually JSON (structured list)
- **Use case**: Content curation for Story Pages

#### 4. **Reflection** (icon: 💭, color: Orange #F59E0B)
- **Purpose**: Generate patient-facing reflection questions
- **Examples**:
  - "Create Personalized Reflection Questions"
  - "Generate Follow-Up Prompts for Patient"
  - "Suggest Journaling Questions"
- **Output**: Usually JSON (array of questions)
- **Use case**: Dynamic question generation

### Prompt Properties Explained

#### 1. Core Properties

- **name**: Short, descriptive title (e.g., "Extract Strength Moments")
- **description**: What this prompt does and when to use it
  - Example: "Scans the transcript to identify specific moments where the patient demonstrated resilience, strength, or agency. Useful for curating content for resilience-focused Story Pages."

- **promptText**: The actual instruction sent to AI
  - Can include placeholders like `{{selectedText}}`, `{{fullTranscript}}`, `{{patientName}}`
  - Example:
    ```
    You are a narrative therapist assistant. Analyze the following transcript excerpt and identify 3-5 specific moments where the patient demonstrated resilience, personal strength, or agency.

    For each moment, provide:
    1. The exact quote (verbatim from transcript)
    2. A brief explanation of why this demonstrates strength
    3. A suggested visual metaphor to represent this moment

    Transcript excerpt:
    {{selectedText}}

    Full session context:
    {{fullTranscript}}
    ```

#### 2. Output Configuration

- **outputType**:
  - `'text'`: Free-form AI response (for narrative analysis)
  - `'json'`: Structured data (for extraction, lists)

- **jsonSchema**: If outputType='json', define expected structure
  ```json
  {
    "type": "object",
    "properties": {
      "moments": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "quote": { "type": "string" },
            "explanation": { "type": "string" },
            "visualMetaphor": { "type": "string" }
          }
        }
      }
    }
  }
  ```

#### 3. Category & Icon

- **category**: One of the 4 categories (determines visual styling)
- **icon**: Icon name from your icon library
  - Examples: `'sparkles'`, `'target'`, `'clipboard'`, `'lightbulb'`
  - Used in PromptLibrary and PromptSelector components

### Inline vs Library Prompts: Key Differences

| Aspect | Inline Prompt | Library Prompt |
|--------|--------------|----------------|
| **Location** | `treatment_modules.aiPromptText` | `module_ai_prompts` table |
| **Required?** | YES (every module needs one) | NO (optional add-ons) |
| **Reusable?** | NO (tied to one module) | YES (many modules) |
| **When executed?** | Automatically on session analysis | Manually by therapist on text selection |
| **Visibility** | Hidden (part of module) | Visible in Prompt Library |
| **Edit permission** | Module owner | Prompt creator (or scope-based) |

### Example: Module with Both Types

```json
{
  "moduleId": "uuid-module-1",
  "moduleName": "Self-Resilience Framework",

  // INLINE PROMPT (required, executed automatically)
  "aiPromptText": "Analyze this therapy transcript through a resilience lens. Identify patterns of strength, turning points, and moments of agency...",

  // LIBRARY PROMPTS (optional, linked for manual use)
  "linkedPrompts": [
    {
      "promptId": "uuid-prompt-1",
      "promptName": "Extract Strength Moments",
      "category": "extraction",
      "sortOrder": 1
    },
    {
      "promptId": "uuid-prompt-2",
      "promptName": "Generate Visual Metaphors",
      "category": "creative",
      "sortOrder": 2
    },
    {
      "promptId": "uuid-prompt-3",
      "promptName": "Suggest Reflection Questions",
      "category": "reflection",
      "sortOrder": 3
    }
  ]
}
```

### Prompt Workflows

#### Workflow 1: Creating a Library Prompt

```
1. Therapist navigates to "Prompt Library" page

2. Clicks "Create New Prompt"
   └─> Opens PromptEditor component

3. Fills in details:
   ├─ Name: "Extract Turning Points"
   ├─ Description: "Identifies key moments where patient's narrative shifted"
   ├─ Category: "extraction" (dropdown)
   ├─ Icon: "clipboard" (icon picker)
   └─ Scope: "private" (auto-set for therapists)

4. Writes prompt text:
   ┌────────────────────────────────────────────────┐
   │ Analyze this transcript and identify 3-5       │
   │ turning points where the patient's story       │
   │ shifted direction. For each turning point:     │
   │                                                 │
   │ 1. Extract the exact quote                     │
   │ 2. Explain the narrative shift                 │
   │ 3. Note the timestamp if available             │
   │                                                 │
   │ Transcript: {{selectedText}}                   │
   └────────────────────────────────────────────────┘

5. Configures output:
   ├─ Output Type: "json"
   └─ JSON Schema: (defines structure)

6. Saves prompt
   └─> Available in Prompt Library for linking to modules
```

#### Workflow 2: Linking Prompt to Module

```
1. Therapist creates/edits module in ModuleEditor

2. In "AI Prompts" section, clicks "Add from Library"
   └─> Opens PromptSelector component

3. Sees categorized prompts:
   ┌────────────────────────────────────────────────┐
   │ [All] [Analysis] [Creative] [Extraction] [Reflection]
   │────────────────────────────────────────────────│
   │                                                 │
   │ EXTRACTION (Green)                             │
   │ □ Extract Strength Moments              (47 uses)
   │ □ List Turning Points                   (23 uses)
   │ ☑ Extract Meaningful Quotes            (89 uses) ← Selected
   │                                                 │
   │ CREATIVE (Purple)                              │
   │ ☑ Generate Visual Metaphors            (34 uses) ← Selected
   │ □ Suggest Scene Concepts                (12 uses)
   │────────────────────────────────────────────────│
   │ [Cancel] [Link Selected Prompts (2)]           │
   └────────────────────────────────────────────────┘

4. Selects 2 prompts, clicks "Link Selected"

5. Prompts now linked to module via junction table
   └─> module_prompt_links entries created with sortOrder
```

#### Workflow 3: Using Prompt on Transcript

```
1. Therapist viewing transcript of analyzed session

2. Selects text passage in transcript:
   "I realized that I don't have to carry all this alone..."

3. Right-click or toolbar appears with "Analyze with AI"
   └─> Opens prompt selection menu

4. Sees TWO sections:

   ┌────────────────────────────────────────────────┐
   │ MODULE PROMPTS (from "Self-Resilience Module") │
   │────────────────────────────────────────────────│
   │ 🎯 Identify Resilience Patterns                │
   │ ✨ Generate Visual Metaphors                   │
   │ 📝 Extract Strength Moments                    │
   │────────────────────────────────────────────────│
   │ ALL PROMPTS (from library)                     │
   │────────────────────────────────────────────────│
   │ [Search prompts...]                            │
   │ 💭 Suggest Reflection Questions                │
   │ 📝 List Turning Points                         │
   └────────────────────────────────────────────────┘

5. Selects "Extract Strength Moments"

6. AI executes:
   ├─ Replaces {{selectedText}} with selected passage
   ├─ Replaces {{fullTranscript}} with full session transcript
   └─ Sends to GPT-4

7. Result displayed in modal:
   ┌────────────────────────────────────────────────┐
   │ 📝 Extract Strength Moments - Results          │
   │────────────────────────────────────────────────│
   │ Found 3 strength moments:                      │
   │                                                 │
   │ 1. "I don't have to carry this alone"          │
   │    → Recognizing need for support              │
   │    Visual: Person setting down heavy backpack  │
   │                                                 │
   │ 2. "I can ask for help"                        │
   │    → Agency in relationship-building           │
   │    Visual: Extended hand reaching out          │
   │                                                 │
   │ 3. "I've survived worse than this"             │
   │    → Historical resilience awareness           │
   │    Visual: Tree with deep roots                │
   │────────────────────────────────────────────────│
   │ [Copy] [Generate Images] [Add to Story Page]   │
   └────────────────────────────────────────────────┘
```

### Prompt UI/UX Design Guidelines

#### PromptLibrary Component (Grid View)

```
┌───────────────────────────────────────────────────────┐
│ Prompt Library                          [+ New Prompt] │
│───────────────────────────────────────────────────────│
│ [All] [Analysis] [Creative] [Extraction] [Reflection] │  ← Category tabs
│ [System] [Organization] [My Prompts]                  │  ← Scope filter
│ [Search prompts...]                                   │
│───────────────────────────────────────────────────────│
│                                                        │
│ ANALYSIS (3)                                          │
│ ┌──────────────────┐ ┌──────────────────┐            │
│ │ 🎯 Identify      │ │ 🎯 Analyze       │            │
│ │ Resilience       │ │ Relational       │            │
│ │ Patterns         │ │ Dynamics         │            │
│ │                  │ │                  │            │
│ │ System           │ │ Organization     │            │
│ │ Used 47 times    │ │ Used 23 times    │            │
│ │ [View] [Link]    │ │ [View] [Link]    │            │
│ └──────────────────┘ └──────────────────┘            │
│                                                        │
│ CREATIVE (2)                                          │
│ ┌──────────────────┐ ┌──────────────────┐            │
│ │ ✨ Generate      │ │ ✨ Suggest       │            │
│ │ Visual           │ │ Scene            │            │
│ │ Metaphors        │ │ Concepts         │            │
│ │                  │ │                  │            │
│ │ Private          │ │ System           │            │
│ │ Used 12 times    │ │ Used 34 times    │            │
│ │ [View] [Edit]    │ │ [View] [Link]    │            │
│ └──────────────────┘ └──────────────────┘            │
└───────────────────────────────────────────────────────┘
```

**Category Colors** (for badges, borders):
- Analysis: Blue (#3B82F6)
- Creative: Purple (#8B5CF6)
- Extraction: Green (#10B981)
- Reflection: Orange (#F59E0B)

**Scope Indicators**:
- System: Blue badge "System"
- Organization: Purple badge with org name
- Private: Green badge "My Prompt"

#### PromptSelector Component (Used in ModuleEditor)

```
┌─────────────────────────────────────────────────────┐
│ Link AI Prompts to Module                      [X]   │
│─────────────────────────────────────────────────────│
│ Selected: 2 prompts                                  │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ✨ Generate Visual Metaphors          [Remove]  │ │
│ │ 📝 Extract Meaningful Quotes          [Remove]  │ │
│ └─────────────────────────────────────────────────┘ │
│─────────────────────────────────────────────────────│
│ [All] [Analysis] [Creative] [Extraction] [Reflection]│
│ [Search prompts...]                                  │
│─────────────────────────────────────────────────────│
│ EXTRACTION                                           │
│ ☑ 📝 Extract Meaningful Quotes (89 uses) System     │
│ □ 📝 List Turning Points (23 uses) Organization     │
│ □ 📝 Extract Strength Moments (47 uses) System      │
│                                                      │
│ CREATIVE                                             │
│ ☑ ✨ Generate Visual Metaphors (34 uses) Private    │
│ □ ✨ Suggest Scene Concepts (12 uses) System        │
│─────────────────────────────────────────────────────│
│ [Cancel] [Link Selected Prompts]                    │
└─────────────────────────────────────────────────────┘
```

#### PromptExecutionModal Component

```
┌─────────────────────────────────────────────────────┐
│ 🎯 Identify Resilience Patterns                [X]   │
│─────────────────────────────────────────────────────│
│ Analyzing selected text...                          │
│ [████████████████████░░░░] 80%                      │
│─────────────────────────────────────────────────────│
│ Results:                                            │
│                                                     │
│ The patient demonstrates resilience through:       │
│                                                     │
│ 1. Self-Awareness                                  │
│    "I realized I don't have to carry this alone"   │
│    This shows metacognitive strength - the         │
│    ability to step back and assess their burden.   │
│                                                     │
│ 2. Agency in Help-Seeking                          │
│    "I can ask for help when I need it"             │
│    Active voice indicates ownership of the         │
│    decision to seek support.                       │
│                                                     │
│ 3. Historical Perspective                          │
│    "I've survived worse situations than this"      │
│    Draws on past experience as evidence of         │
│    capability.                                     │
│─────────────────────────────────────────────────────│
│ [Copy to Clipboard] [Add to Story Page Notes]      │
└─────────────────────────────────────────────────────┘
```

### Prompt API Endpoints

```
GET    /api/prompts
       Query params: ?category=analysis|creative|extraction|reflection
                    &scope=all|system|organization|private
       Returns: Array of prompts accessible to user

POST   /api/prompts
       Body: { name, promptText, category, icon, outputType, ... }
       Creates: New prompt (scope auto-set based on user role)

GET    /api/prompts/[id]
       Returns: Full prompt details

PUT    /api/prompts/[id]
       Body: Updated fields
       Updates: Prompt (with permission check)

DELETE /api/prompts/[id]
       Soft delete: Sets isActive=false

POST   /api/prompts/[id]/execute
       Body: { selectedText, fullTranscript, patientName, ... }
       Executes: Prompt with variable substitution
       Returns: AI response (text or JSON)

GET    /api/sessions/[sessionId]/ai-prompts
       Returns: Prompts linked to this session's module
```

### Prompt Component Architecture

```
src/components/prompts/
├── PromptLibrary.tsx           # Main library view
│   ├── Category tabs
│   ├── Scope filter
│   ├── Search
│   └── Uses: PromptCard
│
├── PromptCard.tsx              # Card in library grid
│   ├── Shows: Icon, name, category, scope, use count
│   ├── Actions: View, Link, Edit (if permitted)
│   └── Click: Opens PromptModal
│
├── PromptModal.tsx             # View/Edit prompt details
│   ├── Shows: Full prompt text, output config
│   ├── Actions: Execute, Edit, Delete, Link to Module
│   └── Validation: Zod schema
│
├── PromptSelector.tsx          # Multi-select for ModuleEditor
│   ├── Used in: ModuleEditor component
│   ├── Features: Category filter, search
│   ├── Shows: Selected prompts (removable)
│   └── Returns: Array of promptIds
│
├── PromptExecutionModal.tsx    # Execute prompt on transcript
│   ├── Input: Selected text, full transcript
│   ├── Shows: Loading state, AI response
│   └── Actions: Copy, Add to notes, Generate media
│
└── PromptCategoryBadge.tsx     # Category indicator
    └── Colors: Blue, Purple, Green, Orange
```

---

## Part 3: Template Library

### What Are Templates?

**Templates** are reusable question sets that therapists include in patient-facing Story Pages. There are two types:

1. **Reflection Templates** (Qualitative) - Open-ended questions for narrative responses
2. **Survey Templates** (Quantitative) - Structured questions for measurable data

Think of templates as **pre-built question banks** that:
- Save therapists time creating Story Pages
- Ensure clinical consistency across patients
- Enable comparative analytics and outcome tracking
- Can be customized at the organization level

### Key Concept: Cloning vs Referencing

**IMPORTANT**: Templates are **cloned** (copied), not referenced.

```
Template (in library)
    ↓ CLONE (when Story Page created)
Story Page Questions (independent copies)
    ↓ CUSTOMIZATION (therapist can edit)
Published Story Page (unique questions)
```

This means:
- ✅ Therapist can customize questions for specific patient
- ✅ Changing template doesn't affect existing Story Pages
- ✅ Each Story Page has its own question data
- ❌ Can't update all pages at once if template changes

### Database Schemas

Both templates use nearly identical structures:

#### Table 1: `reflection_templates`

```typescript
{
  // Identity
  id: uuid (primary key)
  title: varchar(255)                    // "Resilience Discovery Questions"
  description: text | null               // When/why to use this template

  // Classification
  category: template_category            // See categories below

  // Questions (JSONB Array)
  questions: jsonb (required)            // Array of question objects
  /*
  [
    {
      text: "What part of this story shows your strength?",
      type: "open_text",
      required: true,
      placeholder: "Reflect on moments that resonated...",
      helperText: "There are no wrong answers"
    },
    {
      text: "How does this connect to your journey?",
      type: "open_text",
      required: false
    }
  ]
  */

  // Access Control
  scope: template_scope                  // 'system' | 'organization' | 'private'
  organizationId: uuid | null           // Required if scope = organization
  createdBy: uuid                        // FK to users table

  // Approval Workflow (for org templates)
  status: template_status                // 'active' | 'pending_approval' | 'rejected' | 'archived'
  approvedBy: uuid | null               // FK to users (admin who approved)
  approvedAt: timestamp | null
  rejectionReason: text | null          // If status = rejected

  // Analytics
  useCount: integer (default 0)         // Times cloned into Story Pages

  // Metadata
  metadata: jsonb | null                // Custom fields

  // Timestamps
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### Table 2: `survey_templates`

```typescript
{
  // IDENTICAL structure to reflection_templates
  // Only difference: Used for quantitative questions
  // Questions support different types (scale, multiple_choice, emotion)
}
```

### Template Categories

**template_category** enum (applies to both reflection and survey):

```typescript
'screening'       // Initial assessment questions
'outcome'         // Outcome measurement scales
'satisfaction'    // Session/service satisfaction
'custom'          // Custom/uncategorized
'narrative'       // Story and meaning-making questions (reflection)
'emotion'         // Emotional awareness and regulation (reflection)
'goal_setting'    // Future-focused, goal-oriented questions
```

### Question Types

Both template types support these question types (stored in `questions` JSONB):

#### 1. **open_text** (Free-form narrative)
```json
{
  "text": "What part of this story shows your strength?",
  "type": "open_text",
  "required": true,
  "placeholder": "Share your reflections here...",
  "helperText": "There are no wrong answers",
  "maxLength": 1000
}
```
- Used for: Narrative responses, qualitative data
- Patient sees: Large text area
- Common in: Reflection templates

#### 2. **multiple_choice** (Select one or many)
```json
{
  "text": "Which themes resonated with you?",
  "type": "multiple_choice",
  "required": true,
  "multiSelect": true,
  "options": [
    { "label": "Resilience", "value": "resilience" },
    { "label": "Connection", "value": "connection" },
    { "label": "Growth", "value": "growth" },
    { "label": "Hope", "value": "hope" }
  ]
}
```
- Used for: Categorical data
- Patient sees: Checkboxes (if multiSelect) or radio buttons
- Common in: Both templates

#### 3. **scale** (Numeric rating)
```json
{
  "text": "How much did this story resonate with you?",
  "type": "scale",
  "required": true,
  "min": 1,
  "max": 10,
  "minLabel": "Not at all",
  "maxLabel": "Completely",
  "step": 1
}
```
- Used for: Quantitative ratings, Likert scales
- Patient sees: Slider or button array (1-10)
- Common in: Survey templates

#### 4. **emotion** (Emotion selector)
```json
{
  "text": "What emotions did you feel while watching?",
  "type": "emotion",
  "required": true,
  "multiSelect": true,
  "emotionSet": "standard",  // or "therapeutic", "complex"
  "allowOther": true
}
```
- Used for: Emotional tracking
- Patient sees: Grid of emotion icons/labels
- Common in: Both templates
- Emotion sets:
  - `standard`: Happy, Sad, Angry, Fearful, Surprised, Disgusted
  - `therapeutic`: Hope, Pride, Shame, Grief, Joy, Anxiety, Peace
  - `complex`: All + Overwhelmed, Numb, Confused, Grateful, etc.

### Template Properties Explained

#### 1. Core Properties

- **title**: Template name (e.g., "Resilience Discovery Questions")
- **description**: When to use this template, what it measures
  - Example: "Use after resilience-focused sessions to help patients identify and reflect on their personal strengths. Questions focus on meaning-making and self-awareness."

- **category**: Clinical category (see categories above)
  - Helps therapists find appropriate templates
  - Used for filtering in Template Library

#### 2. Questions Array

- **questions**: JSONB array of question objects
  - Minimum 1 question
  - Recommended 3-7 questions per template
  - Each question has: text, type, required, type-specific config
  - Order matters (sortOrder is array index)

#### 3. Approval Workflow (Organization Templates)

When an Org Admin creates a template with scope='organization':

1. **Initial state**: `status = 'pending_approval'`
2. **Admin review**: Super Admin or Senior Org Admin reviews
3. **Approved**: `status = 'active'`, `approvedBy` and `approvedAt` set
4. **Rejected**: `status = 'rejected'`, `rejectionReason` provided
5. **Archived**: `status = 'archived'` (soft delete)

System and Private templates don't require approval:
- System templates: Created by Super Admin, automatically active
- Private templates: Therapist's own, automatically active

### Reflection vs Survey Templates

| Aspect | Reflection Template | Survey Template |
|--------|-------------------|-----------------|
| **Purpose** | Qualitative narrative responses | Quantitative data collection |
| **Question types** | Mostly open_text, some emotion | Mostly scale, multiple_choice |
| **Patient experience** | Writing, storytelling | Rating, selecting |
| **Analysis** | Thematic analysis, manual review | Statistical aggregation, charts |
| **Categories** | narrative, emotion, goal_setting | screening, outcome, satisfaction |
| **Example** | "What does this story mean to you?" | "Rate your mood today (1-10)" |
| **Database** | `reflection_templates` | `survey_templates` |
| **Responses** | `reflection_responses` | `survey_responses` |

### Template-to-Module Relationship

Modules reference templates via ID arrays:

```typescript
// In treatment_modules table
{
  reflectionTemplateIds: uuid[],   // e.g., ["uuid-1", "uuid-2"]
  surveyTemplateIds: uuid[]        // e.g., ["uuid-3"]
}
```

**Multi-select**: A module can link:
- 0 to many reflection templates
- 0 to many survey templates

When Story Page is generated from module:
1. All linked templates' questions are **cloned**
2. Questions copied into `reflection_questions` or `survey_questions` tables
3. Therapist can customize the cloned questions
4. Patient answers stored in `reflection_responses` or `survey_responses`

### Template Workflows

#### Workflow 1: Creating a Reflection Template

```
1. Org Admin navigates to "Template Library"
   └─> Tabs: [Reflections] [Surveys]

2. Clicks "Create Reflection Template"

3. Fills in basic info:
   ├─ Title: "Resilience Discovery Questions"
   ├─ Description: "Use after resilience-focused sessions..."
   ├─ Category: "narrative"
   └─ Scope: "organization" (auto-set for Org Admin)

4. Adds questions:

   Question 1:
   ├─ Text: "What part of this story shows your strength?"
   ├─ Type: "open_text"
   ├─ Required: Yes
   ├─ Placeholder: "Reflect on moments that resonated..."
   └─ Helper text: "There are no wrong answers"

   Question 2:
   ├─ Text: "How does this connect to your journey?"
   ├─ Type: "open_text"
   ├─ Required: No
   └─ Max length: 500

   Question 3:
   ├─ Text: "What emotions did you feel?"
   ├─ Type: "emotion"
   ├─ Multi-select: Yes
   ├─ Emotion set: "therapeutic"
   └─ Allow other: Yes

   Question 4:
   ├─ Text: "What themes resonated most?"
   ├─ Type: "multiple_choice"
   ├─ Multi-select: Yes
   └─ Options: [Resilience, Connection, Growth, Hope]

5. Saves template
   └─> Status: "pending_approval" (awaits Super Admin review)
```

#### Workflow 2: Creating a Survey Template

```
1. Therapist navigates to "Template Library" > "Surveys"

2. Clicks "Create Survey Template"

3. Fills in basic info:
   ├─ Title: "Session Impact Survey"
   ├─ Description: "Measure immediate post-session outcomes"
   ├─ Category: "outcome"
   └─ Scope: "private" (therapist's own)

4. Adds questions:

   Question 1:
   ├─ Text: "How would you rate your mood right now?"
   ├─ Type: "scale"
   ├─ Min: 1, Max: 10
   ├─ Min label: "Very low"
   ├─ Max label: "Very high"
   └─ Required: Yes

   Question 2:
   ├─ Text: "How hopeful do you feel about your future?"
   ├─ Type: "scale"
   ├─ Min: 1, Max: 10
   ├─ Min label: "Not hopeful"
   └─ Max label: "Very hopeful"

   Question 3:
   ├─ Text: "Did this story help you see your situation differently?"
   ├─ Type: "multiple_choice"
   ├─ Multi-select: No (single choice)
   └─ Options: [Yes, somewhat, No, Unsure]

   Question 4:
   ├─ Text: "What emotions are you feeling now?"
   ├─ Type: "emotion"
   ├─ Emotion set: "therapeutic"
   └─ Multi-select: Yes

5. Saves template
   └─> Status: "active" (private templates don't need approval)
```

#### Workflow 3: Linking Templates to Module

```
1. Therapist creating module in ModuleEditor

2. In "Questions" section:
   ├─> "Reflection Questions" subsection
   └─> "Survey Questions" subsection

3. Clicks "Add Reflection Templates"
   └─> Opens TemplateSelector (reflection mode)

4. Sees available templates:
   ┌────────────────────────────────────────────────┐
   │ Select Reflection Templates               [X]   │
   │────────────────────────────────────────────────│
   │ Selected: 1 template                            │
   │ ┌────────────────────────────────────────────┐ │
   │ │ ☑ Resilience Discovery (4 Qs)   [Remove]  │ │
   │ └────────────────────────────────────────────┘ │
   │────────────────────────────────────────────────│
   │ [Narrative] [Emotion] [Goal Setting] [All]     │
   │────────────────────────────────────────────────│
   │ NARRATIVE                                       │
   │ ☑ Resilience Discovery (4 Qs) - Organization   │
   │ □ Personal Strengths (3 Qs) - System           │
   │                                                 │
   │ EMOTION                                         │
   │ □ Emotional Awareness (5 Qs) - System          │
   │────────────────────────────────────────────────│
   │ [Cancel] [Add Selected]                        │
   └────────────────────────────────────────────────┘

5. Selects template, clicks "Add Selected"

6. Template ID added to module's reflectionTemplateIds array

7. Repeats for survey templates (separate selector)
```

#### Workflow 4: Template Cloning (Module → Story Page)

```
When therapist generates Story Page from module:

1. Module has:
   ├─ reflectionTemplateIds: ["template-uuid-1", "template-uuid-2"]
   └─ surveyTemplateIds: ["template-uuid-3"]

2. System fetches template questions:

   Template 1 (Resilience Discovery):
   └─ 4 questions

   Template 2 (Personal Strengths):
   └─ 3 questions

   Template 3 (Session Impact Survey):
   └─ 5 questions

3. Questions CLONED into Story Page:

   ┌─────────────────────────────────────────────┐
   │ Story Page (Draft)                           │
   │─────────────────────────────────────────────│
   │ Reflection Questions (7 total):              │
   │ 1. [From Template 1] What part of this...   │
   │ 2. [From Template 1] How does this...       │
   │ 3. [From Template 1] What emotions...       │
   │ 4. [From Template 1] What themes...         │
   │ 5. [From Template 2] What strengths...      │
   │ 6. [From Template 2] How have you...        │
   │ 7. [From Template 2] Looking forward...     │
   │                                              │
   │ Survey Questions (5 total):                  │
   │ 1. [From Template 3] Rate your mood...      │
   │ 2. [From Template 3] How hopeful...         │
   │ 3. [From Template 3] Did this story...      │
   │ 4. [From Template 3] What emotions...       │
   │ 5. [From Template 3] Would you share...     │
   └─────────────────────────────────────────────┘

4. Therapist can now:
   ├─ Reorder questions
   ├─ Edit question text
   ├─ Delete questions
   ├─ Add custom questions
   └─ Customize for this specific patient

5. Questions saved to:
   ├─ reflection_questions table (linked to page_block)
   └─ survey_questions table (linked to page_block)

6. Patient answers questions:
   ├─ Responses saved to reflection_responses
   └─ Responses saved to survey_responses
```

### Template UI/UX Design Guidelines

#### TemplateLibrary Component

```
┌─────────────────────────────────────────────────────────┐
│ Template Library                  [+ New Template]       │
│─────────────────────────────────────────────────────────│
│ [Reflections] [Surveys]  ← Tabs                          │
│─────────────────────────────────────────────────────────│
│ [All Categories] [Narrative] [Emotion] [Goal Setting]   │  ← Category filter (Reflections)
│ [System] [Organization] [My Templates]                  │  ← Scope filter
│ [Search templates...]                                   │
│─────────────────────────────────────────────────────────│
│                                                          │
│ NARRATIVE (4 templates)                                 │
│ ┌─────────────────────┐ ┌─────────────────────┐        │
│ │ 📋 Resilience       │ │ 📋 Personal         │        │
│ │ Discovery           │ │ Strengths           │        │
│ │                     │ │                     │        │
│ │ 4 questions         │ │ 3 questions         │        │
│ │ Narrative           │ │ Narrative           │        │
│ │ Organization        │ │ System              │        │
│ │ Used 23 times       │ │ Used 89 times       │        │
│ │ Pending Approval    │ │ Active              │        │
│ │                     │ │                     │        │
│ │ [View] [Approve]    │ │ [View] [Link]       │        │
│ └─────────────────────┘ └─────────────────────┘        │
│                                                          │
│ EMOTION (2 templates)                                   │
│ ┌─────────────────────┐ ┌─────────────────────┐        │
│ │ 💭 Emotional        │ │ 💭 Feeling          │        │
│ │ Awareness           │ │ Wheel               │        │
│ │                     │ │                     │        │
│ │ 5 questions         │ │ 6 questions         │        │
│ │ Emotion             │ │ Emotion             │        │
│ │ System              │ │ Private             │        │
│ │ Used 45 times       │ │ Used 7 times        │        │
│ │ Active              │ │ Active              │        │
│ │                     │ │                     │        │
│ │ [View] [Link]       │ │ [View] [Edit]       │        │
│ └─────────────────────┘ └─────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

**Template Card Colors**:
- Reflection templates: Green border (#10B981)
- Survey templates: Blue border (#3B82F6)

**Status Badges**:
- Active: Green badge "Active"
- Pending Approval: Yellow badge "Pending Approval"
- Rejected: Red badge "Rejected"
- Archived: Gray badge "Archived"

#### TemplateEditor Component

```
┌──────────────────────────────────────────────────────┐
│ Create Reflection Template                      [X]   │
│──────────────────────────────────────────────────────│
│ Title:                                                │
│ [Resilience Discovery Questions_____________]         │
│                                                       │
│ Description:                                          │
│ [Use after resilience-focused sessions to help__]    │
│ [patients identify their personal strengths.___]     │
│                                                       │
│ Category: [Narrative ▼]                              │
│ Scope: Organization (City Wellness Clinic)           │
│──────────────────────────────────────────────────────│
│ Questions (4)                           [+ Add Question]│
│                                                       │
│ ┌────────────────────────────────────────────────┐  │
│ │ Question 1                    [Reorder] [Delete] │  │
│ │ ──────────────────────────────────────────────  │  │
│ │ Question Text:                                  │  │
│ │ [What part of this story shows your strength?]  │  │
│ │                                                  │  │
│ │ Type: [Open Text ▼]                             │  │
│ │ ☑ Required                                       │  │
│ │                                                  │  │
│ │ Placeholder:                                     │  │
│ │ [Reflect on moments that resonated with you___] │  │
│ │                                                  │  │
│ │ Helper Text:                                     │  │
│ │ [There are no wrong answers_______________]     │  │
│ └────────────────────────────────────────────────┘  │
│                                                       │
│ ┌────────────────────────────────────────────────┐  │
│ │ Question 2                    [Reorder] [Delete] │  │
│ │ ──────────────────────────────────────────────  │  │
│ │ Question Text:                                  │  │
│ │ [How does this connect to your journey?_____]  │  │
│ │                                                  │  │
│ │ Type: [Open Text ▼]                             │  │
│ │ □ Required                                       │  │
│ └────────────────────────────────────────────────┘  │
│                                                       │
│ [+ Add Question]                                     │
│──────────────────────────────────────────────────────│
│ [Cancel] [Save as Draft] [Submit for Approval]      │
└──────────────────────────────────────────────────────┘
```

#### Question Type Editors

**Open Text**:
```
Type: [Open Text ▼]
☑ Required
Placeholder: [Enter your response here__________]
Helper Text: [Optional guidance_______________]
Max Length: [1000___] characters
```

**Multiple Choice**:
```
Type: [Multiple Choice ▼]
☑ Required
☑ Allow multiple selections

Options:
1. [Resilience_______] [Remove]
2. [Connection_______] [Remove]
3. [Growth__________] [Remove]
4. [Hope____________] [Remove]
[+ Add Option]
```

**Scale**:
```
Type: [Scale ▼]
☑ Required

Min: [1__] Max: [10__] Step: [1__]
Min Label: [Not at all_____]
Max Label: [Completely______]

Display: [Slider ▼] (or Buttons)
```

**Emotion**:
```
Type: [Emotion ▼]
☑ Required
☑ Allow multiple selections

Emotion Set: [Therapeutic ▼]
  • Hope, Pride, Shame, Grief, Joy
  • Anxiety, Peace, Gratitude, etc.

☑ Allow "Other" with text input
```

#### TemplateSelector Component (for ModuleEditor)

```
┌─────────────────────────────────────────────────────┐
│ Select Reflection Templates                    [X]   │
│─────────────────────────────────────────────────────│
│ Selected: 2 templates (7 total questions)            │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ☑ Resilience Discovery (4 Qs)      [Preview]    │ │
│ │   Narrative • Organization • Used 23 times      │ │
│ │                                       [Remove]  │ │
│ │                                                 │ │
│ │ ☑ Personal Strengths (3 Qs)        [Preview]    │ │
│ │   Narrative • System • Used 89 times            │ │
│ │                                       [Remove]  │ │
│ └─────────────────────────────────────────────────┘ │
│─────────────────────────────────────────────────────│
│ [All] [Narrative] [Emotion] [Goal Setting]          │
│ [Search templates...]                                │
│─────────────────────────────────────────────────────│
│                                                      │
│ NARRATIVE (4)                                        │
│ ☑ 📋 Resilience Discovery (4 Qs)                    │
│    Organization • Used 23 times                     │
│    [Preview questions ▼]                            │
│                                                      │
│ ☑ 📋 Personal Strengths (3 Qs)                      │
│    System • Used 89 times                           │
│                                                      │
│ □ 📋 Story Meaning-Making (5 Qs)                    │
│    System • Used 67 times                           │
│                                                      │
│ EMOTION (2)                                          │
│ □ 💭 Emotional Awareness (5 Qs)                     │
│    System • Used 45 times                           │
│─────────────────────────────────────────────────────│
│ Total: 2 templates, 7 questions                     │
│ [Cancel] [Add Selected Templates]                   │
└─────────────────────────────────────────────────────┘
```

**Preview Expansion**:
```
☑ 📋 Resilience Discovery (4 Qs)
   Organization • Used 23 times
   [Preview questions ▼]

   ┌────────────────────────────────────────────┐
   │ Preview: Resilience Discovery              │
   │────────────────────────────────────────────│
   │ 1. What part of this story shows your      │
   │    strength? (Open text, required)         │
   │                                             │
   │ 2. How does this connect to your journey?  │
   │    (Open text, optional)                   │
   │                                             │
   │ 3. What emotions did you feel?             │
   │    (Emotion selector, required)            │
   │                                             │
   │ 4. What themes resonated most?             │
   │    (Multiple choice, required)             │
   │    • Resilience • Connection • Growth      │
   └────────────────────────────────────────────┘
```

### Template API Endpoints

```
# Reflection Templates
GET    /api/templates/reflections
       Query: ?category=narrative|emotion|goal_setting
             &scope=all|system|organization|private
             &status=active|pending_approval|rejected
       Returns: Array of reflection templates

POST   /api/templates/reflections
       Body: { title, description, category, questions, ... }
       Creates: New reflection template

GET    /api/templates/reflections/[id]
       Returns: Full template with questions

PUT    /api/templates/reflections/[id]
       Body: Updated fields
       Updates: Template (with permission check)

DELETE /api/templates/reflections/[id]
       Soft delete: Sets status='archived'

POST   /api/templates/reflections/[id]/approve
       Body: { approved: true/false, rejectionReason }
       Updates: status, approvedBy, approvedAt

# Survey Templates (identical endpoints)
GET    /api/templates/surveys
POST   /api/templates/surveys
GET    /api/templates/surveys/[id]
PUT    /api/templates/surveys/[id]
DELETE /api/templates/surveys/[id]
POST   /api/templates/surveys/[id]/approve
```

### Template Component Architecture

```
src/components/templates/
├── TemplateLibrary.tsx         # Main library view
│   ├── Tabs: Reflections, Surveys
│   ├── Category & scope filters
│   ├── Search
│   └── Uses: TemplateCard
│
├── TemplateCard.tsx            # Card in library grid
│   ├── Shows: Icon, title, question count, category, scope
│   ├── Status badge (pending, active, rejected)
│   ├── Actions: View, Link, Edit, Approve (if admin)
│   └── Click: Opens TemplateModal
│
├── TemplateModal.tsx           # View template details
│   ├── Shows: All questions with full config
│   ├── Actions: Link to module, Duplicate, Edit
│   └── Approval actions (if admin and pending)
│
├── TemplateEditor.tsx          # Create/Edit template
│   ├── Basic info form
│   ├── Question builder
│   ├── Uses: QuestionEditor components
│   └── Save: Draft or Submit for Approval
│
├── QuestionEditor.tsx          # Edit single question
│   ├── Type selector (delegates to specific editors)
│   ├── Common fields: text, required
│   └── Type-specific config
│
├── QuestionTypeEditors/
│   ├── OpenTextEditor.tsx      # Placeholder, helper, maxLength
│   ├── MultipleChoiceEditor.tsx # Options, multiSelect
│   ├── ScaleEditor.tsx         # Min, max, labels, display
│   └── EmotionEditor.tsx       # Emotion set, multiSelect, allowOther
│
├── TemplateSelector.tsx        # Multi-select for ModuleEditor
│   ├── Mode: reflection or survey
│   ├── Category filter, search
│   ├── Shows: Selected templates with question count
│   ├── Preview: Expandable question list
│   └── Returns: Array of templateIds
│
└── TemplatePreview.tsx         # Preview questions
    ├── Used in: TemplateSelector, TemplateModal
    ├── Shows: All questions formatted as patient sees
    └── Read-only display
```

---

## Part 4: Integration & Workflows

### End-to-End Example: Session to Patient Response

This example shows how all three systems work together in a complete therapeutic workflow.

#### Actors:
- **Super Admin**: Creates system-level module
- **Org Admin**: Reviews and approves org templates
- **Therapist (Dr. Sarah)**: Uploads session, uses module, creates Story Page
- **Patient (Alex)**: Views Story Page, answers questions

---

### Step 1: Super Admin Creates System Module

```
Super Admin creates "Self-Resilience Framework" module:

1. Module Configuration:
   ├─ Name: "Self-Resilience & Re-Authoring"
   ├─ Domain: "self_strength"
   ├─ Scope: "system" (available to all orgs)
   └─ Description: "Evidence-based framework for resilience work..."

2. Inline AI Prompt (REQUIRED):
   ┌────────────────────────────────────────────────┐
   │ Analyze this therapy transcript through a      │
   │ narrative therapy lens, focusing on:           │
   │ 1. Moments of resilience and agency            │
   │ 2. Unique outcomes (exceptions to problem)     │
   │ 3. Skills and knowledge demonstrated           │
   │ 4. Preferred future statements                 │
   │                                                 │
   │ Provide structured analysis with quotes.       │
   └────────────────────────────────────────────────┘

3. Links AI Prompts from Library (3):
   ├─ "Extract Strength Moments" (Extraction)
   ├─ "Identify Growth Patterns" (Analysis)
   └─ "Generate Visual Metaphors" (Creative)

4. Links Reflection Templates (2):
   ├─ "Resilience Discovery Questions" (4 Qs - Narrative)
   └─ "Personal Strengths Reflection" (3 Qs - Narrative)

5. Links Survey Template (1):
   └─ "Session Impact Survey" (5 Qs - Outcome)

6. Saves module
   └─> Status: "active" (system modules don't need approval)
```

**Database State**:
```sql
-- treatment_modules
INSERT INTO treatment_modules (
  id: 'mod-uuid-1',
  name: 'Self-Resilience & Re-Authoring',
  domain: 'self_strength',
  scope: 'system',
  aiPromptText: 'Analyze this therapy transcript...',
  reflectionTemplateIds: ['refl-tmpl-1', 'refl-tmpl-2'],
  surveyTemplateIds: ['surv-tmpl-1'],
  status: 'active'
);

-- module_prompt_links
INSERT INTO module_prompt_links VALUES
  ('mod-uuid-1', 'prompt-uuid-1', 1),  -- Extract Strength Moments
  ('mod-uuid-1', 'prompt-uuid-2', 2),  -- Identify Growth Patterns
  ('mod-uuid-1', 'prompt-uuid-3', 3);  -- Generate Visual Metaphors
```

---

### Step 2: Therapist Uploads Session

```
Dr. Sarah (therapist at City Wellness Clinic):

1. Navigates to "Sessions" > "Upload Session"

2. Uploads audio file:
   ├─ Title: "Alex - Session 4: Resilience Discussion"
   ├─ Date: 2025-11-15
   ├─ Type: Individual
   ├─ Audio: session-4-alex.mp3
   └─ Patient: Alex (selected from dropdown)

3. Audio uploaded to Google Cloud Storage
   └─> GCS URL: gs://storycare-sessions/alex-session-4.mp3

4. Deepgram transcription triggered (async)
   ├─> Speaker diarization enabled
   ├─> Smart formatting enabled
   └─> Processing... (30 seconds for 45-min session)

5. Transcript ready:
   ├─> Stored in `transcripts` table
   ├─> Speakers identified: "Therapist", "Patient"
   └─> Utterances stored with timestamps
```

**Database State**:
```sql
-- sessions
INSERT INTO sessions (
  id: 'session-uuid-1',
  title: 'Alex - Session 4: Resilience Discussion',
  sessionDate: '2025-11-15',
  audioUrl: 'gs://storycare-sessions/alex-session-4.mp3',
  patientId: 'alex-uuid',
  therapistId: 'dr-sarah-uuid',
  moduleId: NULL  -- Not assigned yet
);

-- transcripts
INSERT INTO transcripts (
  id: 'transcript-uuid-1',
  sessionId: 'session-uuid-1',
  fullText: 'Complete transcript...'
);

-- utterances (many)
INSERT INTO utterances VALUES
  ('transcript-uuid-1', 'speaker-1', 'I've been thinking about...', 0, 5.2),
  ('transcript-uuid-1', 'speaker-2', 'That's great to hear...', 5.2, 8.7),
  ...
```

---

### Step 3: Therapist Assigns Module & AI Analyzes

```
Dr. Sarah assigns module to session:

1. Opens session detail view
   └─> "Alex - Session 4" transcript displayed

2. Clicks "Assign Module"
   ├─> Opens ModulePicker modal
   ├─> Filters by domain: "Self-Strength"
   └─> Sees available modules:
       • Self-Resilience & Re-Authoring (System)
       • City Wellness Resilience Protocol (Organization)
       • Dr. Sarah's Trauma-Informed Resilience (Private)

3. Selects "Self-Resilience & Re-Authoring"
   └─> Module assigned to session

4. AI Analysis triggered automatically:
   ├─> Uses module's inline aiPromptText
   ├─> Sends full transcript to GPT-4
   └─> Processing... (15 seconds)

5. AI Analysis complete:
   ┌────────────────────────────────────────────────┐
   │ AI Analysis: Self-Resilience Framework         │
   │────────────────────────────────────────────────│
   │ RESILIENCE MOMENTS:                             │
   │ • "I realized I don't have to carry this alone" │
   │   → Recognition of support-seeking as strength  │
   │                                                 │
   │ • "I've survived worse situations than this"    │
   │   → Historical resilience awareness             │
   │                                                 │
   │ UNIQUE OUTCOMES:                                │
   │ • Asked friend for help (new behavior)          │
   │ • Set boundary with family member               │
   │                                                 │
   │ PREFERRED FUTURE:                               │
   │ • "I want to feel more connected"               │
   │ • "I see myself being more honest"              │
   └────────────────────────────────────────────────┘
```

**Database State**:
```sql
-- sessions (updated)
UPDATE sessions
SET moduleId = 'mod-uuid-1'
WHERE id = 'session-uuid-1';

-- ai_analyses (stored for reference)
INSERT INTO ai_analyses (
  sessionId: 'session-uuid-1',
  promptUsed: 'Analyze this therapy transcript...',
  resultText: 'RESILIENCE MOMENTS: ...',
  createdAt: NOW()
);
```

---

### Step 4: Therapist Uses Linked Prompts

```
Dr. Sarah explores transcript with linked prompts:

1. Selects text in transcript:
   "I realized I don't have to carry this alone. I can ask for help."

2. Right-clicks → "Analyze with AI"
   └─> Sees MODULE PROMPTS first (3 linked prompts):
       • 📝 Extract Strength Moments
       • 🎯 Identify Growth Patterns
       • ✨ Generate Visual Metaphors

3. Selects "📝 Extract Strength Moments"

4. AI executes extraction prompt:
   ├─> Replaces {{selectedText}} with selection
   ├─> Replaces {{fullTranscript}} with full session
   └─> Returns JSON:

   {
     "moments": [
       {
         "quote": "I don't have to carry this alone",
         "explanation": "Recognition that burden-sharing is strength, not weakness",
         "visualMetaphor": "Person setting down heavy backpack, accepting help"
       },
       {
         "quote": "I can ask for help",
         "explanation": "Active agency in relationship-building",
         "visualMetaphor": "Extended hand reaching toward another"
       }
     ]
   }

5. Dr. Sarah reviews results, clicks "Generate Images"
   └─> Creates 2 image generation tasks with suggested prompts

6. Later, selects different text and uses "✨ Generate Visual Metaphors"
   └─> Gets creative concepts for scene generation
```

---

### Step 5: Therapist Generates Story Page from Module

```
Dr. Sarah creates Story Page for Alex:

1. In session view, clicks "Create Story Page from Module"

2. Story Page creation modal:
   ├─> Title: Auto-filled "Your Resilience Story"
   ├─> Description: Editable intro text
   └─> Module: "Self-Resilience & Re-Authoring" (pre-selected)

3. Template questions AUTO-POPULATED:

   REFLECTION QUESTIONS (7 total from 2 templates):

   From "Resilience Discovery Questions" (4 Qs):
   1. ✓ What part of this story shows your strength?
   2. ✓ How does this connect to your journey?
   3. ✓ What emotions did you feel while watching?
   4. ✓ What themes resonated most with you?

   From "Personal Strengths Reflection" (3 Qs):
   5. ✓ What strengths did you see in yourself?
   6. ✓ How have you grown since we started?
   7. ✓ Looking forward, what feels possible now?

   SURVEY QUESTIONS (5 total from 1 template):

   From "Session Impact Survey":
   1. ✓ How would you rate your mood right now? (1-10)
   2. ✓ How hopeful do you feel about your future? (1-10)
   3. ✓ Did this story help you see your situation differently?
   4. ✓ What emotions are you feeling now? (emotion selector)
   5. ✓ Would you share this story with others? (Yes/No/Maybe)

4. Dr. Sarah customizes for Alex:
   ├─ Edits Q1: "What part of YOUR story shows YOUR strength?"
   │  (personalizes wording)
   │
   ├─ Removes Q6 (too early in treatment)
   │
   └─ Adds custom question:
      "What surprised you most about seeing your story visually?"

5. Adds media content:
   ├─ Video: "Alex's Resilience Journey" (2 min scene)
   ├─ Image: Visual metaphor (person setting down backpack)
   └─ Quote card: "I don't have to carry this alone"

6. Publishes Story Page
   └─> Status: "published"
   └─> Unique URL: /story/alex-resilience-xyz123
```

**Database State**:
```sql
-- story_pages
INSERT INTO story_pages (
  id: 'page-uuid-1',
  title: 'Your Resilience Story',
  patientId: 'alex-uuid',
  therapistId: 'dr-sarah-uuid',
  moduleId: 'mod-uuid-1',  -- Reference to source module
  status: 'published',
  shareUrl: '/story/alex-resilience-xyz123'
);

-- page_blocks (3: video, image, questions)
INSERT INTO page_blocks VALUES
  ('page-uuid-1', 'video', 1, '{"videoUrl": "..."}'),
  ('page-uuid-1', 'image', 2, '{"imageUrl": "..."}'),
  ('page-uuid-1', 'reflection_questions', 3, '{"blockId": "block-uuid-1"}');

-- reflection_questions (CLONED from templates, now independent)
INSERT INTO reflection_questions VALUES
  ('question-uuid-1', 'page-uuid-1', 'block-uuid-1',
   'What part of YOUR story shows YOUR strength?', 'open_text', true, 1),
  ('question-uuid-2', 'page-uuid-1', 'block-uuid-1',
   'How does this connect to your journey?', 'open_text', false, 2),
  ... (6 more questions)

-- survey_questions (CLONED from template)
INSERT INTO survey_questions VALUES
  ('surv-q-uuid-1', 'page-uuid-1', 'block-uuid-2',
   'How would you rate your mood right now?', 'scale',
   '{"min": 1, "max": 10, "minLabel": "Very low", "maxLabel": "Very high"}', true, 1),
  ... (4 more questions)
```

**Note**: Questions are **cloned**, not referenced. If template changes later, Alex's Story Page questions remain unchanged.

---

### Step 6: Patient Views and Responds

```
Alex (patient) receives notification:

1. Email/SMS with Story Page link:
   "Dr. Sarah has created a new story for you: Your Resilience Story"
   Link: https://storycare.app/story/alex-resilience-xyz123

2. Alex opens link (no login required, token-based access)

3. Story Page layout:
   ┌────────────────────────────────────────────────┐
   │ Your Resilience Story                           │
   │ Created by Dr. Sarah • Nov 15, 2025            │
   │────────────────────────────────────────────────│
   │                                                 │
   │ [VIDEO PLAYER]                                 │
   │ "Alex's Resilience Journey" (2:03)             │
   │ ▶️ Play                                         │
   │                                                 │
   │────────────────────────────────────────────────│
   │                                                 │
   │ [IMAGE]                                        │
   │ Visual metaphor: Person setting down backpack  │
   │                                                 │
   │────────────────────────────────────────────────│
   │                                                 │
   │ REFLECTION QUESTIONS                            │
   │                                                 │
   │ 1. What part of YOUR story shows YOUR strength?│
   │    ┌─────────────────────────────────────────┐│
   │    │ When I asked my friend for help, that   ││
   │    │ took real courage. I've always thought  ││
   │    │ asking for help was weakness, but now   ││
   │    │ I see it's actually brave...            ││
   │    └─────────────────────────────────────────┘│
   │                                                 │
   │ 2. How does this connect to your journey?      │
   │    ┌─────────────────────────────────────────┐│
   │    │ I'm starting to see that I don't have   ││
   │    │ to be perfect or handle everything...   ││
   │    └─────────────────────────────────────────┘│
   │                                                 │
   │ ... (more reflection questions)                │
   │                                                 │
   │────────────────────────────────────────────────│
   │                                                 │
   │ SURVEY                                          │
   │                                                 │
   │ 1. How would you rate your mood right now?     │
   │    Very low  [1][2][3][4][5][6][7][8]⦿[10]     │
   │              Very high                          │
   │                                                 │
   │ 2. How hopeful do you feel about your future?  │
   │    Not hopeful [1][2][3][4][5][6]⦿[8][9][10]   │
   │                Very hopeful                     │
   │                                                 │
   │ 3. Did this story help you see your situation  │
   │    differently?                                 │
   │    ⦿ Yes  ○ Somewhat  ○ No  ○ Unsure           │
   │                                                 │
   │ 4. What emotions are you feeling now?          │
   │    [Multiple emotion selector grid]            │
   │    Selected: Hope ✓  Gratitude ✓  Pride ✓     │
   │                                                 │
   │────────────────────────────────────────────────│
   │ [Save Progress] [Submit Responses]             │
   └────────────────────────────────────────────────┘

4. Alex completes all questions and clicks "Submit Responses"

5. Success message:
   "Thank you for sharing your reflections. Dr. Sarah will review these before your next session."
```

**Database State**:
```sql
-- reflection_responses
INSERT INTO reflection_responses VALUES
  ('resp-uuid-1', 'alex-uuid', 'page-uuid-1', 'question-uuid-1',
   'When I asked my friend for help, that took real courage...', NOW()),
  ('resp-uuid-2', 'alex-uuid', 'page-uuid-1', 'question-uuid-2',
   'I\'m starting to see that I don\'t have to be perfect...', NOW()),
  ... (6 more responses)

-- survey_responses
INSERT INTO survey_responses VALUES
  ('surv-resp-1', 'alex-uuid', 'page-uuid-1', 'surv-q-uuid-1',
   '{"value": 9}', NOW()),  -- Mood rating: 9/10
  ('surv-resp-2', 'alex-uuid', 'page-uuid-1', 'surv-q-uuid-2',
   '{"value": 7}', NOW()),  -- Hopefulness: 7/10
  ('surv-resp-3', 'alex-uuid', 'page-uuid-1', 'surv-q-uuid-3',
   '{"value": "yes"}', NOW()),
  ('surv-resp-4', 'alex-uuid', 'page-uuid-1', 'surv-q-uuid-4',
   '{"values": ["hope", "gratitude", "pride"]}', NOW()),
  ... (1 more response)

-- patient_page_interactions (engagement tracking)
INSERT INTO patient_page_interactions VALUES
  ('page-uuid-1', 'alex-uuid', 'video_started', NOW()),
  ('page-uuid-1', 'alex-uuid', 'video_completed', NOW()),
  ('page-uuid-1', 'alex-uuid', 'reflection_started', NOW()),
  ('page-uuid-1', 'alex-uuid', 'reflection_completed', NOW()),
  ('page-uuid-1', 'alex-uuid', 'survey_started', NOW()),
  ('page-uuid-1', 'alex-uuid', 'survey_completed', NOW());
```

---

### Step 7: Therapist Reviews Responses

```
Dr. Sarah reviews Alex's responses:

1. Navigates to Dashboard > Recent Responses

2. Sees Alex's submission:
   ┌────────────────────────────────────────────────┐
   │ Alex • Your Resilience Story                    │
   │ Submitted 2 hours ago                          │
   │────────────────────────────────────────────────│
   │ Engagement: ✓ Video watched  ✓ All questions  │
   │ Mood: 9/10  Hopefulness: 7/10                  │
   │ [View Full Responses]                          │
   └────────────────────────────────────────────────┘

3. Clicks "View Full Responses"

4. Response detail view:
   ┌────────────────────────────────────────────────┐
   │ Alex's Responses: Your Resilience Story         │
   │ Submitted Nov 15, 2025 at 3:42 PM              │
   │────────────────────────────────────────────────│
   │ REFLECTION RESPONSES                            │
   │                                                 │
   │ Q: What part of YOUR story shows YOUR strength?│
   │ A: "When I asked my friend for help, that took │
   │     real courage. I've always thought asking   │
   │     for help was weakness, but now I see it's  │
   │     actually brave..."                          │
   │                                                 │
   │ Q: How does this connect to your journey?      │
   │ A: "I'm starting to see that I don't have to   │
   │     be perfect or handle everything alone..."  │
   │                                                 │
   │ ... (more responses)                            │
   │────────────────────────────────────────────────│
   │ SURVEY RESULTS                                  │
   │                                                 │
   │ Mood Rating: 9/10 ████████████████████░░       │
   │ Hopefulness: 7/10 ██████████████░░░░░░         │
   │ Story Impact: Yes                              │
   │ Emotions: Hope, Gratitude, Pride               │
   │────────────────────────────────────────────────│
   │ [Export] [Add to Session Notes] [Compare]     │
   └────────────────────────────────────────────────┘

5. Dr. Sarah adds notes:
   "Alex's responses show significant shift in help-seeking beliefs.
    Strong engagement with resilience narrative. Follow up on
    gratitude theme in next session."

6. Prepares for next session with insights from:
   ├─ AI analysis of session transcript
   ├─ Visual media that resonated
   ├─ Alex's qualitative reflections
   └─ Quantitative mood/hope tracking
```

---

### Analytics & Outcome Tracking

Over time, Dr. Sarah can track:

```
Alex's Progress (Using "Session Impact Survey"):

Session 1: Mood 4/10, Hope 3/10
Session 2: Mood 5/10, Hope 4/10
Session 3: Mood 6/10, Hope 5/10
Session 4: Mood 9/10, Hope 7/10  ← Significant improvement!

Themes from Reflections (AI-analyzed):
• Week 1-2: Isolation, burden, overwhelm
• Week 3-4: Connection, support-seeking, courage

Module Effectiveness:
"Self-Resilience & Re-Authoring" module used 47 times
Average mood improvement: +3.2 points
Average hope improvement: +2.8 points
Patient engagement rate: 94% (47/50 completed all questions)
```

---

### Summary: How All Three Systems Worked Together

1. **Module** (`treatment_modules`)
   - Provided therapeutic framework
   - Linked AI prompts and templates
   - Guided session analysis

2. **Prompts** (`module_ai_prompts`)
   - Inline prompt: Auto-analyzed full session
   - Library prompts: Manual analysis on text selections
   - Generated insights and creative concepts

3. **Templates** (`reflection_templates`, `survey_templates`)
   - Cloned into Story Page as questions
   - Collected qualitative reflections
   - Tracked quantitative outcomes

4. **Result**:
   - Therapist saved time (auto-populated questions)
   - Patient had personalized, engaging experience
   - Clinical data captured for outcome tracking
   - Therapeutic relationship deepened through visual storytelling

---

## Part 5: Mock Data Examples

### Complete Module JSON

```json
{
  "id": "mod-uuid-1",
  "name": "Self-Resilience & Re-Authoring",
  "description": "Evidence-based narrative therapy framework for resilience work. Helps patients identify personal strengths, unique outcomes, and preferred futures. Use after sessions focused on overcoming adversity or building self-efficacy.",
  "domain": "self_strength",
  "scope": "system",
  "organizationId": null,
  "createdBy": "super-admin-uuid",

  "aiPromptText": "Analyze this therapy transcript through a narrative therapy lens, focusing on:\n\n1. RESILIENCE MOMENTS: Identify 3-5 specific instances where the patient demonstrated resilience, personal strength, or agency. For each moment, provide:\n   - Exact quote (verbatim)\n   - Explanation of why this demonstrates strength\n   - Suggested visual metaphor\n\n2. UNIQUE OUTCOMES: Note any exceptions to the problem story - times when the problem was less dominant or the patient responded differently.\n\n3. SKILLS & KNOWLEDGE: What capabilities did the patient demonstrate? What do they know about themselves that's valuable?\n\n4. PREFERRED FUTURE: Extract any statements about desired change, hopes, or possibilities.\n\nProvide structured analysis with specific quotes to support each point.\n\nTranscript:\n{{fullTranscript}}",

  "aiPromptMetadata": {
    "temperature": 0.7,
    "maxTokens": 2000,
    "modelPreference": "gpt-4",
    "contextWindow": ["previousSessions", "patientGoals"]
  },

  "reflectionTemplateIds": [
    "refl-tmpl-uuid-1",  // Resilience Discovery Questions
    "refl-tmpl-uuid-2"   // Personal Strengths Reflection
  ],

  "surveyTemplateIds": [
    "surv-tmpl-uuid-1"   // Session Impact Survey
  ],

  "status": "active",
  "useCount": 47,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-11-15T14:30:00Z",

  "linkedPrompts": [
    {
      "id": "prompt-uuid-1",
      "name": "Extract Strength Moments",
      "category": "extraction",
      "sortOrder": 1
    },
    {
      "id": "prompt-uuid-2",
      "name": "Identify Growth Patterns",
      "category": "analysis",
      "sortOrder": 2
    },
    {
      "id": "prompt-uuid-3",
      "name": "Generate Visual Metaphors",
      "category": "creative",
      "sortOrder": 3
    }
  ]
}
```

### Complete Prompt JSON (Library)

```json
{
  "id": "prompt-uuid-1",
  "name": "Extract Strength Moments",
  "description": "Scans the transcript to identify specific moments where the patient demonstrated resilience, strength, or agency. Useful for curating content for resilience-focused Story Pages. Returns structured JSON with quotes and visual suggestions.",
  "category": "extraction",
  "icon": "clipboard",

  "promptText": "You are a narrative therapist assistant analyzing a therapy session excerpt.\n\nTask: Identify 3-5 specific moments where the patient demonstrated:\n- Resilience (bouncing back, persisting)\n- Personal strength (courage, determination)\n- Agency (taking action, making choices)\n\nFor each moment, provide:\n1. **quote**: Exact quote from transcript (verbatim)\n2. **explanation**: Why this demonstrates strength (1-2 sentences)\n3. **visualMetaphor**: A concrete visual metaphor to represent this moment\n4. **timestamp**: If available in transcript\n\nContext:\n- Patient name: {{patientName}}\n- Session focus: {{sessionFocus}}\n\nSelected text:\n{{selectedText}}\n\nFull transcript context:\n{{fullTranscript}}\n\nReturn JSON following the defined schema.",

  "outputType": "json",
  "jsonSchema": {
    "type": "object",
    "properties": {
      "moments": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "quote": {
              "type": "string",
              "description": "Exact quote from transcript"
            },
            "explanation": {
              "type": "string",
              "description": "Why this shows strength"
            },
            "visualMetaphor": {
              "type": "string",
              "description": "Concrete visual to represent this"
            },
            "timestamp": {
              "type": "string",
              "description": "Timestamp if available"
            }
          },
          "required": ["quote", "explanation", "visualMetaphor"]
        }
      }
    }
  },

  "scope": "system",
  "organizationId": null,
  "createdBy": "super-admin-uuid",
  "isActive": true,
  "useCount": 89,
  "createdAt": "2025-01-10T09:00:00Z",
  "updatedAt": "2025-11-01T12:00:00Z"
}
```

### Complete Reflection Template JSON

```json
{
  "id": "refl-tmpl-uuid-1",
  "title": "Resilience Discovery Questions",
  "description": "Use after resilience-focused sessions to help patients identify and reflect on their personal strengths. Questions focus on meaning-making, emotional awareness, and self-recognition of growth. Best for narrative therapy approaches.",
  "category": "narrative",

  "questions": [
    {
      "text": "What part of this story shows your strength?",
      "type": "open_text",
      "required": true,
      "placeholder": "Reflect on moments that resonated with you...",
      "helperText": "There are no wrong answers. Share what feels true for you.",
      "maxLength": 1000
    },
    {
      "text": "How does this connect to your journey?",
      "type": "open_text",
      "required": false,
      "placeholder": "Think about how this relates to your experiences...",
      "maxLength": 800
    },
    {
      "text": "What emotions did you feel while watching?",
      "type": "emotion",
      "required": true,
      "multiSelect": true,
      "emotionSet": "therapeutic",
      "allowOther": true
    },
    {
      "text": "What themes resonated most with you?",
      "type": "multiple_choice",
      "required": true,
      "multiSelect": true,
      "options": [
        { "label": "Resilience", "value": "resilience" },
        { "label": "Connection", "value": "connection" },
        { "label": "Growth", "value": "growth" },
        { "label": "Hope", "value": "hope" },
        { "label": "Courage", "value": "courage" }
      ]
    }
  ],

  "scope": "system",
  "organizationId": null,
  "createdBy": "super-admin-uuid",

  "status": "active",
  "approvedBy": null,
  "approvedAt": null,
  "rejectionReason": null,

  "useCount": 156,
  "metadata": {
    "therapeuticApproach": "narrative_therapy",
    "recommendedDuration": "10-15 minutes",
    "clinicalEvidence": "Based on White & Epston (1990) narrative therapy framework"
  },

  "createdAt": "2025-01-05T08:00:00Z",
  "updatedAt": "2025-10-20T11:00:00Z"
}
```

### Complete Survey Template JSON

```json
{
  "id": "surv-tmpl-uuid-1",
  "title": "Session Impact Survey",
  "description": "Brief outcome measure to track immediate post-session impact. Measures mood, hopefulness, story resonance, and emotional state. Use after every Story Page to track patient progress over time.",
  "category": "outcome",

  "questions": [
    {
      "text": "How would you rate your mood right now?",
      "type": "scale",
      "required": true,
      "min": 1,
      "max": 10,
      "step": 1,
      "minLabel": "Very low",
      "maxLabel": "Very high",
      "display": "slider"
    },
    {
      "text": "How hopeful do you feel about your future?",
      "type": "scale",
      "required": true,
      "min": 1,
      "max": 10,
      "step": 1,
      "minLabel": "Not at all hopeful",
      "maxLabel": "Very hopeful",
      "display": "buttons"
    },
    {
      "text": "Did this story help you see your situation differently?",
      "type": "multiple_choice",
      "required": true,
      "multiSelect": false,
      "options": [
        { "label": "Yes, significantly", "value": "yes_significantly" },
        { "label": "Yes, somewhat", "value": "yes_somewhat" },
        { "label": "No, not really", "value": "no" },
        { "label": "I'm not sure", "value": "unsure" }
      ]
    },
    {
      "text": "What emotions are you feeling right now?",
      "type": "emotion",
      "required": true,
      "multiSelect": true,
      "emotionSet": "therapeutic",
      "allowOther": true
    },
    {
      "text": "Would you be comfortable sharing this story with someone you trust?",
      "type": "multiple_choice",
      "required": false,
      "multiSelect": false,
      "options": [
        { "label": "Yes", "value": "yes" },
        { "label": "Maybe", "value": "maybe" },
        { "label": "No", "value": "no" },
        { "label": "I'm not sure", "value": "unsure" }
      ]
    }
  ],

  "scope": "system",
  "organizationId": null,
  "createdBy": "super-admin-uuid",

  "status": "active",
  "approvedBy": null,
  "approvedAt": null,
  "rejectionReason": null,

  "useCount": 203,
  "metadata": {
    "measureType": "outcome_tracking",
    "validatedScale": false,
    "recommendedFrequency": "every_story_page",
    "dataAggregation": "trend_analysis"
  },

  "createdAt": "2025-01-05T08:30:00Z",
  "updatedAt": "2025-11-10T09:00:00Z"
}
```

### Module-Prompt Links (Junction Table Data)

```json
[
  {
    "id": "link-uuid-1",
    "moduleId": "mod-uuid-1",
    "promptId": "prompt-uuid-1",
    "sortOrder": 1,
    "createdAt": "2025-01-15T10:05:00Z"
  },
  {
    "id": "link-uuid-2",
    "moduleId": "mod-uuid-1",
    "promptId": "prompt-uuid-2",
    "sortOrder": 2,
    "createdAt": "2025-01-15T10:06:00Z"
  },
  {
    "id": "link-uuid-3",
    "moduleId": "mod-uuid-1",
    "promptId": "prompt-uuid-3",
    "sortOrder": 3,
    "createdAt": "2025-01-15T10:07:00Z"
  }
]
```

---

## Part 6: Designer Implementation Guide

### Design System Specifications

#### Color Palette

**Module System Colors**:
```css
--module-system: #3B82F6;        /* Blue - System modules */
--module-organization: #8B5CF6;  /* Purple - Org modules */
--module-private: #10B981;       /* Green - Private modules */
```

**Prompt Category Colors**:
```css
--prompt-analysis: #3B82F6;      /* Blue */
--prompt-creative: #8B5CF6;      /* Purple */
--prompt-extraction: #10B981;    /* Green */
--prompt-reflection: #F59E0B;    /* Orange */
```

**Template Colors**:
```css
--template-reflection: #10B981;  /* Green */
--template-survey: #3B82F6;      /* Blue */
```

**Status Colors**:
```css
--status-active: #10B981;        /* Green */
--status-pending: #F59E0B;       /* Yellow/Orange */
--status-rejected: #EF4444;      /* Red */
--status-archived: #6B7280;      /* Gray */
```

#### Typography

```css
--font-base: 'Inter', sans-serif;
--font-size-base: 14px;
--font-size-h1: 24px;
--font-size-h2: 20px;
--font-size-h3: 16px;
--font-size-small: 12px;
```

#### Spacing

```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
```

#### Component Specs

**Card** (Modules, Prompts, Templates):
```css
border-radius: 12px;
padding: 16px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
hover: box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
```

**Badge**:
```css
border-radius: 4px;
padding: 2px 8px;
font-size: 12px;
font-weight: 500;
```

**Modal**:
```css
max-width: 800px;
border-radius: 12px;
padding: 24px;
backdrop: rgba(0, 0, 0, 0.5);
```

### Icon Specifications

**Module Icons** (20x20px):
- 🎯 Target (self_strength)
- 🤝 Handshake (relationships_repair)
- 🦋 Butterfly (identity_transformation)
- 🌟 Star (purpose_future)

**Prompt Icons** (20x20px):
- 🎯 Target (analysis)
- ✨ Sparkles (creative)
- 📝 Clipboard (extraction)
- 💭 Thought bubble (reflection)

**Template Icons** (20x20px):
- 📋 Clipboard (reflection templates)
- 📊 Chart (survey templates)

### Layout Patterns

#### Grid View (Library Pages)
```
3-column grid on desktop (1fr 1fr 1fr)
2-column grid on tablet (1fr 1fr)
1-column grid on mobile (1fr)
Gap: 16px
```

#### Detail Modal Layout
```
┌─────────────────────────────────────┐
│ Header (Icon + Title + Close)       │
├─────────────────────────────────────┤
│ Tabs (if applicable)                │
├─────────────────────────────────────┤
│ Content Area (scrollable)           │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ Footer (Actions)                    │
└─────────────────────────────────────┘
```

### Interaction Patterns

**Filtering**:
- Tabs for primary categories (horizontal)
- Chips/badges for secondary filters
- Search bar (debounced, 300ms)
- Clear all filters button

**Multi-Select** (TemplateSelector, PromptSelector):
- Checkboxes for selection
- "Selected: N items" counter at top
- Selected items shown in separate area (removable)
- Preview expansion on hover or click

**Question Builder**:
- Drag handles for reordering (6-dot icon)
- Type selector dropdown (changes available fields)
- Delete button (with confirmation)
- Add question button at bottom

### Accessibility Guidelines

- All interactive elements keyboard accessible
- Focus states visible (2px outline, primary color)
- ARIA labels on icon-only buttons
- Screen reader announcements for async actions
- Color contrast ratio minimum 4.5:1
- Form validation with clear error messages

### Responsive Breakpoints

```css
--breakpoint-mobile: 640px;
--breakpoint-tablet: 768px;
--breakpoint-desktop: 1024px;
--breakpoint-wide: 1280px;
```

### Animation Timing

```css
--transition-fast: 150ms;
--transition-base: 200ms;
--transition-slow: 300ms;
--easing: cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Glossary

**Term** | **Definition**
---------|---------------
**Module** | Complete therapeutic framework combining AI prompts, reflection templates, and survey templates
**Prompt (Library)** | Reusable AI instruction stored in library, linkable to multiple modules
**Prompt (Inline)** | Core AI analysis text stored directly on module (required)
**Template** | Pre-built question set (reflection or survey) that gets cloned into Story Pages
**Reflection** | Qualitative, open-ended patient questions
**Survey** | Quantitative, structured patient questions
**Scope** | Access level: system (all orgs), organization (one org), private (one user)
**Domain** | Therapeutic area: self_strength, relationships_repair, identity_transformation, purpose_future
**Cloning** | Copying template questions into Story Page (not referencing)
**Junction Table** | `module_prompt_links` - connects modules to library prompts (many-to-many)
**Story Page** | Patient-facing webpage with media and questions
**Page Block** | Section of Story Page (video, image, questions, etc.)

---

## File Locations Reference

```
Database Schemas:
  /src/models/Schema.ts (lines 528-736)

API Routes:
  /src/app/api/modules/route.ts
  /src/app/api/prompts/route.ts
  /src/app/api/templates/reflections/route.ts
  /src/app/api/templates/surveys/route.ts

Components:
  /src/components/modules/ModuleLibrary.tsx
  /src/components/modules/ModuleEditor.tsx
  /src/components/prompts/PromptLibrary.tsx
  /src/components/prompts/PromptSelector.tsx
  /src/components/templates/TemplateSelector.tsx
  /src/components/templates/TemplateEditor.tsx

Services:
  /src/services/ModuleService.ts
  /src/services/TemplateService.ts

Validations:
  /src/validations/ModuleValidation.ts
  /src/validations/TemplateValidation.ts

Documentation:
  /MODULES_SYSTEM.md (existing)
  /PROMPT_LIBRARY.md (existing)
  /MODULES_PROMPTS_TEMPLATES_GUIDE.md (this file)
```

---

## Questions for Designer

Before creating mock files, please clarify:

1. **Visual Hierarchy**: Which view should be prioritized in initial mocks?
   - [ ] Module Library (therapist browsing modules)
   - [ ] Module Editor (creating/editing module)
   - [ ] Template Library (browsing templates)
   - [ ] Prompt Library (browsing prompts)

2. **User Flows**: Which workflow needs most detail?
   - [ ] Creating a new module from scratch
   - [ ] Linking prompts/templates to existing module
   - [ ] Browsing and filtering libraries
   - [ ] Patient viewing Story Page with questions

3. **Responsive Priority**: Primary device targets?
   - [ ] Desktop-first (therapist workflow)
   - [ ] Mobile-first (patient Story Pages)
   - [ ] Both equally

4. **Component Depth**: How detailed should component mocks be?
   - [ ] High-level layouts only
   - [ ] Detailed component states (hover, focus, error)
   - [ ] Full interaction flows

---

**End of Guide**

This document provides a complete architectural overview of Modules, Prompts, and Templates in StoryCare. Use it as a reference for designing UI components, understanding data relationships, and implementing features.

For questions or clarifications, refer to the existing codebase documentation:
- `/MODULES_SYSTEM.md` - Module system details
- `/PROMPT_LIBRARY.md` - Prompt library details
- `/CLAUDE.md` - Full project architecture guide
- `/PRD.md` - Product requirements and specifications