'use client';

/**
 * Therapist Templates Library
 * Manage private templates + view organization and system templates
 */

import { Building, Copy, FileText, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CreateTemplateModal } from '@/components/templates/CreateTemplateModal';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type TemplateType = 'all' | 'reflection' | 'survey';
type TemplateCategory = 'all' | 'screening' | 'outcome' | 'satisfaction' | 'custom' | 'narrative' | 'emotion' | 'goal-setting';
type ViewMode = 'my_templates' | 'org_templates' | 'system_templates';

type Template = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  type: 'reflection' | 'survey';
  scope: string;
  questions: any[];
  useCount: number;
  createdAt: string;
  updatedAt: string;
};

export default function TherapistTemplatesPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('my_templates');
  const [activeType, setActiveType] = useState<TemplateType>('all');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('all');
  const [myTemplates, setMyTemplates] = useState<Template[]>([]);
  const [orgTemplates, setOrgTemplates] = useState<Template[]>([]);
  const [systemTemplates, setSystemTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('includeOrg', 'true');
      params.append('includeSystem', 'true');

      const response = await authenticatedFetch(
        `/api/therapist/templates?${params.toString()}`,
        user,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setMyTemplates(data.templates || []);
      setOrgTemplates(data.orgTemplates || []);
      setSystemTemplates(data.systemTemplates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Get current items based on view mode
  const currentItems = viewMode === 'my_templates'
    ? myTemplates
    : viewMode === 'org_templates'
      ? orgTemplates
      : systemTemplates;

  // Filter templates
  const filteredTemplates = currentItems.filter((template) => {
    const matchesType = activeType === 'all' || template.type === activeType;
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
    const matchesSearch = !searchQuery
      || template.title.toLowerCase().includes(searchQuery.toLowerCase())
      || template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesCategory && matchesSearch;
  });

  // Get counts
  const getTypeCount = (type: TemplateType) => {
    if (type === 'all') return currentItems.length;
    return currentItems.filter(t => t.type === type).length;
  };

  const getCategoryCount = (category: TemplateCategory) => {
    if (category === 'all') return currentItems.length;
    return currentItems.filter(t => t.category === category).length;
  };

  const typeOptions: { id: TemplateType; label: string }[] = [
    { id: 'all', label: 'All Templates' },
    { id: 'reflection', label: 'Reflection' },
    { id: 'survey', label: 'Survey' },
  ];

  const categoryOptions: { id: TemplateCategory; label: string }[] = [
    { id: 'all', label: 'All Categories' },
    { id: 'narrative', label: 'Narrative' },
    { id: 'emotion', label: 'Emotion' },
    { id: 'screening', label: 'Screening' },
    { id: 'outcome', label: 'Outcome' },
    { id: 'satisfaction', label: 'Satisfaction' },
    { id: 'goal-setting', label: 'Goal Setting' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Templates Library</h1>
                <p className="text-sm text-gray-600">Manage reflection and survey question templates</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              type="button"
            >
              <Plus className="h-4 w-4" />
              Create Template
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
          <button
            onClick={() => setViewMode('my_templates')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              viewMode === 'my_templates'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            My Templates
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                viewMode === 'my_templates'
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {myTemplates.length}
            </span>
          </button>
          <button
            onClick={() => setViewMode('org_templates')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              viewMode === 'org_templates'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            <Building className="h-4 w-4" />
            Organization Templates
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                viewMode === 'org_templates'
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {orgTemplates.length}
            </span>
          </button>
          <button
            onClick={() => setViewMode('system_templates')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              viewMode === 'system_templates'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            <Copy className="h-4 w-4" />
            System Templates
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                viewMode === 'system_templates'
                  ? 'bg-indigo-100 text-indigo-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {systemTemplates.length}
            </span>
          </button>
        </div>

        {/* Type Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
          {typeOptions.map(type => (
            <button
              key={type.id}
              onClick={() => setActiveType(type.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                activeType === type.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              type="button"
            >
              {type.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  activeType === type.id
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {getTypeCount(type.id)}
              </span>
            </button>
          ))}
        </div>

        {/* Category Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-gray-200">
          {categoryOptions.map(cat => (
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

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={
                viewMode === 'my_templates'
                  ? 'Search my templates...'
                  : viewMode === 'org_templates'
                    ? 'Search organization templates...'
                    : 'Search system templates...'
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-9 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <FileText className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <h3 className="mb-1 text-lg font-semibold text-gray-900">No templates found</h3>
            <p className="text-sm text-gray-600">
              {searchQuery
                ? 'Try adjusting your search'
                : viewMode === 'my_templates'
                  ? 'Create your first template to get started'
                  : 'No templates available in this category'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onView={() => {
                  // View modal
                }}
                onEdit={viewMode === 'my_templates' ? () => {
                  // Edit modal
                } : undefined}
                onCopy={viewMode !== 'my_templates' ? () => {
                  // Copy modal
                } : undefined}
                scope={
                  viewMode === 'my_templates'
                    ? 'Private'
                    : viewMode === 'org_templates'
                      ? 'Organization'
                      : 'System'
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <CreateTemplateModal
          scope="private"
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchTemplates();
          }}
        />
      )}
    </div>
  );
}

/**
 * Template Card Component
 */
type TemplateCardProps = {
  template: Template;
  onView: () => void;
  onEdit?: () => void;
  onCopy?: () => void;
  scope: string;
};

function TemplateCard({ template, onView, onEdit, onCopy, scope }: TemplateCardProps) {
  const categoryColors: Record<string, string> = {
    'narrative': 'bg-purple-100 text-purple-700',
    'emotion': 'bg-pink-100 text-pink-700',
    'screening': 'bg-blue-100 text-blue-700',
    'outcome': 'bg-green-100 text-green-700',
    'satisfaction': 'bg-yellow-100 text-yellow-700',
    'goal-setting': 'bg-orange-100 text-orange-700',
    'custom': 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{template.title}</h3>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                template.type === 'reflection'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {template.type}
            </span>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                categoryColors[template.category] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {template.category}
            </span>
            <span className="text-xs text-gray-500">{scope}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      {template.description && (
        <p className="mb-4 line-clamp-2 text-sm text-gray-600">
          {template.description}
        </p>
      )}

      {/* Metadata */}
      <div className="mb-4 space-y-1 text-xs text-gray-500">
        <div>
          Questions:
          {template.questions?.length || 0}
        </div>
        <div>
          Used:
          {template.useCount}
          {' '}
          times
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onView}
          className="flex-1 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
          type="button"
        >
          View Details
        </button>
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            type="button"
          >
            Edit
          </button>
        )}
        {onCopy && (
          <button
            onClick={onCopy}
            className="flex items-center justify-center gap-1 rounded-lg border border-purple-300 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100"
            type="button"
          >
            <Copy className="h-3 w-3" />
            Copy
          </button>
        )}
      </div>
    </div>
  );
}
