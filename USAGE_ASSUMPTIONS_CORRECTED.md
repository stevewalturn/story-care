# StoryCare Usage Assumptions & Calculations (1,000 Users) - CORRECTED

**Analysis Date:** January 2025
**Total Users:** 1,000 (200 therapists + 800 patients)
**Time Period:** Monthly and Annual projections

⚠️ **CORRECTED VERSION:** 200 Therapists + 800 Patients (not 800 therapists + 200 patients)

---

## 👥 User Breakdown

### Total Users: 1,000

| User Type | Count | % of Total | Monthly Active (MAU) | Notes |
|-----------|-------|------------|---------------------|-------|
| **Patients** | 800 | 80% | 320 (40% active) | Primary beneficiaries, consume content |
| **Therapists** | 200 | 20% | 180 (90% active) | Content creators, heavy users |
| **Admins** | 10 | 1% | 10 (100% active) | Platform administrators |
| **Total** | 1,010 | 100% | 510 MAU | |

### User Behavior Assumptions

**Therapists (200 total):**
- Work with 4-5 patients each (average 4 patients/therapist)
- 200 therapists × 4 patients = **800 patients total** ✅
- Conduct 20-30 therapy sessions per year (average 25 sessions/year)
- Upload 80-90% of sessions for transcription (average 85%)
- Generate 5-10 images per session (average 7.5 images)
- Create 2-3 story pages per patient per year (average 2.5 pages)
- Engage with AI chat 50-100 times per year (average 75 times)

**Patients (800 total):**
- See therapist 5-8 times per year (average 6.25 sessions/year)
- 800 patients × 6.25 sessions = 5,000 patient sessions/year
- View story pages 5-15 times per year (average 10 views)
- Submit 3-5 reflections per year (average 4 reflections)
- Complete 1-2 surveys per year (average 1.5 surveys)
- 40% actively engage (320 active patients)

**Admins (10 total):**
- Monitor system daily
- Review reports weekly
- Manage users as needed
- Minimal resource consumption

---

## 🎙️ Audio Transcription (Speech-to-Text)

### Session Volume Calculations

**Annual Sessions:**
- 200 therapists × 25 sessions/year = **5,000 sessions/year**
- 85% uploaded for transcription = 5,000 × 0.85 = 4,250
- Rounded up to **5,000 sessions/year** (includes retakes, practice)

**Session Duration:**
- Average therapy session: 45-60 minutes
- **Assumed average: 60 minutes** (conservative estimate)

**Monthly Breakdown:**
- 5,000 sessions/year ÷ 12 months = **417 sessions/month**
- 417 sessions × 60 minutes = **25,020 minutes/month**

**Annual Total:**
- 5,000 sessions × 60 minutes = **300,000 minutes/year**

### 💰 Transcription Costs (Real-Time)

**Deepgram Nova-2:**
- 25,020 minutes/month × $0.0043 = **$107.59/month**
- 300,000 minutes/year × $0.0043 = **$1,290/year**

**GCP Speech-to-Text V2 Standard:**
- 25,020 minutes/month × $0.016 = **$400.32/month**
- With diarization (+25%): **$500.40/month**
- 300,000 minutes/year × $0.016 = **$4,800/year**

**GCP Dynamic Batch (24h delay):**
- 25,020 minutes/month × $0.004 = **$100.08/month**
- With diarization: **$150.12/month**
- 300,000 minutes/year × $0.004 = **$1,200/year**

---

### Audio File Storage

**Per Session:**
- Average file size: 50 MB (MP3, 128 kbps, 60 minutes)

**Monthly:**
- 417 sessions × 50 MB = **20.85 GB/month**

**Annual:**
- 5,000 sessions × 50 MB = **250 GB/year**

**3-Year Retention:**
- 250 GB × 3 years = **750 GB**

---

### Transcription Output (Database)

**Text Volume:**
- Average session: 12,500 words
- Text size: ~50 KB/session

**Monthly:**
- 417 sessions × 50 KB = **20.85 MB/month**

**Annual:**
- 5,000 sessions × 50 KB = **250 MB/year**

**7-Year Retention (HIPAA):**
- 250 MB × 7 years = **1.75 GB**

---

### Speaker Diarization

**Speakers per Session:**
- Therapist + patient(s)
- **Average: 2 speakers/session**

**Monthly:**
- 417 sessions × 2 = **834 speaker profiles/month**

**Annual:**
- 5,000 sessions × 2 = **10,000 profiles/year**

---

### Utterances (Speech Segments)

**Per Session:**
- **Average: 200 utterances/session**

**Monthly:**
- 417 sessions × 200 = **83,400 utterances/month**

**Annual:**
- 5,000 sessions × 200 = **1,000,000 utterances/year**

