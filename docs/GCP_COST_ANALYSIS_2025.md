# StoryCare GCP Cost Analysis for 1,000 Users (2025)

**Analysis Date:** January 2025
**Target Architecture:** Full GCP Stack
**User Count:** 1,000 (800 therapists + 200 patients)

---

## Executive Summary

StoryCare is a HIPAA-compliant digital therapeutic platform using narrative therapy with AI-generated media. This analysis estimates GCP infrastructure costs for **1,000 active users** using:

- **Cloud Run** for application hosting
- **Cloud SQL PostgreSQL** for database
- **Cloud Storage** for media files
- **Google Identity Platform** for authentication
- **Vertex AI** (Gemini, Imagen, Speech-to-Text) for AI services

### Cost Summary (Two Configuration Options)

**Option A: 100% GCP Stack (Recommended)**
- **Total Monthly Cost: $1,117/month** ($13,403/year)
- **Cost Per User: $1.12/month**
- Includes GCP Speech-to-Text V2 Dynamic Batch ($600/month)
- Single vendor, unified billing, one BAA

**Option B: Hybrid (Cost-Optimized)**
- **Total Monthly Cost: $947/month** ($11,362/year)
- **Cost Per User: $0.95/month**
- Uses Deepgram for transcription ($430/month)
- 15% cheaper, but requires additional vendor management

---

## 1. Application Architecture Overview

### User Roles & Behavior
- **800 Therapists** (Primary Users)
  - Upload 20-30 therapy sessions/year
  - Generate 5-10 images per session
  - Create 2-3 story pages per patient/year
  - Engage with AI chat 50-100 times/year

- **200 Patients** (Secondary Users)
  - View story pages 10-20 times/year
  - Submit reflections and surveys
  - Limited direct interaction

### Key Workflows
1. **Session Upload → Transcription** (Deepgram)
2. **Transcript Analysis** (Vertex AI Gemini)
3. **Image Generation** (Vertex AI Imagen / DALL-E)
4. **Video Scene Assembly** (FFmpeg on Cloud Run)
5. **Story Page Creation & Viewing**

---

## 2. Database Requirements (Cloud SQL PostgreSQL)

### Schema Overview
**26 Tables** across 10 functional groups:

| Category | Tables | Purpose |
|----------|--------|---------|
| **Core** | users, organizations, groups | User management |
| **Sessions** | sessions, transcripts, utterances, speakers | Therapy data |
| **AI** | ai_chat_conversations, ai_chat_messages | AI assistant |
| **Media** | media_library, quotes, notes | Content library |
| **Stories** | story_pages, page_blocks, scenes, scene_clips | Patient content |
| **Engagement** | reflection_questions, survey_questions, responses | Patient feedback |
| **Admin** | audit_logs, platform_settings | Compliance |

### Storage Estimates (Year 1)

| Data Type | Volume | Size |
|-----------|--------|------|
| User profiles | 1,000 users | 2 MB |
| Session metadata | 20,000 sessions | 20 MB |
| **Transcripts** (full text) | 20,000 | **1 GB** |
| Utterances (diarized) | 400,000 | 200 MB |
| AI chat messages | 100,000 | 200 MB |
| Media metadata | 65,000 items | 130 MB |
| **Audit logs** (HIPAA) | 500,000 events | **500 MB** |
| Other tables | Various | 150 MB |
| **Total Year 1** | | **~2.5 GB** |
| **7-Year Retention** | | **~17.5 GB** |

### Recommended Configuration

**Cloud SQL PostgreSQL - Enterprise Edition**

| Spec | Value | Justification |
|------|-------|---------------|
| Instance Type | db-custom-2-8192 | 2 vCPU, 8 GB RAM |
| Storage | 50 GB SSD | Allows for 3+ years growth |
| High Availability | No (initially) | Can enable later (+70% cost) |
| Backups | Automated daily | Included in base price |
| Region | us-central1 (Tier 1) | Standard region |

### Cost Calculation (2025 Pricing)

**Base Pricing:**
- 2 vCPU: $0.0969/hour × 730 hours = **$70.74/month**
- 8 GB RAM: $0.0164/GB/hour × 730 hours = **$95.78/month**
- 50 GB SSD: $0.17/GB/month = **$8.50/month**
- **Subtotal: $175.02/month**

**With Committed Use Discount (1-year):**
- 25% discount on CPU/RAM: **$131.27/month**
- **Total: $139.77/month ≈ $140/month**

**With High Availability (+70%):**
- **$237.50/month**

**Recommendation for 1k users:** Start without HA, enable at 5k+ users.

---

## 3. File Storage (Cloud Storage)

### Storage Breakdown

| File Type | Annual Volume | Avg Size | Total Storage |
|-----------|--------------|----------|---------------|
| **Session Audio** (mp3) | 20,000 files | 50 MB | 1,000 GB |
| **Generated Images** (png/jpg) | 50,000 files | 2 MB | 100 GB |
| **Generated Videos** (mp4) | 5,000 files | 20 MB | 100 GB |
| **Assembled Scenes** (mp4) | 10,000 files | 50 MB | 500 GB |
| Patient Reference Images | 1,000 files | 2 MB | 2 GB |
| Thumbnails | 60,000 files | 200 KB | 12 GB |
| **Total Year 1** | | | **1,714 GB** |
| **3-Year Retention** | | | **~5.1 TB** |

### Storage Class Strategy

