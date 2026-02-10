/**
 * Test script for Langfuse cost tracking
 * Run with: npx tsx scripts/test-langfuse-cost-tracking.ts
 *
 * This script tests all providers to verify costs appear in Langfuse's Total Cost column.
 * Check Langfuse dashboard after running to verify costs are properly tracked.
 */

import 'dotenv/config';

// Test flags - set to true to test specific providers
const TEST_CONFIG = {
  // Image providers
  atlasCloudImage: true,
  falAI: false, // Requires FAL_API_KEY
  stabilityAI: false, // Requires STABILITY_API_KEY
  geminiImage: false, // Requires reference image

  // Video providers
  atlasCloudVideo: false, // Takes longer, costs more

  // Audio providers
  deepgram: false, // Requires publicly accessible audio URL
  sunoAI: false, // Requires SUNO_API_KEY
};

async function testAtlasCloudImage() {
  console.log('\n=== Testing AtlasCloud Image Generation ===');
  const { generateImageWithAtlas } = await import('../src/libs/providers/AtlasCloud');

  try {
    const result = await generateImageWithAtlas({
      prompt: 'A serene mountain landscape at sunset with golden light',
      model: 'flux-schnell', // Fast and cheap model for testing
      size: '1024*1024',
      numImages: 1,
      traceMetadata: {
        userId: 'test-user',
        sessionId: 'test-session',
        tags: ['test', 'cost-tracking-validation'],
      },
    });

    console.log('✅ AtlasCloud Image Success:', {
      model: result.model,
      imageUrl: `${result.imageUrl.substring(0, 50)}...`,
    });
    return true;
  } catch (error) {
    console.error('❌ AtlasCloud Image Error:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function testAtlasCloudVideo() {
  console.log('\n=== Testing AtlasCloud Video Generation ===');
  const { generateVideoWithAtlas } = await import('../src/libs/providers/AtlasCloud');

  try {
    // First generate an image to use as reference
    const { generateImageWithAtlas } = await import('../src/libs/providers/AtlasCloud');
    const imageResult = await generateImageWithAtlas({
      prompt: 'A calm ocean wave',
      model: 'flux-schnell',
      size: '1024*1024',
    });

    const result = await generateVideoWithAtlas({
      prompt: 'Gentle ocean waves rolling onto a beach',
      referenceImage: imageResult.imageUrl,
      model: 'wan-2.5-fast-i2v', // Budget model for testing
      duration: 3, // Short duration
      traceMetadata: {
        userId: 'test-user',
        sessionId: 'test-session',
        tags: ['test', 'cost-tracking-validation'],
      },
    });

    console.log('✅ AtlasCloud Video Success:', {
      model: result.model,
      videoUrl: `${result.videoUrl.substring(0, 50)}...`,
    });
    return true;
  } catch (error) {
    console.error('❌ AtlasCloud Video Error:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function testFalAI() {
  console.log('\n=== Testing FalAI Image Generation ===');
  const { generateImageWithFal } = await import('../src/libs/providers/FalAI');

  try {
    const result = await generateImageWithFal({
      prompt: 'A cozy cabin in winter woods with snow falling',
      model: 'flux-schnell', // Fast model for testing
      width: 1024,
      height: 1024,
      traceMetadata: {
        userId: 'test-user',
        sessionId: 'test-session',
        tags: ['test', 'cost-tracking-validation'],
      },
    });

    console.log('✅ FalAI Success:', {
      model: result.model,
      imageUrl: `${result.imageUrl.substring(0, 50)}...`,
    });
    return true;
  } catch (error) {
    console.error('❌ FalAI Error:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function testStabilityAI() {
  console.log('\n=== Testing StabilityAI Image Generation ===');
  const { generateImageWithStability } = await import('../src/libs/providers/StabilityAI');

  try {
    const result = await generateImageWithStability({
      prompt: 'A beautiful garden with colorful flowers',
      model: 'sd3.5-medium', // Medium model for testing
      aspectRatio: '1:1',
      traceMetadata: {
        userId: 'test-user',
        sessionId: 'test-session',
        tags: ['test', 'cost-tracking-validation'],
      },
    });

    console.log('✅ StabilityAI Success:', {
      model: result.model,
      imageUrl: '[base64 image]',
    });
    return true;
  } catch (error) {
    console.error('❌ StabilityAI Error:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function testGeminiImage() {
  console.log('\n=== Testing Gemini Image Generation ===');
  const { generateImageWithGemini } = await import('../src/libs/providers/GeminiImage');

  // Gemini requires a reference image - use a placeholder for testing
  const testReferenceImage = 'https://picsum.photos/1024/1024';

  try {
    const result = await generateImageWithGemini({
      prompt: 'Transform this image into a watercolor painting style',
      model: 'gemini-2.5-flash-image',
      referenceImage: testReferenceImage,
      traceMetadata: {
        userId: 'test-user',
        sessionId: 'test-session',
        tags: ['test', 'cost-tracking-validation'],
      },
    });

    console.log('✅ Gemini Image Success:', {
      model: result.model,
      imageUrl: '[base64 image]',
    });
    return true;
  } catch (error) {
    console.error('❌ Gemini Image Error:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function testDeepgram() {
  console.log('\n=== Testing Deepgram Transcription ===');
  const { transcribeAudio } = await import('../src/libs/Deepgram');

  // Use NASA's public audio sample for testing (Apollo 11 "one small step")
  const testAudioUrl = 'https://www.nasa.gov/wp-content/uploads/2015/01/590325main_ringtone_702.mp3';

  try {
    const result = await transcribeAudio(testAudioUrl, {
      model: 'nova-2',
      language: 'en',
      diarize: false,
      traceMetadata: {
        userId: 'test-user',
        sessionId: 'test-session',
        tags: ['test', 'cost-tracking-validation'],
      },
    });

    console.log('✅ Deepgram Success:', {
      textLength: result.text.length,
      duration: result.duration,
      text: `${result.text.substring(0, 100)}...`,
    });
    return true;
  } catch (error) {
    console.error('❌ Deepgram Error:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function testSunoAI() {
  console.log('\n=== Testing SunoAI Music Generation ===');
  const { generateSunoMusic } = await import('../src/libs/SunoAI');

  try {
    const result = await generateSunoMusic(
      {
        prompt: 'Calm meditation music with soft piano and nature sounds',
        customMode: false,
        instrumental: true,
        model: 'V4_5',
        traceMetadata: {
          userId: 'test-user',
          sessionId: 'test-session',
          tags: ['test', 'cost-tracking-validation'],
        },
      },
      false, // Don't use callback for testing
    );

    console.log('✅ SunoAI Success:', {
      taskId: result.data?.taskId,
      message: result.msg,
    });
    return true;
  } catch (error) {
    console.error('❌ SunoAI Error:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Langfuse Cost Tracking Tests');
  console.log('================================================');
  console.log('After running, check Langfuse dashboard for traces.');
  console.log('Verify the "Total Cost" column shows values (not empty).\n');

  const results: Record<string, boolean> = {};

  // Run enabled tests
  if (TEST_CONFIG.atlasCloudImage) {
    results.atlasCloudImage = await testAtlasCloudImage();
  }

  if (TEST_CONFIG.atlasCloudVideo) {
    results.atlasCloudVideo = await testAtlasCloudVideo();
  }

  if (TEST_CONFIG.falAI) {
    results.falAI = await testFalAI();
  }

  if (TEST_CONFIG.stabilityAI) {
    results.stabilityAI = await testStabilityAI();
  }

  if (TEST_CONFIG.geminiImage) {
    results.geminiImage = await testGeminiImage();
  }

  if (TEST_CONFIG.deepgram) {
    results.deepgram = await testDeepgram();
  }

  if (TEST_CONFIG.sunoAI) {
    results.sunoAI = await testSunoAI();
  }

  // Summary
  console.log('\n================================================');
  console.log('📊 Test Results Summary:');
  console.log('================================================');

  for (const [provider, success] of Object.entries(results)) {
    console.log(`  ${success ? '✅' : '❌'} ${provider}`);
  }

  const successCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;

  console.log(`\nTotal: ${successCount}/${totalCount} passed`);
  console.log('\n📋 Next Steps:');
  console.log('1. Go to Langfuse dashboard');
  console.log('2. Find traces tagged with "cost-tracking-validation"');
  console.log('3. Verify "Total Cost" column shows dollar amounts');
  console.log('4. Click into each trace to see Generation with usage.totalCost\n');

  // Give Langfuse time to flush
  console.log('⏳ Waiting 3 seconds for Langfuse to flush...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  console.log('✅ Done!\n');
}

main().catch(console.error);
