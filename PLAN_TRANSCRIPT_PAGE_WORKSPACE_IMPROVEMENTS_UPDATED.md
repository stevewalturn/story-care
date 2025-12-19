# Transcript Page Workspace Improvements Plan (UPDATED)

**Date:** 2025-12-19
**Target Page:** `/sessions/[id]/transcript`
**Goal:** Achieve 1:1 match with workspace screenshots (17 images)
**Status:** UPDATED after reviewing existing scene implementation

---

## Critical Discovery: Two Different Scene Workflows

After reviewing the existing codebase, I've discovered that **there are TWO different scene workflows**:

### 1. **Existing Scene Editor** (`/scenes` page) ✅ ALREADY EXISTS
- **Purpose:** Manual timeline-based video editing
- **Features:**
  - Drag-and-drop clip timeline
  - Patient-specific media library
  - Audio track management
  - Video assembly/export
  - Scene preview player
- **Components:** SceneTimeline, ClipLibrary, ScenePreviewPlayer
- **Database:** scenes, scene_clips, scene_audio_tracks tables ✅ EXIST
- **APIs:** Full CRUD + assembly endpoints ✅ EXIST

### 2. **AI-Driven Scene Generation** (Workspace screenshots 1-8) ❌ MISSING
- **Purpose:** Generate therapeutic scene cards from transcript analysis
- **Trigger:** From AI assistant when analyzing transcript text
- **Features:**
  - Horizontal scene card layout (not timeline)
  - AI-generated scene prompts and imagery
  - Music generation with waveform
  - "Compile" button to create final video
  - Patient reference images for consistency
  - Model selection (GPT-4, Claude, etc.)
- **Integration Point:** Starts from transcript page AI assistant
- **Workflow:** Transcript analysis → Scene cards → Generate images/videos → Add music → Compile

**Key Insight:** The workspace screenshots show the **AI-driven workflow**, not the existing manual editor. These are complementary features!

---

## Revised Implementation Status

### ✅ What Already Exists

#### Scene Management
- ✅ `scenes` table with full schema
- ✅ `scene_clips` table for timeline clips
- ✅ `scene_audio_tracks` table for multi-audio support
- ✅ Scene CRUD APIs (`/api/scenes/*`)
- ✅ Scene assembly/export API (`/api/scenes/[id]/assemble-async`)
- ✅ Video processing jobs with polling

#### Scene Editor UI
- ✅ `/scenes` page (manual editor)
- ✅ SceneTimeline component (drag-and-drop)
- ✅ ClipLibrary component (media browser)
- ✅ ScenePreviewPlayer component (draft preview)
- ✅ Patient selection
- ✅ Audio track management
- ✅ Video export with progress tracking

#### Transcript Page
- ✅ 3-panel layout (Transcript, AI Assistant, Media Library)
- ✅ Collapsible panels
- ✅ AI chat with module system
- ✅ Model selector
- ✅ Text selection for analysis
- ✅ JSON output rendering
- ✅ Media library integration

### ❌ What's Missing (Workspace Screenshots)

#### 1. AI Scene Generation Workflow (HIGH PRIORITY)
**Workspaces 1-8 show this completely new feature:**

**Missing Components:**
- Scene generation interface triggered from AI assistant
- Horizontal scene card layout (Scene 1, Scene 2, Scene 3)
- Scene cards with:
  - Generated image preview
  - Title (editable)
  - Prompt text (with "Optimize" button)
  - Settings/delete icons
  - Animation progress overlay
  - Video play controls when ready
- Music generation panel:
  - Waveform visualization
  - Audio player with controls (back, play, 10x speed, forward)
  - Time display
  - Download button
  - "Regenerate music" button
- Top control bar:
  - Patient selector dropdown
  - Model selector (GPT-4, Claude, etc.)
  - "Use Reference" toggle with modal
  - Preview button
  - Undo/redo buttons
- Scene compilation modal:
  - "Compile into one video" confirmation
  - Option to edit timeline before export
  - "Compile now" button
- Integration with existing `/scenes` editor (optional manual editing)