| Storage Class | Retention Period | Volume (3-year) | Use Case |
|---------------|-----------------|----------------|----------|
| **Standard** | 0-90 days | 500 GB | Recent sessions, active content |
| **Nearline** | 90-365 days | 1,000 GB | Last year's content |
| **Coldline** | 365+ days | 3,600 GB | Archived content |

### Cost Calculation (2025 Pricing)

**Standard Storage (Regional - us-central1):**
- Storage: 500 GB × $0.020/GB = **$10.00/month**
- Operations: ~50k reads/month × $0.004/10k = **$0.20/month**
- **Subtotal: $10.20/month**

**Nearline Storage:**
- Storage: 1,000 GB × $0.010/GB = **$10.00/month**
- Retrieval: ~20 GB/month × $0.01/GB = **$0.20/month**
- Operations: ~10k reads/month × $0.01/10k = **$0.10/month**
- **Subtotal: $10.30/month**

**Coldline Storage:**
- Storage: 3,600 GB × $0.004/GB = **$14.40/month**
- Retrieval: ~5 GB/month × $0.02/GB = **$0.10/month**
- Operations: ~2k reads/month × $0.05/10k = **$0.01/month**
- **Subtotal: $14.51/month**

**Total Storage Cost: $35/month**

### Cost Optimization Recommendations
1. **Compress audio files:** Use Opus codec (50% size reduction) → Save $5/month
2. **Lazy thumbnail generation:** Generate on-demand → Save $2/month
3. **Video optimization:** Compress assembled scenes → Save $5/month
4. **Potential Savings: $12/month (34% reduction)**

---

## 4. Compute Resources (Cloud Run)

### Application Requirements

**Estimated Request Volume:**
- **Total Requests:** 5M/year = 416k/month = 13.8k/day
- **Peak Traffic:** ~10 requests/second (business hours)
- **Avg Response Time:** 200-500ms (excluding AI calls)
- **Long-Running Tasks:** Transcription (async), Video assembly (async)

### Cloud Run Configuration

| Parameter | Value | Justification |
|-----------|-------|---------------|
| CPU | 2 vCPU | Handle concurrent requests + FFmpeg |
| Memory | 4 GB | Sufficient for Node.js + in-memory operations |
| Min Instances | 1 | Keep warm (reduce cold starts) |
| Max Instances | 10 | Auto-scale during peak |
| Concurrency | 80 | Standard for web apps |
| Region | us-central1 | Tier 1 pricing |

### Cost Calculation (2025 Pricing)

**Tier 1 Pricing:**
- CPU: $0.00002400 per vCPU-second
- Memory: $0.00000250 per GiB-second
- Requests: $0.40 per million requests

**Always-On Instance (1 instance, 24/7):**
- CPU: 2 vCPU × 2.628M seconds/month × $0.00002400 = **$126.14**
- Memory: 4 GB × 2.628M seconds/month × $0.00000250 = **$26.28**
- **Subtotal: $152.42/month**

**Additional Request Processing (peak traffic):**
- Estimated additional compute: 500k vCPU-seconds/month
- CPU: 500k × $0.00002400 = **$12.00**
- Memory: 500k × 4 GB × $0.00000250 = **$5.00**
- **Subtotal: $17.00/month**

**Request Charges:**
- 416k requests/month (within 2M free tier) = **$0.00**

**Total Cloud Run (API): $169.42/month ≈ $170/month**

### Cloud Run Jobs (Background Processing)

**Use Cases:**
- Async transcription processing
- Video assembly (FFmpeg)
- Scheduled cleanup tasks
- Audit log archival

**Estimated Usage:**
- 20,000 transcription jobs/year = 1,667/month
- Avg duration: 5 minutes (300 seconds)
- 10,000 video assembly jobs/year = 833/month
- Avg duration: 10 minutes (600 seconds)

**Cost:**
- Transcription: 1,667 × 300s × 2 vCPU × $0.00002400 = **$24.00**
- Video: 833 × 600s × 2 vCPU × $0.00002400 = **$24.00**
- Memory: Included in CPU calculation
- **Total Jobs: $48/month**

**Total Compute (Cloud Run + Jobs): $218/month**

---

## 5. Authentication (Google Identity Platform)

### User Breakdown

| User Type | Count | MFA Required | Notes |
|-----------|-------|--------------|-------|
| Therapists | 800 | Yes | HIPAA compliance |
| Patients | 200 | No | Optional |
| Admins | 10 | Yes | System administrators |
| **Total** | **1,010** | **810 MFA users** | |

### Monthly Active Users (MAU)

- **Therapists:** 720 MAU (90% active)
- **Patients:** 80 MAU (40% active)
- **Admins:** 10 MAU (100% active)
- **Total MAU:** 810

### Cost Calculation (2025 Pricing)

**Base Authentication:**
- First 50,000 MAU: **Free**

**Multi-Factor Authentication (SMS):**
- **Option 1: SMS MFA**
  - 810 therapists/admins × $0.06/user/month = **$48.60/month**
  - First 10 SMS/day free (covers most usage)
  - Additional SMS: $0.01-0.03 per message (varies by country)

- **Option 2: TOTP/Authenticator App MFA**
  - Included in base MAU pricing: **$0/month**
  - Recommended for cost optimization

**Enterprise SSO (SAML/OIDC):**
- 810 MAU × $0.015/MAU = **$12.15/month**
- Only if enterprise SSO required

