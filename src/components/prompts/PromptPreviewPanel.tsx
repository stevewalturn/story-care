'use client';

/**
 * Prompt Preview Panel
 * Shows realistic preview of how JSON Schema will render in the transcript viewer
 * Generates mock data from schema and displays with actual UI styling
 */

import { validatePromptJSON } from '@/utils/PromptJSONValidator';
import { AlertCircle, Eye } from 'lucide-react';
import { SchemaPreviewRenderer } from './SchemaPreviewRenderer';

interface PromptPreviewPanelProps {
  jsonString: string;
}

/**
 * Generate mock data from JSON Schema for preview
 */
function generateMockDataFromSchema(schema: any): any {
  if (!schema.properties || !schema.properties.schemaType?.enum?.[0]) {
    return null;
  }

  const schemaType = schema.properties.schemaType.enum[0];

  switch (schemaType) {
    case 'therapeutic_note':
      return {
        schemaType: 'therapeutic_note',
        title: 'Patient Progress: Week 3',
        content: 'Patient demonstrated significant improvement in emotional regulation this session. Notable themes include increased self-awareness and willingness to engage with difficult emotions.\n\nKey observations:\n- More present and engaged\n- Using coping strategies independently\n- Expressing hope about the future',
        tags: ['progress', 'emotional-regulation', 'self-awareness'],
        keyInsights: [
          'Patient is developing stronger emotional regulation skills',
          'Increased capacity for self-reflection',
        ],
        actionItems: [
          'Continue CBT exercises focusing on thought patterns',
          'Introduce mindfulness practice',
        ],
      };

    case 'image_references':
      return {
        schemaType: 'image_references',
        images: [
          {
            title: 'Breaking Through the Storm',
            prompt: 'A person standing confidently as storm clouds part above them, golden sunlight breaking through, photorealistic style, inspiring and empowering atmosphere',
            style: 'photorealistic',
            therapeutic_purpose: 'Visualizes the patient\'s journey from struggle to strength',
            source_quote: 'I feel like I\'m finally seeing light after the darkness',
          },
          {
            title: 'The Peaceful Garden',
            prompt: 'A serene Japanese garden with a calm pond, cherry blossoms, soft morning light, peaceful and meditative atmosphere',
            style: 'artistic',
            therapeutic_purpose: 'Represents inner peace and emotional regulation',
            source_quote: 'I want to find that quiet place inside myself',
          },
          {
            title: 'Rising Above',
            prompt: 'An individual climbing toward a mountain peak at sunrise, vast landscape below, sense of achievement and possibility, inspirational style',
            style: 'photorealistic',
            therapeutic_purpose: 'Symbolizes personal growth and overcoming challenges',
            source_quote: 'Each day I feel stronger and more capable',
          },
        ],
      };

    case 'video_references':
      return {
        schemaType: 'video_references',
        videos: [
          {
            title: 'Journey Through Seasons',
            prompt: 'A walk through a forest path that transitions from autumn to spring, representing transformation and growth',
            duration: 6,
            style: 'cinematic',
            therapeutic_purpose: 'Represents the patient\'s healing journey and transformation',
            source_quote: 'It feels like moving from darkness into light',
            motion_description: 'Smooth forward tracking shot with gradual environmental change',
          },
          {
            title: 'Ocean of Calm',
            prompt: 'Waves gently lapping at a peaceful shore during golden hour, calming and meditative',
            duration: 5,
            style: 'cinematic',
            therapeutic_purpose: 'Visualization for grounding and emotional regulation',
            source_quote: 'I need to find my center, my calm place',
            motion_description: 'Slow pan across the water with gentle movement',
          },
        ],
      };

    case 'music_generation':
      return {
        schemaType: 'music_generation',
        instrumental_option: {
          title: 'Journey of Resilience',
          mood: 'hopeful, empowering, reflective',
          genre_tags: ['orchestral', 'cinematic'],
          music_description: 'A cinematic piece beginning with gentle piano, building to an empowering crescendo',
          style_prompt: 'Cinematic orchestral music starting soft and building to powerful crescendo',
        },
        lyrical_option: {
          title: 'Reclaiming My Story',
          mood: 'empowering, hopeful, triumphant',
          genre_tags: ['pop-ballad', 'inspirational'],
          suggested_lyrics: '[Verse 1]\nI was lost in the shadows...\n\n[Chorus]\nI\'m stronger than I knew\nBrave enough to start anew',
          style_prompt: 'Empowering pop ballad with strong vocals, building instrumentation',
        },
      };

    case 'scene_card':
      return {
        schemaType: 'scene_card',
        video_introduction: 'This scene visualizes your journey from struggle to strength, honoring both where you\'ve been and where you\'re going.',
        reference_images: [
          {
            stage_name: 'The Challenge',
            title: 'Facing the Storm',
            image_prompt: 'A figure standing strong under dark storm clouds, dramatic lighting',
            meaning: 'Represents the difficulties you\'ve faced with courage',
            patient_quote_anchor: 'I felt overwhelmed but kept going',
          },
          {
            stage_name: 'The Breakthrough',
            title: 'Light Breaking Through',
            image_prompt: 'Rays of light breaking through clouds, hope emerging',
            meaning: 'The moment of recognizing your inner strength',
            patient_quote_anchor: 'I realized I was stronger than I thought',
          },
          {
            stage_name: 'Moving Forward',
            title: 'New Path Ahead',
            image_prompt: 'A clear path forward toward a bright horizon at sunrise',
            meaning: 'Your journey continuing with hope and purpose',
            patient_quote_anchor: 'I can see my way forward now',
          },
        ],
        music: {
          prompt: 'Cinematic orchestral music building from contemplative to triumphant',
          duration_seconds: 90,
        },
        patient_reflection_questions: [
          'What moment in this scene resonates most with you?',
          'How does it feel to see your journey visualized this way?',
          'What would you add to make this story more complete?',
        ],
        group_reflection_questions: [
          'What themes connect our different journeys?',
        ],
        assembly_steps: [
          'Generate all reference images',
          'Create smooth transitions between images',
          'Generate background music',
          'Add reflection questions',
        ],
      };

    case 'scene_suggestions':
      return {
        schemaType: 'scene_suggestions',
        potential_scenes_by_participant: [
          {
            for_patient_name: 'Sarah',
            scenes: [
              {
                scene_title: 'From Darkness to Light',
                scene_description: 'A journey showing Sarah\'s transformation from struggle to empowerment',
                key_quote: 'I\'m learning to see my own strength',
                therapeutic_rationale: 'Reinforces Sarah\'s progress and resilience',
                scene_focus_instruction: 'Emphasize gradual transformation and inner light emerging',
              },
              {
                scene_title: 'Building Resilience',
                scene_description: 'Visualization of Sarah developing coping skills and inner resources',
                key_quote: 'Each day I feel more capable',
                therapeutic_rationale: 'Acknowledges growth and skill development',
                scene_focus_instruction: 'Focus on strength-building and capability',
              },
            ],
          },
          {
            for_patient_name: 'Michael',
            scenes: [
              {
                scene_title: 'Finding Calm',
                scene_description: 'Michael discovering inner peace through mindfulness',
                key_quote: 'I can find peace even in the chaos',
                therapeutic_rationale: 'Reinforces emotional regulation skills',
                scene_focus_instruction: 'Peaceful, grounding imagery',
              },
            ],
          },
        ],
      };

    case 'reflection_questions':
      return {
        schemaType: 'reflection_questions',
        questions: [
          {
            question: 'When you think about your journey, what moments of strength surprise you?',
            rationale: 'Encourages recognition of resilience',
            placement: 'After viewing scene',
          },
          {
            question: 'What does reclaiming your narrative mean to you personally?',
            rationale: 'Promotes personal meaning-making',
            placement: 'Mid-reflection',
          },
          {
            question: 'How can you carry these insights into your daily life?',
            rationale: 'Bridges therapy to real-world application',
            placement: 'Conclusion',
          },
        ],
      };

    case 'quote_extraction':
      return {
        schemaType: 'quote_extraction',
        extracted_quotes: [
          {
            quote_text: 'I don\'t have to be defined by what happened to me',
            speaker: 'Patient',
            context: 'Key moment of separation from trauma identity',
            tags: ['re-authoring', 'agency', 'identity'],
          },
          {
            quote_text: 'I realized I had more strength than I thought',
            speaker: 'Patient',
            context: 'Recognition of existing resilience',
            tags: ['strength', 'resilience', 'self-discovery'],
          },
          {
            quote_text: 'What if I could write the next chapter differently?',
            speaker: 'Patient',
            context: 'Future-oriented agency statement',
            tags: ['agency', 'hope', 'future-focus'],
          },
          {
            quote_text: 'I\'m learning to be gentle with myself',
            speaker: 'Patient',
            context: 'Self-compassion development',
            tags: ['self-compassion', 'growth'],
          },
        ],
      };

    default:
      return null;
  }
}

