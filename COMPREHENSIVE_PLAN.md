# Music Generation Integration - Comprehensive Plan

## Executive Summary

This plan outlines the integration of Suno API music generation into the StoryCare platform. The feature will allow therapists to generate personalized, PHI-free instrumental and lyrical music based on therapeutic transcript content. The music generation will be triggered via JSON output from AI prompts in the transcript viewer chat interface.

**Key Features:**
- AI prompt library with JSON output mode for music generation
- Two music types: Instrumental and Lyrical
- PHI-free music generation with traceability
- Integration with existing transcript viewer workflow
- Patient music preference tracking
- Cost-effective generation (~$0.06 per song)

---

## 1. Architecture Overview

### 1.1 High-Level Flow

```
Therapist Selects Text → Opens Analyze Modal → Selects Music Prompt →
AI Generates JSON → UI Parses JSON → Therapist Reviews/Edits →
Generates Music via Suno API → Saves to Media Library
```

### 1.2 Component Architecture

```
TranscriptViewerClient
├── AIAssistantPanel (existing)
│   ├── Message rendering with JSON detection
│   └── JSON action buttons
├── AnalyzeSelectionModal (existing)
│   └── Enhanced with JSON output mode prompts
├── GenerateMusicModal (NEW)
│   ├── InstrumentalMusicForm
│   └── LyricalMusicForm
└── LibraryPanel (existing)
    └── Enhanced media display with music player
```

### 1.3 Data Flow

```
1. User selects transcript text
2. Opens Analyze Modal → Selects music generation prompt
3. AI Assistant receives prompt with JSON schema
4. AI returns structured JSON with instrumental + lyrical options
5. Chat UI detects JSON in response
6. Displays "Generate Music" action button
7. Opens GenerateMusicModal with pre-filled data
8. Therapist reviews/edits music parameters
9. Submits → API calls Suno → Saves to media library
10. Music appears in Library Panel with player
```

---

## 2. Database Schema Changes

### 2.1 New Tables

#### `music_preferences` (Patient Music Taste)
```sql
CREATE TABLE music_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preferred_genres TEXT[], -- Array of genre strings
  favorite_artists TEXT[], -- Array of artist names
  mood_preferences TEXT[], -- Array of mood descriptors
  generalized_taste TEXT, -- AI-processed general music taste
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `ai_prompts` Enhancement
Add a new field to track output type:
```sql
ALTER TABLE ai_prompts ADD COLUMN output_type VARCHAR(20) DEFAULT 'text';
-- Values: 'text', 'json', 'both'
```

#### `media_library` Enhancement
Add music-specific fields:
```sql
ALTER TABLE media_library
  ADD COLUMN music_metadata JSONB,
  ADD COLUMN suno_task_id VARCHAR(255),
  ADD COLUMN music_type VARCHAR(50), -- 'instrumental', 'lyrical'
  ADD COLUMN lyrics TEXT,
  ADD COLUMN style_prompt TEXT,
  ADD COLUMN source_quotes TEXT[],
  ADD COLUMN generation_rationale TEXT,
  ADD COLUMN persona_id VARCHAR(255);
```

### 2.2 DrizzleORM Schema Updates

```typescript
// src/models/Schema.ts

