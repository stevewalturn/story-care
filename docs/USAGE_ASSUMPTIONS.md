# StoryCare Usage Assumptions & Calculations (1,000 Users)

**Analysis Date:** January 2025
**Total Users:** 1,000 (800 therapists + 200 patients)
**Time Period:** Monthly and Annual projections

---

## 👥 User Breakdown

### Total Users: 1,000

| User Type | Count | % of Total | Monthly Active (MAU) | Notes |
|-----------|-------|------------|---------------------|-------|
| **Patients** | 800 | 80% | 320 (40% active) | Primary users, consume content |
| **Therapists** | 200 | 20% | 180 (90% active) | Secondary users, create content |
| **Admins** | 10 | 1% | 10 (100% active) | Platform administrators |
| **Total** | 1,010 | 100% | 510 MAU | Includes 10 admins |

### User Behavior Assumptions

**Therapists (200 total):**
- Work with 4-5 patients each (average 4 patients/therapist)
- 200 therapists × 4 patients = **800 patients total**
- Conduct 20-30 therapy sessions per year (average 25 sessions/year)
- Upload 80-90% of sessions for transcription (average 85%)
- Generate 5-10 images per session (average 7.5 images)
- Create 2-3 story pages per patient per year (average 2.5 pages)
- Engage with AI chat 50-100 times per year (average 75 times)

**Patients (800 total):**
- See therapist 5-8 times per year (average 6.25 sessions/year)
- 800 patients × 6.25 sessions = 5,000 total sessions/year
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
- 200 therapists × 25 sessions/year = 5,000 sessions/year
- 85% uploaded for transcription = 5,000 × 0.85 = **4,250 transcribed sessions/year**
- Rounded up to **5,000 sessions/year** (includes retakes, practice sessions)

**Session Duration:**
- Average therapy session: 45-60 minutes
- **Assumed average: 60 minutes** (conservative estimate)

**Monthly Breakdown:**
- 5,000 sessions/year ÷ 12 months = 417 sessions/month
- 417 sessions × 60 minutes = **25,020 minutes/month**

**Annual Total:**
- 5,000 sessions × 60 minutes = **300,000 minutes/year**

### Audio File Storage

**Per Session:**
- Average file size: 50 MB (MP3, 128 kbps, 60 minutes)
- Total storage per session: 50 MB

**Monthly:**
- 417 sessions × 50 MB = **20.85 GB/month**

**Annual:**
- 5,000 sessions × 50 MB = **250 GB/year**

**3-Year Retention:**
- 250 GB/year × 3 years = **750 GB total**

### Transcription Output

**Text Volume (Database):**
- Average therapy session: 10,000-15,000 words
- Assumed: 12,500 words/session
- Text size: ~50 KB per session (plain text)

**Monthly:**
- 417 sessions × 50 KB = **20.85 MB/month**

**Annual:**
- 5,000 sessions × 50 KB = **250 MB/year**

**7-Year Retention (HIPAA):**
- 250 MB/year × 7 years = **1.75 GB total**

### Speaker Diarization

**Speakers per Session:**
- Typical: Therapist + 1-3 patients
- **Assumed average: 2 speakers/session** (therapist + patient)

**Monthly:**
- 417 sessions × 2 speakers = **834 speaker profiles/month**

**Annual:**
- 5,000 sessions × 2 speakers = **10,000 speaker profiles/year**

### Utterances (Speech Segments)

**Utterances per Session:**
- Average session: 150-250 speaker turns
- **Assumed: 200 utterances/session**

**Monthly:**
- 417 sessions × 200 utterances = **83,400 utterances/month**

**Annual:**
- 5,000 sessions × 200 utterances = **1,000,000 utterances/year**

**Database Storage:**
- Average utterance record: 500 bytes (speaker ID, timestamp, text)
- Annual: 1M × 500 bytes = **500 MB/year**

---

## 🖼️ Image Generation (AI)

### Image Volume Calculations

**Images per Session:**
- Therapists generate visuals from key moments
- **Assumed: 5-10 images/session (average 7.5)**
- Conservative estimate: **2.5 images/session** for cost analysis

