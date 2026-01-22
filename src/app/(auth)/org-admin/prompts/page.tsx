'use client';

/**
 * Organization Admin Prompt Library
 * Two-tab interface for viewing system prompts and managing organization prompts
 */

import type { PromptTemplate } from '@/models/Schema';
import { AlertCircle, Edit, Eye, Plus, Search, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CreatePromptModal } from '@/components/prompts/CreatePromptModal';
import { ViewEditPromptModal } from '@/components/prompts/ViewEditPromptModal';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type TabType = 'system' | 'organization';

export default function OrgAdminPromptsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('system');
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);

  // Fetch prompts based on active tab
  const fetchPrompts = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = `/api/org-admin/prompts?scope=${activeTab}`;
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
  }, [activeTab, user]);

  // Filter prompts by scope (based on active tab) and search/category
  const filteredPrompts = prompts.filter((prompt) => {
    // Filter by scope based on active tab
    const matchesScope = prompt.scope === activeTab;

    const matchesSearch = prompt.name.toLowerCase().includes(searchQuery.toLowerCase())
      || (prompt.promptText?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;

    return matchesScope && matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...new Set(prompts.map(p => p.category).filter(Boolean))];

  function handleViewPrompt(prompt: PromptTemplate) {
    setSelectedPrompt(prompt);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-purple-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Prompt Library</h1>
                <p className="text-sm text-gray-600">Manage AI prompts for your organization</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-purple-700"
              type="button"
            >
              <Plus className="h-4 w-4" />
              Create Organization Prompt
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('system')}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'system'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            System Prompts
          </button>
          <button
            onClick={() => setActiveTab('organization')}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'organization'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            Organization Prompts
          </button>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-9 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
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
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your filters'
                : activeTab === 'organization'
                  ? 'Create your first organization prompt to get started'
                  : 'No prompts available'}
            </p>
            {activeTab === 'organization' && !searchQuery && selectedCategory === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                type="button"
              >
                <Plus className="h-4 w-4" />
                Create Organization Prompt
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPrompts.map(prompt => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                activeTab={activeTab}
                onView={handleViewPrompt}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Prompt Modal */}
      {showCreateModal && (
        <CreatePromptModal
          scope="organization"
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            setActiveTab('organization'); // Switch to organization tab to see the new prompt
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
            setSelectedPrompt(null);
            fetchPrompts();
          }}
          onDeleted={() => {
            setSelectedPrompt(null);
            fetchPrompts();
          }}
          apiEndpoint="/api/org-admin/prompts"
          canEdit={selectedPrompt.scope === 'organization'}
          canDelete={selectedPrompt.scope === 'organization'}
        />
      )}
    </div>
  );
}

/**
 * Prompt Card Component
 */
type PromptCardProps = {
  prompt: PromptTemplate;
  activeTab: TabType;
  onView?: (prompt: PromptTemplate) => void;
};

function PromptCard({ prompt, activeTab, onView }: PromptCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{prompt.name}</h3>
          {prompt.category && (
            <span className="mt-1 inline-block rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
              {prompt.category}
            </span>
          )}
        </div>
        {prompt.scope && (
          <span className="text-xs text-gray-500">{prompt.scope}</span>
        )}
      </div>

      {/* Content Preview */}
      <p className="mb-4 line-clamp-3 text-sm text-gray-600">
        {prompt.promptText || prompt.systemPrompt}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onView?.(prompt)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          type="button"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </button>
        {activeTab === 'organization' && (
          <button
            onClick={() => onView?.(prompt)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-purple-300 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100"
            type="button"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