**Recommended Configuration:**
- Use TOTP/Authenticator apps for MFA
- **Total Auth Cost: $0/month** (within free tier)

**If SMS MFA required: $48.60/month**

---

## 6. AI Services (Vertex AI)

### 6.1 Text Generation (Gemini)

**Use Cases:**
- Transcript analysis and insights
- AI chat assistant for therapists
- Quote extraction and summarization

**Model Selection:**

| Model | Use Case | Input Cost | Output Cost |
|-------|----------|------------|-------------|
| **Gemini 2.5 Flash** | Default (recommended) | $0.15/1M tokens | $0.60/1M tokens |
| Gemini 2.5 Flash-Lite | Simple queries | $0.02/1M tokens | $0.02/1M tokens |
| Gemini 2.5 Pro | Complex analysis | $1.25/1M tokens | $10.00/1M tokens |

**Usage Estimates:**

| Activity | Volume/Year | Avg Input | Avg Output |
|----------|-------------|-----------|------------|
| Transcript analysis | 20,000 sessions | 5,000 tokens | 1,000 tokens |
| AI chat messages | 100,000 queries | 2,000 tokens | 500 tokens |
| Quote extraction | 50,000 quotes | 1,000 tokens | 200 tokens |

**Token Calculation:**
- **Input Tokens:**
  - Transcripts: 20k × 5,000 = 100M tokens
  - Chat: 100k × 2,000 = 200M tokens
  - Quotes: 50k × 1,000 = 50M tokens
  - **Total Input: 350M tokens/year = 29.2M tokens/month**

- **Output Tokens:**
  - Transcripts: 20k × 1,000 = 20M tokens
  - Chat: 100k × 500 = 50M tokens
  - Quotes: 50k × 200 = 10M tokens
  - **Total Output: 80M tokens/year = 6.7M tokens/month**

**Cost (Gemini 2.5 Flash):**
- Input: 29.2M × $0.15/1M = **$4.38/month**
- Output: 6.7M × $0.60/1M = **$4.02/month**
- **Total Text Generation: $8.40/month**

**Cost Optimization:**
- Use Flash-Lite for simple queries: **Save $2/month**
- Implement response caching: **Save $3/month**
- **Optimized Cost: $3.40/month**

---

### 6.2 Image Generation (Imagen)

**Use Cases:**
- Generate visual representations of patient narratives
- Create scene backgrounds and assets
- Generate patient reference images

**Model Options:**

| Provider | Model | Cost/Image | Quality |
|----------|-------|------------|---------|
| **Vertex AI** | Imagen 4 Ultra | $0.04 | Highest |
| Vertex AI | Imagen 4 Standard | $0.03 | High |
| Vertex AI | Imagen 4 Fast | $0.02 | Good |
| OpenAI | DALL-E 3 (1024×1024) | $0.04 | High |
| OpenAI | DALL-E 2 (1024×1024) | $0.02 | Good |

**Usage Estimates:**
- **Volume:** 50,000 images/year = 4,167 images/month
- **Mix Strategy:**
  - 30% Imagen 4 Ultra (quality-critical): 1,250 images
  - 70% Imagen 4 Fast (general use): 2,917 images

**Cost Calculation:**

**Option 1: All Imagen 4 Ultra**
- 4,167 images × $0.04 = **$166.68/month**

**Option 2: Mixed Strategy (Recommended)**
- Ultra: 1,250 × $0.04 = **$50.00**
- Fast: 2,917 × $0.02 = **$58.34**
- **Total: $108.34/month**

**Option 3: All DALL-E 2**
- 4,167 × $0.02 = **$83.34/month**

**Recommended:** Mixed strategy → **$108/month**

---

### 6.3 Speech-to-Text Comparison

**Usage:**
- 20,000 sessions/year = 1,667 sessions/month
- Avg duration: 60 minutes/session
- **Total Audio:** 1,667 sessions × 60 min = **100,020 minutes/month**
- **Annual:** 1,200,240 minutes/year

---

#### Option 1: Deepgram Nova-2 (Recommended for Cost)

**Note:** Not a GCP service, but included for comparison.

**Features:**
- ✅ High accuracy with medical/therapeutic vocabulary
- ✅ Built-in speaker diarization (no extra cost)
- ✅ Real-time and pre-recorded support
- ✅ Fast processing (<1 min for 60-min audio)
- ✅ Simple flat-rate pricing

**Pricing:**
- **Standard:** $0.0043/minute (flat rate)
- Monthly: 100,020 × $0.0043 = **$430.09/month**
- Annual: 1,200,240 × $0.0043 = **$5,161/year**

**Pros:**
- ✅ 73% cheaper than GCP Speech-to-Text
- ✅ No volume tiers to manage
- ✅ Excellent for therapy/medical domain
- ✅ No diarization surcharge

**Cons:**
- ❌ Not part of unified GCP billing
- ❌ Separate BAA required for HIPAA
- ❌ Additional vendor management

---

#### Option 2: GCP Speech-to-Text V2 (Chirp 2) - Standard Pricing

**Features:**
- ✅ Unified GCP billing and IAM
- ✅ Native integration with Cloud Storage
- ✅ Automatic language detection
- ✅ Single BAA covers all services
- ✅ Large Speech Model (LSM) architecture

**Pricing Tiers (2025):**

