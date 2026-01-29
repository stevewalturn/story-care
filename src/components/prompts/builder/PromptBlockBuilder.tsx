'use client';

/**
 * Prompt Block Builder Component
 * Main orchestrating component for the drag-and-drop prompt builder
 */

import type { BlockInstance } from '@/config/PromptBuilderBlocks';
import type { JSONSchemaType } from '@/types/JSONSchemas';
import { ChevronDown, ChevronUp, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  createBlockInstance,
  getBlockDefinition,
} from '@/config/PromptBuilderBlocks';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';
import { BlockPalette } from './BlockPalette';
import { GenericJSONPreview } from './GenericJSONPreview';

type PromptCategory = 'analysis' | 'creative' | 'extraction' | 'reflection';

type PromptBlockBuilderProps = {
  mode?: 'create' | 'edit';
  promptId?: string;
  scope?: 'private' | 'organization' | 'system'; // Determines API endpoint
  initialName?: string;
  initialDescription?: string;
  initialCategory?: PromptCategory;
};

// ============================================================================
// Helper Functions for Dynamic Preview Generation
// ============================================================================

/**
 * Generate sample value for a custom OutputField
 */
function generateSampleValueForField(field: any): any {
  const { config } = field;
  const { type, name, label, exampleOutput, arrayItemType, nestedFields, enumValues, children } = config;

  // Use example output if provided
  if (exampleOutput) {
    return exampleOutput;
  }

  // Handle different types
  switch (type) {
    case 'string':
      if (enumValues && enumValues.length > 0) {
        return enumValues[0];
      }
      return `Sample ${label || name}`;

    case 'number':
    case 'integer':
      return config.minimum || 1;

    case 'boolean':
      return true;

    case 'array':
      if (children && children.length > 0) {
        // Generate array with items based on children fields (3 sample items)
        return [
          generateObjectFromFields(children),
          generateObjectFromFields(children),
          generateObjectFromFields(children),
        ];
      } else if (arrayItemType === 'string') {
        return [`Sample ${name} item 1`, `Sample ${name} item 2`];
      } else if (arrayItemType === 'number') {
        return [1, 2, 3];
      } else if (arrayItemType === 'object') {
        // Generate sample objects even without defined structure
        if (nestedFields && nestedFields.length > 0) {
          return [
            generateObjectFromFields(nestedFields),
            generateObjectFromFields(nestedFields),
            generateObjectFromFields(nestedFields),
          ];
        } else {
          // Generic object sample when structure not defined
          return [
            { item: `Sample ${label || name} 1`, value: 'Sample value 1' },
            { item: `Sample ${label || name} 2`, value: 'Sample value 2' },
            { item: `Sample ${label || name} 3`, value: 'Sample value 3' },
          ];
        }
      }
      return [];

    case 'object':
      if (nestedFields && nestedFields.length > 0) {
        return generateObjectFromFields(nestedFields);
      }
      return {};

    default:
      return null;
  }
}

/**
 * Generate sample value from JSON schema definition
 */
function generateSampleValueFromSchema(fieldName: string, fieldSchema: any): any {
  const fieldType = fieldSchema.type;
  const displayName = fieldName.replace(/_/g, ' ');

  if (fieldType === 'string') {
    if (fieldSchema['x-ai-prompt']) {
      return `Sample ${displayName}`;
    } else if (fieldSchema.enum) {
      return fieldSchema.enum[0];
    } else {
      return `Sample ${displayName}`;
    }
  } else if (fieldType === 'array') {
    const itemSchema = fieldSchema.items || {};
    if (itemSchema.type === 'object') {
      return [generateObjectFromSchema(itemSchema)];
    } else if (itemSchema.type === 'string') {
      return [`${displayName} 1`, `${displayName} 2`];
    }
    return [];
  } else if (fieldType === 'object') {
    return generateObjectFromSchema(fieldSchema);
  } else if (fieldType === 'number' || fieldType === 'integer') {
    return fieldSchema.minimum || 1;
  } else if (fieldType === 'boolean') {
    return true;
  }

  return null;
}

/**
 * Generate object from array of OutputFields
 */
function generateObjectFromFields(fields: any[]): any {
  const obj: any = {};
  fields.forEach((field) => {
    obj[field.config.name] = generateSampleValueForField(field);
  });
  return obj;
}

