# SCENES Creation Implementation Plan

**Feature**: Video Scene Editor for Therapists using FFmpeg
**Route**: `http://localhost:3000/scenes`
**Status**: Foundation exists, needs critical fixes and enhancements
**Last Updated**: 2025-11-19

---

## Executive Summary

The Scenes feature allows therapists to create narrative video scenes by assembling media clips (images, videos, audio) from their patient's media library into cohesive therapeutic content. The feature has a **solid foundation** with UI, database schema, API routes, and FFmpeg video processing already implemented. However, critical gaps exist around production-ready storage and advanced timeline functionality.

---

## Current Implementation Status

### ✅ **What's Already Built**

1. **Complete UI Components** (463 lines in ScenesClient.tsx)
   - Patient selection dropdown
   - Scene selection and creation
   - Clip library sidebar with search/filter
   - Timeline visualization
   - Save/Export functionality
   - Preview assembled scenes

2. **Database Schema** (Fully implemented)
   - `scenes` table with all necessary fields
   - `scene_clips` table with sequence ordering
   - Proper foreign key relationships
   - Status tracking (draft, processing, completed, failed)

3. **Full CRUD API Routes**
   - `/api/scenes` - List and create
   - `/api/scenes/[id]` - Get, update, delete
   - `/api/scenes/[id]/clips` - Manage clips
   - `/api/scenes/[id]/assemble` - Video assembly endpoint

4. **VideoService.ts** (239 lines - Complete FFmpeg implementation)
   - Image to video conversion
   - Video trimming
   - Video concatenation
   - Audio overlay
   - Media download
   - Temp file management
   - FFmpeg health checks

5. **FFmpeg Installation**
   - ✅ Located at `/usr/local/bin/ffmpeg`
   - ✅ Ready to use

6. **Media Library Integration**
   - ClipLibrary component fetches from `/api/media`
   - Filter by type (image, video, audio)
   - Search functionality
   - Add clips to timeline

### ❌ **Critical Gaps**

1. **Missing Package Dependency**
   - `@google-cloud/storage` NOT installed
   - GCS.ts will fail at runtime
   - **BLOCKER for production**

2. **Local Storage Only**
   - Assembled videos saved to `public/assembled-scenes/`
   - Not uploaded to Google Cloud Storage
   - No cleanup of old videos
   - Not HIPAA-compliant for production

3. **Synchronous Video Processing**
   - Long videos can cause timeouts
   - No background job queue
   - No progress tracking

4. **Missing Timeline Features**
   - No drag-and-drop clip reordering
   - No clip duration editing
   - No real video preview
   - No transition effects

---

## Implementation Plan

### **Phase 1: Critical Fixes** (MUST DO)

#### 1.1 Install Missing Dependencies
```bash
npm install @google-cloud/storage
npm install @ffmpeg-installer/ffmpeg  # Optional: ensures FFmpeg availability
```

**Files to verify:**
- `package.json` - Add dependencies
- `src/libs/GCS.ts` - Test GCS functionality

#### 1.2 Implement Production Video Storage

**Files to modify:**
- `src/services/VideoService.ts` - Add GCS upload after assembly
- `src/app/api/scenes/[id]/assemble/route.ts` - Update to use GCS URLs

**Changes:**
```typescript
// After assembling video locally, upload to GCS
const assembledPath = path.join(outputDir, filename);
const gcsPath = `scenes/${sceneId}/${filename}`;
await uploadToGCS(assembledPath, gcsPath);

// Update scene record with GCS URL
await db.update(scenesSchema)
  .set({
    assembledVideoUrl: `gs://${GCS_BUCKET_NAME}/${gcsPath}`,
    status: 'completed'
  })
  .where(eq(scenesSchema.id, sceneId));

// Cleanup local files
await fs.rm(outputDir, { recursive: true, force: true });
```

#### 1.3 Fix Database Field Type (Optional but Recommended)

**Migration needed:**
```sql
-- Change durationSeconds from varchar to numeric
ALTER TABLE scenes
  ALTER COLUMN duration_seconds TYPE DECIMAL(10,3)
  USING duration_seconds::decimal(10,3);