**Database Storage:**
- 1M utterances × 500 bytes = **500 MB/year**

---

## 🖼️ Image Generation (AI)

### Image Volume Calculations

**Images per Session:**
- Therapists generate visuals from key moments
- **Conservative estimate: 2.5 images/session**

**Monthly:**
- 417 sessions × 2.5 images = **1,042 images/month**
- Plus patient reference images: ~50/month
- **Total: ~1,100 images/month**

**Annual:**
- 5,000 sessions × 2.5 images = **12,500 images/year**
- Plus patient references: ~600/year
- **Total: ~13,100 images/year**

### 💰 Image Generation Costs

**Imagen 4 Mixed Strategy:**
- 30% Ultra (312 img/mo @ $0.04): $12.48
- 70% Fast (730 img/mo @ $0.02): $14.60
- **Total: $27.08/month ≈ $27/month**

**Annual:**
- 13,100 images × avg $0.026 = **$341/year**

---

### Image Storage

**Generated Images:**
- Resolution: 1024×1024
- Average size: 2 MB/image

**Monthly:**
- 1,100 images × 2 MB = **2.2 GB/month**

**Annual:**
- 13,100 images × 2 MB = **26.2 GB/year**

**3-Year Retention:**
- 26.2 GB × 3 years = **78.6 GB (~79 GB)**

---

## 🎬 Video Generation & Assembly

### Generated Video Clips

**Videos per Session:**
- Optional feature
- **Assumed: 0.25 videos/session** (1 in 4 sessions)

**Monthly:**
- 417 sessions × 0.25 = **104 videos/month**

**Annual:**
- 5,000 sessions × 0.25 = **1,250 videos/year**

**Specifications:**
- Duration: 20 seconds average
- File size: 20 MB/video

**Storage:**
- Monthly: 104 × 20 MB = **2.08 GB/month**
- Annual: 1,250 × 20 MB = **25 GB/year**
- 3-Year: **75 GB**

---

### Assembled Scenes

**Scenes per Session:**
- **Assumed: 0.5 scenes/session** (1 scene per 2 sessions)

**Monthly:**
- 417 sessions × 0.5 = **208 scenes/month**

**Annual:**
- 5,000 sessions × 0.5 = **2,500 scenes/year**

**Specifications:**
- Duration: 4 minutes average
- File size: 50 MB/scene

**Storage:**
- Monthly: 208 × 50 MB = **10.4 GB/month**
- Annual: 2,500 × 50 MB = **125 GB/year**
- 3-Year: **375 GB**

---

## 💬 AI Text Generation (Gemini 2.5 Flash)

### AI Chat Messages

**Chat per Therapist:**
- **Assumed: 75-100 chats/year/therapist** (average 87.5)

**Monthly:**
- 200 therapists × 87.5 ÷ 12 = **1,458 chats/month**

**Annual:**
- 200 therapists × 87.5 = **17,500 chats/year**

---

### Token Usage

**Transcript Analysis:**
- Input: 5,000 tokens/request
- Output: 1,000 tokens/response
- Volume: 5,000 sessions/year

**AI Chat:**
- Input: 2,000 tokens/request
- Output: 500 tokens/response
- Volume: 17,500 chats/year

**Quote Extraction:**
- Input: 1,000 tokens/request
- Output: 200 tokens/response
- Volume: 12,500 quotes/year

**Total Tokens (Monthly):**

| Activity | Input/Month | Output/Month |
|----------|-------------|--------------|
| Transcript analysis | 2.08M | 417K |
| AI chat | 2.92M | 729K |
| Quote extraction | 1.04M | 208K |
| **Total** | **6.04M** | **1.35M** |

**Annual:**
- Input: 72.5M tokens/year
- Output: 16.2M tokens/year

### 💰 AI Text Generation Cost

**Gemini 2.5 Flash Pricing:**
- Input: 6.04M × $0.15/1M = $0.91/month
- Output: 1.35M × $0.60/1M = $0.81/month
- **Total: $1.72/month ≈ $2/month**

**Annual:** $20/year

---

## 📄 Story Pages (Patient-Facing)

### Page Creation

**Pages per Patient:**
- **Average: 2.5 pages/patient/year**

**Annual:**
- 800 patients × 2.5 = **2,000 pages/year**
- With drafts (+20%): **2,400 pages/year**

**Monthly:**
- 2,400 ÷ 12 = **200 pages/month**

---

### Page Blocks

**Blocks per Page:**
- Text, images, videos, questions
- **Average: 10 blocks/page**

**Annual:**
- 2,400 pages × 10 = **24,000 blocks/year**

**Monthly:**
- 200 pages × 10 = **2,000 blocks/month**

---

### Page Views (Patient Engagement)

**Views per Active Patient:**
- 320 active patients × 10 views/year = 3,200 views/year

