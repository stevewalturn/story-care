'use client';

/**
 * BuildingBlocksEditor Component
 *
 * Main editor for creating prompts with building blocks
 * Provides both building blocks mode and advanced JSON mode
 */

import type { BlockInstance, BlockType } from '@/types/BuildingBlocks';
import { AlertTriangle, Blocks, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useBuildingBlocks } from '@/hooks/useBuildingBlocks';
import BlockForm from './BlockForm';
import BlockPalette from './BlockPalette';
import BlockPreview from './BlockPreview';

type BuildingBlocksEditorProps = {
  initialBlocks?: BlockInstance[];
  onChange: (blocks: BlockInstance[], schema: object) => void;
};

export default function BuildingBlocksEditor({
  initialBlocks = [],
  onChange,
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
    validate: _validate,
    isValid,
    validationErrors,
    getBlockErrors,
  } = useBuildingBlocks(initialBlocks);

  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(false);

  // Notify parent of changes
  useEffect(() => {
    const schema = generateSchema();
    onChange(blocks, schema);
  }, [blocks, onChange]); // Removed generateSchema - onChange is now stable with useCallback

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Blocks className="h-5 w-5 text-blue-600" />
        <div>
          <h3 className="font-medium text-gray-900">Building Blocks</h3>
          <p className="text-xs text-gray-500">
            {blocks.length}
            {' '}
            block
            {blocks.length !== 1 ? 's' : ''}
            {!isValid && (
              <span className="ml-2 text-red-600">
                •
                {' '}
                {validationErrors.length}
                {' '}
                error
                {validationErrors.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex gap-4">
        {/* Block Palette - Left sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="sticky top-4">
            <div className="overflow-hidden rounded-lg border border-gray-300 bg-white" style={{ height: '500px' }}>
              <BlockPalette onSelectBlock={handleAddBlock} />
            </div>
          </div>
        </div>

        {/* Blocks List - Main area */}
        <div className="min-w-0 flex-1">
          {blocks.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                <Blocks className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                No blocks yet
              </h3>
              <p className="mb-4 text-sm text-gray-500">
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
                        onChange={(values, customLabels) => updateBlock(block.instanceId, values, customLabels)}
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
                className="w-full rounded-lg border-2 border-dashed border-gray-300 bg-white p-4 text-center text-sm font-medium text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600"
              >
                <Plus className="mr-2 inline-block h-4 w-4" />
                Add Block
              </button>
            </div>
          )}

          {/* Validation errors summary */}
          {!isValid && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                <div className="flex-1">
                  <h4 className="font-medium text-red-900">
                    Validation Errors (
                    {validationErrors.length}
                    )
                  </h4>
                  <ul className="mt-2 space-y-1 text-sm text-red-800">
                    {validationErrors.slice(0, 5).map((error, idx) => (
                      <li key={idx}>
                        •
                        {error.message}
                      </li>
                    ))}
                    {validationErrors.length > 5 && (
                      <li className="text-red-600">
                        ... and
                        {' '}
                        {validationErrors.length - 5}
                        {' '}
                        more errors
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
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong>
          {' '}
          Build your prompt output structure by adding and configuring blocks.
          Each block represents a piece of structured data the AI will generate. Click a block to expand
          and configure it, or use the palette to add new blocks.
        </p>
      </div>
    </div>
  );
}
