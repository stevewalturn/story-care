# Transcript Page Workspace Improvements Plan

**Date:** 2025-12-19
**Target Page:** `/sessions/[id]/transcript`
**Goal:** Achieve 1:1 match with workspace screenshots (17 images)

---

## Executive Summary

The current transcript page implementation is **~70% complete** compared to the workspace screenshots. The major gaps are:

1. **Generate Scene Workflow** (MISSING) - Complete feature for creating multi-scene compilations with music
2. **Enhanced Scene Card Rendering** (PARTIAL) - Structured therapeutic scene cards
3. **Image Generation Multi-Variations** (PARTIAL) - Generate and select from 4 variations
4. **UX Polish** (MINOR GAPS) - Context menus, styling improvements, better empty states

**Current Status:** Core transcript, AI assistant, and media library are solid. Missing scene generation workflow and enhancements.

---

## Screenshot Analysis Summary

### Workspaces 1-8: Generate Scene Flow
These screenshots show a **complete scene generation workflow** that doesn't exist in the current implementation:

- **Scene Composition Interface**: Horizontal layout with numbered scene cards (1, 2, 3)
- **Scene Cards**: Image/video preview, title, prompt, "Optimize" and settings buttons
- **Music Generation**: Waveform visualization, audio player with controls, regenerate option
- **Top Controls**: Patient selector, model selector (GPT-4.1), "Use Reference" toggle, preview button
- **Compilation**: "Compile" button → modal confirmation → timeline editing → video export
- **Animation Progress**: Shows "Animating Image" overlay with progress bar
- **Video Playback**: Generated videos have play button overlay with full controls

### Workspaces 9-12: Main Transcript Page Views
These show the **current 3-panel layout** with some enhancements:

- **3-Panel Layout**: Transcript (left), AI Assistant (center), Media Library (right) ✅
- **Collapsible Panels**: Can collapse to thin vertical bars ✅
- **Therapeutic Scene Card**: Structured JSON output with patient quote, meaning, image prompt, scene direction
- **Context Menu**: Inline popup menu for text selection actions (vs current modal)
- **Empty State**: Therapeutic Chat Assistant with categorized example prompts
- **Module Integration**: Shows module badge and dropdown selection ✅

### Workspaces 13-15: Image Generation Flow
Enhanced image generation modal:

- **Image Name Field**: Name the generated image
- **Multi-Variation Output**: Generate 4 variations in 2x2 grid
- **Individual Save Buttons**: Save specific variations
- **Regenerate Option**: Try again without closing modal
- **Model Metadata**: Descriptions and compatibility warnings
- **Success Toast**: "Image saved successfully!" notification

### Workspaces 16-17: Additional Views
- **Collapsed Panel State**: Shows vertical text labels "TRANSCRIPT", "LIBRARY"
- **Chat Assistant States**: Different empty states and prompt suggestions

---

## Feature Comparison Table

| Feature | Current | Screenshots | Gap | Priority |
|---------|---------|-------------|-----|----------|
| 3-panel layout | ✅ | ✅ | None | - |
| Transcript panel | ✅ | ✅ | Minor styling | LOW |
| AI chat | ✅ | ✅ | Empty state polish | LOW |
| Model selector | ✅ | ✅ | None | - |
| Media library | ✅ | ✅ | Minor features | LOW |
| Image generation | ✅ | ✅ Enhanced | Multi-variations | **MEDIUM** |
| **Scene generation page** | ❌ | ✅ | **Complete feature** | **HIGH** |
| **Scene cards** | ❌ | ✅ | **Complete component** | **HIGH** |
| **Music generation UI** | ❌ | ✅ | **Complete section** | **HIGH** |
| **Scene compilation** | ❌ | ✅ | **Complete workflow** | **HIGH** |
| **Therapeutic scene card renderer** | ⚠️ | ✅ | Structured fields | **MEDIUM** |
| Text selection context menu | ⚠️ Modal | ✅ Popup | UX improvement | MEDIUM |
| Reference image modal | ✅ | ✅ | None | - |

---

## Implementation Plan

### Phase 1: Scene Generation Workflow (HIGH PRIORITY)

**Objective:** Implement complete scene generation, music integration, and video compilation

#### 1.1 Create Generate Scene Page/Modal

