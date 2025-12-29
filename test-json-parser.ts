import { detectAndExtractJSON, extractJSONFromMarkdown } from './src/utils/JSONSchemaDetector';

// Test case 1: JSON with ```json marker
const test1 = `\`\`\`json
{
  "type": "therapeutic_scene_card",
  "schemaType": "therapeutic_scene_card",
  "title": "Test"
}
\`\`\``;

// Test case 2: JSON without language specifier
const test2 = `\`\`\`
{
  "type": "therapeutic_scene_card",
  "schemaType": "therapeutic_scene_card",
  "title": "Test"
}
\`\`\``;

// Test case 3: JSON with extra whitespace
const test3 = `\`\`\`json

{
  "type": "therapeutic_scene_card",
  "schemaType": "therapeutic_scene_card",
  "title": "Test"
}

\`\`\``;

console.log('=== Test 1: JSON with ```json marker ===');
const result1 = extractJSONFromMarkdown(test1);
console.log('Extracted:', result1.substring(0, 100));
console.log('Starts with {:', result1.trim().startsWith('{'));

console.log('\n=== Test 2: JSON without language specifier ===');
const result2 = extractJSONFromMarkdown(test2);
console.log('Extracted:', result2.substring(0, 100));
console.log('Starts with {:', result2.trim().startsWith('{'));

console.log('\n=== Test 3: JSON with extra whitespace ===');
const result3 = extractJSONFromMarkdown(test3);
console.log('Extracted:', result3.substring(0, 100));
console.log('Starts with {:', result3.trim().startsWith('{'));

console.log('\n=== Test 4: Full detectAndExtractJSON ===');
const result4 = detectAndExtractJSON(test1);
console.log('Detected schema:', result4?.schemaType);
console.log('Result:', result4 ? 'SUCCESS' : 'FAILED');
