'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, BookOpen, Copy, Edit2, Trash2, Tag, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Prompt {
  id: string;
  title: string;
  description: string;
  promptText: string;
  category: string;
  tags: string[];
  useCount: number;
  createdAt: Date;
  isFavorite?: boolean;
}

interface PromptLibraryProps {
  onSelectPrompt?: (prompt: Prompt) => void;
  onAddClick?: () => void;
  onEditClick?: (prompt: Prompt) => void;
  onDeleteClick?: (promptId: string) => void;
}

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

      const response = await fetch(`/api/prompts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch prompts');

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
    const category = CATEGORIES.find((c) => c.id === categoryId);
    return category?.color || 'gray';
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = CATEGORIES.find((c) => c.id === categoryId);
    return category?.label || categoryId;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prompt Library</h1>
          <p className="text-sm text-gray-600 mt-1">
            Therapeutic prompts for AI-generated imagery
          </p>
        </div>
        {onAddClick && (
          <Button variant="primary" onClick={onAddClick}>
            <Plus className="w-4 h-4 mr-2" />
            New Prompt
          </Button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="mb-6 space-y-4">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search prompts by title, description, or tags..."
          leftIcon={<Search className="w-4 h-4" />}
        />

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? `bg-${category.color}-100 text-${category.color}-700 border-2 border-${category.color}-500`
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      ) : filteredPrompts.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No prompts found</h3>
          <p className="text-sm text-gray-600 mb-6">
            {searchQuery
              ? 'Try adjusting your search or filters'
              : 'Start by creating your first therapeutic prompt'}
          </p>
          {onAddClick && (
            <Button variant="primary" onClick={onAddClick}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Prompt
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{prompt.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{prompt.description}</p>
                </div>
                {prompt.isFavorite && (
                  <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 ml-2" />
                )}
              </div>

              {/* Content Preview */}
              <div className="bg-gray-50 rounded p-3 mb-3">
                <p className="text-xs text-gray-700 line-clamp-3">{prompt.promptText}</p>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium bg-${getCategoryColor(prompt.category)}-100 text-${getCategoryColor(prompt.category)}-700`}
                >
                  {getCategoryLabel(prompt.category)}
                </span>
                <span className="text-xs text-gray-500">
                  Used {prompt.useCount || 0} times
                </span>
              </div>

              {/* Tags */}
              {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {prompt.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-xs text-gray-600"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                  {prompt.tags.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{prompt.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                {onSelectPrompt && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onSelectPrompt(prompt)}
                    className="flex-1"
                  >
                    <BookOpen className="w-4 h-4 mr-1" />
                    Use
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(prompt.id, prompt.promptText)}
                >
                  {copiedId === prompt.id ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                {onEditClick && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditClick(prompt)}
                  >
                    <Edit2 className="w-4 h-4" />
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
                    <Trash2 className="w-4 h-4 text-red-600" />
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