**Missing APIs:**
```typescript
POST /api/ai/generate-scenes          // Generate scene cards from transcript
POST /api/ai/optimize-prompt          // Optimize image/video prompts
POST /api/ai/generate-music           // Generate background music
POST /api/scenes/from-ai-generation   // Create scene from AI scene cards
```

**Flow:**
1. User selects text in transcript
2. Chooses "Potential Scenes" from context menu
3. AI generates 3 scene cards with structured data
4. Scene cards appear in AI assistant panel
5. Click "Generate Scenes" button → Opens scene generation interface
6. Each scene card can:
   - Generate image from prompt
   - Animate image to video
   - Optimize prompt
   - Edit title/content
7. Generate music for entire scene sequence
8. Preview draft or compile into final video
9. Compiled video can be further edited in `/scenes` editor

#### 2. Therapeutic Scene Card Renderer (MEDIUM PRIORITY)
**Workspaces 9, 12 show structured scene card output:**

**Missing:**
- TherapeuticSceneCardRenderer component
- Structured sections with icons:
  - Patient quote anchor (quote icon)
  - Meaning (lightbulb icon)
  - Image prompt (image icon)
  - Image to scene (play icon)
- Scene navigation (1/3 with arrows)
- "Generate Scenes" button at bottom
- Action bar (copy, download, like, refresh, more)

**Integration:**
- Extend JSONOutputRenderer to support `therapeutic_scene_card` schema
- Update AI module prompts to output this format

#### 3. Image Generation Improvements (MEDIUM PRIORITY)
**Workspaces 13-15 show enhanced image modal:**

**Missing:**
- Image name field
- Generate 4 variations in 2x2 grid
- Individual "Save" button on each variation
- "Regenerate Images" button
- Model descriptions in dropdown
- Compatibility warnings for reference images
- Success toast notifications

**Update:**
- GenerateImageModal component
- `/api/ai/generate-image-variations` endpoint (4 images)

#### 4. UX Polish (LOW PRIORITY)
**Various workspace screenshots:**

**Transcript Panel:**
- Purple instruction banner styling
- Participant count badge (+1)
- Session date/time display

**Media Panel:**
- Patient selector dropdown in header
- "All Sources" filter (Generated/Uploaded)
- Music icon overlay on audio thumbnails

**AI Assistant:**
- Better empty state with categorized prompts
- Context menu for text selection (inline popup vs modal)

---

## Revised Implementation Plan

### Phase 1: AI Scene Generation Workflow (HIGH PRIORITY)

**Estimated Time:** 7-9 days

#### Step 1.1: Scene Generation Interface (3 days)

**New Files:**
```
src/components/scenes-generation/
├── SceneGenerationLayout.tsx       # Main container
├── SceneCard.tsx                   # Individual scene card
├── SceneCardSequence.tsx           # Horizontal layout manager
├── SceneOptimizeModal.tsx          # Prompt optimization
├── SceneSettingsModal.tsx          # Scene-specific settings
└── SceneAnimationOverlay.tsx       # "Animating Image" progress
```

**SceneCard Features:**
- Numbered badge (1, 2, 3)
- Editable title
- Image/video preview
- Prompt display (expandable)
- "Optimize" button
- Settings gear icon
- Delete trash icon
- Progress states:
  - Draft (no image)
  - Generating image (spinner)
  - Animating (progress bar overlay)
  - Ready (play button on video)
- Video controls when ready

#### Step 1.2: Music Generation Panel (2 days)

**New Files:**
```
src/components/scenes-generation/
├── MusicGenerationPanel.tsx        # Main panel
├── WaveformVisualizer.tsx          # Canvas-based waveform
└── MusicControls.tsx               # Player controls
```

**Features:**
- "Generate Music Background" section at bottom
- Waveform canvas visualization
- Audio player controls:
  - Back 10s button
  - Play/Pause
  - 10x speed toggle
  - Forward 10s button
- Time display (0:00 / 3:10)
- Download button
- "Regenerate music" button

**Dependencies:**
```bash
npm install @wavesurfer/react
```

#### Step 1.3: Top Control Bar & Modals (1 day)

**New Files:**
```
src/components/scenes-generation/
├── SceneGenerationTopBar.tsx       # Top controls
├── PatientReferenceModal.tsx       # Reference images modal
└── SceneCompilationModal.tsx       # Compile confirmation
```

