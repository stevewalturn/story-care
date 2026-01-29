/**
 * Test script for Langfuse integration
 * Run with: node --env-file=.env.local -r esbuild-register scripts/test-langfuse.ts
 * Or: npx tsx --env-file=.env.local scripts/test-langfuse.ts
 *
 * This script tests that Langfuse is properly configured and tracking AI calls.
 */

import { flushLangfuse, getLangfuse, isLangfuseConfigured } from '../src/libs/Langfuse';
import {
  createTextGeneration,
  createTrace,
  endTextGeneration,
} from '../src/libs/LangfuseTracing';

async function testLangfuseConnection() {
  console.log('=== Langfuse Integration Test ===\n');

  // Check if Langfuse is configured
  console.log('1. Checking Langfuse configuration...');
  if (!isLangfuseConfigured()) {
    console.error('   ERROR: Langfuse is not configured.');
    console.error('   Please set LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY in .env.local');
    process.exit(1);
  }
  console.log('   OK: Langfuse credentials found\n');

  // Get Langfuse client
  console.log('2. Getting Langfuse client...');
  const langfuse = getLangfuse();
  if (!langfuse) {
    console.error('   ERROR: Failed to create Langfuse client');
    process.exit(1);
  }
  console.log('   OK: Langfuse client created\n');

  // Create a test trace
  console.log('3. Creating test trace...');
  const trace = createTrace('langfuse-integration-test', {
    userId: 'test-user',
    tags: ['test', 'integration'],
    metadata: {
      testRun: new Date().toISOString(),
    },
  });

  if (!trace) {
    console.error('   ERROR: Failed to create trace (Langfuse not configured)');
    process.exit(1);
  }
  console.log(`   OK: Trace created with ID: ${trace.id}\n`);

  // Create a test generation (simulating a text generation call)
  console.log('4. Creating test generation...');
  const generation = createTextGeneration(trace, 'test-generation', {
    model: 'gpt-4o',
    input: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Say hello!' },
    ],
    modelParameters: {
      temperature: 0.7,
      maxTokens: 100,
    },
  });

  if (!generation) {
    console.error('   ERROR: Failed to create generation');
    process.exit(1);
  }
  console.log('   OK: Generation created\n');

  // End the generation with mock output
  console.log('5. Ending generation with mock output...');
  endTextGeneration(generation, {
    output: 'Hello! This is a test response from the Langfuse integration test.',
    usage: {
      inputTokens: 20,
      outputTokens: 15,
      totalTokens: 35,
    },
  });
  console.log('   OK: Generation ended\n');

  // Flush to Langfuse
  console.log('6. Flushing events to Langfuse...');
  await flushLangfuse();
  console.log('   OK: Events flushed\n');

  // Try to fetch the trace from Langfuse API to verify
  console.log('7. Verifying trace was recorded...');
  try {
    // Wait a moment for the trace to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Use the Langfuse client to fetch traces
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY!;
    const secretKey = process.env.LANGFUSE_SECRET_KEY!;
    const baseUrl = process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com';

    const response = await fetch(`${baseUrl}/api/public/traces/${trace.id}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString('base64')}`,
      },
    });

    if (response.ok) {
      const traceData = await response.json();
      console.log('   OK: Trace verified in Langfuse!');
      console.log(`   - Trace ID: ${traceData.id}`);
      console.log(`   - Name: ${traceData.name}`);
      console.log(`   - Created: ${traceData.createdAt}`);
    } else if (response.status === 404) {
      console.log('   WARNING: Trace not yet visible (may take a few seconds to appear)');
      console.log('   Check your Langfuse dashboard to verify.');
    } else {
      console.log(`   WARNING: Could not verify trace (status: ${response.status})`);
      console.log('   Check your Langfuse dashboard to verify.');
    }
  } catch (error) {
    console.log('   WARNING: Could not verify trace via API');
    console.log('   Check your Langfuse dashboard to verify.');
    console.log(`   Error: ${error instanceof Error ? error.message : error}`);
  }

  console.log('\n=== Test Complete ===');
  console.log(`\nView your trace at: ${process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com'}/trace/${trace.id}`);
}

// Run the test
testLangfuseConnection().catch((error) => {
  console.error('Test failed with error:', error);
  process.exit(1);
});