**Monthly:**
- 1,667 sessions × 2.5 images = **4,167 images/month**
- Plus patient reference images: ~50/month
- **Total: ~4,200 images/month**

**Annual:**
- 20,000 sessions × 2.5 images = **50,000 images/year**
- Plus patient references: ~600/year
- **Total: ~50,600 images/year**

### Image Sizes

**Generated Images:**
- Resolution: 1024×1024 (standard)
- Format: PNG/JPG
- Average file size: 2 MB/image

**Monthly Storage:**
- 4,200 images × 2 MB = **8.4 GB/month**

**Annual Storage:**
- 50,600 images × 2 MB = **101.2 GB/year**

**3-Year Retention:**
- 101.2 GB × 3 years = **303.6 GB (~300 GB)**

### Image Generation Mix (Cost Optimization)

**Quality Tiers:**
- 30% High Quality (Imagen 4 Ultra): 1,250 images/month @ $0.04 = $50
- 70% Standard Quality (Imagen 4 Fast): 2,917 images/month @ $0.02 = $58.34
- **Total: $108.34/month**

**Use Cases by Quality:**
- **Imagen 4 Ultra (30%):** Key therapeutic moments, patient portraits
- **Imagen 4 Fast (70%):** Scene backgrounds, metaphorical imagery

---

## 🎬 Video Generation & Scene Assembly

### Video Clips (Short Generated Videos)

**Generated Videos per Session:**
- Optional feature, not used by all therapists
- **Assumed: 0.25 videos/session** (1 in 4 sessions)

**Monthly:**
- 1,667 sessions × 0.25 = **417 short videos/month**

**Annual:**
- 20,000 sessions × 0.25 = **5,000 short videos/year**

**Video Specifications:**
- Duration: 10-30 seconds (average 20 seconds)
- Resolution: 720p
- File size: 20 MB/video

**Storage:**
- Monthly: 417 × 20 MB = **8.34 GB/month**
- Annual: 5,000 × 20 MB = **100 GB/year**
- 3-Year: **300 GB**

---

### Assembled Scenes (Long-Form Narrative Videos)

**Scenes per Patient:**
- Therapists assemble clips into narrative scenes
- **Assumed: 0.5 scenes/session** (1 scene per 2 sessions)

**Monthly:**
- 1,667 sessions × 0.5 = **834 scenes/month**

**Annual:**
- 20,000 sessions × 0.5 = **10,000 scenes/year**

**Scene Specifications:**
- Duration: 3-5 minutes (average 4 minutes)
- Resolution: 1080p
- File size: 50 MB/scene (H.264 compression)

**Storage:**
- Monthly: 834 × 50 MB = **41.7 GB/month**
- Annual: 10,000 × 50 MB = **500 GB/year**
- 3-Year: **1.5 TB**

---

## 💬 AI Text Generation (Gemini)

### AI Chat Messages

**Chat Sessions per Therapist:**
- Therapists use AI assistant to analyze transcripts
- **Assumed: 75-100 chats/year/therapist** (average 87.5)

**Monthly:**
- 800 therapists × 87.5 chats/year ÷ 12 = **5,833 chats/month**

**Annual:**
- 800 therapists × 87.5 = **70,000 chats/year**

### Token Usage

**Transcript Analysis:**
- Input: 5,000 tokens/request (transcript excerpt)
- Output: 1,000 tokens/response (analysis)
- Volume: 20,000 sessions/year

**AI Chat:**
- Input: 2,000 tokens/request (question + context)
- Output: 500 tokens/response
- Volume: 70,000 chats/year

**Quote Extraction:**
- Input: 1,000 tokens/request (short excerpt)
- Output: 200 tokens/response
- Volume: 50,000 quotes/year

**Total Tokens (Monthly):**

| Activity | Input Tokens | Output Tokens |
|----------|--------------|---------------|
| Transcript analysis | 8.33M/month | 1.67M/month |
| AI chat | 11.67M/month | 2.92M/month |
| Quote extraction | 4.17M/month | 0.83M/month |
| **Total** | **24.17M/month** | **5.42M/month** |