**Top Bar Features:**
- Patient selector dropdown
- Model selector (GPT-4.1, Claude, etc.)
- "Use Reference" toggle + info icon
- Undo/Redo buttons (disabled initially)
- Preview button

**Compilation Modal:**
- Play icon
- "You're about to combine all selected clips..."
- Cancel / Edit Timeframe / Compile now buttons

#### Step 1.4: API Endpoints (2 days)

**New Routes:**
```typescript
// src/app/api/ai/generate-scenes/route.ts
POST /api/ai/generate-scenes
Body: {
  transcriptSelection: string;
  patientId: string;
  model: string;
  useReference: boolean;
  referenceImages?: string[];
}
Response: {
  scenes: Array<{
    sequence: number;
    title: string;
    patientQuote: string;
    meaning: string;
    imagePrompt: string;
    imageToScene: string;
  }>
}

// src/app/api/ai/optimize-prompt/route.ts
POST /api/ai/optimize-prompt
Body: { prompt: string; model: string; context: string }
Response: { optimizedPrompt: string }

// src/app/api/ai/generate-music/route.ts
POST /api/ai/generate-music
Body: { prompt: string; duration: number; style?: string }
Response: { audioUrl: string; waveformData: number[] }

// src/app/api/scenes/from-ai/route.ts
POST /api/scenes/from-ai
Body: {
  patientId: string;
  scenes: Array<{
    title: string;
    prompt: string;
    imageUrl?: string;
    videoUrl?: string;
  }>;
  musicUrl?: string;
}
Response: { sceneId: string }
```

**Integration Services:**
- Music generation: Suno AI, Udio, or ElevenLabs Music API
- Waveform extraction: audio analysis library
- Scene assembly: Connect to existing `/api/scenes/[id]/assemble-async`

#### Step 1.5: Integration with Transcript Page (1 day)

**Updates to Existing Files:**
```
src/components/transcript/
├── AIAssistantPanel.tsx            # Add "Generate Scenes" navigation
└── JSONOutputRenderer.tsx          # Render scene cards

src/app/(auth)/sessions/[id]/transcript/
└── page.tsx                         # Add scene generation modal
```

**Flow:**
1. User sees therapeutic scene card in AI assistant
2. Clicks "Generate Scenes" button
3. Opens SceneGenerationLayout modal/overlay
4. Pre-populated with AI-generated scene data
5. User can generate images, animate, add music
6. Compile → Creates scene in database
7. Option to continue editing in `/scenes` editor

---

### Phase 2: Therapeutic Scene Card Renderer (MEDIUM PRIORITY)

**Estimated Time:** 2-3 days

#### Step 2.1: Scene Card Component (1.5 days)

**New File:**
```
src/components/transcript/TherapeuticSceneCardRenderer.tsx
```

**Schema:**
```typescript
interface TherapeuticSceneCard {
  type: 'therapeutic_scene_card';
  title: string;
  subtitle?: string; // "References images & animation"
  patient: string;
  sceneNumber: number;
  totalScenes: number;
  sections: {
    patientQuote: { label: string; content: string };
    meaning: { label: string; content: string };
    imagePrompt: { label: string; content: string };
    imageToScene: { label: string; content: string };
  };
  status: 'pending' | 'completed';
}
```

**Features:**
- Patient name badge
- Scene navigation (← 1/3 →)
- Icon-labeled sections:
  - 💬 Patient Quote Anchor
  - 💡 Meaning
  - 🖼️ Image prompt
  - ▶️ Image to scene
- "Generate Scenes" button (purple) when ready
- Action bar:
  - Copy button
  - Download button
  - Thumbs up/down
  - Refresh button
  - More (⋯) button

#### Step 2.2: Update Module Prompts (0.5 days)

**Files to Update:**
```
src/app/api/modules/[moduleId]/prompts/
```

Update "Potential Scenes" prompt to output therapeutic scene card schema.

#### Step 2.3: Integration & Testing (1 day)

- Update JSONOutputRenderer to detect and render scene cards
- Test in AI assistant panel
- Verify navigation between scenes
- Test "Generate Scenes" button integration

