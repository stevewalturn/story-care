/**
 * Video Processing Job Executor
 * Cloud Run Job that processes a single video assembly task
 *
 * Environment Variables Required:
 * - JOB_ID: UUID of the video_processing_jobs record
 * - SCENE_ID: UUID of the scene being assembled
 * - INPUT_DATA: JSON string with clips, audio tracks, settings
 * - DATABASE_URL: PostgreSQL connection string
 * - GCS_PROJECT_ID, GCS_CLIENT_EMAIL, GCS_PRIVATE_KEY: For GCS uploads
 * - GCS_BUCKET_NAME: Bucket for storing assembled videos
 */

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// Database imports
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');

// Import schemas (simplified - we'll use direct queries if needed)
// In production, you'd import the full schema from src/models/Schema.ts

console.log('🎬 Video Processing Job Executor Starting...');
console.log(`📋 Job ID: ${process.env.JOB_ID}`);
console.log(`📋 Scene ID: ${process.env.SCENE_ID}`);

// Validate required environment variables
const requiredEnvVars = [
  'JOB_ID',
  'DATABASE_URL',
  'GCS_PROJECT_ID',
  'GCS_CLIENT_EMAIL',
  'GCS_PRIVATE_KEY',
  'GCS_BUCKET_NAME',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Verify FFmpeg is available
try {
  execSync('ffmpeg -version', { stdio: 'pipe' });
  console.log('✅ FFmpeg available');
}
catch {
  console.error('❌ FFmpeg not available');
  process.exit(1);
}

// Initialize database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1, // Cloud Run Job only needs 1 connection
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
});

// Initialize drizzle (not used in this file, but available if needed)
drizzle(pool);

console.log('✅ Database connection initialized');

/**
 * Update job status in database
 */
async function updateJobStatus(status, progress, currentStep, outputUrl = null, thumbnailUrl = null, errorMessage = null) {
  console.log(`📊 Job ${process.env.JOB_ID}: ${status} (${progress}%) - ${currentStep}`);

  try {
    const updateData = {
      status,
      progress,
      currentStep,
      updatedAt: new Date(),
    };

    // Add timing fields
    if (status === 'processing' && progress === 0) {
      updateData.startedAt = new Date();
    }

    if (status === 'completed') {
      updateData.completedAt = new Date();
      updateData.outputUrl = outputUrl;
      updateData.thumbnailUrl = thumbnailUrl;
      updateData.progress = 100;
    }

    if (status === 'failed') {
      updateData.completedAt = new Date();
      updateData.errorMessage = errorMessage;
    }

    // Update using raw SQL for simplicity in Cloud Run Job
    await pool.query(
      `UPDATE video_processing_jobs
       SET status = $1, progress = $2, current_step = $3,
           output_url = $4, thumbnail_url = $5, error_message = $6,
           started_at = COALESCE($7, started_at),
           completed_at = COALESCE($8, completed_at),
           updated_at = $9
       WHERE id = $10`,
      [
        status,
        progress,
        currentStep,
        outputUrl,
        thumbnailUrl,
        errorMessage,
        updateData.startedAt || null,
        updateData.completedAt || null,
        updateData.updatedAt,
        process.env.JOB_ID,
      ],
    );

    console.log(`✅ Database updated: ${status} (${progress}%)`);
  }
  catch (error) {
    console.error('❌ Failed to update database:', error.message);
    // Don't fail the job if DB update fails - log and continue
  }
}

/**
 * Update scene status in database
 */
async function updateSceneStatus(sceneId, status, videoUrl = null, thumbnailUrl = null, errorMessage = null) {
  try {
    await pool.query(
      `UPDATE scenes
       SET status = $1, assembled_video_url = $2, thumbnail_url = $3,
           processing_error = $4, updated_at = $5
       WHERE id = $6`,
      [status, videoUrl, thumbnailUrl, errorMessage, new Date(), sceneId],
    );

    console.log(`✅ Scene ${sceneId} updated: ${status}`);
  }
  catch (error) {
    console.error('❌ Failed to update scene:', error.message);
  }
}

/**
 * Download file from URL to local path
 */
async function downloadFile(url, destPath) {
  const http = require('node:http');
  const https = require('node:https');

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const client = url.startsWith('https') ? https : http;

    client.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

/**
 * Upload file to GCS
 */
async function uploadToGCS(localPath, gcsPath) {
  const { Storage } = require('@google-cloud/storage');

  const storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    credentials: {
      client_email: process.env.GCS_CLIENT_EMAIL,
      private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  });

  const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
  await bucket.upload(localPath, {
    destination: gcsPath,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });

  return `gs://${process.env.GCS_BUCKET_NAME}/${gcsPath}`;
}

/**
 * Generate thumbnail from video using FFmpeg
 */
function generateThumbnail(videoPath, thumbnailPath) {
  execSync(
    `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 -vf scale=640:-1 "${thumbnailPath}"`,
    { stdio: 'pipe' },
  );
}

/**
 * Main execution function
 */
