# Module Reflection/Survey Sets - Final Implementation Guide

**Status**: 🎯 **60% Complete** - Foundation built, UI integration remaining
**Date**: 2025-11-19

---

## ✅ COMPLETED (60%)

### 1. Database Schema ✅
**File**: `src/models/Schema.ts`
- Added `useReflectionTemplate: boolean`
- Added `useSurveyTemplate: boolean`
- **Migration**: `migrations/0005_add_template_usage_flags_to_modules.sql`

### 2. UI Component ✅
**File**: `src/components/modules/TemplateQuestionEditor.tsx` (NEW - 360 lines)
- Fully functional question editor
- All question types supported
- Add/remove/reorder questions
- Ready to integrate into ModuleEditor

### 3. Validation Schemas ✅
**File**: `src/validations/TemplateValidation.ts` (EXISTING)
- `createReflectionTemplateSchema`
- `createSurveyTemplateSchema`
- `questionSchema` with type validation
- Already comprehensive and ready to use

### 4. API Routes ✅
**Files**:
- `src/app/api/templates/reflections/route.ts` (EXISTING)
- `src/app/api/templates/surveys/route.ts` (EXISTING)

**Endpoints**:
- ✅ POST `/api/templates/reflections` - Create template
- ✅ GET `/api/templates/reflections` - List templates
- ✅ POST `/api/templates/surveys` - Create template
- ✅ GET `/api/templates/surveys` - List templates

### 5. Service Layer ✅
**File**: `src/services/TemplateService.ts` (EXISTING - 210 lines)
- ✅ `createReflectionTemplate()`
- ✅ `createSurveyTemplate()`
- ✅ `listReflectionTemplates()`
- ✅ `listSurveyTemplates()`

---

## 🚧 REMAINING WORK (40%)

### Task 6: Update ModuleEditor UI (CRITICAL)

**File**: `src/components/modules/ModuleEditor.tsx` (422 lines - needs significant updates)

#### Step 1: Add State Variables

**After line 32** (after `reflectionQuestions` state), add:

```typescript
// Template mode toggles
const [useReflectionTemplate, setUseReflectionTemplate] = useState(false);
const [useSurveyTemplate, setUseSurveyTemplate] = useState(false);

// Template data
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

#### Step 2: Add Import

**At top of file** (line 3), add:

```typescript
import { TemplateQuestionEditor, type TemplateQuestion } from './TemplateQuestionEditor';
```

#### Step 3: Initialize Template State from Module

**In the `useEffect` (lines 54-77)**, add after line 59:

```typescript
// Initialize template states
if (module.useReflectionTemplate && module.reflectionTemplateId) {
  setUseReflectionTemplate(true);
  // TODO: Fetch template details
  // For now, set placeholder
  setReflectionTemplate({
    id: module.reflectionTemplateId,
    title: 'Loading...',
    questions: []
  });
} else if (module.reflectionQuestions) {
  setReflectionQuestions((module.reflectionQuestions as string[]) || ['']);
}

