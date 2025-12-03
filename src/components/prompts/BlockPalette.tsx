'use client';

/**
 * BlockPalette Component
 *
 * Sidebar showing available building blocks organized by category
 * Allows searching and filtering blocks
 */

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import type { BlockType, BlockCategory } from '@/types/BuildingBlocks';
import { getAllBlockDefinitions, getBlockDefinitionsByCategory } from '@/config/BlockDefinitions';

interface BlockPaletteProps {
  onSelectBlock: (blockType: BlockType) => void;
  categoryFilter?: BlockCategory;
  searchQuery?: string;
  compact?: boolean;
}

const CATEGORY_LABELS: Record<BlockCategory, string> = {
  media: '🎨 Media',
  content: '📝 Content',
  interaction: '💬 Interaction',
  structure: '🏗️ Structure',
  action: '⚡ Actions',
  output: '📤 Output',
};

const CATEGORY_DESCRIPTIONS: Record<BlockCategory, string> = {
  media: 'Images, videos, and music',
  content: 'Quotes, notes, and suggestions',
  interaction: 'Questions and surveys',
  structure: 'Scene assembly and containers',
  action: 'Trigger actions and workflows',
  output: 'Display generated content and results',
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
          block.label.toLowerCase().includes(query) ||
          block.description.toLowerCase().includes(query) ||
          block.type.toLowerCase().includes(query),
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

    filteredBlocks.forEach(block => {
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
                {block.icon === 'image' ? '🖼️' :
                  block.icon === 'video' ? '🎬' :
                  block.icon === 'music' ? '🎵' :
                  block.icon === 'quote' ? '💬' :
                  block.icon === 'file-text' ? '📝' :
                  block.icon === 'help-circle' ? '💭' :
                  block.icon === 'list-checks' ? '📋' :
                  block.icon === 'film' ? '🎬' :
                  block.icon === 'play-circle' ? '▶️' :
                  block.icon === 'layers' ? '📚' :
                  block.icon === 'square-stack' ? '📚' :
                  '✨'}
              </span>
              <div className="flex-1 min-w-0">
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={internalSearchQuery}
              onChange={(e) => setInternalSearchQuery(e.target.value)}
              placeholder="Search blocks..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-9 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {internalSearchQuery && (
              <button
                onClick={() => setInternalSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
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
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
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
            {categories.map(category => {
              const categoryBlocks = groupedBlocks[category];
              if (categoryBlocks.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
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
                          <span className="text-lg flex-shrink-0">
                            {block.icon === 'image' ? '🖼️' :
                              block.icon === 'video' ? '🎬' :
                              block.icon === 'music' ? '🎵' :
                              block.icon === 'quote' ? '💬' :
                              block.icon === 'file-text' ? '📝' :
                              block.icon === 'help-circle' ? '💭' :
                              block.icon === 'list-checks' ? '📋' :
                              block.icon === 'film' ? '🎬' :
                              block.icon === 'play-circle' ? '▶️' :
                              block.icon === 'layers' ? '📚' :
                              block.icon === 'square-stack' ? '📚' :
                              '✨'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{block.label}</p>
                            <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
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
                  <span className="text-lg flex-shrink-0">
                    {block.icon === 'image' ? '🖼️' :
                      block.icon === 'video' ? '🎬' :
                      block.icon === 'music' ? '🎵' :
                      block.icon === 'quote' ? '💬' :
                      block.icon === 'file-text' ? '📝' :
                      block.icon === 'help-circle' ? '💭' :
                      block.icon === 'list-checks' ? '📋' :
                      block.icon === 'film' ? '🎬' :
                      block.icon === 'play-circle' ? '▶️' :
                      block.icon === 'layers' ? '📚' :
                      block.icon === 'square-stack' ? '📚' :
                      '✨'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{block.label}</p>
                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
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
