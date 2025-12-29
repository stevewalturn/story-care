'use client';

/**
 * Prompt Library Selector Component
 * Multi-select component for choosing AI prompts from the library
 */

import type { PromptTemplate } from '@/models/Schema';
import { Check, Search } from 'lucide-react';

import { useEffect, useState } from 'react';
import {
  getCategoryClasses,
  getCategoryData,
  getPromptIcon,
  getSchemaTypeLabel,
  OUTPUT_TYPES,
} from '@/constants/PromptConstants';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type PromptSelectorProps = {
  selectedPromptIds: string[];
  onChange: (promptIds: string[]) => void;
  apiEndpoint?: string;
  label?: string;
  description?: string;
};

export function PromptSelector({
  selectedPromptIds,
  onChange,
  apiEndpoint = '/api/prompts',
  label = 'AI Analysis Prompts',
  description = 'Select AI prompts to use for analyzing transcripts with this module',
}: PromptSelectorProps) {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(apiEndpoint, user);

      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }

      const data = await response.json();
      setPrompts(data.prompts || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePrompt = (promptId: string) => {
    if (selectedPromptIds.includes(promptId)) {
      onChange(selectedPromptIds.filter(id => id !== promptId));
    } else {
      onChange([...selectedPromptIds, promptId]);
    }
  };

  // Filter prompts
  const filteredPrompts = prompts.filter((prompt) => {
    const matchesSearch = !searchQuery
      || prompt.name.toLowerCase().includes(searchQuery.toLowerCase())
      || (prompt.description?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(prompts.map(p => p.category)));

  return (
    <div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-900">
          {label}
        </label>
        {description && (
          <p className="mt-1 text-xs text-gray-500">
            {description}
          </p>
        )}
      </div>

      {/* Search and Filter */}
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search prompts..."
            className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-9 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => {
            const categoryData = getCategoryData(cat);
            return (
              <option key={cat} value={cat}>
                {categoryData.label}
              </option>
            );
          })}
        </select>
      </div>

      {/* Prompts List */}
      <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Loading prompts...
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            No prompts found
          </div>
        ) : (
          filteredPrompts.map((prompt) => {
            const isSelected = selectedPromptIds.includes(prompt.id);
            const Icon = getPromptIcon(prompt.icon);
            const categoryClasses = getCategoryClasses(prompt.category || 'analysis');
            const schemaTypeLabel = getSchemaTypeLabel(prompt.jsonSchema);

            return (
              <label
                key={prompt.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-transparent bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex h-5 items-center">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                      isSelected
                        ? 'border-purple-600 bg-purple-600'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleTogglePrompt(prompt.id)}
                    className="sr-only"
                  />
                </div>

                <div className={`rounded-lg p-1.5 ${categoryClasses.bg}`}>
                  <Icon className={`h-4 w-4 ${categoryClasses.text}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {prompt.name}
                    </span>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${categoryClasses.badge}`}>
                      {prompt.category}
                    </span>
                    {prompt.outputType && (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                        {OUTPUT_TYPES[prompt.outputType as keyof typeof OUTPUT_TYPES]?.icon}
                        {' '}
                        {OUTPUT_TYPES[prompt.outputType as keyof typeof OUTPUT_TYPES]?.label || prompt.outputType}
                      </span>
                    )}
                    {schemaTypeLabel && (
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        {schemaTypeLabel}
                      </span>
                    )}
                    {prompt.scope === 'system' && (
                      <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        System
                      </span>
                    )}
                  </div>
                  {prompt.description && (
                    <p className="line-clamp-2 text-xs text-gray-600">
                      {prompt.description}
                    </p>
                  )}
                </div>
              </label>
            );
          })
        )}
      </div>

      {/* Selected count */}
      {selectedPromptIds.length > 0 && (
        <div className="mt-2 text-xs text-gray-600">
          {selectedPromptIds.length}
          {' '}
          prompt
          {selectedPromptIds.length !== 1 ? 's' : ''}
          {' '}
          selected
        </div>
      )}
    </div>
  );
}