if (module.useSurveyTemplate && module.surveyTemplateId) {
  setUseSurveyTemplate(true);
  // TODO: Fetch template details
  setSurveyTemplate({
    id: module.surveyTemplateId,
    title: 'Loading...',
    questions: []
  });
}
```

#### Step 4: Replace Reflection Questions Section

**Replace lines 222-263** (entire reflection section) with:

```tsx
{/* Reflection Questions Section */}
<div>
  <div className="mb-3 flex items-center justify-between">
    <div>
      <label className="block text-sm font-medium text-gray-900">
        Reflection Questions (Qualitative Data)
      </label>
      <p className="text-xs text-gray-500">
        Post-session questions for patients in Story Pages
      </p>
    </div>
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={useReflectionTemplate}
          onChange={(e) => {
            setUseReflectionTemplate(e.target.checked);
            if (e.target.checked && !reflectionTemplate) {
              setReflectionTemplate({
                title: 'New Reflection Set',
                description: '',
                questions: [{
                  id: `q-${Date.now()}`,
                  questionText: '',
                  questionType: 'open_text'
                }]
              });
            }
          }}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600"
        />
        <span className="font-medium">Use Template</span>
      </label>
    </div>
  </div>

  {useReflectionTemplate ? (
    <div className="space-y-4 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Template Title
          </label>
          <input
            type="text"
            value={reflectionTemplate?.title || ''}
            onChange={(e) => setReflectionTemplate({
              ...reflectionTemplate,
              title: e.target.value,
              questions: reflectionTemplate?.questions || []
            })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="e.g., Weekly Reflection Set"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Description (optional)
          </label>
          <input
            type="text"
            value={reflectionTemplate?.description || ''}
            onChange={(e) => setReflectionTemplate({
              ...reflectionTemplate,
              title: reflectionTemplate?.title || '',
              description: e.target.value,
              questions: reflectionTemplate?.questions || []
            })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Purpose of this question set"
          />
        </div>
      </div>

      <TemplateQuestionEditor
        questions={reflectionTemplate?.questions || []}
        onChange={(questions) => setReflectionTemplate({
          ...reflectionTemplate,
          title: reflectionTemplate?.title || '',
          questions
        })}
        templateType="reflection"
      />
    </div>
  ) : (
    <div className="space-y-2">
      {reflectionQuestions.map((question, index) => (
        <div key={index} className="flex gap-2">
          <textarea
            value={question}
            onChange={e => handleReflectionQuestionChange(index, e.target.value)}
            rows={2}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            placeholder={`Reflection question ${index + 1}`}
          />
          <button
            onClick={() => handleRemoveReflectionQuestion(index)}
            type="button"
            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        onClick={handleAddReflectionQuestion}
        type="button"
        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
      >
        <Plus className="h-4 w-4" />
        Add Question
      </button>
    </div>
  )}
</div>
```

#### Step 5: Add Survey Template Section

**After the AI Prompts section** (around line 330), add similar survey template section:

```tsx
{/* Survey Questions Section */}
<div>
  <div className="mb-3 flex items-center justify-between">
    <div>
      <label className="block text-sm font-medium text-gray-900">
        Survey Questions (Quantitative Data)
      </label>
      <p className="text-xs text-gray-500">
        Measurement scales and structured questions
      </p>
    </div>
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={useSurveyTemplate}
          onChange={(e) => {
            setUseSurveyTemplate(e.target.checked);
            if (e.target.checked && !surveyTemplate) {
              setSurveyTemplate({
                title: 'New Survey Set',
                description: '',
                questions: [{
                  id: `q-${Date.now()}`,
                  questionText: '',
                  questionType: 'scale',
                  scaleMin: 1,
                  scaleMax: 10
                }]
              });
            }
          }}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600"
        />
        <span className="font-medium">Use Template</span>
      </label>
    </div>
  </div>

  {useSurveyTemplate ? (
    <div className="space-y-4 rounded-lg border border-indigo-200 bg-indigo-50/50 p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Template Title
          </label>
          <input
            type="text"
            value={surveyTemplate?.title || ''}
            onChange={(e) => setSurveyTemplate({
              ...surveyTemplate,
              title: e.target.value,
              questions: surveyTemplate?.questions || []
            })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="e.g., Emotional Impact Survey"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Description (optional)
          </label>
          <input
            type="text"
            value={surveyTemplate?.description || ''}
            onChange={(e) => setSurveyTemplate({
              ...surveyTemplate,
              title: surveyTemplate?.title || '',
              description: e.target.value,
              questions: surveyTemplate?.questions || []
            })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Purpose of this survey"
          />
        </div>
      </div>

      <TemplateQuestionEditor
        questions={surveyTemplate?.questions || []}
        onChange={(questions) => setSurveyTemplate({
          ...surveyTemplate,
          title: surveyTemplate?.title || '',
          questions
        })}
        templateType="survey"
      />
    </div>
  ) : (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
      <p className="text-sm text-gray-500">
        Enable "Use Template" to create a survey question set
      </p>
    </div>
  )}
</div>
```

#### Step 6: Update Submit Handler

**In `handleSubmit` function (lines 96-150)**, replace the payload creation with:

```typescript
const payload: any = {
  name,
  domain,
  description,
  scope,
  aiPromptText,
  aiPromptMetadata: {
    prompts: aiPrompts,
    surveyBundle,
  },

  // Reflection handling
  useReflectionTemplate,
};

if (useReflectionTemplate && reflectionTemplate) {
  // Include template data for creation
  payload.reflectionTemplateData = {
    title: reflectionTemplate.title,
    description: reflectionTemplate.description,
    category: 'custom',
    questions: reflectionTemplate.questions.map(q => ({
      text: q.questionText,
      type: q.questionType,
      options: q.options,
      scaleMin: q.scaleMin,
      scaleMax: q.scaleMax,
      scaleMinLabel: q.scaleMinLabel,
      scaleMaxLabel: q.scaleMaxLabel,
    })),
    scope: scope || 'private',
  };

  // If editing and template already exists, include ID
  if (reflectionTemplate.id) {
    payload.reflectionTemplateId = reflectionTemplate.id;
  }
} else {
  // Use custom questions array
  const filteredReflectionQuestions = reflectionQuestions.filter(q => q.trim());
  payload.reflectionQuestions = filteredReflectionQuestions;
}

// Survey handling
payload.useSurveyTemplate = useSurveyTemplate;

if (useSurveyTemplate && surveyTemplate) {
  payload.surveyTemplateData = {
    title: surveyTemplate.title,
    description: surveyTemplate.description,
    category: 'custom',
    questions: surveyTemplate.questions.map(q => ({
      text: q.questionText,
      type: q.questionType,
      options: q.options,
      scaleMin: q.scaleMin,
      scaleMax: q.scaleMax,
      scaleMinLabel: q.scaleMinLabel,
      scaleMaxLabel: q.scaleMaxLabel,
    })),
    scope: scope || 'private',
  };

  if (surveyTemplate.id) {
    payload.surveyTemplateId = surveyTemplate.id;
  }
}
```

---

### Task 7: Update Module API Routes

**Files**:
- `src/app/api/org-admin/modules/route.ts`
- `src/app/api/org-admin/modules/[id]/route.ts`

#### Changes Needed:

**In POST handler** (create module):

```typescript
import { createReflectionTemplate, createSurveyTemplate } from '@/services/TemplateService';

// After validation, before creating module:
let reflectionTemplateId = body.reflectionTemplateId;
let surveyTemplateId = body.surveyTemplateId;

// Create reflection template if needed
if (body.useReflectionTemplate && body.reflectionTemplateData && !reflectionTemplateId) {
  const template = await createReflectionTemplate({
    ...body.reflectionTemplateData,
    createdBy: user.dbUserId,
    organizationId: body.scope === 'private' ? null : user.organizationId,
  });
  reflectionTemplateId = template.id;
}

// Create survey template if needed
if (body.useSurveyTemplate && body.surveyTemplateData && !surveyTemplateId) {
  const template = await createSurveyTemplate({
    ...body.surveyTemplateData,
    createdBy: user.dbUserId,
    organizationId: body.scope === 'private' ? null : user.organizationId,
  });
  surveyTemplateId = template.id;
}

// Create module with template IDs
const moduleData = {
  ...body,
  reflectionTemplateId,
  surveyTemplateId,
  // Remove template data (already created)
  reflectionTemplateData: undefined,
  surveyTemplateData: undefined,
};
```

---

### Task 8: Update Page Generation Logic

**File**: Find page generation endpoint (likely `src/app/api/pages/generate-from-module/route.ts` or similar)

#### Logic Needed:

```typescript
// 1. Fetch module with templates
const module = await db.select()
  .from(treatmentModules)
  .where(eq(treatmentModules.id, moduleId))
  .limit(1);

// 2. Get reflection questions
let reflectionQuestions = [];

if (module.useReflectionTemplate && module.reflectionTemplateId) {
  // Fetch template
  const template = await db.select()
    .from(reflectionTemplates)
    .where(eq(reflectionTemplates.id, module.reflectionTemplateId))
    .limit(1);

  reflectionQuestions = template.questions; // JSONB array
} else if (module.reflectionQuestions) {
  // Convert string array to question objects
  reflectionQuestions = module.reflectionQuestions.map((text, i) => ({
    id: `q-${i}`,
    text,
    type: 'open_text'
  }));
}

// 3. Create page blocks for each question
const reflectionBlocks = reflectionQuestions.map((q, index) => ({
  blockType: 'reflection',
  sequenceNumber: baseSequence + index,
  settings: {
    questionText: q.text,
    questionType: q.type,
    options: q.options,
    scaleMin: q.scaleMin,
    scaleMax: q.scaleMax,
    scaleMinLabel: q.scaleMinLabel,
    scaleMaxLabel: q.scaleMaxLabel,
  }
}));

// 4. Insert blocks into page_blocks table
await db.insert(pageBlocks).values(reflectionBlocks.map(block => ({
  pageId: newPage.id,
  ...block
})));

// 5. Create individual question records
for (const block of insertedBlocks) {
  const blockSettings = reflectionBlocks.find(b => b.sequenceNumber === block.sequenceNumber);

  await db.insert(reflectionQuestions).values({
    blockId: block.id,
    questionText: blockSettings.settings.questionText,
    questionType: blockSettings.settings.questionType,
    options: blockSettings.settings.options,
    sequenceNumber: 0, // First question in block
  });
}

// Repeat for survey questions
```

---

### Task 9: Update Seed File

**File**: `scripts/seed-modules.ts`

Add example modules:

```typescript
// Example 1: Custom reflection questions (no template)
{
  name: 'Basic Self-Reflection',
  domain: 'self_strength',
  description: 'Simple reflection questions',
  scope: 'system',
  useReflectionTemplate: false,
  reflectionQuestions: [
    'What moment from today\'s session resonated most with you?',
    'What strengths did you discover or rediscover?'
  ],
  useSurveyTemplate: false,
  aiPromptText: '...',
  createdBy: adminUserId,
}

// Example 2: With reflection template
{
  name: 'Resilience Building',
  domain: 'self_strength',
  description: 'Comprehensive resilience assessment',
  scope: 'system',
  useReflectionTemplate: true,
  reflectionTemplateData: {
    title: 'Resilience Reflection Set',
    description: 'Explore coping and resilience',
    category: 'custom',
    questions: [
      {
        text: 'What coping strategies did you use this week?',
        type: 'multiple_choice',
        options: ['Mindfulness', 'Exercise', 'Journaling', 'Social support', 'Other']
      },
      {
        text: 'Describe a moment when you felt resilient.',
        type: 'open_text'
      }
    ],
    scope: 'system'
  },
  useSurveyTemplate: true,
  surveyTemplateData: {
    title: 'Resilience Scale',
    description: 'Quantitative resilience measurement',
    category: 'assessment',
    questions: [
      {
        text: 'How resilient do you feel today?',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 10,
        scaleMinLabel: 'Not resilient',
        scaleMaxLabel: 'Very resilient'
      }
    ],
    scope: 'system'
  },
  aiPromptText: '...',
  createdBy: adminUserId,
}
```

---

### Task 10: Testing Checklist

#### Manual Testing:

**Test 1: Create Module with Custom Questions**
- [ ] Open module editor
- [ ] Keep "Use Template" toggle OFF
- [ ] Add 2-3 custom reflection questions
- [ ] Save module
- [ ] Verify questions stored in `reflectionQuestions` JSONB
- [ ] Verify `useReflectionTemplate = false`

**Test 2: Create Module with Reflection Template**
- [ ] Open module editor
- [ ] Toggle "Use Template" ON
- [ ] Enter template title: "Weekly Reflection"
- [ ] Add 3 questions (mix of types: open_text, multiple_choice, scale)
- [ ] Save module
- [ ] Verify new template created in `reflection_templates`
- [ ] Verify module has `reflectionTemplateId`
- [ ] Verify `useReflectionTemplate = true`

**Test 3: Switch from Custom to Template**
- [ ] Edit existing module with custom questions
- [ ] Toggle "Use Template" ON
- [ ] Verify custom questions still visible (below fold)
- [ ] Add template questions
- [ ] Save
- [ ] Verify template created
- [ ] Verify custom questions preserved (in case user switches back)

**Test 4: Page Generation**
- [ ] Select module with reflection template (5 questions)
- [ ] Generate story page
- [ ] Verify 5 reflection blocks created
- [ ] Verify each block has correct question text and type
- [ ] Open page editor
- [ ] Remove 2 questions
- [ ] Save page
- [ ] Verify only 3 reflection blocks remain

**Test 5: Patient View**
- [ ] Open generated page as patient
- [ ] Verify all reflection questions display
- [ ] Answer each question
- [ ] Submit responses
- [ ] Verify responses saved to `reflection_responses`

---

## 🎯 Implementation Priority

**High Priority** (Must Have):
1. ✅ ModuleEditor UI updates (Task 6)
2. ✅ Module API route updates (Task 7)
3. ✅ Page generation logic (Task 8)

**Medium Priority** (Should Have):
4. ⏳ Seed file examples (Task 9)
5. ⏳ Manual testing (Task 10)

**Low Priority** (Nice to Have):
6. Template management UI (separate page for browsing/editing templates)
7. Template search/filter in module editor
8. Template preview modal
9. Template duplication feature

---

## 📊 Estimated Time Remaining

- **ModuleEditor UI**: 2-3 hours (complex component)
- **Module API updates**: 1 hour
- **Page generation**: 1-2 hours (depends on existing structure)
- **Seed file**: 30 minutes
- **Testing**: 1-2 hours

**Total**: 5.5-8.5 hours

---

## 🔑 Key Design Decisions

1. **Inline Template Creation**: Users create templates while editing modules (not separate page)
2. **Hybrid Storage**: Modules can use EITHER custom questions OR templates
3. **Auto-Add All Questions**: Page generation adds all questions from template (user can remove)
4. **Private by Default**: New templates created as `scope='private'`
5. **Question Field Naming**: Template uses `text`, component uses `questionText` (need mapping)

---

## 📝 Notes

- **Question Field Discrepancy**: TemplateQuestionEditor uses `questionText`, but existing schema uses `text`. Need to map between them when saving.
- **Template ID Handling**: When editing module with existing template, include `reflectionTemplate.id` to avoid creating duplicates.
- **Validation**: Use existing `createReflectionTemplateSchema` from TemplateValidation.ts
- **Error Handling**: Wrap template creation in try-catch, fall back to custom questions on error

---

**Last Updated**: 2025-11-19
**Status**: Ready for final implementation
**Blocked By**: None - all dependencies resolved