---

### Phase 3: Image Generation Improvements (MEDIUM PRIORITY)

**Estimated Time:** 2-3 days

#### Step 3.1: Multi-Variation Support (1.5 days)

**Update File:**
```
src/components/media/GenerateImageModal.tsx
```

**Changes:**
1. Add image name field
2. Request 4 variations from API
3. Display in 2x2 grid
4. Individual "Save" button per variation
5. "Regenerate Images" button
6. Success toast on save

**New API:**
```typescript
// src/app/api/ai/generate-image-variations/route.ts
POST /api/ai/generate-image-variations
Body: {
  prompt: string;
  model: string;
  referenceImages?: string[];
  count: 4;
}
Response: { imageUrls: string[] }
```

#### Step 3.2: Model Metadata (0.5 days)

**New File:**
```
src/config/ImageModels.ts
```

**Model Data:**
```typescript
export const imageModels = [
  { id: 'dall-e-3', name: 'DALL-E 3', description: 'Strong prompt adherence.', supportsReference: true },
  { id: 'midjourney', name: 'Midjourney', description: 'Stylized, high-aesthetic.', supportsReference: false },
  { id: 'stable-diffusion', name: 'Stable Diffusion', description: 'Open, customizable.', supportsReference: true },
  { id: 'flux', name: 'Flux', description: 'Sharp photorealism.', supportsReference: true },
  // ... more models
];
```

**Update model selector to show:**
- Model name
- Description
- Warning icon if incompatible with reference images

#### Step 3.3: Toast Notifications (0.5 days)

Install and configure:
```bash
npm install sonner
```

Add success/error toasts for image operations.

---

### Phase 4: UX Polish (LOW PRIORITY)

**Estimated Time:** 2-3 days

#### 4.1 Transcript Panel Updates (0.5 days)

**Updates to:**
```
src/components/transcript/TranscriptPanel.tsx
```

- Purple instruction banner: "Select text to analyze or generate content"
- Participant count badge (+1 indicator)
- Session date/time display above audio player

#### 4.2 Media Panel Updates (0.5 days)

**Updates to:**
```
src/components/library/LibraryPanel.tsx
```

- Add patient selector dropdown in header
- Add "All Sources" filter (Generated/Uploaded)
- Add music icon overlay on audio thumbnails

#### 4.3 AI Assistant Empty State (0.5 days)

**Updates to:**
```
src/components/transcript/AIAssistantPanel.tsx
```

- Chat icon with background circle
- Categorized example prompts:
  - "For Analysis:" section
  - "For Media:" section
- Better visual hierarchy

#### 4.4 Context Menu (1 day)

**New Component:**
```
src/components/transcript/SelectionContextMenu.tsx
```

Replace `AnalyzeSelectionModal` with inline popup menu that appears near text selection.

**Features:**
- Positioned near selected text
- List of action options
- X button to dismiss
- Smooth fade-in animation

---

## Updated Database Schema

### No changes needed! ✅

The existing schema already supports the AI scene generation workflow:

```sql
-- EXISTING TABLES (already in database)

scenes (
  id, patientId, createdByTherapistId,
  title, description,
  videoUrl, assembledVideoUrl, thumbnailUrl,
  durationSeconds, backgroundAudioUrl,
  loopAudio, fitAudioToDuration,
  status, processingError,
  createdAt, updatedAt
)

scene_clips (
  id, sceneId, mediaId,
  sequenceNumber, startTimeSeconds, endTimeSeconds,
  createdAt
)

scene_audio_tracks (
  id, sceneId, audioId, audioUrl, title,
  startTimeSeconds, durationSeconds,
  volume, sequenceNumber,
  createdAt
)
```

**How AI-generated scenes map to existing schema:**

1. **AI generates scene cards** → Stored temporarily in component state
2. **User generates images/videos** → Saved to `media_library`
3. **User compiles** → Creates `scenes` record + `scene_clips` entries
4. **Music added** → Creates `scene_audio_tracks` entry
5. **Export** → Uses existing assembly API

