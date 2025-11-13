/**
 * Seed Default Treatment Modules
 * Populates database with 8 pre-defined therapeutic protocols
 */

import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { reflectionTemplatesSchema, surveyTemplatesSchema, treatmentModulesSchema } from '@/models/Schema';
import 'dotenv/config';

// System user ID for seeded modules (Super Admin: admin@storycare.com)
const SYSTEM_USER_ID = '4e22d6db-5ed1-4eb3-b2cb-638f8a9e0211';

// Default survey questions for all modules
const DEFAULT_SURVEY_QUESTIONS = [
  {
    text: 'Resonance (1-5): How much did you relate to this content?',
    type: 'scale' as const,
    scaleMin: 1,
    scaleMax: 5,
    scaleMinLabel: 'Not at all',
    scaleMaxLabel: 'Completely',
    required: true,
  },
  {
    text: 'Emotional Impact (1-5): How strong was your emotional reaction?',
    type: 'scale' as const,
    scaleMin: 1,
    scaleMax: 5,
    scaleMinLabel: 'No reaction',
    scaleMaxLabel: 'Very strong',
    required: true,
  },
  {
    text: 'Primary Emotion: Which feeling was strongest?',
    type: 'emotion' as const,
    options: ['Hope', 'Sadness', 'Anger', 'Relief', 'Pride', 'Confusion', 'Peace', 'Gratitude'],
    required: true,
  },
  {
    text: 'Open Feedback: What came to mind while viewing this?',
    type: 'open_text' as const,
    required: false,
  },
];