**Annual:**
- Input: 290M tokens/year
- Output: 65M tokens/year

**Cost (Gemini 2.5 Flash):**
- Input: 24.17M × $0.15/1M = $3.63/month
- Output: 5.42M × $0.60/1M = $3.25/month
- **Total: $6.88/month ≈ $8/month** (with buffer)

---

## 📄 Story Pages (Patient-Facing Content)

### Story Page Creation

**Pages per Patient per Year:**
- **Assumed: 2-3 pages/patient/year** (average 2.5)

**Annual:**
- 200 patients × 2.5 pages = **500 pages/year**
- Therapists may create drafts: +50% = **750 pages/year**

**Monthly:**
- 750 pages/year ÷ 12 = **62.5 pages/month**

### Page Blocks (Content Elements)

**Blocks per Page:**
- Text, images, videos, reflection questions
- **Assumed: 8-12 blocks/page** (average 10)

**Annual:**
- 750 pages × 10 blocks = **7,500 blocks/year**

**Monthly:**
- 62.5 pages × 10 blocks = **625 blocks/month**

### Page Views (Patient Engagement)

**Views per Active Patient:**
- 80 active patients × 10 views/year = 800 views/year

**Monthly:**
- 800 views/year ÷ 12 = **67 page views/month**

**HTML/CSS/JS Transfer per View:**
- Page size: ~300 KB (HTML, CSS, JS, small images)
- Monthly: 67 × 300 KB = **20 MB/month**

---

## 📊 Database Storage Breakdown

### Database Size (Cloud SQL PostgreSQL)

**Year 1 Estimates:**

| Table Group | Est. Rows | Avg Row Size | Total Storage |
|-------------|-----------|--------------|---------------|
| **Users & Organizations** | | | |
| users | 1,000 | 2 KB | 2 MB |
| organizations | 50 | 1 KB | 50 KB |
| groups | 100 | 500 bytes | 50 KB |
| **Sessions & Transcripts** | | | |
| sessions | 20,000 | 1 KB | 20 MB |
| transcripts | 20,000 | 50 KB | 1 GB |
| utterances | 4,000,000 | 500 bytes | 2 GB |
| speakers | 40,000 | 500 bytes | 20 MB |
| **AI & Analysis** | | | |
| ai_chat_conversations | 10,000 | 1 KB | 10 MB |
| ai_chat_messages | 70,000 | 2 KB | 140 MB |
| quotes | 50,000 | 1 KB | 50 MB |
| notes | 30,000 | 2 KB | 60 MB |
| **Media Library** | | | |
| media_library | 60,000 | 2 KB | 120 MB |
| scenes | 10,000 | 1 KB | 10 MB |
| scene_clips | 40,000 | 1 KB | 40 MB |
| **Story Pages** | | | |
| story_pages | 750 | 1 KB | 750 KB |
| page_blocks | 7,500 | 2 KB | 15 MB |
| **Engagement** | | | |
| reflection_questions | 3,000 | 1 KB | 3 MB |
| survey_questions | 500 | 1 KB | 500 KB |
| reflection_responses | 5,000 | 2 KB | 10 MB |
| survey_responses | 1,500 | 2 KB | 3 MB |
| patient_page_interactions | 10,000 | 500 bytes | 5 MB |
| **Audit & Compliance** | | | |
| audit_logs | 500,000 | 1 KB | 500 MB |
| platform_settings | 100 | 1 KB | 100 KB |
| | | | |
| **Total (Year 1)** | | | **~4 GB** |
| **7-Year Retention** | | | **~28 GB** |

---

## 📡 API Request Volume

### Total API Requests

**Estimated Monthly Requests:**