| Volume | Price/Minute | Monthly Cost | Annual Cost |
|--------|--------------|--------------|-------------|
| **0-60 min** | Free | $0 | $0 |
| **0-500k min** | $0.016 | $1,600.32 | $19,203.84 |
| **500k-1M min** | $0.010 | - | - |
| **1M-2M min** | $0.008 | - | - |
| **2M+ min** | Custom pricing | - | - |

**Cost for 100,020 min/month (Standard Tier):**
- Monthly: 100,020 × $0.016 = **$1,600.32/month**
- Annual: 1,200,240 × $0.016 = **$19,203.84/year**

**Speaker Diarization Add-on:**
- **Additional:** ~$0.004/minute (estimated based on feature surcharge)
- With diarization: 100,020 × $0.020 = **$2,000/month**

**Pros:**
- ✅ Single GCP billing platform
- ✅ Better integration with other GCP services
- ✅ Unified IAM and security policies
- ✅ Single BAA for all services
- ✅ Volume discounts at scale

**Cons:**
- ❌ 3.7× more expensive than Deepgram
- ❌ Diarization costs extra
- ❌ Higher costs until reaching 500k min/month tier

---

#### Option 3: GCP Speech-to-Text V2 - Dynamic Batch (75% Discount)

**Best for:** Non-urgent transcription (up to 24-hour delay acceptable)

**Pricing:**
- **Dynamic Batch:** $0.004/minute (75% discount from standard)
- Monthly: 100,020 × $0.004 = **$400.08/month**
- Annual: 1,200,240 × $0.004 = **$4,800.96/year**

**With Diarization:**
- Estimated: $0.005-0.006/minute
- Monthly: 100,020 × $0.006 = **$600.12/month**

**Pros:**
- ✅ **Cheapest GCP option** (even cheaper than Deepgram!)
- ✅ All benefits of GCP integration
- ✅ 93% savings vs standard pricing
- ✅ Perfect for post-session processing

**Cons:**
- ❌ Up to 24-hour processing delay
- ❌ Not suitable for real-time transcription
- ❌ Requires async workflow design

**Workflow Fit:**
- ✅ **Excellent fit** for StoryCare: therapists upload sessions after completion
- ✅ Transcripts ready within hours (not needed immediately)
- ✅ Allows for overnight batch processing

---

#### Cost Comparison Summary

| Provider | Model | Cost/Min | Monthly Cost | Annual Cost | Savings vs Standard GCP |
|----------|-------|----------|--------------|-------------|------------------------|
| **Deepgram** | Nova-2 | $0.0043 | $430 | $5,161 | 73% |
| **GCP (Standard)** | Chirp 2 | $0.016 | $1,600 | $19,204 | - (baseline) |
| **GCP (w/ Diarization)** | Chirp 2 | $0.020 | $2,000 | $24,005 | -25% |
| **GCP (Dynamic Batch)** | Chirp 2 | $0.004 | $400 | $4,801 | **75%** |
| **GCP (Batch + Diarization)** | Chirp 2 | $0.006 | $600 | $7,201 | 70% |

---

#### Scaling Considerations (At Volume)

**At 10,000 users (1M minutes/month):**

| Provider | Pricing Tier | Monthly Cost |
|----------|--------------|--------------|
| Deepgram | Flat rate ($0.0043) | $4,300 |
| GCP Standard | Tier 2 ($0.010) | $10,000 |
| GCP Dynamic Batch | 75% off ($0.004) | $4,000 |

**At 100,000 users (10M minutes/month):**

| Provider | Pricing Tier | Monthly Cost |
|----------|--------------|--------------|
| Deepgram | Flat rate | $43,000 |
| GCP Standard | Custom pricing (~$0.006) | $60,000 |
| GCP Dynamic Batch | 75% off | $40,000 |

**Recommendation at Scale:** GCP Dynamic Batch becomes most cost-effective at 100k+ users.

---

#### Final Recommendation by Use Case

**For 1k Users (Current):**

1. **Best Cost (Non-GCP):** Deepgram Nova-2 → **$430/month**
2. **Best All-GCP:** Dynamic Batch → **$400-600/month** ✅ **RECOMMENDED**
3. **Real-time Requirement:** GCP Standard → **$1,600-2,000/month**

**Recommended:** **GCP Speech-to-Text V2 (Dynamic Batch) with Diarization**
- Cost: **$600/month** ($7,201/year)
- Unified GCP billing
- 24-hour SLA fits post-session workflow
- Saves $830/month vs Deepgram
- Saves $1,400/month vs GCP Standard

**Implementation Notes:**
- Upload audio to Cloud Storage bucket
- Trigger Speech-to-Text V2 batch job via Cloud Run
- Store transcript in Cloud SQL when complete
- Notify therapist via email/push notification
- Typical processing time: 2-6 hours (well within 24h SLA)

---

## 7. Networking & Data Transfer

### Egress Traffic Estimates

| Traffic Type | Volume/Month | Notes |
|--------------|--------------|-------|
| Patient story pages (HTML/JS/CSS) | 20 GB | Static content |
| Image downloads | 80 GB | Patient viewing images |
| Video streaming | 50 GB | Assembled scenes |
| API responses (JSON) | 15 GB | Mobile/web app |
| Audio downloads | 10 GB | Therapist review |
| **Total Egress** | **175 GB** | |

### Cost Calculation (2025 Pricing)

**GCP Egress Pricing (Worldwide destinations, excluding China/Australia):**
- First 100 GB/month: **Free**
- 100-10,000 GB: $0.12/GB
- 10-150 TB: $0.11/GB

