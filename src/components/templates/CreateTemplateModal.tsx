'use client';

/**
 * Create Template Modal Component
 * Modal for creating new survey and reflection question templates
 */

import { FileText, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type TemplateScope = 'system' | 'organization' | 'private';
type TemplateType = 'reflection' | 'survey';
type TemplateCategory = 'screening' | 'outcome' | 'satisfaction' | 'custom' | 'narrative' | 'emotion' | 'goal-setting';
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

type CreateTemplateModalProps = {
  scope: TemplateScope;
  onClose: () => void;
  onCreated: () => void;
};

export function CreateTemplateModal({ scope, onClose, onCreated }: CreateTemplateModalProps) {
  const { user } = useAuth();
  const [type, setType] = useState<TemplateType>('reflection');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('custom');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getScopeLabel = () => {
    switch (scope) {
      case 'system':
        return 'System Template';
      case 'organization':
        return 'Organization Template';
      case 'private':
        return 'Private Template';
    }
  };

  const getApiEndpoint = () => {
    switch (scope) {
      case 'system':
        return '/api/super-admin/templates';
      case 'organization':
        return '/api/org-admin/templates';
      case 'private':
        return '/api/therapist/templates';
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      questionText: '',
      questionType: 'open_text',
      required: false,
      order: questions.length,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => (q.id === id ? { ...q, ...updates } : q)));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Please enter a template title');
      return;
    }

    if (questions.length === 0) {
      setError('Please add at least one question');
      return;
    }

    const invalidQuestion = questions.find(q => !q.questionText.trim());
    if (invalidQuestion) {
      setError('All questions must have text');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await authenticatedFetch(getApiEndpoint(), user, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim() || undefined,
          category,
          questions,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create template');
      }

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen px-4 py-8">
        <div className="relative mx-auto max-w-4xl rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Create
                {' '}
                {getScopeLabel()}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {scope === 'system' && 'Create a template available to all organizations'}
                {scope === 'organization' && 'Create a template for your organization'}
                {scope === 'private' && 'Create a personal template for your use'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              type="button"
              disabled={isCreating}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-5">
              {/* Type */}
              <div>
                <label htmlFor="type" className="mb-2 block text-sm font-medium text-gray-700">
                  Template Type
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={e => setType(e.target.value as TemplateType)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  disabled={isCreating}
                >
                  <option value="reflection">🤔 Reflection - Patient reflection questions</option>
                  <option value="survey">📋 Survey - Patient survey questions</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-700">
                  Template Title
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  placeholder="e.g., Weekly Progress Check-in"
                  disabled={isCreating}
                  maxLength={255}
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="mb-2 block text-sm font-medium text-gray-700">
                  Category
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={e => setCategory(e.target.value as TemplateCategory)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  disabled={isCreating}
                >
                  <option value="narrative">📖 Narrative</option>
                  <option value="emotion">❤️ Emotion</option>
                  <option value="screening">🔍 Screening</option>
                  <option value="outcome">📊 Outcome</option>
                  <option value="satisfaction">⭐ Satisfaction</option>
                  <option value="goal-setting">🎯 Goal Setting</option>
                  <option value="custom">✏️ Custom</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-700">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  placeholder="What is this template for and when should it be used..."
                  disabled={isCreating}
                  maxLength={500}
                />
              </div>

              {/* Questions */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Questions
                    {' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <button
                    onClick={addQuestion}
                    type="button"
                    className="flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                    disabled={isCreating}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Question
                  </button>
                </div>

                {questions.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                    <FileText className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-600">No questions yet</p>
                    <p className="text-xs text-gray-500">Click "Add Question" to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div key={question.id} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="mb-3 flex items-start justify-between">
                          <span className="text-xs font-medium text-gray-500">
                            Question
                            {' '}
                            {index + 1}
                          </span>
                          <button
                            onClick={() => removeQuestion(question.id)}
                            type="button"
                            className="rounded p-1 text-red-600 hover:bg-red-50"
                            disabled={isCreating}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          {/* Question Text */}
                          <input
                            type="text"
                            value={question.questionText}
                            onChange={e => updateQuestion(question.id, { questionText: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            placeholder="Enter your question..."
                            disabled={isCreating}
                          />

                          <div className="grid grid-cols-2 gap-3">
                            {/* Question Type */}
                            <select
                              value={question.questionType}
                              onChange={e => updateQuestion(question.id, { questionType: e.target.value as QuestionType })}
                              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              disabled={isCreating}
                            >
                              <option value="open_text">Open Text</option>
                              <option value="multiple_choice">Multiple Choice</option>
                              <option value="scale">Scale</option>
                              <option value="emotion">Emotion</option>
                            </select>

                            {/* Required Toggle */}
                            <label className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2">
                              <input
                                type="checkbox"
                                checked={question.required}
                                onChange={e => updateQuestion(question.id, { required: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                disabled={isCreating}
                              />
                              <span className="text-sm text-gray-700">Required</span>
                            </label>
                          </div>

                          {/* Multiple Choice Options */}
                          {question.questionType === 'multiple_choice' && (
                            <div>
                              <label className="mb-1 block text-xs text-gray-600">
                                Options (comma-separated)
                              </label>
                              <input
                                type="text"
                                value={question.options?.join(', ') || ''}
                                onChange={e => updateQuestion(question.id, {
                                  options: e.target.value.split(',').map(o => o.trim()).filter(Boolean),
                                })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                placeholder="Option 1, Option 2, Option 3"
                                disabled={isCreating}
                              />
                            </div>
                          )}

                          {/* Scale Options */}
                          {question.questionType === 'scale' && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="mb-1 block text-xs text-gray-600">Min Value</label>
                                <input
                                  type="number"
                                  value={question.scaleMin || 1}
                                  onChange={e => updateQuestion(question.id, { scaleMin: Number.parseInt(e.target.value) })}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                  disabled={isCreating}
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-gray-600">Max Value</label>
                                <input
                                  type="number"
                                  value={question.scaleMax || 10}
                                  onChange={e => updateQuestion(question.id, { scaleMax: Number.parseInt(e.target.value) })}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                  disabled={isCreating}
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-gray-600">Min Label</label>
                                <input
                                  type="text"
                                  value={question.scaleMinLabel || ''}
                                  onChange={e => updateQuestion(question.id, { scaleMinLabel: e.target.value })}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                  placeholder="e.g., Not at all"
                                  disabled={isCreating}
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-gray-600">Max Label</label>
                                <input
                                  type="text"
                                  value={question.scaleMaxLabel || ''}
                                  onChange={e => updateQuestion(question.id, { scaleMaxLabel: e.target.value })}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                                  placeholder="e.g., Extremely"
                                  disabled={isCreating}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Info Box */}
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 flex-shrink-0 text-indigo-600" />
                  <div>
                    <h4 className="text-sm font-semibold text-indigo-900">Template Best Practices</h4>
                    <ul className="mt-2 space-y-1 text-xs text-indigo-700">
                      <li>• Group related questions into cohesive templates</li>
                      <li>• Use clear, patient-friendly language</li>
                      <li>• Consider question order and flow</li>
                      <li>• Test templates with sample patients before wide deployment</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              type="button"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              type="button"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              disabled={isCreating || !title.trim() || questions.length === 0}
            >
              {isCreating ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