/**
 * Generate object from JSON schema
 */
function generateObjectFromSchema(objectSchema: any): any {
  const obj: any = {};
  const properties = objectSchema.properties || {};
  Object.keys(properties).forEach((key) => {
    const propSchema = properties[key];
    obj[key] = generateSampleValueFromSchema(key, propSchema);
  });
  return obj;
}

/**
 * Generate dynamic sample output based on block definition's JSON schema
 * Always uses the predefined schema from BlockDefinition
 */
function generateDynamicSampleOutput(block: BlockInstance): { schemaType: JSONSchemaType } & Record<string, any> | null {
  const definition = getBlockDefinition(block.blockType);
  if (!definition || !definition.schemaType) return null;

  const baseOutput: any = { schemaType: definition.schemaType };

  // Always use the definition's JSON schema (no custom fields)
  const jsonSchema = definition.jsonSchema as any;
  if (!jsonSchema || !jsonSchema.properties) {
    return null; // No schema available
  }

  const properties = jsonSchema.properties;

  // Generate sample data from each property in the JSON schema
  Object.keys(properties).forEach((fieldName) => {
    if (fieldName === 'schemaType') return; // Skip schemaType
    const fieldSchema = properties[fieldName];
    baseOutput[fieldName] = generateSampleValueFromSchema(fieldName, fieldSchema);
  });

  return baseOutput;
}

// ============================================================================
// Main Component
// ============================================================================

