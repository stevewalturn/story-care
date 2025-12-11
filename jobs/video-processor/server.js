/**
 * Video Processing Service - Async FFmpeg Scene Assembly
 * Cloud Run service that processes video assembly jobs asynchronously
 */

const http = require('http');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Environment configuration
const PORT = process.env.PORT || 8080;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret';

console.log('🎬 Video Processing Service starting...');
console.log(`📍 Port: ${PORT}`);
console.log(`🔐 Webhook secret: ${WEBHOOK_SECRET ? 'configured' : 'NOT SET'}`);

// Verify FFmpeg is available
async function verifyFFmpeg() {
  try {
    const { stdout } = await execAsync('ffmpeg -version');
    console.log('✅ FFmpeg available:', stdout.split('\n')[0]);
    return true;
  } catch (error) {
    console.error('❌ FFmpeg not available:', error.message);
    return false;
  }
}

// HTTP server to receive job requests
const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health' && req.method === 'GET') {
    const ffmpegAvailable = await verifyFFmpeg();
    res.writeHead(ffmpegAvailable ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: ffmpegAvailable ? 'healthy' : 'unhealthy',
        service: 'video-processor',
        timestamp: new Date().toISOString(),
        ffmpeg: ffmpegAvailable,
      })
    );
    return;
  }

  // Process video job endpoint
  if (req.url === '/process' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);

        // Verify webhook secret
        const authHeader = req.headers.authorization;
        if (!authHeader || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }

        // Validate payload
        if (!payload.jobId || !payload.inputData) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing required fields: jobId, inputData' }));
          return;
        }

        console.log(`🎬 Processing job ${payload.jobId}...`);

        // Respond immediately (async processing)
        res.writeHead(202, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'accepted',
            jobId: payload.jobId,
            message: 'Job processing started',
          })
        );

        // Process video asynchronously (don't await)
        processVideoJob(payload).catch((error) => {
          console.error(`❌ Job ${payload.jobId} failed:`, error);
        });
      } catch (error) {
        console.error('❌ Error parsing request:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // 404 for all other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

/**
 * Process video assembly job
 * This will be replaced with actual VideoService integration
 */
async function processVideoJob(payload) {
  const { jobId, inputData, webhookUrl } = payload;

  try {
    console.log(`📦 Job ${jobId}: Starting video assembly`);

    // Update job status: processing
    await updateJobStatus(jobId, 'processing', 10, 'Initializing FFmpeg', webhookUrl);

    // Simulate processing steps (replace with actual VideoService.assembleScene)
    await updateJobStatus(jobId, 'processing', 25, 'Downloading clips', webhookUrl);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await updateJobStatus(jobId, 'processing', 50, 'Processing video clips', webhookUrl);
    await new Promise((resolve) => setTimeout(resolve, 3000));

    await updateJobStatus(jobId, 'processing', 75, 'Merging audio tracks', webhookUrl);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    await updateJobStatus(jobId, 'processing', 90, 'Finalizing video', webhookUrl);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // TODO: Replace with actual video processing
    // const result = await VideoService.assembleScene(inputData.clips, inputData.audioTracks, {
    //   loopAudio: inputData.loopAudio,
    //   fitAudioToDuration: inputData.fitAudioToDuration,
    // });

    // Simulate successful completion
    const outputUrl = 'https://storage.googleapis.com/your-bucket/scenes/assembled-video.mp4';
    const thumbnailUrl = 'https://storage.googleapis.com/your-bucket/scenes/thumbnail.jpg';

    await updateJobStatus(
      jobId,
      'completed',
      100,
      'Video assembly completed',
      webhookUrl,
      outputUrl,
      thumbnailUrl
    );

    console.log(`✅ Job ${jobId}: Completed successfully`);
  } catch (error) {
    console.error(`❌ Job ${jobId}: Failed with error:`, error);
    await updateJobStatus(jobId, 'failed', 0, error.message, webhookUrl);
  }
}

/**
 * Send job status update to webhook URL
 */
async function updateJobStatus(
  jobId,
  status,
  progress,
  currentStep,
  webhookUrl,
  outputUrl = null,
  thumbnailUrl = null
) {
  if (!webhookUrl) {
    console.log(`📊 Job ${jobId}: ${status} (${progress}%) - ${currentStep}`);
    return;
  }

  const payload = {
    jobId,
    status,
    progress,
    currentStep,
    outputUrl,
    thumbnailUrl,
    timestamp: new Date().toISOString(),
  };

  try {
    const https = require('https');
    const url = new URL(webhookUrl);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WEBHOOK_SECRET}`,
      },
    };

    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ Webhook sent for job ${jobId}: ${status}`);
          resolve();
        } else {
          console.warn(`⚠️ Webhook failed for job ${jobId}: ${res.statusCode}`);
          resolve(); // Don't fail the job if webhook fails
        }
      });

      req.on('error', (error) => {
        console.error(`❌ Webhook error for job ${jobId}:`, error.message);
        resolve(); // Don't fail the job if webhook fails
      });

      req.write(JSON.stringify(payload));
      req.end();
    });
  } catch (error) {
    console.error(`❌ Failed to send webhook for job ${jobId}:`, error.message);
  }
}

// Start server
server.listen(PORT, async () => {
  console.log(`🚀 Video Processing Service running on port ${PORT}`);

  const ffmpegAvailable = await verifyFFmpeg();
  if (!ffmpegAvailable) {
    console.error('❌ FFmpeg not available - service may not function correctly');
  }

  console.log('✨ Ready to process video jobs');
  console.log(`📬 POST /process - Process video assembly job`);
  console.log(`🏥 GET /health - Health check endpoint`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});
