/**
 * Video Processing Job Executor
 * Cloud Run Job that processes video assembly and frame extraction tasks
 *
 * Environment Variables Required:
 * - JOB_ID: UUID of the video_processing_jobs record
 * - JOB_TYPE: Type of job - 'scene_assembly' (default) or 'extract_frame'
 * - SCENE_ID: UUID of the scene being assembled (for scene_assembly)
 * - INPUT_DATA: JSON string with clips, audio tracks, settings (for scene_assembly)
 * - INPUT_URL: Presigned URL for video (for extract_frame)
 * - MEDIA_ID: UUID of the media record (for extract_frame)
 * - DATABASE_URL: PostgreSQL connection string
 * - GCS_PROJECT_ID, GCS_CLIENT_EMAIL, GCS_PRIVATE_KEY: For GCS uploads
 * - GCS_BUCKET_NAME: Bucket for storing assembled videos
 *
 * Note: Environment variables are provided by Cloud Run, no .env file needed
 */

const { execSync, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// Database imports
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');

// Import schemas (simplified - we'll use direct queries if needed)
// In production, you'd import the full schema from src/models/Schema.ts

console.log('🎬 Video Processing Job Executor Starting...');
console.log(`📋 Job ID: ${process.env.JOB_ID}`);
console.log(`📋 Job Type: ${process.env.JOB_TYPE || 'scene_assembly'}`);
console.log(`📋 Scene ID: ${process.env.SCENE_ID || 'N/A'}`);
console.log(`📋 Media ID: ${process.env.MEDIA_ID || 'N/A'}`);

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
 * Format private key for Google Cloud authentication
 * Handles various escaping scenarios from environment variables
 */
function formatPrivateKey(key) {
  if (!key) return key;

  // Debug: log key format info (safe - doesn't log the actual key)
  console.log('🔑 Private key debug:');
  console.log(`  - Original length: ${key.length}`);
  console.log(`  - Contains literal \\\\n (4 chars): ${key.includes('\\\\n')}`);
  console.log(`  - Starts with BEGIN: ${key.startsWith('-----BEGIN')}`);
  console.log(`  - First 50 chars: ${key.substring(0, 50)}`);
  console.log(`  - Last 30 chars: ${key.substring(key.length - 30)}`);

  let formatted = key;

  // Handle triple-escaped (from some CI/CD systems)
  if (formatted.includes('\\\\\\n')) {
    console.log('  - Detected triple-escaped newlines');
    formatted = formatted.replace(/\\\\\\n/g, '\n');
  }

  // Handle double-escaped (\\n as 4 characters in the string)
  if (formatted.includes('\\\\n')) {
    console.log('  - Detected double-escaped newlines');
    formatted = formatted.replace(/\\\\n/g, '\n');
  }

  // Handle single-escaped (\n as 2 characters: backslash + n)
  // This regex matches literal backslash followed by 'n'
  // Always convert these - a mix of literal \n and actual newlines can occur
  if (/\\n/.test(formatted)) {
    console.log('  - Detected single-escaped newlines, converting...');
    formatted = formatted.replace(/\\n/g, '\n');
  }

  // Handle URL-encoded newlines
  if (formatted.includes('%0A')) {
    console.log('  - Detected URL-encoded newlines');
    formatted = formatted.replace(/%0A/g, '\n');
  }

  // Validate PEM format
  if (!formatted.includes('-----BEGIN')) {
    console.error('❌ Private key missing PEM header!');
  }
  if (!formatted.includes('-----END')) {
    console.error('❌ Private key missing PEM footer!');
  }

  const newlineCount = (formatted.match(/\n/g) || []).length;
  console.log(`  - Final length: ${formatted.length}`);
  console.log(`  - Newline count: ${newlineCount}`);
  console.log(`  - Key format looks valid: ${newlineCount > 20 ? 'YES' : 'NO (should have 25+ newlines)'}`);

  return formatted;
}

/**
 * Upload file to GCS
 */
async function uploadToGCS(localPath, gcsPath) {
  const { Storage } = require('@google-cloud/storage');

  const privateKey = formatPrivateKey(process.env.GCS_PRIVATE_KEY);

  const storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    credentials: {
      client_email: process.env.GCS_CLIENT_EMAIL,
      private_key: privateKey,
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
  execFileSync('ffmpeg', [
    '-i',
    videoPath,
    '-ss',
    '00:00:01',
    '-vframes',
    '1',
    '-vf',
    'scale=640:-1',
    thumbnailPath,
  ], { stdio: 'pipe' });
}

/**
 * Extract last frame from video using FFmpeg
 * Uses -sseof -1 to seek to 1 second before end
 */
function extractLastFrame(videoPath, outputPath) {
  execFileSync('ffmpeg', [
    '-sseof',
    '-1', // Seek to 1 second before end
    '-i',
    videoPath,
    '-vframes',
    '1', // Extract single frame
    '-q:v',
    '2', // High quality JPEG
    '-y', // Overwrite output
    outputPath,
  ], { stdio: 'pipe' });
}

/**
 * Download file from GCS path to local path
 */
async function downloadFromGCS(gcsPath, destPath) {
  const { Storage } = require('@google-cloud/storage');

  const privateKey = formatPrivateKey(process.env.GCS_PRIVATE_KEY);

  const storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    credentials: {
      client_email: process.env.GCS_CLIENT_EMAIL,
      private_key: privateKey,
    },
  });

  const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
  await bucket.file(gcsPath).download({ destination: destPath });

  console.log(`✅ Downloaded ${gcsPath} -> ${destPath}`);
}

