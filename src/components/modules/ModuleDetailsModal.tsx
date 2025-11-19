'use client';

/**
 * Module Details Modal Component
 * Read-only view of module with tabbed interface
 */

import type { TreatmentModuleWithPrompts } from '@/models/Schema';
import { FileText, Pencil, Sparkles, TrendingUp, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type ModuleDetailsModalProps = {
  module: TreatmentModuleWithPrompts;
  onClose: () => void;
  onEdit?: () => void; // Optional - only provided for editable modules
  onCopy?: () => void; // Optional - only provided for system modules
};

type Tab = 'overview' | 'questions' | 'prompts';

type Template = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  questions: any[];
  scope: string;
};

export function ModuleDetailsModal({ module, onClose, onEdit, onCopy }: ModuleDetailsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [reflectionTemplate, setReflectionTemplate] = useState<Template | null>(null);
  const [surveyTemplate, setSurveyTemplate] = useState<Template | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const domainInfo = getDomainInfo(module.domain);

  // Fetch templates if IDs are present
  useEffect(() => {
    const fetchTemplates = async () => {
      const reflectionId = (module as any).reflectionTemplateId;
      const surveyId = (module as any).surveyTemplateId;

      if (!reflectionId && !surveyId) return;

      setLoadingTemplates(true);
      try {
        // Fetch reflection template
        if (reflectionId) {
          const response = await authenticatedFetch(
            `/api/therapist/templates/${reflectionId}`,
            user,
          );
          if (response.ok) {
            const data = await response.json();
            setReflectionTemplate(data.template);
          }
        }

        // Fetch survey template
        if (surveyId) {
          const response = await authenticatedFetch(
            `/api/therapist/templates/${surveyId}`,
            user,
          );
          if (response.ok) {
            const data = await response.json();
            setSurveyTemplate(data.template);
          }
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [module, user]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen px-4 py-8">
        <div className="relative mx-auto max-w-4xl rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="border-b border-gray-200">
            <div className="flex items-start justify-between px-6 py-4">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${domainInfo.badgeClass}`}>
                    <span className={`h-2 w-2 rounded-full ${domainInfo.dotClass}`} />
                    {domainInfo.name}
                  </span>
                  {module.scope !== 'system' && (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                      {module.scope === 'organization' ? 'Organization' : 'Private'}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{module.name}</h2>
                <p className="mt-2 text-gray-600">{module.description}</p>
              </div>
              <div className="flex gap-2">
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="rounded-lg border border-gray-300 p-2 text-gray-700 hover:bg-gray-50"
                    type="button"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6">
              <div className="flex gap-6 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`pb-3 text-sm font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  type="button"
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('questions')}
                  className={`pb-3 text-sm font-medium transition-colors ${
                    activeTab === 'questions'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  type="button"
                >
                  Questions
                </button>
                <button
                  onClick={() => setActiveTab('prompts')}
                  className={`pb-3 text-sm font-medium transition-colors ${
                    activeTab === 'prompts'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  type="button"
                >
                  AI Prompts
                  {' '}
                  {module.linkedPrompts && module.linkedPrompts.length > 0 && (
                    <span className="ml-1 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                      {module.linkedPrompts.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <TrendingUp className="h-4 w-4" />
                      Usage Count
                    </div>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {module.useCount}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">Sessions using this module</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="text-sm text-gray-600">Status</div>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {module.status === 'active' ? '✓ Active' : module.status}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">Current module status</p>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="text-sm text-gray-600">Created</div>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {new Date(module.createdAt).toLocaleDateString()}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">Module creation date</p>
                  </div>
                </div>

                {/* Full Description */}
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">Therapeutic Aim</h3>
                  <p className="text-gray-700">{module.description}</p>
                </div>
              </div>
            )}

            {/* Questions Tab */}
            {activeTab === 'questions' && (
              <div className="space-y-6">
                {loadingTemplates ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                    <p className="mt-2 text-sm text-gray-600">Loading templates...</p>
                  </div>
                ) : (
                  <>
                    {/* Reflection Questions Template */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-900">
                        Reflection Questions (Post-Session)
                      </h3>
                      <p className="mb-4 text-sm text-gray-600">
                        Questions for patients to answer in story pages after the session.
                      </p>

                      {reflectionTemplate ? (
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                          <div className="mb-4 flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-indigo-600" />
                                <h4 className="font-semibold text-gray-900">{reflectionTemplate.title}</h4>
                              </div>
                              {reflectionTemplate.description && (
                                <p className="mt-1 text-sm text-gray-600">{reflectionTemplate.description}</p>
                              )}
                              <div className="mt-2 flex items-center gap-2">
                                <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                  {reflectionTemplate.category}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {reflectionTemplate.scope === 'system' ? 'System Template' : reflectionTemplate.scope === 'organization' ? 'Organization Template' : 'Private Template'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {reflectionTemplate.questions?.map((question: any, index: number) => (
                              <div key={index} className="rounded-lg border border-green-200 bg-green-50 p-4">
                                <div className="mb-2 flex items-start gap-3">
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
                                    {index + 1}
                                  </span>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{question.questionText}</p>
                                    <span className="mt-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                      {question.questionType}
                                    </span>
                                  </div>
                                </div>
                                {question.questionType === 'multiple_choice' && question.options && (
                                  <div className="mt-2 ml-9 text-sm text-gray-600">
                                    Options:
                                    {' '}
                                    {question.options.join(', ')}
                                  </div>
                                )}
                                {question.questionType === 'scale' && (
                                  <div className="mt-2 ml-9 text-sm text-gray-600">
                                    Scale:
                                    {' '}
                                    {question.scaleMin}
                                    {' '}
                                    (
                                    {question.scaleMinLabel}
                                    ) to
                                    {' '}
                                    {question.scaleMax}
                                    {' '}
                                    (
                                    {question.scaleMaxLabel}
                                    )
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No reflection template selected</p>
                      )}
                    </div>

                    {/* Survey Questions Template */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-900">
                        Survey Questions
                      </h3>
                      <p className="mb-4 text-sm text-gray-600">
                        Structured survey questions for quantitative data collection.
                      </p>

                      {surveyTemplate ? (
                        <div className="rounded-lg border border-gray-200 bg-white p-4">
                          <div className="mb-4 flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-indigo-600" />
                                <h4 className="font-semibold text-gray-900">{surveyTemplate.title}</h4>
                              </div>
                              {surveyTemplate.description && (
                                <p className="mt-1 text-sm text-gray-600">{surveyTemplate.description}</p>
                              )}
                              <div className="mt-2 flex items-center gap-2">
                                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                  {surveyTemplate.category}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {surveyTemplate.scope === 'system' ? 'System Template' : surveyTemplate.scope === 'organization' ? 'Organization Template' : 'Private Template'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {surveyTemplate.questions?.map((question: any, index: number) => (
                              <div key={index} className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                <div className="mb-2 flex items-start gap-3">
                                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                                    {index + 1}
                                  </span>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900">{question.questionText}</p>
                                    <span className="mt-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                      {question.questionType}
                                    </span>
                                  </div>
                                </div>
                                {question.questionType === 'multiple_choice' && question.options && (
                                  <div className="mt-2 ml-9 text-sm text-gray-600">
                                    Options:
                                    {' '}
                                    {question.options.join(', ')}
                                  </div>
                                )}
                                {question.questionType === 'scale' && (
                                  <div className="mt-2 ml-9 text-sm text-gray-600">
                                    Scale:
                                    {' '}
                                    {question.scaleMin}
                                    {' '}
                                    (
                                    {question.scaleMinLabel}
                                    ) to
                                    {' '}
                                    {question.scaleMax}
                                    {' '}
                                    (
                                    {question.scaleMaxLabel}
                                    )
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No survey template selected</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* AI Prompts Tab */}
            {activeTab === 'prompts' && (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">Linked AI Prompts</h3>
                  <p className="mb-4 text-sm text-gray-600">
                    These prompts are used to analyze transcripts for this module.
                  </p>

                  {module.linkedPrompts && module.linkedPrompts.length > 0 ? (
                    <div className="space-y-3">
                      {module.linkedPrompts.map((prompt) => {
                        const categoryColors = {
                          analysis: 'bg-blue-100 text-blue-700',
                          creative: 'bg-purple-100 text-purple-700',
                          extraction: 'bg-green-100 text-green-700',
                          reflection: 'bg-orange-100 text-orange-700',
                        };

                        return (
                          <div
                            key={prompt.id}
                            className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
                          >
                            <div className="mb-2 flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{prompt.name}</h4>
                                <div className="mt-1 flex items-center gap-2">
                                  {prompt.category && (
                                    <span
                                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[prompt.category as keyof typeof categoryColors]}`}
                                    >
                                      {prompt.category}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1 text-xs text-gray-500">
                                    <Sparkles className="h-3 w-3" />
                                    {prompt.icon || 'sparkles'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {prompt.description && (
                              <p className="mb-3 text-sm text-gray-600">{prompt.description}</p>
                            )}

                            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                              <pre className="font-mono text-xs whitespace-pre-wrap text-gray-700">
                                {prompt.promptText}
                              </pre>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                      <Sparkles className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                      <h3 className="mb-1 text-lg font-semibold text-gray-900">No AI Prompts Linked</h3>
                      <p className="text-sm text-gray-600">
                        This module doesn't have any AI prompts attached yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-500">
              Module ID:
              {' '}
              <code className="rounded bg-gray-100 px-1 font-mono text-xs">{module.id}</code>
            </p>
            <div className="flex gap-2">
              {onCopy && (
                <button
                  onClick={onCopy}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                  type="button"
                >
                  Copy Module
                </button>
              )}
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  type="button"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Module
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get domain styling
function getDomainInfo(domain: string) {
  const domains = {
    self_strength: {
      name: 'Self & Strength',
      badgeClass: 'bg-blue-50 text-blue-700',
      dotClass: 'bg-blue-500',
    },
    relationships_repair: {
      name: 'Relationships & Repair',
      badgeClass: 'bg-green-50 text-green-700',
      dotClass: 'bg-green-500',
    },
    identity_transformation: {
      name: 'Identity & Transformation',
      badgeClass: 'bg-purple-50 text-purple-700',
      dotClass: 'bg-purple-500',
    },
    purpose_future: {
      name: 'Purpose & Future',
      badgeClass: 'bg-orange-50 text-orange-700',
      dotClass: 'bg-orange-500',
    },
  };

  return domains[domain as keyof typeof domains] || domains.self_strength;
}