**Optional enhancement:** Add metadata field to scenes table:
```sql
ALTER TABLE scenes ADD COLUMN ai_metadata JSONB;

-- Store: { originalPrompts, therapeuticContext, patientQuotes, etc. }
```

---

## Implementation Checklist

### Phase 1: AI Scene Generation ⏳
- [ ] Create SceneGenerationLayout component
- [ ] Create SceneCard component with all states
- [ ] Create SceneCardSequence for horizontal layout
- [ ] Create WaveformVisualizer component
- [ ] Create MusicGenerationPanel component
- [ ] Create SceneGenerationTopBar component
- [ ] Create PatientReferenceModal component
- [ ] Create SceneCompilationModal component
- [ ] Implement POST /api/ai/generate-scenes
- [ ] Implement POST /api/ai/optimize-prompt
- [ ] Implement POST /api/ai/generate-music
- [ ] Implement POST /api/scenes/from-ai
- [ ] Integrate music generation service (Suno/Udio/ElevenLabs)
- [ ] Extract waveform data from generated audio
- [ ] Add "Generate Scenes" button to scene card in AI assistant
- [ ] Connect to existing scene assembly API
- [ ] Test full workflow end-to-end

### Phase 2: Scene Card Renderer ⏳
- [ ] Create TherapeuticSceneCardRenderer component
- [ ] Design icon-labeled sections layout
- [ ] Implement scene navigation (1/3 arrows)
- [ ] Add "Generate Scenes" button
- [ ] Create action bar (copy, download, like, etc.)
- [ ] Update JSONOutputRenderer to support scene cards
- [ ] Update "Potential Scenes" module prompt
- [ ] Test rendering in AI assistant panel

### Phase 3: Image Improvements ⏳
- [ ] Add image name field to GenerateImageModal
- [ ] Implement 4-variation generation API
- [ ] Create 2x2 grid display
- [ ] Add individual save buttons
- [ ] Add "Regenerate Images" button
- [ ] Create ImageModels config with metadata
- [ ] Add model descriptions to selector
- [ ] Add compatibility warnings
- [ ] Install and configure sonner for toasts
- [ ] Test variation generation and saving

### Phase 4: UX Polish ⏳
- [ ] Update transcript panel instruction banner
- [ ] Add participant count badge
- [ ] Add session date/time display
- [ ] Add patient selector to media panel
- [ ] Add source filter to media panel
- [ ] Add music icon overlays
- [ ] Improve AI assistant empty state
- [ ] Create SelectionContextMenu component
- [ ] Replace modal with context menu
- [ ] Test all UI improvements

---

## Key Architecture Decisions

### 1. Scene Generation Flow

**Option A: Modal Overlay (Recommended)**
- Opens as full-screen modal from AI assistant
- User completes scene generation in modal
- On compile, closes modal and creates scene
- User can optionally edit in `/scenes` page

**Option B: Separate Page**
- Navigate to `/sessions/[id]/scenes/generate`
- Dedicated page for scene generation
- On compile, redirects to `/scenes`

**Decision:** Use **Option A (Modal)** for smoother UX and faster iteration.

### 2. Data Flow

```
Transcript Analysis
    ↓
AI generates scene card JSON
    ↓
User clicks "Generate Scenes"
    ↓
SceneGenerationLayout modal opens
    ↓
User generates images/videos/music
    ↓
User clicks "Compile"
    ↓
POST /api/scenes/from-ai
    ↓
Creates scene + scene_clips + scene_audio_tracks
    ↓
POST /api/scenes/[id]/assemble-async
    ↓
Video assembly job runs
    ↓
Compiled video saved to scenes.assembledVideoUrl
    ↓
Optional: Navigate to /scenes for manual editing
```

### 3. Music Generation

**Service Options:**
1. **Suno AI** (Recommended)
   - High-quality music generation
   - Custom prompts
   - Variable duration
   - Waveform extraction needed

2. **Udio**
   - Alternative to Suno
   - Similar features

3. **ElevenLabs Music API**
   - Simpler integration
   - Limited customization

**Waveform Extraction:**
```typescript
// Use @wavesurfer/react for visualization
import WaveSurfer from 'wavesurfer.js';

const waveform = WaveSurfer.create({
  container: '#waveform',
  waveColor: '#9333ea',
  progressColor: '#6366f1',
});

waveform.load(audioUrl);
```

