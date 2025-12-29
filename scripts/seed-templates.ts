/**
 * Seed System-Level Templates
 * Populates reflection and survey templates available to all users
 */

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  reflectionTemplatesSchema,
  surveyTemplatesSchema,
  usersSchema,
} from '../src/models/Schema';
import * as schema from '../src/models/Schema';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Create database connection directly (bypasses Env validation for seeding)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db: PostgresJsDatabase<typeof schema> = drizzle(pool, { schema });

// System user ID for seeded templates
const SYSTEM_USER_ID = '4e22d6db-5ed1-4eb3-b2cb-638f8a9e0211';

// ============================================================================
// REFLECTION TEMPLATES
// ============================================================================

const reflectionTemplates = [
  {
    title: 'Self-Resilience & Re-Authoring',
    description: 'Help people remember and re-tell how they have faced hardship and what kept them going',
    category: 'narrative',
    questions: [
      {
        questionText: 'What in this image or scene shows the part of you that refuses to quit?',
        questionType: 'open_text',
        required: true,
      },
      {
        questionText: 'What helped you choose the next step instead of stopping?',
        questionType: 'open_text',
        required: true,
      },
      {
        questionText: 'What do you want this chapter to remind you of?',
        questionType: 'open_text',
        required: true,
      },
    ],
  },
  {
    title: 'Grounding & Regulation',
    description: 'Strengthen awareness of safety, calm, and the body\'s signals of peace',
    category: 'emotion',
    questions: [
      {
        questionText: 'What about this scene feels most like calm or safety for you?',
        questionType: 'open_text',
        required: true,
      },
      {
        questionText: 'How can you bring a piece of this feeling into daily life?',
        questionType: 'open_text',
        required: true,
      },
      {
        questionText: 'What reminds you that you can return here?',
        questionType: 'open_text',
        required: true,
      },
    ],
  },
  {
    title: 'Relational Healing & Integration',
    description: 'Rebuild trust and belonging through stories of reaching, helping, or being helped',
    category: 'narrative',
    questions: [
      {
        questionText: 'What do you see in this image about closeness or distance?',
        questionType: 'open_text',
        required: true,
      },
      {
        questionText: 'What changed in you when you reached out?',
        questionType: 'open_text',
        required: true,
      },
      {
        questionText: 'What kind of connection feels possible now?',
        questionType: 'open_text',
        required: true,
      },
    ],
  },
  {
    title: 'Forgiveness & Letting Go',
    description: 'Support release of resentment or self-blame and strengthen compassion',
    category: 'emotion',
    questions: [
      {
        questionText: 'What stands out in this image about release or holding on?',
        questionType: 'open_text',
        required: true,
      },
      {
        questionText: 'What shifts inside you when you imagine setting this down?',
        questionType: 'open_text',
        required: true,
      },
      {
        questionText: 'What could fill the space that opens?',
        questionType: 'open_text',
        required: true,
      },
    ],
  },
  {
    title: 'Identity Transformation - Becoming',
    description: 'Integrate new identity and notice growth after change',
    category: 'narrative',
    questions: [
      {
        questionText: 'What in this image shows the person you\'re becoming?',
        questionType: 'open_text',
        required: true,
      },
      {
        questionText: 'What would the earlier you notice about this version of you?',
        questionType: 'open_text',
        required: true,
      },
      {
        questionText: 'What do you want to keep carrying forward?',
        questionType: 'open_text',
        required: true,
      },
    ],
  },
  {
    title: 'Acceptance & Continuity',
    description: 'Integrate past and present selves; reduce shame and self-judgment',
    category: 'emotion',
    questions: [
      {
        questionText: 'What in this scene feels reconciled or whole?',
        questionType: 'open_text',
        required: true,
      },
      {
        questionText: 'What piece of your past fits differently now?',
        questionType: 'open_text',
        required: true,
      },
      {
        questionText: 'What does acceptance make possible for you?',
        questionType: 'open_text',
        required: true,
      },
    ],
  },
  {
    title: 'Purpose & Direction',
    description: 'Clarify values and visualize next steps that feel purposeful',
    category: 'goal-setting',
    questions: [
      {
        questionText: 'What value shines through this scene?',
        questionType: 'open_text',
        required: true,
      },
      {
        questionText: 'What small action could move you toward it?',
        questionType: 'open_text',
        required: true,
      },
      {
        questionText: 'How does seeing it change how you see today?',
        questionType: 'open_text',
        required: true,
      },
    ],
  },
  {
    title: 'Sustaining Change',
    description: 'Help patients maintain progress and see growth as an ongoing story',
    category: 'outcome',
    questions: [
      {
        questionText: 'What in this image shows steadiness or rhythm?',
        questionType: 'open_text',
        required: true,
      },
      {
        questionText: 'What helps you believe change can last?',
        questionType: 'open_text',
        required: true,
      },
      {
        questionText: 'What story would you want your future self to tell?',
        questionType: 'open_text',
        required: true,
      },
    ],
  },
];

