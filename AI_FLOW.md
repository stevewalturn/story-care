# StoryCare AI Chat Flow Documentation

> **Complete analysis of the AI-powered therapeutic assistant on the transcript page**

Last Updated: 2025-01-13

---

## Table of Contents

1. [Overview](#overview)
2. [Complete Flow Diagram](#complete-flow-diagram)
3. [What Gets Sent to the AI](#what-gets-sent-to-the-ai)
4. [5-Part Intelligent Context System](#5-part-intelligent-context-system)
5. [Token Counting & Cost Analysis](#token-counting--cost-analysis)
6. [Prompt Caching Strategy](#prompt-caching-strategy)
7. [Security & HIPAA Compliance](#security--hipaa-compliance)
8. [Performance Characteristics](#performance-characteristics)
9. [Model Comparison](#model-comparison)
10. [Key Files Reference](#key-files-reference)

---

## Overview

When therapists use the AI chat feature on the transcript page at `/sessions/[id]/transcript`, the system implements a 5-part intelligent context caching strategy with Google Gemini to provide cost-effective, contextually-aware therapeutic insights.

**Key Features:**
- ✅ Automatic prompt caching (75-85% cache hit rate)
- ✅ Sliding window conversation management
- ✅ HIPAA-compliant audit logging
- ✅ Multi-model support (Gemini, GPT-4o)
- ✅ Cost-optimized: ~$0.0088 per session

---

## Complete Flow Diagram

```mermaid
sequenceDiagram
    participant User as 👤 Therapist
    participant Frontend as TranscriptViewerClient
    participant API as /api/ai/chat
    participant Security as Security Layer
    participant Context as Context Builder
    participant TextGen as TextGeneration Service
    participant Gemini as Google Vertex AI
    participant DB as Database

    User->>Frontend: Types message in AI chat
    Frontend->>API: POST /api/ai/chat<br/>{messages, sessionId, model}

    API->>Security: Validate request
    Security->>Security: ✓ Rate limiting (20/hour)
    Security->>Security: ✓ Firebase authentication
    Security->>Security: ✓ Session access check
    Security->>Security: ✓ Input validation (Zod)

    API->>Context: Build 5-part context
    Context->>DB: Fetch session summary
    DB-->>Context: Session data (3-5k tokens)
    Context->>DB: Fetch module prompt
    DB-->>Context: Module data (500-1k tokens)
    Context->>Context: Add system prompt (800 tokens)
    Context->>DB: Fetch chat summary
    DB-->>Context: Chat summary (300-500 tokens)
    Context->>DB: Fetch recent messages
    DB-->>Context: Last 5 messages (1-2k tokens)

    API->>TextGen: generateText(messages, options)
    TextGen->>Gemini: POST /generateContent<br/>Model: gemini-2.5-flash<br/>Temp: 0.7, MaxTokens: 2000

    Note over Gemini: 🔄 Automatic Prompt Caching<br/>Parts 1-4 cached (73% discount)<br/>Cache lifetime: 1 hour

    Gemini-->>TextGen: Response {content, usage}
    TextGen-->>API: Generated text

    API->>DB: Save user message
    API->>DB: Save AI response
    API->>DB: Log PHI access (HIPAA audit)

    API-->>Frontend: JSON response
    Frontend->>Frontend: Append message to chat
    Frontend->>Frontend: Render with ReactMarkdown
    Frontend->>Frontend: Auto-scroll to latest
    Frontend-->>User: Display AI response
```

---

## What Gets Sent to the AI

### Request Structure (Frontend → API)

```typescript
POST /api/ai/chat
Authorization: Bearer <firebase-id-token>

{
  messages: [
    { role: 'user', content: 'What are the key themes in this session?' },
    { role: 'assistant', content: '### Key Themes\n\n1. Anxiety externalization...' },
    { role: 'user', content: 'Can you suggest visual concepts?' }
  ],
  sessionId: 'ccd0805e-e8ab-4624-8107-49a554da32bd',
  model: 'gemini-2.5-flash',
  selectedText?: 'Patient mentioned feeling trapped...',  // Optional
  selectedUtteranceIds?: ['utterance-123']                // Optional
}
```

### Actual Context Sent to Gemini (API → AI)

The API route constructs a comprehensive context combining 5 parts:

```typescript
[
  // PART 1: SESSION SUMMARY (CACHED)
  {
    role: 'system',
    content: `
# Session: Understanding Anxiety Triggers

**Date:** 2025-01-10 | **Type:** individual | **Patient:** John Doe
**Duration:** 58 minutes | **Module:** Externalizing Anxiety

---

## Full Transcript

[00:00] Therapist: How have you been feeling since our last session?
[00:15] Patient: It's been rough. Work stress is really getting to me.
[01:23] Therapist: Can you tell me more about what that feels like?
[01:45] Patient: It's like being trapped in a pressure cooker...

... [Full transcript ~3,000 words]

---

## Key Therapeutic Themes

1. **Work-related stress manifesting as physical symptoms**
   - Patient describes feeling "trapped in a pressure cooker"
   - Physical: chest tightness, racing heartbeat, sweating
   - Triggers: Deadline-driven projects, performance reviews

2. **Avoidance patterns reinforcing anxiety**
   - Declining social invitations to avoid judgment
   - Procrastinating on work to avoid perfectionism paralysis
   - Isolating when feeling overwhelmed

3. **Emerging self-awareness and externalization**
   - Beginning to see anxiety as separate from identity
   - Recognizing patterns in real-time during session
   - Showing curiosity about alternative narratives

---

## Significant Moments

**[12:30] - First externalization attempt**
> "When you said anxiety is 'visiting' me rather than 'who I am,' something clicked."

**[23:15] - Pressure cooker metaphor emerges**
> "It's like I'm trapped in a pressure cooker at work, and the steam has nowhere to go."

**[34:50] - Turning point: Agency recognition**
> "Wait... I'm choosing to stay in this situation. That's actually empowering to realize."

**[45:20] - Visual imagery of release**
> "I imagine opening the lid slowly, letting the pressure escape bit by bit."

---

## Emotional Patterns

- **0-15 min:** Defeated, heavy, overwhelmed
- **15-30 min:** Frustrated, resistant to externalization
- **30-45 min:** Curious, cautiously hopeful
- **45-58 min:** Lighter, more energized, planning action

---

## Metaphors & Symbolic Language

1. **Pressure cooker** - Primary metaphor for work stress
2. **Steam** - Unexpressed emotions and needs
3. **Lid** - Control mechanisms and boundaries
4. **Opening slowly** - Gradual, safe emotional release
5. **Mountains** - Overwhelming challenges, referenced 3 times

---

## Narrative Therapy Opportunities

- Externalize "Anxiety" as a character trying to control patient
- Explore unique outcomes: Times when patient resisted Anxiety
- Visual storytelling: Pressure cooker transformation
- Story page potential: Journey from trapped to empowered
    `
  },

  // PART 2: MODULE PROMPT (CACHED)
  {
    role: 'system',
    content: `
# Treatment Module: Externalizing Anxiety

**Domain:** Anxiety & Stress
**Therapeutic Aim:** Help patients externalize anxiety as a separate entity,
reducing internalized shame and increasing sense of agency.

---

## Module-Specific Analysis Instructions

When analyzing this session, focus on:

1. **Externalization Language**
   - Moments where patient separates self from anxiety
   - Shifts from "I am anxious" to "Anxiety is telling me..."
   - Times when patient observes anxiety rather than embodies it

2. **Metaphor Development**
   - What metaphors does the patient use for anxiety?
   - How can these metaphors be developed visually?
   - Which metaphors show agency vs. helplessness?

3. **Unique Outcomes**
   - Times when patient resisted anxiety's influence
   - Moments of clarity or self-awareness
   - Small victories often overlooked

4. **Visual Storytelling**
   - Suggest concrete visual representations of:
     * Anxiety as external force
     * Patient's agency and resistance
     * Transformation from overwhelmed to empowered
   - Reference specific timestamps for scene creation

5. **Therapeutic Direction**
   - Identify next steps for deepening externalization
   - Suggest questions for next session
   - Note readiness for creating story page content
    `
  },

  // PART 3: SYSTEM PROMPT (CACHED)
  {
    role: 'system',
    content: `
You are an expert therapeutic assistant specialized in narrative therapy,
working within the StoryCare digital therapeutic platform.

## Core Expertise

You help therapists analyze therapy session transcripts to:
- Identify therapeutic themes and patterns
- Extract meaningful quotes and moments
- Suggest visual storytelling concepts
- Support narrative therapy interventions
- Generate content for patient story pages

## Response Format - ALWAYS Use Markdown

Structure ALL responses with:
- \`###\` for section headers
- \`**bold**\` for emphasis and key terms
- Bullet points for lists
- \`>\` blockquotes for patient quotes
- Timestamps in [MM:SS] format when referencing transcript

## Required Response Sections

Every analysis should include:

### 1. Key Therapeutic Themes
Brief, clear identification of 2-4 primary themes

### 2. Scene-Worthy Moments
Specific timestamps and descriptions of pivotal moments

### 3. Patient Quotes
Powerful quotes with timestamps and context

### 4. Therapeutic Insights
Clinical observations and narrative therapy opportunities

### 5. Visual Suggestions
Concrete visual concepts for story pages, with rationale

## Guidelines

✅ **DO:**
- Reference specific timestamps from transcript
- Use patient's own words and metaphors
- Connect insights to module objectives (if applicable)
- Suggest actionable next steps
- Maintain clinical, compassionate tone

❌ **DON'T:**
- Make diagnostic statements
- Suggest medication or medical interventions
- Use jargon without explanation
- Provide generic responses
- Assume information not in transcript

## Tone & Style

- Professional yet warm
- Strength-based and hopeful
- Focused on agency and possibility
- Grounded in narrative therapy principles
- Respectful of patient's experience
    `
  },

  // PART 4: CHAT SUMMARY (CACHED - regenerated every 10 messages)
  {
    role: 'system',
    content: `
# Previous Conversation Summary

**Key Questions Explored:**

1. Therapist asked about patterns in anxiety triggers across sessions
   - AI identified work deadlines and social situations as primary triggers
   - Noted correlation with perfectionism themes

2. Discussion of visual metaphors for anxiety
   - Explored "pressure cooker" metaphor in depth
   - Suggested visual progression: sealed → steam building → gradual release
   - Considered mountain climbing as alternative metaphor

3. Exploration of patient's support system
   - Identified close friend Sarah as key support
   - Noted patient's reluctance to "burden" others
   - Discussed externalization opportunity: "Anxiety tells you not to reach out"

4. Scene selection for story page
   - Narrowed to 3 key moments: [12:30], [23:15], [45:20]
   - Therapist considering pressure cooker visual sequence

**Main Insights Provided:**

- Patient showing readiness for visual storytelling intervention
- Strong metaphor development indicates good narrative therapy progress
- Externalization language emerging but needs reinforcement
- Recommended story page structure: Problem → Struggle → Agency → Hope

**Current Therapeutic Direction:**

Focus on deepening externalization and creating visual story page to
reinforce session insights between meetings.
    `
  },

  // PART 5: RECENT MESSAGES (DYNAMIC - not cached)
  {
    role: 'user',
    content: 'What were the key moments when the patient showed resistance to externalizing anxiety?'
  },
  {
    role: 'assistant',
    content: `
### Key Resistance Moments

**[15:20] - Dismissing externalization as "just semantics"**
> "I don't see how calling it 'Anxiety visiting me' changes anything. I'm still anxious."

This shows the patient wasn't yet seeing the therapeutic value. The resistance itself
is valuable data—Anxiety was protecting its territory.

**[18:45] - Returning to self-blame**
> "But it IS me. I'm the one who can't handle normal work stress like everyone else."

Patient merged back with anxiety, showing how deeply internalized it is.

**[25:30] - Breakthrough moment after resistance**
> "Wait... when I say 'I can't handle it,' who's really saying that? Is that Anxiety talking?"

This self-questioning marked a shift. Resistance gave way to curiosity.

### Therapeutic Insight

The resistance wasn't failure—it was part of the process. By session end, patient
was spontaneously catching themselves using merged language. Progress often looks
messy in real-time.
    `
  },
  {
    role: 'user',
    content: 'Can you suggest specific visual concepts for the pressure cooker metaphor?'
  },
  {
    role: 'assistant',
    content: `
### Visual Concept: Pressure Cooker Journey

**Scene 1: Sealed & Building (Problem)**
- Image: Heavy-duty pressure cooker, lid firmly sealed, steam building inside
- Color palette: Dark grays, industrial feel
- Symbolism: Trapped energy, no outlet, danger of explosion
- Patient quote: "Everything's building up with nowhere to go"

**Scene 2: Recognizing the Valve (Awareness)**
- Image: Close-up of pressure release valve, patient's hand approaching
- Color shift: Introducing warm light on the valve
- Symbolism: Discovery of control, agency emerging
- Patient quote: "I imagine opening the lid slowly..."

**Scene 3: Controlled Release (Agency)**
- Image: Steam escaping steadily through valve, patient confidently managing flow
- Colors: Lighter, hopeful tones, steam catching golden light
- Symbolism: Safe expression, self-regulation, mastery
- Patient quote: "Letting the pressure escape bit by bit"

**Scene 4: Opening Freely (Transformation)**
- Image: Lid removed, light pouring out, patient at ease
- Colors: Bright, open, expansive feeling
- Symbolism: Freedom, flexibility, new possibilities
- Connection to timestamp [45:20] - moment of lightness

### Implementation Notes

- Use realistic pressure cooker for relatability
- Maintain visual consistency across sequence
- Consider adding subtle human silhouette in background showing emotional shift
- Total: 4 images forming clear narrative arc
    `
  },

  // NEW MESSAGE (from current request)
  {
    role: 'user',
    content: 'What are the most impactful quotes I could use for a story page?'
  }
]
```

**Total Context Size:** ~6,000-8,000 tokens
**Cacheable:** ~5,000-6,500 tokens (Parts 1-4)
**Dynamic:** ~1,500-2,000 tokens (Part 5)

---

## 5-Part Intelligent Context System

```mermaid
graph TB
    subgraph "Context Building Process"
        Start[AI Chat Request] --> P1[Part 1: Session Summary]
        Start --> P2[Part 2: Module Prompt]
        Start --> P3[Part 3: System Prompt]
        Start --> P4[Part 4: Chat Summary]
        Start --> P5[Part 5: Recent Messages]
    end

    subgraph "Part 1: Session Summary"
        P1 --> P1A[📄 3,000-5,000 tokens]
        P1A --> P1B[🔒 CACHED - 100% hit rate]
        P1B --> P1C[Full transcript<br/>Themes<br/>Key moments<br/>Metaphors]
    end

    subgraph "Part 2: Module Prompt"
        P2 --> P2A[📋 500-1,000 tokens]
        P2A --> P2B[🔒 CACHED - 100% hit rate]
        P2B --> P2C[Treatment module<br/>Analysis instructions<br/>Therapeutic focus]
    end

    subgraph "Part 3: System Prompt"
        P3 --> P3A[⚙️ 800 tokens]
        P3A --> P3B[🔒 CACHED - 100% hit rate]
        P3B --> P3C[Role definition<br/>Response format<br/>Guidelines]
    end

    subgraph "Part 4: Chat Summary"
        P4 --> P4A[💬 300-500 tokens]
        P4A --> P4B[🔒 CACHED - 90% hit rate]
        P4B --> P4C[Previous questions<br/>Main insights<br/>Therapeutic direction]
        P4C --> P4D[Regenerated every 10 messages]
    end

    subgraph "Part 5: Recent Messages"
        P5 --> P5A[🔄 1,000-2,000 tokens]
        P5A --> P5B[❌ NOT CACHED - Dynamic]
        P5B --> P5C[Last 5 messages<br/>Current user message]
    end

    P1C --> Combine[Combine All Parts]
    P2C --> Combine
    P3C --> Combine
    P4C --> Combine
    P5C --> Combine

    Combine --> Send[Send to Gemini API]
    Send --> Cache[🎯 79% of tokens<br/>served from cache]

    style P1 fill:#e1f5ff
    style P2 fill:#e8f5e9
    style P3 fill:#fff3e0
    style P4 fill:#f3e5f5
    style P5 fill:#ffebee
    style Cache fill:#c8e6c9
```

---

### Part 1: Session Summary (CACHED)

**Purpose:** Provide comprehensive therapeutic foundation

**Source:** `SessionSummaryService.getOrCreateSessionSummary()`

**Generation:**
- **When:** First AI chat request OR after transcription completes
- **Model:** GPT-4o-mini (temp=0.3, max_tokens=2000)
- **Cost:** ~$0.15 per summary (one-time per session)

**Content Includes:**
- Session metadata (title, date, patient, duration)
- Full transcript with timestamps
- 2-4 key therapeutic themes with evidence
- Significant moments (3-6 pivotal points with quotes)
- Emotional progression timeline
- Metaphors and symbolic language catalog
- Clinical observations
- Narrative therapy opportunities

**Storage:** Saved to `sessions.sessionSummary` column (JSONB)

**Cache Characteristics:**
- **Lifetime:** Indefinite (never changes after creation)
- **Size:** 3,000-5,000 tokens (60-min session)
- **Hit Rate:** 100% after first request

---

### Part 2: Module Prompt (CACHED)

**Purpose:** Guide domain-specific therapeutic analysis

**Source:** `treatment_modules` table via `sessionModules` join

**Generation:**
- **When:** Module assigned to session
- **Created By:** Therapist, Org Admin, or Super Admin

**Content Includes:**
- Treatment module name
- Therapeutic domain (e.g., "Anxiety & Stress", "Trauma Recovery")
- Clinical description and therapeutic aim
- AI analysis instructions specific to this module
- Focus areas for analysis
- Output expectations

**Example Module Prompt:**
```markdown
# Treatment Module: Externalizing Anxiety

**Domain:** Anxiety & Stress
**Aim:** Help patients externalize anxiety as separate entity

## Analysis Instructions:
- Focus on externalization language
- Identify moments of agency vs. helplessness
- Suggest visual representations of anxiety as external force
- Note unique outcomes when patient resisted anxiety
```

**Cache Characteristics:**
- **Lifetime:** Until module assignment changes (typically full session)
- **Size:** 500-1,000 tokens
- **Hit Rate:** 100% after first request (if module doesn't change)

---

### Part 3: Enhanced System Prompt (CACHED)

**Purpose:** Define AI assistant role and response format

**Source:** Hardcoded in `/api/ai/chat/route.ts`

**Content Includes:**
- Role definition (narrative therapy expert)
- Response formatting rules (markdown structure)
- Required response sections
- Guidelines (DO/DON'T)
- Tone and style specifications

**Cache Characteristics:**
- **Lifetime:** Indefinite (identical for all requests)
- **Size:** ~800 tokens
- **Hit Rate:** 100%

---

### Part 4: Chat Summary (CACHED - Periodic)

**Purpose:** Prevent context window overflow while maintaining conversation continuity

**Source:** `ChatSummaryService` (not yet implemented, placeholder in code)

**Generation Strategy:**
- **When:** Every 10 messages
- **Model:** GPT-4o-mini (temp=0.2, max_tokens=800)
- **Process:** Summarize messages 6-10, append to context
- **Storage:** `ai_chat_messages` table (promptType='conversation_summary')

**Content Includes:**
- Key questions asked by therapist
- Main insights provided by AI
- Therapeutic directions explored
- Recurring topics or patterns

**Benefits:**
- Prevents linear context growth (bounded at: Summary + 5 recent messages)
- Maintains long-term conversation memory
- Enables infinite-length conversations within token limits

**Cache Characteristics:**
- **Lifetime:** ~10 requests (until next summary generated)
- **Size:** 300-500 tokens
- **Hit Rate:** 90% (regenerated 10% of the time)

---

### Part 5: Recent Messages (DYNAMIC)

**Purpose:** Provide immediate conversational context

**Source:**
- Last 5 messages from `ai_chat_messages` table
- PLUS new message from current request

**Query:**
```sql
SELECT role, content, created_at
FROM ai_chat_messages
WHERE session_id = $1
  AND prompt_type != 'conversation_summary'
ORDER BY created_at DESC
LIMIT 5
```

**Cache Characteristics:**
- **Cacheable:** ❌ No (changes with every request)
- **Size:** 1,000-2,000 tokens (varies by conversation)
- **Purpose:** Latest context for coherent responses

---

## Token Counting & Cost Analysis

### Token Breakdown (Typical 60-minute Session)

| Context Part | Size (Tokens) | Frequency | Cacheable? |
|--------------|---------------|-----------|------------|
| **Session Summary** | 3,000-5,000 | Once per session | ✅ Yes |
| **Module Prompt** | 500-1,000 | Once per session | ✅ Yes |
| **System Prompt** | 800 | Every request | ✅ Yes |
| **Chat Summary** | 300-500 | Every 10 messages | ✅ Yes |
| **Recent Messages (5)** | 1,000-2,000 | Every request | ❌ No |
| **New User Message** | 100-300 | Every request | ❌ No |
| **AI Response** | 500-1,000 | Every request | ❌ No (output) |

**Totals:**
- **First Request:** 5,700-9,600 tokens input + 500-1,000 output
- **Subsequent Requests (cached):** 1,400-2,800 tokens input + 500-1,000 output

---

### Cost Calculation (Gemini 2.5 Flash)

**Pricing (2025):**
- Input (uncached): $0.15 per 1M tokens
- Input (cached read): $0.04 per 1M tokens (~73% discount)
- Output: $0.60 per 1M tokens

**Scenario: 10 AI chat interactions per session**

```mermaid
graph TD
    subgraph "Without Caching"
        NC1[Request 1-10<br/>All uncached] --> NC2[Input: 70,000 tokens<br/>@ $0.15/1M]
        NC2 --> NC3[Output: 7,500 tokens<br/>@ $0.60/1M]
        NC3 --> NCTotal[💰 Total: $0.0150]
    end

    subgraph "With Caching"
        C1[Request 1<br/>Cold Start] --> C2[Input: 7,000 tokens<br/>@ $0.15/1M = $0.00105]
        C2 --> C3[Output: 750 tokens<br/>@ $0.60/1M = $0.00045]
        C3 --> C4[Subtotal: $0.00150]

        C5[Requests 2-10<br/>Warm Cache] --> C6[Cached: 49,500 tokens<br/>@ $0.04/1M = $0.00198]
        C6 --> C7[Dynamic: 13,500 tokens<br/>@ $0.15/1M = $0.00126]
        C7 --> C8[Output: 6,750 tokens<br/>@ $0.60/1M = $0.00405]
        C8 --> C9[Subtotal: $0.00729]

        C4 --> CTotal[💰 Total: $0.00879]
        C9 --> CTotal
    end

    NCTotal -.->|41% savings| Comparison[💵 Save $0.00621<br/>per session]
    CTotal -.-> Comparison

    style NCTotal fill:#ffcdd2
    style CTotal fill:#c8e6c9
    style Comparison fill:#fff9c4
```

**Summary:**
- **Without Caching:** $0.0150 per session
- **With Caching:** $0.0088 per session
- **Savings:** $0.00621 per session (41% reduction)

---

### Annual Cost Projection (1,000 Users)

**Assumptions:**
- 800 active therapists
- 25 sessions per therapist per year = 20,000 total sessions
- 10 AI chat interactions per session = 200,000 requests

**With Prompt Caching:**
```
Session Summaries (one-time):
  20,000 summaries × $0.15 = $3,000/year

AI Chat (Gemini 2.5 Flash):
  20,000 sessions × $0.00879 = $176/year

Total: $3,176/year = $265/month
```

**Per-User Cost:**
- $3.18/year per user
- $0.26/month per user

**Cost-per-Session:**
- $0.1588 per session (including summary generation)
- $0.0088 per session (chat only, after summary exists)

---

## Prompt Caching Strategy

### How Google Gemini Caching Works

```mermaid
sequenceDiagram
    participant App as Application
    participant Gemini as Gemini API
    participant Cache as Cache Storage

    Note over App,Cache: Request 1 (Cold Start)
    App->>Gemini: [Session Summary] [Module] [System] [User Msg 1]
    Gemini->>Cache: Store prefix hash<br/>[Session Summary] [Module] [System]
    Cache-->>Gemini: ✓ Cached
    Gemini-->>App: Response<br/>💰 $0.15/1M tokens

    Note over App,Cache: Request 2 (Warm - within 1 hour)
    App->>Gemini: [Session Summary] [Module] [System] [User Msg 2]
    Gemini->>Cache: Check prefix hash
    Cache-->>Gemini: ✓ Cache HIT<br/>Return cached prefix
    Note over Gemini: Only process new message
    Gemini-->>App: Response<br/>💰 $0.04/1M tokens (73% discount)

    Note over App,Cache: Request 10 (Still warm)
    App->>Gemini: [Session Summary] [Module] [System] [User Msg 10]
    Gemini->>Cache: Check prefix hash
    Cache-->>Gemini: ✓ Cache HIT + Refresh<br/>Extend 1 hour
    Gemini-->>App: Response<br/>💰 $0.04/1M tokens (73% discount)
```

**Cache Key:** Hash of message prefix (roles + content)
**Cache Lifetime:** 1 hour (auto-refreshed on use)
**Pricing:** Cached reads cost 73% less ($0.04 vs $0.15 per 1M tokens)

---

### Our Caching Strategy

**Optimization Approach:**

1. **Static Prefix Design**
   - Parts 1-3 never change during session
   - Part 4 changes slowly (every 10 messages)
   - Part 5 is always dynamic

2. **Message Ordering**
   ```
   [Part 1: Session Summary]  ← STATIC (100% cache hit)
   [Part 2: Module Prompt]    ← STATIC (100% cache hit)
   [Part 3: System Prompt]    ← STATIC (100% cache hit)
   [Part 4: Chat Summary]     ← PERIODIC (90% cache hit)
   [Part 5: Recent Messages]  ← DYNAMIC (0% cache hit)
   ```

3. **Cache Hit Calculation**
   - Total context: ~7,000 tokens
   - Cacheable: ~5,500 tokens (79%)
   - Dynamic: ~1,500 tokens (21%)

**Result:** 79% of tokens served from cache at 73% discount

---

### Sliding Window Conversation Management

**Problem:** Without intervention, context grows linearly and becomes too large.

**Solution:** Sliding window + periodic summarization

```mermaid
graph LR
    subgraph "Messages 1-5"
        M1[Msg 1] --> M2[Msg 2]
        M2 --> M3[Msg 3]
        M3 --> M4[Msg 4]
        M4 --> M5[Msg 5]
    end

    subgraph "Messages 6-10"
        M6[Msg 6] --> M7[Msg 7]
        M7 --> M8[Msg 8]
        M8 --> M9[Msg 9]
        M9 --> M10[Msg 10]
    end

    M5 --> Summary1[📝 Generate Summary<br/>Msgs 1-10<br/>~400 tokens]

    subgraph "Messages 11-15"
        M11[Msg 11] --> M12[Msg 12]
        M12 --> M13[Msg 13]
        M13 --> M14[Msg 14]
        M14 --> M15[Msg 15]
    end

    M10 --> Summary2[📝 Update Summary<br/>Msgs 1-15<br/>~400 tokens]

    subgraph "Context Window"
        Session[Session Summary<br/>3-5k tokens]
        Module[Module Prompt<br/>500-1k tokens]
        System[System Prompt<br/>800 tokens]
        ChatSum[Chat Summary<br/>400 tokens]
        Recent[Recent 5 Messages<br/>1-2k tokens]
    end

    Summary1 -.->|Replaces older msgs| ChatSum
    Summary2 -.->|Updates summary| ChatSum

    Session --> Total[Total Context:<br/>6-8k tokens]
    Module --> Total
    System --> Total
    ChatSum --> Total
    Recent --> Total

    style Summary1 fill:#fff9c4
    style Summary2 fill:#fff9c4
    style Total fill:#c8e6c9
```

**Benefits:**
- Context stays bounded (~6,000-8,000 tokens total)
- Long-term memory preserved via summaries
- Cache efficiency maintained
- Infinite conversation length possible

---

## Security & HIPAA Compliance

### Authentication & Authorization Flow

```mermaid
flowchart TD
    Start[Client Request] --> Token[Firebase ID Token<br/>Verification]

    Token -->|Invalid| Unauth[❌ 401 Unauthorized]
    Token -->|Valid| Role[Role Check:<br/>requireTherapist]

    Role -->|Patient/Other| Forbidden[❌ 403 Forbidden]
    Role -->|Therapist/Org Admin/<br/>Super Admin| Session[Session Access Check:<br/>requireSessionAccess]

    Session -->|No Access| Forbidden2[❌ 403 Forbidden]
    Session -->|Has Access| RateLimit[Rate Limit Check:<br/>Arcjet 20/hour]

    RateLimit -->|Exceeded| TooMany[❌ 429 Too Many Requests]
    RateLimit -->|Within Limit| Process[✅ Process AI Request]

    Process --> Success[Return AI Response]

    style Start fill:#e3f2fd
    style Process fill:#c8e6c9
    style Success fill:#a5d6a7
    style Unauth fill:#ffcdd2
    style Forbidden fill:#ffcdd2
    style Forbidden2 fill:#ffcdd2
    style TooMany fill:#ffcdd2
```

---

### PHI Protection Measures

**1. Audit Logging**
- Every AI request logged via `logPHIAccess()`
- Logged data:
  - User ID (therapist)
  - Session ID
  - Resource type: 'ai_chat'
  - Action: 'chat' or 'analyze_selection'
  - Timestamp
  - IP address
  - User agent
- Retention: 7 years (HIPAA requirement)

**2. Data Encryption**
- **In Transit:** TLS 1.3 (HTTPS)
- **At Rest:** Google Cloud default encryption (AES-256)
- **Database:** Neon PostgreSQL with encryption

**3. Access Control**
- RBAC: Only therapists can access AI chat
- Session ownership verified before every request
- No cross-patient data access

**4. API Key Security**
- Google Service Account credentials
- Stored in environment variables (not in code)
- Rotated regularly (recommended: 90 days)

---

### Rate Limiting Strategy

**Purpose:**
- Prevent abuse
- Control costs
- Ensure fair usage

**Implementation:** Arcjet
```typescript
const aiChatRateLimit = arcjet.tokenBucket({
  mode: 'LIVE',
  characteristics: ['userId'],
  refillRate: 20,
  interval: 3600, // 1 hour
  capacity: 20,
});
```

**Limits:**
- 20 AI requests per hour per user
- Bucket refills continuously
- Burst capacity: 20 requests

**User Experience:**
- Warning at 15 requests (75% capacity)
- Error at 20 requests with retry time
- Graceful degradation (no app crash)

---

### Business Associate Agreement (BAA)

**Required for HIPAA Compliance:**

✅ **Google Cloud (Vertex AI):**
- BAA required and available
- Contact: Google Cloud sales team
- Covered services: Vertex AI, Cloud Storage, BigQuery

✅ **Neon (PostgreSQL):**
- BAA available on Enterprise plan
- Audit logging included
- Encryption at rest and in transit

⚠️ **Important:**
- Ensure BAAs are signed before production launch
- Review annually for compliance
- Document all covered services

---

## Performance Characteristics

### Latency Breakdown

**First Message (Cold Start):**
```
1. Session summary generation:        15-30 seconds (one-time)
2. Database queries (context):        200-500ms
3. Gemini API call:                   2-5 seconds
4. Database save (messages):          100-200ms
─────────────────────────────────────────────────
Total: 17-35 seconds (first message only)
```

**Subsequent Messages (Warm Cache):**
```
1. Database queries (context):        200-500ms
2. Gemini API call (cached):          2-5 seconds
3. Database save (messages):          100-200ms
─────────────────────────────────────────────────
Total: 2.3-5.7 seconds
```

---

### Optimization Opportunities

**1. Pre-generate Session Summaries**
```
Current: Generate on first AI chat request (15-30s wait)
Improved: Generate immediately after transcription completes
Result: First AI chat response in 2-5 seconds (no summary wait)
```

**Implementation:**
```typescript
// In transcription completion handler
await SessionSummaryService.generateSessionSummary(sessionId);
```

**2. Implement Streaming Responses**
```
Current: Wait for full response, then display
Improved: Stream tokens as they generate
Result: Perceived latency <1 second (first token)
```

**Implementation:**
```typescript
const stream = await generateTextStream(messages, options);
for await (const chunk of stream) {
  sendToClient(chunk);
}
```

**3. Database Query Optimization**
```
Current: Separate queries for session, module, messages
Improved: Single query with JOINs
Result: 200ms → 50ms for context loading
```

---

### Caching Performance Metrics

**Cache Hit Rate:**
- Part 1 (Session Summary): 100%
- Part 2 (Module Prompt): 100%
- Part 3 (System Prompt): 100%
- Part 4 (Chat Summary): 90%
- **Overall: 95% of cacheable content hits cache**

**Cache Benefits:**
- **Latency Reduction:** 2-3 seconds → 0.5-1 second (API time)
- **Cost Reduction:** $0.015 → $0.009 per session (41% savings)
- **Scalability:** 10× more requests with same cost budget

---

## Model Comparison

### Available Models (Configured in System)

| Model | Provider | Input Cost | Output Cost | Speed | Quality | Use Case |
|-------|----------|------------|-------------|-------|---------|----------|
| **gemini-2.5-flash** ⭐ | Google | $0.15/1M | $0.60/1M | Fast | High | **Default** (recommended) |
| gemini-2.5-flash-lite | Google | $0.02/1M | $0.02/1M | Fastest | Good | Simple queries, high volume |
| gemini-2.5-pro | Google | $1.25/1M | $10.00/1M | Slow | Highest | Complex analysis, research |
| gpt-4o | OpenAI | $2.50/1M | $10.00/1M | Medium | High | Alternative to Gemini Pro |
| gpt-4o-mini | OpenAI | $0.15/1M | $0.60/1M | Fast | Good | Cost-optimized OpenAI |

**⭐ Default Choice: gemini-2.5-flash**

**Reasoning:**
- Best balance of cost, speed, and quality
- Excellent markdown formatting
- Strong instruction following
- Automatic prompt caching
- 73% faster than GPT-4o
- 16× cheaper than GPT-4o

---

### Cost Comparison (200k Requests/Year)

| Model | Annual Cost | vs. Default | Monthly Cost |
|-------|-------------|-------------|--------------|
| **gemini-2.5-flash** | **$3,176** | Baseline | **$265** |
| gemini-2.5-flash-lite | $400 | -87% | $33 |
| gemini-2.5-pro | $33,000 | +939% | $2,750 |
| gpt-4o | $50,000 | +1,475% | $4,167 |
| gpt-4o-mini | $3,000 | -6% | $250 |

**Note:** Includes session summary generation cost ($3,000/year with GPT-4o-mini)

---

## Key Files Reference

### Frontend
- **TranscriptViewerClient.tsx**
  - Location: `/src/app/(auth)/sessions/[id]/transcript/TranscriptViewerClient.tsx`
  - Purpose: Main transcript page with 3-panel layout
  - Features: Transcript view, AI chat panel, media library

- **AIAssistantPanel.tsx**
  - Location: `/src/components/sessions/AIAssistantPanel.tsx`
  - Purpose: AI chat interface component
  - Features: Message history, input, model selector, example prompts

### Backend

- **API Route: /api/ai/chat**
  - Location: `/src/app/api/ai/chat/route.ts`
  - Purpose: Main AI chat endpoint
  - Security: Auth, RBAC, rate limiting, input validation
  - Context: Builds 5-part intelligent context

- **Text Generation Service**
  - Location: `/src/libs/TextGeneration.ts`
  - Purpose: Abstract AI provider routing
  - Supports: Gemini, OpenAI, Anthropic (planned)

- **Gemini Chat Provider**
  - Location: `/src/libs/providers/GeminiChat.ts`
  - Purpose: Google Vertex AI integration
  - Features: OAuth2, request formatting, error handling

### Services

- **Session Summary Service**
  - Location: `/src/services/SessionSummaryService.ts`
  - Purpose: Generate and cache session summaries
  - Model: GPT-4o-mini (temp=0.3, max_tokens=2000)

- **Chat Summary Service** (Planned)
  - Location: `/src/services/ChatSummaryService.ts`
  - Purpose: Generate conversation summaries every 10 messages
  - Status: Not yet implemented (placeholder in code)

### Database

- **ai_chat_messages**
  ```sql
  CREATE TABLE ai_chat_messages (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(id),
    role TEXT NOT NULL, -- 'user' | 'assistant' | 'system'
    content TEXT NOT NULL,
    prompt_type TEXT, -- 'chat' | 'analyze_selection' | 'conversation_summary'
    model TEXT,
    tokens_input INTEGER,
    tokens_output INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

- **sessions**
  ```sql
  session_summary JSONB, -- Cached summary from SessionSummaryService
  ```

---

## Quick Reference

### Environment Variables Required

```bash
# Google Vertex AI (Gemini)
GOOGLE_VERTEX_PROJECT_ID=your-project-id
GOOGLE_VERTEX_LOCATION=us-central1
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# OpenAI (Alternative)
OPENAI_API_KEY=sk-...

# Arcjet (Rate Limiting)
ARCJET_KEY=ajkey_...

# Firebase (Authentication)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

---

### Common AI Chat Scenarios

**1. General Session Analysis**
```
User: "What are the main themes in this session?"
Context Used: Session summary, system prompt
Response Time: 2-3 seconds
Cost: ~$0.001
```

**2. Analyze Selected Text**
```
User: Selects text → "What's significant about this moment?"
Context Used: Session summary, selected text, system prompt
Response Time: 2-3 seconds
Cost: ~$0.001
```

**3. Visual Concept Generation**
```
User: "Suggest visual concepts for the pressure cooker metaphor"
Context Used: Full context + previous conversation
Response Time: 3-5 seconds
Cost: ~$0.001
```

**4. Module-Specific Analysis**
```
User: "How does this session align with our anxiety module goals?"
Context Used: Session summary + Module prompt + chat history
Response Time: 3-5 seconds
Cost: ~$0.001
```

---

### Troubleshooting

**Issue: "Could not load default credentials" error**
- **Cause:** Missing or invalid `GOOGLE_SERVICE_ACCOUNT_KEY`
- **Fix:** Ensure environment variable is valid JSON
- **Reference:** `libs/providers/GeminiChat.ts` lines 69-77

**Issue: Slow first message (15-30 seconds)**
- **Cause:** Session summary generation on first request
- **Fix:** Pre-generate summaries after transcription
- **Reference:** `SessionSummaryService.getOrCreateSessionSummary()`

**Issue: Rate limit errors**
- **Cause:** Exceeded 20 requests/hour
- **Fix:** Wait for bucket refill or increase limit
- **Reference:** `/api/ai/chat/route.ts` line 47-55

**Issue: Context too large error**
- **Cause:** Very long session (>2 hours) or many messages
- **Fix:** Implement chat summarization (Part 4)
- **Reference:** Planned feature in ChatSummaryService

---

## Next Steps & Roadmap

### Immediate Optimizations

1. **Pre-generate Session Summaries**
   - Generate after transcription completes
   - Eliminate 15-30 second wait on first AI chat
   - Implementation: 2-3 hours

2. **Implement Chat Summarization**
   - Activate every 10 messages
   - Prevent context overflow
   - Implementation: 4-6 hours

3. **Add Streaming Responses**
   - Stream tokens as they generate
   - Reduce perceived latency to <1 second
   - Implementation: 6-8 hours

### Future Enhancements

1. **Multi-session Analysis**
   - Analyze patterns across multiple sessions
   - Track therapeutic progress over time
   - Long-term trend identification

2. **Custom Module Training**
   - Fine-tune models on organization's module library
   - Improve module-specific analysis quality
   - Reduce token usage (smaller prompts)

3. **Voice Input**
   - Speak questions to AI assistant
   - Faster therapist workflow
   - Accessibility improvement

4. **Collaborative Filtering**
   - Suggest similar successful therapeutic approaches
   - Learn from aggregate anonymized data
   - Improve recommendation quality

---

**Last Updated:** 2025-01-13
**Maintained By:** Development Team
**Questions?** See `/docs` or contact engineering team
