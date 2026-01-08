'use client';

/**
 * Prompt Block Builder Component
 * Main orchestrating component for the drag-and-drop prompt builder
 */

import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ArrowLeft, Code, Eye, FileText, Save, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';
import type { BlockInstance } from '@/config/PromptBuilderBlocks';
import {
  ALL_BLOCKS,
  createBlockInstance,
  getBlockDefinition,
} from '@/config/PromptBuilderBlocks';
import { JSONOutputRenderer } from '@/components/sessions/JSONOutputRenderer';
import type { JSONSchemaType } from '@/types/JSONSchemas';
import { BlockPalette } from './BlockPalette';
import { BlockPropertyPanel } from './BlockPropertyPanel';
import { BuilderCanvas } from './BuilderCanvas';

type PromptCategory = 'analysis' | 'creative' | 'extraction' | 'reflection';
type BuilderTab = 'basic' | 'content' | 'preview' | 'json';

type PromptBlockBuilderProps = {
  mode?: 'create' | 'edit';
  promptId?: string;
  initialName?: string;
  initialDescription?: string;
  initialCategory?: PromptCategory;
  initialBlocks?: BlockInstance[];
};

export function PromptBlockBuilder({
  mode = 'create',
  promptId,
  initialName = '',
  initialDescription = '',
  initialCategory = 'creative',
  initialBlocks = [],
}: PromptBlockBuilderProps) {
  const { user } = useAuth();
  const router = useRouter();

  // Basic info state
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState<PromptCategory>(initialCategory);
  const [isLoading, setIsLoading] = useState(mode === 'edit');

  // Builder state
  const [blocks, setBlocks] = useState<BlockInstance[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<BuilderTab>('content');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isOver, setIsOver] = useState(false);

  // Save state
  const [isSaving, setIsSaving] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Load prompt data when editing
  useEffect(() => {
    if (mode === 'edit' && promptId && user) {
      loadPromptData();
    }
  }, [mode, promptId, user]);

  const loadPromptData = async () => {
    if (!user || !promptId) return;

    setIsLoading(true);
    try {
      const response = await authenticatedFetch(`/api/therapist/prompts/${promptId}`, user);
      if (!response.ok) {
        throw new Error('Failed to load prompt');
      }

      const data = await response.json();
      const prompt = data.prompt;

      // Set basic info
      setName(prompt.name || '');
      setDescription(prompt.description || '');
      setCategory(prompt.category || 'creative');

      // Convert stored blocks to BlockInstance format
      if (prompt.blocks && Array.isArray(prompt.blocks)) {
        const loadedBlocks: BlockInstance[] = prompt.blocks.map((block: any, index: number) => ({
          id: `block-${Date.now()}-${index}`,
          blockType: block.blockType,
          values: block.values || {},
          order: block.order ?? index,
          customFieldPrompts: block.customFieldPrompts || {},
          customSystemPrompt: block.customSystemPrompt || undefined,
        }));
        setBlocks(loadedBlocks);
      }
    } catch (error) {
      console.error('Error loading prompt:', error);
      toast.error('Failed to load prompt');
      router.push('/therapist/prompt-library');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedBlock = selectedBlockId
    ? blocks.find(b => b.id === selectedBlockId) || null
    : null;

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setIsOver(over?.id === 'canvas');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setIsOver(false);

    if (!over) return;

    // Check if dragging from palette
    const isPaletteBlock = (active.id as string).startsWith('palette-');

    if (isPaletteBlock) {
      // Add new block from palette
      const blockType = active.data.current?.blockType;
      if (blockType && over.id === 'canvas') {
        const newBlock = createBlockInstance(blockType);
        if (newBlock) {
          newBlock.order = blocks.length;
          setBlocks([...blocks, newBlock]);
          setSelectedBlockId(newBlock.id);
        }
      }
    } else {
      // Reorder existing blocks
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newBlocks = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({
          ...b,
          order: i,
        }));
        setBlocks(newBlocks);
      }
    }
  };

  // Block handlers
  const handleDeleteBlock = (blockId: string) => {
    setBlocks(blocks.filter(b => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const handleUpdateBlock = (blockId: string, values: Record<string, any>) => {
    setBlocks(blocks.map(b =>
      b.id === blockId ? { ...b, values } : b,
    ));
  };

  const handleUpdateFieldPrompt = (blockId: string, fieldId: string, prompt: string) => {
    setBlocks(blocks.map(b =>
      b.id === blockId
        ? {
            ...b,
            customFieldPrompts: {
              ...b.customFieldPrompts,
              [fieldId]: prompt,
            },
          }
        : b,
    ));
  };

  const handleUpdateSystemPrompt = (blockId: string, systemPrompt: string) => {
    setBlocks(blocks.map(b =>
      b.id === blockId
        ? {
            ...b,
            customSystemPrompt: systemPrompt || undefined,
          }
        : b,
    ));
  };

  const handleAddBlockClick = () => {
    // Show palette (could be a modal, for now just select first block type)
    // For now, let's add a text block by default
    const newBlock = createBlockInstance('text');
    if (newBlock) {
      newBlock.order = blocks.length;
      setBlocks([...blocks, newBlock]);
      setSelectedBlockId(newBlock.id);
    }
  };

  // Generate JSON schema from blocks
  const generateJSONSchema = () => {
    const schema: any = {
      type: 'object',
      properties: {
        schemaType: { type: 'string', enum: ['composite_prompt'] },
        blocks: {
          type: 'array',
          items: blocks.map(block => {
            const definition = getBlockDefinition(block.blockType);
            if (!definition) return { type: 'object' };

            // Build schema for this block
            const blockSchema: any = {
              type: 'object',
              properties: {
                blockType: { type: 'string', enum: [block.blockType] },
              },
              required: ['blockType'],
            };

            // Add field schemas
            for (const field of definition.fields) {
              let fieldSchema: any = { type: 'string' };
              if (field.type === 'number') {
                fieldSchema = { type: 'number' };
              } else if (field.type === 'boolean') {
                fieldSchema = { type: 'boolean' };
              }
              blockSchema.properties[field.id] = fieldSchema;
              if (field.required) {
                blockSchema.required.push(field.id);
              }
            }

            return blockSchema;
          }),
        },
      },
      required: ['schemaType', 'blocks'],
    };

    return schema;
  };

  // Generate system prompt from all blocks and their field prompts
  const generateSystemPrompt = () => {
    if (blocks.length === 0) return '';

    let systemPrompt = `Analyze the therapy transcript and generate structured output for the following sections:\n\n`;

    for (const block of blocks) {
      const definition = getBlockDefinition(block.blockType);
      if (!definition) continue;

      // Only include AI blocks in system prompt (they have schema types)
      if (definition.category !== 'ai') continue;

      systemPrompt += `## ${definition.label}\n`;
      if (definition.description) {
        systemPrompt += `${definition.description}\n\n`;
      }

      systemPrompt += `Generate the following fields:\n\n`;

      for (const field of definition.fields) {
        // Get custom prompt if set, otherwise use default
        const fieldPrompt = block.customFieldPrompts?.[field.id] ?? field.fieldPrompt;

        if (fieldPrompt) {
          systemPrompt += `**${field.label}**${field.required ? ' (Required)' : ''}:\n`;
          systemPrompt += `${fieldPrompt}\n\n`;
        } else {
          // For fields without prompts, just mention them
          systemPrompt += `**${field.label}**${field.required ? ' (Required)' : ''}\n\n`;
        }
      }

      systemPrompt += `---\n\n`;
    }

    systemPrompt += `CRITICAL INSTRUCTIONS:\n`;
    systemPrompt += `1. Output ONLY valid JSON matching the schema structure.\n`;
    systemPrompt += `2. Do NOT include any text before or after the JSON.\n`;
    systemPrompt += `3. Ensure all required fields are present.\n`;
    systemPrompt += `4. Base all content on the actual therapy transcript provided.\n`;
    systemPrompt += `5. Maintain therapeutic sensitivity and professional language.\n`;

    return systemPrompt;
  };

  // Save prompt
  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      toast.error('Please enter a prompt name');
      setActiveTab('basic');
      return;
    }

    if (blocks.length === 0) {
      toast.error('Please add at least one block');
      setActiveTab('content');
      return;
    }

    setIsSaving(true);
    const isEditing = mode === 'edit';
    const toastId = toast.loading(isEditing ? 'Updating prompt...' : 'Saving prompt...');

    try {
      const jsonSchema = generateJSONSchema();
      const systemPrompt = generateSystemPrompt();

      const requestBody = {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        icon: 'sparkles',
        outputType: 'json',
        jsonSchema,
        systemPrompt,
        blocks: blocks.map(b => ({
          blockType: b.blockType,
          values: b.values,
          order: b.order,
          customFieldPrompts: b.customFieldPrompts,
          customSystemPrompt: b.customSystemPrompt,
        })),
      };

      const endpoint = isEditing
        ? `/api/therapist/prompts/${promptId}`
        : '/api/therapist/prompts';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await authenticatedFetch(endpoint, user, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save prompt');
      }

      toast.success(isEditing ? 'Prompt updated successfully!' : 'Prompt created successfully!', { id: toastId });
      router.push('/therapist/prompt-library');
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save prompt',
        { id: toastId },
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Get drag overlay content
  const getDragOverlayContent = () => {
    if (!activeId) return null;

    if (activeId.startsWith('palette-')) {
      const blockType = activeId.replace('palette-', '');
      const block = ALL_BLOCKS.find(b => b.id === blockType);
      if (!block) return null;

      const Icon = block.icon;
      return (
        <div className="flex items-center gap-2 rounded-lg border border-purple-300 bg-white px-4 py-2 shadow-lg">
          <Icon className="h-5 w-5 text-purple-600" />
          <span className="text-sm font-medium text-gray-900">{block.label}</span>
        </div>
      );
    }

    return null;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent mx-auto" />
          <p className="text-gray-600">Loading prompt...</p>
        </div>
      </div>
    );
  }

  // Generate sample output for preview based on schema type
  const generateSampleOutput = (schemaType: string): { schemaType: JSONSchemaType } & Record<string, any> | null => {
    switch (schemaType) {
      case 'image_references':
        return {
          schemaType: 'image_references',
          images: [
            {
              title: 'Sample Image 1',
              prompt: 'A serene landscape with rolling hills and a peaceful river, symbolizing the journey of self-discovery',
              style: 'Watercolor painting style',
              therapeutic_purpose: 'This image represents the patient\'s journey toward inner peace and self-acceptance',
              source_quote: 'I feel like I\'m finally starting to understand who I am',
            },
            {
              title: 'Sample Image 2',
              prompt: 'A bridge connecting two mountains at sunset, representing connection and transition',
              style: 'Impressionist art style',
              therapeutic_purpose: 'Visualizes the patient\'s progress in building meaningful connections',
              source_quote: 'It\'s like I\'m building a bridge to my future self',
            },
          ],
        };

      case 'video_references':
        return {
          schemaType: 'video_references',
          videos: [
            {
              title: 'Journey Forward',
              prompt: 'A path through a forest that gradually opens into a sunlit meadow',
              duration: 5,
              style: 'Cinematic nature footage',
              therapeutic_purpose: 'Represents the patient\'s progress from uncertainty to clarity',
              source_quote: 'I can finally see where I\'m going',
              motion_description: 'Slow dolly forward through the trees',
            },
            {
              title: 'Inner Strength',
              prompt: 'A small plant growing through concrete into the sunlight',
              duration: 5,
              style: 'Time-lapse nature footage',
              therapeutic_purpose: 'Symbolizes resilience and personal growth',
              source_quote: 'Even when things were hard, something inside me kept growing',
              motion_description: 'Time-lapse growth with gentle zoom',
            },
          ],
        };

      case 'music_generation':
        return {
          schemaType: 'music_generation',
          instrumental_option: {
            title: 'Peaceful Journey',
            mood: 'Hopeful',
            music_description: 'A gentle piano melody with soft strings, building to an uplifting crescendo',
            rationale: 'Reflects the patient\'s emotional progression from struggle to hope',
            genre_tags: ['Ambient', 'Piano', 'Orchestral'],
            style_prompt: 'Peaceful piano with soft strings, gradual build',
          },
          lyrical_option: {
            title: 'Finding My Way',
            mood: 'Reflective',
            music_description: 'A folk-inspired ballad with acoustic guitar and thoughtful lyrics',
            suggested_lyrics: 'Through the shadows I have walked\nLearning lessons left unspoken\nNow I see the path ahead\nWith each step my spirit\'s woken',
            rationale: 'Captures the patient\'s journey of self-discovery in their own words',
            genre_tags: ['Folk', 'Acoustic', 'Singer-Songwriter'],
          },
        };

      case 'therapeutic_scene_card':
        return {
          schemaType: 'therapeutic_scene_card',
          scenes: [
            {
              scene_title: 'The Garden of Growth',
              scene_description: 'A therapeutic visualization of personal growth through the metaphor of a nurturing garden',
              key_quote: 'Every day I\'m planting seeds for my future',
              sections: {
                opening: { text: 'Welcome to your garden of growth...' },
                reflection: { text: 'Take a moment to consider what you\'ve planted...' },
                closing: { text: 'As you leave this space, carry these insights with you...' },
              },
            },
          ],
        };

      case 'quote_extraction':
        return {
          schemaType: 'quote_extraction',
          extracted_quotes: [
            {
              quote_text: 'I finally feel like I\'m becoming the person I was meant to be',
              speaker: 'Patient',
              patient_name: 'Sample Patient',
              context: 'During discussion of recent personal growth',
              tags: ['growth', 'identity', 'progress'],
            },
            {
              quote_text: 'The hardest part was learning to be kind to myself',
              speaker: 'Patient',
              patient_name: 'Sample Patient',
              context: 'Reflecting on therapy journey',
              tags: ['self-compassion', 'learning', 'reflection'],
            },
            {
              quote_text: 'I used to think I had to be perfect, but now I know I just have to be me',
              speaker: 'Patient',
              patient_name: 'Sample Patient',
              context: 'Key insight about perfectionism',
              tags: ['perfectionism', 'self-acceptance', 'insight'],
            },
          ],
        };

      case 'reflection_questions':
        return {
          schemaType: 'reflection_questions',
          questions: [
            {
              question: 'What small step could you take today to move closer to your goal?',
              rationale: 'Encourages actionable progress while maintaining achievable expectations',
              placement: 'After video segment',
            },
            {
              question: 'How has your perspective on this challenge changed over time?',
              rationale: 'Promotes recognition of personal growth and shifting viewpoints',
              placement: 'Mid-reflection',
            },
            {
              question: 'What strength did you discover in yourself during this experience?',
              rationale: 'Highlights resilience and personal resources',
              placement: 'Closing reflection',
            },
          ],
        };

      case 'therapeutic_note':
        return {
          schemaType: 'therapeutic_note',
          note_title: 'Session Summary: Progress in Self-Acceptance',
          note_content: `## Key Observations

The patient demonstrated significant progress in their journey toward self-acceptance. They shared meaningful insights about:

- **Recognizing negative self-talk patterns** and beginning to challenge them
- **Building self-compassion** through daily mindfulness practice
- **Celebrating small victories** rather than focusing solely on goals not yet achieved

## Therapeutic Interventions Used

1. Cognitive restructuring exercises
2. Guided visualization
3. Strength-based reflection

## Recommendations for Next Session

Continue exploring the relationship between perfectionism and self-worth. Consider introducing journaling exercises to track progress.`,
          key_themes: ['self-acceptance', 'growth', 'mindfulness'],
          tags: ['progress note', 'CBT', 'self-compassion'],
        };

      default:
        return null;
    }
  };

  const isEditing = mode === 'edit';

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen flex-col bg-gray-50">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/therapist/prompt-library"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit Prompt' : 'Create New Prompt'}
              </h1>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Modify your prompt template' : 'Drag blocks to build your prompt template'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : isEditing ? 'Update' : 'Compile & Save'}
          </button>
        </header>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white px-6">
          <nav className="flex gap-6">
            {[
              { id: 'basic' as BuilderTab, label: 'Basic', icon: Settings },
              { id: 'content' as BuilderTab, label: 'Content', icon: FileText },
              { id: 'preview' as BuilderTab, label: 'Preview', icon: Eye },
              { id: 'json' as BuilderTab, label: 'JSON', icon: Code },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'basic' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="mx-auto max-w-2xl space-y-6">
                <div>
                  <label htmlFor="promptName" className="mb-2 block text-sm font-medium text-gray-700">
                    Prompt Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="promptName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Generate Therapeutic Imagery"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                    maxLength={255}
                  />
                </div>

                <div>
                  <label htmlFor="category" className="mb-2 block text-sm font-medium text-gray-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PromptCategory)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                  >
                    <option value="analysis">Analysis</option>
                    <option value="creative">Creative</option>
                    <option value="extraction">Extraction</option>
                    <option value="reflection">Reflection</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this prompt does..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                    maxLength={500}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="flex h-full">
              {/* Left Sidebar - Block Palette */}
              <div className="w-64 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-4">
                <h2 className="mb-4 text-sm font-semibold text-gray-900">Blocks</h2>
                <BlockPalette />
              </div>

              {/* Center - Canvas */}
              <div className="flex-1 overflow-y-auto p-6">
                <BuilderCanvas
                  blocks={blocks}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={setSelectedBlockId}
                  onDeleteBlock={handleDeleteBlock}
                  onAddBlockClick={handleAddBlockClick}
                  isOver={isOver}
                  activeId={activeId}
                />
              </div>

              {/* Right Sidebar - Property Panel */}
              <div className="w-80 flex-shrink-0 overflow-y-auto border-l border-gray-200 bg-white">
                <BlockPropertyPanel
                  block={selectedBlock}
                  onUpdate={handleUpdateBlock}
                  onUpdateFieldPrompt={handleUpdateFieldPrompt}
                  onUpdateSystemPrompt={handleUpdateSystemPrompt}
                  onClose={() => setSelectedBlockId(null)}
                />
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="mx-auto max-w-3xl">
                {blocks.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">Preview</h2>
                    <p className="text-sm text-gray-500">No blocks to preview. Add some blocks first.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                      <h2 className="mb-2 text-lg font-semibold text-purple-900">Output Preview</h2>
                      <p className="text-sm text-purple-700">
                        This preview shows how the AI-generated output will appear in the chat.
                        Sample data is used for demonstration purposes.
                      </p>
                    </div>

                    {blocks.map((block) => {
                      const definition = getBlockDefinition(block.blockType);
                      if (!definition) return null;

                      // Only render preview for AI blocks with schema types
                      if (definition.category !== 'ai' || !definition.schemaType) {
                        return (
                          <div key={block.id} className="rounded-lg border border-gray-200 bg-white p-4">
                            <div className="mb-2 flex items-center gap-2">
                              <definition.icon className="h-4 w-4 text-gray-600" />
                              <span className="text-sm font-medium text-gray-700">{definition.label}</span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Non-AI block - no preview available
                            </p>
                          </div>
                        );
                      }

                      const sampleOutput = generateSampleOutput(definition.schemaType);
                      if (!sampleOutput) {
                        return (
                          <div key={block.id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <div className="mb-2 flex items-center gap-2">
                              <definition.icon className="h-4 w-4 text-amber-600" />
                              <span className="text-sm font-medium text-amber-700">{definition.label}</span>
                            </div>
                            <p className="text-xs text-amber-600">
                              Preview not available for schema type: {definition.schemaType}
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div key={block.id} className="space-y-2">
                          <div className="flex items-center gap-2 px-1">
                            <definition.icon className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-700">{definition.label}</span>
                            <span className="rounded bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                              {definition.schemaType}
                            </span>
                          </div>
                          <JSONOutputRenderer
                            jsonData={sampleOutput as any}
                            previewMode={true}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="mx-auto max-w-4xl space-y-6">
                {/* Generated System Prompt */}
                <div className="rounded-lg border border-purple-200 bg-purple-50">
                  <div className="border-b border-purple-200 px-4 py-3">
                    <h2 className="text-sm font-medium text-purple-900">Generated System Prompt (AI Instructions)</h2>
                    <p className="text-xs text-purple-600 mt-1">
                      This is the compiled prompt that tells the AI how to generate each field
                    </p>
                  </div>
                  <pre className="overflow-auto p-4 text-xs text-purple-800 whitespace-pre-wrap">
                    {generateSystemPrompt() || 'Add AI blocks to generate a system prompt'}
                  </pre>
                </div>

                {/* JSON Schema */}
                <div className="rounded-lg border border-gray-200 bg-white">
                  <div className="border-b border-gray-200 px-4 py-3">
                    <h2 className="text-sm font-medium text-gray-900">Generated JSON Schema</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      The structure defining the expected output format
                    </p>
                  </div>
                  <pre className="overflow-auto p-4 text-xs text-gray-700">
                    {JSON.stringify(generateJSONSchema(), null, 2)}
                  </pre>
                </div>

                {/* Block Data */}
                <div className="rounded-lg border border-gray-200 bg-white">
                  <div className="border-b border-gray-200 px-4 py-3">
                    <h2 className="text-sm font-medium text-gray-900">Block Data</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Raw block configuration including custom field prompts
                    </p>
                  </div>
                  <pre className="overflow-auto p-4 text-xs text-gray-700">
                    {JSON.stringify(blocks, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>{getDragOverlayContent()}</DragOverlay>
    </DndContext>
  );
}