```

**Files to update:**
- `src/models/Schema.ts` - Change schema definition
- Generate and run migration

---

### **Phase 2: Essential Features** (SHOULD DO)

#### 2.1 Add Loading States and Progress Tracking

**Files to modify:**
- `src/app/(auth)/scenes/ScenesClient.tsx` - Add loading UI
- `src/app/api/scenes/[id]/assemble/route.ts` - Add progress updates

**Implementation:**
- Show progress spinner during assembly
- Poll assembly status endpoint
- Display processing status (e.g., "Processing clip 2 of 5...")

#### 2.2 Implement Clip Reordering

**Files to modify:**
- `src/components/scenes/SceneTimeline.tsx` - Add drag-and-drop
- `src/app/api/scenes/[id]/clips/route.ts` - Already has bulk update endpoint

**Library to use:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

**Implementation:**
- Wrap timeline clips in `SortableContext`
- Update `sequenceNumber` on drop
- Call PUT `/api/scenes/[id]/clips` to save new order

#### 2.3 Generate Thumbnails for Assembled Videos

**Files to modify:**
- `src/services/VideoService.ts` - Add `generateThumbnail()` method
- `src/app/api/scenes/[id]/assemble/route.ts` - Generate after assembly

**FFmpeg command:**
```typescript
async function generateThumbnail(videoPath: string): Promise<string> {
  const thumbnailPath = videoPath.replace('.mp4', '-thumb.jpg');

  await execAsync(
    `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 "${thumbnailPath}"`
  );

  return thumbnailPath;
}
```

**Upload to GCS:**
```typescript
const thumbnailGcsPath = `scenes/${sceneId}/thumbnail.jpg`;
await uploadToGCS(thumbnailPath, thumbnailGcsPath);

// Update scene record
await db.update(scenesSchema)
  .set({ thumbnailUrl: `gs://${GCS_BUCKET_NAME}/${thumbnailGcsPath}` });
```

#### 2.4 Better Error Handling

**Files to modify:**
- `src/app/(auth)/scenes/ScenesClient.tsx` - Replace alerts with toast
- `src/components/scenes/SceneTimeline.tsx` - Add error states

**Library to use:**
```bash
npm install react-hot-toast
```

**Implementation:**
- Wrap UI in toast provider
- Show success/error toasts instead of alerts
- Display error messages from `processingError` field

---

### **Phase 3: Enhanced Features** (NICE TO HAVE)

#### 3.1 Clip Duration Editing

**Files to modify:**
- `src/components/scenes/SceneTimeline.tsx` - Add duration input
- `src/app/api/scenes/[id]/clips/[clipId]/route.ts` - Add PATCH endpoint

**UI Changes:**
- Show duration input in clip details panel
- Update `startTimeSeconds` and `endTimeSeconds` in database
- Recalculate total scene duration

#### 3.2 Real Video Preview

**Files to modify:**
- `src/app/(auth)/scenes/ScenesClient.tsx` - Add video player
- `src/components/scenes/SceneTimeline.tsx` - Add playback controls

**Library to use:**
```bash
npm install react-player
```

**Implementation:**
- Fetch presigned URL for assembled video
- Embed video player with scrubbing
- Sync playhead with timeline

#### 3.3 Transition Effects

**Files to modify:**
- `src/services/VideoService.ts` - Add FFmpeg filter chains
- `src/models/Schema.ts` - Add `transitionType` to `scene_clips`

**FFmpeg Implementation:**
```typescript
// Crossfade transition
const filter = `[0:v][1:v]xfade=transition=fade:duration=1:offset=${duration1 - 1}[v]`;

await execAsync(
  `ffmpeg -i clip1.mp4 -i clip2.mp4 -filter_complex "${filter}" -map "[v]" output.mp4`
);
```

**Supported transitions:**
- Fade in/out
- Crossfade
- Wipe
- Dissolve

#### 3.4 Background Job Processing

**Implementation approach:**
1. **Option A: Vercel Background Functions** (Simplest for Vercel)
   - Use Vercel's built-in background functions
   - Limited to 5-minute execution (may not be enough)

2. **Option B: External Job Queue** (Recommended for long videos)
   - Use BullMQ with Redis
   - Deploy separate worker service
   - Track job status in database

**Files to create:**
- `src/services/JobQueue.ts` - Queue management
- `src/workers/VideoAssemblyWorker.ts` - Background worker
- `src/app/api/scenes/[id]/assemble/status/route.ts` - Status endpoint

**Libraries:**
```bash
npm install bullmq ioredis
```

#### 3.5 Scene Templates

**Files to create:**
- `src/app/(auth)/scenes/templates/page.tsx` - Template gallery
- `src/app/api/scenes/templates/route.ts` - Template CRUD
- `src/models/Schema.ts` - Add `scene_templates` table

**Features:**
- Save current scene as template
- Browse template library
- Create scene from template
- Share templates between therapists

---

## Technical Specifications

### FFmpeg Configuration

**Current Settings** (from VideoService.ts):
```typescript
{
  resolution: '1920x1080',    // Full HD
  fps: 30,                    // 30 frames per second
  videoCodec: 'libx264',      // H.264 (broad compatibility)
  audioCodec: 'aac',          // AAC audio
  pixelFormat: 'yuv420p',     // Ensures compatibility
  preset: 'medium',           // Balance speed/quality
}
```

### Video Assembly Pipeline

```
1. Fetch scene and clips from database
   ↓
