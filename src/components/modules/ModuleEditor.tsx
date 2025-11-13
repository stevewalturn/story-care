'use client';

/**
 * Module Editor Component
 * Create/Edit treatment module modal matching design spec
 */

import type { TreatmentModule } from '@/models/Schema';
import { Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

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
  const [inSessionQuestions, setInSessionQuestions] = useState<string[]>(['']);
  const [reflectionQuestions, setReflectionQuestions] = useState<string[]>(['']);

  // AI Prompts state
  const [aiPrompts, setAiPrompts] = useState({
    createScene: false,
    selfResilience: false,
    groundingRegulation: false,
    relationalHealing: false,
  });

  // Survey Bundle state
  const [surveyBundle, setSurveyBundle] = useState({
    emotionalImpact: false,
    resonance: false,
    openFeedback: false,
    primaryEmotion: false,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with module data if editing
  useEffect(() => {
    if (module) {
      setName(module.name);
      setDomain(module.domain as TherapeuticDomain);
      setDescription(module.description);
      setInSessionQuestions((module.inSessionQuestions as string[]) || ['']);
      setReflectionQuestions((module.reflectionQuestions as string[]) || ['']);

      // Load AI prompts from metadata
      if (module.aiPromptMetadata) {
        setAiPrompts((module.aiPromptMetadata as any)?.prompts || {
          createScene: false,
          selfResilience: false,
          groundingRegulation: false,
          relationalHealing: false,
        });
        setSurveyBundle((module.aiPromptMetadata as any)?.surveyBundle || {
          emotionalImpact: false,
          resonance: false,
          openFeedback: false,
          primaryEmotion: false,
        });
      }
    }
  }, [module]);

  // In-Session Questions handlers
  const handleAddInSessionQuestion = () => {
    setInSessionQuestions([...inSessionQuestions, '']);
  };

  const handleRemoveInSessionQuestion = (index: number) => {
    if (inSessionQuestions.length > 1) {
      setInSessionQuestions(inSessionQuestions.filter((_, i) => i !== index));
    }
  };

  const handleInSessionQuestionChange = (index: number, value: string) => {
    const updated = [...inSessionQuestions];
    updated[index] = value;
    setInSessionQuestions(updated);
  };

  // Reflection Questions handlers
  const handleAddReflectionQuestion = () => {
    setReflectionQuestions([...reflectionQuestions, '']);
  };

  const handleRemoveReflectionQuestion = (index: number) => {
    if (reflectionQuestions.length > 1) {
      setReflectionQuestions(reflectionQuestions.filter((_, i) => i !== index));
    }
  };

  const handleReflectionQuestionChange = (index: number, value: string) => {
    const updated = [...reflectionQuestions];
    updated[index] = value;
    setReflectionQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Filter out empty questions
      const filteredInSessionQuestions = inSessionQuestions.filter(q => q.trim());
      const filteredReflectionQuestions = reflectionQuestions.filter(q => q.trim());

      if (filteredInSessionQuestions.length === 0) {
        throw new Error('Please add at least one in-session question');
      }

      // Build AI prompt text from selected options
      const selectedPrompts = [];
      if (aiPrompts.createScene) selectedPrompts.push('Create therapeutic scene visualization');
      if (aiPrompts.selfResilience) selectedPrompts.push('Analyze self-resilience and re-authoring themes');
      if (aiPrompts.groundingRegulation) selectedPrompts.push('Identify grounding and emotional regulation opportunities');
      if (aiPrompts.relationalHealing) selectedPrompts.push('Examine relational healing and integration patterns');

      const aiPromptText = selectedPrompts.length > 0
        ? `Analyze the transcript with focus on: ${selectedPrompts.join('; ')}. Extract key quotes, identify metaphors and sensory language, summarize therapeutic themes in 2-3 sentences, and suggest visual scenes that convey the emotional core.`
        : 'Analyze this transcript for therapeutic insights. Extract meaningful quotes, identify emotional themes and metaphors, summarize the narrative arc in 2-3 sentences, and suggest visual scenes that capture the therapeutic moment.';

      const payload = {
        name,
        domain,
        description,
        scope,
        inSessionQuestions: filteredInSessionQuestions,
        reflectionQuestions: filteredReflectionQuestions,
        aiPromptText,
        aiPromptMetadata: {
          prompts: aiPrompts,
          surveyBundle,
        },
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
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  placeholder="e.g., Self-Resilience & Re-Authoring"
                />
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
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  placeholder="Help people re-tell stories of survival and rediscover agency."
                />
              </div>

              {/* Opening Questions (In-Session) */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">
                      Opening Questions (In-Session)
                    </label>
                    <p className="text-xs text-gray-500">
                      Questions for therapists to guide the therapeutic conversation during live sessions
                    </p>
                  </div>
                  <button
                    onClick={handleAddInSessionQuestion}
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add Question
                  </button>
                </div>
                <div className="space-y-2">
                  {inSessionQuestions.map((question, index) => (
                    <div key={index} className="flex gap-2">
                      <textarea
                        value={question}
                        onChange={e => handleInSessionQuestionChange(index, e.target.value)}
                        rows={2}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        placeholder={`In-session question ${index + 1}`}
                      />
                      <button
                        onClick={() => handleRemoveInSessionQuestion(index)}
                        type="button"
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reflection Questions (Post-Session) */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">
                      Reflection Questions (Post-Session)
                    </label>
                    <p className="text-xs text-gray-500">
                      Questions for patients to answer in story pages after the session
                    </p>
                  </div>
                  <button
                    onClick={handleAddReflectionQuestion}
                    type="button"
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add Question
                  </button>
                </div>
                <div className="space-y-2">
                  {reflectionQuestions.map((question, index) => (
                    <div key={index} className="flex gap-2">
                      <textarea
                        value={question}
                        onChange={e => handleReflectionQuestionChange(index, e.target.value)}
                        rows={2}
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        placeholder={`Reflection question ${index + 1}`}
                      />
                      <button
                        onClick={() => handleRemoveReflectionQuestion(index)}
                        type="button"
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        title="Delete question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Prompts */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  AI Prompts
                </label>
                <p className="mb-3 text-xs text-gray-500">
                  Link AI analysis prompts relevant to this therapeutic approach
                </p>
                <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <label className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={aiPrompts.createScene}
                        onChange={e => setAiPrompts({ ...aiPrompts, createScene: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <span className="text-sm text-gray-900">Create A Scene</span>
                    </div>
                    <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                      therapeutic_card
                    </span>
                  </label>

                  <label className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={aiPrompts.selfResilience}
                        onChange={e => setAiPrompts({ ...aiPrompts, selfResilience: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <span className="text-sm text-gray-900">Self-Resilience & Re-Authoring Analysis</span>
                    </div>
                    <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                      analysis
                    </span>
                  </label>

                  <label className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={aiPrompts.groundingRegulation}
                        onChange={e => setAiPrompts({ ...aiPrompts, groundingRegulation: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <span className="text-sm text-gray-900">Grounding & Regulation Analysis</span>
                    </div>
                    <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                      analysis
                    </span>
                  </label>

                  <label className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={aiPrompts.relationalHealing}
                        onChange={e => setAiPrompts({ ...aiPrompts, relationalHealing: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <span className="text-sm text-gray-900">Relational Healing & Integration Analysis</span>
                    </div>
                    <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                      analysis
                    </span>
                  </label>
                </div>
              </div>

              {/* Survey Bundle */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Survey Bundle
                </label>
                <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={surveyBundle.emotionalImpact}
                      onChange={e => setSurveyBundle({ ...surveyBundle, emotionalImpact: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="text-sm text-gray-900">
                      Emotional Impact (1-5 scale, 1=no impact, 5=very strong)
                    </span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={surveyBundle.resonance}
                      onChange={e => setSurveyBundle({ ...surveyBundle, resonance: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="text-sm text-gray-900">
                      Resonance (1-5 scale, 1=not at all, 5=completely)
                    </span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={surveyBundle.openFeedback}
                      onChange={e => setSurveyBundle({ ...surveyBundle, openFeedback: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="text-sm text-gray-900">Open Feedback</span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={surveyBundle.primaryEmotion}
                      onChange={e => setSurveyBundle({ ...surveyBundle, primaryEmotion: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="text-sm text-gray-900">Primary Emotion</span>
                  </label>
                </div>
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
