'use client';

/**
 * BuildingBlocksEditor Component
 *
 * Main editor for creating prompts with building blocks
 * Provides both building blocks mode and advanced JSON mode
 */

import { useState, useEffect, useMemo } from 'react';
import { Plus, Code, Blocks, AlertTriangle } from 'lucide-react';
import type { BlockInstance, BlockType } from '@/types/BuildingBlocks';
import { useBuildingBlocks } from '@/hooks/useBuildingBlocks';
import BlockPalette from './BlockPalette';
import BlockPreview from './BlockPreview';
import BlockForm from './BlockForm';
import JSONSchemaEditor from './JSONSchemaEditor';
import Button from '@/components/ui/Button';

interface BuildingBlocksEditorProps {
  initialBlocks?: BlockInstance[];
  onChange: (blocks: BlockInstance[], schema: object) => void;
  advancedMode: boolean;
  onAdvancedModeToggle: () => void;
  jsonSchema?: object;
  onJsonSchemaChange?: (schema: object) => void;
}

export default function BuildingBlocksEditor({
  initialBlocks = [],
  onChange,
  advancedMode,
  onAdvancedModeToggle,
  jsonSchema,
  onJsonSchemaChange,
}: BuildingBlocksEditorProps) {
  const {
    blocks,
    addBlock,
    removeBlock,
    updateBlock,
    duplicateBlock,
    moveBlockUp,
    moveBlockDown,
    generateSchema,
    validate,
    isValid,
    validationErrors,
    getBlockErrors,
  } = useBuildingBlocks(initialBlocks);

  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  const [showAdvancedWarning, setShowAdvancedWarning] = useState(false);

  // Notify parent of changes
  useEffect(() => {
    if (!advancedMode) {
      const schema = generateSchema();
      onChange(blocks, schema);
    }
  }, [blocks, advancedMode, generateSchema, onChange]);

  const handleAddBlock = (blockType: BlockType) => {
    const instanceId = addBlock(blockType);
    setExpandedBlockId(instanceId);
    setShowPalette(false);
  };

  const handleRemoveBlock = (instanceId: string) => {
    removeBlock(instanceId);
    if (expandedBlockId === instanceId) {
      setExpandedBlockId(null);
    }
  };

  const handleDuplicateBlock = (instanceId: string) => {
    const newInstanceId = duplicateBlock(instanceId);
    if (newInstanceId) {
      setExpandedBlockId(newInstanceId);
    }
  };

  const handleAdvancedModeToggle = () => {
    if (!advancedMode && blocks.length > 0) {
      // Switching FROM blocks TO JSON - show warning
      setShowAdvancedWarning(true);
    } else {
      onAdvancedModeToggle();
    }
  };

  const confirmAdvancedMode = () => {
    setShowAdvancedWarning(false);
    onAdvancedModeToggle();
  };

  // Render advanced mode (JSON editor)
  if (advancedMode) {
    return (
      <div className="space-y-4">
        {/* Header with mode toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Advanced JSON Mode</h3>
          </div>
          <button
            onClick={onAdvancedModeToggle}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <Blocks className="h-4 w-4" />
            Switch to Building Blocks
          </button>
        </div>

        {/* JSON Schema Editor */}
        <JSONSchemaEditor
          value={jsonSchema ? JSON.stringify(jsonSchema, null, 2) : ''}
          onChange={(value) => {
            try {
              const parsed = JSON.parse(value);
              onJsonSchemaChange?.(parsed);
            } catch (error) {
              // Invalid JSON, don't update
            }
          }}
        />

        {/* Info box */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
          <p className="text-sm text-blue-800">
            <strong>Advanced Mode:</strong> Edit the JSON schema directly. This gives you full control
            but requires knowledge of JSON Schema format.
          </p>
        </div>
      </div>
    );
  }

  // Render building blocks mode
  return (
    <div className="space-y-4">
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Blocks className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-medium text-gray-900">Building Blocks</h3>
            <p className="text-xs text-gray-500">
              {blocks.length} block{blocks.length !== 1 ? 's' : ''}
              {!isValid && (
                <span className="ml-2 text-red-600">
                  • {validationErrors.length} error{validationErrors.length !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={handleAdvancedModeToggle}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700"
        >
          <Code className="h-4 w-4" />
          Advanced Mode
        </button>
      </div>

      {/* Advanced mode warning dialog */}
      {showAdvancedWarning && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-300 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-900">Switch to Advanced Mode?</h4>
              <p className="mt-1 text-sm text-yellow-800">
                Switching to advanced mode will convert your building blocks to JSON.
                You'll be able to edit the JSON directly, but switching back to building blocks
                may not preserve custom JSON structures.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  onClick={confirmAdvancedMode}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Continue
                </Button>
                <Button
                  onClick={() => setShowAdvancedWarning(false)}
                  className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex gap-4">
        {/* Block Palette - Left sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="sticky top-4">
            <div className="rounded-lg border border-gray-300 bg-white overflow-hidden" style={{ height: '500px' }}>
              <BlockPalette onSelectBlock={handleAddBlock} />
            </div>
          </div>
        </div>

        {/* Blocks List - Main area */}
        <div className="flex-1 min-w-0">
          {blocks.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                <Blocks className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No blocks yet
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Add building blocks from the palette on the left to create your prompt structure
              </p>
              <Button
                onClick={() => setShowPalette(true)}
                className="inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add First Block
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {blocks.map((block, index) => {
                const isExpanded = expandedBlockId === block.instanceId;
                const blockErrors = getBlockErrors(block.instanceId);

                return (
                  <div key={block.instanceId}>
                    {isExpanded ? (
                      <BlockForm
                        blockId={block.blockId}
                        instance={block}
                        onChange={(values) => updateBlock(block.instanceId, values)}
                        onRemove={() => handleRemoveBlock(block.instanceId)}
                        onDuplicate={() => handleDuplicateBlock(block.instanceId)}
                        onCollapse={() => setExpandedBlockId(null)}
                        onMoveUp={() => moveBlockUp(block.instanceId)}
                        onMoveDown={() => moveBlockDown(block.instanceId)}
                        errors={blockErrors}
                        isFirst={index === 0}
                        isLast={index === blocks.length - 1}
                      />
                    ) : (
                      <BlockPreview
                        blockId={block.blockId}
                        instance={block}
                        onExpand={() => setExpandedBlockId(block.instanceId)}
                        errors={blockErrors}
                      />
                    )}
                  </div>
                );
              })}

              {/* Add block button */}
              <button
                onClick={() => setShowPalette(!showPalette)}
                className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 text-center text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Plus className="inline-block h-4 w-4 mr-2" />
                Add Block
              </button>
            </div>
          )}

          {/* Validation errors summary */}
          {!isValid && (
            <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900">
                    Validation Errors ({validationErrors.length})
                  </h4>
                  <ul className="mt-2 space-y-1 text-sm text-red-800">
                    {validationErrors.slice(0, 5).map((error, idx) => (
                      <li key={idx}>• {error.message}</li>
                    ))}
                    {validationErrors.length > 5 && (
                      <li className="text-red-600">
                        ... and {validationErrors.length - 5} more errors
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Build your prompt output structure by adding and configuring blocks.
          Each block represents a piece of structured data the AI will generate. Click a block to expand
          and configure it, or use the palette to add new blocks.
        </p>
      </div>
    </div>
  );
}
