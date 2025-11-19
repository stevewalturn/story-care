# Treatment Modules System - Fine-Grained Access Control

## Overview

The Treatment Modules system provides a hierarchical, scope-based access control model that allows different organizational levels to create, manage, and share therapeutic modules. This ensures standardization at scale while maintaining flexibility for individual practitioners.

---

## Access Control Hierarchy

### 1. Super Admin (System Level)
**Scope**: `system`
**Access Level**: Full control over system-wide module templates

#### Permissions
- ✅ Create system-wide module templates
- ✅ Edit all system module templates
- ✅ Delete system module templates
- ✅ View all modules (system, organization, private)
- ✅ Set default modules for new organizations
- ✅ Archive/deprecate outdated system modules
- ✅ Publish module updates to all users

#### Use Cases
- Create evidence-based therapeutic frameworks (e.g., "Self-Resilience & Re-Authoring")
- Standardize best practices across all organizations
- Provide starter templates for new organizations
- Maintain clinical quality standards

#### System Module Characteristics
- **Visibility**: Visible to all users across all organizations
- **Editability**: Read-only for organization admins and therapists
- **Clonability**: Can be cloned to organization or private scope for customization
- **Updates**: When updated, changes propagate to all users (non-breaking)

---

### 2. Organization Admin (Organization Level)
**Scope**: `organization`
**Access Level**: Full control over organization-specific modules

#### Permissions
- ✅ Create organization-wide modules
- ✅ Edit organization modules (created by their org)
- ✅ Delete organization modules (created by their org)
- ✅ View system modules (read-only)
- ✅ View all organization modules (read-write)
- ✅ View private modules created by therapists in their org (read-only)
- ✅ Clone system modules to organization scope
- ✅ Set recommended modules for their organization
- ❌ Edit system modules
- ❌ Edit private modules created by therapists

#### Use Cases
- Customize system templates for organization-specific needs
- Create organization-specific therapeutic approaches
- Standardize protocols within their organization
- Share best practices among their therapist team
- Ensure compliance with organization policies

#### Organization Module Characteristics
- **Visibility**: Visible only to users within the same organization
- **Editability**: Editable by organization admins, read-only for therapists
- **Clonability**: Can be cloned by therapists to private scope
- **Sharing**: Automatically available to all therapists in the organization

---

### 3. Therapist (Individual Level)
**Scope**: `private`
**Access Level**: Full control over personal modules

#### Permissions
- ✅ Create private modules (personal use)
- ✅ Edit private modules (created by them)
- ✅ Delete private modules (created by them)
- ✅ View system modules (read-only)
- ✅ View organization modules (read-only)
- ✅ View own private modules (read-write)
- ✅ Clone system or organization modules to private scope
- ❌ Edit system modules
- ❌ Edit organization modules
- ❌ View other therapists' private modules

#### Use Cases
- Customize modules for specific patient populations
- Experiment with new therapeutic approaches
- Tailor modules to personal therapeutic style
- Create specialized modules for edge cases
- Develop modules before sharing with organization

#### Private Module Characteristics
- **Visibility**: Visible only to the creator
- **Editability**: Full edit access by creator only
- **Clonability**: Cannot be shared (unless promoted to org/system level)
- **Isolation**: No impact on other users

---

## Module Structure (4 Core Components)

Every module contains exactly 4 components:

### 1. AI Prompts (Dynamic Analysis)
- **Purpose**: Context-aware analysis and content generation
- **Storage**: Linked via `module_prompt_links` junction table
- **Access**: Selected from Prompt Library (scope-based)
- **Features**:
  - Multiple prompts per module
  - Reorderable (sortOrder)
  - Categories: analysis, creative, extraction, reflection
  - Used in "Analyze Selection" feature on transcripts

**Example**:
- "Self-Resilience & Re-Authoring Analysis"
- "Create A Scene"
- "Extract Meaningful Quotes"

