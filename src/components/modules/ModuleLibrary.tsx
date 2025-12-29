'use client';

/**
 * Module Library Component
 * Displays grid of treatment modules with filtering and search
 */

import type { TreatmentModule } from '@/models/Schema';
import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';
import { ModuleCard } from './ModuleCard';
import { ModuleDetailsModal } from './ModuleDetailsModal';
import { ModuleDomainFilter } from './ModuleDomainFilter';
import { ModuleEditor } from './ModuleEditor';

type TherapeuticDomain = 'self_strength' | 'relationships_repair' | 'identity_transformation' | 'purpose_future' | null;

export function ModuleLibrary() {
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

      const response = await authenticatedFetch(`/api/modules?${params.toString()}`, user);

      if (!response.ok) {
        throw new Error('Failed to fetch modules');
      }

      const data = await response.json();
      setModules(data.modules || []);
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

  const handleCreateModule = () => {
    setSelectedModule(null);
    setIsEditorOpen(true);
  };

  const handleEditModule = (module: TreatmentModule) => {
    setSelectedModule(module);
    setIsEditorOpen(true);
  };

  const handleViewDetails = (module: TreatmentModule) => {
    setSelectedModule(module);
    setIsDetailsOpen(true);
  };

  const handleModuleSaved = () => {
    setIsEditorOpen(false);
    setSelectedModule(null);
    fetchModules(); // Refresh list
  };

  const handleModuleArchived = () => {
    fetchModules(); // Refresh list
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
          <p className="text-sm text-gray-600">Loading modules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-800">{error}</p>
        <button
          onClick={fetchModules}
          className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
          type="button"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-md flex-1">
          <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        {/* Create Button */}
        <button
          onClick={handleCreateModule}
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none"
          type="button"
        >
          <Plus className="h-5 w-5" />
          Create Module
        </button>
      </div>

      {/* Domain Filter */}
      <ModuleDomainFilter
        selectedDomain={selectedDomain}
        onSelectDomain={setSelectedDomain}
      />

      {/* Module Grid */}
      {selectedDomain === null ? (
        /* Show all domains */
        <div className="space-y-8">
          {Object.entries(modulesByDomain).map(([domain, domainModules]) => {
            if (domainModules.length === 0) return null;

            const domainInfo = getDomainInfo(domain as any);

            return (
              <div key={domain}>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <span className={`inline-block h-3 w-3 rounded-full ${domainInfo.color}`} />
                  {domainInfo.name}
                  <span className="text-sm font-normal text-gray-500">
                    (
                    {domainModules.length}
                    )
                  </span>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {domainModules.map(module => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      onEdit={handleEditModule}
                      onViewDetails={handleViewDetails}
                      onArchived={handleModuleArchived}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {filteredModules.length === 0 && (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <p className="text-gray-600">
                {searchQuery ? 'No modules found matching your search.' : 'No modules available.'}
              </p>
              <button
                onClick={handleCreateModule}
                className="mt-4 text-sm font-medium text-purple-600 hover:text-purple-700"
                type="button"
              >
                Create your first module
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Show selected domain only */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredModules.map(module => (
            <ModuleCard
              key={module.id}
              module={module}
              onEdit={handleEditModule}
              onViewDetails={handleViewDetails}
              onArchived={handleModuleArchived}
            />
          ))}

          {filteredModules.length === 0 && (
            <div className="col-span-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <p className="text-gray-600">No modules in this domain yet.</p>
              <button
                onClick={handleCreateModule}
                className="mt-4 text-sm font-medium text-purple-600 hover:text-purple-700"
                type="button"
              >
                Create a module
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {isEditorOpen && (
        <ModuleEditor
          module={selectedModule}
          onClose={() => {
            setIsEditorOpen(false);
            setSelectedModule(null);
          }}
          onSaved={handleModuleSaved}
        />
      )}

      {isDetailsOpen && selectedModule && (
        <ModuleDetailsModal
          module={selectedModule}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedModule(null);
          }}
          onEdit={() => {
            setIsDetailsOpen(false);
            handleEditModule(selectedModule);
          }}
        />
      )}
    </div>
  );
}

// Helper function to get domain information
function getDomainInfo(domain: string) {
  const domains = {
    self_strength: {
      name: 'Self & Strength',
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-cyan-500',
    },
    relationships_repair: {
      name: 'Relationships & Repair',
      color: 'bg-green-500',
      gradient: 'from-green-500 to-emerald-500',
    },
    identity_transformation: {
      name: 'Identity & Transformation',
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-pink-500',
    },
    purpose_future: {
      name: 'Purpose & Future',
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-amber-500',
    },
  };

  return domains[domain as keyof typeof domains] || domains.self_strength;
}
