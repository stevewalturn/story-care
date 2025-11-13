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
import { ModuleDomainFilter } from '@/components/modules/ModuleDomainFilter';
import { ModuleEditor } from '@/components/modules/ModuleEditor';
import { CopyTemplateModal } from '@/components/org-admin/CopyTemplateModal';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type TherapeuticDomain = 'self_strength' | 'relationships_repair' | 'identity_transformation' | 'purpose_future' | null;

export default function OrgAdminModulesPage() {
  const { user } = useAuth();
  const [modules, setModules] = useState<TreatmentModule[]>([]);
  const [templates, setTemplates] = useState<TreatmentModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Filters
  const [selectedDomain, setSelectedDomain] = useState<TherapeuticDomain>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<TreatmentModule | null>(null);

  // Fetch modules and templates
  useEffect(() => {
    fetchModules();
  }, [selectedDomain]);

  async function fetchModules() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDomain) {
        params.append('domain', selectedDomain);
      }
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

  // Filter modules by search query
  const filteredModules = modules.filter((module) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      module.name.toLowerCase().includes(query)
      || module.description.toLowerCase().includes(query)
    );
  });

  const filteredTemplates = templates.filter((template) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query)
      || template.description.toLowerCase().includes(query)
    );
  });

  // Group by domain
  const modulesByDomain = {
    self_strength: filteredModules.filter(m => m.domain === 'self_strength'),
    relationships_repair: filteredModules.filter(m => m.domain === 'relationships_repair'),
    identity_transformation: filteredModules.filter(m => m.domain === 'identity_transformation'),
    purpose_future: filteredModules.filter(m => m.domain === 'purpose_future'),
  };

  const templatesByDomain = {
    self_strength: filteredTemplates.filter(m => m.domain === 'self_strength'),
    relationships_repair: filteredTemplates.filter(m => m.domain === 'relationships_repair'),
    identity_transformation: filteredTemplates.filter(m => m.domain === 'identity_transformation'),
    purpose_future: filteredTemplates.filter(m => m.domain === 'purpose_future'),
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
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Treatment Modules</h1>
                <p className="text-sm text-gray-600">
                  Manage your organization's therapeutic protocols
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-2 rounded-lg border-2 border-blue-600 bg-white px-4 py-2.5 font-semibold text-blue-600 transition-all hover:bg-blue-50 active:scale-95"
              >
                <Copy className="h-5 w-5" />
                {showTemplates ? 'Show My Modules' : 'Browse Templates'}
              </button>
              <button
                onClick={() => {
                  setSelectedModule(null);
                  setIsEditorOpen(true);
                }}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-95"
              >
                <Plus className="h-5 w-5" />
                New Module
              </button>
            </div>
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
              placeholder={showTemplates ? 'Search templates...' : 'Search modules...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2.5 pr-4 pl-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          {/* Domain Filter */}
          <ModuleDomainFilter
            selected={selectedDomain}
            onChange={setSelectedDomain}
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
              <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
              <p className="text-sm text-gray-600">Loading modules...</p>
            </div>
          </div>
        )}

        {/* Content - Templates or Organization Modules */}
        {!loading && !error && (
          <>
            {showTemplates ? (
              /* System Templates View */
              <div className="space-y-8">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h3 className="mb-1 font-semibold text-blue-900">System Templates</h3>
                  <p className="text-sm text-blue-700">
                    Copy these professionally designed templates to your organization and customize them as needed.
                  </p>
                </div>

                {(Object.keys(templatesByDomain) as (keyof typeof templatesByDomain)[]).map((domain) => {
                  const domainTemplates = templatesByDomain[domain];
                  if (domainTemplates.length === 0 && !selectedDomain) return null;
                  if (selectedDomain && selectedDomain !== domain) return null;

                  return (
                    <div key={domain}>
                      <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        {domainLabels[domain]}
                        {' '}
                        (
                        {domainTemplates.length}
                        )
                      </h2>
                      {domainTemplates.length === 0 ? (
                        <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                          <p className="text-sm text-gray-600">
                            No templates in this domain yet
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {domainTemplates.map(template => (
                            <ModuleCard
                              key={template.id}
                              module={template}
                              onView={() => {
                                setSelectedModule(template);
                                setIsDetailsOpen(true);
                              }}
                              onCopy={() => {
                                setSelectedModule(template);
                                setIsCopyModalOpen(true);
                              }}
                              onRefresh={fetchModules}
                              isTemplate
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredTemplates.length === 0 && (
                  <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
                    <Layers className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      No templates found
                    </h3>
                    <p className="text-sm text-gray-600">
                      Try adjusting your search or filters
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Organization Modules View */
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
                            No modules in this domain yet
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
                              onRefresh={fetchModules}
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
                      No modules found
                    </h3>
                    <p className="mb-4 text-sm text-gray-600">
                      {searchQuery
                        ? 'Try adjusting your search or filters'
                        : 'Get started by creating a module or copying from templates'}
                    </p>
                    {!searchQuery && (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setShowTemplates(true)}
                          className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                        >
                          <Copy className="h-4 w-4" />
                          Browse Templates
                        </button>
                        <button
                          onClick={() => {
                            setSelectedModule(null);
                            setIsEditorOpen(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4" />
                          Create Module
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
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
            setShowTemplates(false);
            fetchModules();
          }}
        />
      )}
    </div>
  );
}
