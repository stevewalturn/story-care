/**
 * Test script: Verify Priority PayGo headers are sent correctly to Vertex AI
 *
 * Usage:
 *   npx tsx scripts/test-priority-paygo.ts
 *
 * What it tests:
 *  1. PRIORITY_PAYGO=false → uses regional endpoint, no special headers
 *  2. PRIORITY_PAYGO=true  → uses `global` endpoint + both required headers
 *  3. Real API call with PRIORITY_PAYGO=true → confirms the API accepts the request
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ─── Intercept fetch to capture outgoing request details ────────────────────

type CapturedRequest = {
  url: string;
  headers: Record<string, string>;
};

let capturedRequest: CapturedRequest | null = null;
const originalFetch = global.fetch;

function interceptFetch(mockResponseBody?: unknown) {
  capturedRequest = null;
  global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input.toString();
    const headers: Record<string, string> = {};
    if (init?.headers) {
      const h = init.headers as Record<string, string>;
      for (const [k, v] of Object.entries(h)) {
        headers[k.toLowerCase()] = v;
      }
    }
    capturedRequest = { url, headers };

    // Return a mock response if provided (avoids burning API quota for header tests)
    if (mockResponseBody !== undefined) {
      return new Response(JSON.stringify(mockResponseBody), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Otherwise do a real fetch
    return originalFetch(input, init);
  };
}

function restoreFetch() {
  global.fetch = originalFetch;
}

// ─── Test helpers ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ ${message}`);
    failed++;
  }
}

// Minimal mock Gemini response
const mockGeminiResponse = {
  candidates: [{
    content: { parts: [{ text: 'Hello from mock.' }], role: 'model' },
    finishReason: 'STOP',
  }],
};

// ─── Test 1: PRIORITY_PAYGO=false → regional endpoint, no special headers ────

async function testDisabled() {
  console.log('\n📋 Test 1: VERTEX_AI_PRIORITY_PAYGO=false');

  process.env.VERTEX_AI_PRIORITY_PAYGO = 'false';

  // Re-import to pick up env change (clear module cache for the provider)
  const mod = await import('../src/libs/providers/GeminiChat.js').catch(
    () => import('../src/libs/providers/GeminiChat.ts'),
  ) as typeof import('../src/libs/providers/GeminiChat');

  interceptFetch(mockGeminiResponse);

  await mod.chatWithGemini({
    messages: [{ role: 'user', content: 'ping' }],
    model: 'gemini-2.5-flash-lite',
    temperature: 0,
    maxTokens: 5,
  }).catch(() => {}); // ignore errors — we only care about the request shape

  restoreFetch();

  const req = capturedRequest;
  if (!req) { assert(false, 'fetch was not called'); return; }

  const location = process.env.GOOGLE_VERTEX_LOCATION ?? 'us-central1';
  assert(
    req.url.includes(`${location}-aiplatform.googleapis.com`),
    `Endpoint uses regional location: ${location}-aiplatform.googleapis.com`,
  );
  assert(
    !req.url.includes('global-aiplatform'),
    'Endpoint does NOT use global',
  );
  assert(
    !req.headers['x-vertex-ai-llm-request-type'],
    'X-Vertex-AI-LLM-Request-Type header is absent',
  );
  assert(
    !req.headers['x-vertex-ai-llm-shared-request-type'],
    'X-Vertex-AI-LLM-Shared-Request-Type header is absent',
  );
}

// ─── Test 2: PRIORITY_PAYGO=true → global endpoint + both headers ─────────────

async function testEnabled() {
  console.log('\n📋 Test 2: VERTEX_AI_PRIORITY_PAYGO=true (mock — no API call)');

  process.env.VERTEX_AI_PRIORITY_PAYGO = 'true';

  // Re-import fresh (Node module cache means we need the dynamic import trick)
  // Clear the relevant cached module so env change is picked up
  const moduleKey = Object.keys(require?.cache ?? {}).find(k =>
    k.includes('GeminiChat'),
  );
  if (moduleKey) delete require.cache[moduleKey];

  const mod = await import('../src/libs/providers/GeminiChat.js').catch(
    () => import('../src/libs/providers/GeminiChat.ts'),
  ) as typeof import('../src/libs/providers/GeminiChat');

  interceptFetch(mockGeminiResponse);

  await mod.chatWithGemini({
    messages: [{ role: 'user', content: 'ping' }],
    model: 'gemini-2.5-flash-lite',
    temperature: 0,
    maxTokens: 5,
  }).catch(() => {});

  restoreFetch();

  const req = capturedRequest;
  if (!req) { assert(false, 'fetch was not called'); return; }

  assert(
    req.url.includes('aiplatform.googleapis.com/v1/projects') && req.url.includes('/locations/global/'),
    `Endpoint uses global: ${req.url.split('/v1')[0]}`,
  );
  assert(
    !req.url.includes(`${process.env.GOOGLE_VERTEX_LOCATION ?? 'us-central1'}-aiplatform`),
    'Endpoint does NOT use regional location',
  );
  assert(
    req.headers['x-vertex-ai-llm-request-type'] === 'shared',
    'X-Vertex-AI-LLM-Request-Type: shared',
  );
  assert(
    req.headers['x-vertex-ai-llm-shared-request-type'] === 'priority',
    'X-Vertex-AI-LLM-Shared-Request-Type: priority',
  );
  assert(
    req.headers['authorization']?.startsWith('Bearer '),
    'Authorization: Bearer <token>',
  );
}

// ─── Test 3: Real API call with PRIORITY_PAYGO=true ──────────────────────────

async function testRealCall() {
  console.log('\n📋 Test 3: Real Vertex AI call with PRIORITY_PAYGO=true');

  process.env.VERTEX_AI_PRIORITY_PAYGO = 'true';

  const moduleKey = Object.keys(require?.cache ?? {}).find(k =>
    k.includes('GeminiChat'),
  );
  if (moduleKey) delete require.cache[moduleKey];

  const mod = await import('../src/libs/providers/GeminiChat.js').catch(
    () => import('../src/libs/providers/GeminiChat.ts'),
  ) as typeof import('../src/libs/providers/GeminiChat');

  // Intercept but still do real fetch
  interceptFetch(); // no mock body → real fetch

  let response: string | null = null;
  let error: string | null = null;

  try {
    response = await mod.chatWithGemini({
      messages: [{ role: 'user', content: 'Reply with exactly: PRIORITY_PAYGO_OK' }],
      model: 'gemini-2.5-flash-lite',
      temperature: 0,
      maxTokens: 20,
    });
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  restoreFetch();

  const req = capturedRequest;
  if (req) {
    console.log(`  → Endpoint: ${req.url.split('/v1')[0]}`);
    console.log(`  → Headers sent:`);
    console.log(`      X-Vertex-AI-LLM-Request-Type: ${req.headers['x-vertex-ai-llm-request-type'] ?? '(not set)'}`);
    console.log(`      X-Vertex-AI-LLM-Shared-Request-Type: ${req.headers['x-vertex-ai-llm-shared-request-type'] ?? '(not set)'}`);
  }

  if (error) {
    assert(false, `API call failed: ${error}`);
  } else {
    assert(true, `API call succeeded`);
    console.log(`  → Model response: "${response}"`);
  }
}

// ─── Run all tests ────────────────────────────────────────────────────────────

(async () => {
  console.log('🔍 Priority PayGo Header Verification\n' + '─'.repeat(50));

  await testDisabled();
  await testEnabled();
  await testRealCall();

  console.log('\n' + '─'.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('✅ All tests passed');
  }
})();