**Location:** `/sessions/[id]/scenes/generate` or modal triggered from AI assistant

**New Files:**
```
src/app/(auth)/sessions/[id]/scenes/
├── generate/
│   ├── page.tsx                    # Main scene generation page
│   └── loading.tsx
src/components/scenes/
├── GenerateSceneLayout.tsx         # Main container with top bar and footer
├── SceneCard.tsx                   # Individual scene card component
├── SceneSequence.tsx               # Horizontal scene card manager
├── MusicGenerationPanel.tsx        # Bottom music section
├── SceneCompilationModal.tsx       # Compile confirmation
├── SceneTimelineEditor.tsx         # Edit clip times before export
└── SceneProgressOverlay.tsx        # "Animating Image" progress
```

**Component Structure:**

```typescript
// src/components/scenes/SceneCard.tsx
interface SceneCardProps {
  scene: {
    id: string;
    sequence: number;
    title: string;
    prompt: string;
    imageUrl?: string;
    videoUrl?: string;
    status: 'draft' | 'generating_image' | 'animating' | 'ready';
    metadata: {
      patientQuote?: string;
      meaning?: string;
      imageToScene?: string;
    };
  };
  onUpdate: (id: string, updates: Partial<Scene>) => void;
  onDelete: (id: string) => void;
  onOptimize: (id: string) => void;
}

// Features:
// - Numbered sequence badge (1, 2, 3)
// - Editable title
// - Image/video preview with play button
// - Prompt text display (collapsible)
// - "Optimize" button to enhance prompt
// - Settings icon (gear) for scene options
// - Delete icon (trash)
// - Progress overlay when generating
// - Video controls when ready
```

```typescript
// src/components/scenes/MusicGenerationPanel.tsx
interface MusicGenerationPanelProps {
  audioUrl?: string;
  waveformData?: number[];
  onGenerate: (prompt: string) => void;
  onRegenerate: () => void;
}

// Features:
// - "Generate Music Background" heading
// - Waveform visualization canvas
// - Audio controls: back, play/pause, 10x speed toggle, forward
// - Time display: current/total (0:00/3:10)
// - Download button
// - "Regenerate music" button
```

```typescript
// src/components/scenes/SceneCompilationModal.tsx
interface CompilationModalProps {
  scenes: Scene[];
  musicUrl?: string;
  onCancel: () => void;
  onEditTimeframe: () => void;
  onCompileNow: () => void;
}

// Features:
// - Play button icon
// - Explanation text
// - Three buttons: Cancel, Edit Timeframe, Compile now
```

#### 1.2 Top Control Bar

**Component:** `src/components/scenes/SceneGenerationTopBar.tsx`

**Features:**
- Patient selector dropdown (Floyd Miles)
- Model selector dropdown (GPT-4.1, Claude, etc.)
- "Use Reference" toggle with info icon
- Undo/Redo buttons (disabled initially)
- Preview button

#### 1.3 API Endpoints

**New Routes:**
```typescript
// src/app/api/scenes/generate/route.ts
POST /api/scenes/generate
Body: {
  sessionId: string;
  scenes: Array<{
    title: string;
    prompt: string;
    patientQuote?: string;
    meaning?: string;
  }>;
}
Response: { scenes: Scene[] }

// src/app/api/scenes/[id]/animate/route.ts
POST /api/scenes/[id]/animate
Body: { imageUrl: string }
Response: { videoUrl: string, status: 'processing' | 'ready' }

// src/app/api/scenes/compile/route.ts
POST /api/scenes/compile
Body: {
  sceneIds: string[];
  musicUrl?: string;
  timeline?: Array<{ sceneId: string; startTime: number; endTime: number }>;
}
Response: { compiledVideoUrl: string }

// src/app/api/scenes/music/route.ts
POST /api/scenes/music
Body: { prompt: string; duration: number }
Response: { audioUrl: string; waveform: number[] }
```

**Services:**
```typescript
// src/services/SceneService.ts
class SceneService {
  async generateScenes(sessionId: string, scenes: SceneInput[]): Promise<Scene[]>
  async animateImage(imageUrl: string): Promise<{ videoUrl: string }>
  async compileScenes(sceneIds: string[], options: CompileOptions): Promise<string>
  async generateMusic(prompt: string, duration: number): Promise<AudioData>
}
```

