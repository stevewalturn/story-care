# StoryCare GCP Cost Analysis - Quick Summary

**Date:** January 2025
**User Target:** 1,000 users (800 therapists + 200 patients)

---

## 💰 Bottom Line Costs

### 100% GCP Stack (Recommended)
```
Monthly:  $1,117
Annual:   $13,403
Per User: $1.12/month
```

### Hybrid (GCP + Deepgram)
```
Monthly:  $947
Annual:   $11,362
Per User: $0.95/month
Savings:  $170/month (15% cheaper)
```

---

## 🔍 Cost Breakdown (100% GCP)

| Service | Monthly Cost | % of Total |
|---------|--------------|------------|
| **GCP Speech-to-Text V2** (Dynamic Batch) | $600 | 54% |
| **Cloud Run** (API + Jobs) | $218 | 20% |
| **Cloud SQL PostgreSQL** | $140 | 13% |
| **Vertex AI Imagen** (Image Gen) | $108 | 10% |
| **Cloud Storage** (5TB) | $35 | 3% |
| **Vertex AI Gemini** (Text) | $8 | 1% |
| **Networking + CDN** | $7 | 1% |
| **Other Services** | $1 | <1% |
| **Total** | **$1,117** | **100%** |

---

## 🎯 Key Decision: Speech-to-Text Provider

### Option 1: GCP Speech-to-Text V2 (Dynamic Batch) ✅
- **Cost:** $600/month ($0.006/minute)
- **SLA:** Up to 24 hours processing time
- **Pros:**
  - ✅ Single GCP billing platform
  - ✅ One BAA for HIPAA compliance
  - ✅ Better integration with Cloud Storage
  - ✅ Unified IAM and security
  - ✅ 75% discount from standard pricing
- **Cons:**
  - ❌ 24-hour delay (acceptable for post-session workflow)
  - ❌ 40% more expensive than Deepgram

**Best for:** Enterprise customers prioritizing vendor consolidation

---

### Option 2: Deepgram Nova-2
- **Cost:** $430/month ($0.0043/minute)
- **SLA:** Real-time or near real-time
- **Pros:**
  - ✅ 28% cheaper than GCP Dynamic Batch
  - ✅ 75% cheaper than GCP Standard pricing
  - ✅ Fast processing (<1 min for 60-min audio)
  - ✅ Excellent medical/therapy vocabulary
  - ✅ Speaker diarization included (no extra cost)
- **Cons:**
  - ❌ Separate vendor management
  - ❌ Separate BAA required for HIPAA
  - ❌ Additional integration complexity

**Best for:** Cost-sensitive startups, faster processing needs

---

### Option 3: GCP Speech-to-Text V2 (Standard)
- **Cost:** $1,600/month ($0.016/minute)
- **SLA:** Near real-time
- **Not recommended:** 2.7× more expensive than Dynamic Batch for similar quality

---

## 📊 Scaling Economics

| Users | 100% GCP | Hybrid (GCP+Deepgram) | Cost/User (GCP) |
|-------|----------|----------------------|----------------|
| 1,000 | $1,117/mo | $947/mo | $1.12 |
| 10,000 | $12,654/mo | $6,954/mo | $1.27 |
| 100,000 | $83,000/mo | $66,000/mo | $0.83 |

**Note:** At scale (100k users), economies of scale kick in with custom pricing.

---

## 🔑 Key Cost Drivers

1. **Speech-to-Text Transcription: 54%** of total costs
   - 100,020 minutes/month (20,000 sessions × 60 min)
   - Largest cost component
   - Best optimization target

2. **Cloud Run Compute: 20%** of costs
   - Always-on instance + auto-scaling
   - Includes background job processing

3. **Cloud SQL Database: 13%** of costs
   - 2 vCPU, 8GB RAM
   - Can scale up at 5k+ users

4. **Vertex AI Imagen: 10%** of costs
   - 50,000 images/year
   - Mixed strategy (30% Ultra, 70% Fast)

---

## ✅ Recommended Configuration (1k Users)

### Infrastructure
- **Cloud SQL:** db-custom-2-8192 (2 vCPU, 8GB RAM), 50GB SSD
- **Cloud Storage:** 5TB with lifecycle policies (Standard → Nearline → Coldline)
- **Cloud Run:** 1-10 instances, 2 vCPU, 4GB RAM, auto-scaling