---

## Testing Strategy

### Unit Tests
- SceneCard component states (draft, generating, animating, ready)
- WaveformVisualizer rendering
- TherapeuticSceneCardRenderer layout
- Image variation grid display

### Integration Tests
- Scene generation API flow
- Music generation and waveform extraction
- Image-to-video animation
- Scene compilation with audio tracks

### E2E Tests
```typescript
test('AI scene generation workflow', async ({ page }) => {
  // 1. Navigate to transcript
  await page.goto('/sessions/[id]/transcript');

  // 2. Select text
  await page.selectText('therapeutic content');

  // 3. Choose "Potential Scenes"
  await page.click('button:has-text("Potential Scenes")');

  // 4. Wait for AI response
  await page.waitForSelector('[data-testid="therapeutic-scene-card"]');

  // 5. Click "Generate Scenes"
  await page.click('button:has-text("Generate Scenes")');

  // 6. Verify modal opens
  await expect(page.locator('[data-testid="scene-generation-modal"]')).toBeVisible();

  // 7. Generate image for first scene
  await page.click('[data-testid="scene-card-1"] button:has-text("Generate Image")');

  // 8. Wait for image generation
  await page.waitForSelector('[data-testid="scene-card-1"] img');

  // 9. Generate music
  await page.click('button:has-text("Generate Music Background")');
  await page.waitForSelector('[data-testid="waveform"]');

  // 10. Compile
  await page.click('button:has-text("Compile")');
  await page.click('button:has-text("Compile now")');

  // 11. Verify scene created
  await page.waitForSelector('text=Video assembly started');
});
```

---

## Timeline Estimate (Revised)

### Phase 1: AI Scene Generation
- **Days 1-3:** Scene generation UI components
- **Days 4-5:** Music generation panel + waveform
- **Day 6:** Top bar, modals, controls
- **Days 7-8:** API endpoints and service integration
- **Day 9:** Integration with transcript page and testing

**Subtotal: 9 days**

### Phase 2: Scene Card Renderer
- **Days 1-1.5:** TherapeuticSceneCardRenderer component
- **Day 1.5-2:** Module prompt updates
- **Days 2-3:** Integration and testing

**Subtotal: 3 days**

### Phase 3: Image Improvements
- **Days 1-1.5:** Multi-variation support
- **Days 1.5-2:** Model metadata and UI
- **Days 2-2.5:** Toast notifications
- **Days 2.5-3:** Testing

**Subtotal: 3 days**

### Phase 4: UX Polish
- **Day 1:** Transcript and media panel updates
- **Day 2:** AI assistant empty state
- **Day 3:** Context menu component

**Subtotal: 3 days**

---

**Total Estimated Time: 18 days**

---

## Success Criteria

### Functionality
- [ ] AI can generate 3 therapeutic scene cards from transcript selection
- [ ] Scene cards display in horizontal layout with all metadata
- [ ] Each scene can generate image from prompt
- [ ] Images can be animated into videos
- [ ] Music can be generated with custom prompts
- [ ] Waveform visualizes correctly with playback controls
- [ ] Scenes can be compiled into single video
- [ ] Compilation uses existing assembly API
- [ ] Compiled scenes appear in `/scenes` library
- [ ] Image generation produces 4 selectable variations
- [ ] Therapeutic scene cards render with structured sections
- [ ] Context menu appears on text selection

### UI/UX
- [ ] Layout matches workspace screenshots 1:1
- [ ] Scene cards match workspace design (spacing, colors, icons)
- [ ] Music panel matches workspace waveform style
- [ ] Top control bar matches workspace layout
- [ ] Compilation modal matches workspace design
- [ ] Image modal shows 2x2 grid for variations
- [ ] Animations are smooth (scene transitions, modals)
- [ ] Loading states are clear with spinners/progress
- [ ] Success/error feedback via toasts
- [ ] Responsive on tablet/desktop