/**
 * Update uploaded recording status in database
 */
async function updateRecordingStatus(recordingId, status, finalAudioUrl = null, errorMessage = null) {
  try {
    const updateFields = ['status = $1', 'updated_at = $2'];
    const values = [status, new Date()];
    let paramIndex = 3;

    if (finalAudioUrl) {
      updateFields.push(`final_audio_url = $${paramIndex}`);
      values.push(finalAudioUrl);
      paramIndex++;
    }

    // Store error in device_info field as JSON since there's no error column
    if (errorMessage) {
      updateFields.push(`device_info = jsonb_set(COALESCE(device_info, '{}')::jsonb, '{mergeError}', $${paramIndex}::jsonb)`);
      values.push(JSON.stringify(errorMessage));
      paramIndex++;
    }

    values.push(recordingId);

    await pool.query(
      `UPDATE uploaded_recordings
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}`,
      values,
    );

    console.log(`✅ Recording ${recordingId} updated: ${status}`);
  }
  catch (error) {
    console.error('❌ Failed to update recording:', error.message);
  }
}

/**
 * Execute audio chunk merging job
 * Merges multiple audio chunks into a single M4A/AAC file
 */
async function executeMergeAudioChunksJob() {
  const jobId = process.env.JOB_ID;
  const recordingId = process.env.RECORDING_ID;
  const chunksData = process.env.CHUNKS_DATA ? JSON.parse(process.env.CHUNKS_DATA) : [];
  const tempDir = '/tmp/audio-merge';

  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    console.log(`🎵 Starting audio merge for recording ${recordingId}`);
    console.log(`📦 Processing ${chunksData.length} chunks`);

    // Update status: processing
    await updateJobStatus('processing', 0, 'Initializing audio merge');

    if (!recordingId) {
      throw new Error('No recording ID provided');
    }

    if (!chunksData || chunksData.length === 0) {
      throw new Error('No chunks provided for merging');
    }

    // Sort chunks by index to ensure correct order
    const sortedChunks = [...chunksData].sort((a, b) => a.chunkIndex - b.chunkIndex);

    // Step 1: Download all chunks (0-40%)
    await updateJobStatus('processing', 10, `Downloading ${sortedChunks.length} audio chunks`);

    const downloadedChunks = [];
    for (let i = 0; i < sortedChunks.length; i++) {
      const chunk = sortedChunks[i];
      const ext = chunk.gcsPath.split('.').pop() || 'webm';
      const localPath = path.join(tempDir, `chunk-${i}.${ext}`);

      await downloadFromGCS(chunk.gcsPath, localPath);
      downloadedChunks.push({
        ...chunk,
        localPath,
      });

      const progress = 10 + Math.floor((i / sortedChunks.length) * 30);
      await updateJobStatus('processing', progress, `Downloaded ${i + 1}/${sortedChunks.length} chunks`);
    }

    await updateJobStatus('processing', 40, 'All chunks downloaded');

    // Step 2: Create concat file for FFmpeg (40-50%)
    await updateJobStatus('processing', 45, 'Preparing for merge');

    const concatFile = path.join(tempDir, 'concat.txt');
    const concatContent = downloadedChunks.map(chunk => `file '${chunk.localPath}'`).join('\n');
    fs.writeFileSync(concatFile, concatContent);

    console.log('📝 Concat file contents:');
    console.log(concatContent);

    // Step 3: Merge with FFmpeg (50-80%)
    await updateJobStatus('processing', 50, 'Merging audio chunks with FFmpeg');

    const outputPath = path.join(tempDir, `merged-${recordingId}.m4a`);

    // Use FFmpeg concat demuxer to merge WebM/Opus audio files and transcode to AAC
    // AAC/M4A is more widely compatible across browsers and players
    execFileSync('ffmpeg', [
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatFile,
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-y', // Overwrite output
      outputPath,
    ], { stdio: 'pipe' });

    await updateJobStatus('processing', 80, 'Audio merge completed');

    // Step 4: Upload merged file to GCS (80-95%)
    await updateJobStatus('processing', 85, 'Uploading merged audio to GCS');

    const gcsPath = `recordings/${recordingId}/merged-audio.m4a`;
    const gcsUrl = await uploadToGCS(outputPath, gcsPath);

    await updateJobStatus('processing', 95, 'Merged audio uploaded');

    // Step 5: Update recording in database (95-100%)
    await updateJobStatus('processing', 98, 'Updating recording status');

    // Update the recording with the merged audio URL
    await updateRecordingStatus(recordingId, 'completed', gcsPath);

    // Update job with output info
    await updateJobStatus('completed', 100, 'Audio merge completed', gcsUrl);

    console.log(`✅ Job ${jobId} completed successfully`);
    console.log(`🎵 Merged audio: ${gcsUrl}`);

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

    await updateJobStatus('failed', 0, 'Audio merge failed', null, null, error.message);

    // Update recording status to failed
    if (recordingId) {
      await updateRecordingStatus(recordingId, 'failed', null, error.message);
    }

    // Close database connection
    await pool.end();

    // Exit with error
    process.exit(1);
  }
}