### Authentication
- **Identity Platform:** TOTP MFA (avoid $48/month SMS costs)
- 810 MAU within free tier

### AI Services
- **Text:** Vertex AI Gemini 2.5 Flash ($8/month)
- **Images:** Vertex AI Imagen 4 mixed (30% Ultra, 70% Fast) ($108/month)
- **Speech:** GCP Speech-to-Text V2 Dynamic Batch ($600/month)

### Networking
- **Cloud CDN:** Enabled for static assets
- **Egress:** 175GB/month ($7/month)

---

## 💡 Cost Optimization Tips

### Immediate (0-30 days)
1. ✅ Use **TOTP MFA** instead of SMS → Save $48/month
2. ✅ Enable **Cloud Storage lifecycle policies** → Save $12/month
3. ✅ Use **Dynamic Batch** for transcription → Save $1,400/month vs Standard
4. ✅ Configure **Cloud CDN** → Save $2/month
5. ✅ Implement **AI response caching** → Save $3/month

**Total Quick Wins: $65/month (6% reduction)**

### Short-term (30-90 days)
6. ✅ Compress audio files (Opus codec) → Save $5/month
7. ✅ Optimize video encoding → Save $5/month
8. ✅ Lazy thumbnail generation → Save $2/month
9. ✅ Set up 1-year committed use discounts (Cloud SQL) → Save $30/month

**Total Savings: $47/month (additional 4%)**

### Long-term (90+ days)
10. ✅ At 5k users: Add Cloud SQL read replicas
11. ✅ At 10k users: Enable High Availability
12. ✅ At 50k users: Multi-region setup
13. ✅ At 100k users: Custom Vertex AI models

---

## ⚠️ Risk Factors

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Higher transcription volume | +$200/mo | High | Usage quotas per therapist |
| Image generation abuse | +$500/mo | Medium | Rate limiting (implemented) |
| Storage growth | +$50/mo | Medium | Data archival policies |
| AI model price increases | +10-20% | Low | Committed use discounts |

---

## 🏥 HIPAA Compliance

### Required for 100% GCP Stack
1. ✅ Sign Google Cloud BAA (one agreement covers all services)
2. ✅ Enable audit logging (7-year retention) → +$50/month
3. ✅ Configure data encryption (at rest & in transit) → Included
4. ✅ Implement TOTP MFA for therapists → $0 (free tier)
5. ✅ Set up access controls with IAM → Included

**Total HIPAA Add-on: $50/month**

### Required for Hybrid Stack
1. ✅ Sign Google Cloud BAA
2. ✅ Sign Deepgram BAA (separate agreement)
3. ✅ Same audit logging and security requirements

---

## 🎯 Final Recommendation

### For Startups (Cost-Sensitive)
**Use Hybrid Stack:** GCP + Deepgram
- **Cost:** $947/month
- **Savings:** $170/month (15%)
- Accept additional vendor management overhead

### For Enterprise (Vendor Consolidation)
**Use 100% GCP Stack**
- **Cost:** $1,117/month
- **Benefits:** Single vendor, unified billing, one BAA
- Worth the 18% premium for operational simplicity

### For Both
- Start with **GCP Dynamic Batch** for transcription (24h SLA is acceptable)
- If users demand faster processing, switch to Deepgram
- Re-evaluate at 10k users when volume discounts kick in

---

## 📈 Growth Trigger Points

| Users | Key Action | Reason |
|-------|------------|--------|
| **2,500** | Add Cloud SQL read replica | Separate analytics queries |
| **5,000** | Enable Cloud SQL HA | 99.95% uptime SLA |
| **10,000** | Multi-region setup | Global user distribution |
| **50,000** | Negotiate enterprise pricing | Volume discounts available |
| **100,000** | Custom Vertex AI models | Fine-tuned for StoryCare |

---

## 📞 Next Steps

1. **Review** detailed cost analysis in `GCP_COST_ANALYSIS_2025.md`
2. **Decide** between 100% GCP vs Hybrid approach
3. **Sign** Google Cloud BAA (and Deepgram BAA if needed)
4. **Implement** cost optimization checklist
5. **Set up** Cloud billing alerts and budgets
6. **Monitor** actual usage vs estimates for first 90 days
7. **Adjust** resources based on real-world data

---

**Questions?** See full analysis in `GCP_COST_ANALYSIS_2025.md`

**Document Version:** 1.0
**Last Updated:** January 2025
