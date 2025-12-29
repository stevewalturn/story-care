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
import { ModuleEditor } from '@/components/modules/ModuleEditor';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type TherapeuticDomain = 'all' | 'self_strength' | 'relationships_repair' | 'identity_transformation' | 'purpose_future';

export default function SuperAdminModuleTemplatesPage() {
  const { user } = useAuth();
  const [activeDomain, setActiveDomain] = useState<TherapeuticDomain>('all');
  const [modules, setModules] = useState<TreatmentModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<TreatmentModule | null>(null);

  // Fetch templates
  useEffect(() => {
    fetchTemplates();
  }, [user]);

  async function fetchTemplates() {
    try {
      setLoading(true);
      setError(null);

      const response = await authenticatedFetch(
        `/api/super-admin/module-templates`,
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

  // Filter modules by domain and search
  const filteredModules = modules.filter((module) => {
    const matchesDomain = activeDomain === 'all' || module.domain === activeDomain;
    const matchesSearch = !searchQuery
      || module.name.toLowerCase().includes(searchQuery.toLowerCase())
      || module.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  // Get module count by domain
  const getDomainCount = (domain: TherapeuticDomain) => {
    if (domain === 'all') return modules.length;
    return modules.filter(m => m.domain === domain).length;
  };

  const domains: { id: TherapeuticDomain; label: string }[] = [
    { id: 'all', label: 'All Templates' },
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-purple-600">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Module Templates</h1>
                <p className="text-sm text-gray-600">System-wide templates available to all organizations</p>
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
              Create Template
            </button>
          </div>
        </div>

        {/* Domain Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
          {domains.map(dom => (
            <button
              key={dom.id}
              onClick={() => setActiveDomain(dom.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                activeDomain === dom.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              type="button"
            >
              {dom.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  activeDomain === dom.id
                    ? 'bg-purple-100 text-purple-600'
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
              placeholder="Search templates..."
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
        ) : filteredModules.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <Layers className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <h3 className="mb-1 text-lg font-semibold text-gray-900">No templates found</h3>
            <p className="text-sm text-gray-600">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first module template to get started'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredModules.map(module => (
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
