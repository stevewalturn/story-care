/**
 * Therapist Modules Page
 * Personal private treatment module management
 */

'use client';

import type { TreatmentModule } from '@/models/Schema';
import { Layers, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ModuleCard } from '@/components/modules/ModuleCard';
import { ModuleDetailsModal } from '@/components/modules/ModuleDetailsModal';
import { ModuleEditor } from '@/components/modules/ModuleEditor';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

export default function TherapistModulesPage() {
  const { user } = useAuth();
  const [privateModules, setPrivateModules] = useState<TreatmentModule[]>([]);
  const [templates, setTemplates] = useState<TreatmentModule[]>([]);
  const [orgModules, setOrgModules] = useState<TreatmentModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<TreatmentModule | null>(null);
  const [editableModule, setEditableModule] = useState<TreatmentModule | null>(null);

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

  const domainLabels = {
    self_strength: 'Self & Strength',
    relationships_repair: 'Relationships & Repair',
    identity_transformation: 'Identity & Transformation',
    purpose_future: 'Purpose & Future',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600">
              <Layers className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Treatment Modules</h1>
              <p className="text-sm text-gray-600">
                Personal modules for your therapeutic practice
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditableModule(null);
              setIsEditorOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md active:scale-95"
          >
            <Plus className="h-5 w-5" />
            New Module
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">

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
              <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <p className="text-sm text-gray-600">Loading modules...</p>
            </div>
          </div>
        )}

        {/* Content - Three Sections: System, Organizational, Private */}
        {!loading && !error && (
          <div className="space-y-12">
            {/* Section 1: System Templates (Read-only) */}
            {templates.length > 0 && (
              <div>
                <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h2 className="mb-1 text-lg font-semibold text-blue-900">
                    System Templates (
                    {templates.length}
                    )
                  </h2>
                  <p className="text-sm text-blue-700">
                    Global treatment modules designed by clinical experts. View details for inspiration.
                  </p>
                </div>

                {(Object.keys(domainLabels) as (keyof typeof domainLabels)[]).map((domain) => {
                  const domainModules = templates.filter(m => m.domain === domain);
                  if (domainModules.length === 0) return null;

                  return (
                    <div key={`system-${domain}`} className="mb-8">
                      <h3 className="mb-4 text-base font-medium text-gray-900">
                        {domainLabels[domain]}
                        {' '}
                        (
                        {domainModules.length}
                        )
                      </h3>
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
                    </div>
                  );
                })}
              </div>
            )}

            {/* Section 2: Organization Modules (Read-only) */}
            {orgModules.length > 0 && (
              <div>
                <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                  <h2 className="mb-1 text-lg font-semibold text-green-900">
                    Organization Modules (
                    {orgModules.length}
                    )
                  </h2>
                  <p className="text-sm text-green-700">
                    Modules created by your organization administrators. View details for reference.
                  </p>
                </div>

                {(Object.keys(domainLabels) as (keyof typeof domainLabels)[]).map((domain) => {
                  const domainModules = orgModules.filter(m => m.domain === domain);
                  if (domainModules.length === 0) return null;

                  return (
                    <div key={`org-${domain}`} className="mb-8">
                      <h3 className="mb-4 text-base font-medium text-gray-900">
                        {domainLabels[domain]}
                        {' '}
                        (
                        {domainModules.length}
                        )
                      </h3>
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
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Section 3: My Private Modules (Editable) */}
            <div>
              <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <h2 className="mb-1 text-lg font-semibold text-indigo-900">
                  My Private Modules (
                  {privateModules.length}
                  )
                </h2>
                <p className="text-sm text-indigo-700">
                  Your personal treatment modules. You can edit, archive, and customize these modules.
                </p>
              </div>

              {privateModules.length === 0 ? (
                <div className="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
                  <Layers className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    No personal modules yet
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    Create your first personal module to get started
                  </p>
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
                </div>
              ) : (
                <>
                  {(Object.keys(domainLabels) as (keyof typeof domainLabels)[]).map((domain) => {
                    const domainModules = privateModules.filter(m => m.domain === domain);
                    if (domainModules.length === 0) return null;

                    return (
                      <div key={`private-${domain}`} className="mb-8">
                        <h3 className="mb-4 text-base font-medium text-gray-900">
                          {domainLabels[domain]}
                          {' '}
                          (
                          {domainModules.length}
                          )
                        </h3>
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
                                setEditableModule(module);
                                setIsEditorOpen(true);
                              }}
                              onRefresh={fetchModules}
                              apiEndpoint="/api/therapist/modules"
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
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
