# Modules Reflection/Survey Sets - Implementation Progress

**Date**: 2025-11-19
**Feature**: Module Question Sets (Reflections & Surveys)
**Status**: 🚧 IN PROGRESS

---

## ✅ Completed Tasks

### 1. Database Schema Updates
**File**: `src/models/Schema.ts`

Added two new boolean flags to `treatment_modules` table:
- `useReflectionTemplate` (default: false) - If true, use `reflectionTemplateId`; if false, use `reflectionQuestions` JSONB array
- `useSurveyTemplate` (default: false) - If true, use `surveyTemplateId`; if false, use custom survey questions

**Migration Created**: `migrations/0005_add_template_usage_flags_to_modules.sql`

### 2. TemplateQuestionEditor Component
**File**: `src/components/modules/TemplateQuestionEditor.tsx` ✅ CREATED

**Features**:
- Add/remove questions with drag-to-reorder
- Question types: open_text, multiple_choice, scale, emotion
- Multiple choice: Add/remove options
- Scale: Set min/max values and labels
- Visual question numbering
- Empty state with CTA
- Supports both reflection and survey templates

**Props**:
```typescript
{
  questions: TemplateQuestion[],
  onChange: (questions: TemplateQuestion[]) => void,
  templateType: 'reflection' | 'survey'
}
```

---

## 🚧 In Progress

### 3. ModuleEditor UI Updates
**File**: `src/components/modules/ModuleEditor.tsx`

**Current State**: Uses simple string array for `reflectionQuestions`

**Changes Needed**:

#### A. Add Toggle State
```typescript
const [useReflectionTemplate, setUseReflectionTemplate] = useState(false);
const [useSurveyTemplate, setUseSurveyTemplate] = useState(false);
```

#### B. Add Template State
```typescript
const [reflectionTemplate, setReflectionTemplate] = useState<{
  id?: string;
  title: string;
  description?: string;
  questions: TemplateQuestion[];
} | null>(null);

const [surveyTemplate, setSurveyTemplate] = useState<{
  id?: string;
  title: string;
  description?: string;
  questions: TemplateQuestion[];
} | null>(null);
```

#### C. Update Form Sections

**Reflection Section**:
```tsx
{/* Toggle Switch */}
<div className="flex items-center gap-2">
  <Switch
    checked={useReflectionTemplate}
    onChange={setUseReflectionTemplate}
  />
  <label>Use Template</label>
</div>

{useReflectionTemplate ? (
  <>
    {/* Template Title & Description */}
    <Input
      label="Template Title"
      value={reflectionTemplate?.title || ''}
      onChange={(e) => setReflectionTemplate({
        ...reflectionTemplate,
        title: e.target.value,
        questions: reflectionTemplate?.questions || []
      })}
    />

    {/* Template Question Editor */}
    <TemplateQuestionEditor
      questions={reflectionTemplate?.questions || []}
      onChange={(questions) => setReflectionTemplate({
        ...reflectionTemplate,
        title: reflectionTemplate?.title || '',
        questions
      })}
      templateType="reflection"
    />
  </>
) : (
  <>
    {/* Existing string array editor */}
    {reflectionQuestions.map((q, i) => ...)}
  </>
)}
```

**Survey Section** (similar pattern)

#### D. Update Submit Logic
```typescript
const payload = {
  name,
  domain,
  description,
  scope,

  // Reflection handling
  useReflectionTemplate,
  ...(useReflectionTemplate && reflectionTemplate
    ? {
        reflectionTemplateTitle: reflectionTemplate.title,
        reflectionTemplateDescription: reflectionTemplate.description,
        reflectionTemplateQuestions: reflectionTemplate.questions,
      }
    : {
        reflectionQuestions: filteredReflectionQuestions,
      }
  ),

  // Survey handling
  useSurveyTemplate,
  ...(useSurveyTemplate && surveyTemplate
    ? {
        surveyTemplateTitle: surveyTemplate.title,
        surveyTemplateDescription: surveyTemplate.description,
        surveyTemplateQuestions: surveyTemplate.questions,
      }
    : {}
  ),

  aiPromptText,
  aiPromptMetadata: {
    prompts: aiPrompts,
    surveyBundle,
  },
};
```

---

## 📋 Remaining Tasks

