/**
 * Test script for Langfuse integration with actual OpenAI API call
 * Run with: node --env-file=.env -r esbuild-register scripts/test-langfuse-openai.ts
 *
 * This script makes a real OpenAI API call and verifies it's tracked in Langfuse.
 */

import { flushLangfuse } from '../src/libs/Langfuse';
import { chatWithOpenAI } from '../src/libs/providers/OpenAIChat';

async function testOpenAIWithLangfuse() {
  console.log('=== Langfuse + OpenAI Integration Test ===\n');

  console.log('1. Making OpenAI API call with Langfuse tracing...');

  try {
    const response = await chatWithOpenAI({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Keep responses very brief.' },
        { role: 'user', content: 'Say "Hello from Langfuse test!" in exactly 5 words.' },
      ],
      temperature: 0.7,
      maxTokens: 50,
      traceMetadata: {
        userId: 'test-user',
        tags: ['test', 'openai', 'integration'],
        metadata: {
          testType: 'openai-integration',
          timestamp: new Date().toISOString(),
        },
      },
    });

    console.log('   OK: OpenAI call completed');
    console.log(`   Response: "${response}"\n`);

    // Ensure all events are flushed
    console.log('2. Flushing Langfuse events...');
    await flushLangfuse();
    console.log('   OK: Events flushed\n');

    console.log('=== Test Complete ===');
    console.log('\nCheck your Langfuse dashboard to see the traced generation.');
    console.log('You should see:');
    console.log('  - Trace name: "openai-chat"');
    console.log('  - Generation with model "gpt-4o-mini"');
    console.log('  - Input/output messages');
    console.log('  - Token usage and cost (auto-calculated by Langfuse)');
  } catch (error) {
    console.error('   ERROR:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

testOpenAIWithLangfuse().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