**Monthly:**
- 3,200 ÷ 12 = **267 page views/month**

**Data Transfer per View:**
- Page size: ~300 KB (HTML, CSS, JS)
- Monthly: 267 × 300 KB = **80 MB/month**

---

## 📊 Database Storage (Cloud SQL PostgreSQL)

### Year 1 Estimates

| Table Group | Est. Rows | Avg Row Size | Storage |
|-------------|-----------|--------------|---------|
| **Users & Orgs** | | | |
| users | 1,000 | 2 KB | 2 MB |
| organizations | 50 | 1 KB | 50 KB |
| groups | 100 | 500 bytes | 50 KB |
| **Sessions** | | | |
| sessions | 5,000 | 1 KB | 5 MB |
| transcripts | 5,000 | 50 KB | 250 MB |
| utterances | 1,000,000 | 500 bytes | 500 MB |
| speakers | 10,000 | 500 bytes | 5 MB |
| **AI & Chat** | | | |
| ai_conversations | 2,500 | 1 KB | 2.5 MB |
| ai_messages | 17,500 | 2 KB | 35 MB |
| quotes | 12,500 | 1 KB | 12.5 MB |
| notes | 7,500 | 2 KB | 15 MB |
| **Media** | | | |
| media_library | 15,000 | 2 KB | 30 MB |
| scenes | 2,500 | 1 KB | 2.5 MB |
| scene_clips | 10,000 | 1 KB | 10 MB |
| **Story Pages** | | | |
| story_pages | 2,400 | 1 KB | 2.4 MB |
| page_blocks | 24,000 | 2 KB | 48 MB |
| **Engagement** | | | |
| reflection_questions | 4,800 | 1 KB | 4.8 MB |
| survey_questions | 800 | 1 KB | 800 KB |
| reflection_responses | 12,800 | 2 KB | 25.6 MB |
| survey_responses | 4,800 | 2 KB | 9.6 MB |
| interactions | 32,000 | 500 bytes | 16 MB |
| **Audit Logs** | | | |
| audit_logs | 125,000 | 1 KB | 125 MB |
| **Total (Year 1)** | | | **~1.1 GB** |
| **7-Year Retention** | | | **~7.7 GB** |

---

## 📡 API Request Volume

### Monthly Request Estimates

| Category | Requests/Month | % of Total |
|----------|----------------|------------|
| **Authentication** | 15,000 | 12% |
| Login/logout | 10,000 | |
| Session refresh | 5,000 | |
| **Sessions** | 25,000 | 20% |
| Upload | 417 | |
| List/get | 20,000 | |
| Update | 4,583 | |
| **Transcription** | 12,500 | 10% |
| Initiate | 417 | |
| Check status | 10,000 | |
| Get transcript | 2,083 | |
| **AI Services** | 20,000 | 16% |
| AI chat | 1,458 | |
| Generate image | 1,100 | |
| Analyze transcript | 417 | |
| Extract quotes | 16,525 | |
| **Media Library** | 25,000 | 20% |
| List/get/upload | 25,000 | |
| **Story Pages** | 15,000 | 12% |
| CRUD operations | 15,000 | |
| **Patient Views** | 8,000 | 6% |
| View pages | 5,000 | |
| Submit responses | 3,000 | |
| **Dashboard** | 10,000 | 8% |
| Analytics queries | 10,000 | |
| **Other** | 7,500 | 6% |
| | | |
| **Total** | **125,000/mo** | **100%** |
| **Daily** | **4,167/day** | |
| **Peak** | **~3 req/sec** | |

**Annual:** 1.5M requests/year

---

## 🌐 Network Usage (Egress)

### Monthly Breakdown

| Traffic Type | Volume/Month |
|--------------|--------------|
| **Patient Story Pages** | 10 GB |
| HTML/CSS/JS | 3 GB |
| Embedded images | 7 GB |
| **Image Downloads** | 20 GB |
| Therapist downloads | 18 GB |
| Patient viewing | 2 GB |
| **Video Streaming** | 15 GB |
| Scene streaming | 13 GB |
| Clip previews | 2 GB |
| **API Responses** | 5 GB |
| JSON responses | 5 GB |
| **Audio Downloads** | 5 GB |
| Session playback | 5 GB |
| **Total Egress** | **55 GB/month** |

**Annual:** 660 GB/year

**Ingress (FREE):**
- Audio uploads: 21 GB/month
- Image uploads: 2 GB/month
- **Total: 23 GB/month (FREE)**

---

## 📦 Cloud Storage Summary (3-Year Retention)