### 2. Reflection Questions (Qualitative Data)
- **Purpose**: Post-session patient self-reflection in Story Pages
- **Storage**: `treatment_modules.reflectionTemplateId` → `reflection_templates` table
- **Format**: Template with reusable question sets
- **Question Types**:
  - `open_text`: Free-form text responses
  - `multiple_choice`: Select from predefined options
  - `scale`: Numeric rating scale
  - `emotion`: Select from emotion list

**How It Works in Story Pages**:
1. Module references a reflection template via `reflectionTemplateId`
2. When therapist generates a Story Page from module:
   - Questions are **cloned** from template into `reflection_questions` table
   - Each question is linked to a page block (`blockType='reflection'`)
   - Patient sees questions on their personalized Story Page
   - Patient submits answers → stored in `reflection_responses` table
3. Therapist can view patient's qualitative responses in dashboard

**Example Template**:
```json
{
  "templateId": "uuid",
  "name": "Self-Resilience Reflections",
  "questions": [
    {
      "text": "What in this image or scene shows the part of you that refuses to quit?",
      "type": "open_text",
      "required": true,
      "sequenceNumber": 1
    },
    {
      "text": "When you look at this moment in your story, what do you notice about your strength?",
      "type": "open_text",
      "required": true,
      "sequenceNumber": 2
    }
  ]
}
```

**Patient Experience**:
- Receives email: "Your therapist created a new story page"
- Views Story Page with videos, images, quotes
- Scrolls to reflection section
- Answers open-ended questions in textareas
- Clicks "Submit Reflections"

---

### 3. Surveys (Quantitative Data)
- **Purpose**: Structured feedback and outcome measurement in Story Pages
- **Storage**: `treatment_modules.surveyTemplateId` → `survey_templates` table
- **Format**: Template with reusable survey instruments
- **Question Types**:
  - `open_text`: Text feedback
  - `multiple_choice`: Select one option
  - `scale`: Numeric slider (e.g., 1-10)
  - `yes_no`: Binary choice
  - `emotion`: Select primary emotion

**How It Works in Story Pages**:
1. Module references a survey template via `surveyTemplateId`
2. When therapist generates a Story Page from module:
   - Questions are **cloned** from template into `survey_questions` table
   - Each question is linked to a page block (`blockType='survey'`)
   - Includes scale settings (min, max, labels) and options
   - Patient sees survey on their personalized Story Page
   - Patient submits answers → stored in `survey_responses` table
3. Therapist can view quantitative data, analytics, and trends in dashboard

**Example Template**:
```json
{
  "templateId": "uuid",
  "name": "Resonance & Impact Survey",
  "questions": [
    {
      "text": "How much did this story resonate with you?",
      "type": "scale",
      "scaleMin": 1,
      "scaleMax": 10,
      "scaleMinLabel": "Not at all",
      "scaleMaxLabel": "Deeply resonated",
      "required": true,
      "sequenceNumber": 1
    },
    {
      "text": "What emotion did you feel most strongly?",
      "type": "emotion",
      "options": ["Hope", "Sadness", "Anger", "Peace", "Confusion", "Joy"],
      "required": true,
      "sequenceNumber": 2
    },
    {
      "text": "Would you like to explore this theme further in our next session?",
      "type": "yes_no",
      "required": false,
      "sequenceNumber": 3
    }
  ]
}
```

**Patient Experience**:
- Views Story Page content (videos, images, reflections)
- Scrolls to survey section
- Moves sliders for scale questions (1-10)
- Selects emotion from visual grid
- Clicks "Submit Survey"

**Analytics Benefits**:
- Track patient progress over time (pre/post comparisons)
- Measure therapeutic outcomes quantitatively
- Identify patterns across patient cohorts
- Generate reports for clinical supervision

### 4. Theming & Context (Module Metadata)
- **Purpose**: Define module's therapeutic approach and AI context
- **Storage**:
  - `treatment_modules.aiPromptText` - Main therapeutic framework
  - `treatment_modules.aiPromptMetadata` - Structured context (JSONB)
  - `treatment_modules.domain` - Therapeutic domain enum