// Define 8 default modules
const DEFAULT_MODULES = [
  {
    name: 'Self-Resilience & Re-Authoring',
    domain: 'self_strength' as const,
    description:
      'Help people remember and re-tell how they have faced hardship and what kept them going.',
    inSessionQuestions: [
      'When you look back on a hard time, what moment shows you still standing?',
      'What helped you keep moving when everything said stop?',
      'Who or what gave you a reason to try again?',
      'If that moment were a short film, what image would open it?',
    ],
    reflectionQuestions: [
      {
        text: 'What in this image or scene shows the part of you that refuses to quit?',
        type: 'open_text' as const,
        required: true,
      },
      {
        text: 'What helped you choose the next step instead of stopping?',
        type: 'open_text' as const,
        required: true,
      },
      {
        text: 'What do you want this chapter to remind you of?',
        type: 'open_text' as const,
        required: true,
      },
    ],
    aiPrompt:
      'Read the transcript. Locate passages about struggle and choice. Identify metaphors or sensory details (weather, light, movement) connected to perseverance. Summarize the story arc of endurance in 2 sentences. Suggest 2--3 visual scenes that convey \'still moving.\' Pull 1 quote that captures personal agency.',
    surveyQuestions: [
      ...DEFAULT_SURVEY_QUESTIONS,
      {
        text: 'Agency Now (1-5): How much did you feel like the main character in this scene?',
        type: 'scale' as const,
        scaleMin: 1,
        scaleMax: 5,
        scaleMinLabel: 'Not at all',
        scaleMaxLabel: 'Completely',
        required: false,
      },
    ],
  },
  {
    name: 'Grounding & Regulation',
    domain: 'self_strength' as const,
    description: 'Strengthen awareness of safety, calm, and the body\'s signals of peace.',
    inSessionQuestions: [
      'Where do you feel most at ease right now?',
      'When your mind gets loud, what helps you find quiet again?',
      'If calm had a color or a sound, what comes to mind?',
      'Who or what helps you remember you\'re safe?',
    ],
    reflectionQuestions: [
      {
        text: 'What about this scene feels most like calm or safety for you?',
        type: 'open_text' as const,
        required: true,
      },
      {
        text: 'How can you bring a piece of this feeling into daily life?',
        type: 'open_text' as const,
        required: true,
      },
      {
        text: 'What reminds you that you can return here?',
        type: 'open_text' as const,
        required: true,
      },
    ],
    aiPrompt:
      'Find sensory language—body, breath, pace, warmth. Contrast tension and ease. Summarize how the patient describes returning to steadiness. Suggest imagery of stillness, rhythm, or warmth. Provide 1 quote that shows awareness of safety.',
    surveyQuestions: DEFAULT_SURVEY_QUESTIONS,
  },
  {
    name: 'Relational Healing & Integration',
    domain: 'relationships_repair' as const,
    description:
      'Rebuild trust and belonging through stories of reaching, helping, or being helped.',
    inSessionQuestions: [
      'Who has been part of your story in ways you didn\'t expect?',
      'When did you risk letting someone close again?',
      'What does real safety with another person look like to you?',
      'What makes connection worth the risk?',
    ],
    reflectionQuestions: [
      {
        text: 'What do you see in this image about closeness or distance?',
        type: 'open_text' as const,
        required: true,
      },
      {
        text: 'What changed in you when you reached out?',
        type: 'open_text' as const,
        required: true,
      },
      {
        text: 'What kind of connection feels possible now?',
        type: 'open_text' as const,
        required: true,
      },
    ],
    aiPrompt:
      'Search transcript for relational verbs (reach, hold, trust, hide). Detect shifts from guarded to open. Note metaphors (bridge, door, circle). Summarize connection theme in 2 lines. Suggest 2 visuals showing safety or boundary. Provide one patient quote showing emerging trust.',
    surveyQuestions: DEFAULT_SURVEY_QUESTIONS,
  },
  {
    name: 'Forgiveness & Letting Go',
    domain: 'relationships_repair' as const,
    description: 'Support release of resentment or self-blame and strengthen compassion.',
    inSessionQuestions: [
      'What story keeps replaying when you try to rest?',
      'If you could put down a weight you\'ve carried too long, what might it be?',
      'What would forgiveness—of yourself or someone else—feel like in your body?',
      'What would freedom look like if you saw it?',
    ],
    reflectionQuestions: [
      {
        text: 'What stands out in this image about release or holding on?',
        type: 'open_text' as const,
        required: true,
      },
      {
        text: 'What shifts inside you when you imagine setting this down?',
        type: 'open_text' as const,
        required: true,
      },
      {
        text: 'What could fill the space that opens?',
        type: 'open_text' as const,
        required: true,
      },
    ],
    aiPrompt:
      'Identify words of guilt, anger, or relief. Track emotional arc from tension to ease. Extract metaphors of burden and release (weight, air, water). Summarize change in 2 sentences. Suggest 2 visual ideas symbolizing freedom or peace. Pull 1 quote expressing compassion.',
    surveyQuestions: DEFAULT_SURVEY_QUESTIONS,
  },
  {
    name: 'Becoming',
    domain: 'identity_transformation' as const,
    description: 'Integrate new identity and notice growth after change.',
    inSessionQuestions: [
      'Who were you then, and who are you now?',
      'What has stayed true through the changes?',
      'What\'s one small sign that you\'ve turned a corner?',
      'If this growth had a symbol, what would it be?',
    ],
    reflectionQuestions: [
      {
        text: 'What in this image shows the person you\'re becoming?',
        type: 'open_text' as const,
        required: true,
      },
      {
        text: 'What would the earlier you notice about this version of you?',
        type: 'open_text' as const,
        required: true,
      },
      {
        text: 'What do you want to keep carrying forward?',
        type: 'open_text' as const,
        required: true,
      },
    ],
    aiPrompt:
      'Find contrasts between past and present self (\'I used to… now I…\'). Extract identity words and values (hopeful, calm, strong). Summarize transformation in 2 lines. Propose 2 visuals showing change or emergence. Include 1 quote showing preferred-identity language.',
    surveyQuestions: DEFAULT_SURVEY_QUESTIONS,
  },
  {
    name: 'Acceptance & Continuity',
    domain: 'identity_transformation' as const,
    description: 'Integrate past and present selves; reduce shame and self-judgment.',
    inSessionQuestions: [
      'What truths about you have survived everything?',
      'Which parts of your past still ask to be understood?',
      'What would it mean to make peace with that version of you?',
      'What picture comes to mind when you think of wholeness?',
    ],
    reflectionQuestions: [
      {
        text: 'What in this scene feels reconciled or whole?',
        type: 'open_text' as const,
        required: true,
      },
      {
        text: 'What piece of your past fits differently now?',
        type: 'open_text' as const,
        required: true,
      },
      {
        text: 'What does acceptance make possible for you?',
        type: 'open_text' as const,
        required: true,
      },
    ],
    aiPrompt:
      'Locate dialogue balancing regret and kindness. Identify imagery of blending or harmony. Summarize reconciliation in 3 sentences. Suggest imagery showing integration. Provide 2 quotes showing self-acceptance.',
    surveyQuestions: DEFAULT_SURVEY_QUESTIONS,
  },
  {
    name: 'Direction',
    domain: 'purpose_future' as const,
    description: 'Clarify values and visualize next steps that feel purposeful.',
    inSessionQuestions: [
      'What do you want your life to stand for?',
      'When have you felt most alive or most yourself?',
      'What direction do you hope this story is heading?',
      'Who or what helps you keep sight of what matters?',
    ],
    reflectionQuestions: [
      {
        text: 'What value shines through this scene?',
        type: 'open_text' as const,
        required: true,
      },
      {
        text: 'What small action could move you toward it?',
        type: 'open_text' as const,
        required: true,
      },
      {
        text: 'How does seeing it change how you see today?',
        type: 'open_text' as const,
        required: true,
      },
    ],
    aiPrompt:
      'Identify value or purpose statements (\'matters, meaning, direction\'). Extract navigation metaphors (path, compass, horizon). Summarize motivational theme. Suggest visuals of forward movement or clarity. Provide therapist insight summarizing core value driver.',
    surveyQuestions: DEFAULT_SURVEY_QUESTIONS,
  },
  {
    name: 'Sustaining Change',
    domain: 'purpose_future' as const,
    description: 'Help patients maintain progress and see growth as an ongoing story.',
    inSessionQuestions: [
      'What helps you stay on track when things get messy again?',
      'What reminds you of the progress you\'ve made?',
      'What practices or people keep you steady?',
      'If your future self looked back on this time, what would they thank you for?',
    ],
    reflectionQuestions: [
      {
        text: 'What in this image shows steadiness or rhythm?',
        type: 'open_text' as const,
        required: true,
      },
      {
        text: 'What helps you believe change can last?',
        type: 'open_text' as const,
        required: true,
      },
      {
        text: 'What story would you want your future self to tell?',
        type: 'open_text' as const,
        required: true,
      },
    ],
    aiPrompt:
      'Analyze transcript for maintenance strategies and self-trust. Identify metaphors of rhythm and continuity (heartbeat, tide, wheel). Summarize stability theme in 3 sentences. Suggest visuals showing persistence. Include 1 patient quote about ongoing growth.',
    surveyQuestions: DEFAULT_SURVEY_QUESTIONS,
  },
];

