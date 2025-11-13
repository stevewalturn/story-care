'use client';

import { BookOpen, CheckCircle, Copy, Edit2, Plus, Search, Tag, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Prompt = {
  id: string;
  title: string;
  description: string;
  promptText: string;
  category: string;
  tags: string[];
  useCount: number;
  createdAt: Date;
  isFavorite?: boolean;
};

type PromptLibraryProps = {
  onSelectPrompt?: (prompt: Prompt) => void;
  onAddClick?: () => void;
  onEditClick?: (prompt: Prompt) => void;
  onDeleteClick?: (promptId: string) => void;
};

const CATEGORIES = [
  { id: 'all', label: 'All Prompts', color: 'gray' },
  { id: 'visualization', label: 'Visualization', color: 'blue' },
  { id: 'character', label: 'Character', color: 'purple' },
  { id: 'environment', label: 'Environment', color: 'green' },
  { id: 'emotion', label: 'Emotion', color: 'pink' },
  { id: 'metaphor', label: 'Metaphor', color: 'orange' },
  { id: 'safety', label: 'Safe Space', color: 'indigo' },
];

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
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getCategoryColor = (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category?.color || 'gray';
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category?.label || categoryId;
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
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? `bg-${category.color}-100 text-${category.color}-700 border- border-2${category.color}-500`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prompts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600" />
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
          {filteredPrompts.map(prompt => (
            <div
              key={prompt.id}
              className="rounded-lg border border-gray-200 bg-white p-5 transition-all hover:shadow-lg"
            >
              {/* Header */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-1 font-semibold text-gray-900">{prompt.title}</h3>
                  <p className="line-clamp-2 text-sm text-gray-600">{prompt.description}</p>
                </div>
                {prompt.isFavorite && (
                  <CheckCircle className="ml-2 h-5 w-5 flex-shrink-0 text-indigo-600" />
                )}
              </div>

              {/* Content Preview */}
              <div className="mb-3 rounded bg-gray-50 p-3">
                <p className="line-clamp-3 text-xs text-gray-700">{prompt.promptText}</p>
              </div>

              {/* Metadata */}
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={`bg- rounded px-2 py-1 text-xs font-medium${getCategoryColor(prompt.category)}-100 text-${getCategoryColor(prompt.category)}-700`}
                >
                  {getCategoryLabel(prompt.category)}
                </span>
                <span className="text-xs text-gray-500">
                  Used
                  {' '}
                  {prompt.useCount || 0}
                  {' '}
                  times
                </span>
              </div>

              {/* Tags */}
              {prompt.tags && prompt.tags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {prompt.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                  {prompt.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +
                      {prompt.tags.length - 3}
                      {' '}
                      more
                    </span>
                  )}
                </div>
              )}

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
                  onClick={() => handleCopy(prompt.id, prompt.promptText)}
                >
                  {copiedId === prompt.id
                    ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )
                    : (
                        <Copy className="h-4 w-4" />
                      )}
                </Button>
                {onEditClick && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditClick(prompt)}
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
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