#### 1.4 Database Schema

```sql
-- Add to src/models/Schema.ts

export const scenes = pgTable('scenes', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  sequence: integer('sequence').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  prompt: text('prompt'),
  imageUrl: text('image_url'),
  videoUrl: text('video_url'),
  musicUrl: text('music_url'),
  status: varchar('status', { length: 50 }).default('draft'),
  metadata: jsonb('metadata'), // { patientQuote, meaning, imageToScene }
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const compiledScenes = pgTable('compiled_scenes', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id).notNull(),
  sceneIds: uuid('scene_ids').array(),
  compiledVideoUrl: text('compiled_video_url'),
  musicUrl: text('music_url'),
  durationSeconds: integer('duration_seconds'),
  timeline: jsonb('timeline'), // Array of { sceneId, startTime, endTime }
  status: varchar('status', { length: 50 }).default('processing'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

#### 1.5 Navigation Integration

**Update AI Assistant Panel:**
- Add "Generate Scenes" button in therapeutic scene card output
- When clicked, navigate to `/sessions/[id]/scenes/generate` with pre-populated scenes
- Or open scene generation modal

---

### Phase 2: Enhanced Scene Card Rendering (MEDIUM PRIORITY)

**Objective:** Render therapeutic scene cards with structured fields and actions

#### 2.1 Therapeutic Scene Card Schema

**File:** `src/components/transcript/TherapeuticSceneCardRenderer.tsx`

```typescript
interface TherapeuticSceneCard {
  type: 'therapeutic_scene_card';
  title: string;
  subtitle?: string; // "References images & animation"
  patient: string;
  sceneNumber: number;
  totalScenes: number;
  sections: {
    patientQuote: {
      icon: 'quote';
      label: 'Patient Quote Anchor';
      content: string;
    };
    meaning: {
      icon: 'lightbulb';
      label: 'Meaning';
      content: string;
    };
    imagePrompt: {
      icon: 'image';
      label: 'Image prompt';
      content: string;
    };
    imageToScene: {
      icon: 'play';
      label: 'Image to scene';
      content: string;
    };
  };
  status: 'pending' | 'completed';
  actions: {
    copy: boolean;
    download: boolean;
    like: boolean;
    refresh: boolean;
    more: boolean;
  };
}
```

**Features:**
- Patient name badge
- Scene navigation (1/3 with arrows)
- Structured sections with icons
- "Generate Completed" button (purple) when status is 'completed'
- Action bar: copy, download, thumbs up/down, refresh, more (...)
- Smooth transitions between scenes

#### 2.2 Update JSONOutputRenderer

**File:** `src/components/transcript/JSONOutputRenderer.tsx`

Add support for `therapeutic_scene_card` schema type:

```typescript
export function JSONOutputRenderer({ output }: { output: ChatMessage }) {
  const data = tryParseJSON(output.content);

  if (data?.type === 'therapeutic_scene_card') {
    return <TherapeuticSceneCardRenderer data={data} />;
  }

  // ... existing renderers
}
```

#### 2.3 AI Assistant Prompt Updates

Update module prompts to output therapeutic scene cards:

```typescript
// In module definition
{
  name: 'Potential Scenes',
  prompt: `Analyze the selected text and generate therapeutic scene cards.

  Output format:
  {
    "type": "therapeutic_scene_card",
    "title": "Scene Title",
    "patient": "Patient Name",
    "sceneNumber": 1,
    "totalScenes": 3,
    "sections": {
      "patientQuote": { "content": "..." },
      "meaning": { "content": "..." },
      "imagePrompt": { "content": "..." },
      "imageToScene": { "content": "..." }
    },
    "status": "pending"
  }`,
  outputType: 'json',
}
```

---

### Phase 3: Image Generation Improvements (MEDIUM PRIORITY)

**Objective:** Generate multiple variations and improve selection UX

#### 3.1 Update Generate Image Modal

**File:** `src/components/media/GenerateImageModal.tsx`

**New Features:**

1. **Add Image Name Field:**
```tsx
<div>
  <label>Image name</label>
  <Input
    value={imageName}
    onChange={(e) => setImageName(e.target.value)}
    placeholder="Alex's Perspective"
  />