export function PromptPreviewPanel({ jsonString }: PromptPreviewPanelProps) {
  // Validate and parse JSON
  const validation = validatePromptJSON(jsonString);

  if (!jsonString.trim()) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <Eye className="mx-auto mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm text-gray-500">Enter JSON to see preview</p>
        </div>
      </div>
    );
  }

  if (!validation.isValid) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="mb-3 flex items-center gap-2 font-medium text-red-800">
            <AlertCircle className="h-5 w-5" />
            Cannot preview - JSON has errors
          </div>
          <ul className="space-y-1 text-sm text-red-700">
            {validation.errors.map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-red-600">
            Fix the errors in the Edit tab to see the preview
          </p>
        </div>
      </div>
    );
  }

  // Parse JSON for rendering
  let jsonData: any;
  try {
    jsonData = JSON.parse(jsonString);
  }
  catch {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">Failed to parse JSON</p>
        </div>
      </div>
    );
  }

  // Check if this is a JSON Schema definition (has type and properties at root)
  const isJsonSchema = jsonData.type === 'object' && jsonData.properties;

  if (isJsonSchema) {
    // Generate mock data from schema
    const mockData = generateMockDataFromSchema(jsonData);

    if (!mockData) {
      return (
        <div className="p-6">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">Cannot generate preview for this schema type</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col">
        {/* Schema Header */}
        <div className="border-b border-gray-200 bg-blue-50 px-6 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
            <Eye className="h-4 w-4" />
            JSON Schema Preview - How Output Will Render
          </div>
          <p className="mt-1 text-xs text-blue-700">
            This shows how the AI's response will appear in the transcript viewer with action buttons
          </p>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-2xl">
            <SchemaPreviewRenderer data={mockData} />
          </div>
        </div>

        {/* Schema Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
          <p className="text-xs text-gray-600">
            💡 Preview Mode: This shows mock data based on your schema. Buttons are disabled in preview.
          </p>
        </div>
      </div>
    );
  }

  // Handle non-schema JSON (shouldn't happen in this context)
  return (
    <div className="p-6">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-600">This appears to be output data, not a JSON Schema</p>
      </div>
    </div>
  );
}