### 4. Template CRUD API Routes
**Files to Create**:
- `src/app/api/templates/reflections/route.ts`
- `src/app/api/templates/reflections/[id]/route.ts`
- `src/app/api/templates/surveys/route.ts`
- `src/app/api/templates/surveys/[id]/route.ts`

**Endpoints**:
- `POST /api/templates/reflections` - Create reflection template
- `GET /api/templates/reflections` - List templates
- `PUT /api/templates/reflections/[id]` - Update template
- `DELETE /api/templates/reflections/[id]` - Delete template (same for surveys)

### 5. Update Module API Routes
**Files to Modify**:
- `src/app/api/org-admin/modules/route.ts`
- `src/app/api/org-admin/modules/[id]/route.ts`
- `src/app/api/therapist/modules/route.ts`
- `src/app/api/therapist/modules/[id]/route.ts`

**Changes**:
1. Accept `useReflectionTemplate` and `useSurveyTemplate` flags
2. If using template + no existing `templateId`:
   - Create new template via template service
   - Get returned template ID
   - Store in module's `reflectionTemplateId` or `surveyTemplateId`
3. If NOT using template:
   - Store in `reflectionQuestions` JSONB array (existing behavior)

### 6. Validation Schemas
**File to Create**: `src/validations/TemplateValidation.ts`

```typescript
export const questionSchema = z.object({
  id: z.string(),
  questionText: z.string().min(1, 'Question text is required'),
  questionType: z.enum(['open_text', 'multiple_choice', 'scale', 'emotion']),
  options: z.array(z.string()).optional(),
  scaleMin: z.number().optional(),
  scaleMax: z.number().optional(),
  scaleMinLabel: z.string().optional(),
  scaleMaxLabel: z.string().optional(),
});

export const reflectionTemplateSchema = z.object({
  title: z.string().min(1, 'Template title is required'),
  description: z.string().optional(),
  questions: z.array(questionSchema).min(1, 'At least one question required'),
  scope: z.enum(['private', 'organization', 'system']).default('private'),
});
```

**File to Update**: `src/validations/ModuleValidation.ts`

Add fields for template usage:
```typescript
export const moduleSchema = z.object({
  // ... existing fields ...
  useReflectionTemplate: z.boolean().default(false),
  reflectionTemplateTitle: z.string().optional(),
  reflectionTemplateDescription: z.string().optional(),
  reflectionTemplateQuestions: z.array(questionSchema).optional(),
  reflectionTemplateId: z.string().uuid().optional(),

  useSurveyTemplate: z.boolean().default(false),
  surveyTemplateTitle: z.string().optional(),
  surveyTemplateDescription: z.string().optional(),
  surveyTemplateQuestions: z.array(questionSchema).optional(),
  surveyTemplateId: z.string().uuid().optional(),
});
```

### 7. Module Service
**File to Create/Update**: `src/services/ModuleService.ts`

**New Function**:
```typescript
export async function createModuleWithTemplates(data: any, userId: string) {
  // If useReflectionTemplate is true and template data provided
  if (data.useReflectionTemplate && data.reflectionTemplateQuestions) {
    // Create reflection template
    const reflectionTemplate = await createReflectionTemplate({
      title: data.reflectionTemplateTitle,
      description: data.reflectionTemplateDescription,
      questions: data.reflectionTemplateQuestions,
      scope: data.scope || 'private',
      createdBy: userId,
    });

    data.reflectionTemplateId = reflectionTemplate.id;
  }

  // Similar for survey templates
  if (data.useSurveyTemplate && data.surveyTemplateQuestions) {
    const surveyTemplate = await createSurveyTemplate({
      title: data.surveyTemplateTitle,
      description: data.surveyTemplateDescription,
      questions: data.surveyTemplateQuestions,
      scope: data.scope || 'private',
      createdBy: userId,
    });

    data.surveyTemplateId = surveyTemplate.id;
  }

  // Create module with template IDs
  return await createModule(data);
}
```

### 8. Page Generation Logic
**File to Update**: `/src/app/api/modules/[id]/generate-story-page/route.ts` (or similar)

**Current**: Likely just creates page without adding question blocks

**Changes Needed**:
1. Fetch module details including templates
2. Check if `useReflectionTemplate` is true:
   - If yes: Fetch template questions via `reflectionTemplateId`
   - If no: Use `reflectionQuestions` array
