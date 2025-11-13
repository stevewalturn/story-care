/**
 * Super Admin Module Templates Page
 * System-wide treatment module template management
 */

'use client';

import type { TreatmentModule } from '@/models/Schema';
import { Layers, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ModuleCard } from '@/components/modules/ModuleCard';
import { ModuleDetailsModal } from '@/components/modules/ModuleDetailsModal';
import { ModuleDomainFilter } from '@/components/modules/ModuleDomainFilter';
import { ModuleEditor } from '@/components/modules/ModuleEditor';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type TherapeuticDomain = 'self_strength' | 'relationships_repair' | 'identity_transformation' | 'purpose_future' | null;

export default function SuperAdminModuleTemplatesPage() {
  const { user } = useAuth();
  const [modules, setModules] = useState<TreatmentModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDomain, setSelectedDomain] = useState<TherapeuticDomain>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<TreatmentModule | null>(null);

  // Fetch templates
  useEffect(() => {
    fetchTemplates();
  }, [selectedDomain]);

  async function fetchTemplates() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDomain) {
        params.append('domain', selectedDomain);
      }

      const response = await authenticatedFetch(
        `/api/super-admin/module-templates?${params.toString()}`,
        user,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setModules(data.templates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  // Filter modules by search query
  const filteredModules = modules.filter((module) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      module.name.toLowerCase().includes(query)
      || module.description.toLowerCase().includes(query)
    );
  });

  // Group modules by domain
  const modulesByDomain = {
    self_strength: filteredModules.filter(m => m.domain === 'self_strength'),
    relationships_repair: filteredModules.filter(m => m.domain === 'relationships_repair'),
    identity_transformation: filteredModules.filter(m => m.domain === 'identity_transformation'),
    purpose_future: filteredModules.filter(m => m.domain === 'purpose_future'),
  };

  const domainLabels = {
    self_strength: 'Self & Strength',
    relationships_repair: 'Relationships & Repair',
    identity_transformation: 'Identity & Transformation',
    purpose_future: 'Purpose & Future',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Module Templates</h1>
                <p className="text-sm text-gray-600">
                  System-wide templates available to all organizations
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedModule(null);
                setIsEditorOpen(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-95"
            >
              <Plus className="h-5 w-5" />
              New Template
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Search and Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2.5 pr-4 pl-10 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            />
          </div>

          {/* Domain Filter */}
          <ModuleDomainFilter
            selectedDomain={selectedDomain}
            onSelectDomain={setSelectedDomain}
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
              <p className="text-sm text-gray-600">Loading templates...</p>
            </div>
          </div>
        )}

        {/* Module Grid by Domain */}
        {!loading && !error && (
          <div className="space-y-8">
            {(Object.keys(modulesByDomain) as (keyof typeof modulesByDomain)[]).map((domain) => {
              const domainModules = modulesByDomain[domain];
              if (domainModules.length === 0 && !selectedDomain) return null;
              if (selectedDomain && selectedDomain !== domain) return null;

              return (
                <div key={domain}>
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    {domainLabels[domain]}
                    {' '}
                    (
                    {domainModules.length}
                    )
                  </h2>
                  {domainModules.length === 0 ? (
                    <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                      <p className="text-sm text-gray-600">
                        No templates in this domain yet
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {domainModules.map(module => (
                        <ModuleCard
                          key={module.id}
                          module={module}
                          onView={() => {
                            setSelectedModule(module);
                            setIsDetailsOpen(true);
                          }}
                          onEdit={() => {
                            setSelectedModule(module);
                            setIsEditorOpen(true);
                          }}
                          onRefresh={fetchTemplates}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty State */}
            {filteredModules.length === 0 && !loading && (
              <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
                <Layers className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  No templates found
                </h3>
                <p className="mb-4 text-sm text-gray-600">
                  {searchQuery
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating your first system template'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => {
                      setSelectedModule(null);
                      setIsEditorOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
                  >
                    <Plus className="h-4 w-4" />
                    Create Template
                  </button>
                )}
              </div>
            )}
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
            fetchTemplates();
          }}
          apiEndpoint="/api/super-admin/module-templates"
          scope="system"
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
          onEdit={() => {
            setIsDetailsOpen(false);
            setIsEditorOpen(true);
          }}
        />
      )}
    </div>
  );
}
