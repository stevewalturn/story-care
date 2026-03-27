import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { GoogleAuth } = await import('google-auth-library');

const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY!;
const credentials = JSON.parse(rawKey);
const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  credentials,
});
const client = await auth.getClient();
const { token } = await client.getAccessToken();

const projectId = process.env.GOOGLE_VERTEX_PROJECT_ID!;
const location = process.env.GOOGLE_VERTEX_LOCATION ?? 'us-central1';
const model = 'gemini-2.5-flash-lite';

const body = {
  contents: [{ role: 'user', parts: [{ text: 'Reply with exactly: OK' }] }],
  generationConfig: { temperature: 0, maxOutputTokens: 10 },
};

// Test 1: regional (no Priority PayGo headers)
console.log('\n--- Test: Regional endpoint (no Priority PayGo) ---');
const regionalUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;
const r1 = await fetch(regionalUrl, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
const t1 = await r1.text();
console.log('Status:', r1.status);
console.log('Body:', t1.slice(0, 400));

// Test 2: global endpoint + Priority PayGo headers
console.log('\n--- Test: Global endpoint + Priority PayGo headers ---');
const globalUrl = `https://aiplatform.googleapis.com/v1/projects/${projectId}/locations/global/publishers/google/models/${model}:generateContent`;
const r2 = await fetch(globalUrl, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Vertex-AI-LLM-Request-Type': 'shared',
    'X-Vertex-AI-LLM-Shared-Request-Type': 'priority',
  },
  body: JSON.stringify(body),
});
const t2 = await r2.text();
console.log('Status:', r2.status);
console.log('Body:', t2.slice(0, 400));
