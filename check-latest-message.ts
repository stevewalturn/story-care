import { desc, eq } from 'drizzle-orm';
import { db } from './src/libs/DB';
import { messages } from './src/models/Schema';

async function getLatestMessage() {
  try {
    const latestMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.role, 'assistant'))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    if (latestMessages[0]) {
      console.log('Latest AI message content (first 600 chars):');
      console.log(latestMessages[0].content.substring(0, 600));
      console.log('\n---\n');
      console.log('Content length:', latestMessages[0].content.length);

      // Check if it starts with ```
      const trimmed = latestMessages[0].content.trimStart();
      const startsWithCodeBlock = trimmed.startsWith('```');
      console.log('\nStarts with code block (```):', startsWithCodeBlock);

      if (startsWithCodeBlock) {
        // Check what's on the first line
        const firstLine = trimmed.split('\n')[0];
        console.log('First line:', firstLine);
      }
    } else {
      console.log('No messages found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

getLatestMessage();
