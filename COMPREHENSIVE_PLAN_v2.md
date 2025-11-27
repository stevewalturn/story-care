# AI Assistant JSON Output Integration - Comprehensive Plan v2

## Executive Summary

This plan outlines the integration of structured JSON outputs in the AI Assistant chat interface. Instead of separate modals for different content types, all AI-generated structured data (scenes, music, images, notes, etc.) will be rendered directly in the chat with contextual action buttons.

**Key Features:**
- AI prompts can output TEXT, JSON, or BOTH
- JSON outputs are detected and rendered in-chat with action buttons
- Schema-based action mapping (each JSON schema → specific actions)
- Batch operations show in-chat progress
- Prompt Library enhanced with Output Type filtering
- All operations execute from chat interface

---

## 1. Architecture Overview

### 1.1 High-Level Flow

```
Therapist Selects Text → Opens Analyze Modal → Selects JSON Prompt →
AI Generates JSON in Chat → JSON Detected → Action Buttons Rendered →
Therapist Clicks Action → In-Chat Progress Updates → Completion Message →
Results Available in Library Panel
```

### 1.2 Component Architecture

```
TranscriptViewerClient
├── AIAssistantPanel (ENHANCED)
│   ├── Message rendering with JSON detection
│   ├── JSONOutputRenderer (NEW)
│   │   ├── SchemaDetector
│   │   ├── ActionButtonGroup
│   │   └── ProgressTracker
│   └── In-chat progress messages
├── AnalyzeSelectionModal (ENHANCED)
│   └── Output Type filter (Text/JSON/Both)
└── LibraryPanel (existing)
    └── Display generated content
```

### 1.3 Data Flow

```
1. User selects transcript text
2. Opens Analyze Modal → Filters by Output Type → Selects JSON prompt
3. AI Assistant receives prompt with JSON schema
4. AI returns structured JSON
5. Chat UI detects JSON schema type
6. Renders predefined action buttons for that schema
7. Therapist clicks action (e.g., "Generate Music", "Create Scene")
8. System processes action with in-chat progress updates
9. Completion message with link to result
10. Content appears in Library Panel
```

---

## 2. JSON Schema Registry

### 2.1 Schema Type Definitions

```typescript
// src/types/JSONSchemas.ts

export type JSONSchemaType =
  | 'scene_card'
  | 'music_generation'
  | 'image_references'
  | 'reflection_questions'
  | 'therapeutic_note'
  | 'quote_extraction';

export interface BaseJSONSchema {
  schemaType: JSONSchemaType;
  version: string;
}

// Scene Card Schema
export interface SceneCardSchema extends BaseJSONSchema {
  schemaType: 'scene_card';
  video_introduction: string;
  patient_reflection_questions: string[];
  group_reflection_questions: string[];
  reference_images: Array<{
    stage_name: string;
    title: string;
    image_prompt: string;
    meaning: string;
    patient_quote_anchor: string;
    animation_instructions: string;
  }>;
  music: {
    prompt: string;
    duration_seconds: number;
    segment_timing?: number[];
    fade_out?: boolean;
    instrument_focus?: string[];
    progression_note?: string;
  };
  assembly_steps: string[];
  buttons: Array<{
    label: string;
    action: string;
    group: string;
    style: string;
    data_key?: string;
    icon?: string;
  }>;
}

// Music Generation Schema
export interface MusicGenerationSchema extends BaseJSONSchema {
  schemaType: 'music_generation';
  instrumental_option: {
    music_description: string;
    mood: string;
    genre_tags: string;
    title: string;
    style_prompt: string;
    tempo_hint?: string;
    intensity_curve?: string;
    primary_instruments?: string;
    symbolic_sources: string[];
    source_quotes: string[];
    rationale: string;
  };
  lyrical_option: {
    song_concept: string;
    suggested_lyrics: string;
    suggested_lyrical_themes: string[];
    mood: string;
    genre_tags: string;
    title: string;
    style_prompt: string;
    vocal_feel?: string;
    perspective?: string;
    symbolic_sources: string[];
    source_quotes: string[];
    rationale: string;
  };
}

// Scene Suggestions Schema
export interface SceneSuggestionsSchema extends BaseJSONSchema {
  schemaType: 'scene_suggestions';
  potential_scenes_by_participant: Array<{
    for_patient_name: string;
    scenes: Array<{
      scene_title: string;
      scene_description: string;
      key_quote: string;
      therapeutic_rationale: string;
      scene_focus_instruction: string;
    }>;
  }>;
}

// Image References Schema
export interface ImageReferencesSchema extends BaseJSONSchema {
  schemaType: 'image_references';
  images: Array<{
    title: string;
    prompt: string;
    style: string;
    therapeutic_purpose: string;
    source_quote?: string;
  }>;
}
```

### 2.2 Schema-to-Action Mapping

```typescript
// src/config/SchemaActions.ts

export interface SchemaAction {
  id: string;
  label: string;
  icon: string;
  handler: string; // Function name to call
  confirmation?: string;
  batchable?: boolean;
}

export const SCHEMA_ACTIONS: Record<JSONSchemaType, SchemaAction[]> = {
  scene_card: [
    {
      id: 'create_scene',
      label: 'Create Scene',
      icon: 'film',
      handler: 'handleCreateScene',
      confirmation: 'This will create a new scene with the generated content.',
    },
    {
      id: 'generate_images',
      label: 'Generate Reference Images',
      icon: 'image',
      handler: 'handleGenerateImages',
      batchable: true,
    },
    {
      id: 'generate_music',
      label: 'Generate Music',
      icon: 'music',
      handler: 'handleGenerateMusic',
    },
    {
      id: 'save_reflections',
      label: 'Save Reflection Questions',
      icon: 'help-circle',
      handler: 'handleSaveReflections',
    },
  ],

  music_generation: [
    {
      id: 'generate_instrumental',
      label: 'Generate Instrumental',
      icon: 'music',
      handler: 'handleGenerateInstrumental',
    },
    {
      id: 'generate_lyrical',
      label: 'Generate Lyrical Song',
      icon: 'mic',
      handler: 'handleGenerateLyrical',
    },
  ],

  scene_suggestions: [
    {
      id: 'create_scenes',
      label: 'Create All Scenes',
      icon: 'film',
      handler: 'handleCreateScenesFromSuggestions',
      batchable: true,
    },
    {
      id: 'save_as_notes',
      label: 'Save as Notes',
      icon: 'file-text',
      handler: 'handleSaveScenesAsNotes',
    },
  ],

  image_references: [
    {
      id: 'generate_all_images',
      label: 'Generate All Images',
      icon: 'image',
      handler: 'handleGenerateAllImages',
      batchable: true,
    },
  ],

  reflection_questions: [
    {
      id: 'add_to_module',
      label: 'Add to Module',
      icon: 'plus-circle',
      handler: 'handleAddReflectionsToModule',
    },
    {
      id: 'save_as_note',
      label: 'Save as Note',
      icon: 'file-text',
      handler: 'handleSaveAsNote',
    },
  ],

  therapeutic_note: [
    {
      id: 'save_note',
      label: 'Save Note',
      icon: 'save',
      handler: 'handleSaveTherapeuticNote',
    },
  ],

  quote_extraction: [
    {
      id: 'save_quote',
      label: 'Save Quote',
      icon: 'quote',
      handler: 'handleSaveQuote',
    },
  ],
};
```

