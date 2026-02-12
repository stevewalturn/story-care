'use client';

/**
 * Super Admin AI Models Management
 * Category-based tab interface for managing AI model visibility and pricing
 */

import type { AiModel, ModelCategory, ModelStatus } from '@/models/Schema';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  Cpu,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  Image,
  Mic,
  Music,
  Plus,
  Search,
  Type,
  Video,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AddModelModal } from '@/components/super-admin/AddModelModal';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type Category = 'all' | ModelCategory;

const CATEGORIES: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All Models', icon: <Cpu className="h-4 w-4" /> },
  { id: 'text_to_image', label: 'Text to Image', icon: <Image className="h-4 w-4" /> },
  { id: 'image_to_image', label: 'Image to Image', icon: <Image className="h-4 w-4" /> },
  { id: 'image_to_video', label: 'Image to Video', icon: <Video className="h-4 w-4" /> },
  { id: 'text_to_video', label: 'Text to Video', icon: <Video className="h-4 w-4" /> },
  { id: 'text_to_text', label: 'Text to Text', icon: <Type className="h-4 w-4" /> },
  { id: 'image_to_text', label: 'Image to Text', icon: <FileText className="h-4 w-4" /> },
  { id: 'music_generation', label: 'Music', icon: <Music className="h-4 w-4" /> },
  { id: 'transcription', label: 'Transcription', icon: <Mic className="h-4 w-4" /> },
];

const STATUS_COLORS: Record<ModelStatus, string> = {
  active: 'bg-green-100 text-green-800',
  hidden: 'bg-yellow-100 text-yellow-800',
  deprecated: 'bg-orange-100 text-orange-800',
  disabled: 'bg-red-100 text-red-800',
};

const STATUS_OPTIONS: { value: ModelStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'deprecated', label: 'Deprecated' },
];