async function executeJob() {
  const jobId = process.env.JOB_ID;
  const sceneId = process.env.SCENE_ID;
  const tempDir = '/tmp/video-assembly';

  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    console.log(`🎬 Starting video assembly for scene ${sceneId}`);

    // Update status: processing
    await updateJobStatus('processing', 0, 'Initializing');
    await updateSceneStatus(sceneId, 'processing');

    // Parse input data from environment
    const inputDataStr = process.env.INPUT_DATA || '{}';
    const inputData = JSON.parse(inputDataStr);

    const { clips, audioTracks } = inputData;

    console.log(`📦 Processing ${clips?.length || 0} clips`);
    console.log(`🎵 Processing ${audioTracks?.length || 0} audio tracks`);

    if (!clips || clips.length === 0) {
      throw new Error('No clips provided for assembly');
    }

    // Step 1: Download clips (10-30%)
    await updateJobStatus('processing', 10, `Downloading ${clips.length} clips from GCS`);

    const downloadedClips = [];
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const ext = clip.type === 'video' ? 'mp4' : 'jpg';
      const localPath = path.join(tempDir, `clip-${i}.${ext}`);

      await downloadFile(clip.mediaUrl, localPath);
      downloadedClips.push({
        ...clip,
        localPath,
      });

      const progress = 10 + Math.floor((i / clips.length) * 20);
      await updateJobStatus('processing', progress, `Downloaded ${i + 1}/${clips.length} clips`);
    }

    await updateJobStatus('processing', 30, 'All clips downloaded');

    // Step 2: Assemble video with FFmpeg (30-80%)
    await updateJobStatus('processing', 40, 'Assembling video clips with FFmpeg');

    const outputPath = path.join(tempDir, `scene-${sceneId}.mp4`);

    // Create concat file for FFmpeg
    const concatFile = path.join(tempDir, 'concat.txt');
    const concatContent = downloadedClips.map((clip) => {
      // Convert images to video clips if needed
      if (clip.type === 'image') {
        const videoPath = clip.localPath.replace('.jpg', '-video.mp4');
        execSync(
          `ffmpeg -loop 1 -i "${clip.localPath}" -t ${clip.duration} -pix_fmt yuv420p -vf scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2 "${videoPath}"`,
          { stdio: 'pipe' },
        );
        return `file '${videoPath}'`;
      }
      return `file '${clip.localPath}'`;
    }).join('\n');

    fs.writeFileSync(concatFile, concatContent);

    await updateJobStatus('processing', 50, 'Concatenating video clips');

    // Concatenate clips
    execSync(
      `ffmpeg -f concat -safe 0 -i "${concatFile}" -c copy "${outputPath}"`,
      { stdio: 'pipe' },
    );

    await updateJobStatus('processing', 70, 'Video clips assembled');

    // Step 3: Add audio if provided (70-85%)
    if (audioTracks && audioTracks.length > 0) {
      await updateJobStatus('processing', 75, 'Merging audio tracks');

      // Download audio files
      for (let i = 0; i < audioTracks.length; i++) {
        const track = audioTracks[i];
        const audioPath = path.join(tempDir, `audio-${i}.mp3`);
        await downloadFile(track.audioUrl, audioPath);
        audioTracks[i].localPath = audioPath;
      }

      // Merge audio with video (simplified - uses first track)
      const audioPath = audioTracks[0].localPath;
      const outputWithAudio = path.join(tempDir, `scene-${sceneId}-with-audio.mp4`);

      execSync(
        `ffmpeg -i "${outputPath}" -i "${audioPath}" -c:v copy -c:a aac -shortest "${outputWithAudio}"`,
        { stdio: 'pipe' },
      );

      fs.renameSync(outputWithAudio, outputPath);
      await updateJobStatus('processing', 85, 'Audio tracks merged');
    }

    // Step 4: Generate thumbnail (85-90%)
    await updateJobStatus('processing', 88, 'Generating thumbnail');

    const thumbnailPath = path.join(tempDir, `thumb-${sceneId}.jpg`);
    generateThumbnail(outputPath, thumbnailPath);

    // Step 5: Upload to GCS (90-100%)
    await updateJobStatus('processing', 92, 'Uploading video to GCS');

    const videoGcsPath = `scenes/${sceneId}/video-${Date.now()}.mp4`;
    const thumbnailGcsPath = `scenes/${sceneId}/thumb-${Date.now()}.jpg`;

    const videoUrl = await uploadToGCS(outputPath, videoGcsPath);
    await updateJobStatus('processing', 96, 'Video uploaded');

    const thumbnailUrl = await uploadToGCS(thumbnailPath, thumbnailGcsPath);
    await updateJobStatus('processing', 99, 'Thumbnail uploaded');

    // Step 6: Update database with results
    await updateJobStatus('completed', 100, 'Video assembly completed', videoUrl, thumbnailUrl);
    await updateSceneStatus(sceneId, 'completed', videoUrl, thumbnailUrl);

    console.log(`✅ Job ${jobId} completed successfully`);
    console.log(`📹 Video: ${videoUrl}`);
    console.log(`🖼️  Thumbnail: ${thumbnailUrl}`);

    // Cleanup temp files
    console.log('🧹 Cleaning up temp files...');
    fs.readdirSync(tempDir).forEach((file) => {
      fs.unlinkSync(path.join(tempDir, file));
    });

    // Close database connection
    await pool.end();

    // Exit successfully
    process.exit(0);
  }
  catch (error) {
    console.error(`❌ Job ${jobId} failed:`, error);

    await updateJobStatus('failed', 0, 'Job failed', null, null, error.message);
    await updateSceneStatus(sceneId, 'failed', null, null, error.message);

    // Close database connection
    await pool.end();

    // Exit with error
    process.exit(1);
  }
}

// Execute the job
executeJob().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
