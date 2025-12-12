/**
 * Prompt Library Page (Therapist View)
 * Browse and manage AI prompts
 */

'use client';

import type { PromptTemplate } from '@/models/Schema';
import { Eye, FileText, MessageCircle, Plus, Search, Sparkles, Target, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CreatePromptModal } from '@/components/prompts/CreatePromptModal';
import { ViewEditPromptModal } from '@/components/prompts/ViewEditPromptModal';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

const categoryIcons = {
  analysis: Target,
  creative: Sparkles,
  extraction: FileText,
  reflection: MessageCircle,
};

const categoryColors = {
  analysis: 'bg-blue-100 text-blue-700',
  creative: 'bg-purple-100 text-purple-700',
  extraction: 'bg-green-100 text-green-700',
  reflection: 'bg-orange-100 text-orange-700',
};

export default function PromptLibraryPage() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, [user]);

  const fetchPrompts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/therapist/prompts', user);
      const data = await response.json();
      setPrompts(data.prompts || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt);
    setIsViewModalOpen(true);
  };

  const handleEdit = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (prompt: PromptTemplate) => {
    if (!user) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${prompt.name}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      await authenticatedFetch(`/api/therapist/prompts/${prompt.id}`, user, {
        method: 'DELETE',
      });

      // Refresh prompts list
      fetchPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      alert('Failed to delete prompt. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedPrompt(null);
  };

  const handlePromptUpdated = () => {
    fetchPrompts();
    handleCloseModal();
  };

  const filteredPrompts = prompts.filter((prompt) => {
    const matchesSearch = prompt.name.toLowerCase().includes(searchQuery.toLowerCase())
      || prompt.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || prompt.category === categoryFilter;
    const matchesScope = scopeFilter === 'all' || prompt.scope === scopeFilter;
    return matchesSearch && matchesCategory && matchesScope;
  });

  const groupedPrompts = {
    system: filteredPrompts.filter(p => p.scope === 'system'),
    organization: filteredPrompts.filter(p => p.scope === 'organization'),
    private: filteredPrompts.filter(p => p.scope === 'private'),
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading prompts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prompt Library</h1>
            <p className="text-sm text-gray-600">Browse and manage AI analysis prompts</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Create Prompt
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          {/* Search */}
          <div className="relative min-w-[300px] flex-1">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search prompts..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pr-4 pl-10 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="analysis">Analysis</option>
            <option value="creative">Creative</option>
            <option value="extraction">Extraction</option>
            <option value="reflection">Reflection</option>
          </select>

          {/* Scope Filter */}
          <select
            value={scopeFilter}
            onChange={e => setScopeFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          >
            <option value="all">All Scopes</option>
            <option value="system">System</option>
            <option value="organization">Organization</option>
            <option value="private">My Private</option>
          </select>
        </div>

        {/* System Prompts */}
        {groupedPrompts.system.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              📚 System Prompts (
              {groupedPrompts.system.length}
              )
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupedPrompts.system.map(prompt => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onUpdate={fetchPrompts}
                  onView={handleViewDetails}
                />
              ))}
            </div>
          </div>
        )}

        {/* Organization Prompts */}
        {groupedPrompts.organization.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              🏢 Organization Prompts (
              {groupedPrompts.organization.length}
              )
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupedPrompts.organization.map(prompt => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onUpdate={fetchPrompts}
                  onView={handleViewDetails}
                />
              ))}
            </div>
          </div>
        )}

        {/* Private Prompts */}
        {groupedPrompts.private.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              🔒 My Private Prompts (
              {groupedPrompts.private.length}
              )
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupedPrompts.private.map(prompt => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onUpdate={fetchPrompts}
                  onView={handleViewDetails}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  editable
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredPrompts.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">No prompts found matching your criteria.</p>
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
      {isViewModalOpen && selectedPrompt && (
        <ViewEditPromptModal
          prompt={selectedPrompt}
          canEdit={selectedPrompt.scope === 'private'}
          canDelete={selectedPrompt.scope === 'private'}
          apiEndpoint="/api/therapist/prompts"
          onClose={handleCloseModal}
          onSaved={handlePromptUpdated}
          onDeleted={() => {
            fetchPrompts();
            handleCloseModal();
          }}
        />
      )}
    </div>
  );
}

function PromptCard({
  prompt,
  onUpdate: _onUpdate,
  onView,
  onEdit,
  onDelete,
  editable = false,
}: {
  prompt: PromptTemplate;
  onUpdate: () => void;
  onView: (prompt: PromptTemplate) => void;
  onEdit?: (prompt: PromptTemplate) => void;
  onDelete?: (prompt: PromptTemplate) => void;
  editable?: boolean;
}) {
  const IconComponent = categoryIcons[prompt.category as keyof typeof categoryIcons];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <div className={`rounded-lg p-2 ${categoryColors[prompt.category as keyof typeof categoryColors]}`}>
          <IconComponent className="h-5 w-5" />
        </div>
        <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 uppercase">
          {prompt.scope}
        </span>
      </div>

      <h3 className="mb-2 font-semibold text-gray-900">{prompt.name}</h3>
      <p className="mb-3 line-clamp-2 text-sm text-gray-600">
        {prompt.description || 'No description provided'}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="capitalize">{prompt.category}</span>
        <span>Used {prompt.useCount} times</span>
      </div>

      {/* View Details Button - Always visible */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => onView(prompt)}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          <Eye className="h-4 w-4" />
          View Details
        </button>
      </div>

      {/* Edit/Delete Buttons - Only for editable prompts */}
      {editable && onEdit && onDelete && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(prompt)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(prompt)}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