---

## 3. Database Schema Updates

### 3.1 Enhanced AI Prompts Table

```sql
-- Add output type and schema fields
ALTER TABLE ai_prompts
  ADD COLUMN output_type VARCHAR(20) DEFAULT 'text',
  ADD COLUMN json_schema JSONB,
  ADD COLUMN schema_type VARCHAR(50);

-- Values for output_type: 'text', 'json', 'both'
-- Values for schema_type: 'scene_card', 'music_generation', etc.
```

### 3.2 DrizzleORM Schema

```typescript
// src/models/Schema.ts

export const aiPrompts = pgTable('ai_prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  promptText: text('prompt_text').notNull(),
  category: varchar('category', { length: 100 }),
  outputType: varchar('output_type', { length: 20 }).default('text'),
  jsonSchema: jsonb('json_schema'),
  schemaType: varchar('schema_type', { length: 50 }),
  isSystemPrompt: boolean('is_system_prompt').default(false),
  organizationId: uuid('organization_id').references(() => organizations.id),
  therapistId: uuid('therapist_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### 3.3 Chat History Enhancement

```sql
-- Add message metadata for tracking JSON outputs
ALTER TABLE chat_messages
  ADD COLUMN message_type VARCHAR(50) DEFAULT 'text',
  ADD COLUMN json_data JSONB,
  ADD COLUMN schema_type VARCHAR(50),
  ADD COLUMN action_status VARCHAR(50); -- 'pending', 'processing', 'completed', 'failed'
```

---

## 4. UI Components

### 4.1 Enhanced AIAssistantPanel

```typescript
// src/app/(auth)/sessions/[id]/transcript/TranscriptViewerClient.tsx
// Inside AIAssistantPanel component

import { JSONOutputRenderer } from '@/components/sessions/JSONOutputRenderer';
import { detectJSONSchema } from '@/utils/JSONSchemaDetector';

const renderMessage = (message: Message, index: number) => {
  if (message.role === 'assistant') {
    // Detect if message contains JSON
    const jsonData = detectJSONSchema(message.content);

    if (jsonData) {
      return (
        <JSONOutputRenderer
          jsonData={jsonData}
          schemaType={jsonData.schemaType}
          sessionId={sessionId}
          user={user}
          onActionComplete={(result) => {
            // Add completion message to chat
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: result.message,
            }]);
          }}
          onProgress={(update) => {
            // Add progress message to chat
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: update,
            }]);
          }}
        />
      );
    }

    // Regular markdown rendering for text responses
    return (
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.content}
        </ReactMarkdown>
      </div>
    );
  }

  return <p className="text-sm">{message.content}</p>;
};
```

### 4.2 New Component: JSONOutputRenderer

```typescript
// src/components/sessions/JSONOutputRenderer.tsx
'use client';

import { useState } from 'react';
import { SCHEMA_ACTIONS } from '@/config/SchemaActions';
import type { JSONSchemaType } from '@/types/JSONSchemas';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface JSONOutputRendererProps {
  jsonData: any;
  schemaType: JSONSchemaType;
  sessionId: string;
  user: any;
  onActionComplete: (result: { message: string; data?: any }) => void;
  onProgress: (update: string) => void;
}

