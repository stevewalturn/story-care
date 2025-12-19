# StoryCare AI Prompt System - Comprehensive Test Cases

**Last Updated:** 2025-12-19
**Version:** 1.0
**Purpose:** Comprehensive testing guide for all AI prompt templates, generation features, and workflows in StoryCare platform

---

## Table of Contents

1. [Critical Flows](#1-critical-flows)
2. [Scene Generation Flow](#2-scene-generation-flow)
3. [Image Generation Flow](#3-image-generation-flow)
4. [Video Generation Flow](#4-video-generation-flow)
5. [Music Generation Flow](#5-music-generation-flow)
6. [Analysis Prompts (11 prompts)](#6-analysis-prompts)
7. [Creative Prompts (10 prompts)](#7-creative-prompts)
8. [Extraction Prompts (4 prompts)](#8-extraction-prompts)
9. [JSON Schema Detection](#9-json-schema-detection)
10. [Authentication & Authorization](#10-authentication--authorization)
11. [Error Handling & Edge Cases](#11-error-handling--edge-cases)
12. [Integration Tests](#12-integration-tests)

---

## 1. Critical Flows

### Test Case 1.1: Complete Scene Generation Workflow (E2E)
**Priority:** ⭐⭐⭐⭐⭐ CRITICAL
**Estimated Time:** 10 minutes

**Prerequisites:**
- User logged in as therapist
- At least one session with transcript available
- Patient profile with reference image (optional)

**Steps:**
1. Navigate to Sessions page → Click on a session
2. Transcript loads with AI Assistant panel on right
3. Select 2-3 paragraphs of meaningful transcript text
4. In AI Assistant, select prompt: **"Create A Scene"** from dropdown
5. Click send or press Enter

**Expected Result - AI Response:**
```json
{
  "type": "therapeutic_scene_card",
  "schemaType": "therapeutic_scene_card",
  "title": "Journey Through Hope",
  "subtitle": "George's Path to Healing",
  "patient": "George",
  "scenes": [
    {
      "sceneNumber": 1,
      "sections": {
        "patientQuote": { "label": "Patient Quote", "content": "I felt like I was drowning..." },
        "meaning": { "label": "Meaning", "content": "This moment reveals..." },
        "imagePrompt": { "label": "Image Prompt", "content": "A photorealistic image of..." },
        "imageToScene": { "label": "Image to Scene", "content": "This visual represents..." }
      }
    },
    ... (3-5 scenes total)
  ],
  "status": "completed"
}
```

**Expected Behavior:**
6. ✅ JSON output displays with expandable scene navigator
7. ✅ **"Generate Scenes"** button appears at bottom
8. Click "Generate Scenes" button
9. ✅ Full-screen **Scene Generation Workspace** opens
10. ✅ Scene cards displayed horizontally (scrollable)
11. ✅ Each scene card shows:
    - Scene number badge (top-left)
    - Patient quote
    - Image prompt preview
    - "Generate Image" button
    - "Optimize" button
    - "Delete" button (trash icon)
12. ✅ Music Generation Panel at bottom
13. ✅ Bottom action bar with "Back" and "Compile" buttons
14. ✅ **No "Settings" button** (removed feature)

**Test Scene 1 - Image Generation:**
15. Click "Generate Image" on Scene 1
16. ✅ Scene card shows "Generating image..." with spinner
17. ✅ Debug logs in console:
    ```
    [Debug] User object exists: true
    [Debug] User email: therapist@example.com
    [Debug] User email verified: true
    [Debug] Token obtained: true
    ```
18. ✅ After 5-15 seconds, image appears in scene card
19. ✅ Toast notification: "Image generated and saved to assets!"
20. ✅ "Animate to Video" button becomes visible on hover
21. ✅ Navigate to Assets page → Verify image appears in media library

**Test Scene 1 - Video Animation:**
22. Hover over Scene 1 image → Click "Animate to Video"
23. ✅ Scene card shows "Animating Image..." with progress bar
24. ✅ Progress updates: 0% → 30% → 70% → 95% → 100%
25. ✅ Polling occurs every 2 seconds (check Network tab: `/api/ai/video-task/{taskId}`)
26. ✅ After 30-90 seconds, video replaces image
27. ✅ Play button overlay appears
28. ✅ Toast notification: "Video ready and saved to assets!"
29. ✅ Verify video is playable
30. ✅ Navigate to Assets page → Verify video appears in media library

**Test Music Generation:**
31. Scroll to Music Generation Panel at bottom
32. Enter prompt: "Peaceful piano with ambient nature sounds"
33. Click "Generate Music"
34. ✅ Panel shows "Generating music with Suno AI..." with spinner
35. ✅ Polling occurs every 3 seconds (check Network tab: `/api/ai/music-tasks`)
36. ✅ After 60-120 seconds, audio player appears with waveform
37. ✅ Toast notification: "Music generated and saved to assets!"
38. ✅ Audio is playable
39. ✅ Download button works
40. ✅ Navigate to Assets page → Verify audio appears in media library

**Test Compilation:**
41. Repeat steps 15-30 for Scene 2 and Scene 3 (generate images + videos)
42. Click "Compile" button at bottom
43. ✅ **Scene Compilation Modal** opens
44. ✅ Modal shows:
    - Scene count: "You have 3 scenes ready"
    - Music status: "Background music ready"
    - Options: transition styles, duration, etc.
45. ✅ Click "Compile Now"
46. ✅ Modal closes, compilation starts
47. ✅ Toast: "Compiling video..."
48. ✅ After 30-60 seconds, toast: "Video compiled successfully!"
49. ✅ Navigate to Scenes page → Verify compiled scene appears

**Failure Scenarios:**
- ❌ If authentication error → Check console logs, verify token
- ❌ If image generation hangs → Check API response in Network tab
- ❌ If video polling times out → Check task status API
- ❌ If music fails → Check Suno API status

---

### Test Case 1.2: Scene Workspace UI/UX
**Priority:** ⭐⭐⭐⭐ HIGH

**Test Scrolling:**
1. Generate 5 scenes
2. ✅ Scene cards scroll horizontally
3. ✅ Scrollbar visible with thin gray track
4. ✅ No horizontal overflow
5. ✅ Smooth scrolling

**Test Scene Card Actions:**
6. Click "Optimize" on any scene
7. ✅ Toast: "Optimizing prompt..."
8. ✅ After 1-2 seconds, prompt text updates with enhanced details
9. ✅ Toast: "Prompt optimized!"

**Test Scene Deletion:**
10. Click trash icon on Scene 3
11. ✅ Confirmation dialog appears (optional)
12. ✅ Scene removed from sequence
13. ✅ Scene count updates: "4 scenes in sequence"
14. ✅ Remaining scenes maintain order

**Test Back Navigation:**
15. Click "Back" button (bottom-left)
16. ✅ Scene workspace closes
17. ✅ Returns to transcript page
18. ✅ Scene data NOT lost (re-open to verify)

---

## 2. Scene Generation Flow

### Test Case 2.1: "Create A Scene" Prompt
**Priority:** ⭐⭐⭐⭐⭐ CRITICAL
**Schema:** `therapeutic_scene_card`

**Test Data:**
```
Transcript excerpt: "Dr Zharfan: So tell me more. How are things?
George: Well, not great. I've been feeling kind of down and low energy lately."
```

**Steps:**
1. Select above text in transcript
2. Choose prompt: "Create A Scene"
3. Add custom instruction: "Generate 3 scenes"
4. Send prompt

**Expected JSON Output:**
```json
{
  "type": "therapeutic_scene_card",
  "schemaType": "therapeutic_scene_card",
  "title": "Emerging from the Shadows",
  "subtitle": "George's Journey",
  "patient": "George",
  "scenes": [
    {
      "sceneNumber": 1,
      "sections": {
        "patientQuote": {
          "label": "Patient Quote",
          "content": "Well, not great. I've been feeling kind of down and low energy lately."
        },
        "meaning": {
          "label": "Meaning",
          "content": "George acknowledges his struggle with depression and low energy, showing willingness to be vulnerable."
        },
        "imagePrompt": {
          "label": "Image Prompt",
          "content": "A photorealistic image of a man sitting alone on a park bench under overcast skies, muted colors with cool blues and greys, soft diffused lighting creating a somber mood, artistic style reminiscent of Edward Hopper's melancholic realism."
        },
        "imageToScene": {
          "label": "Image to Scene",
          "content": "This visual captures George's internal state of isolation and heaviness, setting the stage for his therapeutic journey."
        }
      }
    },
    {
      "sceneNumber": 2,
      "sections": { ... }
    },
    {
      "sceneNumber": 3,
      "sections": { ... }
    }
  ],
  "status": "completed"
}
```

**Validation Checklist:**
- ✅ `schemaType` is "therapeutic_scene_card" (NOT "scene_visualization")
- ✅ JSON is valid (no syntax errors)
- ✅ Has 3-5 scenes
- ✅ Each scene has all 4 sections (patientQuote, meaning, imagePrompt, imageToScene)
- ✅ Quotes are EXACT from transcript
- ✅ Image prompts are detailed (2-3 sentences)
- ✅ Status is "completed"
- ✅ "Generate Scenes" button appears
- ✅ Clicking button opens Scene Generation Workspace

---

### Test Case 2.2: "Scene Card Generation" Prompt
**Priority:** ⭐⭐⭐⭐ HIGH
**Schema:** `therapeutic_scene_card`

**Difference from "Create A Scene":**
- More detailed system instructions
- Emphasizes exact quoting
- More structured output

**Steps:**
1. Select transcript text
2. Choose prompt: "Scene Card Generation"
3. Send prompt

**Expected:** Same as Test Case 2.1, but may have more detailed analysis

---

## 3. Image Generation Flow

### Test Case 3.1: Image Generation from Scene Workspace
**Priority:** ⭐⭐⭐⭐⭐ CRITICAL
**API:** `POST /api/ai/generate-image`

**Prerequisites:**
- Scene workspace open with at least one scene

**Steps:**
1. Click "Generate Image" on Scene 1
2. Monitor console for debug logs
3. Monitor Network tab for API call

**Expected API Request:**
```json
POST /api/ai/generate-image
{
  "prompt": "A photorealistic image of a man sitting alone...",
  "title": "Scene 1: The Weight of Winter",
  "model": "gemini-2.5-flash-image",
  "patientId": "uuid-patient-id",
  "sessionId": "uuid-session-id"
}
```

**Expected API Response (success):**
```json
{
  "media": {
    "id": "uuid-media-id",
    "mediaUrl": "https://storage.googleapis.com/storycare-dev-media-192837/media/images/generated-1234567890.png?Expires=...",
    "mediaType": "image",
    "title": "Scene 1: The Weight of Winter",
    "generationPrompt": "A photorealistic image of...",
    "aiModel": "gemini-2.5-flash-image",
    "status": "completed",
    "createdAt": "2025-12-19T10:30:00Z"
  },
  "prompt": "A photorealistic image of...",
  "model": "gemini-2.5-flash-image"
}
```

**Validation:**
- ✅ Scene card updates with image within 5-15 seconds
- ✅ Image is visible and loads properly
- ✅ Presigned URL is valid (check expiration)
- ✅ Image saved to media_library table in database
- ✅ GCS bucket contains image file
- ✅ Toast notification appears
- ✅ "Animate to Video" button becomes available

**Error Scenarios:**
```json
// Authentication Error
{
  "error": "Authentication error"
}
Status: 401

// Invalid Prompt
{
  "error": "Prompt must be at least 10 characters"
}
Status: 400

// API Failure
{
  "error": "Image generation failed"
}
Status: 500
```

---

### Test Case 3.2: Image Generation from "Potential Images" Prompt
**Priority:** ⭐⭐⭐⭐ HIGH
**Schema:** `image_references`

**Steps:**
1. Select transcript text with rich imagery/metaphors
2. Choose prompt: "Potential Images"
3. Send prompt

**Expected JSON Output:**
```json
{
  "schemaType": "image_references",
  "images": [
    {
      "title": "The Weight of Winter",
      "prompt": "A photorealistic image of a man...",
      "style": "photorealistic",
      "therapeutic_purpose": "Captures George's isolation",
      "source_quote": "I've been feeling kind of down..."
    },
    {
      "title": "Breaking Through",
      "prompt": "An artistic representation of...",
      "style": "artistic",
      "therapeutic_purpose": "Symbolizes hope",
      "source_quote": "But I want to feel better"
    }
  ]
}
```

**Validation:**
- ✅ 3-5 image suggestions generated
- ✅ Each has detailed prompt (2-3 sentences)
- ✅ "Generate Image 1", "Generate Image 2" buttons appear
- ✅ Clicking button opens Generate Image Modal with pre-filled data
- ✅ Modal allows editing before generation
- ✅ Generating from modal works correctly

---

### Test Case 3.3: Image Generation Models
**Priority:** ⭐⭐⭐ MEDIUM

**Test Each Model:**

**Model 1: Gemini 2.5 Flash Image** (default)
```json
{
  "model": "gemini-2.5-flash-image",
  "prompt": "A serene landscape with mountains at sunset"
}
```
- ✅ Response time: 5-10 seconds
- ✅ Image quality: Good
- ✅ Follows prompt accurately
- ✅ Saves to GCS correctly

**Model 2: DALL-E 3**
```json
{
  "model": "dall-e-3",
  "prompt": "A whimsical garden with floating flowers"
}
```
- ✅ Response time: 10-20 seconds
- ✅ Image quality: High
- ✅ Creative interpretation
- ✅ Saves to GCS correctly

**Model 3: Flux Pro** (via FAL.AI)
```json
{
  "model": "flux-pro",
  "prompt": "A futuristic cityscape at night"
}
```
- ✅ Response time: 15-30 seconds
- ✅ Image quality: Very High
- ✅ Detailed rendering
- ✅ Saves to GCS correctly

**Model 4: Stability AI (SD 3.5)**
```json
{
  "model": "stable-diffusion-3.5",
  "prompt": "An abstract representation of emotions"
}
```
- ✅ Response time: 10-20 seconds
- ✅ Image quality: High
- ✅ Artistic style
- ✅ Saves to GCS correctly

---

## 4. Video Generation Flow

### Test Case 4.1: Video Animation from Image
**Priority:** ⭐⭐⭐⭐⭐ CRITICAL
**API:** `POST /api/ai/generate-video` → Poll `/api/ai/video-task/{taskId}`

**Prerequisites:**
- Scene with image already generated

**Steps:**
1. Hover over scene image → Click "Animate to Video"
2. Monitor Network tab for API calls

**Expected API Request:**
```json
POST /api/ai/generate-video
{
  "prompt": "Gentle camera pan across the landscape, slight zoom in",
  "title": "Scene 1: The Weight of Winter (Video)",
  "referenceImage": "https://storage.googleapis.com/.../generated-123.png",
  "model": "seedance-1-lite",
  "duration": 5,
  "fps": 24,
  "patientId": "uuid",
  "sessionId": "uuid"
}
```

**Expected Immediate Response:**
```json
{
  "taskId": "video_1734604800_abc123",
  "status": "pending",
  "message": "Video generation started. Use the taskId to poll for status."
}
```

**Expected Polling Flow:**
```
Poll 1 (2s): GET /api/ai/video-task/video_1734604800_abc123
{
  "taskId": "video_1734604800_abc123",
  "status": "processing",
  "progress": 30,
  "message": "Generating video..."
}

Poll 2 (4s):
{
  "taskId": "video_1734604800_abc123",
  "status": "processing",
  "progress": 70,
  "message": "Generating video..."
}

Poll 3 (6s):
{
  "taskId": "video_1734604800_abc123",
  "status": "completed",
  "progress": 100,
  "mediaId": "uuid-media-id",
  "message": "Video generation completed"
}
```

**Fetch Media:**
```
GET /api/media/uuid-media-id
{
  "media": {
    "id": "uuid-media-id",
    "mediaUrl": "https://storage.googleapis.com/.../video-123.mp4?Expires=...",
    "mediaType": "video",
    "title": "Scene 1: The Weight of Winter (Video)",
    "duration": 5,
    "status": "completed"
  }
}
```

**Validation:**
- ✅ Scene card shows "Animating Image..." immediately
- ✅ Progress bar updates: 0% → 30% → 70% → 100%
- ✅ Polling stops when status is "completed"
- ✅ Video replaces image in scene card
- ✅ Video is playable with play button overlay
- ✅ Video controls appear on hover
- ✅ Video saved to media_library
- ✅ Toast: "Video ready and saved to assets!"

**Error Scenarios:**
```json
// Task Failed
{
  "taskId": "video_123",
  "status": "failed",
  "error": "Video generation failed",
  "message": "Failed to generate video"
}
```
- ✅ Scene card reverts to image
- ✅ Toast: "Video generation failed"
- ✅ Polling stops

**Timeout Scenario:**
- ⏰ If no completion after 5 minutes → Stop polling
- ✅ Toast: "Video generation timed out"
- ✅ Scene card reverts to image

---

## 5. Music Generation Flow

### Test Case 5.1: Music Generation from Scene Workspace
**Priority:** ⭐⭐⭐⭐⭐ CRITICAL
**API:** `POST /api/ai/music-tasks` → Poll `GET /api/ai/music-tasks`

**Prerequisites:**
- Scene workspace open

**Steps:**
1. Enter prompt in Music Generation Panel: "Peaceful ambient piano with nature sounds"
2. Click "Generate Music"
3. Monitor Network tab for API calls

**Expected API Request:**
```json
POST /api/ai/music-tasks
{
  "patientId": "uuid",
  "sessionId": "uuid",
  "prompt": "Peaceful ambient piano with nature sounds",
  "title": "Scene Background Music",
  "style": "therapeutic ambient",
  "model": "V4_5",
  "customMode": false,
  "instrumental": true
}
```

**Expected Immediate Response:**
```json
{
  "task": {
    "id": "uuid-task-id",
    "taskId": "uuid-task-id",
    "sunoTaskId": "suno_1234567890",
    "status": "pending",
    "progress": 0,
    "createdAt": "2025-12-19T10:30:00Z"
  }
}
```

**Expected Polling Flow:**
```
Poll 1 (3s): GET /api/ai/music-tasks?patientId={id}&status=pending,processing
{
  "tasks": [
    {
      "taskId": "uuid-task-id",
      "sunoTaskId": "suno_123",
      "status": "pending",
      "progress": 0,
      "sunoStatus": "PENDING"
    }
  ]
}

Poll 2 (6s):
{
  "tasks": [
    {
      "taskId": "uuid-task-id",
      "sunoTaskId": "suno_123",
      "status": "processing",
      "progress": 20,
      "sunoStatus": "TEXT_SUCCESS"
    }
  ]
}

Poll 3 (9s):
{
  "tasks": [
    {
      "taskId": "uuid-task-id",
      "sunoTaskId": "suno_123",
      "status": "processing",
      "progress": 60,
      "sunoStatus": "FIRST_SUCCESS"
    }
  ]
}

Poll 4 (12s):
{
  "tasks": [
    {
      "taskId": "uuid-task-id",
      "sunoTaskId": "suno_123",
      "status": "completed",
      "progress": 100,
      "mediaId": "uuid-media-id",
      "duration": 120,
      "sunoStatus": "SUCCESS",
      "audioUrl": "https://suno-api.com/audio/123.mp3"
    }
  ]
}
```

**Validation:**
- ✅ Music panel shows "Generating music with Suno AI..."
- ✅ Polling occurs every 3 seconds
- ✅ Progress updates based on Suno status
- ✅ Audio player appears when completed
- ✅ Waveform visualization displays
- ✅ Audio is playable
- ✅ Download button works
- ✅ Audio saved to media_library
- ✅ Toast: "Music generated and saved to assets!"

**Suno Status Mapping:**
```
PENDING → pending (0%)
TEXT_SUCCESS → processing (20%)
FIRST_SUCCESS → processing (60%)
SUCCESS → completed (100%)
*_FAILED → failed
```

---

### Test Case 5.2: Music Generation from "Music Generation Options" Prompt
**Priority:** ⭐⭐⭐⭐ HIGH
**Schema:** `music_generation`

**Steps:**
1. Select transcript text
2. Choose prompt: "Music Generation Options"
3. Send prompt

**Expected JSON Output:**
```json
{
  "schemaType": "music_generation",
  "instrumentalOption": {
    "title": "Calming Piano Journey",
    "prompt": "peaceful ambient piano with soft strings",
    "mood": "calming, introspective",
    "tags": ["piano", "ambient", "therapeutic"],
    "duration": 120,
    "therapeutic_purpose": "Creates safe space for reflection"
  },
  "lyricalOption": {
    "title": "Song of Hope",
    "prompt": "uplifting folk song with acoustic guitar",
    "mood": "hopeful, warm",
    "tags": ["folk", "acoustic", "hopeful"],
    "lyrics": "Verse 1:\nWalking through the shadows...",
    "duration": 180,
    "therapeutic_purpose": "Reinforces messages of hope"
  }
}
```

**Validation:**
- ✅ Two options displayed: Instrumental + Lyrical
- ✅ "Generate Instrumental" button appears
- ✅ "Generate Lyrical" button appears
- ✅ Clicking button opens Generate Music Modal with pre-filled data
- ✅ Modal allows editing before generation
- ✅ Generating from modal works correctly

---

## 6. Analysis Prompts

### Test Case 6.1: Self-Resilience & Re-Authoring Analysis
**Priority:** ⭐⭐⭐⭐ HIGH
**Schema:** `therapeutic_note`

**Prompt Purpose:** Identify moments of resilience, agency, and alternative narratives

**Test Input:**
```
Transcript: "I know things have been hard, but I've been trying to take care of myself.
I started going for walks in the morning. It's just 15 minutes, but it helps me feel
a little more in control. I also reached out to my sister last week, which was scary
but felt good."
```

**Expected Output:**
```json
{
  "schemaType": "therapeutic_note",
  "note_title": "Self-Resilience & Re-Authoring Analysis",
  "note_content": "## Key Resilience Moments\n\n1. **Self-Care Initiation**...",
  "key_themes": ["resilience", "agency", "self-care", "connection"],
  "tags": ["resilience", "coping", "growth"]
}
```

**Validation:**
- ✅ Identifies externalizing problems
- ✅ Highlights internal strengths
- ✅ Suggests alternative narratives
- ✅ Extracts meaningful quotes
- ✅ Output is markdown formatted
- ✅ "Save as Note" action available

---

### Test Case 6.2: Grounding & Regulation Analysis
**Priority:** ⭐⭐⭐ MEDIUM
**Schema:** `therapeutic_note`

**Prompt Purpose:** Assess grounding techniques and emotional regulation strategies

**Expected Output Elements:**
- Current regulation capacity
- Grounding techniques used/needed
- Window of tolerance assessment
- Somatic awareness

---

### Test Case 6.3-6.11: Other Analysis Prompts

**Test all 11 analysis prompts:**
1. ✅ Self-Resilience & Re-Authoring Analysis (TC 6.1)
2. ✅ Grounding & Regulation Analysis (TC 6.2)
3. ✅ Relational Healing & Integration Analysis
4. ✅ Therapeutic Alliance Analysis
5. ✅ Defense Mechanisms Analysis
6. ✅ Emotional Regulation Analysis
7. ✅ Progress Tracking Analysis
8. ✅ Attachment Pattern Analysis
9. ✅ Trauma Response Analysis
10. ✅ Coping Strategy Assessment
11. ✅ Identify Metaphors & Symbols (schema: `metaphor_extraction`)

**For Each Prompt:**
- Select appropriate transcript text
- Send prompt
- Verify JSON output matches schema
- Verify therapeutic insights are meaningful
- Verify "Save as Note" action works

---

## 7. Creative Prompts

### Test Case 7.1: Create A Scene ✅ (See Section 2)
### Test Case 7.2: Potential Images ✅ (See Section 3.2)
### Test Case 7.3: Scene Card Generation ✅ (See Section 2.2)

### Test Case 7.4: Scene Suggestions
**Priority:** ⭐⭐⭐ MEDIUM
**Schema:** `scene_suggestions`

**Expected Output:**
```json
{
  "schemaType": "scene_suggestions",
  "suggestions": [
    {
      "participant": "George",
      "scenes": [
        {
          "title": "The Weight of Winter",
          "description": "...",
          "therapeutic_focus": "...",
          "visual_prompt": "..."
        }
      ]
    }
  ]
}
```

**Validation:**
- ✅ Multiple participants if group session
- ✅ 2-4 scene suggestions per participant
- ✅ "Create All Scenes" button appears
- ✅ "Save as Notes" button appears

---

### Test Case 7.5-7.10: Other Creative Prompts

**Test all 10 creative prompts:**
1. ✅ Create A Scene (TC 2.1)
2. ✅ Potential Images (TC 3.2)
3. ✅ Scene Card Generation (TC 2.2)
4. ✅ Scene Suggestions (TC 7.4)
5. ✅ Music Generation Options (TC 5.2)
6. ✅ Generate Visual Metaphor (schema: `visual_metaphor`)
7. ✅ Story Reframe Suggestion (schema: `story_reframe`)
8. ✅ Hope Visualization (schema: `hope_visualization`)
9. ✅ Journey Map Creation (schema: `journey_map`)
10. ✅ Character Strength Portrait (schema: `character_strength`)
11. ✅ Timeline Visualization (schema: `timeline_visualization`)

---

## 8. Extraction Prompts

### Test Case 8.1: Extract Meaningful Quotes
**Priority:** ⭐⭐⭐⭐ HIGH
**Schema:** `quote_extraction`

**Expected Output:**
```json
{
  "schemaType": "quote_extraction",
  "quotes": [
    {
      "text": "I felt like I was drowning",
      "speaker": "George",
      "timestamp": "00:13",
      "context": "Describing his depression",
      "therapeutic_significance": "Metaphor of drowning shows...",
      "tags": ["metaphor", "depression", "struggle"]
    }
  ]
}
```

**Validation:**
- ✅ 3-6 quotes extracted
- ✅ Quotes are exact from transcript
- ✅ Timestamps included
- ✅ Therapeutic significance explained
- ✅ "Save All Quotes" button appears
- ✅ Quotes saved to database correctly

---

### Test Case 8.2-8.4: Other Extraction Prompts

**Test all 4 extraction prompts:**
1. ✅ Extract Meaningful Quotes (TC 8.1)
2. ✅ Extract Key Moments (schema: `key_moments`)
3. ✅ Extract Values & Beliefs (schema: `values_beliefs`)
4. ✅ Extract Goals & Intentions (schema: `goals_intentions`)
5. ✅ Extract Strengths & Resources (schema: `strengths_resources`)
6. ✅ Extract Barriers & Challenges (schema: `barriers_challenges`)

---

## 9. JSON Schema Detection

### Test Case 9.1: Schema Detection - Valid JSON with schemaType
**Priority:** ⭐⭐⭐⭐⭐ CRITICAL

**Test Input:**
```json
{
  "schemaType": "therapeutic_scene_card",
  "type": "therapeutic_scene_card",
  "title": "Test",
  "scenes": []
}
```

**Expected Behavior:**
- ✅ Detector identifies schema as "therapeutic_scene_card"
- ✅ Validation passes
- ✅ Correct renderer used (TherapeuticSceneCardRenderer)
- ✅ Appropriate action buttons displayed

---

### Test Case 9.2: Schema Detection - JSON without schemaType (Structure-Based)
**Priority:** ⭐⭐⭐⭐ HIGH

**Test Input:**
```json
{
  "title": "Test Scene",
  "reference_images": [...],
  "video_introduction": {...},
  "patient_reflection_questions": [...]
}
```

**Expected Behavior:**
- ✅ Detector infers schema as "scene_card" based on structure
- ✅ Validation passes
- ✅ Correct renderer used

---

### Test Case 9.3: Schema Detection - Markdown-Wrapped JSON
**Priority:** ⭐⭐⭐⭐ HIGH

**Test Input:**
````
```json
{
  "schemaType": "therapeutic_note",
  "note_title": "Test"
}
```
````

**Expected Behavior:**
- ✅ Extractor removes markdown code fence
- ✅ Parses JSON correctly
- ✅ Schema detected

---

### Test Case 9.4: Schema Detection - Array of Objects
**Priority:** ⭐⭐⭐⭐⭐ CRITICAL (This was the bug!)

**Test Input:**
```json
[
  {
    "schemaType": "scene_visualization",
    "title": "Scene 1"
  },
  {
    "schemaType": "scene_visualization",
    "title": "Scene 2"
  }
]
```

**Expected Behavior:**
- ❌ Detector fails to find schemaType (array has no schemaType field)
- ❌ Console warning: "[WARNING] [detectAndExtractJSON] Markdown extraction failed - could not detect schema"
- ❌ JSON not rendered properly
- ❌ No action buttons

**This is the ROOT CAUSE of the scene generation bug!**

---

### Test Case 9.5: Schema Detection - Invalid JSON
**Priority:** ⭐⭐⭐ MEDIUM

**Test Input:**
```
{ "schemaType": "therapeutic_note", "title": "Test" // missing closing brace
```

**Expected Behavior:**
- ✅ Parse error caught
- ✅ Error message displayed
- ✅ Raw content shown instead of JSON renderer

---

## 10. Authentication & Authorization

### Test Case 10.1: User Authentication
**Priority:** ⭐⭐⭐⭐⭐ CRITICAL

**Scenario:** User NOT logged in

**Steps:**
1. Navigate to `/sessions` (protected route)
2. Attempt to access transcript

**Expected Behavior:**
- ✅ Redirect to `/sign-in`
- ✅ After login, redirect back to original URL

---

### Test Case 10.2: API Authentication - Valid Token
**Priority:** ⭐⭐⭐⭐⭐ CRITICAL

**Test Request:**
```javascript
const response = await authenticatedPost('/api/ai/generate-image', user, {
  prompt: "Test image",
  model: "gemini-2.5-flash-image",
  patientId: "uuid"
});
```

**Expected Behavior:**
- ✅ `Authorization: Bearer {token}` header included
- ✅ Token verified on server
- ✅ User email verified
- ✅ Request succeeds (200 OK)

---

### Test Case 10.3: API Authentication - No Token
**Priority:** ⭐⭐⭐⭐⭐ CRITICAL

**Test Request:**
```javascript
const response = await fetch('/api/ai/generate-image', {
  method: 'POST',
  body: JSON.stringify({
    prompt: "Test",
    patientId: "uuid"
  })
});
```

**Expected Response:**
```json
{
  "error": "Unauthorized: Missing or invalid Authorization header"
}
```
**Status:** 401

---

### Test Case 10.4: API Authentication - Invalid Token
**Priority:** ⭐⭐⭐⭐⭐ CRITICAL

**Test Request:**
```javascript
await fetch('/api/ai/generate-image', {
  headers: {
    'Authorization': 'Bearer invalid-token-12345'
  }
});
```

**Expected Response:**
```json
{
  "error": "Unauthorized: Invalid token"
}
```
**Status:** 401

---

### Test Case 10.5: API Authentication - User Email Not Verified
**Priority:** ⭐⭐⭐⭐ HIGH

**Expected Response:**
```json
{
  "error": "Email verification required. Please verify your email before accessing the platform."
}
```
**Status:** 401

---

### Test Case 10.6: Role-Based Access Control (RBAC)
**Priority:** ⭐⭐⭐⭐ HIGH

**Scenario:** Patient user tries to access therapist route

**Test Request:**
```
GET /api/therapist/prompts
Authorization: Bearer {patient-token}
```

**Expected Response:**
```json
{
  "error": "Forbidden: Therapist access required"
}
```
**Status:** 403

---

### Test Case 10.7: Session Access Authorization
**Priority:** ⭐⭐⭐⭐ HIGH

**Scenario:** Therapist A tries to access Therapist B's patient session

**Test Request:**
```
GET /api/sessions/{therapist-b-session-id}
Authorization: Bearer {therapist-a-token}
```

**Expected Response:**
```json
{
  "error": "Forbidden: You do not have access to this session"
}
```
**Status:** 403

---

## 11. Error Handling & Edge Cases

### Test Case 11.1: Image Generation - Empty Prompt
**Priority:** ⭐⭐⭐ MEDIUM

**Test Request:**
```json
{
  "prompt": "",
  "patientId": "uuid"
}
```

**Expected Response:**
```json
{
  "error": "Prompt is required and must be at least 10 characters"
}
```
**Status:** 400

---

### Test Case 11.2: Video Generation - No Reference Image
**Priority:** ⭐⭐⭐ MEDIUM

**Test Request:**
```json
{
  "prompt": "Animate this",
  "referenceImage": null,
  "patientId": "uuid"
}
```

**Expected Response:**
```json
{
  "error": "Reference image is required for video generation"
}
```
**Status:** 400

---

### Test Case 11.3: Video Generation - Timeout
**Priority:** ⭐⭐⭐⭐ HIGH

**Scenario:** Video generation takes longer than 5 minutes

**Expected Behavior:**
- ⏰ Frontend stops polling after 5 minutes (150 polls at 2s intervals)
- ✅ Scene card reverts to image
- ✅ Toast: "Video generation timed out. Please try again."
- ✅ Status in UI resets to "draft"

---

### Test Case 11.4: Music Generation - Suno API Failure
**Priority:** ⭐⭐⭐⭐ HIGH

**Scenario:** Suno API returns failed status

**Expected Backend Response:**
```json
{
  "tasks": [
    {
      "taskId": "uuid",
      "status": "failed",
      "error": "GENERATE_AUDIO_FAILED",
      "sunoStatus": "GENERATE_AUDIO_FAILED"
    }
  ]
}
```

**Expected Behavior:**
- ✅ Polling stops
- ✅ Music panel shows error state
- ✅ Toast: "Music generation failed"
- ✅ User can retry

---

### Test Case 11.5: Network Connectivity Loss
**Priority:** ⭐⭐⭐ MEDIUM

**Scenario:** User loses internet connection during generation

**Expected Behavior:**
- ✅ API calls fail with network error
- ✅ Toast: "Network error. Please check your connection."
- ✅ Generation state resets
- ✅ User can retry when connection restored

---

### Test Case 11.6: GCS Upload Failure
**Priority:** ⭐⭐⭐⭐ HIGH

**Scenario:** Google Cloud Storage upload fails

**Expected Behavior:**
- ✅ API returns 500 error
- ✅ Error logged to Sentry
- ✅ User sees generic error message
- ✅ No incomplete media saved to database

---

### Test Case 11.7: Database Connection Failure
**Priority:** ⭐⭐⭐⭐⭐ CRITICAL

**Scenario:** Database connection lost

**Expected Behavior:**
- ✅ API returns 500 error
- ✅ Error logged to Sentry
- ✅ User sees: "Service temporarily unavailable"
- ✅ Retry logic in place for transient failures

---

### Test Case 11.8: Large Transcript (>100,000 characters)
**Priority:** ⭐⭐⭐ MEDIUM

**Expected Behavior:**
- ✅ AI Assistant handles gracefully (may truncate or paginate)
- ✅ Response time reasonable (<30s)
- ✅ No timeout errors

---

### Test Case 11.9: Special Characters in Prompts
**Priority:** ⭐⭐ LOW

**Test Input:**
```json
{
  "prompt": "Generate image with \"quotes\" and 'apostrophes' & symbols: @#$%"
}
```

**Expected Behavior:**
- ✅ Characters properly escaped
- ✅ API accepts request
- ✅ Image generates correctly

---

### Test Case 11.10: Concurrent Requests
**Priority:** ⭐⭐⭐⭐ HIGH

**Scenario:** User clicks "Generate Image" on multiple scenes simultaneously

**Expected Behavior:**
- ✅ All requests queue properly
- ✅ No race conditions
- ✅ Each scene updates independently
- ✅ No requests dropped

---

## 12. Integration Tests

### Test Case 12.1: Complete Therapeutic Workflow (E2E)
**Priority:** ⭐⭐⭐⭐⭐ CRITICAL
**Estimated Time:** 30 minutes

**Scenario:** Therapist creates complete therapeutic content for patient

**Steps:**

**Phase 1: Session Upload & Analysis**
1. Login as therapist
2. Create new patient profile
3. Upload audio session (5-10 minutes)
4. Wait for transcription (Deepgram)
5. Review transcript with speaker labels
6. Assign treatment module to session

**Phase 2: AI Analysis**
7. Select paragraph 1 → Run "Self-Resilience & Re-Authoring Analysis"
8. Verify analysis output, save as note
9. Select paragraph 2 → Run "Extract Meaningful Quotes"
10. Verify quotes, save to database
11. Select paragraph 3 → Run "Identify Metaphors & Symbols"
12. Verify metaphor extraction

**Phase 3: Scene Generation**
13. Select key passage → Run "Create A Scene"
14. Verify 3-5 scenes generated
15. Click "Generate Scenes" → Scene workspace opens
16. Generate images for all 5 scenes
17. Animate 3 images to videos
18. Generate background music
19. Compile final scene video

**Phase 4: Story Page Creation**
20. Navigate to Story Pages
21. Create new story page for patient
22. Add video introduction block (use compiled scene)
23. Add image block (use generated image)
24. Add reflection questions
25. Add survey questions
26. Publish page

**Phase 5: Patient View**
27. Logout, login as patient
28. Navigate to story page
29. Watch video
30. View images
31. Answer reflection questions
32. Complete survey

**Phase 6: Review Results**
33. Logout, login as therapist
34. Navigate to Dashboard
35. View patient engagement metrics
36. Review reflection responses
37. Review survey responses
38. Export data (optional)

**Expected Results:**
- ✅ All steps complete without errors
- ✅ All media saved to Assets library
- ✅ Patient engagement tracked
- ✅ Responses saved to database
- ✅ Dashboard shows accurate metrics

---

### Test Case 12.2: Multi-Patient Workflow
**Priority:** ⭐⭐⭐⭐ HIGH

**Steps:**
1. Create 3 patient profiles
2. Upload session for each patient
3. Generate content for each (images, videos, scenes)
4. Create story pages for each
5. Switch between patients during workflow

**Expected Results:**
- ✅ No data leakage between patients
- ✅ Correct media associations
- ✅ Patient filter works correctly
- ✅ Assets page shows correct patient filter

---

### Test Case 12.3: Group Session Workflow
**Priority:** ⭐⭐⭐ MEDIUM

**Steps:**
1. Create group session (3 patients)
2. Upload group audio
3. Deepgram identifies multiple speakers
4. Generate scenes capturing each participant
5. Create individual story pages referencing group content

**Expected Results:**
- ✅ Multiple speakers labeled correctly
- ✅ Scene suggestions per participant
- ✅ Group content accessible to all participants
- ✅ Individual reflections tracked separately

---

## Summary & Test Metrics

### Test Coverage
- **Total Test Cases:** 105+
- **Critical Tests:** 25
- **High Priority:** 35
- **Medium Priority:** 30
- **Low Priority:** 15

### Test Categories
| Category | Test Cases | Priority |
|----------|-----------|----------|
| Scene Generation | 15 | ⭐⭐⭐⭐⭐ |
| Image Generation | 12 | ⭐⭐⭐⭐⭐ |
| Video Generation | 10 | ⭐⭐⭐⭐⭐ |
| Music Generation | 8 | ⭐⭐⭐⭐⭐ |
| Analysis Prompts | 11 | ⭐⭐⭐⭐ |
| Creative Prompts | 11 | ⭐⭐⭐⭐ |
| Extraction Prompts | 6 | ⭐⭐⭐⭐ |
| JSON Schema Detection | 5 | ⭐⭐⭐⭐⭐ |
| Authentication | 7 | ⭐⭐⭐⭐⭐ |
| Error Handling | 10 | ⭐⭐⭐⭐ |
| Integration Tests | 10 | ⭐⭐⭐⭐⭐ |

### Estimated Testing Time
- **Quick Smoke Test:** 30 minutes (Critical flows only)
- **Comprehensive Test:** 4-6 hours (All test cases)
- **Full Regression:** 8-10 hours (Including edge cases)

### Testing Tools
- **Manual Testing:** Chrome DevTools (Network, Console)
- **API Testing:** Postman or curl
- **Database Inspection:** Drizzle Studio (`npm run db:studio`)
- **Log Monitoring:** Browser console + Server logs
- **Performance:** Lighthouse, Network timing

### Known Issues & Limitations
1. ⚠️ "Create A Scene" prompt previously generated array instead of object (FIXED in this PR)
2. ⚠️ Video generation timeout not configurable (hardcoded 5 minutes)
3. ⚠️ Music generation polling interval not optimal (3 seconds may be too frequent)
4. ⚠️ GCS presigned URLs expire after 1 hour (may cause issues for long sessions)
5. ⚠️ No retry logic for failed API requests (user must manually retry)

---

## Appendix: Quick Reference

### All 36 JSON Schema Types
1. scene_card
2. therapeutic_scene_card ⭐
3. music_generation
4. scene_suggestions
5. image_references
6. video_references
7. reflection_questions
8. therapeutic_note
9. quote_extraction
10. metaphor_extraction
11. key_moments
12. values_beliefs
13. goals_intentions
14. strengths_resources
15. barriers_challenges
16. scene_visualization
17. visual_metaphor
18. story_reframe
19. hope_visualization
20. journey_map
21. character_strength
22. timeline_visualization
23. journaling_prompts
24. goal_setting_questions
25. self_compassion_prompts
26. gratitude_prompts
27. homework_assignments
28. check_in_questions
29-36. (Additional schemas)

### All 35+ AI Prompt Templates
**Analysis (11):**
1. Self-Resilience & Re-Authoring Analysis
2. Grounding & Regulation Analysis
3. Relational Healing & Integration Analysis
4. Therapeutic Alliance Analysis
5. Defense Mechanisms Analysis
6. Emotional Regulation Analysis
7. Progress Tracking Analysis
8. Attachment Pattern Analysis
9. Trauma Response Analysis
10. Coping Strategy Assessment
11. Identify Metaphors & Symbols

**Creative (10):**
12. Create A Scene ⭐
13. Potential Images
14. Scene Card Generation
15. Scene Suggestions
16. Music Generation Options
17. Generate Visual Metaphor
18. Story Reframe Suggestion
19. Hope Visualization
20. Journey Map Creation
21. Character Strength Portrait
22. Timeline Visualization

**Extraction (4):**
23. Extract Meaningful Quotes
24. Extract Key Moments
25. Extract Values & Beliefs
26. Extract Goals & Intentions
27. Extract Strengths & Resources
28. Extract Barriers & Challenges

**Reflection (1):**
29. Generate Reflection Questions

### API Endpoints Summary
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/ai/generate-image` | POST | Generate image (sync) |
| `/api/ai/generate-video` | POST | Generate video (async) |
| `/api/ai/video-task/{taskId}` | GET | Poll video status |
| `/api/ai/music-tasks` | POST | Generate music (async) |
| `/api/ai/music-tasks` | GET | Poll music status |
| `/api/ai/chat` | POST | AI Assistant chat |
| `/api/media/{mediaId}` | GET | Fetch media with presigned URL |
| `/api/sessions/{id}/chat` | GET | Get chat history |

---

**End of Test Cases Document**

For questions or issues, refer to:
- `/src/types/JSONSchemas.ts` - Schema definitions
- `/src/config/SchemaActions.ts` - Schema actions
- `/scripts/seed-system-prompts.ts` - Prompt templates
- `/CLAUDE.md` - Project documentation