**Cost:**
- First 100 GB: **$0.00**
- Next 75 GB: 75 × $0.12 = **$9.00**
- **Total Egress: $9/month**

### Cost Optimization
- **Cloud CDN:** Cache static assets (images, videos)
  - Reduces origin egress by 60-80%
  - CDN cost: $0.08/GB (cache egress) vs $0.12/GB (origin egress)
  - **Potential Savings:** $5/month
  - **CDN Cost:** $3/month
  - **Net Savings:** $2/month

**Recommended:** Enable Cloud CDN → **$7/month**

---

## 8. Additional GCP Services

### Cloud Scheduler
**Purpose:** Scheduled tasks (cleanup, backups, analytics)

**Jobs:**
- Audit log archival: Daily (1 job)
- Storage lifecycle checks: Weekly (1 job)
- Usage metrics aggregation: Hourly (1 job)
- Session cleanup: Daily (1 job)
- **Total: 4 jobs**

**Cost:** $0.10/job/month × 4 = **$0.40/month**

---

### Cloud Pub/Sub
**Purpose:** Async message queue for background jobs

**Usage:**
- Transcription job triggers: 1,667/month
- Video assembly triggers: 833/month
- Notification dispatch: 5,000/month
- **Total Messages:** ~7,500/month

**Cost:**
- First 10 GB/month: Free
- Message ingestion: ~1 GB (within free tier)
- **Total: $0/month** (within free tier)

---

### Cloud Logging (Operations Suite)

**Log Volume:**
- Application logs: 8 GB/month
- Audit logs (HIPAA): 4 GB/month
- Access logs: 2 GB/month
- Error tracking: 1 GB/month
- **Total: 15 GB/month**

**Cost:**
- First 50 GB/month: **Free**
- **Total Logging: $0/month**

---

### Cloud Monitoring

**Metrics:**
- Cloud Run metrics (CPU, memory, requests)
- Cloud SQL metrics (connections, queries)
- Custom application metrics
- Uptime checks: 10 checks

**Cost:**
- Included metrics: Free
- Uptime checks: First 1M requests free
- **Total Monitoring: $0/month** (within free tier)

---

## 9. TOTAL GCP COST BREAKDOWN (1,000 Users)

### Monthly Cost Summary

| Service | Configuration | Monthly Cost | Annual Cost |
|---------|--------------|--------------|-------------|
| **Cloud SQL PostgreSQL** | db-custom-2-8192, 50GB SSD | $140.00 | $1,680 |
| **Cloud Storage** | 5TB (Standard+Nearline+Coldline) | $35.00 | $420 |
| **Cloud Run (API)** | 1-10 instances, 2 vCPU, 4GB RAM | $170.00 | $2,040 |
| **Cloud Run Jobs** | Transcription + Video assembly | $48.00 | $576 |
| **Identity Platform** | 810 MAU, TOTP MFA | $0.00 | $0 |
| **Identity Platform (SMS MFA)** | Alternative with SMS | $48.60 | $583 |
| **Vertex AI Gemini** | Text generation (2.5 Flash) | $8.40 | $101 |
| **Vertex AI Imagen** | Image generation (mixed) | $108.00 | $1,296 |
| **Networking (Egress)** | 175 GB/month with CDN | $7.00 | $84 |
| **Cloud Scheduler** | 4 scheduled jobs | $0.40 | $5 |
| **Pub/Sub** | Async messaging | $0.00 | $0 |
| **Cloud Logging** | 15 GB/month | $0.00 | $0 |
| **Cloud Monitoring** | Standard metrics + uptime | $0.00 | $0 |
| | | | |
| **GCP Infrastructure Subtotal (TOTP MFA)** | | **$516.80** | **$6,202** |
| **GCP Infrastructure Subtotal (SMS MFA)** | | **$565.40** | **$6,785** |

### Speech-to-Text Options (Choose One)

| Service | Provider | Configuration | Monthly Cost | Annual Cost |
|---------|----------|---------------|--------------|-------------|
| **Option A: GCP Speech-to-Text V2** | GCP | Dynamic Batch + Diarization | **$600.00** | **$7,201** |
| **Option B: GCP Speech-to-Text V2** | GCP | Standard + Diarization | $2,000.00 | $24,005 |
| **Option C: Deepgram Nova-2** | Deepgram | Standard (non-GCP) | $430.00 | $5,160 |

### Grand Total Options

| Configuration | Monthly Cost | Annual Cost | Cost/User/Month |
|--------------|--------------|-------------|-----------------|
| **100% GCP (TOTP + Dynamic Batch STT)** ✅ | **$1,116.80** | **$13,403** | **$1.12** |
| **100% GCP (TOTP + Standard STT)** | **$1,516.80** | **$18,207** | **$1.52** |
| **100% GCP (SMS + Dynamic Batch STT)** | **$1,165.40** | **$13,986** | **$1.17** |
| **Hybrid (GCP + Deepgram, TOTP)** | **$946.80** | **$11,362** | **$0.95** |
| **Hybrid (GCP + Deepgram, SMS)** | **$995.40** | **$11,945** | **$1.00** |
| **GCP Only (No STT, TOTP)** | **$516.80** | **$6,202** | **$0.52** |

### Recommended Configuration

**For 1k Users - All-GCP Stack:**

