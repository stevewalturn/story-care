'use client';

/**
 * Template Selector Component
 * Single-select component for choosing reflection or survey templates
 */

import { FileText, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type Template = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  type: 'reflection' | 'survey';
  scope: string;
  questions: any[];
  useCount: number;
};

type TemplateSelectorProps = {
  selectedTemplateId: string | null;
  onChange: (templateId: string | null) => void;
  templateType: 'reflection' | 'survey';
  apiEndpoint?: string;
  label?: string;
  description?: string;
  allowNone?: boolean;
};

const categoryLabels: Record<string, string> = {
  'narrative': 'Narrative',
  'emotion': 'Emotion',
  'screening': 'Screening',
  'outcome': 'Outcome',
  'satisfaction': 'Satisfaction',
  'goal-setting': 'Goal Setting',
  'custom': 'Custom',
};

const categoryColors: Record<string, string> = {
  'narrative': 'bg-purple-100 text-purple-700',
  'emotion': 'bg-pink-100 text-pink-700',
  'screening': 'bg-blue-100 text-blue-700',
  'outcome': 'bg-green-100 text-green-700',
  'satisfaction': 'bg-yellow-100 text-yellow-700',
  'goal-setting': 'bg-orange-100 text-orange-700',
  'custom': 'bg-gray-100 text-gray-700',
};

export function TemplateSelector({
  selectedTemplateId,
  onChange,
  templateType,
  apiEndpoint,
  label,
  description,
  allowNone = true,
}: TemplateSelectorProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchTemplates();
  }, [templateType]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);

      // Default endpoint based on user role
      let endpoint = apiEndpoint;
      if (!endpoint) {
        endpoint = '/api/therapist/templates';
      }

      const params = new URLSearchParams();
      params.append('includeOrg', 'true');
      params.append('includeSystem', 'true');

      const response = await authenticatedFetch(`${endpoint}?${params.toString()}`, user);

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();

      // Combine all templates and filter by type
      const allTemplates = [
        ...(data.templates || []),
        ...(data.orgTemplates || []),
        ...(data.systemTemplates || []),
      ].filter(t => t.type === templateType);

      setTemplates(allTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = (templateId: string | null) => {
    onChange(templateId);
  };

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = !searchQuery
      || template.title.toLowerCase().includes(searchQuery.toLowerCase())
      || (template.description?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(templates.map(t => t.category)));

  const defaultLabel = templateType === 'reflection'
    ? 'Reflection Questions Template'
    : 'Survey Questions Template';

  const defaultDescription = templateType === 'reflection'
    ? 'Select a template for patient reflection questions'
    : 'Select a template for patient survey questions';

  return (
    <div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-900">
          {label || defaultLabel}
        </label>
        {(description || defaultDescription) && (
          <p className="mt-1 text-xs text-gray-500">
            {description || defaultDescription}
          </p>
        )}
      </div>

      {/* Search and Filter */}
      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-9 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {categoryLabels[cat] || cat}
            </option>
          ))}
        </select>
      </div>

      {/* Templates List */}
      <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">
            Loading templates...
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            No templates found
          </div>
        ) : (
          <>
            {allowNone && (
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-all ${
                  selectedTemplateId === null
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-transparent bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex h-5 items-center">
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                    selectedTemplateId === null
                      ? 'border-indigo-600 bg-indigo-600'
                      : 'border-gray-300 bg-white'
                  }`}
                  >
                    {selectedTemplateId === null && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <input
                    type="radio"
                    checked={selectedTemplateId === null}
                    onChange={() => handleSelectTemplate(null)}
                    className="sr-only"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    No template (custom questions)
                  </span>
                  <p className="text-xs text-gray-600">
                    I'll create custom questions for this module
                  </p>
                </div>
              </label>
            )}

            {filteredTemplates.map((template) => {
              const isSelected = selectedTemplateId === template.id;

              return (
                <label
                  key={template.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-transparent bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex h-5 items-center">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600'
                        : 'border-gray-300 bg-white'
                    }`}
                    >
                      {isSelected && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => handleSelectTemplate(template.id)}
                      className="sr-only"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {template.title}
                      </span>
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                        categoryColors[template.category] || 'bg-gray-100 text-gray-700'
                      }`}
                      >
                        {categoryLabels[template.category] || template.category}
                      </span>
                      {template.scope === 'system' && (
                        <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                          System
                        </span>
                      )}
                      {template.scope === 'organization' && (
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Organization
                        </span>
                      )}
                    </div>
                    {template.description && (
                      <p className="mb-1 line-clamp-2 text-xs text-gray-600">
                        {template.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {template.questions?.length || 0}
                      {' '}
                      questions
                    </p>
                  </div>

                  <FileText className={`h-4 w-4 flex-shrink-0 ${
                    isSelected ? 'text-indigo-600' : 'text-gray-400'
                  }`}
                  />
                </label>
              );
            })}
          </>
        )}
      </div>

      {/* Selected info */}
      {selectedTemplateId && (
        <div className="mt-2 text-xs text-gray-600">
          Template selected
          {' '}
          {templates.find(t => t.id === selectedTemplateId)?.questions?.length || 0}
          {' '}
          questions)
        </div>
      )}
    </div>
  );
}