export const musicPreferences = pgTable('music_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  preferredGenres: text('preferred_genres').array(),
  favoriteArtists: text('favorite_artists').array(),
  moodPreferences: text('mood_preferences').array(),
  generalizedTaste: text('generalized_taste'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Update existing media_library table
export const mediaLibrary = pgTable('media_library', {
  // ... existing fields ...
  musicMetadata: jsonb('music_metadata'),
  sunoTaskId: varchar('suno_task_id', { length: 255 }),
  musicType: varchar('music_type', { length: 50 }),
  lyrics: text('lyrics'),
  stylePrompt: text('style_prompt'),
  sourceQuotes: text('source_quotes').array(),
  generationRationale: text('generation_rationale'),
  personaId: varchar('persona_id', { length: 255 }),
});

// Update ai_prompts table
export const aiPrompts = pgTable('ai_prompts', {
  // ... existing fields ...
  outputType: varchar('output_type', { length: 20 }).default('text'),
});
```

---

## 3. API Integration

### 3.1 Suno API Client

Create a new service: `src/libs/SunoAPI.ts`

```typescript
import { env } from '@/libs/Env';

export interface SunoGenerateParams {
  prompt?: string;
  style?: string;
  title?: string;
  customMode: boolean;
  instrumental: boolean;
  model: 'V3_5' | 'V4' | 'V4_5' | 'V4_5PLUS' | 'V5';
  personaId?: string;
  negativeTags?: string;
  vocalGender?: 'm' | 'f';
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
  callBackUrl?: string;
}

export interface SunoTaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

export interface SunoMusicDetails {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    tracks: Array<{
      id: string;
      title: string;
      audioUrl: string;
      streamUrl: string;
      duration: number;
      lyrics?: string;
      style?: string;
      createdAt: string;
    }>;
  };
}

class SunoAPIClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.sunoapi.org/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateMusic(params: SunoGenerateParams): Promise<SunoTaskResponse> {
    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Suno API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getTaskDetails(taskId: string): Promise<SunoMusicDetails> {
    const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Suno API error: ${response.statusText}`);
    }

    return response.json();
  }

  async pollUntilComplete(taskId: string, maxAttempts = 60, interval = 5000): Promise<SunoMusicDetails> {
    for (let i = 0; i < maxAttempts; i++) {
      const details = await this.getTaskDetails(taskId);

      if (details.data.status === 'completed') {
        return details;
      }

      if (details.data.status === 'failed') {
        throw new Error('Music generation failed');
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error('Music generation timeout');
  }
}

export const sunoAPI = new SunoAPIClient(env.SUNO_API_KEY);
```

### 3.2 API Routes

#### POST `/api/ai/generate-music`

```typescript
// src/app/api/ai/generate-music/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { sunoAPI } from '@/libs/SunoAPI';
import { db } from '@/libs/DB';
import { mediaLibrary } from '@/models/Schema';

const schema = z.object({
  sessionId: z.string().uuid(),
  musicType: z.enum(['instrumental', 'lyrical']),
  title: z.string().max(80),
  prompt: z.string().optional(),
  style: z.string().optional(),
  lyrics: z.string().optional(),
  model: z.enum(['V3_5', 'V4', 'V4_5', 'V4_5PLUS', 'V5']),
  instrumental: z.boolean(),
  mood: z.string().optional(),
  genreTags: z.string().optional(),
  stylePrompt: z.string().optional(),
  sourceQuotes: z.array(z.string()).optional(),
  rationale: z.string().optional(),
  personaId: z.string().optional(),
  negativeTags: z.string().optional(),
  vocalGender: z.enum(['m', 'f']).optional(),
  styleWeight: z.number().min(0).max(1).optional(),
  weirdnessConstraint: z.number().min(0).max(1).optional(),
  audioWeight: z.number().min(0).max(1).optional(),
});

export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);

  try {
    const user = await verifyIdToken(token);
    const body = await request.json();
    const validated = schema.parse(body);

    // Generate music with Suno API
    const sunoParams = {
      customMode: true,
      instrumental: validated.instrumental,
      model: validated.model,
      title: validated.title,
      style: validated.style,
      prompt: validated.lyrics || validated.prompt,
      personaId: validated.personaId,
      negativeTags: validated.negativeTags,
      vocalGender: validated.vocalGender,
      styleWeight: validated.styleWeight,
      weirdnessConstraint: validated.weirdnessConstraint,
      audioWeight: validated.audioWeight,
      callBackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/suno`,
    };

    const response = await sunoAPI.generateMusic(sunoParams);

    // Save initial record to database
    const [mediaRecord] = await db.insert(mediaLibrary).values({
      sessionId: validated.sessionId,
      therapistId: user.uid,
      mediaType: 'audio',
      title: validated.title,
      description: validated.rationale,
      tags: validated.genreTags?.split(',').map(t => t.trim()) || [],
      sourceType: 'ai_generated',
      sunoTaskId: response.data.taskId,
      musicType: validated.musicType,
      lyrics: validated.lyrics,
      stylePrompt: validated.stylePrompt,
      sourceQuotes: validated.sourceQuotes || [],
      generationRationale: validated.rationale,
      personaId: validated.personaId,
      musicMetadata: {
        mood: validated.mood,
        genre: validated.genreTags,
        model: validated.model,
      },
    }).returning();

    return NextResponse.json({
      success: true,
      taskId: response.data.taskId,
      mediaId: mediaRecord.id,
    });
  } catch (error) {
    console.error('Music generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate music' },
      { status: 500 }
    );
  }
}
```

#### POST `/api/webhooks/suno` (Callback Handler)

```typescript
// src/app/api/webhooks/suno/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { mediaLibrary } from '@/models/Schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskId, status, tracks } = body;

    if (status === 'completed' && tracks?.length > 0) {
      // Update database with completed music URLs
      await db
        .update(mediaLibrary)
        .set({
          mediaUrl: tracks[0].audioUrl,
          thumbnailUrl: tracks[0].coverUrl || null,
          metadata: {
            duration: tracks[0].duration,
            sunoTrackId: tracks[0].id,
            allTracks: tracks, // Suno generates 2 tracks per request
          },
          updatedAt: new Date(),
        })
        .where(eq(mediaLibrary.sunoTaskId, taskId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
```

#### GET `/api/ai/music-task/:taskId`

```typescript
// src/app/api/ai/music-task/[taskId]/route.ts
import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { sunoAPI } from '@/libs/SunoAPI';

export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);

  try {
    await verifyIdToken(token);
    const details = await sunoAPI.getTaskDetails(params.taskId);
    return NextResponse.json(details);
  } catch (error) {
    console.error('Task details error:', error);
    return NextResponse.json(
      { error: 'Failed to get task details' },
      { status: 500 }
    );
  }
}
```

#### Patient Music Preferences APIs

```typescript
// src/app/api/patients/[id]/music-preferences/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { db } from '@/libs/DB';
import { musicPreferences } from '@/models/Schema';
import { eq } from 'drizzle-orm';

const schema = z.object({
  preferredGenres: z.array(z.string()),
  favoriteArtists: z.array(z.string()),
  moodPreferences: z.array(z.string()),
  generalizedTaste: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);

  try {
    await verifyIdToken(token);
    const body = await request.json();
    const validated = schema.parse(body);

    const [preference] = await db
      .insert(musicPreferences)
      .values({
        patientId: params.id,
        ...validated,
      })
      .onConflictDoUpdate({
        target: musicPreferences.patientId,
        set: validated,
      })
      .returning();

    return NextResponse.json({ preference });
  } catch (error) {
    console.error('Music preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);

  try {
    await verifyIdToken(token);

    const [preference] = await db
      .select()
      .from(musicPreferences)
      .where(eq(musicPreferences.patientId, params.id));

    return NextResponse.json({ preference });
  } catch (error) {
    console.error('Music preferences error:', error);
    return NextResponse.json(
      { error: 'Failed to get preferences' },
      { status: 500 }
    );
  }
}
```

---

## 4. AI Prompt System Enhancement

### 4.1 Prompt Output Types

Update the prompt library to support different output modes:

```typescript
// src/types/StoryCare.ts

export type PromptOutputType = 'text' | 'json' | 'both';

export interface AIPrompt {
  id: string;
  name: string;
  promptText: string;
  category: string;
  outputType: PromptOutputType; // NEW
  jsonSchema?: object; // NEW - For validation
  isSystemPrompt: boolean;
  organizationId?: string;
  therapistId?: string;
}
```

### 4.2 Music Generation Prompt

Create a new system prompt for music generation:

```typescript
// scripts/seed-music-prompts.ts

const MUSIC_GENERATION_PROMPT = {
  name: 'Generate Music (Instrumental & Lyrical)',
  category: 'creative',
  outputType: 'json',
  promptText: `
You will receive either a short excerpt or a full session transcript. Your task is to transform the emotional content of this material into two music concepts: one instrumental and one lyrical. These must come ONLY from the specific emotional, symbolic, and psychological material present in the transcript. Do not add, infer, expand, or extrapolate beyond what is explicitly expressed.

Do not include any names, initials, ages, roles, dates, locations, institutions, program names, diagnoses, medications, substances, or any detail that could identify a person or setting. Do not mention therapy, clinicians, treatment, mental health, or biographical events. All creative output must be universal, metaphorical, and fully anonymized.

Absolutely no clichés. Unless explicitly used in the transcript, do NOT use storms, rain, sunshine, clouds, waves, oceans, drowning, fire, ashes, rebirth, phoenixes, angels, demons, battles, wars, chains, mountains, journeys, roads, paths, climbing, hearts breaking, being lost or found, "finding myself," inspirational language, redemption arcs, healing arcs, or generic emotional tropes. These are strictly prohibited.

Weather metaphors are prohibited unless explicitly present in the transcript. If the transcript contains weather imagery, reference it minimally and do not make it the central metaphor.

All metaphors must come directly from the symbolic logic of the transcript: the speaker's own imagery, contradictions, emotional tensions, identity dynamics, or unusual descriptions. When building metaphors, prioritize domains such as distortion, echo, vibration, fragmentation, duality, shifting shapes, internal architecture, tension, weight, stillness, repetition, geometry, shadow edges, refraction, layering, resonance, or multiplicity of self. Do not use inspirational, sentimental, or moralizing tone.

Instrumental option: Describe a purely instrumental piece using sensory, emotional, and symbolic language derived strictly from the transcript. Include tone, texture, pacing, motion, tension, release, and symbolic qualities. No vocals.

Lyrical option: Provide a short, abstract song concept and 16–28 lines of draft lyrics with 2–3 verses, 1–2 choruses, and optional bridge. Lyrics must be metaphorical, symbolic, non-cliché, and rooted only in themes present in the transcript. No literal events. No generic metaphors. No weather unless explicitly present. No inspirational or therapeutic tone.

Traceability is required. You must include:
- source_quotes: short PHI-free phrases or paraphrases taken directly from the transcript that influenced your creative decisions. These must contain no identifying information.
- rationale: a concise explanation mapping specific emotional or symbolic material from the transcript to your musical and lyrical choices.

Return ONLY valid JSON in the following format. DO NOT include markdown code blocks or any other text:

{
  "instrumental_option": {
    "music_description": "...",
    "mood": "calm, reflective",
    "genre_tags": "ambient, classical",
    "title": "...",
    "style_prompt": "...",
    "tempo_hint": "slow and spacious",
    "intensity_curve": "subtle beginning, gradual build, gentle release",
    "primary_instruments": "piano, soft strings, ambient pads",
    "symbolic_sources": ["fragmentation", "internal echo"],
    "source_quotes": ["feeling between two worlds", "quiet search for meaning"],
    "rationale": "..."
  },
  "lyrical_option": {
    "song_concept": "...",
    "suggested_lyrics": "...",
    "suggested_lyrical_themes": ["internal duality", "quiet resilience"],
    "mood": "hopeful, introspective",
    "genre_tags": "indie folk, spoken word",
    "title": "...",
    "style_prompt": "...",
    "vocal_feel": "intimate and confessional",
    "perspective": "first-person",
    "symbolic_sources": ["shifting identity", "echo"],
    "source_quotes": ["searching without defining", "carrying old hurt"],
    "rationale": "..."
  }
}

Transcript selection:
{context}
  `.trim(),
  jsonSchema: {
    type: 'object',
    properties: {
      instrumental_option: {
        type: 'object',
        required: [
          'music_description',
          'mood',
          'genre_tags',
          'title',
          'style_prompt',
          'source_quotes',
          'rationale'
        ],
      },
      lyrical_option: {
        type: 'object',
        required: [
          'song_concept',
          'suggested_lyrics',
          'suggested_lyrical_themes',
          'mood',
          'genre_tags',
          'title',
          'style_prompt',
          'source_quotes',
          'rationale'
        ],
      },
    },
    required: ['instrumental_option', 'lyrical_option'],
  },
  isSystemPrompt: true,
};
```

### 4.3 Seed Script Enhancement

```bash
npm run db:seed-music-prompts
```

---

## 5. UI Components

### 5.1 Enhanced AIAssistantPanel

Update to detect and render JSON responses:

```typescript
// src/app/(auth)/sessions/[id]/transcript/TranscriptViewerClient.tsx

// Inside AIAssistantPanel component

const isJSONResponse = (content: string): boolean => {
  try {
    const parsed = JSON.parse(content);
    return parsed.instrumental_option && parsed.lyrical_option;
  } catch {
    return false;
  }
};

const renderMessage = (message: Message) => {
  if (message.role === 'assistant') {
    if (isJSONResponse(message.content)) {
      const musicData = JSON.parse(message.content);
      return (
        <div className="space-y-4">
          <div className="rounded-lg bg-indigo-50 p-4">
            <h4 className="font-semibold text-indigo-900 mb-2">Music Generation Options</h4>
            <p className="text-sm text-indigo-700 mb-3">
              AI has generated two music concepts based on the selected transcript text.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleGenerateMusic('instrumental', musicData.instrumental_option)}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Generate Instrumental
              </button>
              <button
                onClick={() => handleGenerateMusic('lyrical', musicData.lyrical_option)}
                className="flex-1 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                Generate Lyrical Song
              </button>
            </div>
          </div>

          {/* Collapsible JSON view for therapist review */}
          <details className="rounded-lg border border-gray-200 p-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700">
              View Full JSON Response
            </summary>
            <pre className="mt-2 overflow-x-auto text-xs text-gray-600">
              {JSON.stringify(musicData, null, 2)}
            </pre>
          </details>
        </div>
      );
    }

    // Regular markdown rendering for text responses
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {message.content}
      </ReactMarkdown>
    );
  }

  return <p className="text-sm">{message.content}</p>;
};
```

### 5.2 New Component: GenerateMusicModal

```typescript
// src/components/sessions/GenerateMusicModal.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedPost } from '@/utils/AuthenticatedFetch';

interface MusicOption {
  music_description?: string;
  song_concept?: string;
  suggested_lyrics?: string;
  suggested_lyrical_themes?: string[];
  mood: string;
  genre_tags: string;
  title: string;
  style_prompt: string;
  tempo_hint?: string;
  intensity_curve?: string;
  primary_instruments?: string;
  vocal_feel?: string;
  perspective?: string;
  symbolic_sources: string[];
  source_quotes: string[];
  rationale: string;
}

interface GenerateMusicModalProps {
  isOpen: boolean;
  onClose: () => void;
  musicType: 'instrumental' | 'lyrical';
  musicData: MusicOption;
  sessionId: string;
  patientName: string;
  onSuccess?: () => void;
}

export function GenerateMusicModal({
  isOpen,
  onClose,
  musicType,
  musicData,
  sessionId,
  patientName,
  onSuccess,
}: GenerateMusicModalProps) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState(musicData.title);
  const [style, setStyle] = useState(musicData.genre_tags);
  const [mood, setMood] = useState(musicData.mood);
  const [lyrics, setLyrics] = useState(musicData.suggested_lyrics || '');
  const [stylePrompt, setStylePrompt] = useState(musicData.style_prompt);
  const [model, setModel] = useState<'V3_5' | 'V4' | 'V4_5' | 'V4_5PLUS' | 'V5'>('V4_5');
  const [vocalGender, setVocalGender] = useState<'m' | 'f' | undefined>(undefined);

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const response = await authenticatedPost('/api/ai/generate-music', user, {
        sessionId,
        musicType,
        title,
        style,
        lyrics: musicType === 'lyrical' ? lyrics : undefined,
        prompt: musicType === 'instrumental' ? musicData.music_description : undefined,
        model,
        instrumental: musicType === 'instrumental',
        mood,
        genreTags: style,
        stylePrompt,
        sourceQuotes: musicData.source_quotes,
        rationale: musicData.rationale,
        vocalGender: musicType === 'lyrical' ? vocalGender : undefined,
      });

      if (!response.ok) {
        throw new Error('Failed to generate music');
      }

      const data = await response.json();
      setTaskId(data.taskId);

      // Poll for completion
      pollMusicStatus(data.taskId);
    } catch (error) {
      console.error('Music generation error:', error);
      alert('Failed to generate music. Please try again.');
      setIsGenerating(false);
    }
  };

  const pollMusicStatus = async (id: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = setInterval(async () => {
      try {
        const response = await fetch(`/api/ai/music-task/${id}`, {
          headers: {
            'Authorization': `Bearer ${await user?.getIdToken()}`,
          },
        });

        const data = await response.json();

        if (data.data.status === 'completed') {
          clearInterval(poll);
          setIsGenerating(false);
          onSuccess?.();
          onClose();
        } else if (data.data.status === 'failed' || attempts >= maxAttempts) {
          clearInterval(poll);
          setIsGenerating(false);
          alert('Music generation failed or timed out.');
        }

        attempts++;
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(poll);
        setIsGenerating(false);
      }
    }, 5000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Generate {musicType === 'instrumental' ? 'Instrumental' : 'Lyrical'} Music
          </h2>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Patient Context */}
        <div className="mb-4 rounded-lg bg-indigo-50 p-3">
          <p className="text-sm text-indigo-900">
            Generating music for: <span className="font-semibold">{patientName}</span>
          </p>
        </div>

        {/* AI Rationale */}
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-900">AI Analysis</h3>
          <p className="mb-3 text-sm text-gray-700">{musicData.rationale}</p>

          {musicData.source_quotes.length > 0 && (
            <>
              <h4 className="mb-1 text-xs font-semibold text-gray-700">Source References:</h4>
              <ul className="list-inside list-disc space-y-1 text-xs text-gray-600">
                {musicData.source_quotes.map((quote, idx) => (
                  <li key={idx}>{quote}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              disabled={isGenerating}
            />
          </div>

          {/* Model Selection */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Model Version
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as any)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              disabled={isGenerating}
            >
              <option value="V5">V5 - Superior expression, fastest (up to 8 min)</option>
              <option value="V4_5PLUS">V4.5+ - Richer sound, new creation methods (up to 8 min)</option>
              <option value="V4_5">V4.5 - Superior blending, smarter prompts (up to 8 min)</option>
              <option value="V4">V4 - Best quality, refined structure (up to 4 min)</option>
              <option value="V3_5">V3.5 - Solid arrangements, creative (up to 4 min)</option>
            </select>
          </div>

          {/* Genre/Style */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Style / Genre Tags
            </label>
            <input
              type="text"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder="e.g., ambient, classical, cinematic"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              disabled={isGenerating}
            />
          </div>

          {/* Mood */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mood
            </label>
            <input
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="e.g., calm, reflective, uplifting"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              disabled={isGenerating}
            />
          </div>

          {/* Lyrical-specific fields */}
          {musicType === 'lyrical' && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Lyrics (Editable)
                </label>
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  rows={12}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:outline-none"
                  disabled={isGenerating}
                  placeholder="Edit the AI-generated lyrics..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Review and edit lyrics to ensure they are appropriate and PHI-free
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Vocal Gender (Optional)
                </label>
                <select
                  value={vocalGender || ''}
                  onChange={(e) => setVocalGender(e.target.value as 'm' | 'f' | undefined || undefined)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  disabled={isGenerating}
                >
                  <option value="">Auto</option>
                  <option value="m">Male</option>
                  <option value="f">Female</option>
                </select>
              </div>
            </>
          )}

          {/* Style Prompt (Advanced) */}
          <details className="rounded-lg border border-gray-200">
            <summary className="cursor-pointer p-3 text-sm font-medium text-gray-700">
              Advanced: Style Prompt
            </summary>
            <div className="p-3 pt-0">
              <textarea
                value={stylePrompt}
                onChange={(e) => setStylePrompt(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                disabled={isGenerating}
              />
            </div>
          </details>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <svg className="mr-2 inline-block h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              'Generate Music'
            )}
          </button>
        </div>

        {/* Generation Status */}
        {isGenerating && (
          <div className="mt-4 rounded-lg bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">Generating music...</p>
                <p className="text-xs text-blue-700">
                  Stream URL available in 30-40 seconds. Full download in 2-3 minutes.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 5.3 Enhanced LibraryPanel - Music Player

Update the media grid to include an audio player for music:

```typescript
// Inside LibraryPanel component in TranscriptViewerClient.tsx

{media.map(item => (
  <div key={item.id} className="...">
    {/* Existing thumbnail rendering */}

    {/* NEW: Audio player for music */}
    {item.mediaType === 'audio' && item.musicType && (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="rounded-full bg-purple-100 p-1.5">
            <svg className="h-4 w-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-purple-900">
            {item.musicType === 'instrumental' ? 'Instrumental' : 'Lyrical Song'}
          </span>
        </div>

        <audio src={item.mediaUrl} controls className="w-full" />

        {/* Lyrics display for lyrical songs */}
        {item.musicType === 'lyrical' && item.lyrics && (
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-medium text-purple-700">
              View Lyrics
            </summary>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-white p-3 text-xs text-gray-700">
              {item.lyrics}
            </pre>
          </details>
        )}

        {/* Source quotes */}
        {item.sourceQuotes && item.sourceQuotes.length > 0 && (
          <div className="mt-3">
            <p className="mb-1 text-xs font-semibold text-purple-900">
              Inspired by transcript themes:
            </p>
            <ul className="space-y-1 text-xs text-purple-700">
              {item.sourceQuotes.map((quote, idx) => (
                <li key={idx} className="flex items-start gap-1">
                  <span className="mt-1 h-1 w-1 flex-shrink-0 rounded-full bg-purple-400" />
                  <span>{quote}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}

    {/* Rest of existing code... */}
  </div>
))}
```

---

## 6. Patient Music Preferences UI

### 6.1 Add to Patient Profile Modal

```typescript
// src/components/patients/PatientModal.tsx

// Add new fields to the form:

<div className="mb-4">
  <label className="mb-2 block text-sm font-medium text-gray-700">
    Music Preferences
  </label>

  <div className="space-y-3">
    <div>
      <label className="mb-1 block text-xs text-gray-600">Favorite Genres</label>
      <input
        type="text"
        placeholder="e.g., Jazz, Classical, Hip-Hop"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </div>

    <div>
      <label className="mb-1 block text-xs text-gray-600">Favorite Artists/Bands</label>
      <input
        type="text"
        placeholder="e.g., Billie Eilish, Miles Davis"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </div>

    <div>
      <label className="mb-1 block text-xs text-gray-600">Preferred Moods</label>
      <input
        type="text"
        placeholder="e.g., Calm, Energetic, Melancholic"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  </div>

  <p className="mt-2 text-xs text-gray-500">
    This helps personalize music generation to match the patient's taste
  </p>
</div>
```

### 6.2 AI-Powered Music Taste Generalization

Create a background job to process music preferences into generalized style prompts:

```typescript
// src/services/MusicPreferenceService.ts

import { openai } from '@/libs/OpenAI';

export async function generalizeMusicalTaste(
  genres: string[],
  artists: string[],
  moods: string[]
): Promise<string> {
  const prompt = `
Based on these music preferences, create a concise musical style description:

Genres: ${genres.join(', ')}
Artists: ${artists.join(', ')}
Moods: ${moods.join(', ')}

Provide a 1-2 sentence description of musical elements, instrumentation, tempo, and emotional qualities this person likely enjoys. Focus on transferable qualities rather than specific artists or songs.

Example output: "Prefers atmospheric soundscapes with layered textures, often featuring piano or acoustic instruments. Gravitates toward introspective, melancholic tones with spacious arrangements and subtle dynamics."
  `.trim();

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 150,
  });

  return response.choices[0].message.content || '';
}
```

---

## 7. Implementation Steps

### Phase 1: Database & Backend (Week 1)
1. ✅ Create database migrations for new tables
2. ✅ Update DrizzleORM schemas
3. ✅ Create Suno API client (`src/libs/SunoAPI.ts`)
4. ✅ Implement API routes:
   - POST `/api/ai/generate-music`
   - POST `/api/webhooks/suno`
   - GET `/api/ai/music-task/:taskId`
   - POST/GET `/api/patients/:id/music-preferences`
5. ✅ Seed music generation prompt
6. ✅ Test API integration with Suno

### Phase 2: UI Components (Week 2)
1. ✅ Enhance `AIAssistantPanel` with JSON detection
2. ✅ Create `GenerateMusicModal` component
3. ✅ Update `LibraryPanel` with audio player
4. ✅ Add music preferences to `PatientModal`
5. ✅ Test end-to-end flow in UI

### Phase 3: Polish & Testing (Week 3)
1. ✅ Add loading states and progress indicators
2. ✅ Implement error handling
3. ✅ Add retry logic for failed generations
4. ✅ Create comprehensive tests
5. ✅ Performance optimization
6. ✅ Documentation

### Phase 4: Production Deployment (Week 4)
1. ✅ Environment variables setup
2. ✅ Monitoring and logging
3. ✅ Cost tracking
4. ✅ User acceptance testing
5. ✅ Launch

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// tests/services/SunoAPI.test.ts
import { describe, it, expect, vi } from 'vitest';
import { sunoAPI } from '@/libs/SunoAPI';

describe('Suno API Client', () => {
  it('should generate music successfully', async () => {
    const params = {
      customMode: true,
      instrumental: true,
      model: 'V4_5' as const,
      title: 'Test Track',
      style: 'ambient',
    };

    const response = await sunoAPI.generateMusic(params);
    expect(response.code).toBe(200);
    expect(response.data.taskId).toBeDefined();
  });

  it('should poll until completion', async () => {
    const taskId = 'test-task-id';
    const result = await sunoAPI.pollUntilComplete(taskId, 3, 1000);
    expect(result.data.status).toBe('completed');
  });
});
```

### 8.2 Integration Tests

```typescript
// tests/integration/music-generation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Music Generation', () => {
  test('should generate instrumental music from transcript', async ({ page }) => {
    await page.goto('/sessions/test-session-id/transcript');

    // Select text
    await page.locator('text="sample transcript text"').click();

    // Open analyze modal
    await page.locator('button:has-text("Analyze")').click();

    // Select music generation prompt
    await page.locator('text="Generate Music"').click();

    // Wait for AI response
    await page.waitForSelector('button:has-text("Generate Instrumental")');

    // Click generate
    await page.locator('button:has-text("Generate Instrumental")').click();

    // Verify modal opens
    await expect(page.locator('h2:has-text("Generate Instrumental Music")')).toBeVisible();

    // Fill form and submit
    await page.locator('button:has-text("Generate Music")').click();

    // Wait for completion
    await page.waitForSelector('text="Music generated successfully"', { timeout: 180000 });
  });
});
```

### 8.3 E2E Tests

```typescript
// tests/e2e/music-workflow.e2e.ts
import { test, expect } from '@playwright/test';

test('complete music generation workflow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[type="email"]', 'therapist@test.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button:has-text("Sign In")');

  // Navigate to session
  await page.goto('/sessions/test-session/transcript');

  // Generate music
  // ... (full workflow test)

  // Verify in library
  await page.click('text="Library"');
  await page.click('text="Media"');

  // Should see new music item
  await expect(page.locator('text="Instrumental"').first()).toBeVisible();

  // Should be able to play
  await page.locator('audio').first().click();
});
```

---

## 9. Cost Optimization

### 9.1 Suno API Pricing
- **Typical cost**: ~$0.06 per song (12 credits × $0.005)
- **Generated tracks**: 2 tracks per request
- **Credits needed**: 12 credits per generation

### 9.2 Cost Tracking

```typescript
// src/services/CostTrackingService.ts

export async function trackMusicGenerationCost(
  therapistId: string,
  sessionId: string,
  musicType: 'instrumental' | 'lyrical',
  credits: number = 12
) {
  const costPerCredit = 0.005;
  const totalCost = credits * costPerCredit;

  // Log to analytics
  await posthog.capture({
    distinctId: therapistId,
    event: 'music_generated',
    properties: {
      sessionId,
      musicType,
      credits,
      cost: totalCost,
      timestamp: new Date(),
    },
  });

  // Store in database for billing
  await db.insert(usageLogs).values({
    therapistId,
    sessionId,
    featureType: 'music_generation',
    credits,
    cost: totalCost,
  });
}
```

### 9.3 Rate Limiting

Implement rate limits to prevent excessive usage:

```typescript
// middleware.ts (enhance existing Arcjet config)

import { detectBot, shield, rateLimit } from '@arcjet/next';

export const config = {
  matcher: ['/api/ai/generate-music'],
};

const aj = arcjet({
  key: env.ARCJET_KEY,
  rules: [
    // Limit music generation to 10 per hour per user
    rateLimit({
      mode: 'LIVE',
      characteristics: ['userId'],
      max: 10,
      window: '1h',
    }),
  ],
});
```

---

## 10. Security & Compliance

### 10.1 PHI Protection

All music generation prompts MUST:
- ❌ NOT include patient names, ages, dates, locations
- ❌ NOT include clinical terms, diagnoses, medications
- ❌ NOT include biographical details
- ✅ Use metaphorical, symbolic language only
- ✅ Include source quote traceability (PHI-free)
- ✅ Require therapist review before generation

### 10.2 Audit Logging

```typescript
// Log all music generations
await auditLog.create({
  action: 'music_generated',
  userId: therapist.id,
  patientId: session.patientId,
  sessionId: session.id,
  metadata: {
    musicType,
    title,
    model,
    sunoTaskId,
  },
  timestamp: new Date(),
});
```

### 10.3 Data Retention

- Generated music files: 15 days on Suno servers
- Download and store in GCS immediately after generation
- Retain in media library indefinitely (or per org policy)
- Include in patient data export functionality

---

## 11. Monitoring & Analytics

### 11.1 Key Metrics

- Music generation success rate
- Average generation time
- User engagement with generated music
- Cost per generation
- Most popular music styles/genres
- Therapist satisfaction (NPS survey)

### 11.2 PostHog Events

```typescript
// Track key events
posthog.capture('music_prompt_selected', { promptType: 'music_generation' });
posthog.capture('music_generation_started', { musicType, model });
posthog.capture('music_generation_completed', { duration, cost });
posthog.capture('music_played', { musicId, musicType });
posthog.capture('music_shared_with_patient', { musicId, patientId });
```

### 11.3 Sentry Error Tracking

```typescript
// Capture errors
Sentry.captureException(error, {
  tags: {
    feature: 'music_generation',
    musicType,
    model,
  },
  extra: {
    taskId,
    sessionId,
    params,
  },
});
```

---

## 12. Future Enhancements

### 12.1 Short-term (Next 3 months)
- [ ] Persona creation from generated music
- [ ] Music style templates (save favorite styles)
- [ ] Batch music generation
- [ ] Music remixing/variations
- [ ] Integration with story pages (background music)

### 12.2 Long-term (6-12 months)
- [ ] Patient music playlist creation
- [ ] Music therapy protocols
- [ ] Collaborative playlists (group therapy)
- [ ] Music-triggered reflections
- [ ] Advanced analytics on music engagement

---

## 13. Documentation

### 13.1 User Documentation

Create guides for:
- How to generate music from transcripts
- Understanding music generation options
- Editing AI-generated lyrics
- Sharing music with patients
- Music preference setup

### 13.2 Developer Documentation

Update:
- API endpoint documentation
- Component architecture diagrams
- Database schema documentation
- Testing guidelines
- Deployment procedures

---

## 14. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| PHI leakage in lyrics | Critical | Low | Mandatory therapist review, AI prompt engineering, automated PHI detection |
| High generation costs | Medium | Medium | Rate limiting, usage monitoring, cost alerts |
| Poor music quality | Medium | Low | Model version selection, iterative prompting, user feedback |
| API downtime | Medium | Low | Fallback mechanisms, retry logic, status monitoring |
| Copyright issues | High | Very Low | All music is original AI-generated content |

---

## 15. Success Criteria

### Launch Criteria
- ✅ All API endpoints functional
- ✅ UI components complete and tested
- ✅ PHI protection verified
- ✅ Cost tracking implemented
- ✅ Error handling robust
- ✅ Documentation complete

### Adoption Metrics (30 days post-launch)
- [ ] 50% of active therapists try music generation
- [ ] Average 2-3 music generations per therapist per week
- [ ] 80% success rate (completed generations)
- [ ] Average user rating > 4/5 stars
- [ ] Cost per generation < $0.10

---

## 16. Timeline

| Phase | Duration | Start Date | End Date |
|-------|----------|------------|----------|
| Phase 1: Backend | 1 week | Week 1 | Week 1 |
| Phase 2: UI | 1 week | Week 2 | Week 2 |
| Phase 3: Testing | 1 week | Week 3 | Week 3 |
| Phase 4: Launch | 1 week | Week 4 | Week 4 |
| **Total** | **4 weeks** | | |

---

## 17. Appendix

### A. Environment Variables Checklist

```bash
# Suno API
SUNO_API_KEY=your_suno_api_key

# Existing (required)
OPENAI_API_KEY=...
FIREBASE_SERVICE_ACCOUNT_KEY=...
DATABASE_URL=...
NEXT_PUBLIC_APP_URL=...
```

### B. Migration Scripts

```sql
-- Run these migrations in order:
-- 1. migrations/001_add_music_preferences.sql
-- 2. migrations/002_enhance_media_library.sql
-- 3. migrations/003_update_ai_prompts.sql
```

### C. Seed Data

```bash
# Seed music generation prompts
npm run db:seed-music-prompts
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-25
**Author**: Development Team
**Status**: Ready for Implementation