```
✅ Cloud SQL PostgreSQL (db-custom-2-8192)         $140/month
✅ Cloud Storage (5TB with lifecycle)              $35/month
✅ Cloud Run (1-10 instances)                      $218/month
✅ Identity Platform (TOTP MFA)                    $0/month
✅ Vertex AI Gemini 2.5 Flash                      $8/month
✅ Vertex AI Imagen 4 (mixed)                      $108/month
✅ GCP Speech-to-Text V2 (Dynamic Batch)           $600/month
✅ Networking + CDN                                $7/month
✅ Other GCP services                              $1/month
────────────────────────────────────────────────────────────
TOTAL:                                             $1,117/month
                                                   $13,403/year
Per User:                                          $1.12/month
```

**Key Benefits of 100% GCP:**
- ✅ Single billing platform
- ✅ Unified IAM and security
- ✅ One BAA covers all services
- ✅ Better integration between services
- ✅ Simplified vendor management
- ✅ Volume discounts at scale

**Alternative - Hybrid Approach (Cost-Optimized):**

```
✅ GCP Infrastructure (as above)                   $517/month
✅ Deepgram Nova-2 (external)                      $430/month
────────────────────────────────────────────────────────────
TOTAL:                                             $947/month
                                                   $11,362/year
Per User:                                          $0.95/month

Savings: $170/month (15% cheaper than all-GCP)
```

---

## 10. Recommended Configuration

### For 1,000 Users

**GCP Services:**
- **Database:** Cloud SQL PostgreSQL (db-custom-2-8192, no HA initially)
- **Storage:** Cloud Storage with lifecycle policies (Standard → Nearline → Coldline)
- **Compute:** Cloud Run (1-10 instances, 2 vCPU, 4GB RAM)
- **Auth:** Identity Platform with TOTP MFA (avoid SMS costs)
- **AI (Text):** Vertex AI Gemini 2.5 Flash (with caching)
- **AI (Image):** Vertex AI Imagen mixed strategy (30% Ultra, 70% Fast)
- **AI (Speech):** GCP Speech-to-Text V2 Dynamic Batch (24h SLA)
- **Networking:** Enable Cloud CDN for static assets

**Configuration Options:**

**Option A: 100% GCP Stack (Recommended for Enterprise)**
- **Total Monthly Cost: $1,117/month** ($13,403/year)
- **Cost Per User: $1.12/month**
- ✅ Single vendor, unified billing
- ✅ One BAA for HIPAA compliance
- ✅ Better integration and security

**Option B: Hybrid (Cost-Optimized)**
- Use Deepgram Nova-2 instead of GCP Speech-to-Text
- **Total Monthly Cost: $947/month** ($11,362/year)
- **Cost Per User: $0.95/month**
- ✅ 15% cost savings ($170/month)
- ❌ Additional vendor management
- ❌ Separate BAA required

### Cost Optimization Checklist

✅ **Immediate (0-30 days):**
- [ ] Enable Cloud Storage lifecycle policies
- [ ] Implement TOTP MFA instead of SMS
- [ ] Set up Cloud Run auto-scaling (min=1, max=10)
- [ ] Configure Cloud CDN for static assets
- [ ] Implement Vertex AI response caching

✅ **Short-term (30-90 days):**
- [ ] Compress audio files with Opus codec
- [ ] Optimize video encoding settings
- [ ] Implement lazy thumbnail generation
- [ ] Set up Cloud SQL committed use discounts (1-year)
- [ ] Monitor and optimize Vertex AI usage

✅ **Long-term (90+ days):**
- [ ] Evaluate Cloud SQL read replicas (at 5k+ users)
- [ ] Consider Cloud SQL High Availability (at 10k+ users)
- [ ] Implement multi-region setup (at 50k+ users)
- [ ] Explore custom Vertex AI models (at 100k+ users)

**Potential Savings: $50-100/month (5-10% reduction)**

---

## 11. Scaling Projections

### 10,000 Users (10× Growth)

| Service | Configuration Change | Cost |
|---------|---------------------|------|
| Cloud SQL | db-custom-4-16384 (4 vCPU, 16GB RAM) | $320 |
| Storage | ~50 TB (lifecycle optimized) | $400 |
| Cloud Run | 5-50 instances | $800 |
| Identity | 8,000 MAU (TOTP MFA) | $0 |
| Vertex AI Gemini | 10× token volume | $84 |
| Vertex AI Imagen | 500k images/year | $900 |
| **GCP Speech-to-Text V2** | **1M min/month (Tier 2: $0.010/min)** | **$10,000** |
| Networking | 1.5 TB/month egress | $150 |
| **100% GCP Total** | | **$12,654/month** |
| **Cost/User (All GCP)** | | **$1.27/month** |
| | | |
| Alternative: Deepgram | 1M min × $0.0043 | $4,300 |
| **Hybrid Total (GCP + Deepgram)** | | **$6,954/month** |
| **Cost/User (Hybrid)** | | **$0.70/month** |

**Key Changes at 10k users:**
- Enable Cloud SQL High Availability (+70% = $320 → $544)
- Add read replicas for analytics queries
- Implement connection pooling (Cloud SQL Proxy)
- GCP Speech-to-Text hits Tier 2 pricing ($0.010/min)
- Consider continuing with Dynamic Batch (75% off) → $2,500/month

**Speech-to-Text Decision Point:**
- At 1M min/month, Deepgram is 57% cheaper than GCP Standard
- GCP Dynamic Batch is 75% cheaper than GCP Standard ($2,500 vs $10,000)
- If 24h SLA acceptable: Use GCP Dynamic Batch
- If cost is priority: Use Deepgram

