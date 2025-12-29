/**
 * Organization Admin Modules Page
 * Organization-specific treatment module management + template copying
 */

'use client';

import type { TreatmentModule } from '@/models/Schema';
import { Copy, Layers, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ModuleCard } from '@/components/modules/ModuleCard';
import { ModuleDetailsModal } from '@/components/modules/ModuleDetailsModal';
import { ModuleEditor } from '@/components/modules/ModuleEditor';
import { CopyTemplateModal } from '@/components/org-admin/CopyTemplateModal';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type TherapeuticDomain = 'all' | 'self_strength' | 'relationships_repair' | 'identity_transformation' | 'purpose_future';
type ViewMode = 'my_modules' | 'templates';

export default function OrgAdminModulesPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('my_modules');
  const [activeDomain, setActiveDomain] = useState<TherapeuticDomain>('all');
  const [modules, setModules] = useState<TreatmentModule[]>([]);
  const [templates, setTemplates] = useState<TreatmentModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<TreatmentModule | null>(null);

  // Fetch modules and templates
  useEffect(() => {
    fetchModules();
  }, [user]);

  async function fetchModules() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('includeTemplates', 'true');

      const response = await authenticatedFetch(
        `/api/org-admin/modules?${params.toString()}`,
        user,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch modules');
      }

      const data = await response.json();
      setModules(data.modules || []);
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  // Get items based on view mode
  const currentItems = viewMode === 'my_modules' ? modules : templates;

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Treatment Modules</h1>
                <p className="text-sm text-gray-600">Manage your organization's therapeutic protocols</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedModule(null);
                setIsEditorOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
              type="button"
            >
              <Plus className="h-4 w-4" />
              Create Module
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
          <button
            onClick={() => setViewMode('my_modules')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              viewMode === 'my_modules'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            My Modules
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                viewMode === 'my_modules'
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {modules.length}
            </span>
          </button>
          <button
            onClick={() => setViewMode('templates')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              viewMode === 'templates'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            <Copy className="h-4 w-4" />
            System Templates
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                viewMode === 'templates'
                  ? 'bg-purple-100 text-purple-600'
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
              placeholder={viewMode === 'my_modules' ? 'Search modules...' : 'Search templates...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-9 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <Layers className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <h3 className="mb-1 text-lg font-semibold text-gray-900">
              {viewMode === 'my_modules' ? 'No modules found' : 'No templates found'}
            </h3>
            <p className="text-sm text-gray-600">
              {searchQuery
                ? 'Try adjusting your search'
                : viewMode === 'my_modules'
                  ? 'Create your first module or copy from system templates'
                  : 'No system templates available in this domain'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map(item => (
              <ModuleCard
                key={item.id}
                module={item}
                onView={() => {
                  setSelectedModule(item);
                  setIsDetailsOpen(true);
                }}
                onEdit={viewMode === 'my_modules' ? () => {
                  setSelectedModule(item);
                  setIsEditorOpen(true);
                } : undefined}
                onCopy={viewMode === 'templates' ? () => {
                  setSelectedModule(item);
                  setIsCopyModalOpen(true);
                } : undefined}
                onRefresh={fetchModules}
                isTemplate={viewMode === 'templates'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Module Editor Modal */}
      {isEditorOpen && (
        <ModuleEditor
          module={selectedModule}
          onClose={() => {
            setIsEditorOpen(false);
            setSelectedModule(null);
          }}
          onSaved={() => {
            setIsEditorOpen(false);
            setSelectedModule(null);
            fetchModules();
          }}
          apiEndpoint="/api/org-admin/modules"
          scope="organization"
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
          onEdit={selectedModule.scope === 'organization' ? () => {
            setIsDetailsOpen(false);
            setIsEditorOpen(true);
          } : undefined}
          onCopy={selectedModule.scope === 'system' ? () => {
            setIsDetailsOpen(false);
            setIsCopyModalOpen(true);
          } : undefined}
        />
      )}

      {/* Copy Template Modal */}
      {isCopyModalOpen && selectedModule && (
        <CopyTemplateModal
          template={selectedModule}
          onClose={() => {
            setIsCopyModalOpen(false);
            setSelectedModule(null);
          }}
          onCopied={() => {
            setIsCopyModalOpen(false);
            setSelectedModule(null);
            setViewMode('my_modules');
            fetchModules();
          }}
        />
      )}
    </div>
  );
}
