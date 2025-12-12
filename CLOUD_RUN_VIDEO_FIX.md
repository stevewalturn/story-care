# Cloud Run Video Processor - Job Name Fix

## Issue Fixed
The video assembly API was looking for a hardcoded job name `storycare-video-processor`, but the deployed Cloud Run Jobs have environment-specific names:
- Development: `storycare-video-processor-dev`
- Production: `storycare-video-processor-prod`

This caused the error:
```
Error: 5 NOT_FOUND: Resource 'storycare-video-processor' of kind 'JOB'
in region 'us-central1' in project 'storycare-dev-479511' does not exist.
```

## Changes Made

### 1. Environment Configuration (`src/libs/Env.ts`)
Added new environment variables for Cloud Run Job configuration:

```typescript
// Video Processing (Cloud Run)
CLOUD_RUN_JOB_NAME: z.string().min(1).optional(),
CLOUD_RUN_REGION: z.string().min(1).optional(),
```

### 2. API Route Update (`src/app/api/scenes/[id]/assemble-async/route.ts`)
Updated to use environment-aware job naming:

```typescript
// Determine job name based on environment
const nodeEnv = Env.NODE_ENV || 'development';
const jobName = Env.CLOUD_RUN_JOB_NAME ||
  (nodeEnv === 'production'
    ? 'storycare-video-processor-prod'
    : 'storycare-video-processor-dev');
```

**Logic:**
- First checks for explicit `CLOUD_RUN_JOB_NAME` environment variable
- Falls back to auto-detection based on `NODE_ENV`
- Development → `storycare-video-processor-dev`
- Production → `storycare-video-processor-prod`

### 3. Environment Files Updated

**`.env.example`:**
```bash
# Cloud Run Job Configuration (for video assembly)
CLOUD_RUN_JOB_NAME=storycare-video-processor-dev
CLOUD_RUN_REGION=us-central1
```

**`.env.dev`:**
Added Cloud Run configuration variables.

### 4. UI Improvements (`src/app/(auth)/scenes/ScenesClient.tsx`)
Added visual processing overlay to prevent editing during video assembly:

- **Processing Overlay**: Full-screen semi-transparent overlay with blur effect
- **Status Message**: Shows current processing step from Cloud Run Job
- **Disabled State**: All buttons automatically disabled during processing
- **Visual Feedback**: Large spinner icon and progress information

Features:
- Prevents user from adding/removing clips during processing
- Disables Save, Export, and Preview buttons
- Shows real-time progress updates
- Automatically dismisses when processing completes

### 5. Documentation (`QUICK_DEPLOY_GUIDE.md`)
Added:
- Environment variable documentation
- Troubleshooting section for "Job not found" error
- Instructions for setting `CLOUD_RUN_JOB_NAME`

## Required Environment Variables

Add these to your `.env.dev` and `.env.production` files:

```bash
# Cloud Run Job Configuration
CLOUD_RUN_JOB_NAME=storycare-video-processor-dev  # or -prod
CLOUD_RUN_REGION=us-central1

# Google Cloud Storage (required for job execution)
GCS_PROJECT_ID=storycare-dev-479511  # or storycare-478114 for prod
GCS_CLIENT_EMAIL=your-service-account@...iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GCS_BUCKET_NAME=your-bucket-name

# Node environment (used for auto-detection if CLOUD_RUN_JOB_NAME not set)
NODE_ENV=development  # or production
```

## GitHub Secrets

Ensure your `ENV_FILE_DEV` and `ENV_FILE_PROD` GitHub secrets include the new environment variables above.

## Testing Instructions

### 1. Local Testing (Development)

1. **Update your `.env.dev` file:**
   ```bash
   CLOUD_RUN_JOB_NAME=storycare-video-processor-dev
   CLOUD_RUN_REGION=us-central1
   NODE_ENV=development
   # ... other existing variables
   ```

2. **Restart your dev server:**
   ```bash
   npm run dev
   ```