2. Download media files from GCS/URLs to /tmp/video-assembly/
   ↓
3. For each clip:
   - If image: Convert to video (static frame for duration)
   - If video: Trim to specified duration (startTime → endTime)
   ↓
4. Create concat demuxer file list
   ↓
5. Concatenate all clips into single video
   ↓
6. If background audio:
   - Overlay audio track
   - Loop if needed
   ↓
7. Generate thumbnail (frame at 1 second)
   ↓
8. Upload assembled video + thumbnail to GCS
   ↓
9. Update scene record with GCS URLs
   ↓
10. Cleanup temp files
```

### File Storage Structure (GCS)

```
story-care-dev-923d/
├── media/
│   ├── images/
│   │   └── {patientId}/
│   │       └── {mediaId}.jpg
│   ├── videos/
│   │   └── {patientId}/
│   │       └── {mediaId}.mp4
│   └── audio/
│       └── {patientId}/
│           └── {mediaId}.mp3
└── scenes/
    └── {sceneId}/
        ├── scene-{sceneId}-{timestamp}.mp4
        └── thumbnail.jpg
```

### Database Schema Reference

**Scenes Table:**
```sql
CREATE TABLE scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id),
  created_by_therapist_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255),
  description TEXT,
  video_url TEXT,
  assembled_video_url TEXT,
  thumbnail_url TEXT,
  duration_seconds VARCHAR(50),  -- TODO: Change to DECIMAL(10,3)
  background_audio_url TEXT,
  loop_audio BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'draft',  -- draft | processing | completed | failed
  processing_error TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Scene Clips Table:**
```sql
CREATE TABLE scene_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media_library(id),
  sequence_number INTEGER NOT NULL,
  start_time_seconds DECIMAL(10,3) DEFAULT 0,
  end_time_seconds DECIMAL(10,3),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Environment Variables

**Required:**
```bash
# Google Cloud Storage (Already configured)
GCS_PROJECT_ID=steve-prod-cb8d0
GCS_CLIENT_EMAIL=storycare-storage-admin@steve-prod-cb8d0.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GCS_BUCKET_NAME=story-care-dev-923d

# FFmpeg (System binary - no env vars needed)
# Location: /usr/local/bin/ffmpeg
```

**Optional (for background jobs):**
```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
```

---

## Testing Plan

### Unit Tests

**Files to test:**
- `src/services/VideoService.ts`
  - `checkFFmpeg()` - Verify FFmpeg installation
  - `assembleScene()` - Mock FFmpeg, test file paths
  - `downloadMedia()` - Mock fetch, test download
  - `imageToVideo()` - Test FFmpeg command generation
  - `trimVideo()` - Test duration calculations

**Test file:**
```typescript
// tests/unit/VideoService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { checkFFmpeg, assembleScene } from '@/services/VideoService';

describe('VideoService', () => {
  it('should detect FFmpeg installation', async () => {
    const result = await checkFFmpeg();
    expect(result).toBe(true);
  });

  // More tests...
});
```

### Integration Tests

**API routes to test:**
- `POST /api/scenes` - Create scene
- `POST /api/scenes/[id]/clips` - Add clip
- `POST /api/scenes/[id]/assemble` - Assemble video
- `GET /api/scenes/[id]/assemble` - Check status

**Test file:**
```typescript
// tests/integration/scenes.spec.ts
import { test, expect } from '@playwright/test';

