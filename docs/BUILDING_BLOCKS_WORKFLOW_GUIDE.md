# Building Blocks Workflow System - Implementation Guide

## Overview

The building blocks system has been enhanced to support flexible output structures with text instructions and action buttons, enabling hybrid workflows where outputs automatically pass between steps.

## Key Features

### 1. **New Block Types**

#### Output Blocks
- **Text Output Block** (`text_output`)
  - Display instructions, generated lyrics, stories, etc.
  - Supports AI-generated or static content
  - Automatically executes and passes output to next steps

#### Action Blocks
- **Save Quote Action** (`save_quote_action`)
  - Saves quotes from analysis to media library
  - Requires manual button click (or auto-save if configured)
  - Supports template variables: `{{step1.quotes[0].text}}`

- **Generate Image Action** (`generate_image_action`)
  - Triggers AI image generation
  - Uses prompts from previous steps
  - Saves to media library automatically

- **Generate Music Action** (`generate_music_action`)
  - Generates music/audio using AI
  - Configurable mood and duration
  - Saves to media library

### 2. **Hybrid Workflow Execution**

The system supports two execution modes:

- **Auto-execute**: Blocks run automatically (e.g., text output, content generation)
- **Manual**: Blocks require user to click action buttons (e.g., save quote, generate image)

Workflow pauses at manual steps, waiting for user action before continuing.

### 3. **Automatic Data Passing**

Outputs from previous steps automatically become available to subsequent steps using template variables:

```
Step 1 (auto): Generate lyrics → output stored as step1.lyrics
Step 2 (manual): "Generate Music" button → uses {{step1.lyrics}}
Step 3 (manual): "Save Quote" → extracts from {{step1.lyrics}}
```

## Usage Examples

### Example 1: Lyrics to Music Workflow

```typescript
// Step 1: Generate Lyrics (Text Output - Auto)
{
  blockType: 'text_output',
  values: {
    title: 'Generated Lyrics',
    content_type: 'lyrics',
    prompt_for_content: 'Write therapeutic lyrics about finding inner strength',
  },
  executionMode: 'auto',
  outputKey: 'step1'
}

// Step 2: Generate Music (Action - Manual)
{
  blockType: 'generate_music_action',
  values: {
    button_label: 'Generate Music from Lyrics',
    music_prompt: 'Create calm, uplifting music for these lyrics: {{step1.content}}',
    mood: 'uplifting',
    duration: 60,
    save_to_library: true
  },
  executionMode: 'manual',
  outputKey: 'step2'
}

// Step 3: Save Quote (Action - Manual)
{
  blockType: 'save_quote_action',
  values: {
    button_label: 'Save Favorite Line',
    quote_source: '{{step1.content}}', // User selects from generated lyrics
    therapeutic_significance: 'Key affirmation for patient'
  },
  executionMode: 'manual'
}
```

### Example 2: Story to Visual Workflow

```typescript
// Step 1: Generate Story Description (Text Output - Auto)
{
  blockType: 'text_output',
  values: {
    title: 'Story Visualization',
    content_type: 'story',
    prompt_for_content: 'Describe a peaceful scene representing patient progress',
  },
  outputKey: 'step1'
}

// Step 2: Generate Image (Action - Manual)
{
  blockType: 'generate_image_action',
  values: {
    button_label: 'Create Visual',
    prompt_template: '{{step1.content}}',
    style: 'watercolor',
    save_to_library: true
  }
}
```

## Technical Architecture

### Core Files Created/Modified

1. **Type System** - `src/types/BuildingBlocks.ts`
   - Added new block types: `text_output`, `save_quote_action`, `generate_image_action`, `generate_music_action`
   - Added `ExecutionMode` type: `'auto' | 'manual'`
   - Added workflow execution types: `WorkflowExecution`, `WorkflowContext`, `ActionExecutionRequest`, etc.

2. **Block Definitions** - `src/config/BlockDefinitions.ts`
   - Defined 4 new blocks with complete field definitions
   - Added validation rules for new blocks
   - Configured execution modes and template support

3. **Template Interpolation** - `src/utils/TemplateInterpolation.ts` (NEW)
   - `interpolateTemplate()` - Replace `{{variable}}` with context values
   - `getNestedValue()` - Access nested properties (e.g., `step1.quotes[0].text`)
   - `validateTemplate()` - Check if all variables can be resolved
   - Supports arrays, objects, and nested paths

4. **Workflow Executor** - `src/services/WorkflowExecutorService.ts` (NEW)
   - `WorkflowExecutor` class - Manages hybrid workflow execution
   - `executeBlock()` - Execute single block with context
   - `executeAction()` - Handle manual action execution
   - `resumeAfterAction()` - Continue workflow after manual step
   - Integrates with database for quote/media saving

5. **Database Schema** - `src/models/Schema.ts`
   - Added `workflow_executions` table to track execution state
   - Stores blocks, context, status, and step progress
   - Links to sessions, patients, therapists, organizations

6. **UI Components**
   - `src/components/prompts/ActionButtonRenderer.tsx` (NEW)
     - Renders action buttons with status (pending, processing, completed, failed)
     - Shows previews and results
     - Handles button clicks and error states

   - `src/components/prompts/WorkflowExecutionViewer.tsx` (NEW)
     - Visualizes workflow execution progress
     - Shows step-by-step status
     - Integrates ActionButtonRenderer for manual steps