3. **Test video assembly:**
   - Go to `http://localhost:3000/scenes`
   - Select a patient
   - Add multiple clips to the timeline
   - Click "Export" button
   - Expected behavior:
     - Processing overlay appears with blur effect
     - "Video Processing in Progress" message displayed
     - All editing controls disabled
     - Progress bar shows real-time updates
     - Toast notifications for status changes
     - Overlay automatically dismisses on completion

4. **Verify job execution:**
   ```bash
   gcloud run jobs executions list \
     --job=storycare-video-processor-dev \
     --region=us-central1 \
     --project=storycare-dev-479511 \
     --limit=5
   ```

### 2. Production Testing

1. **Update GitHub Secret `ENV_FILE_PROD`:**
   - Go to GitHub → Settings → Secrets → Actions
   - Edit `ENV_FILE_PROD`
   - Ensure it includes:
     ```
     CLOUD_RUN_JOB_NAME=storycare-video-processor-prod
     CLOUD_RUN_REGION=us-central1
     NODE_ENV=production
     ```

2. **Deploy to production:**
   ```bash
   git checkout production
   git merge main
   git push origin production
   ```

3. **Verify deployment in GitHub Actions**

4. **Test on production URL**

## Verification Checklist

- [ ] `CLOUD_RUN_JOB_NAME` added to `.env.dev`
- [ ] `CLOUD_RUN_JOB_NAME` added to `.env.production`
- [ ] GitHub secret `ENV_FILE_DEV` updated with Cloud Run config
- [ ] GitHub secret `ENV_FILE_PROD` updated with Cloud Run config
- [ ] Dev server restarted after env changes
- [ ] Video assembly test successful in dev
- [ ] Processing overlay displays correctly
- [ ] Editing is disabled during processing
- [ ] Progress updates show in real-time
- [ ] Video completes successfully
- [ ] Cloud Run Job execution logs show success
- [ ] Production deployment successful (when ready)

## Troubleshooting

### Still getting "Resource does not exist" error

1. **Check environment variables are loaded:**
   ```bash
   # In your API route, add console.log
   console.log('Job name:', jobName);
   console.log('NODE_ENV:', Env.NODE_ENV);
   console.log('CLOUD_RUN_JOB_NAME:', Env.CLOUD_RUN_JOB_NAME);
   ```

2. **Verify Cloud Run Job exists:**
   ```bash
   gcloud run jobs describe storycare-video-processor-dev \
     --region us-central1 \
     --project storycare-dev-479511
   ```

3. **Check GitHub Actions logs** for successful deployment

4. **Restart dev server** after changing `.env.dev`

### Processing overlay doesn't appear

- Check browser console for errors
- Verify `isExporting` or `isProcessing` state is being set
- Check `useVideoJobPolling` hook is enabled

### Job executes but fails

- Check Cloud Run Job execution logs:
  ```bash
  gcloud run jobs executions logs read <EXECUTION_NAME> \
    --job=storycare-video-processor-dev \
    --region=us-central1 \
    --project=storycare-dev-479511
  ```

## Success Criteria

✅ API correctly identifies environment and uses appropriate job name
✅ Cloud Run Job executes successfully
✅ Real-time progress updates displayed in UI
✅ Processing overlay prevents editing during assembly
✅ Video assembly completes and displays in player
✅ No "Resource does not exist" errors

## Files Changed

1. `src/libs/Env.ts` - Added CLOUD_RUN_JOB_NAME and CLOUD_RUN_REGION
2. `src/app/api/scenes/[id]/assemble-async/route.ts` - Environment-aware job naming
3. `src/app/(auth)/scenes/ScenesClient.tsx` - Processing overlay and disabled state
4. `.env.example` - Added Cloud Run configuration
5. `.env.dev` - Added Cloud Run configuration
6. `QUICK_DEPLOY_GUIDE.md` - Updated documentation

## Next Steps

1. Add these variables to your local `.env.dev` file
2. Restart dev server
3. Test video assembly
4. Update GitHub secrets with new environment variables
5. Deploy to production when ready
