'use client';

/**
 * Organization Admin Prompt Library
 * Three-tab interface for managing system and organization prompts
 */

import type { PromptTemplate } from '@/models/Schema';
import { AlertCircle, Edit, Search, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { EditPromptModal } from '@/components/prompts/EditPromptModal';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);

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
    const matchesScope = activeTab === 'usage'
      ? true // Usage tab shows all prompts
      : prompt.scope === activeTab;

    const matchesSearch = prompt.name.toLowerCase().includes(searchQuery.toLowerCase())
      || (prompt.promptText?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;

    return matchesScope && matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...new Set(prompts.map(p => p.category).filter(Boolean))];

  function handleEditPrompt(promptId: string) {
    setEditingPromptId(promptId);
    setShowEditModal(true);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-purple-600">
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
          <button
            onClick={() => setActiveTab('usage')}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'usage'
                ? 'border-purple-600 text-purple-600'
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
                onEdit={handleEditPrompt}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Prompt Modal */}
      {showEditModal && editingPromptId && (
        <EditPromptModal
          promptId={editingPromptId}
          onClose={() => {
            setShowEditModal(false);
            setEditingPromptId(null);
          }}
          onUpdated={() => {
            setShowEditModal(false);
            setEditingPromptId(null);
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
  onEdit?: (id: string) => void;
};

function PromptCard({ prompt, activeTab, onEdit }: PromptCardProps) {
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
        {prompt.promptText}
      </p>

      {/* Usage Stats (for usage tab) */}
      {activeTab === 'usage' && (
        <div className="mb-4 rounded bg-gray-50 p-2 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>
              Uses:
              {prompt.usageCount || 0}
            </span>
            {prompt.lastUsedAt && (
              <span>
                Last:
                {new Date(prompt.lastUsedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          {prompt.therapistName && (
            <div className="mt-1">
              By:
              {prompt.therapistName}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {activeTab === 'organization' && (
          <button
            onClick={() => onEdit?.(prompt.id)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            type="button"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit
          </button>
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
