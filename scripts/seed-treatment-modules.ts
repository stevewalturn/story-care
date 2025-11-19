/**
 * Seed Treatment Modules
 * Seeds the 8 core treatment modules from ADMIN.md specification
 */

import { eq } from 'drizzle-orm';
import { db } from '@/libs/DB';
import {
  moduleAiPromptsSchema,
  modulePromptLinksSchema,
  treatmentModulesSchema,
  usersSchema,
} from '@/models/Schema';

async function seedTreatmentModules() {
  console.log('🌱 Seeding treatment modules...');

  // Get or create the system user to create modules
  const existingUsers = await db
    .select()
    .from(usersSchema)
    .where(eq(usersSchema.email, 'system@storycare.app'))
    .limit(1);

  let systemUser = existingUsers[0];

  if (!systemUser) {
    console.log('⚙️  Creating system user...');
    const newUsers = await db
      .insert(usersSchema)
      .values({
        email: 'system@storycare.app',
        name: 'System',
        role: 'super_admin',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    systemUser = Array.isArray(newUsers) ? newUsers[0] : null;
    console.log('✅ System user created');
  }

  if (!systemUser) {
    console.error('❌ Failed to create or find system user');
    process.exit(1);
  }

  // ============================================================================
  // AI PROMPT TEMPLATES
  // ============================================================================
  // Define reusable AI prompt templates that modules can link to

  console.log('\n📝 Creating AI prompt templates...\n');

  const aiPromptTemplates = [
    {
      name: 'Create A Scene',
      category: 'creative',
      icon: 'video',
      description: 'Generate a therapeutic scene visualization from transcript moments',
      promptText: `You are an expert narrative therapist and filmmaker. Your task is to identify powerful, scene-worthy moments from the transcript.

For the selected text:
1. Identify the core emotional or narrative moment
2. Extract sensory details (weather, light, movement, sound)
3. Note metaphors or symbolic elements
4. Suggest a visual scene concept that captures this moment therapeutically

Return as JSON:
{
  "sceneTitle": "Brief title",
  "visualDescription": "Detailed scene description with lighting, setting, mood",
  "therapeuticRationale": "Why this scene matters for the patient's story",
  "suggestedDuration": "5-15 seconds"
}`,
    },
    {
      name: 'Self-Resilience & Re-Authoring Analysis',
      category: 'analysis',
      icon: 'target',
      description: 'Analyze for moments of personal agency, strength, and alternative narratives',
      promptText: `Analyze this transcript excerpt for self-resilience patterns and re-authoring opportunities:

Focus on:
- Moments of agency and personal strength
- Alternative narratives the patient is constructing
- Resistance to problem-saturated stories
- Metaphors of perseverance (weather, movement, light)
- Language showing "still moving" despite hardship

Provide:
1. **Story Arc** (2 sentences): Summarize the endurance narrative
2. **Visual Suggestions** (2-3 scenes): Describe images that convey resilience
3. **Key Quote**: One quote capturing personal agency
4. **Therapeutic Insight**: What this reveals about the patient's preferred identity`,
    },
    {
      name: 'Grounding & Regulation Analysis',
      category: 'analysis',
      icon: 'activity',
      description: 'Identify sensory awareness, safety signals, and regulation strategies',
      promptText: `Analyze for grounding and emotional regulation patterns:

Look for:
- Sensory language (body, breath, pace, warmth, texture)
- Contrasts between tension and ease
- Descriptions of returning to steadiness
- Awareness of safety cues
- Regulation strategies (named or implicit)

Provide:
1. **Regulation Summary** (2-3 sentences): How patient describes finding calm
2. **Sensory Themes**: List key sensory details mentioned
3. **Visual Suggestions**: Imagery of stillness, rhythm, or warmth
4. **Key Quote**: One quote showing awareness of safety
5. **Clinical Note**: Regulation capacity and areas for growth`,
    },
    {
      name: 'Relational Healing & Integration Analysis',
      category: 'analysis',
      icon: 'users',
      description: 'Track connection patterns, trust-building, and relational safety',
      promptText: `Search transcript for relational healing patterns:

Focus on:
- Relational verbs (reach, hold, trust, hide, open, guard)
- Shifts from guarded to open
- Metaphors of connection (bridge, door, circle, wall)
- Expressions of safety or risk in relationships
- Moments of vulnerability or trust

Provide:
1. **Connection Theme** (2 sentences): Summarize relational narrative
2. **Trust Markers**: Identify moments showing emerging trust
3. **Visual Suggestions** (2 scenes): Images showing safety or healthy boundaries
4. **Key Quote**: Patient statement showing relational shift
5. **Therapeutic Insight**: Progress in relational capacity`,
    },
    {
      name: 'Extract Meaningful Quotes (AI)',
      category: 'extraction',
      icon: 'bookmark',
      description: 'AI analyzes selection and extracts therapeutically significant quotes',
      promptText: `You are a narrative therapy expert. Analyze the selected text and extract the most meaningful, therapeutically significant quotes.

Look for:
- Statements of agency or personal strength
- Identity language ("I am...", "I used to be... but now...")
- Turning point moments
- Expressions of hope or preferred narrative
- Metaphors that capture the patient's experience

For each quote:
1. Extract the exact text (20-100 words)
2. Explain its therapeutic significance
3. Suggest 1-2 relevant tags

Return as JSON array:
[
  {
    "quoteText": "exact quote here",
    "significance": "why this matters therapeutically",
    "suggestedTags": ["resilience", "identity"]
  }
]

Limit to 3-5 most powerful quotes.`,
    },
    {
      name: 'Therapeutic Alliance Analysis',
      category: 'reflection',
      icon: 'info',
      description: 'Assess quality of therapeutic relationship and alliance indicators',
      promptText: `Analyze the transcript for indicators of the therapeutic alliance.

Evaluate:
1. **Rapport Quality**: Signs of trust, comfort, openness
2. **Therapist Attunement**: How well therapist tracks patient's experience
3. **Collaboration**: Evidence of shared goals and partnership
4. **Patient Engagement**: Level of openness, vulnerability, participation
5. **Ruptures or Repairs**: Any moments of disconnect or resolution

Provide:
- **Alliance Rating** (1-5 scale, with justification)
- **Strengths**: What's working well in the relationship
- **Growth Areas**: Opportunities to strengthen alliance
- **Specific Observations**: Key moments demonstrating alliance quality
- **Recommendations**: Suggestions for maintaining/improving connection`,
    },
    {
      name: 'Potential Images',
      category: 'creative',
      icon: 'image',
      description: 'Generate image suggestions based on transcript themes and metaphors',
      promptText: `You are a visual artist and narrative therapy expert. Analyze the selected text and generate compelling image suggestions.

For each image concept:
1. Identify the core emotional or symbolic theme
2. Extract visual metaphors and sensory details
3. Create a detailed image prompt suitable for AI generation
4. Explain the therapeutic purpose

Return as JSON:
{
  "images": [
    {
      "title": "Image concept title",
      "prompt": "Detailed DALL-E style prompt with artistic style, lighting, mood, composition",
      "therapeuticRationale": "Why this image supports the patient's narrative",
      "keyThemes": ["theme1", "theme2"]
    }
  ]
}

Limit to 2-3 strongest image concepts.`,
    },
    {
      name: 'Group Clinical Note',
      category: 'analysis',
      icon: 'file-text',
      description: 'Generate structured clinical progress note for group therapy session',
      promptText: `You are a licensed clinical professional creating a detailed Group Therapy Progress Note for a narrative therapy session.

Include:

**Session Information**
- Date, duration, group name, participants present

**Session Summary**
- Main themes explored
- Narrative techniques used
- Group dynamics observed

**Individual Participant Notes**
- Key contributions from each member
- Progress toward therapeutic goals
- Engagement level

**Clinical Assessment**
- Therapeutic alliance quality
- Group cohesion
- Progress indicators
- Concerns or risks

**Plan**
- Next session focus
- Individual follow-ups needed
- Adjustments to treatment approach

Format as a professional clinical note suitable for medical records.`,
    },
  ];

  // Seed AI prompts (with deduplication)
  const createdPrompts: Record<string, string> = {}; // name -> id mapping

  for (const promptData of aiPromptTemplates) {
    try {
      const [existingPrompt] = await db
        .select()
        .from(moduleAiPromptsSchema)
        .where(eq(moduleAiPromptsSchema.name, promptData.name))
        .limit(1);

      if (existingPrompt) {
        console.log(`⏭️  AI Prompt "${promptData.name}" already exists, skipping...`);
        createdPrompts[promptData.name] = existingPrompt.id;
        continue;
      }

      const newPrompts = await db
        .insert(moduleAiPromptsSchema)
        .values({
          ...promptData,
          createdBy: systemUser.id,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const newPrompt = newPrompts[0];
      if (newPrompt) {
        createdPrompts[promptData.name] = newPrompt.id;
        console.log(`✅ Created AI prompt: ${newPrompt.name} (${newPrompt.category})`);
      }
    } catch (error) {
      console.error(`❌ Error creating AI prompt "${promptData.name}":`, error);
    }
  }

  // ============================================================================
  // TREATMENT MODULES
  // ============================================================================

  const modules = [
    // 1. Self-Resilience & Re-Authoring
    {
      name: 'Self-Resilience & Re-Authoring',
      domain: 'self_strength',
      description: 'Help people remember and re-tell how they have faced hardship and what kept them going.',
      scope: 'system',
      createdBy: systemUser.id,
      organizationId: null,
      inSessionQuestions: [
        'When you look back on a hard time, what moment shows you still standing?',
        'What helped you keep moving when everything said stop?',
        'Who or what gave you a reason to try again?',
        'If that moment were a short film, what image would open it?',
      ],
      reflectionTemplateId: null,
      surveyTemplateId: null,
      aiPromptText: 'Read the transcript. Locate passages about struggle and choice. Identify metaphors or sensory details (weather, light, movement) connected to perseverance. Summarize the story arc of endurance in 2 sentences. Suggest 2-3 visual scenes that convey still moving. Pull 1 quote that captures personal agency.',
      aiPromptMetadata: {
        prompts: {
          createScene: true,
          selfResilience: true,
          groundingRegulation: false,
          relationalHealing: false,
        },
        surveyBundle: {
          emotionalImpact: true,
          resonance: true,
          openFeedback: true,
          primaryEmotion: true,
        },
      },
      linkedPrompts: [
        'Create A Scene',
        'Self-Resilience & Re-Authoring Analysis',
        'Extract Meaningful Quotes (AI)',
        'Potential Images',
      ],
      status: 'active',
      useCount: 0,
    },

    // 2. Grounding & Regulation
    {
      name: 'Grounding & Regulation',
      domain: 'self_strength',
      description: 'Strengthen awareness of safety, calm, and the body\'s signals of peace.',
      scope: 'system',
      createdBy: systemUser.id,
      organizationId: null,
      inSessionQuestions: [
        'Where do you feel most at ease right now?',
        'When your mind gets loud, what helps you find quiet again?',
        'If calm had a color or a sound, what comes to mind?',
        'Who or what helps you remember you\'re safe?',
      ],
      reflectionTemplateId: null,
      surveyTemplateId: null,
      aiPromptText: 'Find sensory language (body, breath, pace, warmth). Contrast tension and ease. Summarize how the patient describes returning to steadiness. Suggest imagery of stillness, rhythm, or warmth. Provide 1 quote that shows awareness of safety.',
      aiPromptMetadata: {
        prompts: {
          createScene: true,
          selfResilience: false,
          groundingRegulation: true,
          relationalHealing: false,
        },
        surveyBundle: {
          emotionalImpact: true,
          resonance: true,
          openFeedback: true,
          primaryEmotion: true,
        },
      },
      linkedPrompts: [
        'Create A Scene',
        'Grounding & Regulation Analysis',
        'Extract Meaningful Quotes (AI)',
        'Potential Images',
      ],
      status: 'active',
      useCount: 0,
    },

    // 3. Relational Healing & Integration
    {
      name: 'Relational Healing & Integration',
      domain: 'relationships_repair',
      description: 'Rebuild trust and belonging through stories of reaching, helping, or being helped.',
      scope: 'system',
      createdBy: systemUser.id,
      organizationId: null,
      inSessionQuestions: [
        'Who has been part of your story in ways you didn\'t expect?',
        'When did you risk letting someone close again?',
        'What does real safety with another person look like to you?',
        'What makes connection worth the risk?',
      ],
      reflectionTemplateId: null,
      surveyTemplateId: null,
      aiPromptText: 'Search transcript for relational verbs (reach, hold, trust, hide). Detect shifts from guarded to open. Note metaphors (bridge, door, circle). Summarize connection theme in 2 lines. Suggest 2 visuals showing safety or boundary. Provide one patient quote showing emerging trust.',
      aiPromptMetadata: {
        prompts: {
          createScene: true,
          selfResilience: false,
          groundingRegulation: false,
          relationalHealing: true,
        },
        surveyBundle: {
          emotionalImpact: true,
          resonance: true,
          openFeedback: true,
          primaryEmotion: true,
        },
      },
      linkedPrompts: [
        'Create A Scene',
        'Relational Healing & Integration Analysis',
        'Extract Meaningful Quotes (AI)',
        'Potential Images',
        'Therapeutic Alliance Analysis',
      ],
      status: 'active',
      useCount: 0,
    },

    // 4. Forgiveness & Letting Go
    {
      name: 'Forgiveness & Letting Go',
      domain: 'relationships_repair',
      description: 'Support release of resentment or self-blame and strengthen compassion.',
      scope: 'system',
      createdBy: systemUser.id,
      organizationId: null,
      inSessionQuestions: [
        'What story keeps replaying when you try to rest?',
        'If you could put down a weight you\'ve carried too long, what might it be?',
        'What would forgiveness-of yourself or someone else-feel like in your body?',
        'What would freedom look like if you saw it?',
      ],
      reflectionTemplateId: null,
      surveyTemplateId: null,
      aiPromptText: 'Identify words of guilt, anger, or relief. Track emotional arc from tension to ease. Extract metaphors of burden and release (weight, air, water). Summarize change in 2 sentences. Suggest 2 visual ideas symbolizing freedom or peace. Pull 1 quote expressing compassion.',
      aiPromptMetadata: {
        prompts: {
          createScene: true,
          selfResilience: false,
          groundingRegulation: false,
          relationalHealing: true,
        },
        surveyBundle: {
          emotionalImpact: true,
          resonance: true,
          openFeedback: true,
          primaryEmotion: true,
        },
      },
      linkedPrompts: [
        'Create A Scene',
        'Relational Healing & Integration Analysis',
        'Extract Meaningful Quotes (AI)',
        'Potential Images',
      ],
      status: 'active',
      useCount: 0,
    },

    // 5. Becoming (Identity & Transformation)
    {
      name: 'Becoming',
      domain: 'identity_transformation',
      description: 'Integrate new identity and notice growth after change.',
      scope: 'system',
      createdBy: systemUser.id,
      organizationId: null,
      inSessionQuestions: [
        'Who were you then, and who are you now?',
        'What has stayed true through the changes?',
        'What\'s one small sign that you\'ve turned a corner?',
        'If this growth had a symbol, what would it be?',
      ],
      reflectionTemplateId: null,
      surveyTemplateId: null,
      aiPromptText: 'Find contrasts between past and present self (I used to, now I). Extract identity words and values (hopeful, calm, strong). Summarize transformation in 2 lines. Propose 2 visuals showing change or emergence. Include 1 quote showing preferred-identity language.',
      aiPromptMetadata: {
        prompts: {
          createScene: true,
          selfResilience: true,
          groundingRegulation: false,
          relationalHealing: false,
        },
        surveyBundle: {
          emotionalImpact: true,
          resonance: true,
          openFeedback: true,
          primaryEmotion: true,
        },
      },
      linkedPrompts: [
        'Create A Scene',
        'Self-Resilience & Re-Authoring Analysis',
        'Extract Meaningful Quotes (AI)',
        'Potential Images',
      ],
      status: 'active',
      useCount: 0,
    },

    // 6. Acceptance & Continuity
    {
      name: 'Acceptance & Continuity',
      domain: 'identity_transformation',
      description: 'Integrate past and present selves; reduce shame and self-judgment.',
      scope: 'system',
      createdBy: systemUser.id,
      organizationId: null,
      inSessionQuestions: [
        'What truths about you have survived everything?',
        'Which parts of your past still ask to be understood?',
        'What would it mean to make peace with that version of you?',
        'What picture comes to mind when you think of wholeness?',
      ],
      reflectionTemplateId: null,
      surveyTemplateId: null,
      aiPromptText: 'Locate dialogue balancing regret and kindness. Identify imagery of blending or harmony. Summarize reconciliation in 3 sentences. Suggest imagery showing integration. Provide 2 quotes showing self-acceptance.',
      aiPromptMetadata: {
        prompts: {
          createScene: true,
          selfResilience: true,
          groundingRegulation: false,
          relationalHealing: false,
        },
        surveyBundle: {
          emotionalImpact: true,
          resonance: true,
          openFeedback: true,
          primaryEmotion: true,
        },
      },
      linkedPrompts: [
        'Create A Scene',
        'Self-Resilience & Re-Authoring Analysis',
        'Extract Meaningful Quotes (AI)',
        'Potential Images',
      ],
      status: 'active',
      useCount: 0,
    },

    // 7. Direction (Purpose & Future)
    {
      name: 'Direction',
      domain: 'purpose_future',
      description: 'Clarify values and visualize next steps that feel purposeful.',
      scope: 'system',
      createdBy: systemUser.id,
      organizationId: null,
      inSessionQuestions: [
        'What do you want your life to stand for?',
        'When have you felt most alive or most yourself?',
        'What direction do you hope this story is heading?',
        'Who or what helps you keep sight of what matters?',
      ],
      reflectionTemplateId: null,
      surveyTemplateId: null,
      aiPromptText: 'Identify value or purpose statements (matters, meaning, direction). Extract navigation metaphors (path, compass, horizon). Summarize motivational theme. Suggest visuals of forward movement or clarity. Provide therapist insight summarizing core value driver.',
      aiPromptMetadata: {
        prompts: {
          createScene: true,
          selfResilience: false,
          groundingRegulation: false,
          relationalHealing: false,
        },
        surveyBundle: {
          emotionalImpact: true,
          resonance: true,
          openFeedback: true,
          primaryEmotion: true,
        },
      },
      linkedPrompts: [
        'Create A Scene',
        'Extract Meaningful Quotes (AI)',
        'Potential Images',
      ],
      status: 'active',
      useCount: 0,
    },

    // 8. Sustaining Change
    {
      name: 'Sustaining Change',
      domain: 'purpose_future',
      description: 'Help patients maintain progress and see growth as an ongoing story.',
      scope: 'system',
      createdBy: systemUser.id,
      organizationId: null,
      inSessionQuestions: [
        'What helps you stay on track when things get messy again?',
        'What reminds you of the progress you\'ve made?',
        'What practices or people keep you steady?',
        'If your future self looked back on this time, what would they thank you for?',
      ],
      reflectionTemplateId: null,
      surveyTemplateId: null,
      aiPromptText: 'Analyze transcript for maintenance strategies and self-trust. Identify metaphors of rhythm and continuity (heartbeat, tide, wheel). Summarize stability theme in 3 sentences. Suggest visuals showing persistence. Include 1 patient quote about ongoing growth.',
      aiPromptMetadata: {
        prompts: {
          createScene: true,
          selfResilience: true,
          groundingRegulation: false,
          relationalHealing: false,
        },
        surveyBundle: {
          emotionalImpact: true,
          resonance: true,
          openFeedback: true,
          primaryEmotion: true,
        },
      },
      linkedPrompts: [
        'Create A Scene',
        'Self-Resilience & Re-Authoring Analysis',
        'Extract Meaningful Quotes (AI)',
        'Potential Images',
      ],
      status: 'active',
      useCount: 0,
    },
  ];

  console.log(`\n📦 Creating ${modules.length} treatment modules...\n`);

  for (const moduleData of modules) {
    try {
      const [existingModule] = await db
        .select()
        .from(treatmentModulesSchema)
        .where(eq(treatmentModulesSchema.name, moduleData.name))
        .limit(1);

      if (existingModule) {
        console.log(`⏭️  Module "${moduleData.name}" already exists, skipping...`);
        continue;
      }

      // Extract linkedPrompts before inserting module
      const { linkedPrompts, ...moduleDataWithoutLinks } = moduleData as any;

      const newModules = await db
        .insert(treatmentModulesSchema)
        .values({
          ...moduleDataWithoutLinks,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const newModule = newModules[0];
      if (!newModule) {
        console.error(`❌ Failed to create module "${moduleData.name}"`);
        continue;
      }

      console.log(`✅ Created module: ${newModule.name} (${newModule.domain})`);

      // Link AI prompts to module
      if (linkedPrompts && linkedPrompts.length > 0) {
        for (let i = 0; i < linkedPrompts.length; i++) {
          const promptName = linkedPrompts[i];
          const promptId = createdPrompts[promptName];

          if (promptId) {
            await db.insert(modulePromptLinksSchema).values({
              moduleId: newModule.id,
              promptId,
              sortOrder: i,
              createdAt: new Date(),
            });
            console.log(`   🔗 Linked prompt: ${promptName}`);
          } else {
            console.warn(`   ⚠️  Prompt "${promptName}" not found, skipping link`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error creating module "${moduleData.name}":`, error);
    }
  }

  console.log('\n✨ Treatment modules seeding complete!\n');
  process.exit(0);
}

seedTreatmentModules().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
