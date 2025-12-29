'use client';

import type { ModuleAiPrompt } from '@/models/Schema';
import { BookOpen, CheckCircle, Copy, Edit2, Eye, Plus, Search, Trash2 } from 'lucide-react';

import { useEffect, useState } from 'react';
import { PromptPreviewModal } from '@/components/prompts/PromptPreviewModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  getCategoryClasses,
  getPromptIcon,
  getSchemaTypeLabel,
  OUTPUT_TYPES,
  PROMPT_CATEGORIES,
} from '@/constants/PromptConstants';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type PromptLibraryProps = {
  onSelectPrompt?: (prompt: ModuleAiPrompt) => void;
  onAddClick?: () => void;
  onEditClick?: (prompt: ModuleAiPrompt) => void;
  onDeleteClick?: (promptId: string) => void;
};

export function PromptLibrary({
  onSelectPrompt,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: PromptLibraryProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<ModuleAiPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(null);
  const [previewPrompt, setPreviewPrompt] = useState<ModuleAiPrompt | null>(null);

  // Fetch prompts from API
  useEffect(() => {
    fetchPrompts();
  }, [selectedCategory]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPrompts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await authenticatedFetch(`/api/prompts?${params}`, user);
      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }

      const data = await response.json();
      setPrompts(data.prompts.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
      })));
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrompts = prompts;

  const handleCopy = (promptId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(promptId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpanded = (promptId: string) => {
    setExpandedPromptId(expandedPromptId === promptId ? null : promptId);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prompt Library</h1>
          <p className="mt-1 text-sm text-gray-600">
            Therapeutic prompts for AI-generated imagery
          </p>
        </div>
        {onAddClick && (
          <Button variant="primary" onClick={onAddClick}>
            <Plus className="mr-2 h-4 w-4" />
            New Prompt
          </Button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="mb-6 space-y-4">
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search prompts by title, description, or tags..."
          leftIcon={<Search className="h-4 w-4" />}
        />

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {PROMPT_CATEGORIES.map((category) => {
            const classes = getCategoryClasses(category.id);
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  selectedCategory === category.id
                    ? classes.activeButton
                    : classes.inactiveButton
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prompts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600" />
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="py-12 text-center">
          <BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">No prompts found</h3>
          <p className="mb-6 text-sm text-gray-600">
            {searchQuery
              ? 'Try adjusting your search or filters'
              : 'Start by creating your first therapeutic prompt'}
          </p>
          {onAddClick && (
            <Button variant="primary" onClick={onAddClick}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Prompt
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPrompts.map((prompt) => {
            const Icon = getPromptIcon(prompt.icon);
            const categoryClasses = getCategoryClasses(prompt.category || 'analysis');
            const schemaTypeLabel = getSchemaTypeLabel(prompt.jsonSchema);
            const isExpanded = expandedPromptId === prompt.id;

            return (
              <div
                key={prompt.id}
                className="rounded-lg border border-gray-200 bg-white p-5 transition-all hover:shadow-lg"
              >
                {/* Header with Icon */}
                <div className="mb-3 flex items-start gap-3">
                  <div className={`rounded-lg ${categoryClasses.bg} p-2`}>
                    <Icon className={`h-5 w-5 ${categoryClasses.text}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 font-semibold text-gray-900">{prompt.name}</h3>
                    {prompt.description && (
                      <p className={isExpanded ? 'text-sm text-gray-600' : 'line-clamp-2 text-sm text-gray-600'}>
                        {prompt.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Metadata Badges */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded px-2 py-1 text-xs font-medium ${categoryClasses.badge}`}>
                    {prompt.category}
                  </span>
                  {prompt.outputType && (
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      {OUTPUT_TYPES[prompt.outputType as keyof typeof OUTPUT_TYPES]?.icon}
                      {' '}
                      {OUTPUT_TYPES[prompt.outputType as keyof typeof OUTPUT_TYPES]?.label || prompt.outputType}
                    </span>
                  )}
                  {schemaTypeLabel && (
                    <span className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                      {schemaTypeLabel}
                    </span>
                  )}
                </div>

                {/* Expandable Description/Prompt Text */}
                {!prompt.description && (
                  <div className="mb-3">
                    <div className="rounded bg-gray-50 p-3">
                      <p className={isExpanded ? 'text-xs whitespace-pre-wrap text-gray-700' : 'line-clamp-5 text-xs text-gray-700'}>
                        {prompt.promptText}
                      </p>
                    </div>
                    {prompt.promptText.length > 300 && (
                      <button
                        onClick={() => toggleExpanded(prompt.id)}
                        className="mt-2 text-xs font-medium text-purple-600 hover:text-purple-700"
                      >
                        {isExpanded ? 'Show Less' : 'Read More'}
                      </button>
                    )}
                  </div>
                )}

                {/* Use Count */}
                <div className="mb-3 text-xs text-gray-500">
                  Used
                  {' '}
                  {prompt.useCount || 0}
                  {' '}
                  times
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 border-t border-gray-200 pt-3">
                  {onSelectPrompt && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onSelectPrompt(prompt)}
                      className="flex-1"
                    >
                      <BookOpen className="mr-1 h-4 w-4" />
                      Use
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewPrompt(prompt)}
                    title="Preview full prompt"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(prompt.id, prompt.promptText)}
                    title="Copy prompt text"
                  >
                    {copiedId === prompt.id ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  {onEditClick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditClick(prompt)}
                      title="Edit prompt"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  {onDeleteClick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this prompt?')) {
                          onDeleteClick(prompt.id);
                          fetchPrompts();
                        }
                      }}
                      title="Delete prompt"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewPrompt && (
        <PromptPreviewModal
          prompt={previewPrompt}
          isOpen={!!previewPrompt}
          onClose={() => setPreviewPrompt(null)}
        />
      )}
    </div>
  );
}