---

### 100,000 Users (100× Growth)

| Service | Configuration Change | Cost |
|---------|---------------------|------|
| Cloud SQL | db-custom-16-65536 + HA + replicas | $3,500 |
| Storage | ~500 TB (multi-region) | $4,000 |
| Cloud Run | 20-200 instances (multi-region) | $8,000 |
| Identity | 80,000 MAU | $0 |
| Vertex AI Gemini | 100× token volume (custom models) | $500 |
| Vertex AI Imagen | 5M images/year (custom models) | $5,000 |
| **GCP Speech-to-Text V2** | **10M min/month (Custom pricing: ~$0.006)** | **$60,000** |
| Networking | 15 TB/month (multi-CDN) | $1,500 |
| Load Balancing | Global HTTP(S) Load Balancer | $500 |
| **100% GCP Total** | | **$83,000/month** |
| **Cost/User (All GCP)** | | **$0.83/month** |
| | | |
| Alternative: Deepgram | 10M min × $0.0043 | $43,000 |
| **Hybrid Total (GCP + Deepgram)** | | **$66,000/month** |
| **Cost/User (Hybrid)** | | **$0.66/month** |

**Speech-to-Text at Scale:**
- GCP Custom pricing negotiations available at this volume
- Estimated GCP cost: $0.006/min (37% discount from Tier 1)
- Deepgram still 28% cheaper ($43k vs $60k)
- GCP Dynamic Batch: $10,000/month (75% off) - **Best value if SLA works**

**Volume Discount Strategy:**
- Negotiate enterprise pricing with GCP at 10M+ min/month
- Potential to reach $0.004-0.005/min with committed use
- Consider hybrid: Use GCP for US/EU, Deepgram for other regions

**Key Changes at 100k users:**
- Multi-region architecture (us, eu, asia)
- Cloud SQL with read replicas in each region
- Custom Vertex AI models (fine-tuned for StoryCare)
- Enterprise support contract
- Dedicated SRE team

---

## 12. Cost Comparison: GCP vs Current Stack (Vercel/Neon)

### Current Architecture (from CLAUDE.md)

| Service | Provider | Est. Monthly Cost |
|---------|----------|-------------------|
| Hosting | Vercel (Enterprise) | $150-300 |
| Database | Neon (Serverless PostgreSQL) | $50-100 |
| Storage | Google Cloud Storage | $35 |
| Auth | Firebase Authentication | $0-48 |
| AI (Text) | OpenAI GPT | $10-20 |
| AI (Image) | OpenAI DALL-E 3 | $167 |
| AI (Speech) | Deepgram | $430 |
| **Current Total** | | **$842-1,100** |

### All-GCP Architecture (Proposed)

| Service | Provider | Monthly Cost |
|---------|----------|--------------|
| Hosting | Cloud Run | $218 |
| Database | Cloud SQL PostgreSQL | $140 |
| Storage | Cloud Storage | $35 |
| Auth | Identity Platform | $0 |
| AI (Text) | Vertex AI Gemini | $8 |
| AI (Image) | Vertex AI Imagen | $108 |
| AI (Speech) | Deepgram (keep) | $430 |
| **All-GCP Total** | | **$939** |

### Analysis

**Pros of All-GCP:**
- ✅ Single billing platform (simplified accounting)
- ✅ Better integration between services
- ✅ Unified IAM and security policies
- ✅ Lower text generation costs (Gemini vs GPT-4)
- ✅ No cold starts (Cloud Run min instances)
- ✅ Better HIPAA compliance tooling

**Cons of All-GCP:**
- ❌ Higher compute costs ($218 vs $150-300 Vercel)
- ❌ More operational overhead (no managed platform like Vercel)
- ❌ Requires DevOps expertise
- ❌ Image generation costs similar (Imagen vs DALL-E 3)

**Recommendation:**
- **Hybrid approach:** Keep Vercel for hosting, use GCP for data/AI
- **Full GCP migration:** Consider at 10k+ users for better economies of scale

---

## 13. Risk Factors & Mitigation

### Cost Volatility Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Transcription volume higher than estimated** | +$200/month | High | Implement usage quotas per therapist |
| **Image generation abuse** | +$500/month | Medium | Rate limiting (already implemented) |
| **Database growth faster than predicted** | +$50/month | Medium | Implement data archival policies |
| **Unexpected egress costs** | +$100/month | Low | Monitor CDN hit rates closely |
| **AI model price increases** | +10-20% | Low | Lock in committed use discounts |

### Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Cloud SQL connection limits** | Performance degradation | Implement connection pooling |
| **Cloud Run cold starts** | Slow response times | Use min instances = 1 |
| **Storage I/O bottlenecks** | Slow media delivery | Enable Cloud CDN |
| **Vertex AI rate limits** | Failed requests | Implement exponential backoff |

---

## 14. HIPAA Compliance Considerations

### Required GCP Services

✅ **HIPAA-Eligible Services:**
- Cloud SQL (with BAA)
- Cloud Storage (with BAA)
- Cloud Run (with BAA)
- Vertex AI (with BAA)
- Cloud Logging (audit logs)
- Cloud Monitoring
- Identity Platform (with BAA)

### BAA (Business Associate Agreement)

