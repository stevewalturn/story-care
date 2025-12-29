'use client';

/**
 * Module Editor Component
 * Create/Edit treatment module modal matching design spec
 */

import type { TreatmentModule } from '@/models/Schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';
import { PromptSelector } from '../prompts/PromptSelector';

type ModuleEditorProps = {
  module: TreatmentModule | null;
  onClose: () => void;
  onSaved: () => void;
  apiEndpoint?: string;
  scope?: 'system' | 'organization' | 'private';
};

type TherapeuticDomain = 'self_strength' | 'relationships_repair' | 'identity_transformation' | 'purpose_future';

// Create a schema without defaults for the form (defaults will be set in defaultValues)
const moduleFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(255, 'Name must be at most 255 characters'),
  domain: z.enum(['self_strength', 'relationships_repair', 'identity_transformation', 'purpose_future']),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description must be at most 5000 characters'),
  scope: z.enum(['system', 'organization', 'private']),
  aiPromptText: z.string().min(50, 'AI prompt must be at least 50 characters').max(10000, 'AI prompt must be at most 10000 characters'),
  linkedPromptIds: z.array(z.string().uuid()),
  aiPromptMetadata: z.record(z.string(), z.any()).optional(),
});

type ModuleFormData = z.infer<typeof moduleFormSchema>;

export function ModuleEditor({ module, onClose, onSaved, apiEndpoint = '/api/modules', scope = 'private' }: ModuleEditorProps) {
  const { user } = useAuth();
  const isEdit = !!module;

  // Linked prompts state (separate from form as it uses custom selector)
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
  } = useForm<ModuleFormData>({
    resolver: zodResolver(moduleFormSchema),
    mode: 'onChange', // Validate on change for real-time feedback
    defaultValues: {
      name: '',
      domain: 'self_strength' as TherapeuticDomain,
      description: '',
      scope,
      aiPromptText: '',
      linkedPromptIds: [],
    },
  });

  // Watch field values for character counters
  const watchName = watch('name');
  const watchDescription = watch('description');
  const watchAiPromptText = watch('aiPromptText');

  // Initialize form with module data if editing
  useEffect(() => {
    if (module) {
      reset({
        name: module.name,
        domain: module.domain as TherapeuticDomain,
        description: module.description,
        scope,
        aiPromptText: module.aiPromptText || '',
        linkedPromptIds: [],
      });

      // Load linked prompt IDs from junction table
      const linkedPromptIds = (module as any).linkedPrompts?.map((p: any) => p.id) || [];
      setSelectedPromptIds(linkedPromptIds);
    }
  }, [module, reset, scope]);

  const onSubmit = async (data: ModuleFormData) => {
    setError(null);
    setSaving(true);

    try {
      const payload = {
        ...data,
        // AI Prompts: inline prompt text + linked prompts from library
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

  // Helper component for character counter
  const CharacterCounter = ({ current, min, max }: { current: number; min: number; max: number }) => {
    const isValid = current >= min && current <= max;
    const isTooShort = current < min;

    return (
      <div className="mt-1 flex items-center justify-between">
        <p className={`text-xs ${isTooShort ? 'text-red-600' : 'text-gray-500'}`}>
          {min}
          -
          {max.toLocaleString()}
          {' '}
          characters required
        </p>
        <p className={`text-xs font-medium ${isValid ? 'text-green-600' : isTooShort ? 'text-red-600' : 'text-gray-400'}`}>
          {current}
          /
          {max.toLocaleString()}
        </p>
      </div>
    );
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
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
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
                  {...register('name')}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:ring-2 focus:outline-none ${
                    errors.name
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500/20'
                  }`}
                  placeholder="e.g., Self-Resilience & Re-Authoring"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                )}
                <CharacterCounter current={watchName?.length || 0} min={3} max={255} />
              </div>

              {/* Domain */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Domain
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('domain')}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:ring-2 focus:outline-none ${
                    errors.domain
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500/20'
                  }`}
                >
                  <option value="self_strength">Self & Strength</option>
                  <option value="relationships_repair">Relationships & Repair</option>
                  <option value="identity_transformation">Identity & Transformation</option>
                  <option value="purpose_future">Purpose & Future</option>
                </select>
                {errors.domain && (
                  <p className="mt-1 text-xs text-red-600">{errors.domain.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Description
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:ring-2 focus:outline-none ${
                    errors.description
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500/20'
                  }`}
                  placeholder="Help people re-tell stories of survival and rediscover agency."
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
                )}
                <CharacterCounter current={watchDescription?.length || 0} min={10} max={5000} />
              </div>

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
                  {...register('aiPromptText')}
                  rows={8}
                  className={`w-full rounded-lg border px-4 py-2.5 font-mono text-sm focus:ring-2 focus:outline-none ${
                    errors.aiPromptText
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500/20'
                  }`}
                  placeholder="You are a narrative therapy AI assistant analyzing session transcripts. Focus on identifying therapeutic themes, patterns, and insights..."
                />
                {errors.aiPromptText && (
                  <p className="mt-1 text-xs text-red-600">{errors.aiPromptText.message}</p>
                )}
                <CharacterCounter current={watchAiPromptText?.length || 0} min={50} max={10000} />
                <p className="mt-1 text-xs text-gray-500">
                  This prompt is stored directly on the module and is always executed during analysis.
                </p>
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
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={saving || !isValid}
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
