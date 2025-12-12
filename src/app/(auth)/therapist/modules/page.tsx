/**
 * Therapist Modules Page
 * Personal private treatment module management with improved tabbed UI
 */

'use client';

import type { TreatmentModuleWithPrompts } from '@/models/Schema';
import { Layers, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ModuleCard } from '@/components/modules/ModuleCard';
import { ModuleDetailsModal } from '@/components/modules/ModuleDetailsModal';
import { ModuleEditor } from '@/components/modules/ModuleEditor';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type TherapeuticDomain = 'all' | 'self_strength' | 'relationships_repair' | 'identity_transformation' | 'purpose_future';
type ViewMode = 'private' | 'organization' | 'templates';

export default function TherapistModulesPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('private');
  const [activeDomain, setActiveDomain] = useState<TherapeuticDomain>('all');
  const [privateModules, setPrivateModules] = useState<TreatmentModuleWithPrompts[]>([]);
  const [templates, setTemplates] = useState<TreatmentModuleWithPrompts[]>([]);
  const [orgModules, setOrgModules] = useState<TreatmentModuleWithPrompts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<TreatmentModuleWithPrompts | null>(null);
  const [editableModule, setEditableModule] = useState<TreatmentModuleWithPrompts | null>(null);

  // Fetch modules
  useEffect(() => {
    fetchModules();
  }, []);

  async function fetchModules() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('includeTemplates', 'true');
      params.append('includeOrgModules', 'true');

      const response = await authenticatedFetch(
        `/api/therapist/modules?${params.toString()}`,
        user,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch modules');
      }

      const data = await response.json();
      setPrivateModules(data.privateModules || []);
      setTemplates(data.templates || []);
      setOrgModules(data.orgModules || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  // Get items based on view mode
  const currentItems = viewMode === 'private' ? privateModules : viewMode === 'organization' ? orgModules : templates;

  // Filter by domain and search
  const filteredItems = currentItems.filter((item) => {
    const matchesDomain = activeDomain === 'all' || item.domain === activeDomain;
    const matchesSearch = !searchQuery
      || item.name.toLowerCase().includes(searchQuery.toLowerCase())
      || item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  // Get count by domain for current view mode
  const getDomainCount = (domain: TherapeuticDomain) => {
    if (domain === 'all') return currentItems.length;
    return currentItems.filter(m => m.domain === domain).length;
  };

  const domains: { id: TherapeuticDomain; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'self_strength', label: 'Self & Strength' },
    { id: 'relationships_repair', label: 'Relationships & Repair' },
    { id: 'identity_transformation', label: 'Identity & Transformation' },
    { id: 'purpose_future', label: 'Purpose & Future' },
  ];

  // Get view mode description
  const getViewModeDescription = () => {
    switch (viewMode) {
      case 'private':
        return 'Your personal treatment modules. You can edit, archive, and customize these modules.';
      case 'organization':
        return 'Modules created by your organization administrators. View details for reference.';
      case 'templates':
        return 'Global treatment modules designed by clinical experts. View details for inspiration.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Treatment Modules</h1>
                <p className="text-sm text-gray-600">
                  {getViewModeDescription()}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditableModule(null);
                setIsEditorOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              type="button"
            >
              <Plus className="h-4 w-4" />
              New Module
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
          <button
            onClick={() => {
              setViewMode('private');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              viewMode === 'private'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            My Private Modules
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                viewMode === 'private'
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {privateModules.length}
            </span>
          </button>
          <button
            onClick={() => {
              setViewMode('organization');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              viewMode === 'organization'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            Organization Modules
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                viewMode === 'organization'
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {orgModules.length}
            </span>
          </button>
          <button
            onClick={() => {
              setViewMode('templates');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              viewMode === 'templates'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            System Templates
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                viewMode === 'templates'
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {templates.length}
            </span>
          </button>
        </div>

        {/* Domain Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
          {domains.map(dom => (
            <button
              key={dom.id}
              onClick={() => setActiveDomain(dom.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                activeDomain === dom.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              type="button"
            >
              {dom.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  activeDomain === dom.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {getDomainCount(dom.id)}
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
              placeholder={
                viewMode === 'private'
                  ? 'Search private modules...'
                  : viewMode === 'organization'
                    ? 'Search organization modules...'
                    : 'Search templates...'
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-9 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <Layers className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <h3 className="mb-1 text-lg font-semibold text-gray-900">
              {searchQuery
                ? 'No modules found'
                : viewMode === 'private'
                  ? 'No personal modules yet'
                  : viewMode === 'organization'
                    ? 'No organization modules'
                    : 'No templates available'}
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              {searchQuery
                ? 'Try adjusting your search or changing the domain filter'
                : viewMode === 'private'
                  ? 'Create your first personal module to get started'
                  : viewMode === 'organization'
                    ? 'Your organization hasn\'t created any modules yet'
                    : 'No system templates available in this domain'}
            </p>
            {viewMode === 'private' && !searchQuery && (
              <button
                onClick={() => {
                  setEditableModule(null);
                  setIsEditorOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Create Module
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map(module => (
              <ModuleCard
                key={module.id}
                module={module}
                onView={() => {
                  setSelectedModule(module);
                  setIsDetailsOpen(true);
                }}
                onEdit={viewMode === 'private' ? () => {
                  setEditableModule(module);
                  setIsEditorOpen(true);
                } : undefined}
                onRefresh={fetchModules}
                apiEndpoint={viewMode === 'private' ? '/api/therapist/modules' : undefined}
                isTemplate={viewMode === 'templates'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Module Editor Modal */}
      {isEditorOpen && (
        <ModuleEditor
          module={editableModule}
          onClose={() => {
            setIsEditorOpen(false);
            setEditableModule(null);
          }}
          onSaved={() => {
            setIsEditorOpen(false);
            setEditableModule(null);
            fetchModules();
          }}
          apiEndpoint="/api/therapist/modules"
          scope="private"
        />
      )}

      {/* Module Details Modal */}
      {isDetailsOpen && selectedModule && (
        <ModuleDetailsModal
          module={selectedModule}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedModule(null);
          }}
          onEdit={selectedModule.scope === 'private' ? () => {
            setIsDetailsOpen(false);
            setEditableModule(selectedModule);
            setIsEditorOpen(true);
          } : undefined}
        />
      )}
    </div>
  );
}
