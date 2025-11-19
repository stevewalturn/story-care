'use client';

/**
 * Organization Admin Prompt Library
 * Three-tab interface for managing system and organization prompts
 */

import { AlertCircle, Copy, Edit, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { PromptTemplate } from '@/models/Schema';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';
import { CreatePromptModal } from '@/components/prompts/CreatePromptModal';

type TabType = 'system' | 'organization' | 'usage';

type PromptWithUsage = PromptTemplate & {
  usageCount?: number;
  lastUsedAt?: Date;
  therapistName?: string;
};

export default function OrgAdminPromptsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('system');
  const [prompts, setPrompts] = useState<PromptWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  // Filter prompts
  const filteredPrompts = prompts.filter((prompt) => {
    const matchesSearch = prompt.name.toLowerCase().includes(searchQuery.toLowerCase())
      || prompt.promptText.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...new Set(prompts.map(p => p.category).filter(Boolean))];

  async function handleCloneToOrg(promptId: string) {
    try {
      const response = await authenticatedFetch('/api/org-admin/prompts', user, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloneFromSystemId: promptId }),
      });

      if (!response.ok) {
        throw new Error('Failed to clone prompt');
      }

      // Refresh organization prompts
      setActiveTab('organization');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to clone prompt');
    }
  }

  async function handleDeletePrompt(promptId: string) {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      const response = await authenticatedFetch(`/api/org-admin/prompts/${promptId}`, user, {
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prompt Library</h1>
              <p className="text-sm text-gray-600">Manage AI prompts for your organization</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'system'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            System Prompts
          </button>
          <button
            onClick={() => setActiveTab('organization')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'organization'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            Organization Prompts
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'usage'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            Therapist Usage
          </button>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          {/* Create Button (only for organization tab) */}
          {activeTab === 'organization' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              type="button"
            >
              <Plus className="h-4 w-4" />
              Create Prompt
            </button>
          )}
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
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your filters'
                : activeTab === 'organization'
                  ? 'Create your first organization prompt'
                  : 'No prompts available'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPrompts.map(prompt => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                activeTab={activeTab}
                onClone={handleCloneToOrg}
                onDelete={handleDeletePrompt}
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
            fetchPrompts();
          }}
        />
      )}
    </div>
  );
}

/**
 * Prompt Card Component
 */
type PromptCardProps = {
  prompt: PromptWithUsage;
  activeTab: TabType;
  onClone: (id: string) => void;
  onDelete: (id: string) => void;
};

function PromptCard({ prompt, activeTab, onClone, onDelete }: PromptCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{prompt.name}</h3>
          {prompt.category && (
            <span className="mt-1 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
              {prompt.category}
            </span>
          )}
        </div>
        {prompt.scope && (
          <span className="text-xs text-gray-500">{prompt.scope}</span>
        )}
      </div>

      {/* Content Preview */}
      <p className="mb-4 text-sm text-gray-600 line-clamp-3">
        {prompt.content}
      </p>

      {/* Usage Stats (for usage tab) */}
      {activeTab === 'usage' && (
        <div className="mb-4 rounded bg-gray-50 p-2 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Uses: {prompt.usageCount || 0}</span>
            {prompt.lastUsedAt && (
              <span>Last: {new Date(prompt.lastUsedAt).toLocaleDateString()}</span>
            )}
          </div>
          {prompt.therapistName && (
            <div className="mt-1">By: {prompt.therapistName}</div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {activeTab === 'system' && (
          <button
            onClick={() => onClone(prompt.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-indigo-600 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
            type="button"
          >
            <Copy className="h-3.5 w-3.5" />
            Clone to Org
          </button>
        )}

        {activeTab === 'organization' && (
          <>
            <button
              onClick={() => {
                // TODO: Open edit modal
                alert('Edit prompt modal not yet implemented');
              }}
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

        {activeTab === 'usage' && (
          <button
            onClick={() => {
              // TODO: View details
              alert('View details not yet implemented');
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            type="button"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
}
