'use client';

/**
 * Therapist Templates Library
 * Manage private templates + view organization and system templates
 */

import { Building, Copy, FileText, Filter, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CopyTemplateModal } from '@/components/templates/CopyTemplateModal';
import { CreateTemplateModal } from '@/components/templates/CreateTemplateModal';
import { EditTemplateModal } from '@/components/templates/EditTemplateModal';
import { ViewTemplateDetailsModal } from '@/components/templates/ViewTemplateDetailsModal';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type TemplateFilter = 'all' | 'reflection' | 'survey';
type TemplateCategory = 'all' | 'screening' | 'outcome' | 'satisfaction' | 'custom' | 'narrative' | 'emotion' | 'goal-setting';
type ViewMode = 'my_templates' | 'org_templates' | 'system_templates';

type Question = {
  id: string;
  questionText: string;
  questionType: 'open_text' | 'multiple_choice' | 'scale' | 'emotion';
  required: boolean;
  order: number;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
};

type TemplateType = {
  id: string;
  title: string;
  description: string | null;
  category: 'screening' | 'outcome' | 'satisfaction' | 'custom' | 'narrative' | 'emotion' | 'goal-setting';
  type: 'reflection' | 'survey';
  scope: 'system' | 'organization' | 'private';
  questions: Question[];
  useCount: number;
  createdAt: string;
  updatedAt: string;
  organizationId?: string | null;
  createdBy?: string;
};

export default function TherapistTemplatesPage() {
  const { user, dbUser } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('my_templates');
  const [activeType, setActiveType] = useState<TemplateFilter>('all');
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('all');
  const [myTemplates, setMyTemplates] = useState<TemplateType[]>([]);
  const [orgTemplates, setOrgTemplates] = useState<TemplateType[]>([]);
  const [systemTemplates, setSystemTemplates] = useState<TemplateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<TemplateType | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TemplateType | null>(null);
  const [copyingTemplate, setCopyingTemplate] = useState<TemplateType | null>(null);

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
  const getTypeCount = (filterType: TemplateFilter) => {
    if (filterType === 'all') return currentItems.length;
    return currentItems.filter(t => t.type === filterType).length;
  };

  const getCategoryCount = (category: TemplateCategory) => {
    if (category === 'all') return currentItems.length;
    return currentItems.filter(t => t.category === category).length;
  };

  const typeOptions: { id: TemplateFilter; label: string }[] = [
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

        {/* View Mode Tabs + Filters Row */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* View Mode Tabs */}
          <div className="flex gap-2 overflow-x-auto border-b border-gray-200">
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
              Organization
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
              System
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

          {/* Filters */}
          <div className="flex gap-2">
            {/* Type Filter */}
            <div className="relative">
              <Filter className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                value={activeType}
                onChange={e => setActiveType(e.target.value as TemplateFilter)}
                className="appearance-none rounded-lg border border-gray-300 py-2 pr-8 pl-9 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                {typeOptions.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                    {' '}
                    (
                    {getTypeCount(type.id)}
                    )
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <select
              value={activeCategory}
              onChange={e => setActiveCategory(e.target.value as TemplateCategory)}
              className="appearance-none rounded-lg border border-gray-300 py-2 pr-8 pl-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              {categoryOptions.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                  {' '}
                  (
                  {getCategoryCount(cat.id)}
                  )
                </option>
              ))}
            </select>
          </div>
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
                onView={() => setViewingTemplate(template)}
                onEdit={viewMode === 'my_templates' ? () => setEditingTemplate(template) : undefined}
                onCopy={viewMode !== 'my_templates' ? () => setCopyingTemplate(template) : undefined}
                scope={
                  viewMode === 'my_templates'
                    ? 'Private'
                    : viewMode === 'org_templates'
                      ? 'Organization'
                      : 'System'
                }
                isSuperAdmin={dbUser?.role === 'super_admin'}
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

      {/* Edit Template Modal */}
      {editingTemplate && (
        <EditTemplateModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onUpdated={() => {
            setEditingTemplate(null);
            fetchTemplates();
          }}
        />
      )}

      {/* View Template Details Modal */}
      {viewingTemplate && (
        <ViewTemplateDetailsModal
          template={viewingTemplate}
          scopeLabel={
            viewingTemplate.scope === 'private'
              ? 'Private'
              : viewingTemplate.scope === 'organization'
                ? 'Organization'
                : 'System'
          }
          onClose={() => setViewingTemplate(null)}
        />
      )}

      {/* Copy Template Modal */}
      {copyingTemplate && (
        <CopyTemplateModal
          template={copyingTemplate}
          onClose={() => setCopyingTemplate(null)}
          onCopied={() => {
            setCopyingTemplate(null);
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
  template: TemplateType;
  onView: () => void;
  onEdit?: () => void;
  onCopy?: () => void;
  scope: string;
  isSuperAdmin?: boolean;
};

function TemplateCard({ template, onView, onEdit, onCopy, scope, isSuperAdmin }: TemplateCardProps) {
  const categoryColors: Record<string, string> = {
    'narrative': 'bg-purple-100 text-purple-700',
    'emotion': 'bg-pink-100 text-pink-700',
    'screening': 'bg-blue-100 text-blue-700',
    'outcome': 'bg-green-100 text-green-700',
    'satisfaction': 'bg-yellow-100 text-yellow-700',
    'goal-setting': 'bg-orange-100 text-orange-700',
    'custom': 'bg-gray-100 text-gray-700',
  };

  // Category-specific card border colors for visual differentiation
  const categoryBorderColors: Record<string, string> = {
    'narrative': 'border-l-4 border-l-purple-500',
    'emotion': 'border-l-4 border-l-pink-500',
    'screening': 'border-l-4 border-l-blue-500',
    'outcome': 'border-l-4 border-l-green-500',
    'satisfaction': 'border-l-4 border-l-yellow-500',
    'goal-setting': 'border-l-4 border-l-orange-500',
    'custom': 'border-l-4 border-l-gray-500',
  };

  return (
    <div className={`rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${categoryBorderColors[template.category] || ''}`}>
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
        {isSuperAdmin && (
          <div>
            Used:
            {template.useCount}
            {' '}
            times
          </div>
        )}
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
