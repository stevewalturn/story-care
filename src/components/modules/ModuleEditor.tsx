'use client';

/**
 * Module Editor Component
 * Create/Edit treatment module modal matching design spec
 */

import type { TreatmentModule } from '@/models/Schema';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';
import { PromptSelector } from '../prompts/PromptSelector';
import { TemplateSelector } from '../templates/TemplateSelector';

type ModuleEditorProps = {
  module: TreatmentModule | null;
  onClose: () => void;
  onSaved: () => void;
  apiEndpoint?: string;
  scope?: 'system' | 'organization' | 'private';
};

type TherapeuticDomain = 'self_strength' | 'relationships_repair' | 'identity_transformation' | 'purpose_future';

export function ModuleEditor({ module, onClose, onSaved, apiEndpoint = '/api/modules', scope = 'private' }: ModuleEditorProps) {
  const { user } = useAuth();
  const isEdit = !!module;

  // Form state
  const [name, setName] = useState('');
  const [domain, setDomain] = useState<TherapeuticDomain>('self_strength');
  const [description, setDescription] = useState('');
  // Template IDs - multi-select arrays
  const [reflectionTemplateIds, setReflectionTemplateIds] = useState<string[]>([]);
  const [surveyTemplateIds, setSurveyTemplateIds] = useState<string[]>([]);

  // AI Prompts state - inline prompt and library prompts
  const [aiPromptText, setAiPromptText] = useState('');
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with module data if editing
  useEffect(() => {
    if (module) {
      setName(module.name);
      setDomain(module.domain as TherapeuticDomain);
      setDescription(module.description);

      // Load template IDs arrays
      setReflectionTemplateIds((module as any).reflectionTemplateIds || []);
      setSurveyTemplateIds((module as any).surveyTemplateIds || []);

      // Load inline AI prompt text
      setAiPromptText(module.aiPromptText || '');

      // Load linked prompt IDs from junction table
      const linkedPromptIds = (module as any).linkedPrompts?.map((p: any) => p.id) || [];
      setSelectedPromptIds(linkedPromptIds);
    }
  }, [module]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const payload = {
        name,
        domain,
        description,
        scope,

        // Template ID arrays from library
        reflectionTemplateIds,
        surveyTemplateIds,

        // AI Prompts: inline prompt text + linked prompts from library
        aiPromptText,
        linkedPromptIds: selectedPromptIds,
      };

      const url = isEdit ? `${apiEndpoint}/${module.id}` : apiEndpoint;
      const response = await authenticatedFetch(url, user, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save module');
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen px-4 py-8">
        <div className="relative mx-auto max-w-3xl rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEdit ? 'Edit Treatment Module' : 'Create Treatment Module'}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Title
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  maxLength={255}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  placeholder="e.g., Self-Resilience & Re-Authoring"
                />
                <p className="mt-1 text-xs text-gray-500">
                  3-255 characters required
                </p>
              </div>

              {/* Domain */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Domain
                </label>
                <select
                  value={domain}
                  onChange={e => setDomain(e.target.value as TherapeuticDomain)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                >
                  <option value="self_strength">Self & Strength</option>
                  <option value="relationships_repair">Relationships & Repair</option>
                  <option value="identity_transformation">Identity & Transformation</option>
                  <option value="purpose_future">Purpose & Future</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Description
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  maxLength={5000}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  placeholder="Help people re-tell stories of survival and rediscover agency."
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    10-5,000 characters required
                  </p>
                  <p className="text-xs text-gray-400">
                    {description.length}
                    /5000
                  </p>
                </div>
              </div>

              {/* Reflection Questions Template */}
              <TemplateSelector
                selectedTemplateIds={reflectionTemplateIds}
                onChange={setReflectionTemplateIds}
                templateType="reflection"
                apiEndpoint={
                  scope === 'system'
                    ? '/api/super-admin/templates'
                    : scope === 'organization'
                      ? '/api/org-admin/templates'
                      : '/api/therapist/templates'
                }
                label="Reflection Questions (Qualitative Data)"
                description="Post-session questions for patients in Story Pages. These collect qualitative narrative responses."
              />

              {/* Module AI Prompt (Inline) - Required */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Module AI Prompt
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <p className="mb-2 text-xs text-gray-600">
                  Core AI prompt for this module. This is always used for transcript analysis.
                </p>
                <textarea
                  value={aiPromptText}
                  onChange={e => setAiPromptText(e.target.value)}
                  required
                  maxLength={10000}
                  rows={8}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  placeholder="You are a narrative therapy AI assistant analyzing session transcripts. Focus on identifying therapeutic themes, patterns, and insights..."
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    50-10,000 characters required. This prompt is stored directly on the module and is always executed during analysis.
                  </p>
                  <p className="text-xs text-gray-400">
                    {aiPromptText.length}
                    /10000
                  </p>
                </div>
              </div>

              {/* Linked AI Prompts from Library - Optional */}
              <PromptSelector
                selectedPromptIds={selectedPromptIds}
                onChange={setSelectedPromptIds}
                apiEndpoint={
                  scope === 'system'
                    ? '/api/super-admin/prompts'
                    : scope === 'organization'
                      ? '/api/org-admin/prompts'
                      : '/api/therapist/prompts'
                }
                label="AI Analysis Prompts"
                description="Select AI prompts from the library to use for analyzing transcripts with this module"
              />

              {/* Survey Questions Template */}
              <TemplateSelector
                selectedTemplateIds={surveyTemplateIds}
                onChange={setSurveyTemplateIds}
                templateType="survey"
                apiEndpoint={
                  scope === 'system'
                    ? '/api/super-admin/templates'
                    : scope === 'organization'
                      ? '/api/org-admin/templates'
                      : '/api/therapist/templates'
                }
                label="Survey Questions (Quantitative Data)"
                description="Structured survey questions for patients in Story Pages. These collect quantitative outcome data."
              />

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
              <button
                onClick={onClose}
                type="button"
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Module'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