### Performance
- [ ] Scene generation completes within 15 seconds
- [ ] Image generation (4 variations) completes within 30 seconds
- [ ] Music generation completes within 60 seconds
- [ ] Waveform renders smoothly without lag
- [ ] Video animation request submitted successfully
- [ ] No UI blocking during async operations

---

## Risk Mitigation

### High Risk

1. **Music Generation Service Integration**
   - **Risk:** API reliability, quality, cost
   - **Mitigation:**
     - Start with ElevenLabs Music (simpler)
     - Fallback to music library upload
     - Implement retry logic

2. **Waveform Visualization Performance**
   - **Risk:** Large audio files slow rendering
   - **Mitigation:**
     - Downsample waveform data on backend
     - Use Web Audio API for analysis
     - Lazy load waveform component

3. **Scene Compilation Coordination**
   - **Risk:** Complex orchestration of images, videos, music
   - **Mitigation:**
     - Leverage existing `/api/scenes/[id]/assemble-async`
     - Queue-based processing
     - Clear error messages

### Medium Risk

1. **Model Context Length**
   - **Risk:** Transcript selections too long for AI
   - **Mitigation:**
     - Limit selection length (show warning)
     - Smart chunking with summarization
     - Progressive generation (1 scene at a time)

2. **Reference Image Compatibility**
   - **Risk:** Not all models support reference images
   - **Mitigation:**
     - Show clear warnings in model selector
     - Disable "Use Reference" for incompatible models
     - Fallback to non-reference generation

---

## Dependencies & Services

### New NPM Packages
```json
{
  "dependencies": {
    "@wavesurfer/react": "^1.0.7",
    "sonner": "^1.3.1"
  }
}
```

### External Services

#### Music Generation
- **Option 1:** Suno AI API
- **Option 2:** Udio API
- **Option 3:** ElevenLabs Music API

**Environment Variables:**
```bash
SUNO_API_KEY=...
UDIO_API_KEY=...
ELEVENLABS_API_KEY=...
```

#### Existing Services (Already Configured)
- OpenAI (image generation, scene prompts)
- Stability AI (image/video)
- Google Cloud Storage (media storage)
- FFmpeg via Cloud Run (video assembly)

---

## Notes for Implementation

### Best Practices

1. **Component Modularity**
   - Keep SceneCard independent and reusable
   - Separate music panel from scene cards
   - Use composition for flexibility

2. **State Management**
   - Use React state for scene generation flow
   - Persist to database only on "Compile"
   - Clear state on modal close

3. **Progressive Enhancement**
   - Start with basic scene generation
   - Add music generation in iteration 2
   - Add video animation in iteration 3

4. **Error Handling**
   - Wrap all AI calls in try-catch
   - Show user-friendly error messages
   - Log detailed errors to Sentry
   - Implement retry mechanisms

5. **Accessibility**
   - Keyboard navigation for scene cards
   - ARIA labels on all controls
   - Screen reader announcements for progress
   - Focus management in modals

### Code Quality

- Follow existing TypeScript patterns
- Use Zod schemas for API validation
- Add JSDoc comments for complex functions
- Write tests for critical paths
- Use existing UI components for consistency

### Documentation

- Update CLAUDE.md with AI scene generation workflow
- Document API endpoints
- Add Storybook stories for new components
- Update PRD.md with implemented features

---

## Conclusion

This updated plan clarifies that:

1. **The existing scene editor (`/scenes`) is a manual timeline-based tool** ✅ Already complete
2. **The workspace screenshots show an AI-driven scene generation workflow** ❌ Needs to be built
3. **These are complementary features** that work together:
   - AI generates therapeutic scenes → User refines → Compiles → Optionally edits manually in `/scenes`

The implementation focuses on:
- **Phase 1 (HIGH):** Building the AI scene generation workflow from scratch
- **Phase 2-3 (MEDIUM):** Enhancing existing features (scene cards, image generation)
- **Phase 4 (LOW):** UI polish and refinements

**Next Steps:**
1. Review and approve this updated plan
2. Set up music generation service account
3. Begin Phase 1: Scene generation interface
4. Iterate with user feedback

---

**Document Version:** 2.0 (UPDATED)
**Last Updated:** 2025-12-19
**Author:** Development Team
**Status:** Ready for Implementation
