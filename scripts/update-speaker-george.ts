/**
 * Script to update existing speaker records to link to George
 * Run with: tsx scripts/update-speaker-george.ts
 */

import { eq } from 'drizzle-orm';
import { db } from '../src/libs/DB';
import { sessions, speakers, users } from '../src/models/Schema';

async function updateSpeakerData() {
  try {
    console.log('🔍 Finding George\'s user record...');

    // Find George's user record (assuming patient with name "George")
    const george = await db.query.users.findFirst({
      where: eq(users.name, 'George'),
    });

    if (!george) {
      console.error('❌ George not found in database');
      console.log('Available users:');
      const allUsers = await db.select().from(users).limit(10);
      allUsers.forEach(u => console.log(`  - ${u.name} (${u.id})`));
      return;
    }

    console.log(`✅ Found George: ${george.name} (ID: ${george.id})`);

    // Find the session (you mentioned session ID: 1e3775a8-1e07-4f88-b74d-63f68cec0b7b)
    const sessionId = '1e3775a8-1e07-4f88-b74d-63f68cec0b7b';
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });

    if (!session) {
      console.error(`❌ Session ${sessionId} not found`);
      return;
    }

    console.log(`✅ Found session: ${session.title}`);

    // Find speakers for this session
    const sessionSpeakers = await db
      .select()
      .from(speakers)
      .where(eq(speakers.sessionId, sessionId));

    console.log(`\n📋 Found ${sessionSpeakers.length} speakers:`);
    sessionSpeakers.forEach((s) => {
      console.log(`  - ${s.speakerLabel} / ${s.speakerName} (ID: ${s.id}, userId: ${s.userId})`);
    });

    // Update Speaker 1 to link to George
    const speaker1 = sessionSpeakers.find(s => s.speakerLabel === 'Speaker 1');

    if (!speaker1) {
      console.error('❌ Speaker 1 not found');
      return;
    }

    console.log(`\n🔧 Updating Speaker 1 to link to George...`);

    await db
      .update(speakers)
      .set({
        speakerName: george.name,
        userId: george.id,
        speakerType: 'patient',
        updatedAt: new Date(),
      })
      .where(eq(speakers.id, speaker1.id));

    console.log(`✅ Successfully updated Speaker 1!`);
    console.log(`   - speakerName: ${speaker1.speakerName} → ${george.name}`);
    console.log(`   - userId: ${speaker1.userId} → ${george.id}`);
    console.log(`   - speakerType: ${speaker1.speakerType} → patient`);

    // Verify the update
    const updatedSpeaker = await db.query.speakers.findFirst({
      where: eq(speakers.id, speaker1.id),
    });

    console.log(`\n✨ Verified update:`);
    console.log(`   - speakerLabel: ${updatedSpeaker?.speakerLabel}`);
    console.log(`   - speakerName: ${updatedSpeaker?.speakerName}`);
    console.log(`   - userId: ${updatedSpeaker?.userId}`);
    console.log(`   - speakerType: ${updatedSpeaker?.speakerType}`);

    console.log(`\n✅ Done! Now refresh the transcript page to see George's name and avatar.`);
  } catch (error) {
    console.error('❌ Error updating speaker data:', error);
  } finally {
    process.exit(0);
  }
}

updateSpeakerData();
