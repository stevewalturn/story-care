import { db } from './src/libs/DB';
import { aiChatMessagesSchema } from './src/models/Schema';
import { desc, eq } from 'drizzle-orm';

async function diagnoseMessageFormat() {
  try {
    const latestMessages = await db
      .select()
      .from(aiChatMessagesSchema)
      .where(eq(aiChatMessagesSchema.role, 'assistant'))
      .orderBy(desc(aiChatMessagesSchema.createdAt))
      .limit(3);

    console.log(`Found ${latestMessages.length} assistant messages\n`);

    for (let i = 0; i < latestMessages.length; i++) {
      const msg = latestMessages[i];
      const content = msg.content;

      console.log(`\n${'='.repeat(80)}`);
      console.log(`Message ${i + 1}:`);
      console.log(`${'='.repeat(80)}`);

      // Check if it has code blocks
      const hasTripleBackticks = content.includes('```');
      console.log(`\nHas triple backticks: ${hasTripleBackticks}`);

      if (hasTripleBackticks) {
        // Show the first 500 characters with escape sequences visible
        console.log('\n--- First 500 chars (with escape sequences) ---');
        console.log(JSON.stringify(content.substring(0, 500)));

        // Find the first occurrence of ```
        const firstBacktickIndex = content.indexOf('```');
        console.log(`\nFirst \`\`\` at index: ${firstBacktickIndex}`);

        // Show 100 chars around the first ```
        const start = Math.max(0, firstBacktickIndex - 20);
        const end = Math.min(content.length, firstBacktickIndex + 200);
        const snippet = content.substring(start, end);

        console.log('\n--- Around first \`\`\` (with escape sequences) ---');
        console.log(JSON.stringify(snippet));

        // Find what comes after ```
        const afterBackticks = content.substring(firstBacktickIndex + 3, firstBacktickIndex + 50);
        console.log('\n--- After first \`\`\` (50 chars, with escape sequences) ---');
        console.log(JSON.stringify(afterBackticks));

        // Check for the pattern our regex expects
        const patterns = [
          { name: 'Pattern 1: ```json\\n{...}\\n```', regex: /```json\s*\n([\s\S]+?)\n\s*```/ },
          { name: 'Pattern 2: ```\\n{...}\\n```', regex: /```\s*\n([\s\S]+?)\n\s*```/ },
          { name: 'Pattern 3: ```json {...} ```', regex: /```json\s*([\s\S]+?)\s*```/ },
          { name: 'Pattern 4: ``` {...} ```', regex: /```\s*([\s\S]+?)\s*```/ },
        ];

        console.log('\n--- Pattern Match Results ---');
        for (const { name, regex } of patterns) {
          const match = content.match(regex);
          console.log(`${name}: ${match ? 'MATCHED' : 'NO MATCH'}`);
          if (match) {
            console.log(`  Captured group 1 length: ${match[1]?.length || 0}`);
            console.log(`  First 100 chars: ${JSON.stringify(match[1]?.substring(0, 100) || '')}`);
          }
        }

        // Try to manually find the JSON object
        const firstBrace = content.indexOf('{');
        if (firstBrace !== -1) {
          console.log(`\nFirst { at index: ${firstBrace}`);
          console.log(`Relative to first \`\`\`: ${firstBrace - firstBacktickIndex}`);
        }

        // Find the closing ```
        const secondBacktickIndex = content.indexOf('```', firstBacktickIndex + 3);
        console.log(`\nSecond \`\`\` at index: ${secondBacktickIndex}`);

        if (secondBacktickIndex !== -1) {
          // Show 100 chars before the closing ```
          const beforeClosing = content.substring(Math.max(0, secondBacktickIndex - 100), secondBacktickIndex);
          console.log('\n--- Before closing \`\`\` (100 chars, with escape sequences) ---');
          console.log(JSON.stringify(beforeClosing));

          // Show what's after the closing ```
          const afterClosing = content.substring(secondBacktickIndex, secondBacktickIndex + 10);
          console.log('\n--- At closing \`\`\` (10 chars, with escape sequences) ---');
          console.log(JSON.stringify(afterClosing));
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

diagnoseMessageFormat();