export function JSONOutputRenderer({
  jsonData,
  schemaType,
  sessionId,
  user,
  onActionComplete,
  onProgress,
}: JSONOutputRendererProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const actions = SCHEMA_ACTIONS[schemaType] || [];

  const handleAction = async (action: SchemaAction) => {
    if (action.confirmation && !confirm(action.confirmation)) {
      return;
    }

    setProcessingAction(action.id);

    try {
      // Call the appropriate handler
      const handler = ACTION_HANDLERS[action.handler];
      if (!handler) {
        throw new Error(`Handler ${action.handler} not found`);
      }

      await handler({
        jsonData,
        sessionId,
        user,
        onProgress,
        onComplete: onActionComplete,
      });
    } catch (error) {
      console.error('Action error:', error);
      onActionComplete({
        message: `❌ Failed to ${action.label.toLowerCase()}. Please try again.`,
      });
    } finally {
      setProcessingAction(null);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-indigo-100 p-1.5">
            <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-indigo-900">
              {getSchemaDisplayName(schemaType)}
            </h4>
            <p className="text-xs text-indigo-700">
              AI-generated structured output
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-indigo-600 hover:text-indigo-700"
        >
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {/* Preview / Summary */}
      <div className="mb-3 rounded-lg bg-white/80 p-3">
        {renderPreview(schemaType, jsonData)}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {actions.map(action => (
          <button
            key={action.id}
            onClick={() => handleAction(action)}
            disabled={processingAction !== null}
            className={`
              flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
              transition-all disabled:opacity-50 disabled:cursor-not-allowed
              ${processingAction === action.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-indigo-700 hover:bg-indigo-100 border border-indigo-300'
              }
            `}
          >
            {processingAction === action.id ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                {getIconComponent(action.icon)}
                {action.label}
              </>
            )}
          </button>
        ))}
      </div>

      {/* Expandable JSON View */}
      {isExpanded && (
        <details className="mt-3 rounded-lg border border-indigo-200 bg-white p-3" open>
          <summary className="cursor-pointer text-xs font-medium text-gray-700">
            View Raw JSON
          </summary>
          <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
            {JSON.stringify(jsonData, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

// Helper: Render preview based on schema type
function renderPreview(schemaType: JSONSchemaType, data: any) {
  switch (schemaType) {
    case 'scene_card':
      return (
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-gray-900">Scene Card Preview:</p>
          <ul className="space-y-1 text-xs text-gray-700">
            <li>• {data.reference_images?.length || 0} reference images</li>
            <li>• {data.patient_reflection_questions?.length || 0} patient questions</li>
            <li>• Music: {data.music?.duration_seconds || 0}s</li>
            <li>• {data.assembly_steps?.length || 0} assembly steps</li>
          </ul>
        </div>
      );

    case 'music_generation':
      return (
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-gray-900">Music Options:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-purple-50 p-2">
              <p className="font-semibold text-purple-900">Instrumental</p>
              <p className="text-purple-700">{data.instrumental_option?.title}</p>
            </div>
            <div className="rounded-lg bg-indigo-50 p-2">
              <p className="font-semibold text-indigo-900">Lyrical</p>
              <p className="text-indigo-700">{data.lyrical_option?.title}</p>
            </div>
          </div>
        </div>
      );

    case 'scene_suggestions':
      return (
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-gray-900">Scene Suggestions:</p>
          <ul className="space-y-1 text-xs text-gray-700">
            {data.potential_scenes_by_participant?.map((p: any, i: number) => (
              <li key={i}>
                • {p.for_patient_name}: {p.scenes?.length || 0} scenes
              </li>
            ))}
          </ul>
        </div>
      );

    default:
      return (
        <p className="text-xs text-gray-600">
          {Object.keys(data).length} fields detected
        </p>
      );
  }
}

function getSchemaDisplayName(schemaType: JSONSchemaType): string {
  const names: Record<JSONSchemaType, string> = {
    scene_card: 'Scene Card',
    music_generation: 'Music Generation',
    scene_suggestions: 'Scene Suggestions',
    image_references: 'Image References',
    reflection_questions: 'Reflection Questions',
    therapeutic_note: 'Therapeutic Note',
    quote_extraction: 'Quote Extraction',
  };
  return names[schemaType] || 'JSON Output';
}

function getIconComponent(iconName: string) {
  // Map icon names to actual icon components
  // Using lucide-react icons
  const icons: Record<string, any> = {
    film: <Film className="h-4 w-4" />,
    image: <Image className="h-4 w-4" />,
    music: <Music className="h-4 w-4" />,
    mic: <Mic className="h-4 w-4" />,
    'help-circle': <HelpCircle className="h-4 w-4" />,
    'file-text': <FileText className="h-4 w-4" />,
    save: <Save className="h-4 w-4" />,
    quote: <Quote className="h-4 w-4" />,
    'plus-circle': <PlusCircle className="h-4 w-4" />,
  };
  return icons[iconName] || <Circle className="h-4 w-4" />;
}
```

### 4.3 Action Handlers

```typescript
// src/services/JSONActionHandlers.ts

import { authenticatedPost } from '@/utils/AuthenticatedFetch';
import { sunoAPI } from '@/libs/SunoAPI';

interface ActionContext {
  jsonData: any;
  sessionId: string;
  user: any;
  onProgress: (message: string) => void;
  onComplete: (result: { message: string; data?: any }) => void;
}

// Scene Card Actions
export async function handleCreateScene(ctx: ActionContext) {
  const { jsonData, sessionId, user, onProgress, onComplete } = ctx;

  onProgress('🎬 Creating scene...');

  try {
    const response = await authenticatedPost('/api/scenes', user, {
      sessionId,
      title: jsonData.reference_images?.[0]?.title || 'Untitled Scene',
      description: jsonData.video_introduction,
      sceneData: jsonData,
    });

    if (!response.ok) throw new Error('Failed to create scene');

    const result = await response.json();

    onComplete({
      message: `✅ Scene "${result.scene.title}" created successfully! View in Scenes panel.`,
      data: result.scene,
    });
  } catch (error) {
    throw error;
  }
}

export async function handleGenerateImages(ctx: ActionContext) {
  const { jsonData, sessionId, user, onProgress, onComplete } = ctx;
  const images = jsonData.reference_images || [];

  if (images.length === 0) {
    onComplete({ message: '⚠️ No images to generate.' });
    return;
  }

  onProgress(`🎨 Generating ${images.length} reference images...`);

  const results = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    onProgress(`🎨 Generating image ${i + 1}/${images.length}: "${img.title}"...`);

    try {
      const response = await authenticatedPost('/api/ai/generate-image', user, {
        prompt: img.image_prompt,
        style: img.style || 'photorealistic',
        sessionId,
        title: img.title,
        description: img.meaning,
        sourceQuote: img.patient_quote_anchor,
      });

      if (!response.ok) {
        onProgress(`❌ Failed to generate "${img.title}"`);
        continue;
      }

      const result = await response.json();
      results.push(result);
      onProgress(`✅ Generated "${img.title}"`);
    } catch (error) {
      onProgress(`❌ Error generating "${img.title}": ${error.message}`);
    }
  }

  onComplete({
    message: `✅ Generated ${results.length}/${images.length} images. View in Library panel.`,
    data: results,
  });
}

export async function handleGenerateMusic(ctx: ActionContext) {
  const { jsonData, sessionId, user, onProgress, onComplete } = ctx;
  const musicData = jsonData.music;

  if (!musicData) {
    onComplete({ message: '⚠️ No music data found.' });
    return;
  }

  onProgress('🎵 Generating music track...');

  try {
    const response = await authenticatedPost('/api/ai/generate-music', user, {
      sessionId,
      musicType: 'instrumental',
      title: 'Scene Background Music',
      prompt: musicData.prompt,
      model: 'V4_5',
      instrumental: true,
      mood: musicData.progression_note || '',
      stylePrompt: musicData.prompt,
    });

    if (!response.ok) throw new Error('Failed to generate music');

    const result = await response.json();
    const taskId = result.taskId;

    onProgress('🎵 Music generation started. This may take 2-3 minutes...');

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 36; // 3 minutes max

    const poll = setInterval(async () => {
      attempts++;

      try {
        const statusResponse = await fetch(`/api/ai/music-task/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${await user.getIdToken()}`,
          },
        });

        const statusData = await statusResponse.json();

        if (statusData.data.status === 'completed') {
          clearInterval(poll);
          onComplete({
            message: '✅ Music generated successfully! Listen in Library panel.',
            data: statusData.data,
          });
        } else if (statusData.data.status === 'failed' || attempts >= maxAttempts) {
          clearInterval(poll);
          throw new Error('Music generation failed or timed out');
        } else if (attempts % 6 === 0) {
          // Update every 30 seconds
          onProgress(`🎵 Still generating... (${Math.floor(attempts * 5 / 60)}m ${(attempts * 5) % 60}s)`);
        }
      } catch (pollError) {
        clearInterval(poll);
        throw pollError;
      }
    }, 5000);
  } catch (error) {
    throw error;
  }
}

export async function handleSaveReflections(ctx: ActionContext) {
  const { jsonData, sessionId, user, onProgress, onComplete } = ctx;

  onProgress('💭 Saving reflection questions...');

  try {
    const response = await authenticatedPost('/api/reflections', user, {
      sessionId,
      patientQuestions: jsonData.patient_reflection_questions || [],
      groupQuestions: jsonData.group_reflection_questions || [],
    });

    if (!response.ok) throw new Error('Failed to save reflections');

    onComplete({
      message: '✅ Reflection questions saved to session.',
    });
  } catch (error) {
    throw error;
  }
}

// Music Generation Actions
export async function handleGenerateInstrumental(ctx: ActionContext) {
  const { jsonData, sessionId, user, onProgress, onComplete } = ctx;
  const instrumental = jsonData.instrumental_option;

  if (!instrumental) {
    onComplete({ message: '⚠️ No instrumental data found.' });
    return;
  }

  onProgress(`🎵 Generating instrumental: "${instrumental.title}"...`);

  try {
    const response = await authenticatedPost('/api/ai/generate-music', user, {
      sessionId,
      musicType: 'instrumental',
      title: instrumental.title,
      style: instrumental.genre_tags,
      prompt: instrumental.music_description,
      model: 'V4_5',
      instrumental: true,
      mood: instrumental.mood,
      stylePrompt: instrumental.style_prompt,
      sourceQuotes: instrumental.source_quotes,
      rationale: instrumental.rationale,
    });

    if (!response.ok) throw new Error('Failed to generate music');

    const result = await response.json();
    onProgress('🎵 Music generation started. This may take 2-3 minutes...');

    // Similar polling logic as handleGenerateMusic
    // ... (omitted for brevity)

  } catch (error) {
    throw error;
  }
}

export async function handleGenerateLyrical(ctx: ActionContext) {
  const { jsonData, sessionId, user, onProgress, onComplete } = ctx;
  const lyrical = jsonData.lyrical_option;

  if (!lyrical) {
    onComplete({ message: '⚠️ No lyrical data found.' });
    return;
  }

  onProgress(`🎤 Generating lyrical song: "${lyrical.title}"...`);

  try {
    const response = await authenticatedPost('/api/ai/generate-music', user, {
      sessionId,
      musicType: 'lyrical',
      title: lyrical.title,
      style: lyrical.genre_tags,
      lyrics: lyrical.suggested_lyrics,
      model: 'V4_5',
      instrumental: false,
      mood: lyrical.mood,
      stylePrompt: lyrical.style_prompt,
      sourceQuotes: lyrical.source_quotes,
      rationale: lyrical.rationale,
    });

    if (!response.ok) throw new Error('Failed to generate music');

    onProgress('🎤 Lyrical song generation started. This may take 2-3 minutes...');

    // Polling logic...

  } catch (error) {
    throw error;
  }
}

// Scene Suggestions Actions
export async function handleCreateScenesFromSuggestions(ctx: ActionContext) {
  const { jsonData, sessionId, user, onProgress, onComplete } = ctx;
  const participants = jsonData.potential_scenes_by_participant || [];

  if (participants.length === 0) {
    onComplete({ message: '⚠️ No scene suggestions found.' });
    return;
  }

  const totalScenes = participants.reduce((sum, p) => sum + (p.scenes?.length || 0), 0);
  onProgress(`🎬 Creating ${totalScenes} scenes...`);

  const results = [];
  let count = 0;

  for (const participant of participants) {
    for (const scene of participant.scenes || []) {
      count++;
      onProgress(`🎬 Creating scene ${count}/${totalScenes}: "${scene.scene_title}"...`);

      try {
        const response = await authenticatedPost('/api/scenes', user, {
          sessionId,
          title: scene.scene_title,
          description: scene.scene_description,
          focusInstruction: scene.scene_focus_instruction,
          keyQuote: scene.key_quote,
          therapeuticRationale: scene.therapeutic_rationale,
          forPatient: participant.for_patient_name,
        });

        if (response.ok) {
          const result = await response.json();
          results.push(result);
          onProgress(`✅ Created "${scene.scene_title}"`);
        } else {
          onProgress(`❌ Failed to create "${scene.scene_title}"`);
        }
      } catch (error) {
        onProgress(`❌ Error creating "${scene.scene_title}"`);
      }
    }
  }

  onComplete({
    message: `✅ Created ${results.length}/${totalScenes} scenes. View in Scenes panel.`,
    data: results,
  });
}

// Export all handlers
export const ACTION_HANDLERS: Record<string, (ctx: ActionContext) => Promise<void>> = {
  handleCreateScene,
  handleGenerateImages,
  handleGenerateMusic,
  handleSaveReflections,
  handleGenerateInstrumental,
  handleGenerateLyrical,
  handleCreateScenesFromSuggestions,
  // Add more handlers as needed...
};
```

### 4.4 JSON Schema Detector

```typescript
// src/utils/JSONSchemaDetector.ts

import type { JSONSchemaType } from '@/types/JSONSchemas';

export function detectJSONSchema(content: string): any | null {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(content);

    // Detect schema type based on structure
    const schemaType = inferSchemaType(parsed);

    if (schemaType) {
      return {
        ...parsed,
        schemaType,
      };
    }

    return null;
  } catch {
    // Not valid JSON
    return null;
  }
}

function inferSchemaType(data: any): JSONSchemaType | null {
  // Scene Card detection
  if (
    data.video_introduction &&
    data.reference_images &&
    data.music &&
    data.assembly_steps
  ) {
    return 'scene_card';
  }

  // Music Generation detection
  if (data.instrumental_option && data.lyrical_option) {
    return 'music_generation';
  }

  // Scene Suggestions detection
  if (data.potential_scenes_by_participant) {
    return 'scene_suggestions';
  }

  // Image References detection
  if (data.images && Array.isArray(data.images)) {
    return 'image_references';
  }

  // Reflection Questions detection
  if (data.patient_questions || data.reflection_questions) {
    return 'reflection_questions';
  }

  // Therapeutic Note detection
  if (data.note_title && data.note_content) {
    return 'therapeutic_note';
  }

  // Quote Extraction detection
  if (data.extracted_quotes || data.quotes) {
    return 'quote_extraction';
  }

  return null;
}
```

---

## 5. Prompt Library Enhancement

### 5.1 Enhanced AnalyzeSelectionModal

```typescript
// src/components/sessions/AnalyzeSelectionModal.tsx

import { useState } from 'react';

export function AnalyzeSelectionModal({ ... }) {
  const [outputTypeFilter, setOutputTypeFilter] = useState<'all' | 'text' | 'json'>('all');

  // Filter prompts by output type
  const filteredPrompts = useMemo(() => {
    let prompts = [...aiPrompts, ...libraryPrompts];

    if (outputTypeFilter !== 'all') {
      prompts = prompts.filter(p => {
        if (outputTypeFilter === 'json') {
          return p.outputType === 'json' || p.outputType === 'both';
        }
        return p.outputType === 'text' || p.outputType === 'both';
      });
    }

    return prompts;
  }, [aiPrompts, libraryPrompts, outputTypeFilter]);

  return (
    <div className="modal">
      {/* Header */}
      <div className="mb-4">
        <h2>Analyze Selected Text</h2>

        {/* Output Type Filter */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setOutputTypeFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              outputTypeFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setOutputTypeFilter('text')}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              outputTypeFilter === 'text'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Text Output
          </button>
          <button
            onClick={() => setOutputTypeFilter('json')}
            className={`px-3 py-1.5 text-sm rounded-lg ${
              outputTypeFilter === 'json'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            <svg className="inline-block mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            JSON Output
          </button>
        </div>
      </div>

      {/* Prompt List */}
      <div className="space-y-2">
        {filteredPrompts.map(prompt => (
          <button
            key={prompt.id}
            onClick={() => handleSelectPrompt(prompt)}
            className="w-full text-left p-3 rounded-lg border hover:border-indigo-300 hover:bg-indigo-50"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{prompt.name}</span>
              {(prompt.outputType === 'json' || prompt.outputType === 'both') && (
                <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                  <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  JSON
                </span>
              )}
            </div>
            {prompt.schemaType && (
              <p className="mt-1 text-xs text-gray-600">
                Schema: {prompt.schemaType}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 5.2 Prompt Library Admin Page Enhancement

```typescript
// src/app/(auth)/therapist/prompts/page.tsx
// Add JSON schema editor

import { JSONSchemaEditor } from '@/components/prompts/JSONSchemaEditor';

export default function PromptsPage() {
  return (
    <div>
      {/* Existing prompt management UI */}

      {/* When creating/editing a prompt */}
      <div className="space-y-4">
        {/* Output Type Selector */}
        <div>
          <label className="block text-sm font-medium mb-2">Output Type</label>
          <select
            value={outputType}
            onChange={(e) => setOutputType(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="text">Text</option>
            <option value="json">JSON</option>
            <option value="both">Both</option>
          </select>
        </div>

        {/* JSON Schema Editor (shown when outputType includes 'json') */}
        {(outputType === 'json' || outputType === 'both') && (
          <JSONSchemaEditor
            value={jsonSchema}
            onChange={setJsonSchema}
            schemaType={schemaType}
            onSchemaTypeChange={setSchemaType}
          />
        )}
      </div>
    </div>
  );
}
```

### 5.3 JSON Schema Editor Component

```typescript
// src/components/prompts/JSONSchemaEditor.tsx
'use client';

import { useState } from 'react';
import { JSONSchemaType } from '@/types/JSONSchemas';

interface JSONSchemaEditorProps {
  value: object | null;
  onChange: (schema: object) => void;
  schemaType: JSONSchemaType | null;
  onSchemaTypeChange: (type: JSONSchemaType) => void;
}

export function JSONSchemaEditor({
  value,
  onChange,
  schemaType,
  onSchemaTypeChange,
}: JSONSchemaEditorProps) {
  const [rawJSON, setRawJSON] = useState(JSON.stringify(value, null, 2) || '{}');
  const [error, setError] = useState<string | null>(null);

  const handleJSONChange = (newValue: string) => {
    setRawJSON(newValue);

    try {
      const parsed = JSON.parse(newValue);
      onChange(parsed);
      setError(null);
    } catch (e) {
      setError('Invalid JSON syntax');
    }
  };

  const loadTemplate = (type: JSONSchemaType) => {
    const templates = {
      scene_card: {
        type: 'object',
        properties: {
          video_introduction: { type: 'string' },
          patient_reflection_questions: { type: 'array', items: { type: 'string' } },
          group_reflection_questions: { type: 'array', items: { type: 'string' } },
          reference_images: { type: 'array', items: { type: 'object' } },
          music: { type: 'object' },
          assembly_steps: { type: 'array', items: { type: 'string' } },
          buttons: { type: 'array', items: { type: 'object' } },
        },
        required: ['video_introduction', 'patient_reflection_questions', 'reference_images', 'music', 'assembly_steps', 'buttons'],
      },
      music_generation: {
        type: 'object',
        properties: {
          instrumental_option: { type: 'object' },
          lyrical_option: { type: 'object' },
        },
        required: ['instrumental_option', 'lyrical_option'],
      },
      // Add other templates...
    };

    const template = templates[type];
    if (template) {
      setRawJSON(JSON.stringify(template, null, 2));
      onChange(template);
    }
  };

  return (
    <div className="space-y-4">
      {/* Schema Type Selector */}
      <div>
        <label className="block text-sm font-medium mb-2">Schema Type</label>
        <select
          value={schemaType || ''}
          onChange={(e) => {
            const type = e.target.value as JSONSchemaType;
            onSchemaTypeChange(type);
            loadTemplate(type);
          }}
          className="w-full rounded-lg border px-3 py-2"
        >
          <option value="">Select a schema type...</option>
          <option value="scene_card">Scene Card</option>
          <option value="music_generation">Music Generation</option>
          <option value="scene_suggestions">Scene Suggestions</option>
          <option value="image_references">Image References</option>
          <option value="reflection_questions">Reflection Questions</option>
          <option value="therapeutic_note">Therapeutic Note</option>
          <option value="quote_extraction">Quote Extraction</option>
        </select>
      </div>

      {/* JSON Editor */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">JSON Schema</label>
          {schemaType && (
            <button
              onClick={() => loadTemplate(schemaType)}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Load Template
            </button>
          )}
        </div>

        <textarea
          value={rawJSON}
          onChange={(e) => handleJSONChange(e.target.value)}
          rows={20}
          className={`w-full rounded-lg border px-3 py-2 font-mono text-sm ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter JSON schema..."
        />

        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>

      {/* Schema Preview */}
      <div className="rounded-lg bg-gray-50 p-4">
        <h4 className="text-sm font-semibold mb-2">Schema Preview</h4>
        <pre className="text-xs text-gray-700 overflow-auto max-h-64">
          {JSON.stringify(value, null, 2)}
        </pre>
      </div>
    </div>
  );
}
```

---

## 6. API Routes

### 6.1 Music Generation (Existing, Enhanced)

```typescript
// src/app/api/ai/generate-music/route.ts
// (Keep existing implementation from v1, no changes needed)
```

### 6.2 Scene Creation from JSON

```typescript
// src/app/api/scenes/route.ts

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);

  try {
    const user = await verifyIdToken(token);
    const body = await request.json();

    const schema = z.object({
      sessionId: z.string().uuid(),
      title: z.string(),
      description: z.string().optional(),
      sceneData: z.any(), // Full JSON data
      focusInstruction: z.string().optional(),
      keyQuote: z.string().optional(),
      therapeuticRationale: z.string().optional(),
      forPatient: z.string().optional(),
    });

    const validated = schema.parse(body);

    // Create scene record
    const [scene] = await db.insert(scenes).values({
      sessionId: validated.sessionId,
      therapistId: user.uid,
      title: validated.title,
      description: validated.description,
      sceneData: validated.sceneData, // Store full JSON
      focusInstruction: validated.focusInstruction,
      createdAt: new Date(),
    }).returning();

    return NextResponse.json({ scene });
  } catch (error) {
    console.error('Scene creation error:', error);
    return NextResponse.json({ error: 'Failed to create scene' }, { status: 500 });
  }
}
```

### 6.3 Reflection Questions

```typescript
// src/app/api/reflections/route.ts

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);

  try {
    const user = await verifyIdToken(token);
    const body = await request.json();

    const schema = z.object({
      sessionId: z.string().uuid(),
      patientQuestions: z.array(z.string()),
      groupQuestions: z.array(z.string()).optional(),
    });

    const validated = schema.parse(body);

    // Store as session metadata or separate reflection_questions table
    await db.update(sessions)
      .set({
        reflectionQuestions: {
          patient: validated.patientQuestions,
          group: validated.groupQuestions || [],
        },
      })
      .where(eq(sessions.id, validated.sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reflection save error:', error);
    return NextResponse.json({ error: 'Failed to save reflections' }, { status: 500 });
  }
}
```

---

## 7. System Prompts

### 7.1 Scene Card Generation Prompt

```typescript
// scripts/seed-scene-card-prompt.ts

const SCENE_CARD_PROMPT = {
  name: 'Generate Scene Card',
  category: 'creative',
  outputType: 'json',
  schemaType: 'scene_card',
  promptText: `
You are a therapeutic media assistant. Your job is to generate a therapeutic scene card in JSON that transforms a transcript excerpt into a symbolic 3-part sequence with reference images, copy-ready animation instructions, and music.

Inputs:
- patient_name: {patient_name}
- session_id: {session_id}
- transcript_text: {context}
- default_style: photorealistic
- focus_instruction: {focus_instruction}

**Core Content Generation Rules:**

1. **Video Introduction (patient-facing)**:
   - Generate 4–6 short paragraphs (1–3 sentences each).
   - Write as if addressing the patient directly, in warm plain language.
   - Use the following section headings in Markdown:
     - **What this shows** — describe the scene using ONLY the patient's own images/figures.
     - **Why it matters now** — link to their current concerns/goals.
     - **How to watch** — offer simple viewing guidance (vary each time: pace, pausing, breath, posture).
     - **What to notice** — list 2–4 specific anchors from the transcript. Quote at least one line verbatim.
     - **Choice point** — identify a precise moment where a different move could be imagined. Offer 1–2 alternative framings.
     - **If this feels like too much** — brief containment: pause, breathe, orient to the room, resume when ready.
   - Vary phrasing across cards.
   - Offer 2–3 possible interpretations; avoid single prescriptive reading.
   - End with: *"These are possible ways of seeing it, but the meaning is yours to decide."*

2. **Patient Reflection Questions:**
   - Generate 3-5 open-ended questions.
   - **CRITICAL:** Write directly to the patient using "you" and "your".
   - **NEVER** mention the patient's name (e.g., do NOT say "How did {patient_name} feel...").
   - Instead ask "How did you feel...".
   - Questions should help patient reflect on their own experience by relating to scene themes.

3. **Group Reflection Questions:**
   - Generate 3–5 questions if session is group context.
   - Otherwise return empty array.

**Rules for Fidelity:**
1. Always prioritize the focus_instruction if provided.
2. Use ONLY imagery, figures, and symbols from the transcript + focus_instruction.
   - **Literal Scenes:** Prioritize actual physical scenes described. If a concrete scene is explicitly described, **MUST adhere to that literal setting** for reference_images and animation_instructions across all 3 stages unless transcript explicitly shifts.
   - **Figurative Language:** Translate strong metaphors into visual elements within the established literal scene.
   - **Emotional/Abstract Concepts:** Only as last resort, symbolize abstract ideas if no direct scene or strong metaphor is present.
3. Derive the 3 stage_name values directly from transcript/focus (no generic "Resolution," "Growth").
4. Endings may remain unresolved. Do NOT force closure.
5. Include a patient_quote_anchor for each stage.
6. If multiple figures appear, include them where they appear; if transcript says they disappear, show that disappearance.

**Rules for Media Outputs:**
1. Generate reference images and music only. Videos created later.
2. Each of the 3 reference_images must have:
   - stage_name, title, image_prompt, meaning, patient_quote_anchor, animation_instructions

**Output Format:**
Return ONLY valid JSON (no markdown code blocks):

{
  "video_introduction": "...",
  "patient_reflection_questions": ["...", "...", "..."],
  "group_reflection_questions": [],
  "reference_images": [
    {
      "stage_name": "...",
      "title": "...",
      "image_prompt": "...",
      "meaning": "...",
      "patient_quote_anchor": "...",
      "animation_instructions": "..."
    },
    // 2 more stages
  ],
  "music": {
    "prompt": "...",
    "duration_seconds": 120,
    "instrument_focus": ["piano", "strings"],
    "progression_note": "..."
  },
  "assembly_steps": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ],
  "buttons": [
    {
      "label": "Generate All Images",
      "action": "generate_images",
      "group": "media",
      "style": "primary",
      "icon": "image"
    },
    {
      "label": "Generate Music",
      "action": "generate_music",
      "group": "media",
      "style": "secondary",
      "icon": "music"
    },
    {
      "label": "Create Scene",
      "action": "create_scene",
      "group": "assembly",
      "style": "primary",
      "icon": "film"
    }
  ]
}
  `.trim(),
  jsonSchema: {
    type: 'object',
    properties: {
      video_introduction: { type: 'string' },
      patient_reflection_questions: { type: 'array', items: { type: 'string' } },
      group_reflection_questions: { type: 'array', items: { type: 'string' } },
      reference_images: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            stage_name: { type: 'string' },
            title: { type: 'string' },
            image_prompt: { type: 'string' },
            meaning: { type: 'string' },
            patient_quote_anchor: { type: 'string' },
            animation_instructions: { type: 'string' },
          },
          required: ['stage_name', 'title', 'image_prompt', 'meaning', 'patient_quote_anchor', 'animation_instructions'],
        },
      },
      music: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          duration_seconds: { type: 'number' },
          segment_timing: { type: 'array', items: { type: 'number' } },
          fade_out: { type: 'boolean' },
          instrument_focus: { type: 'array', items: { type: 'string' } },
          progression_note: { type: 'string' },
        },
        required: ['prompt', 'duration_seconds'],
      },
      assembly_steps: { type: 'array', items: { type: 'string' } },
      buttons: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            action: { type: 'string' },
            group: { type: 'string' },
            style: { type: 'string' },
            data_key: { type: 'string' },
            icon: { type: 'string' },
          },
          required: ['label', 'action', 'group', 'style'],
        },
      },
    },
    required: ['video_introduction', 'patient_reflection_questions', 'reference_images', 'music', 'assembly_steps', 'buttons'],
  },
  isSystemPrompt: true,
};
```

### 7.2 Music Generation Prompt (from v1)

```typescript
// Keep existing music generation prompt from v1
```

### 7.3 Scene Suggestions Prompt

```typescript
const SCENE_SUGGESTIONS_PROMPT = {
  name: 'Suggest Therapeutic Scenes',
  category: 'analysis',
  outputType: 'json',
  schemaType: 'scene_suggestions',
  promptText: `
Analyze the following transcript and suggest potential therapeutic scenes for each participant.

For each scene suggestion:
- Identify key therapeutic moments
- Extract meaningful quotes
- Provide clear scene focus instructions
- Explain therapeutic rationale

Transcript:
{context}

Return JSON with structure:
{
  "potential_scenes_by_participant": [
    {
      "for_patient_name": "...",
      "scenes": [
        {
          "scene_title": "...",
          "scene_description": "...",
          "key_quote": "...",
          "therapeutic_rationale": "...",
          "scene_focus_instruction": "..."
        }
      ]
    }
  ]
}
  `.trim(),
  jsonSchema: {
    type: 'object',
    properties: {
      potential_scenes_by_participant: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            for_patient_name: { type: 'string' },
            scenes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  scene_title: { type: 'string' },
                  scene_description: { type: 'string' },
                  key_quote: { type: 'string' },
                  therapeutic_rationale: { type: 'string' },
                  scene_focus_instruction: { type: 'string' },
                },
                required: ['scene_title', 'scene_description', 'key_quote', 'therapeutic_rationale', 'scene_focus_instruction'],
              },
            },
          },
          required: ['for_patient_name', 'scenes'],
        },
      },
    },
    required: ['potential_scenes_by_participant'],
  },
  isSystemPrompt: true,
};
```

---

## 8. Implementation Steps

### Phase 1: Foundation (Week 1)

**Database & Types**
- [ ] Run database migrations for `ai_prompts` enhancement
- [ ] Update DrizzleORM schemas
- [ ] Create TypeScript types for JSON schemas
- [ ] Define schema-to-action mappings

**Utilities**
- [ ] Create `JSONSchemaDetector` utility
- [ ] Create `SchemaActions` config

### Phase 2: UI Components (Week 2)

**Core Components**
- [ ] Create `JSONOutputRenderer` component
- [ ] Create `JSONSchemaEditor` component
- [ ] Enhance `AIAssistantPanel` with JSON detection
- [ ] Enhance `AnalyzeSelectionModal` with output type filter

**Action Handlers**
- [ ] Implement `ACTION_HANDLERS` service
- [ ] Create handlers for each action type:
  - [ ] `handleCreateScene`
  - [ ] `handleGenerateImages`
  - [ ] `handleGenerateMusic`
  - [ ] `handleSaveReflections`
  - [ ] `handleGenerateInstrumental`
  - [ ] `handleGenerateLyrical`
  - [ ] `handleCreateScenesFromSuggestions`

### Phase 3: API & Prompts (Week 3)

**API Routes**
- [ ] Enhance `/api/scenes/route.ts` for JSON scene creation
- [ ] Create `/api/reflections/route.ts`
- [ ] Keep existing `/api/ai/generate-music/route.ts`

**System Prompts**
- [ ] Create and seed Scene Card prompt
- [ ] Create and seed Scene Suggestions prompt
- [ ] Update Music Generation prompt
- [ ] Test all prompts with real transcripts

### Phase 4: Prompt Library Admin (Week 3-4)

**Admin UI**
- [ ] Enhance Prompt Library page with JSON schema editor
- [ ] Add output type selector
- [ ] Add schema type selector with templates
- [ ] Add schema validation
- [ ] Test prompt creation/editing flow

### Phase 5: Testing & Polish (Week 4)

**Testing**
- [ ] Unit tests for schema detection
- [ ] Integration tests for each action handler
- [ ] E2E test for complete workflow
- [ ] Test batch operations (multiple images, scenes)
- [ ] Test error handling and edge cases

**Polish**
- [ ] Add loading states
- [ ] Improve error messages
- [ ] Add confirmation dialogs where needed
- [ ] Optimize performance
- [ ] Add analytics tracking

### Phase 6: Documentation & Launch (Week 4)

**Documentation**
- [ ] Update user guides
- [ ] Create video tutorials
- [ ] Document JSON schema format
- [ ] Document action handlers
- [ ] Update API documentation

**Launch**
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production
- [ ] Monitor for issues

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
// tests/utils/JSONSchemaDetector.test.ts
import { describe, it, expect } from 'vitest';
import { detectJSONSchema } from '@/utils/JSONSchemaDetector';

describe('JSON Schema Detector', () => {
  it('should detect scene_card schema', () => {
    const json = {
      video_introduction: 'Test',
      patient_reflection_questions: [],
      reference_images: [],
      music: {},
      assembly_steps: [],
      buttons: [],
    };

    const result = detectJSONSchema(JSON.stringify(json));
    expect(result.schemaType).toBe('scene_card');
  });

  it('should detect music_generation schema', () => {
    const json = {
      instrumental_option: {},
      lyrical_option: {},
    };

    const result = detectJSONSchema(JSON.stringify(json));
    expect(result.schemaType).toBe('music_generation');
  });

  it('should return null for non-JSON content', () => {
    const result = detectJSONSchema('This is plain text');
    expect(result).toBeNull();
  });
});
```

### 9.2 Integration Tests

```typescript
// tests/integration/json-actions.spec.ts
import { test, expect } from '@playwright/test';

test.describe('JSON Action Handlers', () => {
  test('should create scene from scene_card JSON', async ({ page }) => {
    // Navigate to transcript
    await page.goto('/sessions/test-session/transcript');

    // Trigger scene card generation
    // ... (select text, choose prompt)

    // Wait for JSON output
    await page.waitForSelector('text="Scene Card"');

    // Click "Create Scene" button
    await page.click('button:has-text("Create Scene")');

    // Wait for progress message
    await expect(page.locator('text="Creating scene..."')).toBeVisible();

    // Wait for completion
    await expect(page.locator('text="Scene created successfully"')).toBeVisible({ timeout: 10000 });
  });

  test('should generate batch images', async ({ page }) => {
    // ... similar flow for batch image generation
  });
});
```

### 9.3 E2E Tests

```typescript
// tests/e2e/json-workflow.e2e.ts
import { test, expect } from '@playwright/test';

test('complete JSON workflow: scene card generation to scene creation', async ({ page }) => {
  // Login
  await page.goto('/login');
  // ... login flow

  // Navigate to session
  await page.goto('/sessions/test-session/transcript');

  // Select transcript text
  // ... text selection

  // Open analyze modal
  await page.click('button:has-text("Analyze")');

  // Filter to JSON outputs
  await page.click('button:has-text("JSON Output")');

  // Select scene card prompt
  await page.click('text="Generate Scene Card"');

  // Wait for JSON response
  await page.waitForSelector('text="Scene Card"', { timeout: 30000 });

  // Generate images
  await page.click('button:has-text("Generate Reference Images")');
  await expect(page.locator('text="Generating image 1/3"')).toBeVisible();
  await expect(page.locator('text="Generated 3/3 images"')).toBeVisible({ timeout: 60000 });

  // Generate music
  await page.click('button:has-text("Generate Music")');
  await expect(page.locator('text="Music generated successfully"')).toBeVisible({ timeout: 180000 });

  // Create scene
  await page.click('button:has-text("Create Scene")');
  await expect(page.locator('text="Scene created successfully"')).toBeVisible();

  // Verify in scenes panel
  await page.click('text="Scenes"');
  await expect(page.locator('.scene-card').first()).toBeVisible();
});
```

---

## 10. Cost & Performance

### 10.1 Cost Optimization

**AI Prompt Costs:**
- Scene Card generation: ~$0.05 (GPT-4)
- Music generation: ~$0.06 per song (Suno API)
- Image generation: ~$0.04 per image (DALL-E 3)

**Optimization Strategies:**
- Cache repeated JSON outputs (same prompt + same text)
- Use GPT-3.5 for simpler JSON schemas
- Implement rate limiting per therapist
- Monitor and alert on high usage

### 10.2 Performance Optimization

**In-Chat Progress:**
- Use React state for immediate UI updates
- Debounce progress messages (max 1 per second)
- Batch multiple operations into single progress stream

**JSON Parsing:**
- Memoize schema detection results
- Cache action button configurations
- Lazy load action handlers

---

## 11. Security & Compliance

### 11.1 PHI Protection

**JSON Output Validation:**
- All JSON prompts MUST include PHI removal instructions
- Validate outputs for PHI before storing
- Implement automated PHI detection (names, dates, locations)

**Audit Logging:**
```typescript
await auditLog.create({
  action: 'json_output_generated',
  userId: therapist.id,
  sessionId: session.id,
  metadata: {
    schemaType,
    promptId,
    outputSize: JSON.stringify(jsonData).length,
  },
});
```

### 11.2 Data Retention

- JSON outputs stored in chat history
- Retain for 7 years (HIPAA compliance)
- Include in patient data export
- Implement deletion workflows

---

## 12. Monitoring & Analytics

### 12.1 Key Metrics

**Usage Metrics:**
- JSON prompts used per therapist per week
- Most popular JSON schema types
- Action button click rates
- Success/failure rates per action

**Performance Metrics:**
- Average JSON generation time
- Action processing time
- Batch operation completion rates

### 12.2 PostHog Events

```typescript
posthog.capture('json_prompt_selected', {
  schemaType,
  outputType,
});

posthog.capture('json_action_executed', {
  action,
  schemaType,
  batchSize,
});

posthog.capture('json_action_completed', {
  action,
  duration,
  success: true,
});
```

---

## 13. Future Enhancements

### Short-term (3 months)
- [ ] Custom JSON schema creation by therapists
- [ ] JSON output templates library
- [ ] Multi-step workflows (scene card → auto-generate all assets)
- [ ] JSON diff view (compare versions)

### Long-term (6-12 months)
- [ ] Visual JSON schema builder (drag-and-drop)
- [ ] AI-powered schema suggestions based on prompt text
- [ ] Shared JSON templates across organization
- [ ] JSON output versioning and rollback

---

## 14. Success Criteria

### Launch Criteria
- ✅ All core JSON schema types supported
- ✅ Action handlers working for each schema
- ✅ Output type filtering in prompt library
- ✅ In-chat progress updates functional
- ✅ PHI protection validated
- ✅ Documentation complete

### Adoption Metrics (30 days post-launch)
- [ ] 70% of therapists use at least one JSON prompt
- [ ] Average 3-5 JSON outputs per therapist per week
- [ ] 90% action success rate
- [ ] < 5% error rate
- [ ] User satisfaction > 4/5 stars

---

## 15. Appendix

### A. Environment Variables

No new environment variables needed beyond existing:
- `OPENAI_API_KEY`
- `SUNO_API_KEY`
- `DATABASE_URL`

### B. Migration Scripts

```bash
# Run migrations
npm run db:generate
npm run db:migrate

# Seed system prompts
npm run db:seed-prompts
```

### C. Dependencies

No new dependencies needed. Using existing:
- `lucide-react` (icons)
- `react-markdown` (markdown rendering)
- `zod` (validation)

---

**Document Version**: 2.0
**Last Updated**: 2025-11-25
**Author**: Development Team
**Status**: Ready for Implementation
