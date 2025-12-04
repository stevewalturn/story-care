'use client';

/**
 * Organization Admin Templates Library
 * Manage organization reflection and survey templates + view system templates
 * Redesigned to match Prompts Library UI pattern
 */

import { Copy, FileText, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CopyTemplateModal } from '@/components/templates/CopyTemplateModal';
import { CreateTemplateModal } from '@/components/templates/CreateTemplateModal';
import { EditTemplateModal } from '@/components/templates/EditTemplateModal';
import { ViewTemplateDetailsModal } from '@/components/templates/ViewTemplateDetailsModal';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type TemplateType = 'all' | 'reflection' | 'survey';
type TemplateCategory = 'screening' | 'outcome' | 'satisfaction' | 'custom' | 'narrative' | 'emotion' | 'goal-setting';
type TemplateCategoryFilter = 'all' | TemplateCategory;
type ActiveTab = 'my_templates' | 'system_templates';
type TemplateScope = 'system' | 'organization' | 'private';

type Template = {
  id: string;
  title: string;
  description: string | null;
  category: TemplateCategory;
  type: 'reflection' | 'survey';
  scope: TemplateScope;
  questions: any[];
  useCount: number;
  createdAt: string;
  updatedAt: string;
};

export default function OrgAdminTemplatesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('my_templates');
  const [activeType, setActiveType] = useState<TemplateType>('all');
  const [activeCategory, setActiveCategory] = useState<TemplateCategoryFilter>('all');
  const [myTemplates, setMyTemplates] = useState<Template[]>([]);
  const [systemTemplates, setSystemTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
  const [copyingTemplate, setCopyingTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [user]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('includeSystem', 'true');

      const response = await authenticatedFetch(
        `/api/org-admin/templates?${params.toString()}`,
        user,
      );

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setMyTemplates(data.templates || []);
      setSystemTemplates(data.systemTemplates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Get current items based on active tab
  const currentItems = activeTab === 'my_templates' ? myTemplates : systemTemplates;

  // Filter templates
  const filteredTemplates = currentItems.filter((template) => {
    const matchesType = activeType === 'all' || template.type === activeType;
    const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
    const matchesSearch = !searchQuery
      || template.title.toLowerCase().includes(searchQuery.toLowerCase())
      || template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesCategory && matchesSearch;
  });

  const typeOptions: { id: TemplateType; label: string }[] = [
    { id: 'all', label: 'All Types' },
    { id: 'reflection', label: 'Reflection' },
    { id: 'survey', label: 'Survey' },
  ];

  const categoryOptions: { id: TemplateCategoryFilter; label: string }[] = [
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
        {/* Header - No action button */}
        <div className="mb-6">
          <div className="flex items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">Templates Library</h1>
              <p className="text-sm text-gray-600">Manage reflection and survey question templates</p>
            </div>
          </div>
        </div>

        {/* Single Tab Row - Following Prompts Pattern */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('my_templates')}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'my_templates'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            My Templates
          </button>
          <button
            onClick={() => setActiveTab('system_templates')}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'system_templates'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            type="button"
          >
            System Templates
          </button>
        </div>

        {/* Unified Controls Row - Following Prompts Pattern */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search - flex-1 */}
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === 'my_templates' ? 'Search my templates...' : 'Search system templates...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-9 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Type Filter Dropdown */}
          <select
            value={activeType}
            onChange={e => setActiveType(e.target.value as TemplateType)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            {typeOptions.map(type => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>

          {/* Category Filter Dropdown */}
          <select
            value={activeCategory}
            onChange={e => setActiveCategory(e.target.value as TemplateCategory)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            {categoryOptions.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Contextual Create Button - Only show in My Templates tab */}
          {activeTab === 'my_templates' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 whitespace-nowrap"
              type="button"
            >
              <Plus className="h-4 w-4" />
              Create Template
            </button>
          )}
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
                ? 'Try adjusting your search or filters'
                : activeTab === 'my_templates'
                  ? 'Create your first template to get started'
                  : 'No system templates available with the current filters'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                activeTab={activeTab}
                onView={() => setViewingTemplate(template)}
                onEdit={activeTab === 'my_templates' ? () => setEditingTemplate(template) : undefined}
                onCopy={activeTab === 'system_templates' ? () => setCopyingTemplate(template) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <CreateTemplateModal
          scope="organization"
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchTemplates();
          }}
        />
      )}

      {/* View Template Details Modal */}
      {viewingTemplate && (
        <ViewTemplateDetailsModal
          template={viewingTemplate}
          scopeLabel={
            viewingTemplate.scope === 'system'
              ? 'System'
              : viewingTemplate.scope === 'organization'
                ? 'Organization'
                : 'Private'
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
    </div>
  );
}

/**
 * Template Card Component - Simplified Design
 */
type TemplateCardProps = {
  template: Template;
  activeTab: ActiveTab;
  onView: () => void;
  onEdit?: () => void;
  onCopy?: () => void;
};

function TemplateCard({ template, activeTab, onView, onEdit, onCopy }: TemplateCardProps) {
  const categoryColors: Record<string, string> = {
    'narrative': 'bg-purple-100 text-purple-700',
    'emotion': 'bg-pink-100 text-pink-700',
    'screening': 'bg-blue-100 text-blue-700',
    'outcome': 'bg-green-100 text-green-700',
    'satisfaction': 'bg-yellow-100 text-yellow-700',
    'goal-setting': 'bg-orange-100 text-orange-700',
    'custom': 'bg-gray-100 text-gray-700',
  };

  // Format category name for display
  const formatCategoryName = (category: string) => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{template.title}</h3>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                categoryColors[template.category] || 'bg-gray-100 text-gray-700'
              }`}
            >
              {formatCategoryName(template.category)}
            </span>
            <span className="text-xs text-gray-500">
              {template.scope === 'system' ? 'System' : template.scope === 'organization' ? 'Organization' : 'Private'}
            </span>
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
      <div className="mb-4 flex items-center gap-4 text-xs text-gray-500">
        <div>
          <span className="font-medium text-gray-700">{template.type === 'reflection' ? 'Reflection' : 'Survey'}</span>
        </div>
        <div>
          {template.questions?.length || 0}
          {' '}
          questions
        </div>
        <div>
          Used:
          {' '}
          {template.useCount}
          x
        </div>
      </div>

      {/* Conditional Actions Based on Active Tab */}
      <div className="flex gap-2">
        {activeTab === 'my_templates' && (
          <>
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
          </>
        )}
        {activeTab === 'system_templates' && onCopy && (
          <button
            onClick={onCopy}
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
            type="button"
          >
            <Copy className="h-3 w-3" />
            Copy to My Templates
          </button>
        )}
      </div>
    </div>
  );
}
