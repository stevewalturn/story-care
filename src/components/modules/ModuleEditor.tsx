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
import { TemplateQuestionEditor, type TemplateQuestion } from './TemplateQuestionEditor';

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
  const [reflectionQuestions, setReflectionQuestions] = useState<string[]>(['']);

  // Template toggle state
  const [useReflectionTemplate, setUseReflectionTemplate] = useState(false);
  const [useSurveyTemplate, setUseSurveyTemplate] = useState(false);

  // Template data state
  const [reflectionTemplate, setReflectionTemplate] = useState<{
    title: string;
    description?: string;
    questions: TemplateQuestion[];
  } | null>(null);

  const [surveyTemplate, setSurveyTemplate] = useState<{
    title: string;
    description?: string;
    questions: TemplateQuestion[];
  } | null>(null);

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
      setReflectionQuestions((module.reflectionQuestions as string[]) || ['']);

      // Load template toggles
      setUseReflectionTemplate(module.useReflectionTemplate || false);
      setUseSurveyTemplate(module.useSurveyTemplate || false);

      // TODO: Load template data if templateId exists
      // This would require fetching the template from the API

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
      const filteredReflectionQuestions = reflectionQuestions.filter(q => q.trim());

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

        // Reflection handling
        useReflectionTemplate,
        ...(useReflectionTemplate && reflectionTemplate
          ? {
              reflectionTemplateTitle: reflectionTemplate.title,
              reflectionTemplateDescription: reflectionTemplate.description,
              reflectionTemplateQuestions: reflectionTemplate.questions.map(q => ({
                text: q.questionText,
                type: q.questionType,
                options: q.options,
                scaleMin: q.scaleMin,
                scaleMax: q.scaleMax,
                scaleMinLabel: q.scaleMinLabel,
                scaleMaxLabel: q.scaleMaxLabel,
              })),
            }
          : {
              reflectionQuestions: filteredReflectionQuestions,
            }),

        // Survey handling
        useSurveyTemplate,
        ...(useSurveyTemplate && surveyTemplate
          ? {
              surveyTemplateTitle: surveyTemplate.title,
              surveyTemplateDescription: surveyTemplate.description,
              surveyTemplateQuestions: surveyTemplate.questions.map(q => ({
                text: q.questionText,
                type: q.questionType,
                options: q.options,
                scaleMin: q.scaleMin,
                scaleMax: q.scaleMax,
                scaleMinLabel: q.scaleMinLabel,
                scaleMaxLabel: q.scaleMaxLabel,
              })),
            }
          : {}),

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

              {/* Reflection Questions (Qualitative Data) */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">
                      Reflection Questions (Qualitative Data)
                    </label>
                    <p className="text-xs text-gray-500">
                      Post-session questions for patients in Story Pages. These collect qualitative narrative responses.
                    </p>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useReflectionTemplate}
                      onChange={e => {
                        const checked = e.target.checked;
                        setUseReflectionTemplate(checked);
                        if (checked && !reflectionTemplate) {
                          // Initialize template with empty data
                          setReflectionTemplate({
                            title: '',
                            description: '',
                            questions: [],
                          });
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="text-sm text-gray-700">Use Template</span>
                  </label>
                </div>

                {useReflectionTemplate ? (
                  <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Template Title
                      </label>
                      <input
                        type="text"
                        value={reflectionTemplate?.title || ''}
                        onChange={e =>
                          setReflectionTemplate({
                            title: e.target.value,
                            description: reflectionTemplate?.description || '',
                            questions: reflectionTemplate?.questions || [],
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        placeholder="e.g., Self-Resilience Reflection Set"
                        required={useReflectionTemplate}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Template Description (optional)
                      </label>
                      <textarea
                        value={reflectionTemplate?.description || ''}
                        onChange={e =>
                          setReflectionTemplate({
                            title: reflectionTemplate?.title || '',
                            description: e.target.value,
                            questions: reflectionTemplate?.questions || [],
                          })
                        }
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        placeholder="Describe this reflection set..."
                      />
                    </div>

                    <TemplateQuestionEditor
                      questions={reflectionTemplate?.questions || []}
                      onChange={questions =>
                        setReflectionTemplate({
                          title: reflectionTemplate?.title || '',
                          description: reflectionTemplate?.description || '',
                          questions,
                        })
                      }
                      templateType="reflection"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="mb-2 flex items-center justify-end">
                      <button
                        onClick={handleAddReflectionQuestion}
                        type="button"
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                      >
                        <Plus className="h-4 w-4" />
                        Add Question
                      </button>
                    </div>
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
                )}
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

              {/* Survey Bundle (Quantitative Data) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Survey Bundle (Quantitative Data)
                </label>
                <p className="mb-3 text-xs text-gray-500">
                  Structured survey questions for patients in Story Pages. These collect quantitative outcome data.
                </p>
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

              {/* Survey Template (Alternative to Survey Bundle) */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-gray-900">
                      Custom Survey Questions
                    </label>
                    <p className="text-xs text-gray-500">
                      Create a custom survey template with your own questions and formats.
                    </p>
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useSurveyTemplate}
                      onChange={e => {
                        const checked = e.target.checked;
                        setUseSurveyTemplate(checked);
                        if (checked && !surveyTemplate) {
                          // Initialize template with empty data
                          setSurveyTemplate({
                            title: '',
                            description: '',
                            questions: [],
                          });
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <span className="text-sm text-gray-700">Use Custom Survey Template</span>
                  </label>
                </div>

                {useSurveyTemplate && (
                  <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Survey Template Title
                      </label>
                      <input
                        type="text"
                        value={surveyTemplate?.title || ''}
                        onChange={e =>
                          setSurveyTemplate({
                            title: e.target.value,
                            description: surveyTemplate?.description || '',
                            questions: surveyTemplate?.questions || [],
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        placeholder="e.g., Post-Session Outcome Survey"
                        required={useSurveyTemplate}
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Survey Description (optional)
                      </label>
                      <textarea
                        value={surveyTemplate?.description || ''}
                        onChange={e =>
                          setSurveyTemplate({
                            title: surveyTemplate?.title || '',
                            description: e.target.value,
                            questions: surveyTemplate?.questions || [],
                          })
                        }
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                        placeholder="Describe this survey template..."
                      />
                    </div>

                    <TemplateQuestionEditor
                      questions={surveyTemplate?.questions || []}
                      onChange={questions =>
                        setSurveyTemplate({
                          title: surveyTemplate?.title || '',
                          description: surveyTemplate?.description || '',
                          questions,
                        })
                      }
                      templateType="survey"
                    />
                  </div>
                )}
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