- **Features**:
  - Therapeutic domain (self_strength, relationships_repair, identity_transformation, purpose_future)
  - Core narrative approach
  - Session guidelines
  - Clinical rationale

**Example**:
```json
{
  "domain": "self_strength",
  "aiPromptText": "Read the transcript. Locate passages about struggle, adversity, and survival. Extract moments where the person demonstrated resilience...",
  "aiPromptMetadata": {
    "focus_areas": ["resilience", "agency", "strength"],
    "narrative_lens": "externalizing problems, internalizing strengths"
  }
}
```

---

## Module-to-Story-Page Integration

### Complete Workflow: From Module Creation to Patient Response

This section explains the end-to-end flow of how modules, with their surveys and reflection questions, are used to create Story Pages for patients.

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. MODULE CREATION (Therapist/Admin)                            │
├─────────────────────────────────────────────────────────────────┤
│ Create/Select Module:                                           │
│ ├─ AI Prompts: Link prompts from Prompt Library                │
│ ├─ Reflection Template: Select/create reflection questions      │
│ ├─ Survey Template: Select/create survey questions              │
│ └─ Theming & Context: Define therapeutic framework              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. SESSION UPLOAD & ANALYSIS (Therapist)                        │
├─────────────────────────────────────────────────────────────────┤
│ Upload Session:                                                  │
│ ├─ Upload audio file from therapy session                       │
│ ├─ Assign Module to session                                     │
│ ├─ AI transcribes with Deepgram (speaker diarization)          │
│ └─ AI analyzes transcript using module's AI prompts             │
│                                                                  │
│ AI Analysis Result (stored in session_modules.aiAnalysisResult):│
│ ├─ thematicSummary: "This session revealed patterns of..."      │
│ ├─ patientQuotes: ["I finally felt heard", "It was hard but..."]│
│ ├─ clinicalInsights: ["Patient demonstrates resilience..."]     │
│ ├─ suggestedMedia: [Image descriptions, scene concepts]         │
│ └─ therapeuticMoments: [Timestamps of key breakthrough moments] │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. STORY PAGE GENERATION (Therapist)                            │
├─────────────────────────────────────────────────────────────────┤
│ Therapist clicks "Generate Story Page from Module":             │
│                                                                  │
│ Auto-Generated Story Page Structure:                            │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Title: "Your Journey of Resilience"                       │  │
│ │                                                            │  │
│ │ [Text Block] - AI-generated intro from thematicSummary    │  │
│ │ [Image Block] - Generated image from session analysis     │  │
│ │ [Quote Block] - "I finally felt heard" (from session)     │  │
│ │ [Video Block] - Therapeutic scene created from transcript │  │
│ │ [Text Block] - AI-generated closing from clinicalInsights │  │
│ │                                                            │  │
│ │ [Reflection Block] ← CLONED FROM MODULE'S TEMPLATE         │  │
│ │   • Question 1: "What in this story shows your strength?" │  │
│ │   • Question 2: "How does this change your narrative?"    │  │
│ │                                                            │  │
│ │ [Survey Block] ← CLONED FROM MODULE'S TEMPLATE             │  │
│ │   • Scale: "How much did this resonate?" (1-10)           │  │
│ │   • Emotion: "What did you feel most strongly?"           │  │
│ │   • Yes/No: "Explore this further in next session?"       │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│ Therapist can:                                                   │
│ ├─ Edit any block (add, remove, reorder)                       │
│ ├─ Customize cloned questions                                  │
│ ├─ Add additional media or quotes                              │
│ ├─ Preview patient view                                        │
│ └─ Publish → sends email notification to patient               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. PATIENT INTERACTION (Patient)                                │
├─────────────────────────────────────────────────────────────────┤
│ Patient receives email: "Your therapist created a story page"   │
│ Clicks link → Views Story Page:                                 │
│                                                                  │
│ Patient Experience:                                              │
│ ├─ Reads AI-generated narrative about their journey            │
│ ├─ Views personalized images and videos                        │
│ ├─ Sees their own quotes highlighted                           │
│ ├─ Watches therapeutic scene (visual metaphor)                 │
│ ├─ Answers Reflection Questions:                               │
│ │   • Types open-text responses in textareas                   │
│ │   • Shares deep thoughts about their narrative               │
│ │   • Clicks "Submit Reflections"                              │
│ └─ Completes Survey:                                            │
│     • Moves sliders (scale questions)                           │
│     • Selects emotion from grid                                 │
│     • Answers yes/no questions                                  │
│     • Clicks "Submit Survey"                                    │
│                                                                  │
│ Data Stored:                                                     │
│ ├─ reflection_responses: { patientId, questionId, responseText }│
│ └─ survey_responses: { patientId, questionId, responseValue }   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. THERAPIST DASHBOARD (Therapist)                              │
├─────────────────────────────────────────────────────────────────┤
│ View Patient Engagement:                                         │
│ ├─ Reflection Responses (Qualitative):                          │
│ │   • Read patient's narrative reflections                      │
│ │   • Identify themes and insights                              │
│ │   • Prepare for next session                                  │
│ └─ Survey Results (Quantitative):                               │
│     • View resonance scores (8/10 average)                      │
│     • Track emotional trends over time                          │
│     • Generate progress reports                                 │
│     • Compare pre/post module outcomes                          │
└─────────────────────────────────────────────────────────────────┘
```

### Key Benefits of Template System

**Why Templates?**
1. **Reusability**: One reflection/survey template can be used in multiple modules
2. **Consistency**: Standardized questions across similar therapeutic approaches
3. **Customization**: Questions are cloned, so each Story Page can be edited independently
4. **Data Integrity**: If template changes, existing Story Pages remain unchanged
5. **Analytics**: Compare outcomes across modules using the same templates

**Example Use Case**:
- **Reflection Template**: "Resilience Reflections" (4 questions)
  - Used in: "Self-Resilience Module", "Veterans PTSD Module", "Grief Processing Module"
- **Survey Template**: "Emotional Impact Survey" (5 questions)
  - Used in: All modules across organization for consistent outcome measurement

---

## Workflow Examples

### Example 1: Creating a System Module (Super Admin)

**Scenario**: Super admin wants to create a new evidence-based module for all organizations.

**Steps**:
1. Navigate to `/super-admin/module-templates`
2. Click "Create System Module"
3. Fill in basic info:
   - Name: "Relational Repair & Forgiveness"
   - Domain: "Relationships & Repair"
   - Description: "Help people heal broken relationships..."
4. Add AI Prompts from Prompt Library (system-level prompts)
5. Add Reflection Questions:
   - "Who do you want to become in this relationship?"
   - "What would forgiveness look like for you?"
6. Link Survey Template: "Relational Health Survey"
7. Add Theming & Context:
   - Core prompt about identifying relational wounds and paths forward
   - Metadata about forgiveness models
8. Save as System Module (`scope='system'`)

**Result**: Module appears in "System Templates" section for all users across all organizations.

---

### Example 2: Customizing for Organization (Org Admin)

**Scenario**: Organization admin wants to adapt the "Relational Repair" module for their trauma-informed approach.

**Steps**:
1. Navigate to `/org-admin/modules`
2. View "System Templates" section
3. Find "Relational Repair & Forgiveness"
4. Click "Clone to Organization"
5. Modify:
   - Rename: "Trauma-Informed Relational Repair"
   - Add org-specific AI prompts from their Prompt Library
   - Add additional reflection questions about safety and boundaries
   - Link to org-specific survey with trauma indicators
   - Update theming to emphasize somatic safety
6. Save as Organization Module (`scope='organization'`)

**Result**:
- Module appears in "Organization Modules" for all therapists in that org
- Original system module remains unchanged
- Therapists can use either version

---

### Example 3: Personalizing for Patient (Therapist)

**Scenario**: Therapist working with a patient who experienced childhood trauma and needs specialized questions.

**Steps**:
1. Navigate to `/therapist/modules`
2. Find organization module "Trauma-Informed Relational Repair"
3. Click "Clone to Private"
4. Customize:
   - Rename: "Childhood Trauma - Sarah's Journey"
   - Add private AI prompts for inner child work
   - Modify reflection questions to be age-appropriate
   - Remove triggering survey questions
   - Add specific context about patient's story
5. Save as Private Module (`scope='private'`)
6. Assign to specific patient's sessions

**Result**:
- Module visible only to this therapist
- Highly personalized for specific patient
- No impact on other users
- Can be updated as therapy progresses

---

## Database Schema

### `treatment_modules` Table

```typescript
{
  id: uuid (PK),
  name: varchar(255),
  domain: therapeutic_domain enum,  // self_strength, relationships_repair, identity_transformation, purpose_future
  description: text,
  scope: template_scope enum,        // system, organization, private
  organizationId: uuid (FK) nullable, // null for system, set for org/private
  createdBy: uuid (FK),               // user who created

  // Component 1: AI Prompts (via junction table)
  // (linked through module_prompt_links)

  // Component 2: Reflection Questions (Qualitative)
  reflectionQuestions: jsonb,         // [{ text, type, required }]
  reflectionTemplateId: uuid (FK),    // optional link to template

  // Component 3: Surveys (Quantitative)
  surveyTemplateId: uuid (FK),        // link to survey template

  // Component 4: Theming & Context
  aiPromptText: text,                 // main therapeutic framework
  aiPromptMetadata: jsonb,            // structured context

  // Metadata
  useCount: integer,
  status: module_status enum,         // active, archived, draft
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Junction Table: `module_prompt_links`

```typescript
{
  id: uuid (PK),
  moduleId: uuid (FK) → treatment_modules,
  promptId: uuid (FK) → module_ai_prompts,
  sortOrder: integer,
  createdAt: timestamp
}
```

---

## API Endpoints

### Super Admin APIs
- `GET /api/super-admin/module-templates` - List all system modules
- `POST /api/super-admin/module-templates` - Create system module
- `PATCH /api/super-admin/module-templates/[id]` - Edit any module
- `DELETE /api/super-admin/module-templates/[id]` - Delete any module
- `POST /api/super-admin/module-templates/[id]/publish` - Publish updates

### Organization Admin APIs
- `GET /api/org-admin/modules` - List system + org modules
- `POST /api/org-admin/modules` - Create org module
- `PATCH /api/org-admin/modules/[id]` - Edit org module
- `DELETE /api/org-admin/modules/[id]` - Delete org module
- `POST /api/org-admin/modules/[id]/clone` - Clone to org scope

### Therapist APIs
- `GET /api/therapist/modules` - List system + org + private modules
- `POST /api/therapist/modules` - Create private module
- `PATCH /api/therapist/modules/[id]` - Edit own private module
- `DELETE /api/therapist/modules/[id]` - Delete own private module
- `POST /api/therapist/modules/[id]/clone` - Clone to private scope

---

## UI Access Patterns

### Super Admin View (`/super-admin/module-templates`)

**Tab-Based Layout**:

```
┌─────────────────────────────────────────────────────────────┐
│ System Module Templates                       [+ Create New] │
├─────────────────────────────────────────────────────────────┤
│ [All] [Self & Strength] [Relationships] [Identity] [Purpose] │ ← Tabs by Domain
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Showing: All Domains (12 modules)                           │
│                                                               │
│ 💪 Self & Strength (3)                                       │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Self-Resilience & Re-Authoring                           ││
│ │ 4 prompts • 3 reflections • 2 surveys                    ││
│ │ Used in 45 sessions across 12 organizations              ││
│ │ [Edit] [Delete] [View Usage] [Duplicate]                ││
│ └──────────────────────────────────────────────────────────┘│
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Inner Strength Mapping                                    ││
│ │ 3 prompts • 4 reflections • 1 survey                     ││
│ │ Used in 23 sessions across 8 organizations               ││
│ │ [Edit] [Delete] [View Usage] [Duplicate]                ││
│ └──────────────────────────────────────────────────────────┘│
│                                                               │
│ ❤️ Relationships & Repair (4)                                │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Relational Healing & Integration                         ││
│ │ 5 prompts • 5 reflections • 2 surveys                    ││
│ │ [Edit] [Delete] [View Usage] [Duplicate]                ││
│ └──────────────────────────────────────────────────────────┘│
│                                                               │
│ 🎭 Identity & Transformation (3)                             │
│ 🎯 Purpose & Future (2)                                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Tab Filtering**:
- **All Tab**: Shows all modules across all domains (default)
- **Self & Strength Tab**: Only shows modules in `self_strength` domain
- **Relationships Tab**: Only shows `relationships_repair` domain
- **Identity Tab**: Only shows `identity_transformation` domain
- **Purpose Tab**: Only shows `purpose_future` domain

---

### Organization Admin View (`/org-admin/modules`)

**Tab-Based Layout**:

```
┌─────────────────────────────────────────────────────────────┐
│ Treatment Modules                             [+ Create New] │
├─────────────────────────────────────────────────────────────┤
│ [System Templates] [Organization Modules] [Therapist Usage]  │ ← Tabs by Scope
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 📚 System Templates (12) - Read Only                         │
│                                                               │
│ Filter by domain: [All ▼] [Self & Strength] [Relationships]... │
│                                                               │
│ 💪 Self & Strength (3)                                       │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Self-Resilience & Re-Authoring                     SYSTEM││
│ │ 4 prompts • 3 reflections • 2 surveys                    ││
│ │ [View Details] [Clone to Organization]                   ││
│ └──────────────────────────────────────────────────────────┘│
│                                                               │
│ ❤️ Relationships & Repair (4)                                │
│ 🎭 Identity & Transformation (3)                             │
│ 🎯 Purpose & Future (2)                                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**When "Organization Modules" Tab is Selected**:

```
┌─────────────────────────────────────────────────────────────┐
│ Treatment Modules                             [+ Create New] │
├─────────────────────────────────────────────────────────────┤
│ [System Templates] [Organization Modules] [Therapist Usage]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 🏢 Our Organization Modules (5)                              │
│                                                               │
│ Filter by domain: [All ▼] [Self & Strength] [Relationships]... │
│                                                               │
│ 💪 Self & Strength (2)                                       │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Trauma-Informed Resilience                             ORG││
│ │ 5 prompts • 4 reflections • 3 surveys                    ││
│ │ Created by: Dr. Johnson • Used in 12 sessions            ││
│ │ [Edit] [Delete] [Assign to Therapists] [Duplicate]      ││
│ └──────────────────────────────────────────────────────────┘│
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Child-Centered Strength Work                           ORG││
│ │ 3 prompts • 3 reflections • 2 surveys                    ││
│ │ Created by: Dr. Martinez • Used in 8 sessions            ││
│ │ [Edit] [Delete] [Assign to Therapists] [Duplicate]      ││
│ └──────────────────────────────────────────────────────────┘│
│                                                               │
│ ❤️ Relationships & Repair (3)                                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**When "Therapist Usage" Tab is Selected**:

```
┌─────────────────────────────────────────────────────────────┐
│ Treatment Modules                                             │
├─────────────────────────────────────────────────────────────┤
│ [System Templates] [Organization Modules] [Therapist Usage]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 👥 Therapist Private Modules (View Only)                     │
│                                                               │
│ Search therapist: [___________] Sort by: [Activity ▼]        │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Dr. Sarah Smith                               3 modules   ││
│ │ ├─ Veterans PTSD - Specialized (Self & Strength)         ││
│ │ ├─ Grief Processing - Custom (Identity & Transformation) ││
│ │ └─ Relational Trauma - Adapted (Relationships & Repair)  ││
│ │ [View Details] [Request Promotion to Org]                ││
│ └──────────────────────────────────────────────────────────┘│
│ ┌──────────────────────────────────────────────────────────┐│
│ │ Dr. Michael Jones                             7 modules   ││
│ │ ├─ Child Anxiety - Play Therapy (Self & Strength)        ││
│ │ ├─ Teen Identity Work (Identity & Transformation)        ││
│ │ └─ ... and 5 more                                        ││
│ │ [View Details] [Request Promotion to Org]                ││
│ └──────────────────────────────────────────────────────────┘│
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Tab Summary**:

| Tab | Content | Actions Available |
|-----|---------|------------------|
| **System Templates** | Read-only system modules from super admins | View, Clone to Org |
| **Organization Modules** | Editable org-wide modules | Create, Edit, Delete, Assign, Duplicate |
| **Therapist Usage** | View therapists' private modules (analytics) | View, Request Promotion |

### Therapist View (`/therapist/modules`)
```
📚 System Templates (12) - Read Only
└─ [View only, with [Clone to Private] button]

🏢 Organization Modules (5) - Read Only
└─ [View only, with [Clone to Private] button]

🔒 My Private Modules (8)
└─ Self & Strength (3)
   ├─ Sarah's Childhood Trauma Journey [Edit] [Delete] [Use]
   ├─ Veterans PTSD - Experimental [Edit] [Delete] [Use]
   └─ Grief & Loss - Personalized [Edit] [Delete] [Use]
└─ Custom Approaches (5)

[+ Create Private Module]
```

---

## Cloning & Inheritance

### How Cloning Works

When cloning a module from a higher scope to a lower scope:

1. **Full Copy**: All 4 components are duplicated
2. **Scope Change**: New module gets lower scope
3. **Ownership Transfer**: `createdBy` set to current user
4. **Independence**: Changes don't affect original
5. **Prompt Links**: Junction table entries duplicated with new module ID

### Clone Rules

| From Scope | To Scope | Who Can Clone | Result |
|------------|----------|---------------|---------|
| system | organization | Org Admin | New org-scoped module |
| system | private | Therapist | New private module |
| organization | private | Therapist | New private module |
| private | organization | Not Allowed | N/A |
| private | system | Not Allowed | N/A |

### Promotion Workflow (Future Feature)

Therapists can request promotion of private modules:
1. Therapist clicks "Request Promotion" on private module
2. Organization admin reviews request
3. If approved, module copied to `scope='organization'`
4. Original private module remains unchanged

---

## Best Practices

### For Super Admins
- Keep system modules broad and evidence-based
- Document clinical rationale in theming/context
- Use descriptive names and clear descriptions
- Link to peer-reviewed research when possible
- Limit system modules to proven frameworks

### For Organization Admins
- Clone before customizing (preserve original)
- Document org-specific adaptations
- Share module usage guidelines with therapists
- Review therapist feedback on modules
- Maintain consistency across org modules

### For Therapists
- Start with system/org modules before creating private ones
- Use private modules for experimentation
- Document personalization rationale
- Archive unused private modules
- Consider requesting promotion for successful private modules

---

## Security & Compliance

### Row-Level Security (RLS)
- Queries automatically filter by scope + organizationId
- Users cannot access modules outside their scope
- API endpoints enforce role-based access control

### Audit Logging
- Track who created/edited/deleted modules
- Log scope changes and cloning operations
- Monitor usage statistics (useCount)
- Record patient assignments

### HIPAA Compliance
- No PHI stored in module definitions
- Patient-specific data stored separately in sessions/responses
- Audit trail for all module access
- Encryption at rest and in transit

---

## Module Lifecycle

### States
- **draft**: Work in progress, not visible to others
- **active**: Published and available for use
- **archived**: Hidden from default views, still usable in existing sessions

### Versioning (Future Feature)
- Track module changes over time
- Allow reverting to previous versions
- Show version history in module details
- Non-breaking updates for active modules

---

## Migration Notes

### Removing In-Session Questions
The previous `inSessionQuestions` field has been removed. Data migration options:

1. **Archive**: Export to JSON and store in separate table
2. **Convert**: Move to module notes/description field
3. **Delete**: Permanently remove (if approved)

**Recommended**: Archive for historical reference, provide export tool for therapists who want to preserve their questions.

---

**Last Updated**: 2025-11-19
**Version**: 2.0
**Related**: See `PROMPT_LIBRARY.md` for AI Prompt management