export default function SuperAdminAiModelsPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [models, setModels] = useState<AiModel[]>([]);
  const [counts, setCounts] = useState<Record<string, { total: number; active: number }>>({});
  const [providers, setProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedModels, setSelectedModels] = useState<Set<string>>(() => new Set());
  const [editingModel, setEditingModel] = useState<AiModel | null>(null);
  const [addingModel, setAddingModel] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<ModelStatus | ''>('');
  const [priceSortDirection, setPriceSortDirection] = useState<'asc' | 'desc' | null>(null);

  // Fetch models
  const fetchModels = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', '500');
      if (activeCategory !== 'all') {
        params.set('category', activeCategory);
      }
      if (searchQuery) {
        params.set('search', searchQuery);
      }
      if (selectedProvider) {
        params.set('provider', selectedProvider);
      }
      if (selectedStatus) {
        params.set('status', selectedStatus);
      }

      const endpoint = `/api/super-admin/ai-models?${params.toString()}`;
      const response = await authenticatedFetch(endpoint, user);

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      const data = await response.json();
      setModels(data.models || []);
      setCounts(data.counts || {});
      setProviders(data.providers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeCategory, searchQuery, selectedProvider, selectedStatus]);

  // Clear selection when category changes
  useEffect(() => {
    setSelectedModels(new Set());
  }, [activeCategory]);

  // Get category count
  const getCategoryCount = (category: Category) => {
    if (category === 'all') {
      return Object.values(counts).reduce((sum, c) => sum + c.total, 0);
    }
    return counts[category]?.total || 0;
  };

  // Toggle model selection
  const toggleModelSelection = (modelId: string) => {
    const newSelection = new Set(selectedModels);
    if (newSelection.has(modelId)) {
      newSelection.delete(modelId);
    } else {
      newSelection.add(modelId);
    }
    setSelectedModels(newSelection);
  };

  // Select all visible models
  const toggleSelectAll = () => {
    if (selectedModels.size === models.length) {
      setSelectedModels(new Set());
    } else {
      setSelectedModels(new Set(models.map(m => m.id)));
    }
  };

  // Update single model status
  const updateModelStatus = async (modelId: string, status: ModelStatus) => {
    try {
      const response = await authenticatedFetch(`/api/super-admin/ai-models/${modelId}`, user, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update model');
      }

      // Update local state
      setModels(prev => prev.map(m =>
        m.id === modelId ? { ...m, status } : m,
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update model');
    }
  };

  // Bulk update status
  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedModels.size === 0) return;

    try {
      const response = await authenticatedFetch('/api/super-admin/ai-models/bulk', user, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelIds: Array.from(selectedModels),
          status: bulkStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk update models');
      }

      // Refresh data
      await fetchModels();
      setSelectedModels(new Set());
      setBulkStatus('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to bulk update models');
    }
  };

  // Format price for display
  const formatPrice = (model: AiModel) => {
    if (!model.costPerUnit) return '-';
    const cost = Number.parseFloat(model.costPerUnit);
    const unit = model.pricingUnit?.replace('per_', '/').replace('_', ' ') || '';
    return `$${cost.toFixed(4)}${unit}`;
  };

  // Sort models by price when sort is active
  const sortedModels = useMemo(() => {
    if (!priceSortDirection) return models;
    return [...models].sort((a, b) => {
      const costA = a.costPerUnit ? Number.parseFloat(a.costPerUnit) : 0;
      const costB = b.costPerUnit ? Number.parseFloat(b.costPerUnit) : 0;
      return priceSortDirection === 'asc' ? costA - costB : costB - costA;
    });
  }, [models, priceSortDirection]);

  // Toggle price sort: asc -> desc -> null
  const togglePriceSort = () => {
    setPriceSortDirection(prev =>
      prev === null ? 'asc' : prev === 'asc' ? 'desc' : null,
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                <Cpu className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Models</h1>
                <p className="text-sm text-gray-600">Manage model visibility and pricing across the platform</p>
              </div>
            </div>
            <button
              onClick={() => setAddingModel(true)}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
              type="button"
            >
              <Plus className="h-4 w-4" />
              Add Model
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              type="button"
            >
              {cat.icon}
              {cat.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  activeCategory === cat.id
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {getCategoryCount(cat.id)}
              </span>
            </button>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative max-w-md min-w-[200px] flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-9 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Provider Filter */}
          <div className="relative">
            <select
              value={selectedProvider}
              onChange={e => setSelectedProvider(e.target.value)}
              className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pr-8 pl-3 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            >
              <option value="">All Providers</option>
              {providers.map(provider => (
                <option key={provider} value={provider}>{provider}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pr-8 pl-3 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Bulk Actions */}
          {selectedModels.size > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2">
              <span className="text-sm font-medium text-purple-700">
                {selectedModels.size}
                {' '}
                selected
              </span>
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value as ModelStatus | '')}
                className="rounded border border-purple-300 bg-white px-2 py-1 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
              >
                <option value="">Set Status...</option>
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={handleBulkStatusUpdate}
                disabled={!bulkStatus}
                className="rounded bg-purple-600 px-2 py-1 text-xs font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                Apply
              </button>
              <button
                onClick={() => setSelectedModels(new Set())}
                className="text-purple-600 hover:text-purple-800"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
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
        ) : models.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <Cpu className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <h3 className="mb-1 text-lg font-semibold text-gray-900">No models found</h3>
            <p className="text-sm text-gray-600">
              {searchQuery || selectedProvider || selectedStatus
                ? 'Try adjusting your filters'
                : 'Run the seed script to populate AI models'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedModels.size === models.length && models.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Model
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    <button
                      type="button"
                      onClick={togglePriceSort}
                      className="inline-flex items-center gap-1 hover:text-gray-900"
                    >
                      Price
                      {priceSortDirection === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : priceSortDirection === 'desc' ? (
                        <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-gray-300" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {sortedModels.map(model => (
                  <tr key={model.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedModels.has(model.id)}
                        onChange={() => toggleModelSelection(model.id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{model.displayName}</div>
                        <div className="font-mono text-xs text-gray-500">{model.modelId}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">{model.provider}</div>
                      {model.providerGroup && model.providerGroup !== model.provider && (
                        <div className="text-xs text-gray-500">{model.providerGroup}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        {model.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-900">
                        <DollarSign className="h-3 w-3 text-gray-400" />
                        {formatPrice(model)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[model.status]}`}>
                        {model.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {model.status === 'active' ? (
                          <button
                            onClick={() => updateModelStatus(model.id, 'hidden')}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            title="Hide model"
                            type="button"
                          >
                            <EyeOff className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => updateModelStatus(model.id, 'active')}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-green-600"
                            title="Activate model"
                            type="button"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setEditingModel(model)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-purple-600"
                          title="Edit model"
                          type="button"
                        >
                          <DollarSign className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Model Modal */}
        <AddModelModal
          isOpen={addingModel}
          onClose={() => setAddingModel(false)}
          onSave={async (data) => {
            try {
              const response = await authenticatedFetch(
                '/api/super-admin/ai-models',
                user,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                },
              );

              if (!response.ok) {
                const err = await response.json();
                const errorMsg = err.error || 'Failed to create model';
                // If duplicate modelId, show error on the modelId field
                if (response.status === 409) {
                  return { error: errorMsg, field: 'modelId' };
                }
                return { error: errorMsg };
              }

              await fetchModels();
              setAddingModel(false);
              return {};
            } catch (err) {
              return { error: err instanceof Error ? err.message : 'Failed to create model' };
            }
          }}
        />

        {/* Edit Modal */}
        {editingModel && (
          <ModelEditModal
            model={editingModel}
            onClose={() => setEditingModel(null)}
            onSave={async (updates) => {
              try {
                const response = await authenticatedFetch(
                  `/api/super-admin/ai-models/${editingModel.id}`,
                  user,
                  {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates),
                  },
                );

                if (!response.ok) {
                  throw new Error('Failed to update model');
                }

                await fetchModels();
                setEditingModel(null);
              } catch (err) {
                alert(err instanceof Error ? err.message : 'Failed to update model');
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Model Edit Modal Component
 */
type ModelEditModalProps = {
  model: AiModel;
  onClose: () => void;
  onSave: (updates: Partial<AiModel>) => Promise<void>;
};

function ModelEditModal({ model, onClose, onSave }: ModelEditModalProps) {
  const [status, setStatus] = useState<ModelStatus>(model.status);
  const [costPerUnit, setCostPerUnit] = useState(model.costPerUnit || '');
  const [pricingUnit, setPricingUnit] = useState(model.pricingUnit || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        status,
        costPerUnit: costPerUnit || null,
        pricingUnit: pricingUnit as any || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Edit Model</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" type="button">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="font-medium text-gray-900">{model.displayName}</div>
          <div className="font-mono text-sm text-gray-500">{model.modelId}</div>
        </div>

        <div className="space-y-4">
          {/* Status */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as ModelStatus)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Cost Per Unit */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Cost Per Unit ($)</label>
            <input
              type="number"
              step="0.000001"
              value={costPerUnit}
              onChange={e => setCostPerUnit(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Pricing Unit */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Pricing Unit</label>
            <select
              value={pricingUnit}
              onChange={e => setPricingUnit(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            >
              <option value="">Select unit...</option>
              <option value="per_image">Per Image</option>
              <option value="per_second">Per Second</option>
              <option value="per_minute">Per Minute</option>
              <option value="per_1k_tokens">Per 1K Tokens</option>
              <option value="per_request">Per Request</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
            type="button"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
