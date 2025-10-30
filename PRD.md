# StoryCare - Product Requirements Document (PRD)

**Version:** 1.0
**Last Updated:** October 29, 2025
**Document Owner:** Product Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision & Goals](#product-vision--goals)
3. [User Personas](#user-personas)
4. [Core Features & Functionality](#core-features--functionality)
5. [User Flows](#user-flows)
6. [Database Schema](#database-schema)
7. [Technical Architecture](#technical-architecture)
8. [UI/UX Specifications](#uiux-specifications)
9. [API Endpoints](#api-endpoints)
10. [Security & Compliance](#security--compliance)
11. [Success Metrics](#success-metrics)
12. [Future Enhancements](#future-enhancements)

---

## Executive Summary

**StoryCare** is a digital therapeutic platform designed to improve mental health outcomes through narrative therapy. It is a structured, clinician-guided system that helps patients visualize and reframe their personal stories through AI-generated media (images, videos, scenes).

### Key Principle
"We live our lives through stories. These narratives shape identity, behavior, and possibility."

### Core Value Proposition
StoryCare enables therapists to:
- Upload and transcribe therapy session recordings
- Analyze transcripts with AI assistance
- Generate visual representations of patient narratives
- Create personalized multimedia scenes
- Build interactive story pages for patient reflection
- Measure patient engagement and therapeutic outcomes

### Target Users
- **Primary:** Licensed therapists conducting individual and group therapy
- **Secondary:** Patients/clients receiving narrative therapy treatment
- **Tertiary:** Clinical administrators and supervisors

---

## Product Vision & Goals

### Vision Statement
"Make healing visible by transforming narrative therapy into measurable, visual experiences that empower patients to reauthor their stories."

### Product Goals

1. **Clinical Effectiveness**
   - Reduce time therapists spend on administrative tasks by 40%
   - Increase patient engagement with therapeutic content by 60%
   - Provide quantitative data to support qualitative therapeutic insights

2. **User Experience**
   - Intuitive interface requiring less than 30 minutes of training
   - Seamless workflow from session recording to patient story page
   - Mobile-optimized patient experience

3. **Scalability**
   - Support 1k users (baseline), 10k users (optimized), 100k users (enterprise)
   - Handle large audio files (up to 3 hours per session)
   - Store and manage extensive media libraries per patient

4. **Compliance & Security**
   - HIPAA-compliant data handling
   - Secure storage of sensitive patient information
   - Role-based access control

---

## User Personas

### 1. Sarah - Licensed Clinical Therapist
**Demographics:**
- Age: 35-50
- Education: Master's in Clinical Psychology
- Experience: 10+ years in narrative therapy
- Tech Savvy: Moderate

**Goals:**
- Help patients visualize their therapeutic journey
- Track patient progress with concrete data
- Reduce time spent on session notes
- Create engaging therapeutic content

**Pain Points:**
- Traditional talk therapy lacks tangible artifacts
- Difficult to measure therapeutic progress quantitatively
- Time-consuming to create visual materials manually
- Hard to maintain patient engagement between sessions

**How StoryCare Helps:**
- Automated transcription saves 2+ hours per week
- AI-assisted content generation creates visual materials in minutes
- Dashboard provides quantifiable engagement metrics
- Story pages keep patients actively engaged in their treatment

### 2. Jay - Patient/Client
**Demographics:**
- Age: 25-45
- Situation: In treatment for substance abuse/mental health
- Tech Savvy: High (mobile-first)
- Location: Treatment facility or outpatient

**Goals:**
- Understand and reframe personal narrative
- Visualize future self and possibilities
- Stay engaged with therapeutic work
- Track personal growth

**Pain Points:**
- Hard to see progress in abstract concepts
- Difficult to remember insights from sessions
- Lack of tangible reminders of therapeutic work
- Struggle to envision different future

**How StoryCare Helps:**
- Visual representations make abstract concepts concrete
- Story pages provide lasting record of therapeutic insights
- Reflection questions maintain engagement between sessions
- Personalized media shows alternate versions of self

### 3. Noah - Clinical Administrator
**Demographics:**
- Age: 40-60
- Role: Clinical Director/Program Supervisor
- Manages: 5-20 therapists

**Goals:**
- Monitor program effectiveness
- Ensure compliance with regulations
- Track patient outcomes across therapists
- Justify program funding with data

**Pain Points:**
- Lack of standardized outcome measures
- Difficulty aggregating data across therapists
- Compliance auditing is time-consuming
- Hard to demonstrate program ROI

**How StoryCare Helps:**
- Centralized dashboard with aggregate metrics
- Built-in compliance features (audit logs, access controls)
- Exportable outcome data
- Standardized therapeutic process

---

## Core Features & Functionality

### 1. Session Library & Management

#### 1.1 Session List View
**Description:** Central hub for managing all therapy sessions

**Features:**
- Grid/list view of all sessions
- Filter by:
  - Patient name
  - Group name
  - Date range
  - Session type (Individual/Group)
- Search functionality
- Session count per patient/group
- Patient avatar display

**User Actions:**
- Click "+ New Session" button
- Search/filter sessions
- Click on patient card to expand sessions
- View session details

**Screenshots Reference:** Session Library (Screenshot 1)

#### 1.2 New Session Upload
**Description:** Upload and tag therapy session audio

**Features:**
- Drag-and-drop audio file upload
- Supported formats: .mp3, .m4a, .wav, .flac
- Session metadata input:
  - Session Title (e.g., "Weekly Check-in")
  - Session Date (date picker)
  - Session Type (Individual/Group dropdown)
  - Patient selection (searchable dropdown with "+ Add Patient")
  - Group selection (if Group type)
- Audio file preview with name display
- "Continue to Speaker Labeling" button

**User Actions:**
- Drag audio file or click to browse
- Fill in session metadata
- Select patient/group
- Proceed to speaker labeling

**Screenshots Reference:** New Session Upload (Screenshots 2-4)

### 2. Transcription & Speaker Diarization

#### 2.1 Automatic Transcription
**Description:** AI-powered speech-to-text using Deepgram

**Technical Details:**
- API: Deepgram
- Features enabled:
  - Speaker diarization (automatic speaker detection)
  - Punctuation and capitalization
  - Timestamps per segment
  - Confidence scores

**Process:**
1. Audio file uploaded to Google Cloud Storage
2. Deepgram API processes audio
3. Transcript saved with speaker labels (Speaker 0, Speaker 1, etc.)
4. Timestamps stored for each utterance
5. Therapist proceeds to speaker labeling

#### 2.2 Speaker Management
**Description:** Assign names and roles to diarized speakers

**Features:**
- List of all detected speakers (Speaker 0, Speaker 1, etc.)
- Per speaker:
  - Segment count
  - Total duration
  - Sample text preview
  - Audio playback controls (rewind, play, forward)
  - Speaker Type dropdown (Therapist, Patient, Group Member)
  - Name input field
- "Merge Mode" toggle for combining duplicate speakers
- Instructional banner explaining the process
- "Save Assignments" button

**User Actions:**
- Play audio snippet to identify speaker
- Select speaker type from dropdown
- Enter speaker name
- Use Merge Mode to combine duplicate speakers
- Save all assignments

**Business Rules:**
- At least one speaker must be labeled as Therapist
- Patient names must match existing patients or trigger creation
- Merged speakers combine all segments

**Screenshots Reference:** Speaker Management (Screenshot 5)

### 3. Transcript Analysis & AI Assistant

#### 3.1 Transcript Viewer
**Description:** Searchable, interactive transcript with speaker labels

**Features:**
- Left panel: Full transcript with:
  - Speaker avatars/initials
  - Speaker names
  - Timestamps
  - Utterance text
  - Text selection capability
  - Search functionality
- Audio playback controls:
  - Play/pause
  - Timestamp display (current / total duration)
  - Seek bar
  - Settings icon
- Highlight and select text for analysis
- Speaker icons for quick visual identification
- "Analyze Selection" button appears on text highlight

**User Actions:**
- Read transcript
- Play audio synced to transcript
- Search for keywords (e.g., "police")
- Highlight text for analysis
- Click speaker name to filter

**Screenshots Reference:** Transcript Viewer (Screenshot 6)

#### 3.2 AI Assistant (Therapeutic Chat)
**Description:** Context-aware AI assistant for clinical insights

**Features:**
- Right panel: "AI Assistant (Jay's Narrative)"
- Session context display
- "AI Analysis Ready" status indicator
- Chat interface with:
  - Therapeutic Chat Assistant persona
  - Question input field
  - Prompt library dropdown ("Choose a favorite prompt...")
  - Example prompts visible:
    - "What are the key themes?"
    - "How is the patient progressing?"
    - "Create an image metaphor"
    - "Visualize the patient's metaphor"
- Prompt categories:
  - For Analysis (clinical insights)
  - For Media (content generation)
- Pre-built prompt templates:
  - Therapeutic Alliance Analysis
  - Potential Images (image_suggestions)
  - Group Clinical Note (analysis)
  - Potential Scenes (analysis)
  - Create an Image from Selection (creative)

**AI Capabilities:**
- Analyze transcript for therapeutic themes
- Identify patient progress indicators
- Suggest visual metaphors from session content
- Generate clinical note suggestions
- Extract meaningful quotes
- Identify scene-worthy moments

**User Actions:**
- Ask questions about the session
- Select pre-built prompts
- Chat about transcript insights
- Request media generation suggestions

**Screenshots Reference:** AI Assistant (Screenshot 6)

#### 3.3 Analyze Selection Modal
**Description:** Contextual analysis on highlighted transcript text

**Features:**
- Modal triggered by selecting transcript text
- Shows selected text preview
- Prompt options:
  - **Therapeutic Alliance Analysis** (reflection)
    - "Analyze the transcript for indicators of therapeutic alliance..."
  - **Potential Images** (image_suggestions, JSON)
    - "You are a narrative therapy media assistant. Analyze and generate image suggestions..."
  - **Group Clinical Note** (analysis)
    - "Create a detailed Group Therapy Progress Note..."
  - **Potential Scenes** (analysis, JSON)
    - "Identify powerful, scene-worthy moments for filmmaking..."
  - **Create an Image from Selection** (creative)
    - "Create a single, composite image based on the selection..."
- Each prompt shows:
  - Icon (indicating type)
  - Title
  - Description
  - Badge (reflection, image_suggestions, analysis, JSON, creative)

**User Actions:**
- Select desired prompt
- Run analysis on highlighted text
- View results in AI Assistant panel

**Screenshots Reference:** Analyze Selection (Screenshot 7)

### 4. Media Generation

#### 4.1 Image Generation
**Description:** AI-powered image creation with patient reference

**Features:**
- Modal: "Generate Image - Transform symbolic prompts into visual imagery"
- Collapsible sections:
  - **Context & Metadata** (expandable)
  - **AI Model** dropdown (flux-kontext-pro, Default)
  - **Prompt** textarea with "Optimize" button
  - **Reference Image** section:
    - "Active Patient Reference" display showing patient name (Jay)
    - Reference image thumbnail
    - "Use Reference" toggle
    - Info text: "This patient reference image will be used for visual consistency"
    - "Override with Different Image (Optional)" upload area
- Right panel: "Generation Result" preview area
- Action buttons: Cancel, Generate

**Technical Details:**
- Uses patient reference image for consistent likeness
- Prompt engineering for clinical/therapeutic context
- Model: Flux Kontext Pro (or OpenAI DALL-E)
- Generated images saved to patient library with metadata

**Generated Image Metadata:**
- Title/description
- Generation timestamp
- Source (therapeutic card, manual, from-image)
- Tags (Generated, patient name, library_generated)
- Associated session

**User Actions:**
- Review/edit AI-suggested prompt
- Toggle reference image usage
- Upload alternative reference image
- Generate image
- Save to patient library

**Screenshots Reference:** Generate Image (Screenshot 8)

#### 4.2 Video Generation
**Description:** Animate static images into short video clips

**Features:**
- Modal: "Generate Video - Transform symbolic prompts into visual stories"
- Left panel configuration:
  - **Reference Image** section:
    - "Selected for Animation" thumbnail
    - Patient name (Jay)
    - Info text: "This image will be used as the starting frame"
  - "Override with Different Image (Optional)" upload
  - **Context & Metadata** (collapsible)
  - **Advanced Prompt Settings** (collapsible)
  - "Generate Video (5s)" button
- Right panel: Video preview player
  - Video display (shows animated result)
  - Standard video controls
  - Duration indicator (0:03 / 0:05)
- Action buttons: Close

**Technical Details:**
- Animation duration: 5 seconds default
- Uses static image as starting frame
- Animates based on prompt context
- Outputs video file (.mp4)
- Saved to patient library

**User Actions:**
- Select image for animation
- Configure animation settings
- Generate video
- Preview result
- Save to library

**Screenshots Reference:** Generate Video (Screenshot 9)

### 5. Patient Content Library

#### 5.1 Library Overview
**Description:** Centralized repository of all patient assets

**Navigation Tabs:**
- **Media** - Images, videos, audio
- **Quotes** - Extracted transcript quotes
- **Notes** - Therapist notes
- **Profile** - Patient information

**Global Actions:**
- "Import" button - Upload external media
- "+ Create Media" button - Generate new content
- Patient selector dropdown - Switch between patients

#### 5.2 Media Library
**Description:** Visual gallery of all generated and uploaded media

**Features:**
- Filter bar:
  - Search input ("Search media...")
  - "All Sources" dropdown
  - "All Types" dropdown
- Media type counters:
  - "All (26)"
  - "Videos (13)"
  - "Images (10)"
  - "Music (3)"
- Grid view of media cards:
  - Thumbnail/preview
  - Title
  - Type icon (image/video/music)
  - Timestamp ("15 days ago", "21 days ago")
  - Source description ("Generated from therapeutic card", "Scene created by merging...")
  - Status badge ("Generated")
  - Tags (patient name, "library_generated", "scene", "assembled", "therapist-created")
  - Play button overlay (for videos)
  - Three-dot menu (per item)

**Media Card Details:**
- **Videos:** Show duration, play overlay
- **Images:** Show static preview
- **Music:** Show audio icon, waveform

**User Actions:**
- Search/filter media
- Click media to view full-size
- Play videos in modal
- Download media
- Delete media (admin)
- View metadata

**Screenshots Reference:** Content Library - Media Tab (Screenshot 10)

#### 5.3 Quotes Library
**Description:** Extracted meaningful quotes from transcripts

**Features:**
- "Jay's Quotes" header with count
- "+ New Quote" button
- Refresh button
- Search quotes input
- Quote cards displaying:
  - Speaker label ("Therapist", "Jay")
  - Timestamp range (e.g., "30:48 - 31:44")
  - Full quote text
  - Priority badge ("medium-Priority")
  - Edit icon
  - Three-dot menu

**Quote Metadata:**
- Speaker
- Session reference
- Timestamp
- Priority level
- Tags
- Date added

**User Actions:**
- Add manual quotes
- Search quotes
- Edit quote priority/tags
- Link quotes to story pages
- Filter by speaker/session

**Screenshots Reference:** Content Library - Quotes Tab (Screenshot 11)

### 6. Scene Editor

#### 6.1 Scene Creation Interface
**Description:** Timeline-based video editor for creating narrative scenes

**Features:**
- Header:
  - "Jay's Scenes" title
  - Patient selector dropdown
  - Status indicator ("Added 'Untitled' to timeline")
- Left panel: **Scene Editor** form
  - Scene Title input (optional, e.g., "Jay's vision of his future self")
  - Help text: "If provided, the title will be overlaid at the beginning of your scene for 3 seconds"
  - **Audio Options:**
    - Checkbox: "Loop audio to match video duration"
    - Help text explaining audio behavior
- Middle panel: **Clips** section
  - Tabs: "Video Assets (12)" | "Audio Assets (3)"
  - Sort: "Newest First" | "Hide Assembled..."
  - Grid of video/audio clips:
    - Thumbnail preview
    - "Preview" button overlay
    - Status indicator (Completed, Generating)
    - Title
    - Duration ("5s")
    - Description text
    - Three-dot menu
- Bottom panel: **Timeline**
  - Visual timeline showing:
    - Video track with clip thumbnails
    - Audio track with waveform
    - Duration indicators ("Videos: 1 | Audio: 0 | Duration: 13s / 60s")
    - Progress bar
  - "Assemble Scene" button (primary action)
- Preview section:
  - Black preview window
  - Playback controls

**Workflow:**
1. Select video clips from library
2. Drag clips to timeline
3. Add background audio (optional)
4. Add scene title (optional)
5. Preview scene
6. Assemble scene (processing)
7. Save to library

**Technical Details:**
- Maximum scene duration: 60 seconds
- Video clips concatenated in timeline order
- Audio looped or trimmed to match video length
- Title card generated automatically (3 seconds)
- Output: Single assembled .mp4 file

**User Actions:**
- Drag clips to timeline
- Reorder clips
- Add/remove clips
- Toggle audio looping
- Add scene title
- Preview before assembling
- Assemble final scene

**Screenshots Reference:** Scene Editor (Screenshot 12)

### 7. Story Page Builder

#### 7.1 Page Editor Interface
**Description:** Block-based editor for creating patient story pages

**Features:**
- Header:
  - "Page Editor" title
  - Patient name + content block count (e.g., "Jay - 0 content blocks")
  - Status: "Unsaved Changes", "Private", "Draft"
  - Actions: "Preview", "Save Page" buttons
- Left panel: **Page Settings**
  - **Title** input (e.g., "Jay's Story Page")
  - **Description** textarea ("Describe the therapeutic objective or purpose...")
  - **Therapeutic Content** section:
    - "0 Blocks • Drag to reorder"
    - Empty state: "Ready to Create" with guidance text
    - "+ Add Content Block" button
- Right panel: **Content Library**
  - Tabs: Media | Quotes | Notes
  - Media view:
    - "Media (29)" count with refresh
    - Upload/Create buttons
    - Filter: "All Sources" | "All Types"
    - Type tabs: "All (29)", "Videos (14)", "Images (12)", "Music (3)"
  - Media cards:
    - Thumbnail
    - Title
    - Type + timestamp
    - Description
    - Tags
    - "+ Add to Page" button (primary CTA)

**Block Types:**
- Video Block
- Image Block
- Text Block (for therapist notes)
- Reflection Questions Block
- Survey Block

**Page Workflow:**
1. Set page title and description
2. Add content blocks from library
3. Arrange blocks in desired order
4. Add reflection questions
5. Add survey (optional)
6. Preview page (mobile view)
7. Save and publish to patient

**User Actions:**
- Set page metadata
- Drag content from library
- Reorder blocks
- Add reflection questions
- Configure surveys
- Preview page
- Save/publish

**Screenshots Reference:** Page Editor (Screenshot 13)

#### 7.2 Page Content Blocks

**Video Block:**
- Video player
- Title overlay
- Description (optional)

**Reflection Questions Block:**
- Header: "Reflection Questions"
- Dropdown: "Show Options"
- Multiple text input fields
- Question types:
  - Open-ended text
  - Multiple choice (future)
  - Scale rating (future)

**Survey Block:**
- Header: "Patient Feedback"
- Dropdown: "Show Options"
- Survey question
- Response format (text, rating, scale)

**Assembled Scene Block:**
- Video player
- Scene title
- Generated timestamp
- Tags

#### 7.3 Page Preview (Mobile View)
**Description:** Patient-facing mobile interface

**Features:**
- Modal preview with device frame
- Tabs: Preview | Desktop | Mobile
- Page header:
  - StoryCare logo
  - Share icon
- Content display:
  - Page title ("Becoming your future self")
  - Page description
  - Content blocks in sequence:
    - **Assembled Scene** video player
    - **Reflection Questions** expandable section
    - Additional content blocks
- Bottom navigation: Back button

**Mobile Optimizations:**
- Vertical scrolling
- Touch-friendly video controls
- Expandable sections
- Clear typography hierarchy

**User Actions (Patient):**
- Scroll through content
- Play videos
- Answer reflection questions
- Submit survey responses
- Share page (future)

**Screenshots Reference:** Page Preview (Screenshot 14)

### 8. Dashboard & Analytics

#### 8.1 Therapist Dashboard
**Description:** Overview of patient engagement and outcomes

**Features:**
- Welcome message: "Welcome, Noah Hendler. Monitor your patients' engagement with their therapeutic content."
- Metric cards:
  - **8 Active Patients**
  - **1 Published Pages**
  - **3 Survey Responses**
  - **3 Written Reflections**
- **Recent Reflection Responses** table:
  - Columns: Patient, Question, Response, Page, When
  - Sample data showing patient answers
- **Recent Survey Responses** table:
  - Columns: Patient, Question, Response, Page, When
  - Sample data with numeric and text responses
- **Patient Engagement** section:
  - Expandable patient cards showing:
    - Patient avatar
    - Name
    - Metrics: Pages, Surveys, Reflections, Sessions
    - Last seen date
    - Status: Active/Inactive
  - Per-patient drill-down:
    - Tabs: Pages | Survey Responses | Reflections
    - Detailed response data

**User Actions:**
- View engagement overview
- Review recent responses
- Drill into patient details
- Search patients
- Export data (future)

**Screenshots Reference:** Dashboard (Screenshot 15)

#### 8.2 Patient Engagement Metrics

**Tracked Metrics:**
- Pages viewed
- Reflection questions answered
- Survey responses submitted
- Videos watched
- Session attendance
- Last active timestamp
- Response sentiment (future)

**Engagement Calculation:**
- Active: Engaged within last 7 days
- At Risk: No engagement for 7-14 days
- Inactive: No engagement for 14+ days

---

## User Flows

### Flow 1: Session Upload → Transcription → Speaker Labeling

```
1. Therapist logs in
   ↓
2. Navigate to "Sessions" from sidebar
   ↓
3. Click "+ New Session" button
   ↓
4. Upload Audio:
   - Enter session title
   - Select session date
   - Choose session type (Individual/Group)
   - Select patient or group
   - Drag & drop audio file OR click to browse
   ↓
5. Click "Continue to Speaker Labeling"
   ↓
6. System Processing:
   - Upload audio to Google Cloud Storage
   - Send to Deepgram API for transcription
   - Receive diarized transcript with speakers
   ↓
7. Speaker Management screen appears:
   - For each speaker (Speaker 0, Speaker 1, etc.):
     a. Play audio snippet
     b. Select speaker type (Therapist/Patient/Group Member)
     c. Enter speaker name
   - Use Merge Mode if duplicate speakers detected
   ↓
8. Click "Save Assignments"
   ↓
9. System saves:
   - Transcript with named speakers
   - Session metadata
   - Links to patient records
   ↓
10. Redirect to Transcript Analysis view
```

**Success Criteria:**
- Audio uploaded successfully (< 5 minutes for 1-hour session)
- Transcription accuracy > 90%
- All speakers labeled correctly
- Transcript searchable and playable

---

### Flow 2: Transcript Analysis → Image Generation → Media Library

```
1. From Session Library, click on a completed session
   ↓
2. Transcript Analysis view loads:
   - Left: Full transcript with speakers
   - Right: AI Assistant panel
   ↓
3. Therapist Actions (Choose one or more):

   Option A: AI Chat Analysis
   - Type question in AI Assistant
   - Review AI-generated insights
   - Save key insights to notes

   Option B: Analyze Specific Text
   - Highlight text in transcript
   - Click "Analyze Selection"
   - Choose prompt (e.g., "Potential Images")
   - Review image suggestions
   ↓
4. Generate Image:
   - From image suggestions, select one
   - Modal opens: "Generate Image"
   - Review/edit prompt
   - Confirm patient reference image is selected
   - Click "Generate Image"
   ↓
5. System Processing:
   - Send prompt + reference image to AI model
   - Generate image (15-30 seconds)
   - Save to Google Cloud Storage
   - Add to patient's media library
   ↓
6. Image appears in "Generation Result" panel
   ↓
7. Therapist Actions:
   - Preview image
   - Regenerate if needed
   - Close modal (image auto-saved)
   ↓
8. Navigate to "Assets" → Patient Library
   ↓
9. View newly generated image in Media tab
   - Image has tags: "Generated", patient name, "library_generated"
   - Includes generation timestamp and source info
```

**Success Criteria:**
- AI suggestions relevant to therapeutic context
- Image generation completes in < 30 seconds
- Generated image clearly depicts prompt concept
- Image properly saved to patient library
- Image maintains patient likeness (if reference used)

---

### Flow 3: Scene Creation → Story Page Assembly → Patient Interaction

```
1. Navigate to "Scenes" from sidebar
   ↓
2. Click on patient's scenes (e.g., "Jay's Scenes")
   ↓
3. Scene Editor loads:
   - Left: Scene Editor form
   - Middle: Clips library
   - Bottom: Timeline
   - Right: Preview
   ↓
4. Create Scene:
   a. Enter scene title (optional): "Jay's vision of his future self"
   b. Select video clips from library:
      - Click clips to add to timeline
      - Drag to reorder on timeline
   c. Add background audio (optional):
      - Switch to "Audio Assets" tab
      - Click audio to add
      - Toggle "Loop audio" if needed
   d. Preview scene
   e. Click "Assemble Scene"
   ↓
5. System Processing:
   - Concatenate video clips
   - Mix audio track
   - Add title card (if provided)
   - Render final video (30-60 seconds processing)
   ↓
6. Scene saved to library with status "Completed"
   ↓
7. Navigate to "Pages" from sidebar
   ↓
8. Create Story Page:
   a. Click "+ New Page" OR select existing page
   b. Enter page title: "Becoming your future self"
   c. Enter description (therapeutic objective)
   d. Add content from library:
      - Click "+ Add to Page" on assembled scene
      - Scene appears as Video Block
   e. Add Reflection Questions:
      - Click "+ Add Content Block"
      - Select "Reflection Questions"
      - Enter questions
   f. Add Survey (optional):
      - Click "+ Add Content Block"
      - Select "Survey"
      - Configure survey questions
   g. Preview page (mobile view)
   h. Click "Save Page"
   ↓
9. Page status changes from "Draft" to "Published"
   ↓
10. Patient Access:
    - Patient receives notification (email/SMS)
    - Opens story page on mobile device
    - Views content:
      * Reads page description
      * Watches assembled scene video
      * Reads reflection questions
      * Types answers to questions
      * Submits survey response
    - Submits responses
    ↓
11. Therapist Dashboard:
    - New responses appear in "Recent Reflection Responses"
    - New survey data appears in "Recent Survey Responses"
    - Patient engagement metrics update
    ↓
12. Therapist Reviews:
    - Navigate to Dashboard
    - Review patient responses
    - Identify themes
    - Plan next session based on insights
```

**Success Criteria:**
- Scene assembles without errors
- Page renders correctly on mobile
- Patient successfully views content
- Reflection responses captured accurately
- Survey data recorded with timestamp
- Therapist can view responses in real-time

---

### Flow 4: Dashboard Monitoring → Clinical Insights

```
1. Therapist logs in
   ↓
2. Dashboard loads (default view)
   ↓
3. Review Overview Metrics:
   - Active patients count
   - Published pages count
   - Survey responses count
   - Written reflections count
   ↓
4. Scan "Recent Reflection Responses":
   - Identify notable patient answers
   - Note which pages generated most engagement
   - Identify patients needing follow-up
   ↓
5. Scan "Recent Survey Responses":
   - Review quantitative feedback
   - Note sentiment/emotional responses
   - Compare responses across patients
   ↓
6. Patient Engagement Section:
   - Identify "Active" vs "Inactive" patients
   - Click on specific patient to expand
   ↓
7. Per-Patient Drill-Down:
   - View all pages patient has accessed
   - Review all survey responses
   - Read all reflection answers
   - Check last active timestamp
   - View session count
   ↓
8. Clinical Insights:
   - Identify patterns in responses
   - Note therapeutic progress
   - Flag concerns for next session
   - Adjust story page content strategy
   ↓
9. Action Items:
   - Create follow-up story page
   - Schedule next session
   - Adjust treatment plan
   - Export data for clinical records (future)
```

**Success Criteria:**
- Dashboard loads in < 2 seconds
- Real-time data (max 5-minute delay)
- Clear visual hierarchy of information
- Easy patient drill-down
- Actionable insights surfaced

---

## Database Schema

### ERD Overview

```
users
  ├── sessions (1:many)
  ├── patients (1:many, therapist_id)
  ├── groups (1:many, therapist_id)
  └── story_pages (1:many, created_by)

patients
  ├── sessions (1:many)
  ├── media_library (1:many)
  ├── quotes (1:many)
  ├── notes (1:many)
  ├── story_pages (1:many, patient_id)
  ├── reflection_responses (1:many)
  ├── survey_responses (1:many)
  └── group_members (1:many)

groups
  ├── group_members (1:many)
  └── sessions (1:many)

sessions
  ├── transcripts (1:1)
  ├── media_generated (1:many)
  └── quotes_extracted (1:many)

transcripts
  ├── speakers (1:many)
  └── utterances (1:many)

media_library
  ├── scenes (1:many, as source clips)
  └── story_page_blocks (1:many)

scenes
  ├── scene_clips (1:many)
  └── story_page_blocks (1:many)

story_pages
  ├── page_blocks (1:many)
  └── patient_interactions (1:many)

page_blocks
  ├── reflection_questions (1:many, if type=reflection)
  └── survey_questions (1:many, if type=survey)
```

---

### Table Schemas

#### **users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'therapist', 'patient', 'admin'
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,

  -- Therapist specific
  license_number VARCHAR(100),
  specialty TEXT,

  -- Patient specific (if role='patient')
  therapist_id UUID REFERENCES users(id),
  date_of_birth DATE,
  reference_image_url TEXT, -- For AI image generation

  -- Auth (Firebase)
  firebase_uid VARCHAR(255) UNIQUE
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_therapist_id ON users(therapist_id);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
```

#### **groups**
```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  therapist_id UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  archived_at TIMESTAMP
);

CREATE INDEX idx_groups_therapist_id ON groups(therapist_id);
```

#### **group_members**
```sql
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,

  UNIQUE(group_id, patient_id)
);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_patient_id ON group_members(patient_id);
```

#### **sessions**
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  session_date DATE NOT NULL,
  session_type VARCHAR(50) NOT NULL, -- 'individual', 'group'

  -- Relationships
  therapist_id UUID REFERENCES users(id) NOT NULL,
  patient_id UUID REFERENCES users(id), -- If individual
  group_id UUID REFERENCES groups(id), -- If group

  -- Audio
  audio_url TEXT NOT NULL,
  audio_duration_seconds INT,
  audio_file_size_bytes BIGINT,

  -- Processing status
  transcription_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  transcription_error TEXT,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT session_type_check CHECK (
    (session_type = 'individual' AND patient_id IS NOT NULL AND group_id IS NULL) OR
    (session_type = 'group' AND group_id IS NOT NULL AND patient_id IS NULL)
  )
);

CREATE INDEX idx_sessions_therapist_id ON sessions(therapist_id);
CREATE INDEX idx_sessions_patient_id ON sessions(patient_id);
CREATE INDEX idx_sessions_group_id ON sessions(group_id);
CREATE INDEX idx_sessions_session_date ON sessions(session_date DESC);
```

#### **transcripts**
```sql
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,

  -- Full transcript
  full_text TEXT NOT NULL,

  -- Deepgram metadata
  confidence_score DECIMAL(5,4),
  language_code VARCHAR(10) DEFAULT 'en',

  -- Status
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transcripts_session_id ON transcripts(session_id);
```

#### **speakers**
```sql
CREATE TABLE speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID REFERENCES transcripts(id) ON DELETE CASCADE,

  -- Diarization
  speaker_label VARCHAR(50) NOT NULL, -- 'Speaker 0', 'Speaker 1', etc.

  -- Identification
  speaker_type VARCHAR(50), -- 'therapist', 'patient', 'group_member'
  speaker_name VARCHAR(255),
  user_id UUID REFERENCES users(id), -- Link to patient if identified

  -- Stats
  total_utterances INT DEFAULT 0,
  total_duration_seconds INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(transcript_id, speaker_label)
);

CREATE INDEX idx_speakers_transcript_id ON speakers(transcript_id);
CREATE INDEX idx_speakers_user_id ON speakers(user_id);
```

#### **utterances**
```sql
CREATE TABLE utterances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id UUID REFERENCES transcripts(id) ON DELETE CASCADE,
  speaker_id UUID REFERENCES speakers(id) ON DELETE CASCADE,

  -- Content
  text TEXT NOT NULL,

  -- Timing
  start_time_seconds DECIMAL(10,3) NOT NULL,
  end_time_seconds DECIMAL(10,3) NOT NULL,

  -- Metadata
  confidence_score DECIMAL(5,4),
  sequence_number INT NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_utterances_transcript_id ON utterances(transcript_id);
CREATE INDEX idx_utterances_speaker_id ON utterances(speaker_id);
CREATE INDEX idx_utterances_start_time ON utterances(start_time_seconds);
CREATE INDEX idx_utterances_sequence ON utterances(transcript_id, sequence_number);
```

#### **media_library**
```sql
CREATE TABLE media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  patient_id UUID REFERENCES users(id) NOT NULL,
  created_by_therapist_id UUID REFERENCES users(id) NOT NULL,

  -- Media details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  media_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'audio'
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,

  -- File metadata
  file_size_bytes BIGINT,
  duration_seconds INT, -- For video/audio
  width_px INT, -- For image/video
  height_px INT,

  -- Source tracking
  source_type VARCHAR(50) NOT NULL, -- 'generated', 'uploaded', 'scene', 'animated_from_image'
  source_session_id UUID REFERENCES sessions(id),
  source_media_id UUID REFERENCES media_library(id), -- If derived from another media

  -- AI generation metadata
  generation_prompt TEXT,
  ai_model VARCHAR(100),
  reference_image_url TEXT,

  -- Tags
  tags TEXT[], -- Array of tags

  -- Status
  status VARCHAR(50) DEFAULT 'completed', -- 'processing', 'completed', 'failed'

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_media_library_patient_id ON media_library(patient_id);
CREATE INDEX idx_media_library_created_by ON media_library(created_by_therapist_id);
CREATE INDEX idx_media_library_source_session ON media_library(source_session_id);
CREATE INDEX idx_media_library_media_type ON media_library(media_type);
CREATE INDEX idx_media_library_created_at ON media_library(created_at DESC);
```

#### **quotes**
```sql
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  patient_id UUID REFERENCES users(id) NOT NULL,
  session_id UUID REFERENCES sessions(id),

  -- Quote content
  quote_text TEXT NOT NULL,
  speaker_id UUID REFERENCES speakers(id),

  -- Timing (if from transcript)
  start_time_seconds DECIMAL(10,3),
  end_time_seconds DECIMAL(10,3),

  -- Metadata
  priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high'
  tags TEXT[],
  notes TEXT,

  created_by_therapist_id UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_quotes_patient_id ON quotes(patient_id);
CREATE INDEX idx_quotes_session_id ON quotes(session_id);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);
```

#### **notes**
```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  patient_id UUID REFERENCES users(id) NOT NULL,
  therapist_id UUID REFERENCES users(id) NOT NULL,

  -- Content
  title VARCHAR(255),
  content TEXT NOT NULL,

  -- Context
  session_id UUID REFERENCES sessions(id),
  tags TEXT[],

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notes_patient_id ON notes(patient_id);
CREATE INDEX idx_notes_therapist_id ON notes(therapist_id);
CREATE INDEX idx_notes_session_id ON notes(session_id);
```

#### **scenes**
```sql
CREATE TABLE scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  patient_id UUID REFERENCES users(id) NOT NULL,
  created_by_therapist_id UUID REFERENCES users(id) NOT NULL,

  -- Scene details
  title VARCHAR(255),
  description TEXT,

  -- Output
  video_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INT,

  -- Audio settings
  background_audio_url TEXT,
  loop_audio BOOLEAN DEFAULT FALSE,

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'processing', 'completed', 'failed'
  processing_error TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scenes_patient_id ON scenes(patient_id);
CREATE INDEX idx_scenes_created_by ON scenes(created_by_therapist_id);
CREATE INDEX idx_scenes_status ON scenes(status);
```

#### **scene_clips**
```sql
CREATE TABLE scene_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media_library(id),

  -- Timeline position
  sequence_number INT NOT NULL,
  start_time_seconds DECIMAL(10,3) DEFAULT 0,
  end_time_seconds DECIMAL(10,3),

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(scene_id, sequence_number)
);

CREATE INDEX idx_scene_clips_scene_id ON scene_clips(scene_id);
CREATE INDEX idx_scene_clips_media_id ON scene_clips(media_id);
```

#### **story_pages**
```sql
CREATE TABLE story_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  patient_id UUID REFERENCES users(id) NOT NULL,
  created_by_therapist_id UUID REFERENCES users(id) NOT NULL,

  -- Page details
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'archived'
  visibility VARCHAR(50) DEFAULT 'private', -- 'private', 'patient_only'

  -- Publishing
  published_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_story_pages_patient_id ON story_pages(patient_id);
CREATE INDEX idx_story_pages_created_by ON story_pages(created_by_therapist_id);
CREATE INDEX idx_story_pages_status ON story_pages(status);
```

#### **page_blocks**
```sql
CREATE TABLE page_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES story_pages(id) ON DELETE CASCADE,

  -- Block type
  block_type VARCHAR(50) NOT NULL, -- 'video', 'image', 'text', 'reflection', 'survey'

  -- Position
  sequence_number INT NOT NULL,

  -- Content (depending on block_type)
  media_id UUID REFERENCES media_library(id),
  scene_id UUID REFERENCES scenes(id),
  text_content TEXT,

  -- Settings
  settings JSONB, -- Block-specific settings

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(page_id, sequence_number)
);

CREATE INDEX idx_page_blocks_page_id ON page_blocks(page_id);
CREATE INDEX idx_page_blocks_media_id ON page_blocks(media_id);
CREATE INDEX idx_page_blocks_scene_id ON page_blocks(scene_id);
```

#### **reflection_questions**
```sql
CREATE TABLE reflection_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID REFERENCES page_blocks(id) ON DELETE CASCADE,

  -- Question
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'open_text', -- 'open_text', 'multiple_choice', 'scale'

  -- Options (for multiple_choice)
  options JSONB, -- Array of options

  -- Position
  sequence_number INT NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(block_id, sequence_number)
);

CREATE INDEX idx_reflection_questions_block_id ON reflection_questions(block_id);
```

#### **survey_questions**
```sql
CREATE TABLE survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID REFERENCES page_blocks(id) ON DELETE CASCADE,

  -- Question
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL, -- 'scale', 'text', 'emotion', 'multiple_choice'

  -- Scale settings
  scale_min INT,
  scale_max INT,
  scale_min_label VARCHAR(100),
  scale_max_label VARCHAR(100),

  -- Options (for multiple_choice)
  options JSONB,

  -- Position
  sequence_number INT NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(block_id, sequence_number)
);

CREATE INDEX idx_survey_questions_block_id ON survey_questions(block_id);
```

#### **reflection_responses**
```sql
CREATE TABLE reflection_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  patient_id UUID REFERENCES users(id) NOT NULL,
  page_id UUID REFERENCES story_pages(id) NOT NULL,
  question_id UUID REFERENCES reflection_questions(id) NOT NULL,

  -- Response
  response_text TEXT NOT NULL,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reflection_responses_patient_id ON reflection_responses(patient_id);
CREATE INDEX idx_reflection_responses_page_id ON reflection_responses(page_id);
CREATE INDEX idx_reflection_responses_question_id ON reflection_responses(question_id);
CREATE INDEX idx_reflection_responses_created_at ON reflection_responses(created_at DESC);
```

#### **survey_responses**
```sql
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  patient_id UUID REFERENCES users(id) NOT NULL,
  page_id UUID REFERENCES story_pages(id) NOT NULL,
  question_id UUID REFERENCES survey_questions(id) NOT NULL,

  -- Response
  response_value TEXT, -- Could be number, text, or emotion
  response_numeric INT, -- For scale responses

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_survey_responses_patient_id ON survey_responses(patient_id);
CREATE INDEX idx_survey_responses_page_id ON survey_responses(page_id);
CREATE INDEX idx_survey_responses_question_id ON survey_responses(question_id);
CREATE INDEX idx_survey_responses_created_at ON survey_responses(created_at DESC);
```

#### **patient_page_interactions**
```sql
CREATE TABLE patient_page_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context
  patient_id UUID REFERENCES users(id) NOT NULL,
  page_id UUID REFERENCES story_pages(id) NOT NULL,

  -- Interaction tracking
  first_viewed_at TIMESTAMP,
  last_viewed_at TIMESTAMP,
  view_count INT DEFAULT 0,

  -- Completion tracking
  reflection_completed BOOLEAN DEFAULT FALSE,
  survey_completed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(patient_id, page_id)
);

CREATE INDEX idx_patient_page_interactions_patient_id ON patient_page_interactions(patient_id);
CREATE INDEX idx_patient_page_interactions_page_id ON patient_page_interactions(page_id);
```

---

## Technical Architecture

### Tech Stack Summary

**Frontend:**
- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4
- **UI Components:** Custom components (no external UI library initially)
- **State Management:** React Context + Server Components
- **Forms:** React Hook Form + Zod validation

**Backend:**
- **API:** Next.js App Router API routes
- **Database:** Neon PostgreSQL (serverless)
- **ORM:** DrizzleORM (type-safe)
- **Authentication:** Firebase Authentication (Google Identity Platform)
- **Storage:** Google Cloud Storage (audio, images, videos)

**AI Services:**
- **Transcription:** Deepgram (speech-to-text with diarization)
- **Image Generation:** OpenAI DALL-E 3 or Flux (via API)
- **Video Animation:** Runway ML or Stability AI (future)
- **AI Assistant:** OpenAI GPT-4 (chat and analysis)

**Hosting & Infrastructure:**
- **Hosting:** Vercel (Enterprise Plan)
- **CDN:** Vercel Edge Network
- **Media Processing:** Cloudinary or FFmpeg (video editing)
- **Email:** SendGrid or Resend
- **SMS:** Twilio (patient notifications)

**Monitoring & Observability:**
- **Error Tracking:** Sentry
- **Logging:** LogTape + Better Stack
- **Analytics:** PostHog
- **Uptime:** Checkly

---

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Therapist Web App          │     Patient Mobile Web             │
│  (Next.js Desktop)          │     (Next.js PWA)                  │
│  - Session Management       │     - View Story Pages             │
│  - Transcript Analysis      │     - Watch Videos                 │
│  - Media Generation         │     - Answer Reflections           │
│  - Scene Editor             │     - Submit Surveys               │
│  - Page Builder             │                                    │
│  - Dashboard                │                                    │
└──────────────┬──────────────┴─────────────────┬─────────────────┘
               │                                 │
               │ HTTPS                           │ HTTPS
               │                                 │
┌──────────────▼─────────────────────────────────▼─────────────────┐
│                    APPLICATION LAYER                              │
│                    (Next.js App Router)                           │
├──────────────────────────────────────────────────────────────────┤
│  API Routes:                                                     │
│  /api/sessions          - Upload, list, get sessions             │
│  /api/transcripts       - Get, search transcripts                │
│  /api/speakers          - Manage speaker labels                  │
│  /api/media             - Generate images/videos, get library    │
│  /api/scenes            - Create, assemble scenes                │
│  /api/pages             - CRUD story pages                       │
│  /api/reflections       - Submit, get responses                  │
│  /api/surveys           - Submit, get responses                  │
│  /api/dashboard         - Get engagement metrics                 │
│                                                                  │
│  Middleware:                                                     │
│  - Firebase Auth verification                                    │
│  - Role-based access control (RBAC)                              │
│  - Rate limiting (Arcjet)                                        │
│  - Request logging                                               │
└──────────────┬───────────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────────┐
│                    SERVICE LAYER                                 │
├──────────────────────────────────────────────────────────────────┤
│  SessionService       - Upload, transcribe, manage sessions      │
│  TranscriptService    - Parse, search, analyze transcripts       │
│  MediaService         - Generate, store, retrieve media          │
│  SceneService         - Assemble video scenes                    │
│  PageService          - Build, publish story pages               │
│  AnalyticsService     - Calculate engagement metrics             │
│  NotificationService  - Send emails, SMS                         │
└──────┬───────────────────────────────────────────────────────────┘
       │
       │ Calls
       │
┌──────▼───────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                              │
├──────────────────────────────────────────────────────────────────┤
│  Deepgram API          - Transcription + Diarization             │
│  OpenAI API            - GPT-4 (chat), DALL-E 3 (images)         │
│  Google Cloud Storage  - Media file storage                      │
│  Firebase Auth         - User authentication                     │
│  SendGrid/Resend       - Email notifications                     │
│  Twilio                - SMS notifications                       │
│  FFmpeg (serverless)   - Video processing                        │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                   │
├──────────────────────────────────────────────────────────────────┤
│  Neon PostgreSQL (Primary Database)                             │
│  - Users, Sessions, Transcripts                                 │
│  - Media Library, Scenes, Story Pages                           │
│  - Reflections, Surveys, Analytics                              │
│                                                                  │
│  Google Cloud Storage (Object Storage)                          │
│  - Audio files (/sessions/{session_id}/audio.m4a)               │
│  - Generated images (/media/{patient_id}/images/)               │
│  - Generated videos (/media/{patient_id}/videos/)               │
│  - Reference images (/patients/{patient_id}/reference.jpg)      │
└──────────────────────────────────────────────────────────────────┘
```

---

### Data Flow: Session Upload to Story Page

```
1. UPLOAD AUDIO
   Therapist → Next.js API → GCS
   - Upload audio file to Google Cloud Storage
   - Store GCS URL in sessions table

2. TRANSCRIBE
   Next.js API → Deepgram API
   - Send audio URL to Deepgram
   - Receive diarized transcript JSON
   - Parse and store in transcripts, speakers, utterances tables

3. LABEL SPEAKERS
   Therapist → Next.js API → Database
   - Update speakers table with names and types
   - Link speakers to users table (patients)

4. ANALYZE TRANSCRIPT
   Therapist → Next.js API → OpenAI GPT-4
   - Send transcript + prompt to GPT-4
   - Receive analysis/suggestions
   - Cache responses in session storage

5. GENERATE IMAGE
   Therapist → Next.js API → OpenAI DALL-E
   - Send prompt + reference image to DALL-E
   - Receive generated image URL
   - Upload to GCS, store in media_library table

6. CREATE SCENE
   Therapist → Next.js API → FFmpeg (serverless)
   - Fetch video clips from media_library
   - Concatenate clips, add audio, add title card
   - Render final video
   - Upload to GCS, store in scenes table

7. BUILD STORY PAGE
   Therapist → Next.js API → Database
   - Create story_page record
   - Add page_blocks (video, reflection, survey)
   - Add reflection_questions
   - Add survey_questions
   - Set status to 'published'

8. PATIENT VIEWS PAGE
   Patient → Next.js API → Database
   - Fetch story_page with blocks
   - Track page_interactions (view count, timestamps)
   - Display content

9. PATIENT SUBMITS RESPONSES
   Patient → Next.js API → Database
   - Store reflection_responses
   - Store survey_responses
   - Update page_interactions (completion flags)

10. THERAPIST VIEWS DASHBOARD
    Therapist → Next.js API → Database
    - Aggregate reflection_responses, survey_responses
    - Calculate engagement metrics
    - Display on dashboard
```

---

## UI/UX Specifications

### Design System

#### Color Palette
```css
/* Primary Colors */
--primary-blue: #4F46E5; /* Primary CTA buttons */
--primary-blue-dark: #4338CA;
--primary-blue-light: #818CF8;

/* Accent Colors */
--purple-gradient-start: #6366F1;
--purple-gradient-end: #8B5CF6;

/* Neutral Colors */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-500: #6B7280;
--gray-700: #374151;
--gray-900: #111827;

/* Semantic Colors */
--success-green: #10B981;
--warning-yellow: #F59E0B;
--error-red: #EF4444;
--info-blue: #3B82F6;

/* Status Colors */
--status-active: #10B981;
--status-processing: #F59E0B;
--status-completed: #3B82F6;
--status-draft: #6B7280;
```

#### Typography
```css
/* Font Family */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

#### Spacing
```css
/* Spacing Scale (based on 4px) */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

#### Border Radius
```css
--radius-sm: 0.375rem;  /* 6px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-full: 9999px;  /* Circular */
```

---

### Layout Structure

#### Global Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Top Bar (64px height)                                      │
│  [ Logo ]  [ Nav Tabs ]           [ Share ] [ Publish ]     │
└─────────────────────────────────────────────────────────────┘
┌──────────┬──────────────────────────────────────────────────┐
│          │                                                  │
│  Sidebar │           Main Content Area                      │
│  (240px) │           (Responsive width)                     │
│          │                                                  │
│  - Dash  │                                                  │
│  - Sess  │                                                  │
│  - Asset │                                                  │
│  - Scene │                                                  │
│  - Pages │                                                  │
│  - Admin │                                                  │
│          │                                                  │
│          │                                                  │
│          │                                                  │
│  [User]  │                                                  │
│  [Logout]│                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

#### Sidebar Navigation
- **Width:** 240px
- **Background:** White with slight shadow
- **Active state:** Light blue background (#EEF2FF)
- **Icons:** 20x20px
- **Font:** text-sm (14px), font-medium
- **Padding:** py-3 px-4 per item

**Navigation Items:**
1. Dashboard (grid icon)
2. Sessions (folder icon)
3. Assets (image icon)
4. Scenes (film icon)
5. Pages (document icon)
6. Admin (shield icon)

**Bottom Section:**
- User avatar + name + email
- Logout button

---

### Component Specifications

#### 1. Button Styles

**Primary Button:**
```css
background: #4F46E5;
color: white;
padding: 10px 20px;
border-radius: 8px;
font-weight: 600;
font-size: 14px;
transition: all 0.2s;

hover:
  background: #4338CA;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
```

**Secondary Button:**
```css
background: white;
color: #374151;
border: 1px solid #D1D5DB;
padding: 10px 20px;
border-radius: 8px;
font-weight: 600;
font-size: 14px;

hover:
  background: #F9FAFB;
  border-color: #9CA3AF;
```

**Icon Button:**
```css
width: 40px;
height: 40px;
border-radius: 8px;
background: transparent;
color: #6B7280;

hover:
  background: #F3F4F6;
  color: #374151;
```

#### 2. Input Fields

**Text Input:**
```css
background: white;
border: 1px solid #D1D5DB;
border-radius: 8px;
padding: 10px 14px;
font-size: 14px;
color: #111827;

focus:
  border-color: #4F46E5;
  outline: none;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);

placeholder:
  color: #9CA3AF;
```

**Dropdown/Select:**
```css
Same as text input, with chevron-down icon on right
```

**Search Input:**
```css
Same as text input, with search icon on left
padding-left: 40px;
```

#### 3. Modal Dialog

**Overlay:**
```css
background: rgba(0, 0, 0, 0.5);
backdrop-filter: blur(4px);
z-index: 1000;
```

**Dialog Container:**
```css
background: white;
border-radius: 16px;
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
max-width: 900px;
max-height: 90vh;
overflow-y: auto;
```

**Dialog Header:**
```css
padding: 24px;
border-bottom: 1px solid #E5E7EB;

Title: font-size: 18px, font-weight: 600
Close button: top-right, icon-button style
```

**Dialog Body:**
```css
padding: 24px;
```

**Dialog Footer:**
```css
padding: 16px 24px;
border-top: 1px solid #E5E7EB;
display: flex;
justify-content: flex-end;
gap: 12px;
```

#### 4. File Upload Area

**Drag & Drop Zone:**
```css
border: 2px dashed #D1D5DB;
border-radius: 12px;
padding: 48px;
text-align: center;
background: #F9FAFB;
transition: all 0.2s;

hover:
  border-color: #4F46E5;
  background: #EEF2FF;

dragging:
  border-color: #4F46E5;
  background: #EEF2FF;
  border-width: 3px;
```

**Upload Icon:**
```css
Cloud upload icon
Size: 48x48px
Color: #9CA3AF
Margin-bottom: 16px
```

**Upload Text:**
```css
Primary text: "Drag & drop an audio file here"
  font-size: 16px, font-weight: 500, color: #374151
Secondary text: "or click to select a file"
  font-size: 14px, color: #6B7280
```

#### 5. Media Cards

**Grid Layout:**
```css
display: grid;
grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
gap: 20px;
```

**Card:**
```css
background: white;
border: 1px solid #E5E7EB;
border-radius: 12px;
overflow: hidden;
transition: all 0.2s;

hover:
  border-color: #4F46E5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
```

**Card Thumbnail:**
```css
width: 100%;
aspect-ratio: 16/9;
object-fit: cover;
background: #F3F4F6;
```

**Card Body:**
```css
padding: 16px;
```

**Card Title:**
```css
font-size: 14px;
font-weight: 600;
color: #111827;
margin-bottom: 8px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
```

**Card Meta:**
```css
font-size: 12px;
color: #6B7280;
display: flex;
align-items: center;
gap: 8px;
```

**Card Tags:**
```css
display: flex;
flex-wrap: wrap;
gap: 6px;
margin-top: 12px;
```

**Tag Badge:**
```css
background: #EEF2FF;
color: #4F46E5;
font-size: 11px;
font-weight: 500;
padding: 4px 8px;
border-radius: 4px;
```

#### 6. Timeline/Scene Editor

**Timeline Container:**
```css
background: #F9FAFB;
border: 1px solid #E5E7EB;
border-radius: 12px;
padding: 20px;
min-height: 200px;
```

**Track:**
```css
background: white;
border-radius: 8px;
min-height: 80px;
padding: 12px;
margin-bottom: 12px;
```

**Track Label:**
```css
font-size: 12px;
font-weight: 600;
color: #6B7280;
text-transform: uppercase;
letter-spacing: 0.05em;
margin-bottom: 8px;
```

**Clip on Timeline:**
```css
background: #4F46E5;
border-radius: 6px;
height: 56px;
display: inline-flex;
align-items: center;
padding: 0 12px;
color: white;
cursor: move;
margin-right: 8px;
```

**Progress Bar:**
```css
height: 4px;
background: #E5E7EB;
border-radius: 2px;
margin-top: 16px;
position: relative;

progress:
  height: 100%;
  background: #4F46E5;
  border-radius: 2px;
```

#### 7. Dashboard Metric Cards

**Metric Card:**
```css
background: white;
border: 1px solid #E5E7EB;
border-radius: 12px;
padding: 24px;
display: flex;
align-items: center;
gap: 16px;
```

**Metric Icon:**
```css
width: 48px;
height: 48px;
border-radius: 10px;
background: #EEF2FF;
color: #4F46E5;
display: flex;
align-items: center;
justify-content: center;
```

**Metric Content:**
```css
Value:
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  line-height: 1;

Label:
  font-size: 14px;
  color: #6B7280;
  margin-top: 4px;
```

#### 8. Tables

**Table Container:**
```css
background: white;
border: 1px solid #E5E7EB;
border-radius: 12px;
overflow: hidden;
```

**Table Header:**
```css
background: #F9FAFB;
border-bottom: 1px solid #E5E7EB;
font-size: 12px;
font-weight: 600;
color: #6B7280;
text-transform: uppercase;
letter-spacing: 0.05em;
padding: 12px 16px;
```

**Table Row:**
```css
border-bottom: 1px solid #E5E7EB;
transition: background 0.2s;

hover:
  background: #F9FAFB;
```

**Table Cell:**
```css
padding: 16px;
font-size: 14px;
color: #374151;
```

---

### Mobile Responsive Breakpoints

```css
/* Mobile First */
@media (min-width: 640px) {  /* sm */
  /* Small tablets */
}

@media (min-width: 768px) {  /* md */
  /* Tablets */
  - Show sidebar
  - Two-column layouts
}

@media (min-width: 1024px) { /* lg */
  /* Desktops */
  - Three-column layouts
  - Expanded sidebars
}

@media (min-width: 1280px) { /* xl */
  /* Large desktops */
  - Four-column grids
  - Maximum content width: 1280px
}
```

**Mobile (< 768px):**
- Hide sidebar, use hamburger menu
- Single column layouts
- Bottom navigation for key actions
- Full-width modals

**Tablet (768px - 1024px):**
- Collapsible sidebar
- Two-column grid for media
- Side-by-side forms

**Desktop (> 1024px):**
- Full sidebar visible
- Multi-column layouts
- Split-view transcript analyzer
- Side panels for auxiliary content

---

## API Endpoints

### Authentication Endpoints

**POST /api/auth/login**
- Body: `{ email, password }`
- Response: `{ user, token }`

**POST /api/auth/logout**
- Headers: `Authorization: Bearer <token>`
- Response: `{ success: true }`

**GET /api/auth/me**
- Headers: `Authorization: Bearer <token>`
- Response: `{ user }`

---

### Session Endpoints

**GET /api/sessions**
- Query: `therapist_id`, `patient_id`, `group_id`, `start_date`, `end_date`
- Response: `{ sessions: Session[] }`

**POST /api/sessions**
- Body: `{ title, session_date, session_type, patient_id?, group_id?, audio_file }`
- Response: `{ session: Session, upload_url: string }`
- Note: Returns presigned GCS upload URL

**GET /api/sessions/:id**
- Response: `{ session: Session, transcript?: Transcript }`

**PUT /api/sessions/:id**
- Body: `{ title?, session_date? }`
- Response: `{ session: Session }`

**DELETE /api/sessions/:id**
- Response: `{ success: true }`

---

### Transcription Endpoints

**POST /api/transcripts/process**
- Body: `{ session_id, audio_url }`
- Response: `{ job_id: string }`
- Note: Triggers async Deepgram processing

**GET /api/transcripts/:session_id**
- Response: `{ transcript: Transcript, speakers: Speaker[], utterances: Utterance[] }`

**POST /api/transcripts/:session_id/speakers**
- Body: `{ speakers: { speaker_label, speaker_type, speaker_name, user_id }[] }`
- Response: `{ speakers: Speaker[] }`

**GET /api/transcripts/:session_id/search**
- Query: `q` (search term)
- Response: `{ results: { utterance_id, text, start_time, speaker_name }[] }`

---

### AI Assistant Endpoints

**POST /api/ai/analyze**
- Body: `{ session_id, selected_text?, prompt_type, custom_prompt? }`
- Response: `{ analysis: string | object }`
- Prompt types: `therapeutic_alliance`, `potential_images`, `group_note`, `potential_scenes`, `create_image`

**POST /api/ai/chat**
- Body: `{ session_id, message, conversation_history? }`
- Response: `{ response: string, conversation_id: string }`

---

### Media Generation Endpoints

**POST /api/media/generate-image**
- Body: `{ patient_id, prompt, reference_image_url?, ai_model?, session_id? }`
- Response: `{ media: MediaLibrary, status: 'processing' | 'completed' }`

**POST /api/media/generate-video**
- Body: `{ patient_id, source_image_id, prompt?, duration_seconds?, session_id? }`
- Response: `{ media: MediaLibrary, status: 'processing' | 'completed' }`

**GET /api/media/library/:patient_id**
- Query: `media_type`, `source_type`, `tags`, `search`
- Response: `{ media: MediaLibrary[] }`

**POST /api/media/upload**
- Body: `FormData` with `file`, `patient_id`, `title`, `tags`
- Response: `{ media: MediaLibrary, upload_url: string }`

**DELETE /api/media/:id**
- Response: `{ success: true }`

---

### Quote Endpoints

**GET /api/quotes/:patient_id**
- Query: `session_id`, `search`, `priority`
- Response: `{ quotes: Quote[] }`

**POST /api/quotes**
- Body: `{ patient_id, session_id?, quote_text, speaker_id?, start_time?, end_time?, priority?, tags? }`
- Response: `{ quote: Quote }`

**PUT /api/quotes/:id**
- Body: `{ quote_text?, priority?, tags?, notes? }`
- Response: `{ quote: Quote }`

**DELETE /api/quotes/:id**
- Response: `{ success: true }`

---

### Scene Endpoints

**GET /api/scenes/:patient_id**
- Response: `{ scenes: Scene[] }`

**POST /api/scenes**
- Body: `{ patient_id, title?, description?, clips: { media_id, sequence_number }[], background_audio_url?, loop_audio? }`
- Response: `{ scene: Scene, status: 'draft' }`

**POST /api/scenes/:id/assemble**
- Response: `{ scene: Scene, status: 'processing', job_id: string }`
- Note: Triggers async video assembly

**GET /api/scenes/:id/status**
- Response: `{ scene: Scene, status: 'processing' | 'completed' | 'failed', progress?: number }`

**DELETE /api/scenes/:id**
- Response: `{ success: true }`

---

### Story Page Endpoints

**GET /api/pages/:patient_id**
- Query: `status`
- Response: `{ pages: StoryPage[] }`

**POST /api/pages**
- Body: `{ patient_id, title, description, blocks: { block_type, sequence_number, media_id?, scene_id?, text_content?, settings? }[] }`
- Response: `{ page: StoryPage }`

**GET /api/pages/:id**
- Response: `{ page: StoryPage, blocks: PageBlock[], questions: ReflectionQuestion[], surveys: SurveyQuestion[] }`

**PUT /api/pages/:id**
- Body: `{ title?, description?, status?, blocks? }`
- Response: `{ page: StoryPage }`

**POST /api/pages/:id/publish**
- Response: `{ page: StoryPage, status: 'published', published_at: timestamp }`

**DELETE /api/pages/:id**
- Response: `{ success: true }`

---

### Reflection & Survey Endpoints

**POST /api/reflections/submit**
- Body: `{ patient_id, page_id, responses: { question_id, response_text }[] }`
- Response: `{ reflections: ReflectionResponse[] }`

**POST /api/surveys/submit**
- Body: `{ patient_id, page_id, responses: { question_id, response_value, response_numeric? }[] }`
- Response: `{ surveys: SurveyResponse[] }`

**GET /api/reflections/:page_id**
- Response: `{ responses: ReflectionResponse[] }`

**GET /api/surveys/:page_id**
- Response: `{ responses: SurveyResponse[] }`

---

### Dashboard Endpoints

**GET /api/dashboard/metrics**
- Query: `therapist_id`
- Response:
```json
{
  "active_patients": 8,
  "published_pages": 1,
  "survey_responses": 3,
  "written_reflections": 3,
  "recent_reflections": ReflectionResponse[],
  "recent_surveys": SurveyResponse[]
}
```

**GET /api/dashboard/patient-engagement**
- Query: `therapist_id`, `patient_id?`
- Response:
```json
{
  "patients": [
    {
      "patient": User,
      "pages_count": 2,
      "surveys_count": 1,
      "reflections_count": 3,
      "sessions_count": 4,
      "last_active": timestamp,
      "status": "active" | "at_risk" | "inactive"
    }
  ]
}
```

---

## Security & Compliance

### HIPAA Compliance Considerations

**1. Data Encryption**
- **At Rest:** All data in Neon PostgreSQL encrypted with AES-256
- **In Transit:** All connections use TLS 1.3
- **Media Files:** Google Cloud Storage with encryption at rest
- **Backups:** Encrypted backups with 30-day retention

**2. Access Controls**
- **Role-Based Access Control (RBAC):**
  - Therapist: Access to own sessions, own patients, patient data
  - Patient: Access to own story pages, own reflections
  - Admin: Access to all data, user management
- **Authentication:** Firebase Auth with MFA required for therapists
- **Session Management:** JWT tokens with 24-hour expiration
- **API Rate Limiting:** Arcjet (100 req/min per user)

**3. Audit Logging**
- Log all data access events:
  - User login/logout
  - Session uploads
  - Transcript views
  - Media generation
  - Story page views
  - Patient data access
- Logs stored for 7 years (HIPAA requirement)
- Tamper-proof audit trail

**4. Data Minimization**
- Only collect necessary PHI (Protected Health Information)
- Anonymize data in analytics dashboards
- No unnecessary PII in logs

**5. Breach Notification**
- Automated breach detection system
- 60-day notification requirement (HIPAA)
- Incident response plan documented

**6. Business Associate Agreements (BAA)**
- Required with:
  - Neon (database)
  - Google Cloud (storage)
  - Deepgram (transcription)
  - Vercel (hosting)
  - Sentry (error tracking)

**7. Patient Rights**
- **Right to Access:** Patients can export their data via API
- **Right to Deletion:** Soft delete with 90-day retention, then hard delete
- **Right to Correct:** Patients/therapists can update information

---

### Data Privacy Features

**1. Consent Management**
- Patient consent required before:
  - Session recording
  - AI-generated media using their likeness
  - Sharing story pages
- Consent tracking in database

**2. Anonymization**
- Transcripts can be de-identified:
  - Remove names
  - Replace with pseudonyms
  - Strip identifying details
- Used for research/training purposes (opt-in)

**3. Data Retention**
- Active patients: Data retained indefinitely
- Inactive patients (no activity 2+ years): Notification before archival
- Archived data: Retained for 7 years, then deleted
- Backups: 30-day rolling window

**4. Data Export**
- Patients can request full data export (JSON/PDF)
- Therapists can export session data
- Compliance with GDPR "Right to Portability"

---

### Security Best Practices

**1. Input Validation**
- All user inputs validated with Zod schemas
- SQL injection prevention via DrizzleORM parameterized queries
- XSS prevention via React auto-escaping
- CSRF protection via SameSite cookies

**2. File Upload Security**
- File type validation (audio only)
- File size limits (max 500MB per session)
- Virus scanning before processing (ClamAV)
- Presigned URLs for direct GCS uploads

**3. API Security**
- All endpoints require authentication
- Rate limiting per user (Arcjet)
- Request size limits (max 10MB)
- CORS configured for known origins only

**4. Secrets Management**
- Environment variables via Vercel
- Secrets never committed to git
- Rotation policy for API keys (90 days)

**5. Dependency Security**
- Automated dependency updates (Dependabot)
- Vulnerability scanning (Snyk)
- Lock files committed (package-lock.json)

---

## Success Metrics

### Product KPIs

**1. User Engagement**
- **MAU (Monthly Active Users):** Therapists logging in monthly
  - Target: 80% of registered therapists
- **Session Upload Rate:** Average sessions uploaded per therapist per month
  - Target: 10+ sessions/month
- **Media Generation Rate:** Images/videos generated per session
  - Target: 3+ media items per session
- **Story Page Creation Rate:** Pages created per therapist per month
  - Target: 2+ pages/month

**2. Patient Engagement**
- **Story Page View Rate:** % of published pages viewed by patients
  - Target: 90%+
- **Reflection Completion Rate:** % of patients who answer reflection questions
  - Target: 70%+
- **Survey Completion Rate:** % of patients who submit surveys
  - Target: 60%+
- **Return Visit Rate:** Patients returning to view pages multiple times
  - Target: 50%+

**3. Therapeutic Outcomes**
- **Patient Satisfaction:** Survey scores (1-10 scale)
  - Target: 8+ average
- **Therapist Satisfaction:** NPS (Net Promoter Score)
  - Target: 50+ NPS
- **Treatment Progress:** Self-reported improvement scores
  - Measured via standardized surveys (PHQ-9, GAD-7)
  - Target: 30% improvement over 12 weeks

**4. Technical Performance**
- **Transcription Accuracy:** Word Error Rate (WER)
  - Target: <10% WER
- **Image Generation Success Rate:** % of successful image generations
  - Target: 95%+
- **Video Assembly Success Rate:** % of successful scene assemblies
  - Target: 90%+
- **Page Load Time:** Time to interactive
  - Target: <2 seconds
- **Uptime:** System availability
  - Target: 99.9%

**5. Business Metrics**
- **Customer Acquisition Cost (CAC):** Cost per new therapist signup
- **Lifetime Value (LTV):** Revenue per therapist over lifetime
- **LTV:CAC Ratio:** Target 3:1
- **Churn Rate:** % of therapists leaving per month
  - Target: <5%
- **Expansion Revenue:** Upsell to enterprise/group plans

---

### Data Collection & Analysis

**1. Event Tracking (PostHog)**
Events to track:
- `session_uploaded`
- `transcription_completed`
- `speaker_labeled`
- `transcript_analyzed`
- `ai_chat_message_sent`
- `image_generated`
- `video_generated`
- `scene_created`
- `scene_assembled`
- `story_page_created`
- `story_page_published`
- `patient_page_viewed`
- `reflection_submitted`
- `survey_submitted`
- `dashboard_viewed`

**2. Feature Adoption**
Track % of users who have:
- Uploaded at least 1 session
- Generated at least 1 image
- Created at least 1 scene
- Published at least 1 story page
- Received at least 1 patient response

**3. Cohort Analysis**
Analyze retention by:
- Signup month
- User role (therapist/patient)
- Treatment setting (inpatient/outpatient)
- Geographic region

**4. A/B Testing**
Test variations on:
- AI prompt templates
- Story page layouts
- Reflection question formats
- Email/SMS notification copy

---

## Future Enhancements

### Phase 2 Features (3-6 months)

**1. Advanced AI Capabilities**
- **Sentiment Analysis:** Track emotional tone throughout sessions
- **Theme Extraction:** Automatically identify recurring therapeutic themes
- **Progress Tracking:** AI-generated progress reports
- **Predictive Insights:** Flag patients at risk of dropping out

**2. Collaboration Features**
- **Co-Therapy:** Multiple therapists collaborate on same patient
- **Clinical Supervision:** Supervisors review and comment on sessions
- **Peer Consultation:** Share anonymized cases with colleagues
- **Group Permissions:** Granular access control

**3. Enhanced Media**
- **3D Avatars:** Patient-specific 3D characters for storytelling
- **Voice Cloning:** Generate voiceovers in patient's voice (with consent)
- **Music Generation:** AI-composed background music for scenes
- **Interactive Media:** 360° scenes, branching narratives

**4. Patient Mobile App**
- **Native iOS/Android apps:** Better offline support
- **Push Notifications:** Timely reminders to engage with content
- **Journaling:** Patient self-reflection between sessions
- **Progress Visualization:** Charts showing therapeutic journey

---

### Phase 3 Features (6-12 months)

**1. Integrations**
- **EHR Integration:** Sync with Epic, Cerner, Athena Health
- **Telehealth Platforms:** Integrate with Zoom, Doxy.me
- **Billing Systems:** Export session notes for insurance claims
- **Calendar Sync:** Appointment scheduling integration

**2. Advanced Analytics**
- **Outcome Prediction Models:** ML models predicting treatment success
- **Therapist Performance Metrics:** Benchmark against peers (anonymized)
- **Program Effectiveness:** Track outcomes at organizational level
- **Cost-Benefit Analysis:** ROI calculations for treatment programs

**3. Content Marketplace**
- **Template Library:** Pre-built story page templates for common scenarios
- **Prompt Library:** Community-contributed AI prompts
- **Media Library:** Stock images/videos for therapeutic use
- **Training Materials:** Best practices, case studies, tutorials

**4. Research Tools**
- **Anonymized Data Export:** For academic research (IRB approved)
- **Aggregate Reporting:** De-identified trends across population
- **Study Management:** Built-in tools for clinical trials
- **Publication Support:** Automated citation generation

---

### Phase 4 Features (12+ months)

**1. Global Expansion**
- **Multi-Language Support:** Transcription + UI in 20+ languages
- **Cultural Adaptation:** Localized therapeutic approaches
- **Regulatory Compliance:** GDPR (EU), PIPEDA (Canada), etc.
- **International Hosting:** Region-specific data centers

**2. Enterprise Features**
- **White-Label:** Branded versions for large organizations
- **SSO Integration:** SAML, OAuth for enterprise auth
- **Custom Workflows:** Org-specific therapeutic protocols
- **Dedicated Support:** 24/7 phone support, account managers

**3. AI Therapist Copilot**
- **Real-Time Assistance:** AI suggestions during live sessions
- **Intervention Recommendations:** Evidence-based treatment suggestions
- **Risk Detection:** Real-time alerts for suicidal ideation, crisis situations
- **Documentation Automation:** Auto-generate SOAP notes, treatment plans

**4. Virtual Reality (VR)**
- **Immersive Story Pages:** View scenes in VR headset
- **Exposure Therapy:** VR environments for phobia treatment
- **Embodiment:** Patients "become" their future self in VR
- **Group VR Sessions:** Virtual group therapy rooms

---

## Appendix

### Glossary

- **Diarization:** Process of partitioning an audio stream into segments according to speaker identity
- **Narrative Therapy:** Therapeutic approach that views problems as separate from people and assumes people have skills to reduce problems
- **Reauthoring:** Process of creating alternative stories about one's life and identity
- **Story Page:** Patient-facing content page containing media, reflections, and surveys
- **Scene:** Assembled video combining multiple clips with audio and title card
- **Reference Image:** Photo of patient used for AI image generation to maintain likeness
- **Utterance:** Single continuous speech segment by one speaker
- **PHI (Protected Health Information):** Health information that can be linked to a specific individual (HIPAA term)
- **Therapeutic Alliance:** Relationship between therapist and client

---

### References

**Narrative Therapy:**
- White, M., & Epston, D. (1990). *Narrative Means to Therapeutic Ends*
- Freedman, J., & Combs, G. (1996). *Narrative Therapy: The Social Construction of Preferred Realities*

**Digital Therapeutics:**
- FDA Digital Health Center of Excellence: https://www.fda.gov/medical-devices/digital-health-center-excellence
- Digital Therapeutics Alliance: https://dtxalliance.org/

**HIPAA Compliance:**
- HHS HIPAA for Professionals: https://www.hhs.gov/hipaa/for-professionals/index.html
- HIPAA Security Rule: https://www.hhs.gov/hipaa/for-professionals/security/index.html

**AI Services:**
- Deepgram API Docs: https://developers.deepgram.com/
- OpenAI API Docs: https://platform.openai.com/docs/

---

### Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-29 | Product Team | Initial PRD based on walkthrough video and screenshots |

---

**End of Document**