export function PromptBlockBuilder({
  mode = 'create',
  promptId,
  scope = 'private',
  initialName = '',
  initialDescription = '',
  initialCategory = 'creative',
}: PromptBlockBuilderProps) {
  const { user } = useAuth();
  const router = useRouter();

  // Basic info state
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState<PromptCategory>(initialCategory);
  const [icon, setIcon] = useState('sparkles');
  const [outputType, setOutputType] = useState<'text' | 'json'>('json');
  const [textModeSystemPrompt, setTextModeSystemPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(mode === 'edit');

  // Builder state - Single block selection
  const [selectedBlockType, setSelectedBlockType] = useState<string | null>(null);
  const [blockInstance, setBlockInstance] = useState<BlockInstance | null>(null);

  // UI state
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Save state
  const [isSaving, setIsSaving] = useState(false);

  // Load prompt data when editing
  useEffect(() => {
    if (mode === 'edit' && promptId && user) {
      loadPromptData();
    }
  }, [mode, promptId, user]);

  // Migrate legacy prompts (created before block builder) to block format
  const migrateLegacyPromptToBlocks = (prompt: any): BlockInstance[] => {
    console.log('[Migration] Starting for prompt:', prompt.id);
    console.log('[Migration] jsonSchema:', prompt.jsonSchema);

    // Extract schema type from jsonSchema
    let schemaType: string | null = null;
    try {
      const schema = typeof prompt.jsonSchema === 'string'
        ? JSON.parse(prompt.jsonSchema)
        : prompt.jsonSchema;
      schemaType = schema?.schemaType || schema?.properties?.schemaType?.enum?.[0];
      console.log('[Migration] Extracted schemaType:', schemaType);
    } catch (e) {
      console.error('[Migration] Failed to parse jsonSchema:', e);
      toast.error('Invalid prompt schema format');
      return [];
    }

    if (!schemaType) {
      console.error('[Migration] No schemaType found in jsonSchema');
      toast.error('Prompt missing schema type');
      return [];
    }

    // Use schemaType directly as block type (no mapping needed)
    console.log('[Migration] Creating block with type:', schemaType);
    const blockInstance = createBlockInstance(schemaType);

    if (!blockInstance) {
      console.error('[Migration] Failed to create block instance for type:', schemaType);
      toast.error(`Unknown block type: ${schemaType}`);
      return [];
    }

    // Preserve legacy systemPrompt
    if (prompt.systemPrompt) {
      blockInstance.customSystemPrompt = prompt.systemPrompt;
    }

    console.log('[Migration] Success! Created block:', blockInstance);
    return [blockInstance];
  };

  const loadPromptData = async () => {
    if (!user || !promptId) return;

    setIsLoading(true);
    try {
      // Use correct API endpoint based on scope
      const endpoint = scope === 'system'
        ? `/api/super-admin/prompts/${promptId}`
        : `/api/therapist/prompts/${promptId}`;

      const response = await authenticatedFetch(endpoint, user);
      if (!response.ok) {
        throw new Error('Failed to load prompt');
      }

      const data = await response.json();
      const prompt = data.prompt;

      // Set basic info
      setName(prompt.name || '');
      setDescription(prompt.description || '');
      setCategory(prompt.category || 'creative');
      setIcon(prompt.icon || 'sparkles');
      setOutputType(prompt.outputType || 'json');

      // Load system prompt for text mode
      if (prompt.outputType === 'text' && prompt.systemPrompt) {
        setTextModeSystemPrompt(prompt.systemPrompt);
      }

      // Load single block (take first block if multiple exist)
      if (prompt.blocks && Array.isArray(prompt.blocks) && prompt.blocks.length > 0) {
        const firstBlock: any = prompt.blocks[0];
        if (firstBlock) {
          const loadedBlock: BlockInstance = {
            id: `block-${Date.now()}`,
            blockType: firstBlock.blockType,
            values: firstBlock.values || {},
            order: 0,
            customSystemPrompt: firstBlock.customSystemPrompt || undefined,
          };

          setBlockInstance(loadedBlock);
          setSelectedBlockType(firstBlock.blockType);

          // Warn if multiple blocks were found
          if (prompt.blocks.length > 1) {
            toast('This prompt had multiple blocks. Only the first block was loaded.', {
              icon: '⚠️',
            });
          }
        }
      } else if (prompt.jsonSchema) {
        // Legacy format - migrate to block structure
        console.log('Migrating legacy prompt to block format');
        const migratedBlocks = migrateLegacyPromptToBlocks(prompt);

        if (migratedBlocks.length === 0) {
          toast.error('Failed to migrate legacy prompt. Please contact support.');
          console.error('Migration failed for prompt:', prompt.id, prompt.jsonSchema);
        } else {
          // Take first migrated block
          const firstBlock = migratedBlocks[0];
          if (firstBlock) {
            setBlockInstance(firstBlock);
            setSelectedBlockType(firstBlock.blockType);
            toast.success('Legacy prompt migrated to block format');
          }
        }
      }
    } catch (error) {
      console.error('Error loading prompt:', error);
      toast.error('Failed to load prompt');
      // Redirect to appropriate page based on scope
      const redirectPath = scope === 'system'
        ? '/super-admin/prompts'
        : '/therapist/prompt-library';
      router.push(redirectPath);
    } finally {
      setIsLoading(false);
    }
  };

  // Block selection handler
  const handleSelectBlock = (blockType: string) => {
    setSelectedBlockType(blockType);
    const newBlock = createBlockInstance(blockType);
    if (newBlock) {
      newBlock.order = 0; // Always single block
      setBlockInstance(newBlock);
    }
  };

  // Block update handlers
  const handleUpdateSystemPrompt = (systemPrompt: string) => {
    if (blockInstance) {
      setBlockInstance({
        ...blockInstance,
        customSystemPrompt: systemPrompt || undefined,
      });
    }
  };

  // Generate JSON schema from single block
  const generateJSONSchema = (): object => {
    if (!blockInstance) return {};

    const definition = getBlockDefinition(blockInstance.blockType);
    if (!definition?.jsonSchema) return {};

    // Return the predefined schema for this block type
    return definition.jsonSchema;
  };

  // Generate system prompt from single block
  const generateSystemPrompt = (): string => {
    if (!blockInstance) return '';

    const definition = getBlockDefinition(blockInstance.blockType);
    if (!definition) return '';

    // Use custom prompt if provided, otherwise use default
    return blockInstance.customSystemPrompt || definition.defaultSystemPrompt || '';
  };

  // Save prompt
  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      toast.error('Please enter a prompt name');
      return;
    }

    // Validate based on output type
    if (outputType === 'json') {
      if (!blockInstance) {
        toast.error('Please select an output type');
        return;
      }
    } else if (outputType === 'text') {
      if (!textModeSystemPrompt.trim()) {
        toast.error('Please enter a system prompt');
        return;
      }
    }

    setIsSaving(true);
    const isEditing = mode === 'edit';
    const toastId = toast.loading(isEditing ? 'Updating prompt...' : 'Saving prompt...');

    try {
      let requestBody: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        icon,
        outputType,
      };

      if (outputType === 'json') {
        // JSON mode: use single block
        requestBody = {
          ...requestBody,
          systemPrompt: generateSystemPrompt(),
          jsonSchema: generateJSONSchema(),
          blocks: blockInstance ? [{
            blockType: blockInstance.blockType,
            values: blockInstance.values,
            order: blockInstance.order,
            customSystemPrompt: blockInstance.customSystemPrompt,
          }] : [],
        };
      } else {
        // Text mode: use custom system prompt
        requestBody = {
          ...requestBody,
          systemPrompt: textModeSystemPrompt.trim(),
          jsonSchema: null,
          blocks: [],
        };
      }

      // Use correct API endpoint based on scope
      const baseEndpoint = scope === 'system'
        ? '/api/super-admin/prompts'
        : '/api/therapist/prompts';

      const endpoint = isEditing
        ? `${baseEndpoint}/${promptId}`
        : baseEndpoint;
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

      // Redirect to appropriate page based on scope
      const redirectPath = scope === 'system'
        ? '/super-admin/prompts'
        : '/therapist/prompt-library';
      router.push(redirectPath);
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

  const isEditing = mode === 'edit';

  // Memoize preview data - MUST be called before any early returns (React hooks rule)
  const previewData = useMemo(() => {
    if (!blockInstance) return null;

    const definition = getBlockDefinition(blockInstance.blockType);
    if (!definition) return null;

    return {
      definition,
      sampleOutput: generateDynamicSampleOutput(blockInstance),
    };
  }, [blockInstance]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="text-gray-600">Loading prompt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Prompt' : 'Create New Prompt'}
          </h1>
          <p className="text-sm text-gray-500">
            {isEditing ? 'Modify your prompt template' : 'Configure your AI prompt template'}
          </p>
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">

          {/* SECTION 1: Basic Information */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Basic Information
            </h2>
            <div className="space-y-6">
              {/* Prompt Name */}
              <div>
                <label htmlFor="promptName" className="mb-2 block text-sm font-medium text-gray-700">
                  Prompt Name
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="promptName"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Generate Therapeutic Imagery"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                  maxLength={255}
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="mb-2 block text-sm font-medium text-gray-700">
                  Category
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={e => setCategory(e.target.value as PromptCategory)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                >
                  <option value="analysis">Analysis</option>
                  <option value="creative">Creative</option>
                  <option value="extraction">Extraction</option>
                  <option value="reflection">Reflection</option>
                </select>
              </div>

              {/* Icon Selector */}
              <div>
                <label htmlFor="icon" className="mb-2 block text-sm font-medium text-gray-700">
                  Icon
                </label>
                <select
                  id="icon"
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                >
                  <option value="sparkles">✨ Sparkles</option>
                  <option value="target">🎯 Target</option>
                  <option value="lightbulb">💡 Lightbulb</option>
                  <option value="heart">❤️ Heart</option>
                  <option value="brain">🧠 Brain</option>
                  <option value="pencil">✏️ Pencil</option>
                  <option value="image">🖼️ Image</option>
                  <option value="video">🎥 Video</option>
                  <option value="music">🎵 Music</option>
                  <option value="quote">💬 Quote</option>
                  <option value="note">📝 Note</option>
                  <option value="star">⭐ Star</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe what this prompt does..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                  maxLength={500}
                />
              </div>

              {/* Output Type */}
              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">
                  Output Type
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-purple-300 hover:bg-purple-50/50">
                    <input
                      type="radio"
                      name="outputType"
                      value="json"
                      checked={outputType === 'json'}
                      onChange={e => setOutputType(e.target.value as 'text' | 'json')}
                      className="mt-1 h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">📊 Structured JSON Output</div>
                      <div className="mt-1 text-xs text-gray-500">
                        Returns data in JSON format with a defined schema. Best for extracting structured information.
                      </div>
                    </div>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-purple-300 hover:bg-purple-50/50">
                    <input
                      type="radio"
                      name="outputType"
                      value="text"
                      checked={outputType === 'text'}
                      onChange={e => setOutputType(e.target.value as 'text' | 'json')}
                      className="mt-1 h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">📝 Plain Text Output</div>
                      <div className="mt-1 text-xs text-gray-500">
                        Returns a simple text response without structure. Best for open-ended analysis or creative content.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2A: JSON Configuration (conditional) */}
          {outputType === 'json' && (
            <>
              {/* Block Selector */}
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Select Output Type
                </h2>
                <BlockPalette
                  selectedBlockType={selectedBlockType}
                  onSelectBlock={handleSelectBlock}
                />
              </div>

              {/* Block Configuration */}
              {blockInstance && (
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    Configure
                    {' '}
                    {getBlockDefinition(blockInstance.blockType)?.label}
                  </h2>

                  {/* System Prompt Editor */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      System Prompt (AI Instructions)
                    </label>
                    <p className="mb-2 text-xs text-gray-500">
                      Customize the AI instructions or leave empty to use the default prompt.
                    </p>
                    <textarea
                      value={blockInstance.customSystemPrompt || ''}
                      onChange={e => handleUpdateSystemPrompt(e.target.value)}
                      placeholder="Enter custom AI instructions or leave empty for default..."
                      rows={12}
                      className="w-full rounded-lg border border-gray-300 p-4 font-mono text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Preview Section */}
              {blockInstance && previewData && (
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    Preview
                  </h2>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                      <p className="text-xs text-blue-600">
                        This preview shows the default output structure for this block type.
                      </p>
                    </div>

                    {!previewData.sampleOutput ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <p className="text-sm text-amber-600">
                          Preview not available for this output type
                        </p>
                      </div>
                    ) : (
                      <GenericJSONPreview
                        data={previewData.sampleOutput as any}
                        fields={[]}
                        schemaType={previewData.definition.schemaType}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Technical Details (Collapsible) */}
              <div className="rounded-lg border border-gray-200 bg-white">
                <button
                  type="button"
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-gray-50"
                >
                  <h2 className="text-lg font-semibold text-gray-900">
                    Technical Details
                  </h2>
                  {showTechnicalDetails ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>
                {showTechnicalDetails && (
                  <div className="space-y-6 border-t border-gray-200 p-6">
                    {/* Generated System Prompt */}
                    <div className="rounded-lg border border-purple-200 bg-purple-50">
                      <div className="border-b border-purple-200 px-4 py-3">
                        <h2 className="text-sm font-medium text-purple-900">Generated System Prompt (AI Instructions)</h2>
                        <p className="mt-1 text-xs text-purple-600">
                          This is the compiled prompt that tells the AI how to generate each field
                        </p>
                      </div>
                      <pre className="overflow-auto p-4 text-xs whitespace-pre-wrap text-purple-800">
                        {generateSystemPrompt() || 'Select a block to generate a system prompt'}
                      </pre>
                    </div>

                    {/* JSON Schema */}
                    <div className="rounded-lg border border-gray-200 bg-white">
                      <div className="border-b border-gray-200 px-4 py-3">
                        <h2 className="text-sm font-medium text-gray-900">Generated JSON Schema</h2>
                        <p className="mt-1 text-xs text-gray-500">
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
                        <h2 className="text-sm font-medium text-gray-900">Block Configuration</h2>
                        <p className="mt-1 text-xs text-gray-500">
                          Selected block configuration and custom settings
                        </p>
                      </div>
                      <pre className="overflow-auto p-4 text-xs text-gray-700">
                        {blockInstance ? JSON.stringify(blockInstance, null, 2) : 'No block selected'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* SECTION 2B: Text Configuration (conditional) */}
          {outputType === 'text' && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                System Prompt
              </h2>
              <p className="mb-4 text-sm text-gray-600">
                This prompt will be sent to the AI as instructions. The AI will return a plain text response without any structured format.
              </p>
              <textarea
                value={textModeSystemPrompt}
                onChange={e => setTextModeSystemPrompt(e.target.value)}
                placeholder="Enter your system prompt here...

Example:
Analyze the following therapeutic conversation and provide insights on the patient's progress, emotional state, and key themes discussed. Focus on identifying breakthrough moments and areas that may need further attention."
                rows={20}
                className="w-full rounded-lg border border-gray-300 p-4 font-mono text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
              />
              <p className="mt-2 text-xs text-gray-500">
                {textModeSystemPrompt.length}
                {' '}
                / 5000 characters
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