/**
 * Execute frame extraction job
 */
async function executeFrameExtractionJob() {
  const jobId = process.env.JOB_ID;
  const mediaId = process.env.MEDIA_ID;
  const inputUrl = process.env.INPUT_URL;
  const sourceVideoTitle = process.env.SOURCE_VIDEO_TITLE || 'Video';
  const patientId = process.env.PATIENT_ID || null;
  const therapistId = process.env.THERAPIST_ID || null;
  const tags = process.env.TAGS ? JSON.parse(process.env.TAGS) : [];
  const tempDir = '/tmp/frame-extraction';

  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    console.log(`🖼️ Starting frame extraction for media ${mediaId}`);

    // Update status: processing
    await updateJobStatus('processing', 0, 'Initializing frame extraction');

    if (!inputUrl) {
      throw new Error('No input URL provided for frame extraction');
    }

    // Step 1: Download video (0-40%)
    await updateJobStatus('processing', 10, 'Downloading video');

    const videoPath = path.join(tempDir, `video-${mediaId}.mp4`);
    await downloadFile(inputUrl, videoPath);

    await updateJobStatus('processing', 40, 'Video downloaded');

    // Step 2: Extract last frame (40-70%)
    await updateJobStatus('processing', 50, 'Extracting last frame with FFmpeg');

    const framePath = path.join(tempDir, `frame-${mediaId}.jpg`);
    extractLastFrame(videoPath, framePath);

    await updateJobStatus('processing', 70, 'Frame extracted');

    // Step 3: Upload to GCS (70-90%)
    await updateJobStatus('processing', 75, 'Uploading frame to GCS');

    const gcsPath = `media/images/extracted-${mediaId}-${Date.now()}.jpg`;
    const frameUrl = await uploadToGCS(framePath, gcsPath);

    await updateJobStatus('processing', 90, 'Frame uploaded');

    // Step 4: Create media library entry (90-100%)
    await updateJobStatus('processing', 95, 'Creating media record');

    // Build tags array
    const allTags = [...tags, 'extracted-frame'];

    // Build generation metadata
    const generationMetadata = JSON.stringify({
      extractedFrom: mediaId,
      sourceVideoTitle,
      extractedAt: new Date().toISOString(),
      frameType: 'last',
      jobId,
    });

    // Insert new media record
    const insertResult = await pool.query(
      `INSERT INTO media_library (
        title, description, media_type, media_url, thumbnail_url,
        source_type, source_media_id, patient_id, created_by_therapist_id,
        tags, status, generation_metadata, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *`,
      [
        `${sourceVideoTitle} - Last Frame`, // title
        `Extracted from video: ${sourceVideoTitle}`, // description
        'image', // media_type
        gcsPath, // media_url (GCS path)
        gcsPath, // thumbnail_url
        'extracted', // source_type
        mediaId, // source_media_id
        patientId, // patient_id
        therapistId, // created_by_therapist_id
        allTags, // tags
        'completed', // status
        generationMetadata, // generation_metadata
      ],
    );

    const newImage = insertResult.rows[0];
    console.log(`✅ Created media record: ${newImage.id}`);

    // Update job with output info
    await pool.query(
      `UPDATE video_processing_jobs
       SET output_url = $1, thumbnail_url = $2, completed_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [gcsPath, gcsPath, jobId],
    );

    // Update status: completed
    await updateJobStatus('completed', 100, 'Frame extraction completed', gcsPath, gcsPath);

    console.log(`✅ Job ${jobId} completed successfully`);
    console.log(`🖼️ Frame: ${frameUrl}`);
    console.log(`📦 New media ID: ${newImage.id}`);

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

    await updateJobStatus('failed', 0, 'Frame extraction failed', null, null, error.message);

    // Close database connection
    await pool.end();

    // Exit with error
    process.exit(1);
  }
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
        // Use execFileSync to avoid shell interpretation of parentheses
        execFileSync('ffmpeg', [
          '-loop',
          '1',
          '-i',
          clip.localPath,
          '-t',
          String(clip.duration),
          '-pix_fmt',
          'yuv420p',
          '-vf',
          'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
          videoPath,
        ], { stdio: 'pipe' });
        return `file '${videoPath}'`;
      }
      return `file '${clip.localPath}'`;
    }).join('\n');

    fs.writeFileSync(concatFile, concatContent);

    await updateJobStatus('processing', 50, 'Concatenating video clips');

    // Concatenate clips
    execFileSync('ffmpeg', [
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatFile,
      '-c',
      'copy',
      outputPath,
    ], { stdio: 'pipe' });

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

      execFileSync('ffmpeg', [
        '-i',
        outputPath,
        '-i',
        audioPath,
        '-map', '0:v:0',  // Take video from first input (concatenated video)
        '-map', '1:a:0',  // Take audio from second input (selected music)
        '-c:v',
        'copy',
        '-c:a',
        'aac',
        '-shortest',
        outputWithAudio,
      ], { stdio: 'pipe' });

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

// Execute the job based on JOB_TYPE
const jobType = process.env.JOB_TYPE || 'scene_assembly';

if (jobType === 'extract_frame') {
  executeFrameExtractionJob().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
else if (jobType === 'merge_audio_chunks') {
  executeMergeAudioChunksJob().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
else {
  // Default to scene assembly
  executeJob().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
