'use client';

/**
 * Therapist Prompts Library
 * View system prompts + create/manage private prompts
 */

import type { PromptTemplate } from '@/models/Schema';
import { AlertCircle, Edit, Eye, Lock, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CreatePromptModal } from '@/components/prompts/CreatePromptModal';
import { ViewEditPromptModal } from '@/components/prompts/ViewEditPromptModal';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type Category = 'all' | 'analysis' | 'creative' | 'extraction' | 'reflection';

export default function TherapistPromptsPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);

  // Fetch prompts
  const fetchPrompts = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = '/api/therapist/prompts';
      const response = await authenticatedFetch(endpoint, user);

      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }

      const data = await response.json();
      setPrompts(data.prompts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [user]);

  // Filter prompts by category and search
  const filteredPrompts = prompts.filter((prompt) => {
    const matchesCategory = activeCategory === 'all' || prompt.category === activeCategory;
    const matchesSearch = prompt.name.toLowerCase().includes(searchQuery.toLowerCase())
      || prompt.promptText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get prompt counts by category
  const getCategoryCount = (category: Category) => {
    if (category === 'all') return prompts.length;
    return prompts.filter(p => p.category === category).length;
  };

  async function handleDeletePrompt(promptId: string) {
    if (!confirm('Are you sure you want to delete this private prompt?')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/therapist/prompts/${promptId}`, user, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete prompt');
      }

      // Remove from local state
      setPrompts(prev => prev.filter(p => p.id !== promptId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete prompt');
    }
  }

  const categories: { id: Category; label: string }[] = [
    { id: 'all', label: 'All Prompts' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'creative', label: 'Creative' },
    { id: 'extraction', label: 'Extraction' },
    { id: 'reflection', label: 'Reflection' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Prompt Library</h1>
                <p className="text-sm text-gray-600">Browse system prompts & manage your private prompts</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              type="button"
            >
              <Plus className="h-4 w-4" />
              Create Private Prompt
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              type="button"
            >
              {cat.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  activeCategory === cat.id
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {getCategoryCount(cat.id)}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-9 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <Sparkles className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <h3 className="mb-1 text-lg font-semibold text-gray-900">No prompts found</h3>
            <p className="text-sm text-gray-600">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first private prompt to get started'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPrompts.map(prompt => (
              <TherapistPromptCard
                key={prompt.id}
                prompt={prompt}
                onView={() => setSelectedPrompt(prompt)}
                onDelete={handleDeletePrompt}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Prompt Modal */}
      {showCreateModal && (
        <CreatePromptModal
          scope="private"
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchPrompts();
          }}
        />
      )}

      {/* View/Edit Prompt Modal */}
      {selectedPrompt && (
        <ViewEditPromptModal
          prompt={selectedPrompt}
          onClose={() => setSelectedPrompt(null)}
          onSaved={() => {
            fetchPrompts();
            setSelectedPrompt(null);
          }}
          onDeleted={() => {
            fetchPrompts();
            setSelectedPrompt(null);
          }}
          apiEndpoint="/api/therapist/prompts"
          canEdit={selectedPrompt.scope === 'private'}
          canDelete={selectedPrompt.scope === 'private'}
        />
      )}
    </div>
  );
}

/**
 * Therapist Prompt Card Component
 */
type TherapistPromptCardProps = {
  prompt: PromptTemplate;
  onView: () => void;
  onDelete: (id: string) => void;
};

function TherapistPromptCard({ prompt, onView, onDelete }: TherapistPromptCardProps) {
  const isPrivate = prompt.scope === 'private';
  const isOrg = prompt.scope === 'organization';
  const isSystem = prompt.scope === 'system';

  // Extract schema type from jsonSchema
  const getSchemaType = (): string | null => {
    if (!prompt.jsonSchema) return null;
    try {
      const schema = typeof prompt.jsonSchema === 'string'
        ? JSON.parse(prompt.jsonSchema)
        : prompt.jsonSchema;
      return schema.schemaType || null;
    } catch {
      return null;
    }
  };

  const schemaType = getSchemaType();

  // Format schema type for display
  const formatSchemaType = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{prompt.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {prompt.category && (
              <span className="inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {prompt.category}
              </span>
            )}
            {prompt.outputType && (
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                prompt.outputType === 'json'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
              >
                {prompt.outputType === 'text' && '📝'}
                {prompt.outputType === 'json' && '🔧'}
                {' '}
                {prompt.outputType}
              </span>
            )}
            {schemaType && (
              <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                📋 {formatSchemaType(schemaType)}
              </span>
            )}
            {isPrivate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                <Lock className="h-3 w-3" />
                Private
              </span>
            )}
            {isOrg && (
              <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Organization
              </span>
            )}
            {isSystem && (
              <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                System
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content Preview */}
      <p className="mb-4 line-clamp-3 text-sm text-gray-600">
        {prompt.promptText}
      </p>

      {/* Metadata */}
      <div className="mb-4 space-y-1 text-xs text-gray-500">
        {prompt.createdAt && (
          <div>
            Created:
            {' '}
            {new Date(prompt.createdAt).toLocaleDateString()}
          </div>
        )}
        {prompt.updatedAt && prompt.updatedAt !== prompt.createdAt && (
          <div>
            Updated:
            {' '}
            {new Date(prompt.updatedAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onView}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
          type="button"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </button>
        {isPrivate && (
          <>
            <button
              onClick={onView}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              type="button"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              onClick={() => onDelete(prompt.id)}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              type="button"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