| Endpoint Category | Requests/Month | % of Total |
|-------------------|----------------|------------|
| **Authentication** | 50,000 | 10% |
| Login/logout | 30,000 | |
| Session refresh | 20,000 | |
| **Sessions Management** | 100,000 | 20% |
| Upload sessions | 1,667 | |
| List sessions | 50,000 | |
| Get session details | 40,000 | |
| Update metadata | 8,333 | |
| **Transcription** | 50,000 | 10% |
| Initiate transcription | 1,667 | |
| Check status | 40,000 | |
| Get transcript | 8,333 | |
| **AI Services** | 80,000 | 16% |
| AI chat | 5,833 | |
| Generate image | 4,200 | |
| Analyze transcript | 1,667 | |
| Extract quotes | 68,300 | |
| **Media Library** | 100,000 | 20% |
| List media | 60,000 | |
| Get media details | 30,000 | |
| Upload media | 10,000 | |
| **Story Pages** | 50,000 | 10% |
| List pages | 20,000 | |
| Get page | 25,000 | |
| Create/update page | 5,000 | |
| **Patient Engagement** | 30,000 | 6% |
| View story page | 15,000 | |
| Submit reflection | 10,000 | |
| Submit survey | 5,000 | |
| **Dashboard & Analytics** | 40,000 | 8% |
| Get dashboard stats | 20,000 | |
| Get patient engagement | 15,000 | |
| Get recent responses | 5,000 | |
| | | |
| **Total** | **500,000/month** | **100%** |
| **Daily** | **16,667/day** | |
| **Peak (business hours)** | **~10 req/sec** | |

**Annual:**
- 500,000 × 12 = **6,000,000 requests/year**

---

## 🌐 Network Usage (Data Transfer)

### Egress (Outbound) Traffic

**Monthly Breakdown:**

| Traffic Type | Volume/Month | Use Case |
|--------------|--------------|----------|
| **Patient Story Pages** | 20 GB | HTML/CSS/JS for story pages |
| HTML/CSS/JS | 5 GB | Page structure, 67 views × 300 KB × 12 mo |
| Embedded images | 15 GB | Images displayed in pages |
| **Image Downloads** | 80 GB | Therapists downloading generated images |
| Therapist downloads | 70 GB | Reviewing and sharing images |
| Patient viewing | 10 GB | Patients viewing in story pages |
| **Video Streaming** | 50 GB | Patients watching assembled scenes |
| Scene streaming | 45 GB | 80 patients × 10 views × 5 MB avg |
| Clip previews | 5 GB | Therapist reviewing clips |
| **API Responses** | 15 GB | JSON responses from API |
| Session metadata | 8 GB | List sessions, details |
| Transcript data | 5 GB | Downloading transcripts |
| Other API responses | 2 GB | Dashboard, analytics |
| **Audio Downloads** | 10 GB | Therapist reviewing original audio |
| Session playback | 8 GB | Reviewing sessions |
| Snippet exports | 2 GB | Sharing excerpts |
| | | |
| **Total Egress** | **175 GB/month** | |

**Annual:**
- 175 GB × 12 = **2,100 GB (2.1 TB)/year**

### Ingress (Inbound) Traffic

**Monthly Breakdown:**

| Traffic Type | Volume/Month |
|--------------|--------------|
| **Session Audio Uploads** | 83 GB |
| Audio files | 83 GB (1,667 × 50 MB) |
| **Image Uploads** | 2 GB |
| Patient reference images | 2 GB (100 × 20 MB) |
| **Video Uploads** | 5 GB |
| User-uploaded clips | 5 GB |
| **API Requests** | 5 GB |
| JSON payloads | 5 GB |
| | |
| **Total Ingress** | **95 GB/month** |

**Note:** Ingress to GCP is **FREE**

---

## 📦 Cloud Storage Breakdown

### Total Storage Requirements (3-Year Retention)

| File Type | Monthly Upload | Annual Upload | 3-Year Total | Avg File Size |
|-----------|----------------|---------------|--------------|---------------|
| **Session Audio (MP3)** | 83.35 GB | 1 TB | 3 TB | 50 MB |
| **Generated Images** | 8.4 GB | 100 GB | 300 GB | 2 MB |
| **Generated Videos** | 8.34 GB | 100 GB | 300 GB | 20 MB |
| **Assembled Scenes** | 41.7 GB | 500 GB | 1.5 TB | 50 MB |
| **Patient References** | 2 GB | 24 GB | 72 GB | 2 MB |
| **Thumbnails** | 1 GB | 12 GB | 36 GB | 200 KB |
| | | | | |
| **Total** | **144.79 GB/mo** | **1.74 TB/year** | **5.2 TB** | |

