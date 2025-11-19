'use client';

/**
 * Module Picker Component
 * Reusable dropdown/selector for choosing treatment modules
 */

import type { TherapeuticDomain, TreatmentModule } from '@/models/Schema';
import { Check, ChevronDown, Layers, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';
import { ModuleBadge } from './ModuleBadge';

type ModulePickerProps = {
  selectedModuleId?: string | null;
  onSelect: (module: TreatmentModule | null) => void;
  placeholder?: string;
  className?: string;
  allowClear?: boolean;
  filterDomain?: TherapeuticDomain;
};

export function ModulePicker({
  selectedModuleId,
  onSelect,
  placeholder = 'Select a treatment module',
  className = '',
  allowClear = true,
  filterDomain,
}: ModulePickerProps) {
  const { user, dbUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [modules, setModules] = useState<TreatmentModule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState<TreatmentModule | null>(null);

  // Fetch modules on mount
  useEffect(() => {
    fetchModules();
  }, [filterDomain]);

  // Update selected module when selectedModuleId changes
  useEffect(() => {
    if (selectedModuleId && modules.length > 0) {
      const foundModule = modules.find(m => m.id === selectedModuleId);
      setSelectedModule(foundModule || null);
    } else {
      setSelectedModule(null);
    }
  }, [selectedModuleId, modules]);

  async function fetchModules() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDomain) {
        params.append('domain', filterDomain);
      }
      params.append('status', 'active');

      // Fetch modules based on user role
      let allModules: TreatmentModule[] = [];

      if (dbUser?.role === 'super_admin') {
        // Super admins see all templates
        const response = await authenticatedFetch(
          `/api/super-admin/module-templates?${params.toString()}`,
          user,
        );
        if (response.ok) {
          const data = await response.json();
          allModules = data.templates || [];
        }
      } else if (dbUser?.role === 'org_admin') {
        // Org admins see: templates + org modules
        const response = await authenticatedFetch(
          `/api/org-admin/modules?${params.toString()}`,
          user,
        );
        if (response.ok) {
          const data = await response.json();
          allModules = [...(data.templates || []), ...(data.modules || [])];
        }
      } else if (dbUser?.role === 'therapist') {
        // Therapists see: templates + org modules + private modules
        const response = await authenticatedFetch(
          `/api/therapist/modules?${params.toString()}`,
          user,
        );
        if (response.ok) {
          const data = await response.json();
          allModules = [
            ...(data.templates || []),
            ...(data.orgModules || []),
            ...(data.privateModules || []),
          ];
        }
      } else {
        // Fallback for other roles or no role
        const response = await authenticatedFetch(`/api/modules?${params.toString()}`, user);
        if (response.ok) {
          const data = await response.json();
          allModules = data.modules || [];
        }
      }

      setModules(allModules);
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(module: TreatmentModule) {
    setSelectedModule(module);
    onSelect(module);
    setIsOpen(false);
    setSearchQuery('');
  }

  function handleClear() {
    setSelectedModule(null);
    onSelect(null);
    setSearchQuery('');
  }

  // Filter modules by search query
  const filteredModules = modules.filter((module) => {
    const query = searchQuery.toLowerCase();
    return (
      module.name.toLowerCase().includes(query)
      || module.description.toLowerCase().includes(query)
      || module.domain.toLowerCase().includes(query)
    );
  });

  // Group by domain
  const modulesByDomain = filteredModules.reduce(
    (acc, module) => {
      if (!acc[module.domain]) {
        acc[module.domain] = [];
      }
      acc[module.domain].push(module);
      return acc;
    },
    {} as Record<TherapeuticDomain, TreatmentModule[]>,
  );

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="focus:ring-opacity-20 flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-left text-sm hover:border-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          type="button"
        >
          {selectedModule ? (
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-900">{selectedModule.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">{placeholder}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {/* Clear button - positioned absolutely to avoid nesting */}
        {allowClear && selectedModule && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="absolute top-1/2 right-10 -translate-y-1/2 cursor-pointer rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClear();
              }
            }}
          >
            <X className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown Content */}
          <div className="absolute z-20 mt-2 w-full min-w-[320px] rounded-lg border border-gray-200 bg-white shadow-lg">
            {/* Search */}
            <div className="border-b border-gray-200 p-3">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search modules..."
                  className="w-full rounded-md border border-gray-300 py-2 pr-3 pl-9 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Module List */}
            <div className="max-h-[400px] overflow-y-auto p-2">
              {loading ? (
                <div className="py-8 text-center text-sm text-gray-500">Loading modules...</div>
              ) : filteredModules.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  {searchQuery ? 'No modules found' : 'No modules available'}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(modulesByDomain).map(([domain, domainModules]) => (
                    <div key={domain}>
                      <div className="mb-2 px-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                        {getDomainLabel(domain as TherapeuticDomain)}
                      </div>
                      <div className="space-y-1">
                        {domainModules.map(module => (
                          <button
                            key={module.id}
                            onClick={() => handleSelect(module)}
                            className={`group flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors ${
                              selectedModule?.id === module.id
                                ? 'ring-opacity-50 bg-indigo-50 ring-2 ring-indigo-500'
                                : 'hover:bg-gray-50'
                            }`}
                            type="button"
                          >
                            <div className="flex-1">
                              <div className="mb-1 flex items-center gap-2">
                                <span className="font-medium text-gray-900">{module.name}</span>
                                {selectedModule?.id === module.id && (
                                  <Check className="h-4 w-4 text-indigo-600" />
                                )}
                              </div>
                              <p className="line-clamp-2 text-sm text-gray-600">
                                {module.description}
                              </p>
                              <div className="mt-2">
                                <ModuleBadge
                                  moduleName={getDomainLabel(module.domain as TherapeuticDomain)}
                                  domain={module.domain as TherapeuticDomain}
                                  size="sm"
                                  showIcon={false}
                                />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {filteredModules.length > 0 && (
              <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500">
                {filteredModules.length}
                {' '}
                module
                {filteredModules.length !== 1 ? 's' : ''}
                {' '}
                available
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function getDomainLabel(domain: TherapeuticDomain): string {
  const labels: Record<TherapeuticDomain, string> = {
    self_strength: 'Self & Strength',
    relationships_repair: 'Relationships & Repair',
    identity_transformation: 'Identity & Transformation',
    purpose_future: 'Purpose & Future',
  };
  return labels[domain] || domain;
}