3. For each question, create a page block:
   ```typescript
   const reflectionBlocks = questions.map((q, index) => ({
     blockType: 'reflection',
     sequenceNumber: baseSequence + index,
     settings: {
       questionText: q.questionText,
       questionType: q.questionType,
       options: q.options,
       scaleMin: q.scaleMin,
       scaleMax: q.scaleMax,
       scaleMinLabel: q.scaleMinLabel,
       scaleMaxLabel: q.scaleMaxLabel,
     }
   }));
   ```
4. Insert blocks into `page_blocks` table
5. Insert individual questions into `reflection_questions` or `survey_questions` tables

### 9. Update Seed File
**File**: `scripts/seed-modules.ts`

**Add Examples**:

```typescript
// Example: Module with custom reflection questions (no template)
{
  name: 'Self-Discovery Journey',
  domain: 'self_strength',
  useReflectionTemplate: false,
  reflectionQuestions: [
    'What moment from the session resonated most with you?',
    'What strengths did you discover or rediscover?'
  ]
}

// Example: Module with reflection template
{
  name: 'Resilience Rebuilding',
  domain: 'self_strength',
  useReflectionTemplate: true,
  reflectionTemplate: {
    title: 'Resilience Reflection Set',
    description: 'Questions to explore resilience and coping',
    questions: [
      {
        id: 'q1',
        questionText: 'What coping strategies did you use this week?',
        questionType: 'multiple_choice',
        options: ['Mindfulness', 'Exercise', 'Journaling', 'Social support', 'Other']
      },
      {
        id: 'q2',
        questionText: 'How resilient do you feel today?',
        questionType: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleMinLabel: 'Not resilient',
        scaleMaxLabel: 'Very resilient'
      }
    ]
  }
}
```

### 10. Testing Checklist

**End-to-End Flow**:
- [ ] Create module with custom reflection questions (toggle OFF)
- [ ] Create module with reflection template (toggle ON)
- [ ] Edit existing module and switch from custom to template
- [ ] Generate story page from module with template
- [ ] Verify all questions appear as page blocks
- [ ] Remove individual questions from page editor
- [ ] Save page and verify questions persist
- [ ] View patient-facing page
- [ ] Submit reflection responses

**API Testing**:
- [ ] POST /api/modules - creates module with template
- [ ] POST /api/templates/reflections - creates template
- [ ] GET /api/templates/reflections - lists templates
- [ ] PUT /api/modules/[id] - updates module template settings

---

## Implementation Strategy

**Recommended Order**:
1. ✅ Database schema (DONE)
2. ✅ TemplateQuestionEditor component (DONE)
3. ⏳ Template validation schemas (NEXT)
4. ⏳ Template CRUD API routes (NEXT)
5. ⏳ Update ModuleEditor UI (NEXT)
6. ⏳ Module service updates
7. ⏳ Update module API routes
8. ⏳ Page generation logic
9. ⏳ Seed file updates
10. ⏳ Testing

**Estimated Time**:
- Template APIs: 1 hour
- ModuleEditor UI: 1-2 hours
- Module service + API updates: 1 hour
- Page generation: 1 hour
- Seed updates + testing: 1 hour
- **Total**: 5-7 hours

---

## Notes & Decisions

**Why Hybrid Approach?**
- Flexibility: Some therapists want quick custom questions
- Reusability: Others want to build template libraries
- Both patterns are valuable

**Why Inline Creation?**
- User requested: No separate template page navigation
- Simpler UX: Create templates while editing modules
- Templates are auto-saved as 'private' scope

**Data Flow**:
```
Module Editor (UI)
  ↓
Template Questions (TemplateQuestionEditor)
  ↓
On Save → Create Template (if new)
  ↓
Store Template ID in Module
  ↓
On Page Generation → Fetch Template Questions
  ↓
Create Page Blocks for Each Question
  ↓
Patient Sees Questions on Story Page
```

**Database Relationships**:
```
treatment_modules
  ├─ reflectionTemplateId → reflection_templates.id
  ├─ surveyTemplateId → survey_templates.id
  ├─ useReflectionTemplate (boolean)
  └─ useSurveyTemplate (boolean)

story_pages
  └─ page_blocks (blockType='reflection' or 'survey')
      └─ reflection_questions / survey_questions
```

---

**Last Updated**: 2025-11-19
**Next Task**: Create template validation schemas