### Storage Class Distribution (3-Year Total: 5.2 TB)

| Storage Class | Retention Period | Volume | % of Total |
|---------------|------------------|--------|------------|
| **Standard** | 0-90 days | 500 GB | 10% |
| Hot data, recent uploads | | | |
| **Nearline** | 90-365 days | 1,000 GB | 19% |
| Warm data, last year | | | |
| **Coldline** | 365+ days | 3,700 GB | 71% |
| Cold data, archived | | | |

**Cost:**
- Standard: 500 GB × $0.020 = $10/month
- Nearline: 1,000 GB × $0.010 = $10/month
- Coldline: 3,700 GB × $0.004 = $14.80/month
- **Total: $34.80/month ≈ $35/month**

---

## 🔐 Authentication & MFA

### Monthly Active Users (MAU)

| User Type | Total | Active (MAU) | MFA Required | MFA Type |
|-----------|-------|--------------|--------------|----------|
| Therapists | 800 | 720 (90%) | Yes | TOTP/SMS |
| Patients | 200 | 80 (40%) | No | Optional |
| Admins | 10 | 10 (100%) | Yes | TOTP/SMS |
| **Total** | **1,010** | **810** | **730** | |

### Authentication Events (Monthly)

| Event Type | Count/Month | Notes |
|------------|-------------|-------|
| **Login** | 30,000 | ~35 logins/user/month |
| Password/SSO | 25,000 | |
| MFA challenges | 15,000 | 50% of logins require MFA |
| **Session Refresh** | 20,000 | Auto-refresh tokens |
| **Logout** | 28,000 | Explicit + timeout |
| **Password Reset** | 200 | ~0.2% of users/month |
| **Total** | **78,200** | |

### Identity Platform Cost

**Base Authentication (First 50k MAU):**
- 810 MAU = **$0/month** (free tier)

**MFA Options:**

**Option A: TOTP/Authenticator App**
- Cost: **$0/month** (included in free tier)
- User experience: One-time app setup
- **Recommended**

**Option B: SMS MFA**
- 730 users with MFA × $0.06/user/month = **$43.80/month**
- Plus: SMS delivery fees (~10 SMS/user/month)
- First 10 SMS/day free, then $0.01-0.03/SMS
- Additional: ~$5/month for SMS overage
- **Total SMS Option: $48.80/month**

---

## 📈 Growth Patterns & Seasonality

### Monthly Usage Patterns

**Peak Months (High Volume):**
- September-October: Back to school, new patients
- January-February: New year therapy surge
- **Volume:** +20% above average

**Low Months (Low Volume):**
- July-August: Summer vacations
- December: Holiday season
- **Volume:** -15% below average

**Average Months:**
- March, April, May, June, November
- **Volume:** Baseline

### User Growth Assumptions

| Milestone | Users | Est. Timeline | Notes |
|-----------|-------|---------------|-------|
| Launch | 100 | Month 1 | Early adopters |
| Early Growth | 250 | Month 3 | Initial marketing |
| **Current Analysis** | **1,000** | **Month 12** | **Baseline** |
| Growth Phase | 2,500 | Month 18 | Referral growth |
| Scale Phase | 5,000 | Month 24 | Market expansion |
| Mature Phase | 10,000 | Month 36 | Established platform |

---

## 🎯 Key Assumptions Summary

### Therapist Behavior
- 800 therapists (primary users)
- 90% monthly active rate (720 MAU)
- 25 sessions/year/therapist
- 85% upload rate for transcription
- 60-minute average session duration
- 2.5 images/session
- 0.5 scenes/session
- 75 AI chat interactions/year

### Patient Behavior
- 200 patients (secondary users)
- 40% monthly active rate (80 MAU)
- 10 story page views/year
- 4 reflections/year
- 1.5 surveys/year
- Passive content consumers

### Content Generation
- **Audio:** 20,000 sessions/year × 60 min = 1.2M minutes
- **Images:** 50,000 images/year (2.5/session)
- **Videos:** 5,000 videos/year (0.25/session)
- **Scenes:** 10,000 scenes/year (0.5/session)
- **Story Pages:** 750 pages/year (2.5/patient)

