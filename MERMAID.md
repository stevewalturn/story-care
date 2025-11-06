# StoryCare System Architecture - Mermaid Diagrams

This document contains comprehensive Mermaid diagrams for the StoryCare digital therapeutic platform.

## Table of Contents
1. [Complete Session Workflow](#complete-session-workflow)
2. [AI Speaker Labeling Process](#ai-speaker-labeling-process)
3. [Authentication Flow](#authentication-flow)
4. [Database Schema Overview](#database-schema-overview)
5. [API Architecture](#api-architecture)

---

## Complete Session Workflow

### Full Journey: Audio Upload to Patient Story Page

```mermaid
flowchart TD
    Start([Therapist Uploads Audio]) --> Upload[Upload Audio File]
    Upload --> GCS1[Google Cloud Storage]
    GCS1 --> DB1[(Create Session Record)]

    DB1 --> Transcribe[POST /api/sessions/id/transcribe]

    Transcribe --> Deepgram[Deepgram API<br/>Model: nova-2]
    Deepgram --> DG_Process{Processing}

    DG_Process --> DG_Result[Transcription Result:<br/>- Full text<br/>- Speakers identified<br/>- Timestamps<br/>- Confidence scores]

    DG_Result --> DB2[(Store Transcript)]
    DB2 --> Speaker_Label[Therapist Labels Speakers<br/>Speaker 1 → Dr. Smith<br/>Speaker 2 → John]

    Speaker_Label --> AI_Analysis[POST /api/ai/chat]
    AI_Analysis --> GPT4[OpenAI GPT-4 Turbo]
    GPT4 --> Analysis[AI Analysis:<br/>- Key themes<br/>- Emotional patterns<br/>- Growth indicators<br/>- Therapeutic insights]

    Analysis --> Extract_Quote[Extract Meaningful Quotes]
    Extract_Quote --> DB3[(Store Quotes)]

    DB3 --> Generate_Image[Generate Image]
    Generate_Image --> Image_Prompt[Generate DALL-E Prompt via GPT-4]
    Image_Prompt --> DALLE[OpenAI DALL-E 3]

    DALLE --> DALLE_Config{Image Configuration}
    DALLE_Config --> Size[Size: 1024x1024<br/>1792x1024<br/>1024x1792]
    DALLE_Config --> Quality[Quality: standard/hd]
    DALLE_Config --> Style[Style: natural/vivid]

    Size & Quality & Style --> DALLE_Result[Generated Image URL]
    DALLE_Result --> GCS2[Download & Store in GCS]
    GCS2 --> DB4[(Store in media_library)]

    DB4 --> Assets[View in /assets page]
    Assets --> Story_Page[Create Story Page]
    Story_Page --> Patient_View[Patient Views Story Page]

    Patient_View --> Reflection[Patient Answers<br/>Reflection Questions]
    Reflection --> DB5[(Store Responses)]
    DB5 --> Dashboard[Analytics Dashboard]

    style Deepgram fill:#4A90E2
    style GPT4 fill:#10A37F
    style DALLE fill:#10A37F
    style GCS1 fill:#EA4335
    style GCS2 fill:#EA4335
    style DB1 fill:#336791
    style DB2 fill:#336791
    style DB3 fill:#336791
    style DB4 fill:#336791
    style DB5 fill:#336791
```

---

## AI Speaker Labeling Process

### Overview: How Speaker Identification Works

This section explains how StoryCare uses Deepgram AI for speaker diarization (separating voices) and manual labeling for speaker identification.

**Important:** The system uses **AI for voice separation** but **manual labeling for identification**. There is no automated AI that determines "therapist vs patient" - this requires clinical judgment.

### 1. Complete Speaker Labeling Workflow

```mermaid
flowchart TD
    Start([Audio File Uploaded]) --> Session[Session Created in DB]
    Session --> Transcribe[POST /api/sessions/id/transcribe]

    Transcribe --> Deepgram[Deepgram API Call]

    Deepgram --> DG_Config{Deepgram Configuration}
    DG_Config --> Model[Model: nova-2<br/>Most accurate model]
    DG_Config --> Diarize[Diarization: true<br/>Separate speakers]
    DG_Config --> Utterances[Utterances: true<br/>Segment by speaker]
    DG_Config --> Smart[Smart Format: true<br/>Add punctuation]

    Model & Diarize & Utterances & Smart --> DG_Process[Deepgram Processes Audio]

    DG_Process --> DG_Result{Deepgram Response}

    DG_Result --> FullText[Full Transcript Text]
    DG_Result --> UtteranceList[Utterances Array]

    UtteranceList --> U1[Utterance 1:<br/>Speaker: 0<br/>Start: 0.5s<br/>End: 3.2s<br/>Text: 'Hello...'<br/>Confidence: 0.98]

    UtteranceList --> U2[Utterance 2:<br/>Speaker: 1<br/>Start: 3.5s<br/>End: 8.1s<br/>Text: 'Hi doctor...'<br/>Confidence: 0.95]

    UtteranceList --> U3[Utterance 3:<br/>Speaker: 0<br/>Start: 8.5s<br/>End: 12.3s<br/>Text: 'How are you?'<br/>Confidence: 0.97]

    U1 & U2 & U3 --> GroupSpeakers[Group by Speaker ID]

    GroupSpeakers --> CreateSpeakers[Create Speaker Records]
    CreateSpeakers --> S1[Speaker 1<br/>speakerLabel: 'Speaker 1'<br/>speakerType: null<br/>speakerName: null<br/>totalUtterances: 45<br/>totalDuration: 180s]

    CreateSpeakers --> S2[Speaker 2<br/>speakerLabel: 'Speaker 2'<br/>speakerType: null<br/>speakerName: null<br/>totalUtterances: 38<br/>totalDuration: 150s]

    S1 & S2 --> StoreDB[(Store in Database:<br/>- transcript<br/>- speakers<br/>- utterances)]

    StoreDB --> Navigate[Therapist Navigates to:<br/>/sessions/id/speakers]

    Navigate --> LoadUI[Load Speaker Labeling UI]

    LoadUI --> ShowCards[Show Speaker Cards:<br/>- Speaker 1 Card<br/>- Speaker 2 Card]

    ShowCards --> AudioSample[Generate Audio Samples<br/>GET /speakers/speakerId/audio]

    AudioSample --> FirstUtterances[Extract First 3 Utterances<br/>for Each Speaker]

    FirstUtterances --> PlayAudio[Therapist Plays Audio<br/>to Identify Voice]

    PlayAudio --> ManualLabel{Therapist Identifies}

    ManualLabel --> Label1[Speaker 1:<br/>Type: Therapist<br/>Name: Dr. Sarah Smith]

    ManualLabel --> Label2[Speaker 2:<br/>Type: Patient<br/>Name: John Doe]

    Label1 & Label2 --> SaveLabels[PUT /api/sessions/id/speakers]

    SaveLabels --> UpdateDB[(Update Database:<br/>- speakerType<br/>- speakerName<br/>- optional userId link)]

    UpdateDB --> Complete[✅ Speaker Labeling Complete]

    Complete --> NextStep[Proceed to:<br/>/sessions/id/transcript<br/>Transcript Viewer with<br/>Labeled Speakers]

    style Deepgram fill:#4F46E5,color:#fff
    style DG_Process fill:#4F46E5,color:#fff
    style ManualLabel fill:#F59E0B,color:#000
    style Complete fill:#10B981,color:#fff
```

### 2. Deepgram Speaker Diarization Process

```mermaid
sequenceDiagram
    participant Therapist
    participant API as API Route
    participant GCS as Google Cloud Storage
    participant Deepgram as Deepgram API
    participant DB as PostgreSQL

    Therapist->>API: POST /api/sessions/[id]/transcribe
    API->>DB: Fetch session record
    DB-->>API: Session with audioUrl

    API->>API: Update status: 'processing'

    API->>Deepgram: POST /listen<br/>{<br/>  url: audioUrl,<br/>  model: 'nova-2',<br/>  diarize: true,<br/>  utterances: true,<br/>  smart_format: true<br/>}

    Note over Deepgram: AI Processing:<br/>1. Speech-to-text<br/>2. Voice separation<br/>3. Speaker clustering<br/>4. Timestamp alignment

    Deepgram-->>API: Response:<br/>{<br/>  text: 'full transcript...',<br/>  utterances: [<br/>    {speaker: 0, start: 0.5, end: 3.2, text: '...'},<br/>    {speaker: 1, start: 3.5, end: 8.1, text: '...'},<br/>    {speaker: 0, start: 8.5, end: 12.3, text: '...'}<br/>  ]<br/>}

    API->>API: Group utterances by speaker ID

    loop For each unique speaker
        API->>DB: INSERT INTO speakers<br/>(transcriptId, speakerLabel, totalUtterances, totalDuration)
        DB-->>API: Speaker record created
    end

    loop For each utterance
        API->>DB: INSERT INTO utterances<br/>(transcriptId, speakerId, text, start, end, confidence, sequence)
        DB-->>API: Utterance record created
    end

    API->>API: Update status: 'completed'
    API->>DB: Log audit entry<br/>(PHI creation: transcript)

    API-->>Therapist: {<br/>  transcript: {...},<br/>  speakers: [...],<br/>  utteranceCount: 83<br/>}
```

### 3. Speaker Labeling UI Flow

```mermaid
sequenceDiagram
    participant Therapist
    participant Browser
    participant API as API Route
    participant DB as PostgreSQL
    participant GCS as Google Cloud Storage

    Therapist->>Browser: Navigate to /sessions/[id]/speakers
    Browser->>API: GET /api/sessions/[id]/speakers

    API->>DB: SELECT * FROM speakers<br/>WHERE transcriptId = ?<br/>ORDER BY totalUtterances DESC
    DB-->>API: [<br/>  {id: '1', speakerLabel: 'Speaker 1', type: null, name: null, utterances: 45},<br/>  {id: '2', speakerLabel: 'Speaker 2', type: null, name: null, utterances: 38}<br/>]

    API-->>Browser: Speakers array

    Browser->>Browser: Render speaker cards

    Note over Browser: Speaker Card 1:<br/>- Label: "Speaker 1"<br/>- Stats: 45 utterances, 180s<br/>- Audio player<br/>- Type dropdown (empty)<br/>- Name input (empty)

    Therapist->>Browser: Click "Play Sample" on Speaker 1

    Browser->>API: GET /api/sessions/[id]/speakers/[speakerId]/audio

    API->>DB: SELECT * FROM utterances<br/>WHERE speakerId = ?<br/>ORDER BY sequenceNumber<br/>LIMIT 3
    DB-->>API: First 3 utterances with timestamps

    API->>API: Build audio URL with fragments:<br/>audioUrl + '#t=0.5,3.2'
    API-->>Browser: {audioUrl: 'https://storage.../audio.mp3#t=0.5,3.2'}

    Browser->>GCS: Stream audio with timestamp
    GCS-->>Browser: Audio stream (0.5s to 3.2s)

    Browser->>Browser: Play audio sample

    Note over Therapist: Listens and identifies:<br/>"This sounds like me"

    Therapist->>Browser: Select Type: "Therapist"
    Therapist->>Browser: Enter Name: "Dr. Sarah Smith"

    Therapist->>Browser: Click "Play Sample" on Speaker 2
    Browser->>API: GET /api/sessions/[id]/speakers/2/audio
    API-->>Browser: Audio sample

    Note over Therapist: Listens and identifies:<br/>"This is my patient John"

    Therapist->>Browser: Select Type: "Patient"
    Therapist->>Browser: Enter Name: "John Doe"

    Therapist->>Browser: Click "Save"

    Browser->>API: PUT /api/sessions/[id]/speakers<br/>{<br/>  speakers: [<br/>    {id: '1', type: 'therapist', name: 'Dr. Sarah Smith'},<br/>    {id: '2', type: 'patient', name: 'John Doe'}<br/>  ]<br/>}

    loop For each speaker
        API->>DB: UPDATE speakers<br/>SET speakerType = ?, speakerName = ?<br/>WHERE id = ?
        DB-->>API: Updated
    end

    API->>DB: Log audit entry<br/>(PHI update: speaker identification)

    API-->>Browser: {success: true}

    Browser->>Browser: Show success message
    Browser->>Browser: Enable "Continue to Transcript"

    Therapist->>Browser: Click "Continue to Transcript"
    Browser->>Browser: Navigate to /sessions/[id]/transcript
```

### 4. Database Schema for Speaker Labeling

```mermaid
erDiagram
    SESSIONS ||--|| TRANSCRIPTS : has
    TRANSCRIPTS ||--o{ SPEAKERS : identifies
    TRANSCRIPTS ||--o{ UTTERANCES : contains
    SPEAKERS ||--o{ UTTERANCES : speaks
    SPEAKERS ||--o| USERS : may_link_to

    SESSIONS {
        uuid id PK
        string title
        timestamp sessionDate
        string audioUrl
        string transcriptionStatus
        uuid therapistId FK
        uuid patientId FK
        timestamp createdAt
    }

    TRANSCRIPTS {
        uuid id PK
        uuid sessionId FK
        text fullText
        timestamp createdAt
    }

    SPEAKERS {
        uuid id PK
        uuid transcriptId FK
        string speakerLabel "Speaker 1, Speaker 2"
        string speakerType "therapist, patient, group_member"
        string speakerName "Dr. Smith, John Doe"
        uuid userId FK "Optional link to users table"
        int totalUtterances
        int totalDurationSeconds
        timestamp createdAt
    }

    UTTERANCES {
        uuid id PK
        uuid transcriptId FK
        uuid speakerId FK
        text text "Actual spoken text"
        decimal startTimeSeconds "0.5, 3.2, 8.5"
        decimal endTimeSeconds "3.2, 8.1, 12.3"
        decimal confidenceScore "0.98, 0.95, 0.97"
        int sequenceNumber "Order in transcript"
        timestamp createdAt
    }

    USERS {
        uuid id PK
        string firebaseUid
        string email
        string name
        string role
        uuid therapistId FK
        timestamp createdAt
    }
```

### 5. Speaker Merge Functionality

```mermaid
flowchart TD
    Start([Therapist Notices Split Speaker]) --> Problem{Problem Identified}

    Problem --> Issue["Deepgram incorrectly split<br/>one person into<br/>Speaker 1 and Speaker 3"]

    Issue --> EnterMerge[Click 'Merge Speakers']
    EnterMerge --> SelectPrimary[Select Primary: Speaker 1]
    SelectPrimary --> SelectMerge[Select to Merge: Speaker 3]

    SelectMerge --> Confirm[Click 'Merge']

    Confirm --> API[POST /api/sessions/id/speakers/merge]

    API --> UpdateUtterances[(Update Utterances:<br/>SET speakerId = primaryId<br/>WHERE speakerId = mergeId)]

    UpdateUtterances --> RecalcStats[Recalculate Stats:<br/>totalUtterances += merged.totalUtterances<br/>totalDuration += merged.totalDuration]

    RecalcStats --> DeleteMerged[(DELETE FROM speakers<br/>WHERE id = mergeId)]

    DeleteMerged --> Result[✅ Speaker 3 merged into Speaker 1]

    Result --> UpdateUI[Refresh UI:<br/>Only Speaker 1 and 2 remain]

    UpdateUI --> Continue[Continue Labeling]

    style Problem fill:#F59E0B,color:#000
    style Result fill:#10B981,color:#fff
```

### 6. Key Algorithms Explained

#### Deepgram Diarization Algorithm (Simplified)

```mermaid
flowchart LR
    Audio[Audio Waveform] --> Feature[Feature Extraction:<br/>Mel-frequency cepstral coefficients]

    Feature --> Segment[Segmentation:<br/>Detect voice activity<br/>Split into segments]

    Segment --> Embed[Embedding Generation:<br/>Neural network creates<br/>voice 'fingerprints']

    Embed --> Cluster[Clustering:<br/>Group similar embeddings<br/>Assign speaker IDs]

    Cluster --> Align[Alignment:<br/>Match clusters to<br/>transcript timestamps]

    Align --> Output[Output:<br/>Speaker 0: 0.5s-3.2s<br/>Speaker 1: 3.5s-8.1s<br/>Speaker 0: 8.5s-12.3s]

    style Feature fill:#4F46E5,color:#fff
    style Embed fill:#4F46E5,color:#fff
    style Cluster fill:#4F46E5,color:#fff
```

#### Manual Labeling Logic

```mermaid
flowchart TD
    Start[Speaker Cards Displayed] --> Audio[Audio Sample Available]

    Audio --> Play[Therapist Plays Sample]

    Play --> Identify{Can Identify Voice?}

    Identify -->|Yes| Label[Select Type & Enter Name]
    Identify -->|No| More[Play More Samples]

    More --> Identify

    Label --> Validate{Validation}

    Validate --> TypeCheck[Type selected?]
    Validate --> NameCheck[Name entered?]

    TypeCheck & NameCheck -->|All valid| Save[Save to Database]

    TypeCheck -->|Missing| Error1[Show error: Select type]
    NameCheck -->|Missing| Error2[Show error: Enter name]

    Error1 & Error2 --> Label

    Save --> Next{More speakers?}

    Next -->|Yes| Audio
    Next -->|No| Complete[✅ All speakers labeled]

    style Identify fill:#F59E0B,color:#000
    style Complete fill:#10B981,color:#fff
```

### 7. Why No Automated Speaker Identification?

**Clinical Reasoning:**

```mermaid
mindmap
  root((Why Manual<br/>Labeling?))
    Clinical Context
      Therapist knows patient voice
      Therapist knows their own voice
      No training data needed
      HIPAA privacy concerns
    Technical Challenges
      Voice recognition requires training
      Patient consent for voice biometrics
      Accuracy issues with:
        Similar voices
        Background noise
        Emotions affecting voice
    Legal Considerations
      Biometric data = PHI
      Requires explicit consent
      Additional BAA requirements
      Liability for misidentification
    Current Solution Benefits
      100% accuracy with human verification
      No AI training on PHI
      Simple, reliable process
      Therapist maintains control
```

### 8. Future Enhancement: Voice Recognition

**Potential Architecture (Not Implemented):**

```mermaid
flowchart TD
    Start[Audio Transcribed] --> Extract[Extract Voice Embeddings]

    Extract --> Compare[Compare to Database]

    Compare --> DB[(Voice Profiles:<br/>- Therapist voice print<br/>- Patient voice print)]

    DB --> Match{Similarity Score}

    Match -->|> 90%| Auto[Auto-assign speaker]
    Match -->|< 90%| Manual[Suggest + Manual verify]

    Auto --> Verify[Therapist Reviews]
    Manual --> Verify

    Verify -->|Correct| Learn[Update voice profile]
    Verify -->|Incorrect| Fix[Manual correction]

    Fix --> Learn

    Learn --> Improve[Improve future accuracy]

    style Start fill:#6366F1,color:#fff
    style Auto fill:#10B981,color:#fff
    style Manual fill:#F59E0B,color:#000
    style Learn fill:#8B5CF6,color:#fff

    Note1[⚠️ Requires:<br/>- Patient consent<br/>- Voice biometric BAA<br/>- Training data<br/>- ML model deployment]

    style Note1 fill:#EF4444,color:#fff
```

---

## Authentication Flow

### Firebase Authentication & Session Management

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant NextJS as Next.js App
    participant Firebase as Firebase Auth
    participant Middleware
    participant API as API Route
    participant FirebaseAdmin as Firebase Admin SDK
    participant DB as PostgreSQL

    User->>Browser: Enter credentials
    Browser->>Firebase: Sign in request
    Firebase-->>Firebase: Validate credentials
    Firebase-->>Browser: ID Token (JWT)

    Browser->>NextJS: POST /api/auth/session<br/>(with ID Token)
    NextJS->>FirebaseAdmin: verifyIdToken()
    FirebaseAdmin-->>NextJS: User data (uid, email, role)

    NextJS->>DB: Fetch user from database<br/>by firebaseUid
    DB-->>NextJS: User record with role

    NextJS->>NextJS: Create session cookie<br/>(24-hour expiry)
    NextJS-->>Browser: Set session cookie<br/>(httpOnly, secure, sameSite)

    Browser->>NextJS: Navigate to /dashboard
    NextJS->>Middleware: Check protected route
    Middleware->>Middleware: Extract session cookie
    Middleware->>FirebaseAdmin: verifyIdToken()

    alt Token Valid
        FirebaseAdmin-->>Middleware: ✅ Valid user
        Middleware-->>Browser: Allow access
    else Token Invalid/Expired
        FirebaseAdmin-->>Middleware: ❌ Invalid token
        Middleware->>Browser: Redirect to /sign-in
        Browser->>Browser: Clear session cookie
    end

    Browser->>API: GET /api/sessions<br/>(with session cookie)
    API->>API: Extract Authorization header
    API->>FirebaseAdmin: verifyIdToken()
    FirebaseAdmin-->>API: User data

    API->>DB: Query sessions<br/>WHERE therapistId = user.uid
    DB-->>API: Therapist's sessions only

    API->>DB: Log audit entry<br/>(user, action, resource, IP)

    API-->>Browser: JSON response
```

---

## Database Schema Overview

### Core Tables and Relationships

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : creates
    USERS ||--o{ USERS : therapist_assigns
    USERS ||--o{ MEDIA_LIBRARY : creates
    USERS ||--o{ AUDIT_LOGS : generates
    USERS ||--o{ GROUPS : manages

    SESSIONS ||--|| TRANSCRIPTS : has
    SESSIONS ||--o{ MEDIA_LIBRARY : sources
    SESSIONS ||--o{ QUOTES : contains
    SESSIONS ||--o{ NOTES : has

    TRANSCRIPTS ||--o{ SPEAKERS : identifies
    TRANSCRIPTS ||--o{ UTTERANCES : contains

    SPEAKERS ||--o{ UTTERANCES : speaks
    SPEAKERS ||--o{ QUOTES : attributed_to

    GROUPS ||--o{ GROUP_MEMBERS : contains
    GROUPS ||--o{ SESSIONS : has

    USERS ||--o{ STORY_PAGES : views
    STORY_PAGES ||--o{ PAGE_BLOCKS : contains
    STORY_PAGES ||--o{ REFLECTION_QUESTIONS : includes
    STORY_PAGES ||--o{ REFLECTION_RESPONSES : receives

    MEDIA_LIBRARY ||--o{ PAGE_BLOCKS : used_in

    USERS {
        uuid id PK
        string firebaseUid UK
        string email UK
        string name
        string role
        uuid therapistId FK
        string avatarUrl
        string referenceImageUrl
        timestamp createdAt
        timestamp updatedAt
        timestamp lastLoginAt
        timestamp deletedAt
    }

    SESSIONS {
        uuid id PK
        string title
        timestamp sessionDate
        string sessionType
        uuid patientId FK
        uuid groupId FK
        uuid therapistId FK
        string audioUrl
        string transcriptionStatus
        text notes
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt
    }

    TRANSCRIPTS {
        uuid id PK
        uuid sessionId FK
        text fullText
        timestamp createdAt
        timestamp deletedAt
    }

    SPEAKERS {
        uuid id PK
        uuid transcriptId FK
        string speakerLabel
        string speakerType
        string speakerName
        int totalUtterances
        int totalDurationSeconds
    }

    UTTERANCES {
        uuid id PK
        uuid transcriptId FK
        uuid speakerId FK
        text text
        string startTimeSeconds
        string endTimeSeconds
        string confidenceScore
        int sequenceNumber
    }

    MEDIA_LIBRARY {
        uuid id PK
        uuid patientId FK
        uuid createdByTherapistId FK
        string title
        text description
        string mediaType
        string mediaUrl
        string thumbnailUrl
        int durationSeconds
        string sourceType
        uuid sourceSessionId FK
        text generationPrompt
        string aiModel
        jsonb tags
        string status
        timestamp createdAt
        timestamp deletedAt
    }

    QUOTES {
        uuid id PK
        uuid sessionId FK
        uuid speakerId FK
        text quoteText
        string startTimeSeconds
        string endTimeSeconds
        string priority
        jsonb tags
        timestamp createdAt
    }

    STORY_PAGES {
        uuid id PK
        uuid patientId FK
        uuid createdByTherapistId FK
        string title
        text description
        string status
        timestamp publishedAt
        timestamp createdAt
        timestamp updatedAt
        timestamp deletedAt
    }

    AUDIT_LOGS {
        uuid id PK
        uuid userId FK
        string action
        string resourceType
        uuid resourceId
        string ipAddress
        text userAgent
        jsonb metadata
        timestamp timestamp
    }
```

---

## API Architecture

### API Route Structure and Authorization

```mermaid
graph TB
    Client[Client Browser/App]

    subgraph "Authentication Layer"
        Auth[Firebase Auth Client]
        Token[ID Token JWT]
    end

    subgraph "Next.js Middleware"
        MW[middleware.ts]
        Arcjet[Arcjet Security<br/>- Bot Detection<br/>- WAF Protection<br/>- Rate Limiting]
        TokenVerify[Verify Session Cookie]
    end

    subgraph "API Routes"
        direction TB

        subgraph "Session Management"
            S1[GET /api/sessions<br/>List sessions]
            S2[POST /api/sessions<br/>Create session]
            S3[GET /api/sessions/id<br/>Get session details]
            S4[POST /api/sessions/upload<br/>Upload audio]
            S5[POST /api/sessions/id/transcribe<br/>Transcribe audio]
        end

        subgraph "Patient Management"
            P1[GET /api/patients<br/>List patients]
            P2[POST /api/patients<br/>Create patient]
            P3[GET /api/patients/id<br/>Get patient]
        end

        subgraph "AI Services"
            AI1[POST /api/ai/chat<br/>GPT-4 analysis]
            AI2[POST /api/ai/generate-image<br/>DALL-E 3 generation]
        end

        subgraph "Content Library"
            M1[GET /api/media<br/>List media]
            Q1[GET /api/quotes<br/>List quotes]
            N1[GET /api/notes<br/>List notes]
        end
    end

    subgraph "Authorization Helpers"
        RequireAuth[requireAuth<br/>Verify token]
        RequireRole[requireRole<br/>Check user role]
        RequireTherapist[requireTherapist<br/>Therapist/Admin only]
        RequirePatient[requirePatientOrTherapist<br/>Access control]
    end

    subgraph "External Services"
        DG[Deepgram API<br/>Speech-to-Text]
        OpenAI[OpenAI API<br/>GPT-4 & DALL-E 3]
        GCS[Google Cloud Storage<br/>File Storage]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Neon)]
        Audit[(Audit Logs<br/>7-year retention)]
    end

    Client --> Auth
    Auth --> Token
    Token --> MW
    MW --> Arcjet
    MW --> TokenVerify

    TokenVerify --> S1 & S2 & S3 & S4 & S5
    TokenVerify --> P1 & P2 & P3
    TokenVerify --> AI1 & AI2
    TokenVerify --> M1 & Q1 & N1

    S1 & S2 & S3 & S4 & S5 --> RequireAuth
    P1 & P2 & P3 --> RequireAuth
    AI1 & AI2 --> RequireTherapist

    RequireAuth --> RequireRole
    RequireRole --> RequireTherapist
    RequireRole --> RequirePatient

    S5 --> DG
    AI1 & AI2 --> OpenAI
    S4 --> GCS
    AI2 --> GCS

    S1 & S2 & S3 & S5 --> DB
    P1 & P2 & P3 --> DB
    M1 & Q1 & N1 --> DB

    RequireAuth -.Log access.-> Audit

    style Auth fill:#4285F4
    style Token fill:#FBBC04
    style Arcjet fill:#9334E6
    style DG fill:#4A90E2
    style OpenAI fill:#10A37F
    style GCS fill:#EA4335
    style DB fill:#336791
    style Audit fill:#FF6B6B
```

---

## Transcription Process (Detailed)

### Deepgram Speech-to-Text Pipeline

```mermaid
flowchart LR
    subgraph "Input"
        Audio[Audio File<br/>in GCS]
    end

    subgraph "Deepgram API"
        direction TB
        DG_Start[Start Transcription]
        DG_Config[Configuration:<br/>- Model: nova-2<br/>- Language: en<br/>- Diarization: true<br/>- Punctuation: true<br/>- Smart format: true]
        DG_Process[Process Audio:<br/>1. Speech Recognition<br/>2. Speaker Identification<br/>3. Timestamp Generation<br/>4. Confidence Scoring]
        DG_Result[Result Object]
    end

    subgraph "Transcript Structure"
        direction TB
        Full[Full Text Transcript]

        Utterances[Utterances Array]
        U1[Utterance 1:<br/>- speaker: 0<br/>- start: 0.5s<br/>- end: 5.2s<br/>- text: "I've been..."<br/>- confidence: 0.98]
        U2[Utterance 2:<br/>- speaker: 1<br/>- start: 5.5s<br/>- end: 10.1s<br/>- text: "That's great..."<br/>- confidence: 0.95]

        Words[Words Array]
        W1[Word 1: "I"<br/>start: 0.5, end: 0.6<br/>speaker: 0]
        W2[Word 2: "have"<br/>start: 0.6, end: 0.8<br/>speaker: 0]

        Utterances --> U1 & U2
        Words --> W1 & W2
    end

    subgraph "Database Storage"
        direction TB
        T_Table[(transcripts table)]
        S_Table[(speakers table)]
        U_Table[(utterances table)]

        T_Record[Transcript Record:<br/>- sessionId<br/>- fullText]
        S_Record[Speaker Records:<br/>- Speaker 1: 45 utterances<br/>- Speaker 2: 38 utterances]
        U_Record[Utterance Records:<br/>- All timestamped segments<br/>- Speaker attribution<br/>- Confidence scores]

        T_Table --> T_Record
        S_Table --> S_Record
        U_Table --> U_Record
    end

    Audio --> DG_Start
    DG_Start --> DG_Config
    DG_Config --> DG_Process
    DG_Process --> DG_Result

    DG_Result --> Full & Utterances & Words

    Full --> T_Record
    Utterances --> S_Record & U_Record

    style Audio fill:#EA4335
    style DG_Start fill:#4A90E2
    style DG_Config fill:#4A90E2
    style DG_Process fill:#4A90E2
    style DG_Result fill:#4A90E2
    style T_Table fill:#336791
    style S_Table fill:#336791
    style U_Table fill:#336791
```

---

## Image Generation Process (Detailed)

### DALL-E 3 Content Creation Pipeline

```mermaid
flowchart TD
    subgraph "Input Sources"
        Transcript[Session Transcript]
        Theme[Optional Theme<br/>e.g., "hope", "growth"]
        Quote[Selected Quote]
    end

    subgraph "Stage 1: Prompt Generation"
        GPT4_1[GPT-4 Turbo]
        System1[System Prompt:<br/>"Create DALL-E prompts for<br/>therapeutic narratives...<br/>- Metaphorical<br/>- Healing-oriented<br/>- Safe for therapy"]
        User1[User Prompt:<br/>"Theme: hope<br/>Transcript: [excerpt]<br/>Create image prompt"]
        Result1[Generated DALL-E Prompt:<br/>"A person standing at the edge<br/>of a calm lake at sunrise,<br/>with golden light breaking<br/>through clouds, symbolizing<br/>hope and new beginnings.<br/>Watercolor style, peaceful,<br/>healing."]
    end

    subgraph "Stage 2: Image Generation"
        DALLE[DALL-E 3 API]
        Config{Configuration}
        Size[Size Options:<br/>- 1024x1024 square<br/>- 1792x1024 landscape<br/>- 1024x1792 portrait]
        Quality[Quality:<br/>- standard default<br/>- hd detailed]
        Style[Style:<br/>- natural more realistic<br/>- vivid more dramatic]

        Generate[Generate Image]
        TempURL[Temporary Image URL<br/>from OpenAI<br/>Expires in 1 hour]
    end

    subgraph "Stage 3: Storage"
        Download[Download Image]
        GCS[Upload to Google Cloud Storage]
        PermanentURL[Permanent URL]

        DB_Insert[Insert into media_library]
        Record[Media Record:<br/>- title: Quote/theme<br/>- mediaType: 'image'<br/>- mediaUrl: GCS URL<br/>- generationPrompt: prompt<br/>- aiModel: 'dall-e-3'<br/>- patientId<br/>- sourceSessionId<br/>- tags: array]
    end

    Transcript & Theme & Quote --> GPT4_1
    GPT4_1 --> System1 & User1
    System1 & User1 --> Result1

    Result1 --> DALLE
    DALLE --> Config
    Config --> Size & Quality & Style
    Size & Quality & Style --> Generate
    Generate --> TempURL

    TempURL --> Download
    Download --> GCS
    GCS --> PermanentURL
    PermanentURL --> DB_Insert
    DB_Insert --> Record

    style GPT4_1 fill:#10A37F
    style DALLE fill:#10A37F
    style GCS fill:#EA4335
    style DB_Insert fill:#336791
```

---

## Security & Audit Flow

### HIPAA Compliance Architecture

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Middleware
    participant API
    participant RBAC as RBAC Middleware
    participant DB as Database
    participant Audit as Audit Logger
    participant GCS as Google Cloud Storage

    Note over User,GCS: Every PHI access is logged

    User->>Browser: Request patient data
    Browser->>Middleware: GET /api/sessions<br/>(with session cookie)

    Middleware->>Middleware: Check Arcjet<br/>- Bot detection<br/>- Rate limiting<br/>- WAF rules

    alt Rate Limit Exceeded
        Middleware-->>Browser: 429 Too Many Requests
    end

    Middleware->>Middleware: Verify session token<br/>with Firebase Admin

    alt Invalid Token
        Middleware-->>Browser: 401 Unauthorized<br/>Redirect to /sign-in
    end

    Browser->>API: Authorized request
    API->>API: Extract Authorization header
    API->>API: requireAuth()<br/>Verify ID token

    API->>RBAC: Check user role & permissions

    alt Insufficient Permissions
        RBAC-->>API: 403 Forbidden
        API->>Audit: Log failed access attempt
        API-->>Browser: 403 Forbidden
    end

    RBAC-->>API: ✅ Authorized

    API->>DB: Query PHI<br/>Filter by therapistId
    DB-->>API: Filtered data

    API->>Audit: Log successful access

    Note over Audit: Audit Log Entry:<br/>- userId<br/>- action: "read"<br/>- resourceType: "session"<br/>- resourceId<br/>- ipAddress<br/>- userAgent<br/>- timestamp

    Audit->>DB: Insert audit log<br/>(7-year retention)

    API-->>Browser: JSON response<br/>(PHI data)

    Browser->>Browser: Session idle timer<br/>15 minutes inactivity

    alt User Inactive
        Browser->>Browser: Auto logout
        Browser->>API: POST /api/auth/logout
        API->>Audit: Log logout event
    end

    Note over API,DB: All sessions expire after 24 hours
```

---

## Technology Stack Overview

```mermaid
graph TB
    subgraph "Frontend"
        React[React 19<br/>with Compiler]
        NextJS[Next.js 16<br/>App Router]
        Tailwind[Tailwind CSS 4]
        RHF[React Hook Form]
    end

    subgraph "Authentication"
        FirebaseClient[Firebase Auth<br/>Client SDK]
        FirebaseAdmin[Firebase Admin<br/>Server SDK]
        JWT[JWT Tokens<br/>24-hour expiry]
    end

    subgraph "Backend"
        API[API Routes<br/>Next.js 16]
        Middleware[Custom Middleware<br/>Token Verification]
        Validation[Zod Schemas<br/>Input Validation]
    end

    subgraph "Security"
        Arcjet[Arcjet<br/>- WAF<br/>- Rate Limiting<br/>- Bot Detection]
        Headers[Security Headers<br/>- CSP<br/>- HSTS<br/>- X-Frame-Options]
        Audit[Audit Logging<br/>7-year retention]
    end

    subgraph "Database"
        Neon[Neon PostgreSQL<br/>Serverless]
        Drizzle[DrizzleORM<br/>Type-safe queries]
        PGLite[PGLite<br/>Local dev]
    end

    subgraph "AI Services"
        Deepgram[Deepgram<br/>Speech-to-Text<br/>Model: nova-2]
        GPT4[OpenAI GPT-4<br/>Analysis & Prompts<br/>Model: gpt-4-turbo]
        DALLE[OpenAI DALL-E 3<br/>Image Generation]
    end

    subgraph "Storage"
        GCS[Google Cloud Storage<br/>Media files<br/>1-hour signed URLs]
    end

    subgraph "Monitoring"
        Sentry[Sentry<br/>Error Tracking]
        LogTape[LogTape + Better Stack<br/>Logging]
        PostHog[PostHog<br/>Analytics]
    end

    subgraph "Deployment"
        Vercel[Vercel<br/>Edge Hosting<br/>CDN + Edge Functions]
    end

    React --> NextJS
    NextJS --> Tailwind & RHF

    NextJS --> FirebaseClient
    API --> FirebaseAdmin
    FirebaseAdmin --> JWT

    NextJS --> Middleware
    Middleware --> API
    API --> Validation

    Middleware --> Arcjet
    Middleware --> Headers
    API --> Audit

    API --> Drizzle
    Drizzle --> Neon
    Drizzle --> PGLite

    API --> Deepgram
    API --> GPT4
    API --> DALLE

    API --> GCS
    DALLE --> GCS

    API --> Sentry
    API --> LogTape
    NextJS --> PostHog

    NextJS --> Vercel

    style FirebaseClient fill:#FFA000
    style FirebaseAdmin fill:#FFA000
    style Neon fill:#00E599
    style Deepgram fill:#4A90E2
    style GPT4 fill:#10A37F
    style DALLE fill:#10A37F
    style GCS fill:#EA4335
    style Vercel fill:#000000,color:#FFFFFF
    style Arcjet fill:#9334E6
```

---

## Models & Technologies Summary

### AI Models Used

| Service | Model | Purpose | Key Features |
|---------|-------|---------|--------------|
| **Deepgram** | `nova-2` | Speech-to-Text | • Automatic speech recognition<br/>• Speaker diarization<br/>• Word-level timestamps<br/>• 98%+ accuracy |
| **OpenAI** | `gpt-4-turbo-preview` | Analysis & Prompts | • Transcript analysis<br/>• Therapeutic insights<br/>• Image prompt generation<br/>• Quote extraction |
| **OpenAI** | `dall-e-3` | Image Generation | • High-quality images<br/>• Natural/vivid styles<br/>• Multiple sizes<br/>• Therapeutic imagery |

### Storage & Infrastructure

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **Neon** | PostgreSQL Database | • Serverless scaling<br/>• SSL/TLS encryption<br/>• Automated backups |
| **Google Cloud Storage** | File Storage | • Private buckets<br/>• Signed URLs (1-hour expiry)<br/>• Server-side encryption |
| **Firebase** | Authentication | • JWT tokens (24-hour)<br/>• Custom claims for roles<br/>• Session management |
| **Vercel** | Hosting | • Edge functions<br/>• CDN distribution<br/>• Automatic deployments |

---

**Last Updated:** 2025-10-30
**Document Version:** 1.0
**Maintained By:** Development Team
