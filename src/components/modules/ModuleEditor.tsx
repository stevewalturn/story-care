'use client';

/**
 * Module Editor Component
 * Create/Edit treatment module modal with full form
 */

import type { TreatmentModule } from '@/models/Schema';
import { Minus, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type ModuleEditorProps = {
  module: TreatmentModule | null;
  onClose: () => void;
  onSaved: () => void;
};

type TherapeuticDomain = 'self_strength' | 'relationships_repair' | 'identity_transformation' | 'purpose_future';

export function ModuleEditor({ module, onClose, onSaved }: ModuleEditorProps) {
  const isEdit = !!module;

  // Form state
  const [name, setName] = useState('');
  const [domain, setDomain] = useState<TherapeuticDomain>('self_strength');
  const [description, setDescription] = useState('');
  const [inSessionQuestions, setInSessionQuestions] = useState<string[]>(['']);
  const [aiPromptText, setAiPromptText] = useState('');
  const [scope, setScope] = useState<'system' | 'organization' | 'private'>('private');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with module data if editing
  useEffect(() => {
    if (module) {
      setName(module.name);
      setDomain(module.domain as TherapeuticDomain);
      setDescription(module.description);
      setInSessionQuestions((module.inSessionQuestions as string[]) || ['']);
      setAiPromptText(module.aiPromptText);
      setScope(module.scope as any);
    }
  }, [module]);

  const handleAddQuestion = () => {
    setInSessionQuestions([...inSessionQuestions, '']);
  };

  const handleRemoveQuestion = (index: number) => {
    setInSessionQuestions(inSessionQuestions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, value: string) => {
    const updated = [...inSessionQuestions];
    updated[index] = value;
    setInSessionQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Filter out empty questions
      const filteredQuestions = inSessionQuestions.filter(q => q.trim());

      if (filteredQuestions.length === 0) {
        throw new Error('Please add at least one in-session question');
      }

      const payload = {
        name,
        domain,
        description,
        scope,
        inSessionQuestions: filteredQuestions,
        aiPromptText,
      };

      const response = await fetch(
        isEdit ? `/api/modules/${module.id}` : '/api/modules',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

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
              {isEdit ? 'Edit Module' : 'Create New Module'}
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
              {/* Basic Info Section */}
              <div>
                <h3 className="mb-4 text-sm font-semibold text-gray-900">Basic Information</h3>
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Module Name
                      {' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      placeholder="e.g., Self-Resilience & Re-Authoring"
                    />
                  </div>

                  {/* Domain */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Therapeutic Domain
                      {' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={domain}
                      onChange={e => setDomain(e.target.value as TherapeuticDomain)}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="self_strength">Self & Strength</option>
                      <option value="relationships_repair">Relationships & Repair</option>
                      <option value="identity_transformation">Identity & Transformation</option>
                      <option value="purpose_future">Purpose & Future</option>
                    </select>
                  </div>

                  {/* Scope */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Scope
                      {' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={scope}
                      onChange={e => setScope(e.target.value as any)}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="private">Private (Only me)</option>
                      <option value="organization">Organization (My org)</option>
                      <option value="system">System (Everyone)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      System scope requires super admin permissions
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Therapeutic Aim
                      {' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      required
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      placeholder="Describe the clinical aim of this module..."
                    />
                  </div>
                </div>
              </div>

              {/* In-Session Questions */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Opening Questions (In-Session)
                  </h3>
                  <button
                    onClick={handleAddQuestion}
                    type="button"
                    className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Question
                  </button>
                </div>
                <div className="space-y-3">
                  {inSessionQuestions.map((question, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={question}
                        onChange={e => handleQuestionChange(index, e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        placeholder={`Question ${index + 1}`}
                      />
                      {inSessionQuestions.length > 1 && (
                        <button
                          onClick={() => handleRemoveQuestion(index)}
                          type="button"
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        >
                          <Minus className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Prompt */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  AI Analysis Prompt
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={aiPromptText}
                  onChange={e => setAiPromptText(e.target.value)}
                  required
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Instructions for AI to analyze transcript with this module's focus..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  This prompt guides AI analysis to extract module-specific insights from transcripts
                </p>
              </div>

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
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Saving...' : isEdit ? 'Update Module' : 'Create Module'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