### Storage
- **Database:** 4 GB/year (28 GB with 7-year retention)
- **Files:** 1.74 TB/year (5.2 TB with 3-year retention)
- **Total:** ~5.2 TB after 3 years

### Network
- **Egress:** 175 GB/month (2.1 TB/year)
- **Ingress:** 95 GB/month (FREE on GCP)

### API Traffic
- **Requests:** 500,000/month (6M/year)
- **Peak:** 10 requests/second (business hours)
- **Average:** 0.2 requests/second (24/7)

---

## 🔬 Validation & Calibration

### How to Validate These Assumptions

**Month 1-3 (Launch Phase):**
- Track actual vs estimated usage
- Adjust multipliers based on real data
- Monitor therapist adoption rates

**Key Metrics to Monitor:**
1. Sessions uploaded per therapist per month
2. Average session duration
3. Images generated per session
4. AI chat usage frequency
5. Storage growth rate
6. API request patterns

### Expected Variance Ranges

| Metric | Conservative | Expected | Optimistic | Actual (TBD) |
|--------|--------------|----------|------------|--------------|
| Sessions/therapist/year | 15 | 25 | 35 | ___ |
| Images/session | 1 | 2.5 | 5 | ___ |
| Session duration | 45 min | 60 min | 75 min | ___ |
| Therapist MAU% | 70% | 90% | 95% | ___ |
| Patient MAU% | 30% | 40% | 60% | ___ |

---

## 📊 Cost Sensitivity Analysis

### Impact of 20% Volume Increase

| Resource | Baseline | +20% Volume | Cost Impact |
|----------|----------|-------------|-------------|
| Transcription | $430/mo | $516/mo | +$86/mo |
| Image Generation | $108/mo | $130/mo | +$22/mo |
| Cloud Storage | $35/mo | $40/mo | +$5/mo |
| Cloud Run | $218/mo | $240/mo | +$22/mo |
| **Total Impact** | | | **+$135/mo** |

### Impact of 20% Volume Decrease

| Resource | Baseline | -20% Volume | Cost Impact |
|----------|----------|-------------|-------------|
| Transcription | $430/mo | $344/mo | -$86/mo |
| Image Generation | $108/mo | $86/mo | -$22/mo |
| Cloud Storage | $35/mo | $30/mo | -$5/mo |
| Cloud Run | $218/mo | $200/mo | -$18/mo |
| **Total Impact** | | | **-$131/mo** |

---

## ✅ Confidence Levels

| Assumption Category | Confidence Level | Notes |
|---------------------|------------------|-------|
| **User Counts** | 🟢 High (90%) | Based on therapist/patient ratio literature |
| **Session Frequency** | 🟢 High (85%) | Industry standard (weekly therapy) |
| **Session Duration** | 🟢 High (90%) | Clinical guidelines (45-60 min) |
| **Upload Rate** | 🟡 Medium (70%) | Depends on adoption & workflow |
| **Images/Session** | 🟡 Medium (65%) | New feature, usage uncertain |
| **AI Chat Frequency** | 🟡 Medium (60%) | Depends on AI accuracy & trust |
| **Patient Engagement** | 🟡 Medium (65%) | Digital health engagement varies |
| **Storage Retention** | 🟢 High (95%) | HIPAA 7-year requirement |

---

## 📝 Revision History

| Version | Date | Changes | Updated By |
|---------|------|---------|------------|
| 1.0 | Jan 2025 | Initial assumptions document | Engineering Team |
| 1.1 | TBD | Update with actual usage data (Month 3) | |
| 1.2 | TBD | Quarterly calibration (Month 6) | |

---

## 🔗 Related Documents

- `FINAL_PRICING.md` - Cost analysis based on these assumptions
- `GCP_COST_ANALYSIS_2025.md` - Detailed technical breakdown
- `GCP_COST_SUMMARY.md` - Quick reference guide

---

**Document Status:** ✅ APPROVED FOR USE
**Next Review:** After Month 3 of production usage
**Owner:** Product + Engineering Team
