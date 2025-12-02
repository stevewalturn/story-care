'use client';

/**
 * BlockSidePanel Component
 *
 * Collapsible side panel showing building blocks and saved prompts
 * Allows dragging blocks into chat for quick prompt creation
 */

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Blocks } from 'lucide-react';
import type { BlockType, PromptWithBlocks } from '@/types/BuildingBlocks';
import { getAllBlockDefinitions } from '@/config/BlockDefinitions';

interface BlockSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlock: (blockType: BlockType) => void;
  onSelectPrompt?: (prompt: PromptWithBlocks) => void;
  savedPrompts?: PromptWithBlocks[];
}

export default function BlockSidePanel({
  isOpen,
  onClose,
  onSelectBlock,
  onSelectPrompt,
  savedPrompts = [],
}: BlockSidePanelProps) {
  const [activeTab, setActiveTab] = useState<'blocks' | 'prompts'>('blocks');
  const [isMinimized, setIsMinimized] = useState(false);

  const blocks = getAllBlockDefinitions();

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed right-0 top-1/2 z-40 -translate-y-1/2">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 rounded-l-lg border border-r-0 border-gray-300 bg-white px-2 py-3 shadow-lg transition-colors hover:bg-gray-50"
          title="Expand blocks panel"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
          <Blocks className="h-5 w-5 text-gray-600" />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 z-30 bg-black/20 md:hidden"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed right-0 top-0 z-40 flex h-full w-80 flex-col border-l border-gray-300 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Blocks className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Building Blocks</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Minimize"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('blocks')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'blocks'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Block Templates
          </button>
          <button
            onClick={() => setActiveTab('prompts')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'prompts'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Saved Prompts
            {savedPrompts.length > 0 && (
              <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs">
                {savedPrompts.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'blocks' ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-3">
                Click a block to insert it into your prompt
              </p>
              {blocks.map((block) => (
                <button
                  key={block.id}
                  onClick={() => {
                    onSelectBlock(block.type);
                    // Don't close panel, allow multiple selections
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left transition-all hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg flex-shrink-0">
                      {block.icon === 'image'
                        ? '🖼️'
                        : block.icon === 'video'
                          ? '🎬'
                          : block.icon === 'music'
                            ? '🎵'
                            : block.icon === 'quote'
                              ? '💬'
                              : block.icon === 'file-text'
                                ? '📝'
                                : block.icon === 'help-circle'
                                  ? '💭'
                                  : block.icon === 'list-checks'
                                    ? '📋'
                                    : block.icon === 'film'
                                      ? '🎬'
                                      : block.icon === 'play-circle'
                                        ? '▶️'
                                        : block.icon === 'layers'
                                          ? '📚'
                                          : '✨'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{block.label}</p>
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                        {block.description}
                      </p>
                      <div className="mt-1.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            block.category === 'media'
                              ? 'bg-purple-100 text-purple-700'
                              : block.category === 'content'
                                ? 'bg-green-100 text-green-700'
                                : block.category === 'interaction'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {block.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {savedPrompts.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-300 px-4 py-8 text-center">
                  <p className="text-sm text-gray-500">No saved prompts yet</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Create prompts in the Prompt Library to see them here
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-3">
                    Click a prompt to use it in chat
                  </p>
                  {savedPrompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => {
                        if (onSelectPrompt) {
                          onSelectPrompt(prompt);
                        }
                      }}
                      className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left transition-all hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg flex-shrink-0">✨</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{prompt.name}</p>
                          {prompt.description && (
                            <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                              {prompt.description}
                            </p>
                          )}
                          <div className="mt-1.5 flex items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                prompt.category === 'analysis'
                                  ? 'bg-blue-100 text-blue-700'
                                  : prompt.category === 'creative'
                                    ? 'bg-purple-100 text-purple-700'
                                    : prompt.category === 'extraction'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              {prompt.category}
                            </span>
                            {prompt.blocks && prompt.blocks.length > 0 && (
                              <span className="text-xs text-gray-500">
                                {prompt.blocks.length} block
                                {prompt.blocks.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
          <p className="text-xs text-gray-500">
            <strong>Tip:</strong> Use building blocks to create structured AI outputs
            like scene cards, therapeutic notes, and media prompts.
          </p>
        </div>
      </div>
    </>
  );
}
