'use client';

/**
 * Block Palette Component
 * Selection grid for choosing output type (single AI block)
 */

import type { BlockDefinition } from '@/config/PromptBuilderBlocks';
import { CheckCircle } from 'lucide-react';
import { AI_BLOCKS } from '@/config/PromptBuilderBlocks';

type SelectableBlockProps = {
  block: BlockDefinition;
  isSelected: boolean;
  onSelect: (blockType: string) => void;
};

function SelectableBlock({ block, isSelected, onSelect }: SelectableBlockProps) {
  const Icon = block.icon;

  return (
    <button
      onClick={() => onSelect(block.id)}
      className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all text-left ${
        isSelected
          ? 'border-purple-600 bg-purple-50 shadow-md'
          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
      }`}
      title={block.description}
    >
      <Icon className={`h-6 w-6 flex-shrink-0 ${isSelected ? 'text-purple-600' : 'text-gray-600'}`} />
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-sm ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>
          {block.label}
        </div>
        <div className="text-xs text-gray-500 line-clamp-1">
          {block.description}
        </div>
      </div>
      {isSelected && (
        <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
      )}
    </button>
  );
}

type BlockPaletteProps = {
  selectedBlockType?: string | null;
  onSelectBlock: (blockType: string) => void;
  className?: string;
};

export function BlockPalette({
  selectedBlockType = null,
  onSelectBlock,
  className = ''
}: BlockPaletteProps) {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-900">
          Choose Output Type
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Select the type of content this prompt will generate
        </p>
      </div>

      {/* AI Blocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {AI_BLOCKS.map(block => (
          <SelectableBlock
            key={block.id}
            block={block}
            isSelected={selectedBlockType === block.id}
            onSelect={onSelectBlock}
          />
        ))}
      </div>
    </div>
  );
}