</div>
```

2. **Generate 4 Variations:**
```tsx
const [variations, setVariations] = useState<string[]>([]);
const [selectedVariation, setSelectedVariation] = useState<number | null>(null);

const handleGenerate = async () => {
  const response = await fetch('/api/ai/generate-image-variations', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      model,
      referenceImages,
      count: 4, // Generate 4 variations
    }),
  });

  const data = await response.json();
  setVariations(data.imageUrls);
};
```

3. **Display Variations in 2x2 Grid:**
```tsx
{variations.length > 0 && (
  <div className="grid grid-cols-2 gap-4">
    {variations.map((url, index) => (
      <div key={index} className="relative group">
        <img src={url} alt={`Variation ${index + 1}`} />
        <Button
          onClick={() => handleSave(url, index)}
          className="absolute bottom-2 right-2"
        >
          Save
        </Button>
      </div>
    ))}
  </div>
)}
```

4. **Add Regenerate Button:**
```tsx
<Button onClick={handleRegenerate} variant="outline">
  Regenerate Images
</Button>
```

5. **Success Toast:**
```tsx
import { toast } from 'sonner';

const handleSave = async (url: string, index: number) => {
  await saveImage(url, imageName || `Variation ${index + 1}`);
  toast.success('Image saved successfully!');
};
```

#### 3.2 Model Metadata

**File:** `src/utils/ImageModels.ts`

```typescript
export const imageModels = [
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    description: 'Strong prompt adherence.',
    supportsReference: true,
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    description: 'Stylized, high-aesthetic.',
    supportsReference: false,
  },
  {
    id: 'stable-diffusion',
    name: 'Stable Diffusion (SDXL/SD3)',
    description: 'Open, customizable.',
    supportsReference: true,
  },
  {
    id: 'flux',
    name: 'Flux',
    description: 'Sharp photorealism.',
    supportsReference: true,
  },
  // ... more models
];
```

**Update Model Selector:**
```tsx
<Select value={model} onValueChange={setModel}>
  {imageModels.map((m) => (
    <SelectItem key={m.id} value={m.id}>
      <div>
        <div className="font-medium">{m.name}</div>
        <div className="text-xs text-gray-500">{m.description}</div>
        {!m.supportsReference && useReference && (
          <div className="text-xs text-amber-600 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            This model doesn't support reference images.
          </div>
        )}
      </div>
    </SelectItem>
  ))}
</Select>
```

#### 3.3 API Endpoint

**File:** `src/app/api/ai/generate-image-variations/route.ts`

```typescript
export async function POST(request: Request) {
  const { prompt, model, referenceImages, count = 4 } = await request.json();

  // Generate multiple variations in parallel
  const promises = Array.from({ length: count }, () =>
    generateImage(prompt, model, referenceImages)
  );

  const results = await Promise.all(promises);

  return NextResponse.json({
    imageUrls: results.map(r => r.url),
  });
}
```

---

### Phase 4: UX Polish (LOW PRIORITY)

**Objective:** Minor UI improvements and refinements

#### 4.1 Context Menu for Text Selection

**File:** `src/components/transcript/SelectionContextMenu.tsx`

Replace `AnalyzeSelectionModal` with inline context menu:

```typescript
interface SelectionContextMenuProps {
  position: { x: number; y: number };
  onClose: () => void;
  actions: Array<{
    label: string;
    onClick: () => void;
  }>;
}

