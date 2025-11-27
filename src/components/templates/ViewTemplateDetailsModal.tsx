'use client';

/**
 * View Template Details Modal Component
 * Shows full template details including all questions
 */

import { CheckCircle, FileText, X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

type QuestionType = 'open_text' | 'multiple_choice' | 'scale' | 'emotion';

type Question = {
  id: string;
  questionText: string;
  questionType: QuestionType;
  required: boolean;
  order: number;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
};

type Template = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  type: 'reflection' | 'survey';
  scope: string;
  questions: Question[];
  useCount: number;
  createdAt: string;
  updatedAt: string;
};

type ViewTemplateDetailsModalProps = {
  template: Template;
  scopeLabel: string;
  onClose: () => void;
};

export function ViewTemplateDetailsModal({ template, scopeLabel, onClose }: ViewTemplateDetailsModalProps) {
  const categoryColors: Record<string, string> = {
    'narrative': 'bg-purple-100 text-purple-700',
    'emotion': 'bg-pink-100 text-pink-700',
    'screening': 'bg-blue-100 text-blue-700',
    'outcome': 'bg-green-100 text-green-700',
    'satisfaction': 'bg-yellow-100 text-yellow-700',
    'goal-setting': 'bg-orange-100 text-orange-700',
    'custom': 'bg-gray-100 text-gray-700',
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case 'open_text':
        return 'Open Text';
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'scale':
        return 'Scale';
      case 'emotion':
        return 'Emotion';
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('[ViewTemplateDetailsModal] Opened with template:', template);
    console.log('[ViewTemplateDetailsModal] Questions:', template.questions);
    console.log('[ViewTemplateDetailsModal] Questions count:', template.questions?.length || 0);
  }, [template]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen px-4 py-8">
        <div className="relative mx-auto max-w-3xl rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">{template.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                    template.type === 'reflection'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {template.type}
                </span>
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                    categoryColors[template.category] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {template.category}
                </span>
                <span className="inline-block rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  {scopeLabel}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Description */}
            {template.description && (
              <div className="mb-6">
                <h3 className="mb-2 text-sm font-semibold text-gray-900">Description</h3>
                <p className="text-sm text-gray-600">{template.description}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="mb-6 flex items-center gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Questions:</span>
                {' '}
                {template.questions?.length || 0}
              </div>
              <div>
                <span className="font-medium">Used:</span>
                {' '}
                {template.useCount}
                {' '}
                times
              </div>
              <div>
                <span className="font-medium">Created:</span>
                {' '}
                {new Date(template.createdAt).toLocaleDateString()}
              </div>
            </div>

            {/* Questions */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Questions</h3>
              {template.questions && template.questions.length > 0 ? (
                <div className="space-y-4">
                  {template.questions
                    .sort((a, b) => a.order - b.order)
                    .map((question, index) => (
                      <div key={question.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-500">
                                Question
                                {' '}
                                {index + 1}
                              </span>
                              {question.required && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                                  <CheckCircle className="h-3 w-3" />
                                  Required
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900">{question.questionText}</p>
                          </div>
                        </div>

                        <div className="mt-2">
                          <span className="inline-block rounded bg-white px-2 py-1 text-xs text-gray-600">
                            {getQuestionTypeLabel(question.questionType)}
                          </span>
                        </div>

                        {/* Multiple Choice Options */}
                        {question.questionType === 'multiple_choice' && question.options && question.options.length > 0 && (
                          <div className="mt-3">
                            <p className="mb-1 text-xs font-medium text-gray-600">Options:</p>
                            <ul className="space-y-1">
                              {question.options.map((option, idx) => (
                                <li key={idx} className="text-sm text-gray-700">
                                  •
                                  {option}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Scale Options */}
                        {question.questionType === 'scale' && (
                          <div className="mt-3">
                            <div className="flex items-center gap-4 text-sm text-gray-700">
                              <div>
                                <span className="font-medium">Range:</span>
                                {' '}
                                {question.scaleMin || 1}
                                {' '}
                                -
                                {' '}
                                {question.scaleMax || 10}
                              </div>
                              {(question.scaleMinLabel || question.scaleMaxLabel) && (
                                <div>
                                  <span className="font-medium">Labels:</span>
                                  {' '}
                                  {question.scaleMinLabel || 'Min'}
                                  {' '}
                                  →
                                  {' '}
                                  {question.scaleMaxLabel || 'Max'}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                  <FileText className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-600">No questions in this template</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              type="button"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render modal using portal to ensure it appears above all content
  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
}
