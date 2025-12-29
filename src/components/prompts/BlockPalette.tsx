'use client';

/**
 * BlockPalette Component
 *
 * Sidebar showing available building blocks organized by category
 * Allows searching and filtering blocks
 */

import type { BlockCategory, BlockType } from '@/types/BuildingBlocks';
import { Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getAllBlockDefinitions } from '@/config/BlockDefinitions';

type BlockPaletteProps = {
  onSelectBlock: (blockType: BlockType) => void;
  categoryFilter?: BlockCategory;
  searchQuery?: string;
  compact?: boolean;
};

const CATEGORY_LABELS: Record<BlockCategory, string> = {
  media: '🎨 Media',
  content: '📝 Content',
  interaction: '💬 Interaction',
  structure: '🏗️ Structure',
  action: '⚡ Actions',
  output: '📤 Output',
};

export default function BlockPalette({
  onSelectBlock,
  categoryFilter,
  searchQuery: externalSearchQuery,
  compact = false,
}: BlockPaletteProps) {
  const [activeCategory, setActiveCategory] = useState<BlockCategory | 'all'>(
    categoryFilter || 'all',
  );
  const [internalSearchQuery, setInternalSearchQuery] = useState('');

  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

  // Get filtered blocks
  const filteredBlocks = useMemo(() => {
    let blocks = getAllBlockDefinitions();

    // Filter by category
    if (activeCategory !== 'all') {
      blocks = blocks.filter(block => block.category === activeCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      blocks = blocks.filter(
        block =>
          block.label.toLowerCase().includes(query)
          || block.description.toLowerCase().includes(query)
          || block.type.toLowerCase().includes(query),
      );
    }

    return blocks;
  }, [activeCategory, searchQuery]);

  // Group blocks by category for display
  const groupedBlocks = useMemo(() => {
    const groups: Record<BlockCategory, typeof filteredBlocks> = {
      media: [],
      content: [],
      interaction: [],
      structure: [],
      action: [],
      output: [],
    };

    filteredBlocks.forEach((block) => {
      groups[block.category].push(block);
    });

    return groups;
  }, [filteredBlocks]);

  const categories: BlockCategory[] = ['media', 'content', 'interaction', 'structure', 'action', 'output'];

  if (compact) {
    return (
      <div className="space-y-2">
        {filteredBlocks.map(block => (
          <button
            key={block.id}
            onClick={() => onSelectBlock(block.type)}
            className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left transition-all hover:border-blue-400 hover:shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {block.icon === 'image' ? '🖼️'
                  : block.icon === 'video' ? '🎬'
                    : block.icon === 'music' ? '🎵'
                      : block.icon === 'quote' ? '💬'
                        : block.icon === 'file-text' ? '📝'
                          : block.icon === 'help-circle' ? '💭'
                            : block.icon === 'list-checks' ? '📋'
                              : block.icon === 'film' ? '🎬'
                                : block.icon === 'play-circle' ? '▶️'
                                  : block.icon === 'layers' ? '📚'
                                    : block.icon === 'square-stack' ? '📚'
                                      : '✨'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{block.label}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Search */}
      {externalSearchQuery === undefined && (
        <div className="border-b border-gray-200 bg-white p-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={internalSearchQuery}
              onChange={e => setInternalSearchQuery(e.target.value)}
              placeholder="Search blocks..."
              className="w-full rounded-lg border border-gray-300 py-2 pr-9 pl-9 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
            {internalSearchQuery && (
              <button
                onClick={() => setInternalSearchQuery('')}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="border-b border-gray-200 bg-white px-3 py-2">
        <div className="flex gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveCategory('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === category
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
      </div>

      {/* Blocks list */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredBlocks.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">No blocks found</p>
            {searchQuery && (
              <button
                onClick={() => setInternalSearchQuery('')}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : activeCategory === 'all' ? (
          // Show grouped by category
          <div className="space-y-4">
            {categories.map((category) => {
              const categoryBlocks = groupedBlocks[category];
              if (categoryBlocks.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                    {CATEGORY_LABELS[category]}
                  </h3>
                  <div className="space-y-2">
                    {categoryBlocks.map(block => (
                      <button
                        key={block.id}
                        onClick={() => onSelectBlock(block.type)}
                        className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left transition-all hover:border-blue-400 hover:shadow-sm"
                      >
                        <div className="flex items-start gap-2">
                          <span className="flex-shrink-0 text-lg">
                            {block.icon === 'image' ? '🖼️'
                              : block.icon === 'video' ? '🎬'
                                : block.icon === 'music' ? '🎵'
                                  : block.icon === 'quote' ? '💬'
                                    : block.icon === 'file-text' ? '📝'
                                      : block.icon === 'help-circle' ? '💭'
                                        : block.icon === 'list-checks' ? '📋'
                                          : block.icon === 'film' ? '🎬'
                                            : block.icon === 'play-circle' ? '▶️'
                                              : block.icon === 'layers' ? '📚'
                                                : block.icon === 'square-stack' ? '📚'
                                                  : '✨'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900">{block.label}</p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                              {block.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Show single category
          <div className="space-y-2">
            {filteredBlocks.map(block => (
              <button
                key={block.id}
                onClick={() => onSelectBlock(block.type)}
                className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left transition-all hover:border-blue-400 hover:shadow-sm"
              >
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0 text-lg">
                    {block.icon === 'image' ? '🖼️'
                      : block.icon === 'video' ? '🎬'
                        : block.icon === 'music' ? '🎵'
                          : block.icon === 'quote' ? '💬'
                            : block.icon === 'file-text' ? '📝'
                              : block.icon === 'help-circle' ? '💭'
                                : block.icon === 'list-checks' ? '📋'
                                  : block.icon === 'film' ? '🎬'
                                    : block.icon === 'play-circle' ? '▶️'
                                      : block.icon === 'layers' ? '📚'
                                        : block.icon === 'square-stack' ? '📚'
                                          : '✨'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{block.label}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                      {block.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