**Required Steps:**
1. ✅ Sign GCP BAA (available for Enterprise customers)
2. ✅ Enable audit logging on all services
3. ✅ Configure 7-year log retention (HIPAA requirement)
4. ✅ Implement data encryption at rest (default in GCP)
5. ✅ Implement data encryption in transit (HTTPS, TLS 1.3)
6. ✅ Set up access controls with IAM

**Additional Costs:**
- Extended log retention: ~$50/month (for 7 years)
- Cloud Key Management Service: ~$1/month (optional)
- VPC Service Controls: ~$0/month (free tier sufficient)

**Total HIPAA Compliance Add-on: $50/month**

---

## 15. Final Recommendations

### Recommended GCP Architecture (1,000 Users)

```
┌─────────────────────────────────────────────────────┐
│                   User Access Layer                  │
│  - Google Identity Platform (TOTP MFA)               │
│  - Cloud CDN (static assets)                         │
└────────────────┬───────────────────────────────────┘
                 │
┌────────────────▼───────────────────────────────────┐
│              Application Layer (Cloud Run)           │
│  - Next.js 16 App Router                            │
│  - 2 vCPU, 4 GB RAM                                 │
│  - Min: 1 instance, Max: 10 instances               │
│  - Auto-scaling based on request load               │
└─────┬──────────────────────────────────────────────┘
      │
      ├──────────────────────────────────────────────────┐
      │                                                   │
┌─────▼──────────────┐  ┌────────────────┐  ┌──────────▼──────────┐
│  Cloud SQL         │  │ Cloud Storage  │  │   Vertex AI         │
│  PostgreSQL        │  │ - Standard     │  │ - Gemini 2.5 Flash  │
│  - 2 vCPU, 8GB RAM │  │ - Nearline     │  │ - Imagen 4 Mixed    │
│  - 50 GB SSD       │  │ - Coldline     │  │                     │
│  - No HA           │  │ - 5 TB total   │  │                     │
└────────────────────┘  └────────────────┘  └─────────────────────┘

┌──────────────────────────────────────────────────────┐
│           Background Processing Layer                 │
│  - Cloud Run Jobs (transcription, video assembly)    │
│  - Cloud Scheduler (periodic tasks)                  │
│  - Cloud Pub/Sub (async messaging)                   │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│          Observability Layer (Operations Suite)       │
│  - Cloud Logging (15 GB/month)                       │
│  - Cloud Monitoring (metrics + uptime)               │
│  - Audit logs (HIPAA compliance)                     │
└──────────────────────────────────────────────────────┘
```

### Total Cost Summary

| Cost Category | Monthly | Annual |
|---------------|---------|--------|
| **GCP Infrastructure** | $516.80 | $6,202 |
| **Deepgram (Non-GCP)** | $430.00 | $5,160 |
| **HIPAA Add-ons** | $50.00 | $600 |
| **Buffer (10%)** | $99.68 | $1,196 |
| **Total** | **$1,096.48** | **$13,158** |
| **Per User** | **$1.10/month** | **$13.16/year** |

### Implementation Timeline

**Phase 1: Core Infrastructure (Week 1-2)**
- [ ] Set up GCP project with org policy constraints
- [ ] Sign BAA with Google Cloud
- [ ] Provision Cloud SQL PostgreSQL
- [ ] Set up Cloud Storage buckets with lifecycle policies
- [ ] Deploy Cloud Run application
- [ ] Configure Identity Platform

**Phase 2: AI Integration (Week 3-4)**
- [ ] Enable Vertex AI APIs
- [ ] Integrate Gemini 2.5 Flash for text generation
- [ ] Integrate Imagen 4 for image generation
- [ ] Set up Deepgram for transcription
- [ ] Implement rate limiting and quotas

**Phase 3: Optimization (Week 5-6)**
- [ ] Enable Cloud CDN
- [ ] Implement response caching
- [ ] Configure auto-scaling policies
- [ ] Set up monitoring and alerts
- [ ] Implement cost tracking dashboards

**Phase 4: Compliance (Week 7-8)**
- [ ] Enable audit logging (7-year retention)
- [ ] Configure VPC Service Controls
- [ ] Set up access controls with IAM
- [ ] Implement data encryption policies
- [ ] Complete HIPAA compliance checklist

### Support Contacts

**Google Cloud Support:**
- Enterprise support: 24/7 phone + email
- Technical Account Manager (TAM): Assigned
- Support portal: https://cloud.google.com/support

**Optimization Resources:**
- Google Cloud Pricing Calculator: https://cloud.google.com/products/calculator
- Cost Management tools: https://cloud.google.com/cost-management
- Architecture Center: https://cloud.google.com/architecture

---

## Appendix: Key Assumptions

1. **User Activity:**
   - 90% therapist MAU (720/800)
   - 40% patient MAU (80/200)
   - 25 sessions/therapist/year (20,000 total)
   - 60-minute avg session duration

2. **AI Usage:**
   - 5 images per session (50,000/year)
   - 100 AI chat messages per therapist/year
   - Mixed quality tiers (30% premium, 70% standard)

3. **Storage:**
   - 3-year media retention
   - 7-year audit log retention (HIPAA)
   - 50% egress reduction with CDN

4. **Performance:**
   - 500ms avg API response time
   - 10 req/sec peak traffic
   - 80 concurrent requests per Cloud Run instance

5. **Growth:**
   - Linear user growth (1k → 10k → 100k)
   - No seasonal spikes
   - US-based users (Tier 1 pricing)

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Next Review:** Quarterly (or at 2.5k users)
**Owner:** DevOps / Finance Team
