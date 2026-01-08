'use client';

/**
 * Block Palette Component
 * Left sidebar with draggable blocks grouped by category
 */

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { BlockDefinition } from '@/config/PromptBuilderBlocks';
import { AI_BLOCKS, UI_BLOCKS } from '@/config/PromptBuilderBlocks';

type DraggableBlockProps = {
  block: BlockDefinition;
};

function DraggableBlock({ block }: DraggableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${block.id}`,
    data: {
      type: 'palette-block',
      blockType: block.id,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = block.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex cursor-grab flex-col items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-purple-300 hover:bg-purple-50 active:cursor-grabbing ${
        isDragging ? 'shadow-lg ring-2 ring-purple-400' : 'hover:shadow-md'
      }`}
      title={block.description}
    >
      <Icon className={`h-5 w-5 ${block.category === 'ai' ? 'text-purple-600' : 'text-gray-600'}`} />
      <span className="text-xs font-medium text-gray-700">{block.label}</span>
    </div>
  );
}

type BlockPaletteProps = {
  className?: string;
};

export function BlockPalette({ className = '' }: BlockPaletteProps) {
  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      {/* UI Blocks Section */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          UI Blocks
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {UI_BLOCKS.map(block => (
            <DraggableBlock key={block.id} block={block} />
          ))}
        </div>
      </div>

      {/* AI Blocks Section */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-purple-600">
          AI Blocks
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {AI_BLOCKS.map(block => (
            <DraggableBlock key={block.id} block={block} />
          ))}
        </div>
      </div>
    </div>
  );
}