// ============================================================================
// SURVEY TEMPLATES
// ============================================================================

const surveyTemplates = [
  {
    title: 'Standard Resonance & Impact Survey',
    description: 'Assess emotional resonance and impact of story pages - default survey for most modules',
    category: 'outcome',
    questions: [
      {
        questionText: 'Resonance (1-5): How much did you relate to this content?',
        questionType: 'scale',
        scaleMin: 1,
        scaleMax: 5,
        scaleMinLabel: 'Not at all',
        scaleMaxLabel: 'Completely',
        required: true,
      },
      {
        questionText: 'Emotional Impact (1-5): How strong was your emotional reaction?',
        questionType: 'scale',
        scaleMin: 1,
        scaleMax: 5,
        scaleMinLabel: 'No reaction',
        scaleMaxLabel: 'Very strong',
        required: true,
      },
      {
        questionText: 'Primary Emotion: Which feeling was strongest?',
        questionType: 'emotion',
        options: ['Hope', 'Sadness', 'Anger', 'Relief', 'Pride', 'Confusion', 'Peace', 'Gratitude'],
        required: true,
      },
      {
        questionText: 'Open Feedback: What came to mind while viewing this?',
        questionType: 'open_text',
        required: false,
      },
    ],
  },
  {
    title: 'Emotional Check-In Survey',
    description: 'Quick assessment of current emotional state and regulation',
    category: 'screening',
    questions: [
      {
        questionText: 'Current Emotional State (1-5): How would you rate your emotional state right now?',
        questionType: 'scale',
        scaleMin: 1,
        scaleMax: 5,
        scaleMinLabel: 'Very distressed',
        scaleMaxLabel: 'Very calm',
        required: true,
      },
      {
        questionText: 'Regulation (1-5): How able are you to manage your emotions today?',
        questionType: 'scale',
        scaleMin: 1,
        scaleMax: 5,
        scaleMinLabel: 'Unable',
        scaleMaxLabel: 'Very able',
        required: true,
      },
      {
        questionText: 'What emotion are you experiencing most right now?',
        questionType: 'emotion',
        options: ['Anxious', 'Sad', 'Angry', 'Peaceful', 'Joyful', 'Confused', 'Numb', 'Hopeful'],
        required: true,
      },
      {
        questionText: 'What would help you feel more grounded today?',
        questionType: 'open_text',
        required: false,
      },
    ],
  },
  {
    title: 'Session Satisfaction Survey',
    description: 'Gather feedback on therapeutic session effectiveness and experience',
    category: 'satisfaction',
    questions: [
      {
        questionText: 'Session Helpfulness (1-5): How helpful was today\'s session?',
        questionType: 'scale',
        scaleMin: 1,
        scaleMax: 5,
        scaleMinLabel: 'Not helpful',
        scaleMaxLabel: 'Very helpful',
        required: true,
      },
      {
        questionText: 'Therapeutic Alliance (1-5): How comfortable did you feel sharing today?',
        questionType: 'scale',
        scaleMin: 1,
        scaleMax: 5,
        scaleMinLabel: 'Uncomfortable',
        scaleMaxLabel: 'Very comfortable',
        required: true,
      },
      {
        questionText: 'What was most valuable about this session?',
        questionType: 'open_text',
        required: false,
      },
      {
        questionText: 'What would you like to focus on next time?',
        questionType: 'open_text',
        required: false,
      },
    ],
  },
  {
    title: 'Progress & Goals Survey',
    description: 'Track progress toward therapeutic goals and assess motivation',
    category: 'goal-setting',
    questions: [
      {
        questionText: 'Goal Progress (1-5): How much progress have you made toward your goals?',
        questionType: 'scale',
        scaleMin: 1,
        scaleMax: 5,
        scaleMinLabel: 'No progress',
        scaleMaxLabel: 'Significant progress',
        required: true,
      },
      {
        questionText: 'Motivation (1-5): How motivated do you feel to continue working on your goals?',
        questionType: 'scale',
        scaleMin: 1,
        scaleMax: 5,
        scaleMinLabel: 'Not motivated',
        scaleMaxLabel: 'Very motivated',
        required: true,
      },
      {
        questionText: 'What specific progress have you noticed?',
        questionType: 'open_text',
        required: false,
      },
      {
        questionText: 'What obstacles are you facing?',
        questionType: 'open_text',
        required: false,
      },
    ],
  },
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function seedTemplates() {
  try {
    console.log('🌱 Seeding system-level templates...\n');

    // Get or create system user
    let systemUser = await db.query.usersSchema.findFirst({
      where: eq(usersSchema.id, SYSTEM_USER_ID),
    });

    if (!systemUser) {
      systemUser = await db.query.usersSchema.findFirst({
        where: eq(usersSchema.email, 'system@storycare.health'),
      });
    }

    if (!systemUser) {
      console.log('Creating system user...');
      const result = await db
        .insert(usersSchema)
        .values({
          email: 'system@storycare.health',
          name: 'System',
          role: 'super_admin',
          status: 'active',
        })
        .returning();
      systemUser = result[0];
    }

    console.log(`✅ Using system user: ${systemUser.email} (${systemUser.id})\n`);

    // ========================================================================
    // SEED REFLECTION TEMPLATES
    // ========================================================================

    let reflectionCreatedCount = 0;
    let reflectionSkippedCount = 0;

    console.log('📝 Seeding reflection templates...\n');

    for (const templateData of reflectionTemplates) {
      try {
        const [existing] = await db
          .select()
          .from(reflectionTemplatesSchema)
          .where(eq(reflectionTemplatesSchema.title, templateData.title))
          .limit(1);

        if (existing) {
          console.log(`⏭️  Skipping "${templateData.title}" (already exists)`);
          reflectionSkippedCount++;
          continue;
        }

        const result = await db
          .insert(reflectionTemplatesSchema)
          .values({
            ...templateData,
            scope: 'system',
            organizationId: null,
            createdBy: systemUser.id,
            status: 'active',
            useCount: 0,
          })
          .returning();

        if (result[0]) {
          console.log(`✅ Created: "${result[0].title}" (${result[0].category})`);
          reflectionCreatedCount++;
        }
      }
      catch (error) {
        console.error(`❌ Error creating "${templateData.title}":`, error);
      }
    }

    // ========================================================================
    // SEED SURVEY TEMPLATES
    // ========================================================================

    let surveyCreatedCount = 0;
    let surveySkippedCount = 0;

    console.log('\n📊 Seeding survey templates...\n');

    for (const templateData of surveyTemplates) {
      try {
        const [existing] = await db
          .select()
          .from(surveyTemplatesSchema)
          .where(eq(surveyTemplatesSchema.title, templateData.title))
          .limit(1);

        if (existing) {
          console.log(`⏭️  Skipping "${templateData.title}" (already exists)`);
          surveySkippedCount++;
          continue;
        }

        const result = await db
          .insert(surveyTemplatesSchema)
          .values({
            ...templateData,
            scope: 'system',
            organizationId: null,
            createdBy: systemUser.id,
            status: 'active',
            useCount: 0,
          })
          .returning();

        if (result[0]) {
          console.log(`✅ Created: "${result[0].title}" (${result[0].category})`);
          surveyCreatedCount++;
        }
      }
      catch (error) {
        console.error(`❌ Error creating "${templateData.title}":`, error);
      }
    }

    // ========================================================================
    // SUMMARY
    // ========================================================================

    console.log('\n✨ Template seed complete!\n');
    console.log('Summary:');
    console.log(`  📝 Reflection templates: ${reflectionCreatedCount} created, ${reflectionSkippedCount} skipped`);
    console.log(`  📊 Survey templates: ${surveyCreatedCount} created, ${surveySkippedCount} skipped`);
    console.log(`  📊 Total templates: ${reflectionCreatedCount + surveyCreatedCount} seeded\n`);

    await pool.end();
    process.exit(0);
  }
  catch (error) {
    console.error('\n❌ Seed failed:', error);
    await pool.end();
    process.exit(1);
  }
}

// Run the seed
seedTemplates();
