'use client';

/**
 * Builder Canvas Component
 * Main drop zone with sortable blocks and insertion indicators
 */

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import type { BlockInstance } from '@/config/PromptBuilderBlocks';
import { getBlockDefinition } from '@/config/PromptBuilderBlocks';

type SortableBlockCardProps = {
  block: BlockInstance;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

function SortableBlockCard({ block, isSelected, onSelect, onDelete }: SortableBlockCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const definition = getBlockDefinition(block.blockType);
  if (!definition) return null;

  const Icon = definition.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg border bg-white transition-all ${
        isDragging ? 'opacity-50 shadow-xl' : ''
      } ${
        isSelected
          ? 'border-purple-500 ring-2 ring-purple-500/20'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onSelect(block.id)}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 left-2 cursor-grab rounded p-1 opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* Delete Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(block.id);
        }}
        className="absolute top-2 right-2 rounded p-1 opacity-0 transition-opacity hover:bg-red-100 group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </button>

      {/* Block Content */}
      <div className="p-4 pl-10">
        {/* Block Header */}
        <div className="mb-2 flex items-center gap-2">
          <Icon className={`h-4 w-4 ${definition.category === 'ai' ? 'text-purple-600' : 'text-gray-500'}`} />
          <span className="text-sm font-medium text-gray-900">{definition.label}</span>
          {definition.category === 'ai' && (
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
              AI
            </span>
          )}
        </div>

        {/* Block Preview Content */}
        <BlockPreview block={block} definition={definition} />

        {/* Action Button for AI blocks */}
        {definition.hasAction && definition.actionLabel && (
          <div className="mt-3">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
              onClick={(e) => e.stopPropagation()}
            >
              <Icon className="h-3 w-3" />
              {definition.actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

type BlockPreviewProps = {
  block: BlockInstance;
  definition: ReturnType<typeof getBlockDefinition>;
};

function BlockPreview({ block, definition }: BlockPreviewProps) {
  if (!definition) return null;

  // Show different preview based on block type
  switch (block.blockType) {
    case 'text':
      return (
        <p className="line-clamp-2 text-sm text-gray-600">
          {block.values.content || 'Enter text content...'}
        </p>
      );

    case 'header':
      return (
        <p className={`font-semibold text-gray-900 ${
          block.values.level === 'h1' ? 'text-xl' : block.values.level === 'h2' ? 'text-lg' : 'text-base'
        }`}>
          {block.values.text || 'Header text...'}
        </p>
      );

    case 'button':
      return (
        <div className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
          Button: {block.values.label || 'Click me'}
        </div>
      );

    case 'image':
      return (
        <div className="flex h-16 items-center justify-center rounded bg-gray-100 text-xs text-gray-500">
          {block.values.url ? 'Image: ' + block.values.url.substring(0, 30) + '...' : 'No image selected'}
        </div>
      );

    case 'divider':
      return (
        <hr className={`my-2 border-gray-300 ${
          block.values.style === 'dashed' ? 'border-dashed' : block.values.style === 'dotted' ? 'border-dotted' : ''
        }`} />
      );

    case 'spacer':
      return (
        <div className={`bg-gray-50 ${
          block.values.height === 'small' ? 'h-4' : block.values.height === 'large' ? 'h-12' : block.values.height === 'xlarge' ? 'h-16' : 'h-8'
        }`} />
      );

    case 'quote':
      return (
        <blockquote className="border-l-2 border-purple-300 pl-3 text-sm italic text-gray-600">
          {block.values.text || 'Quote text...'}
          {block.values.author && (
            <cite className="mt-1 block text-xs not-italic text-gray-500">
              — {block.values.author}
            </cite>
          )}
        </blockquote>
      );

    case 'split':
      return (
        <div className="flex gap-2">
          <div className="flex-1 rounded bg-gray-50 p-2 text-xs text-gray-500">Left column</div>
          <div className="flex-1 rounded bg-gray-50 p-2 text-xs text-gray-500">Right column</div>
        </div>
      );

    case 'generate_image':
      return (
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-800">{block.values.title || 'Untitled Image'}</p>
          <p className="line-clamp-2 text-xs text-gray-500">{block.values.prompt || 'No prompt yet...'}</p>
          {block.values.therapeutic_purpose && (
            <div className="mt-2 rounded bg-purple-50 p-2">
              <p className="text-xs font-medium text-purple-700">Therapeutic Relevance:</p>
              <p className="line-clamp-2 text-xs text-purple-600">{block.values.therapeutic_purpose}</p>
            </div>
          )}
        </div>
      );

    case 'generate_video':
      return (
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-800">{block.values.title || 'Untitled Video'}</p>
          <p className="line-clamp-2 text-xs text-gray-500">{block.values.reference_image_prompt || 'No prompt yet...'}</p>
          <p className="text-xs text-gray-400">Duration: {block.values.duration || 5}s</p>
        </div>
      );

    case 'generate_music':
      return (
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-800">{block.values.title || 'Untitled Music'}</p>
          <p className="text-xs text-gray-500">Type: {block.values.type || 'instrumental'}</p>
          {block.values.mood && <p className="text-xs text-gray-400">Mood: {block.values.mood}</p>}
        </div>
      );

    case 'scene_card':
      return (
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-800">{block.values.title || 'Untitled Scene'}</p>
          {block.values.patientQuote && (
            <blockquote className="border-l-2 border-purple-300 pl-2 text-xs italic text-gray-600">
              "{block.values.patientQuote.substring(0, 80)}..."
            </blockquote>
          )}
        </div>
      );

    case 'extract_quotes':
      return (
        <div className="space-y-1">
          <p className="line-clamp-2 text-sm text-gray-600">
            {block.values.quote_text || 'Quote text...'}
          </p>
          {block.values.speaker && (
            <p className="text-xs text-gray-500">— {block.values.speaker}</p>
          )}
        </div>
      );

    case 'reflection':
      return (
        <div className="space-y-1">
          <p className="text-sm text-gray-700">{block.values.question || 'Reflection question...'}</p>
          {block.values.rationale && (
            <p className="text-xs text-gray-500">{block.values.rationale}</p>
          )}
        </div>
      );

    case 'therapeutic_note':
      return (
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-800">{block.values.note_title || 'Untitled Note'}</p>
          <p className="line-clamp-2 text-xs text-gray-500">{block.values.note_content || 'Note content...'}</p>
        </div>
      );

    default:
      return (
        <p className="text-sm text-gray-500">{definition.description}</p>
      );
  }
}

type AddBlockButtonProps = {
  onClick: () => void;
  isOver?: boolean;
};

function AddBlockButton({ onClick, isOver }: AddBlockButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed py-3 text-sm font-medium transition-colors ${
        isOver
          ? 'border-purple-400 bg-purple-50 text-purple-600'
          : 'border-gray-300 text-gray-500 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600'
      }`}
    >
      <Plus className="h-4 w-4" />
      Add section
    </button>
  );
}

type BuilderCanvasProps = {
  blocks: BlockInstance[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onDeleteBlock: (id: string) => void;
  onAddBlockClick: () => void;
  isOver?: boolean;
  activeId?: string | null;
};

export function BuilderCanvas({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onDeleteBlock,
  onAddBlockClick,
  isOver,
}: BuilderCanvasProps) {
  const { setNodeRef } = useDroppable({
    id: 'canvas',
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[400px] rounded-lg border-2 p-4 transition-colors ${
        isOver ? 'border-purple-400 bg-purple-50/50' : 'border-dashed border-gray-300 bg-gray-50'
      }`}
      onClick={() => onSelectBlock(null)}
    >
      {blocks.length === 0 ? (
        <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
          <div className="mb-4 rounded-full bg-gray-100 p-4">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No blocks yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Drag blocks from the palette or click below to add
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddBlockClick();
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            Add your first block
          </button>
        </div>
      ) : (
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
            {blocks.map((block) => (
              <SortableBlockCard
                key={block.id}
                block={block}
                isSelected={selectedBlockId === block.id}
                onSelect={onSelectBlock}
                onDelete={onDeleteBlock}
              />
            ))}
            <AddBlockButton onClick={onAddBlockClick} isOver={isOver} />
          </div>
        </SortableContext>
      )}
    </div>
  );
}