7. **API Endpoint** - `src/app/api/workflows/execute/route.ts` (NEW)
   - `POST /api/workflows/execute` - Start new workflow
   - `PUT /api/workflows/execute` - Execute manual action and resume
   - `GET /api/workflows/execute?id=xxx` - Get execution status
   - Authentication with Firebase ID tokens
   - Persists execution state to database

## Integration Points

The flexible building blocks can be used in:

1. **Organization Admin Prompts** (`/org-admin/prompts`)
   - Create reusable prompt templates with workflows
   - Define multi-step processes for therapists

2. **Therapist Session Analysis**
   - Apply workflows when analyzing therapy sessions
   - Automatically generate content → manual review → save to library

3. **Treatment Modules**
   - Build treatment modules with sequential steps
   - Combine AI generation with therapist-controlled actions

## How to Use in Your Application

### 1. Create a Prompt with New Blocks

```tsx
import BuildingBlocksEditor from '@/components/prompts/BuildingBlocksEditor';

function PromptEditor() {
  const [blocks, setBlocks] = useState<BlockInstance[]>([]);
  const [schema, setSchema] = useState({});

  return (
    <BuildingBlocksEditor
      initialBlocks={blocks}
      onChange={(newBlocks, newSchema) => {
        setBlocks(newBlocks);
        setSchema(newSchema);
      }}
    />
  );
}
```

The palette now includes:
- **Output** category: Text Output
- **Action** category: Save Quote Action, Generate Image Action, Generate Music Action

### 2. Execute a Workflow

```tsx
import { startWorkflow } from '@/services/WorkflowExecutorService';

async function executePrompt() {
  const execution = await startWorkflow(
    promptId,
    blocks,
    {
      sessionId: 'session-uuid',
      patientId: 'patient-uuid',
      therapistId: 'therapist-uuid',
    }
  );

  // Workflow executes auto steps, then pauses at first manual step
  console.log('Status:', execution.status); // 'paused' if manual action required
}
```

### 3. Display Workflow Execution

```tsx
import { WorkflowExecutionViewer } from '@/components/prompts/WorkflowExecutionViewer';

function WorkflowView({ execution }: { execution: WorkflowExecution }) {
  const handleExecuteAction = async (request: ActionExecutionRequest) => {
    // Call API to execute action
    const response = await fetch('/api/workflows/execute', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        executionId: execution.id,
        ...request,
      }),
    });

    const result = await response.json();
    return result.execution;
  };

  return (
    <WorkflowExecutionViewer
      execution={execution}
      onExecuteAction={handleExecuteAction}
    />
  );
}
```

### 4. API Integration

**Start Workflow:**
```bash
POST /api/workflows/execute
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "promptId": "uuid",
  "blocks": [...],
  "context": {
    "sessionId": "uuid",
    "patientId": "uuid"
  }
}
```

**Execute Action:**
```bash
PUT /api/workflows/execute
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "executionId": "uuid",
  "blockInstanceId": "block-id",
  "blockType": "save_quote_action",
  "values": { ... }
}
```

**Get Status:**
```bash
GET /api/workflows/execute?id=<execution-id>
Authorization: Bearer <firebase-id-token>
```

## Template Variable Syntax

Use `{{variable}}` syntax to reference previous step outputs:

- `{{step1.content}}` - Access step 1's content field
- `{{step1.quotes[0].text}}` - Access first quote's text from step 1
- `{{step2.image_url}}` - Access generated image URL from step 2
- `{{patientId}}` - Access context variables
- `{{step1.lyrics}}` - Access any field from previous step output

Variables are automatically interpolated before block execution.

## Database Migration

Run migrations to create the `workflow_executions` table:

```bash
npm run db:generate
npm run db:migrate
```

This creates:
- `workflow_executions` table with execution state tracking
- Relationships to prompts, sessions, patients, therapists, organizations

## Next Steps

1. **Integrate with AI Services**
   - Connect `text_output` blocks to OpenAI for content generation
   - Implement actual image generation in `executeGenerateImageAction()`
   - Implement actual music generation in `executeGenerateMusicAction()`

2. **Add More Action Types**
   - Create Story Page Action
   - Generate Video Action
   - Send Email Action

3. **Enhanced UI**
   - Add workflow templates (pre-built workflows)
   - Visual workflow designer with drag-and-drop
   - Real-time execution status updates via WebSockets

4. **Testing**
   - Unit tests for WorkflowExecutor
   - Integration tests for API endpoints
   - E2E tests for workflow execution UI

## Troubleshooting

### Common Issues

1. **Template variables not resolving**
   - Ensure `outputKey` is set on blocks (defaults to `step1`, `step2`, etc.)
   - Check variable syntax: `{{step1.field}}` not `{step1.field}`
   - Use `validateTemplate()` to debug missing variables

2. **Workflow stuck in 'paused' state**
   - Manual action blocks require user to click button
   - Check if action execution failed (check `executionError`)
   - Ensure API endpoint is accessible

3. **Action execution fails**
   - Verify Firebase authentication token is valid
   - Check required context fields (patientId, etc.)
   - Review API error logs for details

## Summary

The enhanced building blocks system provides:

✅ Flexible output structures (text blocks + action buttons)
✅ Hybrid execution (auto + manual steps)
✅ Automatic data passing between steps
✅ Template variable support
✅ Visual workflow execution tracking
✅ Persistent execution state
✅ Full API integration

This enables powerful therapeutic workflows like:
- Generate lyrics → Generate music → Save quotes
- Analyze session → Extract insights → Generate visuals → Create story page
- Generate prompts → Review → Execute actions → Save to library

The system is fully extensible - add new block types and actions as needed!