test('should create and assemble scene', async ({ request }) => {
  // Create scene
  const scene = await request.post('/api/scenes', {
    data: { title: 'Test Scene', patientId: 'patient-123' }
  });

  const { id } = await scene.json();

  // Add clips
  await request.post(`/api/scenes/${id}/clips`, {
    data: { mediaId: 'media-1', sequenceNumber: 1 }
  });

  // Assemble
  const assembly = await request.post(`/api/scenes/${id}/assemble`);
  expect(assembly.ok()).toBeTruthy();
});
```

### E2E Tests

**User flows to test:**
1. Therapist creates new scene
2. Selects patient
3. Adds clips from library
4. Reorders clips
5. Exports scene
6. Previews assembled video

**Test file:**
```typescript
// tests/e2e/scenes.e2e.ts
import { test, expect } from '@playwright/test';

test('therapist can create and export scene', async ({ page }) => {
  await page.goto('/scenes');

  // Select patient
  await page.click('[data-testid="patient-select"]');
  await page.click('text=John Doe');

  // Create scene
  await page.click('text=New Scene');
  await page.fill('[name="title"]', 'Healing Journey');

  // Add clips
  await page.click('[data-testid="clip-library-item-1"]');
  await page.click('[data-testid="clip-library-item-2"]');

  // Export
  await page.click('text=Export Scene');

  // Wait for assembly
  await expect(page.locator('text=Scene assembled')).toBeVisible({ timeout: 60000 });
});
```

---

## Performance Considerations

### Video Assembly Performance

**Bottlenecks:**
1. **Media download from GCS** - Can be slow for large files
2. **FFmpeg processing** - CPU-intensive, scales with video length
3. **Upload to GCS** - Network bandwidth dependent

**Optimizations:**
1. **Parallel downloads** - Download all media concurrently
2. **FFmpeg presets** - Use faster presets for draft previews
3. **Cache media locally** - Reuse downloaded files for same scene
4. **Compression** - Use CRF (Constant Rate Factor) for smaller files

**Estimated Processing Times:**
- 5 clips (3 images, 2 videos, 30 sec total): ~15-30 seconds
- 10 clips (mixed media, 60 sec total): ~30-60 seconds
- 20 clips (mostly videos, 120 sec total): ~60-120 seconds

**Timeout Concerns:**
- Vercel Edge Functions: 25 second limit (too short)
- Vercel Serverless Functions: 60 second limit (may be tight)
- **Recommendation**: Use background jobs for scenes >30 seconds

---

## Security & HIPAA Compliance

### Data Protection

**PHI Handling:**
- Scene videos contain patient media (PHI)
- Must be encrypted at rest (GCS handles this)
- Must use signed URLs with expiration (1 hour max)
- Audit all scene access

**Access Control:**
- Only therapist who created scene can edit
- Only patient assigned to scene can view
- Admins can view for compliance

**Audit Logging:**
```typescript
// Log scene assembly events
await db.insert(auditLogsSchema).values({
  userId: therapistId,
  action: 'scene_assembled',
  resourceType: 'scene',
  resourceId: sceneId,
  metadata: { patientId, clipCount, duration },
  timestamp: new Date()
});
```

### GCS Security

**Bucket Configuration:**
- Private bucket (no public access)
- Signed URLs only (1-hour expiration)
- Encryption at rest enabled
- Audit logging enabled

**Service Account Permissions:**
- `storage.objects.create` - Upload files
- `storage.objects.get` - Download files
- `storage.objects.delete` - Cleanup old files
- `storage.objects.list` - List scene files

---

## Migration Path

### From Current State to Production

**Step 1: Install Dependencies**
```bash
npm install @google-cloud/storage @dnd-kit/core @dnd-kit/sortable react-hot-toast
```

**Step 2: Update VideoService.ts**
- Add GCS upload after assembly
- Add thumbnail generation
- Add cleanup of temp files

**Step 3: Update API Routes**
- Modify `/api/scenes/[id]/assemble/route.ts` to use GCS
- Add status polling endpoint
- Add error handling

**Step 4: Update UI**
- Add loading states
- Add toast notifications
- Add drag-and-drop reordering

**Step 5: Test Thoroughly**
- Run unit tests
- Run integration tests
- Test with real media files
- Verify GCS uploads

**Step 6: Deploy to Production**
- Set environment variables in Vercel
- Verify GCS bucket exists
- Monitor first assemblies
- Check error logs

---

## Risk Assessment

### High Risk
- **FFmpeg not available in Vercel** - Mitigation: Use @ffmpeg-installer/ffmpeg or custom layer
- **Video assembly timeout** - Mitigation: Implement background jobs
- **GCS package missing** - Mitigation: Install immediately

### Medium Risk
- **Large file uploads** - Mitigation: Implement chunked uploads
- **Concurrent assemblies** - Mitigation: Queue system with rate limiting
- **Storage costs** - Mitigation: Cleanup old assembled videos, compress files

### Low Risk
- **Browser compatibility** - Mitigation: Use H.264 (universally supported)
- **Mobile preview** - Mitigation: Responsive video player
- **Network issues** - Mitigation: Retry logic for GCS operations

---

## Success Metrics

### Feature Adoption
- Number of scenes created per therapist
- Average clips per scene
- Scene assembly success rate
- Time to complete scene creation

### Technical Performance
- Average assembly time
- Assembly failure rate
- GCS upload success rate
- API response times

### User Experience
- Time from "Export" click to video ready
- Number of errors reported
- Feature usage (reordering, duration editing)
- Patient engagement with scenes

---

## Rollout Plan

### Phase 1: Internal Testing (Week 1)
- Deploy to staging environment
- Test with sample data
- Fix critical bugs
- Performance testing

### Phase 2: Limited Beta (Week 2)
- Enable for 5-10 therapists
- Monitor assembly jobs
- Collect feedback
- Iterate on UX

### Phase 3: General Availability (Week 3)
- Enable for all therapists
- Monitor performance
- Scale infrastructure as needed
- Document known issues

---

## Support & Maintenance

### Monitoring

**Metrics to track:**
- Assembly success/failure rate
- Processing duration
- GCS upload errors
- FFmpeg errors
- API latency

**Alerts to configure:**
- Assembly failure rate >5%
- Average processing time >60s
- GCS errors
- Disk space low on temp directory

### Maintenance Tasks

**Weekly:**
- Review failed assemblies
- Check GCS storage usage
- Monitor FFmpeg logs
- Review performance metrics

**Monthly:**
- Cleanup old assembled videos (>90 days)
- Audit scene access logs
- Review and optimize FFmpeg settings
- Update dependencies

---

## Documentation Needed

1. **User Documentation**
   - How to create a scene
   - How to add and reorder clips
   - How to export and share scenes
   - Troubleshooting guide

2. **Developer Documentation**
   - FFmpeg setup guide ✅ (FFMPEG_SETUP.md exists)
   - GCS configuration
   - API reference
   - Deployment guide

3. **Admin Documentation**
   - Monitoring dashboard
   - Error investigation
   - Performance tuning
   - HIPAA compliance checklist

---

## References

- **Existing Documentation:**
  - `/Users/lpt-799/Code/walturn/story-care/FFMPEG_SETUP.md` - FFmpeg setup guide
  - `/Users/lpt-799/Code/walturn/story-care/PRD.md` - Product requirements (Scene Editor section)
  - `/Users/lpt-799/Code/walturn/story-care/CLAUDE.md` - Project architecture guide

- **External Resources:**
  - [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
  - [Google Cloud Storage Node.js Client](https://cloud.google.com/nodejs/docs/reference/storage/latest)
  - [Vercel Background Functions](https://vercel.com/docs/functions/background-functions)
  - [BullMQ Documentation](https://docs.bullmq.io/)

---

## Conclusion

The Scenes feature has a **strong technical foundation** with comprehensive FFmpeg integration and well-structured code. The primary tasks are:

1. **Install missing @google-cloud/storage package** (CRITICAL)
2. **Implement GCS upload for assembled videos** (CRITICAL)
3. **Add loading states and progress tracking** (HIGH)
4. **Implement clip reordering** (HIGH)
5. **Generate thumbnails** (MEDIUM)
6. **Consider background jobs for long videos** (MEDIUM)

With these improvements, the Scenes feature will be production-ready and provide therapists with a powerful tool for creating therapeutic narrative content.

---

**Next Steps:**
1. Review this plan with stakeholders
2. Prioritize features (Phase 1 vs Phase 2 vs Phase 3)
3. Estimate development time
4. Begin implementation with Phase 1 critical fixes