export function SelectionContextMenu({ position, actions, onClose }: SelectionContextMenuProps) {
  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-xl border p-2 min-w-[250px]"
      style={{ top: position.y, left: position.x }}
    >
      <button
        onClick={onClose}
        className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1"
      >
        <X className="h-3 w-3" />
      </button>
      {actions.map((action, i) => (
        <button
          key={i}
          onClick={action.onClick}
          className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
```

**Update TranscriptPanel:**
```tsx
const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

const handleTextSelection = () => {
  const selection = window.getSelection();
  if (!selection || selection.toString().length === 0) return;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  setContextMenu({
    x: rect.left + rect.width / 2,
    y: rect.bottom + 10,
  });
};

// Add onMouseUp listener to transcript text
```

#### 4.2 Transcript Panel Styling

**File:** `src/components/transcript/TranscriptPanel.tsx`

**Updates:**
1. Purple instruction banner:
```tsx
<div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
  <p className="text-sm text-purple-900">
    Select text to analyze or generate content
  </p>
</div>
```

2. Participant count badge:
```tsx
<div className="flex items-center gap-2">
  {speakers.slice(0, 3).map(speaker => (
    <Avatar key={speaker.id} />
  ))}
  {speakers.length > 3 && (
    <div className="bg-gray-200 rounded-full h-8 w-8 flex items-center justify-center text-xs">
      +{speakers.length - 3}
    </div>
  )}
</div>
```

3. Session date/time:
```tsx
<div className="text-xs text-gray-500">
  {formatDate(session.sessionDate)} · {formatTime(session.duration)}
</div>
```

#### 4.3 Media Panel Enhancements

**File:** `src/components/library/LibraryPanel.tsx`

**Updates:**
1. Patient selector dropdown:
```tsx
<Select value={selectedPatient} onValueChange={setSelectedPatient}>
  <SelectTrigger>
    <SelectValue placeholder="Floyd Miles" />
  </SelectTrigger>
</Select>
```

2. Source filter:
```tsx
<Select value={sourceFilter} onValueChange={setSourceFilter}>
  <SelectItem value="all">All Sources</SelectItem>
  <SelectItem value="generated">Generated</SelectItem>
  <SelectItem value="uploaded">Uploaded</SelectItem>
</Select>
```

3. Music icon overlay:
```tsx
{item.type === 'audio' && (
  <div className="absolute top-2 right-2 bg-white rounded-full p-1">
    <Music className="h-4 w-4 text-purple-600" />
  </div>
)}
```

#### 4.4 Chat Empty State

**File:** `src/components/transcript/AIAssistantPanel.tsx`

**Updates:**
```tsx
<div className="text-center py-12">
  <div className="inline-flex items-center justify-center bg-purple-100 rounded-full p-4 mb-4">
    <MessageSquare className="h-8 w-8 text-purple-600" />
  </div>
  <h3 className="text-lg font-semibold mb-2">Therapeutic Chat Assistant</h3>
  <p className="text-sm text-gray-600 mb-6">
    Analyze transcripts, visualize metaphors, and generate therapeutic content
  </p>

  <div className="text-left max-w-md mx-auto space-y-4">
    <div>
      <p className="text-xs font-semibold text-gray-500 mb-2">For Analysis:</p>
      <div className="space-y-2">
        <button className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg">
          What are the key themes?
        </button>
        <button className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg">
          How is the patient progressing?
        </button>
      </div>
    </div>

    <div>
      <p className="text-xs font-semibold text-gray-500 mb-2">For Media:</p>
      <div className="space-y-2">
        <button className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg">
          Visualize the patient's metaphor
        </button>
        <button className="w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg">
          Generate potential scenes
        </button>
      </div>
    </div>
  </div>
</div>
```

---

## Implementation Checklist

### Phase 1: Scene Generation (HIGH)
- [ ] Create database schema for scenes and compiled_scenes
- [ ] Generate and run migration
- [ ] Create SceneService with generate, animate, compile methods
- [ ] Implement API routes:
  - [ ] POST /api/scenes/generate
  - [ ] POST /api/scenes/[id]/animate
  - [ ] POST /api/scenes/compile
  - [ ] POST /api/scenes/music
- [ ] Create UI components:
  - [ ] GenerateSceneLayout
  - [ ] SceneCard with progress overlay
  - [ ] SceneSequence (horizontal layout)
  - [ ] MusicGenerationPanel with waveform
  - [ ] SceneCompilationModal
  - [ ] SceneTimelineEditor
  - [ ] SceneGenerationTopBar
- [ ] Integrate video animation service (Stability AI, RunwayML, etc.)
- [ ] Integrate music generation (Suno, Udio, or ElevenLabs)
- [ ] Implement FFmpeg video compilation
- [ ] Add navigation from AI assistant to scene generation
- [ ] Test complete workflow end-to-end

### Phase 2: Scene Card Rendering (MEDIUM)
- [ ] Create TherapeuticSceneCardRenderer component
- [ ] Design structured layout with icons
- [ ] Implement scene navigation (1/3 with arrows)
- [ ] Add "Generate Completed" button state
- [ ] Add action bar (copy, download, like, refresh, more)
- [ ] Update JSONOutputRenderer to support scene cards
- [ ] Update module prompts to output scene card schema
- [ ] Test rendering in AI assistant panel

### Phase 3: Image Generation (MEDIUM)
- [ ] Add image name field to GenerateImageModal
- [ ] Update API to generate 4 variations
- [ ] Create 2x2 grid display
- [ ] Add individual save buttons
- [ ] Add regenerate button
- [ ] Implement success toast
- [ ] Create imageModels configuration with metadata
- [ ] Add model descriptions in selector
- [ ] Add compatibility warnings
- [ ] Test variation generation and saving

### Phase 4: UX Polish (LOW)
- [ ] Create SelectionContextMenu component
- [ ] Replace modal with context menu for text selection
- [ ] Update transcript panel instruction banner styling
- [ ] Add participant count badge
- [ ] Add session date/time display
- [ ] Add patient selector to media panel
- [ ] Add source filter (Generated/Uploaded)
- [ ] Add music icon overlays
- [ ] Improve chat empty state with categorized prompts
- [ ] Test all UI improvements

---

## Testing Strategy

### Unit Tests
- SceneCard component rendering
- MusicGenerationPanel controls
- TherapeuticSceneCardRenderer layout
- Image variation grid display

### Integration Tests
- Scene generation API flow
- Video animation processing
- Music generation and playback
- Scene compilation with timeline
- Image variation generation
- Context menu positioning

### E2E Tests
```typescript
// tests/e2e/scene-generation.e2e.ts
test('Generate scenes workflow', async ({ page }) => {
  // 1. Navigate to transcript page
  await page.goto('/sessions/[id]/transcript');

  // 2. Select text and choose "Potential Scenes"
  await page.selectText('therapeutic text');
  await page.click('button:has-text("Potential Scenes")');

  // 3. Click "Generate Scenes" button
  await page.click('button:has-text("Generate Scenes")');

  // 4. Verify scene generation page loads
  await expect(page).toHaveURL('/sessions/[id]/scenes/generate');

  // 5. Verify 3 scene cards appear
  await expect(page.locator('.scene-card')).toHaveCount(3);

  // 6. Generate music
  await page.click('button:has-text("Generate Music Background")');
  await expect(page.locator('audio')).toBeVisible();

  // 7. Compile scenes
  await page.click('button:has-text("Compile")');
  await page.click('button:has-text("Compile now")');

  // 8. Verify compilation starts
  await expect(page.locator('text=Compiling')).toBeVisible();
});
```

---

## Dependencies & Services

### New Dependencies
```json
{
  "dependencies": {
    "@wavesurfer/react": "^1.0.7",        // Waveform visualization
    "sonner": "^1.3.1",                   // Toast notifications (may exist)
    "ffmpeg-wasm": "^0.12.6"              // Video compilation (browser-based)
  }
}
```

### External Services
- **Video Animation**: Stability AI Video, RunwayML Gen-2, or Pika Labs
- **Music Generation**: Suno AI, Udio, or ElevenLabs Music
- **Video Compilation**: FFmpeg (via API or lambda function)

### Environment Variables
```bash
# Add to .env.local
STABILITY_VIDEO_API_KEY=...
RUNWAY_API_KEY=...
SUNO_API_KEY=...
ELEVENLABS_API_KEY=...
```

---

## Timeline Estimate

### Phase 1: Scene Generation (HIGH)
**Estimated Time:** 5-7 days
- Day 1: Database schema, migrations, API routes
- Day 2-3: Scene generation UI components
- Day 4: Music generation panel and waveform
- Day 5: Video animation integration
- Day 6: Scene compilation with FFmpeg
- Day 7: Testing and bug fixes

### Phase 2: Scene Card Rendering (MEDIUM)
**Estimated Time:** 2-3 days
- Day 1: TherapeuticSceneCardRenderer component
- Day 2: Integration with JSONOutputRenderer
- Day 3: Testing and refinements

### Phase 3: Image Generation (MEDIUM)
**Estimated Time:** 2-3 days
- Day 1: Multi-variation API and UI
- Day 2: Model metadata and warnings
- Day 3: Testing and polish

### Phase 4: UX Polish (LOW)
**Estimated Time:** 2-3 days
- Day 1: Context menu and transcript panel
- Day 2: Media panel and chat empty state
- Day 3: Final testing and refinements

**Total Estimated Time:** 11-16 days

---

## Success Criteria

### Functionality
- [ ] Can generate 3 scene cards from AI assistant
- [ ] Each scene card can have image generated or uploaded
- [ ] Images can be animated into videos
- [ ] Music can be generated with custom prompts
- [ ] Music has playable waveform with controls
- [ ] All scenes can be compiled into single video
- [ ] Timeline can be edited before compilation
- [ ] Compilation progress is visible
- [ ] Compiled video can be downloaded
- [ ] Image generation produces 4 variations
- [ ] Individual variations can be saved
- [ ] Therapeutic scene cards render correctly
- [ ] Context menu appears on text selection

### UI/UX
- [ ] Layout matches workspace screenshots 1:1
- [ ] Color scheme is consistent (purple/indigo)
- [ ] Typography and spacing match designs
- [ ] Animations are smooth (scene cards, modals)
- [ ] Loading states are clear
- [ ] Error messages are helpful
- [ ] Success feedback is immediate (toasts)
- [ ] Responsive on different screen sizes

### Performance
- [ ] Scene generation completes within 30 seconds
- [ ] Video animation completes within 2 minutes
- [ ] Music generation completes within 45 seconds
- [ ] Video compilation completes within 3 minutes
- [ ] Image variations generate within 20 seconds
- [ ] Waveform renders smoothly
- [ ] No UI blocking during async operations

---

## Risk Mitigation

### High Risk Areas

1. **Video Animation Service Integration**
   - **Risk:** External API reliability, cost
   - **Mitigation:** Implement retry logic, queue system, cost monitoring

2. **FFmpeg Video Compilation**
   - **Risk:** Server memory/CPU constraints
   - **Mitigation:** Use serverless functions (AWS Lambda), implement queuing

3. **Music Generation Quality**
   - **Risk:** AI-generated music may not fit therapeutic context
   - **Mitigation:** Allow custom music upload, provide prompt templates

4. **Large Video File Handling**
   - **Risk:** Storage costs, slow uploads/downloads
   - **Mitigation:** Compress videos, use streaming, implement CDN

### Medium Risk Areas

1. **Waveform Visualization Performance**
   - **Risk:** Large audio files slow rendering
   - **Mitigation:** Downsample waveform data, lazy load

2. **Multi-Variation Image Generation Cost**
   - **Risk:** 4x API calls increases cost
   - **Mitigation:** Add user preference for variation count, cache results

---

## Notes for Implementation

### Best Practices
1. **Modular Components**: Keep SceneCard, MusicPanel independent and reusable
2. **Progressive Enhancement**: Start with basic scene generation, add features incrementally
3. **Error Handling**: Wrap all AI/video API calls in try-catch with user feedback
4. **Loading States**: Show clear progress for long-running operations
5. **Accessibility**: Ensure keyboard navigation, ARIA labels, screen reader support
6. **Mobile Responsive**: Test scene generation on tablet/mobile (may need different layout)

### Code Quality
- Follow existing TypeScript patterns in codebase
- Use Zod schemas for API validation
- Add JSDoc comments for complex functions
- Write tests for critical paths (scene generation, compilation)
- Use existing UI components (Button, Modal, Input) for consistency

### Documentation
- Update CLAUDE.md with new scene generation workflow
- Document API endpoints in API documentation
- Add Storybook stories for new components
- Update PRD.md with implemented features

---

## Conclusion

This plan provides a comprehensive roadmap to bring the transcript page to 1:1 parity with the workspace screenshots. The phased approach allows for incremental delivery, with the highest priority features (scene generation) implemented first.

**Key Deliverables:**
1. **Complete scene generation workflow** (Workspaces 1-8)
2. **Enhanced scene card rendering** (Workspaces 9, 12)
3. **Improved image generation UX** (Workspaces 13-15)
4. **UI polish and refinements** (All workspaces)

**Next Steps:**
1. Review and approve this plan
2. Set up external service accounts (video, music APIs)
3. Begin Phase 1 implementation
4. Regular progress check-ins after each phase

---

**Document Version:** 1.0
**Last Updated:** 2025-12-19
**Author:** Development Team
**Status:** Ready for Implementation
