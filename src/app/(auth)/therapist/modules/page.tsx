/**
 * Therapist Modules Page
 * Personal private treatment module management
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

export default function TherapistModulesPage() {
  const { user } = useAuth();
  const [privateModules, setPrivateModules] = useState<TreatmentModule[]>([]);
  const [templates, setTemplates] = useState<TreatmentModule[]>([]);
  const [orgModules, setOrgModules] = useState<TreatmentModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReference, setShowReference] = useState(false);

  // Filters
  const [selectedDomain, setSelectedDomain] = useState<TherapeuticDomain>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<TreatmentModule | null>(null);

  // Fetch modules
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

  // Filter modules by search query
  const filteredPrivateModules = privateModules.filter((module) => {
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

  const filteredOrgModules = orgModules.filter((module) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      module.name.toLowerCase().includes(query)
      || module.description.toLowerCase().includes(query)
    );
  });

  // Group by domain
  const privateModulesByDomain = {
    self_strength: filteredPrivateModules.filter(m => m.domain === 'self_strength'),
    relationships_repair: filteredPrivateModules.filter(m => m.domain === 'relationships_repair'),
    identity_transformation: filteredPrivateModules.filter(m => m.domain === 'identity_transformation'),
    purpose_future: filteredPrivateModules.filter(m => m.domain === 'purpose_future'),
  };

  const referenceModules = [...filteredTemplates, ...filteredOrgModules];
  const referenceModulesByDomain = {
    self_strength: referenceModules.filter(m => m.domain === 'self_strength'),
    relationships_repair: referenceModules.filter(m => m.domain === 'relationships_repair'),
    identity_transformation: referenceModules.filter(m => m.domain === 'identity_transformation'),
    purpose_future: referenceModules.filter(m => m.domain === 'purpose_future'),
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
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-teal-600">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Treatment Modules</h1>
                <p className="text-sm text-gray-600">
                  Personal modules for your therapeutic practice
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReference(!showReference)}
                className="flex items-center gap-2 rounded-lg border-2 border-green-600 bg-white px-4 py-2.5 font-semibold text-green-600 transition-all hover:bg-green-50 active:scale-95"
              >
                <Layers className="h-5 w-5" />
                {showReference ? 'Show My Modules' : 'Browse Reference Library'}
              </button>
              <button
                onClick={() => {
                  setSelectedModule(null);
                  setIsEditorOpen(true);
                }}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-teal-600 px-4 py-2.5 font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-95"
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
              placeholder={showReference ? 'Search reference library...' : 'Search my modules...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2.5 pr-4 pl-10 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
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
              <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
              <p className="text-sm text-gray-600">Loading modules...</p>
            </div>
          </div>
        )}

        {/* Content - Private Modules or Reference Library */}
        {!loading && !error && (
          <>
            {showReference ? (
              /* Reference Library View (Templates + Org Modules) */
              <div className="space-y-8">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <h3 className="mb-1 font-semibold text-green-900">Reference Library</h3>
                  <p className="text-sm text-green-700">
                    Browse system templates and organization modules for inspiration. Create your own personalized versions.
                  </p>
                </div>

                {(Object.keys(referenceModulesByDomain) as (keyof typeof referenceModulesByDomain)[]).map((domain) => {
                  const domainModules = referenceModulesByDomain[domain];
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
                            No reference modules in this domain
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
                              onRefresh={fetchModules}
                              isTemplate
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {referenceModules.length === 0 && (
                  <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
                    <Layers className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      No reference modules found
                    </h3>
                    <p className="text-sm text-gray-600">
                      Try adjusting your search or filters
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Personal Private Modules View */
              <div className="space-y-8">
                {(Object.keys(privateModulesByDomain) as (keyof typeof privateModulesByDomain)[]).map((domain) => {
                  const domainModules = privateModulesByDomain[domain];
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
                            No personal modules in this domain yet
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
                              apiEndpoint="/api/therapist/modules"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Empty State */}
                {filteredPrivateModules.length === 0 && !loading && (
                  <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
                    <Layers className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      No personal modules found
                    </h3>
                    <p className="mb-4 text-sm text-gray-600">
                      {searchQuery
                        ? 'Try adjusting your search or filters'
                        : 'Get started by creating your first personal module or browse the reference library'}
                    </p>
                    {!searchQuery && (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setShowReference(true)}
                          className="inline-flex items-center gap-2 rounded-lg border-2 border-green-600 bg-white px-4 py-2 text-sm font-semibold text-green-600 hover:bg-green-50"
                        >
                          <Layers className="h-4 w-4" />
                          Browse Reference Library
                        </button>
                        <button
                          onClick={() => {
                            setSelectedModule(null);
                            setIsEditorOpen(true);
                          }}
                          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
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
            setIsEditorOpen(true);
          } : undefined}
        />
      )}
    </div>
  );
}
