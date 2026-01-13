/**
 * Prompt Library Page (Therapist View)
 * Browse and manage AI prompts with drag-and-drop reordering
 */

'use client';

import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { PromptTemplate } from '@/models/Schema';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  FileText,
  MessageCircle,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { SortablePromptCard } from '@/components/prompts/SortablePromptCard';
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
  const [hasCustomOrder, setHasCustomOrder] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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
      setHasCustomOrder(data.hasCustomOrder || false);
    } catch (error) {
      console.error('Error fetching prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveOrder = useCallback(async (promptIds: string[]) => {
    if (!user) return;

    try {
      setIsSaving(true);
      await authenticatedFetch('/api/therapist/prompts/order', user, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptIds }),
      });
      setHasCustomOrder(true);
    } catch (error) {
      console.error('Error saving order:', error);
      // Revert on error
      fetchPrompts();
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  const resetOrder = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      await authenticatedFetch('/api/therapist/prompts/order', user, {
        method: 'DELETE',
      });
      setHasCustomOrder(false);
      fetchPrompts();
    } catch (error) {
      console.error('Error resetting order:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = filteredPrompts.findIndex(p => p.id === active.id);
    const newIndex = filteredPrompts.findIndex(p => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Update local state optimistically
    const newPrompts = arrayMove(filteredPrompts, oldIndex, newIndex);

    // Update the main prompts array
    const promptMap = new Map(prompts.map(p => [p.id, p]));
    const reorderedIds = newPrompts.map(p => p.id);

    // Reorder prompts based on the new filtered order
    const reorderedPrompts = reorderedIds
      .map(id => promptMap.get(id))
      .filter((p): p is PromptTemplate => p !== undefined);

    // Add any prompts that weren't in the filtered list
    const remainingPrompts = prompts.filter(p => !reorderedIds.includes(p.id));
    const finalPrompts = [...reorderedPrompts, ...remainingPrompts];

    setPrompts(finalPrompts);

    // Save to server
    saveOrder(finalPrompts.map(p => p.id));
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleDelete = async (prompt: PromptTemplate) => {
    if (!user) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${prompt.name}"? This action cannot be undone.`,
    );

    if (!confirmDelete) return;

    try {
      await authenticatedFetch(`/api/therapist/prompts/${prompt.id}`, user, {
        method: 'DELETE',
      });
      fetchPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      alert('Failed to delete prompt. Please try again.');
    }
  };

  const filteredPrompts = prompts.filter((prompt) => {
    const matchesSearch = prompt.name.toLowerCase().includes(searchQuery.toLowerCase())
      || prompt.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || prompt.category === categoryFilter;
    const matchesScope = scopeFilter === 'all' || prompt.scope === scopeFilter;
    return matchesSearch && matchesCategory && matchesScope;
  });

  // For grouped view (when no custom order)
  const groupedPrompts = {
    system: filteredPrompts.filter(p => p.scope === 'system'),
    organization: filteredPrompts.filter(p => p.scope === 'organization'),
    private: filteredPrompts.filter(p => p.scope === 'private'),
  };

  // Get the active prompt for drag overlay
  const activePrompt = activeId ? prompts.find(p => p.id === activeId) : null;

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
            <p className="text-sm text-gray-600">
              Browse and manage AI analysis prompts
              {hasCustomOrder && ' • Custom order applied'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasCustomOrder && (
              <button
                type="button"
                onClick={resetOrder}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Reset Order
              </button>
            )}
            <Link
              href="/therapist/prompt-library/create"
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
              Create Prompt
            </Link>
          </div>
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
              className="w-full rounded-lg border border-gray-300 py-2.5 pr-4 pl-10 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
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
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
          >
            <option value="all">All Scopes</option>
            <option value="system">System</option>
            <option value="organization">Organization</option>
            <option value="private">My Private</option>
          </select>
        </div>

        {/* Drag hint */}
        {filteredPrompts.length > 1 && (
          <p className="mb-4 text-xs text-gray-500">
            Tip: Drag cards to reorder. Your order will be saved automatically.
          </p>
        )}

        {/* DnD Context */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {/* Show flat grid when custom order or when filters are applied */}
          {(hasCustomOrder || searchQuery || categoryFilter !== 'all' || scopeFilter !== 'all') ? (
            <SortableContext items={filteredPrompts.map(p => p.id)} strategy={rectSortingStrategy}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPrompts.map(prompt => (
                  <SortablePromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onDelete={prompt.scope === 'private' ? handleDelete : undefined}
                    editable={prompt.scope === 'private'}
                  />
                ))}
              </div>
            </SortableContext>
          ) : (
            /* Show grouped view when no custom order and no filters */
            <SortableContext items={filteredPrompts.map(p => p.id)} strategy={rectSortingStrategy}>
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
                      <SortablePromptCard
                        key={prompt.id}
                        prompt={prompt}
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
                      <SortablePromptCard
                        key={prompt.id}
                        prompt={prompt}
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
                      <SortablePromptCard
                        key={prompt.id}
                        prompt={prompt}
                        onDelete={handleDelete}
                        editable
                      />
                    ))}
                  </div>
                </div>
              )}
            </SortableContext>
          )}

          {/* Drag Overlay */}
          <DragOverlay>
            {activePrompt && (
              <div className="rounded-lg border border-purple-400 bg-white p-4 opacity-90 shadow-xl">
                <div className="mb-3 flex items-start justify-between">
                  <div className={`rounded-lg p-2 ${categoryColors[activePrompt.category as keyof typeof categoryColors]}`}>
                    {(() => {
                      const IconComponent = categoryIcons[activePrompt.category as keyof typeof categoryIcons];
                      return <IconComponent className="h-5 w-5" />;
                    })()}
                  </div>
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 uppercase">
                    {activePrompt.scope}
                  </span>
                </div>
                <h3 className="mb-2 font-semibold text-gray-900">{activePrompt.name}</h3>
                <p className="line-clamp-2 text-sm text-gray-600">
                  {activePrompt.description || 'No description provided'}
                </p>
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {/* Empty State */}
        {filteredPrompts.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">No prompts found matching your criteria.</p>
          </div>
        )}

        {/* Saving indicator */}
        {isSaving && (
          <div className="fixed right-4 bottom-4 rounded-lg bg-purple-600 px-4 py-2 text-sm text-white shadow-lg">
            Saving order...
          </div>
        )}
      </div>
    </div>
  );
}