/**
 * Main seed function
 */
export async function seedModules() {
  console.log('🌱 Starting module seed...');

  let successCount = 0;
  let skipCount = 0;

  for (const moduleData of DEFAULT_MODULES) {
    try {
      console.log(`\n📦 Processing: ${moduleData.name}`);

      // Check if module already exists
      const existing = await db
        .select()
        .from(treatmentModulesSchema)
        .where(eq(treatmentModulesSchema.name, moduleData.name))
        .limit(1);

      if (existing.length > 0) {
        console.log(`  ⏭️  Module already exists, skipping...`);
        skipCount++;
        continue;
      }

      // 1. Create reflection template
      console.log('  📝 Creating reflection template...');
      const [reflectionTemplate] = await db
        .insert(reflectionTemplatesSchema)
        .values({
          title: `${moduleData.name} - Reflection Questions`,
          description: `Reflection questions for the ${moduleData.name} module`,
          category: 'narrative',
          questions: moduleData.reflectionQuestions,
          scope: 'system',
          status: 'active',
          createdBy: SYSTEM_USER_ID,
          organizationId: null,
          useCount: 0,
          metadata: { moduleAssociated: true },
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!reflectionTemplate) {
        throw new Error('Failed to create reflection template');
      }

      console.log(`  ✅ Reflection template created: ${reflectionTemplate.id}`);

      // 2. Create survey template
      console.log('  📊 Creating survey template...');
      const [surveyTemplate] = await db
        .insert(surveyTemplatesSchema)
        .values({
          title: `${moduleData.name} - Survey Bundle`,
          description: `Standard survey bundle for the ${moduleData.name} module`,
          category: 'outcome',
          questions: moduleData.surveyQuestions,
          scope: 'system',
          status: 'active',
          createdBy: SYSTEM_USER_ID,
          organizationId: null,
          useCount: 0,
          metadata: { moduleAssociated: true },
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!surveyTemplate) {
        throw new Error('Failed to create survey template');
      }

      console.log(`  ✅ Survey template created: ${surveyTemplate.id}`);

      // 3. Create treatment module
      console.log('  🎯 Creating treatment module...');
      const [module] = await db
        .insert(treatmentModulesSchema)
        .values({
          name: moduleData.name,
          domain: moduleData.domain,
          description: moduleData.description,
          scope: 'system',
          createdBy: SYSTEM_USER_ID,
          organizationId: null,
          inSessionQuestions: moduleData.inSessionQuestions,
          reflectionQuestions: moduleData.reflectionQuestions.map(q => q.text),
          reflectionTemplateId: reflectionTemplate.id,
          surveyTemplateId: surveyTemplate.id,
          aiPromptText: moduleData.aiPrompt,
          aiPromptMetadata: {
            output_format: 'structured',
            expected_fields: [
              'thematicSummary',
              'visualSceneSuggestions',
              'patientQuotes',
              'metaphors',
              'emotionalShifts',
              'clinicalInsights',
            ],
          },
          status: 'active',
          useCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!module) {
        throw new Error('Failed to create treatment module');
      }

      console.log(`  ✅ Module created: ${module.id}`);
      console.log(`  🎉 Successfully seeded: ${moduleData.name}`);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Error seeding ${moduleData.name}:`, error);
    }
  }

  console.log('\n\n✨ Seed completed!');
  console.log(`  ✅ Successfully seeded: ${successCount} modules`);
  console.log(`  ⏭️  Skipped (already exist): ${skipCount} modules`);
  console.log(`  📊 Total: ${DEFAULT_MODULES.length} modules`);
}

// Run seed if called directly
if (require.main === module) {
  seedModules()
    .then(() => {
      console.log('\n✅ Seed script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seed script failed:', error);
      process.exit(1);
    });
}