| File Type | Monthly | Annual | 3-Year Total | Avg Size |
|-----------|---------|--------|--------------|----------|
| Session Audio | 21 GB | 250 GB | 750 GB | 50 MB |
| Images | 2.2 GB | 26 GB | 79 GB | 2 MB |
| Videos | 2.1 GB | 25 GB | 75 GB | 20 MB |
| Scenes | 10.4 GB | 125 GB | 375 GB | 50 MB |
| References | 1 GB | 12 GB | 36 GB | 2 MB |
| Thumbnails | 0.5 GB | 6 GB | 18 GB | 200 KB |
| **Total** | **37.2 GB** | **444 GB** | **1.33 TB** | |

### Storage Class Distribution

| Class | Retention | Volume | Cost/GB | Monthly Cost |
|-------|-----------|--------|---------|--------------|
| Standard | 0-90 days | 130 GB | $0.020 | $2.60 |
| Nearline | 90-365 days | 260 GB | $0.010 | $2.60 |
| Coldline | 365+ days | 940 GB | $0.004 | $3.76 |
| **Total** | | **1.33 TB** | | **$8.96 ≈ $9/month** |

---

## 🔐 Authentication (Identity Platform)

### Monthly Active Users

| Type | Total | MAU | MFA Needed |
|------|-------|-----|------------|
| Patients | 800 | 320 | No |
| Therapists | 200 | 180 | Yes |
| Admins | 10 | 10 | Yes |
| **Total** | **1,010** | **510** | **190** |

### Cost

**Base (510 MAU):**
- Free tier (first 50k MAU): **$0/month**

**MFA Options:**
- **TOTP (Recommended):** $0/month
- **SMS:** 190 × $0.06 = $11.40/month

---

## 💰 TOTAL COST SUMMARY (1,000 Users)

### GCP Infrastructure

| Service | Monthly Cost |
|---------|--------------|
| Cloud SQL PostgreSQL | $140 |
| Cloud Storage | $9 |
| Cloud Run (API + Jobs) | $60 |
| Identity Platform (TOTP) | $0 |
| Vertex AI Gemini | $2 |
| Vertex AI Imagen | $27 |
| Networking (Egress) | $2 |
| Other Services | $1 |
| **GCP Subtotal** | **$241/month** |

### Speech-to-Text Options

| Provider | Config | Monthly | Annual |
|----------|--------|---------|--------|
| **Deepgram** ✅ | Real-time | **$108** | **$1,290** |
| GCP Standard | Real-time | $400 | $4,800 |
| GCP Batch | 24h delay | $100 | $1,200 |

---

## 🎯 FINAL TOTAL COSTS

### Hybrid Stack (Recommended)

```
GCP Infrastructure:        $241/month
Deepgram (Real-Time):     $108/month
HIPAA (Audit Logs):        $15/month
─────────────────────────────────────
TOTAL:                    $364/month
                          $4,368/year
Per User:                 $0.36/month
```

### 100% GCP (Real-Time)

```
GCP Infrastructure:        $241/month
GCP STT Standard:         $400/month
HIPAA (Audit Logs):        $15/month
─────────────────────────────────────
TOTAL:                    $656/month
                          $7,872/year
Per User:                 $0.66/month
```

### Cost Difference

**Savings with Deepgram:** $292/month ($3,504/year)

---

## 📊 Key Differences vs Original (800 Therapists)

| Metric | 800 Therapists | 200 Therapists | Change |
|--------|----------------|----------------|--------|
| **Sessions/year** | 20,000 | 5,000 | **-75%** |
| **Transcription minutes** | 1.2M/year | 300k/year | **-75%** |
| **Images/year** | 50,000 | 13,100 | **-74%** |
| **Storage (3-year)** | 5.2 TB | 1.33 TB | **-74%** |
| **API requests** | 500k/mo | 125k/mo | **-75%** |
| **Egress** | 175 GB/mo | 55 GB/mo | **-69%** |
| | | | |
| **Transcription cost** | $430/mo | $108/mo | **-75%** |
| **Total cost** | $947/mo | $364/mo | **-62%** |
| **Per user cost** | $0.95 | $0.36 | **-62%** |

---

## ✅ Validation Checklist

**Assumptions to Monitor (Month 1-3):**
- [ ] Therapist:Patient ratio (assumed 1:4)
- [ ] Sessions per therapist (assumed 25/year)
- [ ] Upload rate (assumed 85%)
- [ ] Images per session (assumed 2.5)
- [ ] AI chat usage (assumed 75/therapist/year)
- [ ] Patient engagement rate (assumed 40%)

**Expected Ranges:**
- Sessions/therapist: 15-35/year
- Upload rate: 70-95%
- Images/session: 1-5
- Patient MAU: 30-60%

---

**Document Version:** 2.0 (CORRECTED)
**Last Updated:** January 2025
**Status:** ✅ READY FOR USE
**Next Review:** After Month 3 actual data
