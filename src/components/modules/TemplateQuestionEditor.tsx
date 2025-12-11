'use client';

import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export type QuestionType = 'open_text' | 'multiple_choice' | 'scale' | 'emotion';
export type ReflectionQuestionType = 'open_text' | 'scale' | 'emotion'; // No multiple_choice

export type TemplateQuestion = {
  id: string;
  questionText: string;
  questionType: QuestionType;
  options?: string[]; // For multiple_choice (survey only)
  scaleMin?: number; // For scale
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
};

type TemplateQuestionEditorProps = {
  questions: TemplateQuestion[];
  onChange: (questions: TemplateQuestion[]) => void;
  templateType: 'reflection' | 'survey';
};

export function TemplateQuestionEditor({
  questions,
  onChange,
  templateType,
}: TemplateQuestionEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  // Get available question types based on template type
  const getAvailableQuestionTypes = (): Array<{ value: QuestionType; label: string }> => {
    const baseTypes = [
      { value: 'open_text' as QuestionType, label: 'Open Text' },
      { value: 'scale' as QuestionType, label: 'Scale' },
      { value: 'emotion' as QuestionType, label: 'Emotion' },
    ];

    // Only survey templates can use multiple choice
    if (templateType === 'survey') {
      return [
        ...baseTypes.slice(0, 1),
        { value: 'multiple_choice' as QuestionType, label: 'Multiple Choice' },
        ...baseTypes.slice(1),
      ];
    }

    return baseTypes;
  };

  const addQuestion = () => {
    const newQuestion: TemplateQuestion = {
      id: `q-${Date.now()}`,
      questionText: '',
      questionType: 'open_text',
    };
    onChange([...questions, newQuestion]);
    setEditingId(newQuestion.id);
  };

  const updateQuestion = (id: string, updates: Partial<TemplateQuestion>) => {
    onChange(
      questions.map(q =>
        q.id === id ? { ...q, ...updates } : q,
      ),
    );
  };

  const deleteQuestion = (id: string) => {
    onChange(questions.filter(q => q.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) {
      return;
    }

    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex]!, newQuestions[index]!];
    onChange(newQuestions);
  };

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const options = question.options || [];
    updateQuestion(questionId, {
      options: [...options, ''],
    });
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !question.options) return;

    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    updateQuestion(questionId, { options: newOptions });
  };

  const deleteOption = (questionId: string, optionIndex: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !question.options) return;

    const newOptions = question.options.filter((_, i) => i !== optionIndex);
    updateQuestion(questionId, { options: newOptions });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {templateType === 'reflection' ? 'Reflection Questions' : 'Survey Questions'}
        </label>
        <Button variant="secondary" size="sm" onClick={addQuestion}>
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="mb-4 text-sm text-gray-500">
            No questions added yet
          </p>
          <Button variant="secondary" size="sm" onClick={addQuestion}>
            <Plus className="mr-2 h-4 w-4" />
            Add First Question
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="mb-3 flex items-start gap-3">
                <div className="flex flex-col gap-1 pt-2">
                  <button
                    type="button"
                    onClick={() => moveQuestion(index, 'up')}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-medium text-gray-500">
                    {index + 1}
                  </span>
                </div>

                <div className="flex-1 space-y-3">
                  {/* Question Text */}
                  <div>
                    <Input
                      value={question.questionText}
                      onChange={e => updateQuestion(question.id, { questionText: e.target.value })}
                      placeholder="Enter question text..."
                      maxLength={500}
                      helperText="5-500 characters required"
                      className="w-full"
                    />
                  </div>

                  {/* Question Type */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Question Type
                      </label>
                      <select
                        value={question.questionType}
                        onChange={(e) => {
                          const newType = e.target.value as QuestionType;
                          const updates: Partial<TemplateQuestion> = { questionType: newType };

                          // Reset type-specific fields
                          if (newType === 'multiple_choice' && !question.options) {
                            updates.options = [''];
                          } else if (newType === 'scale') {
                            updates.scaleMin = updates.scaleMin ?? 1;
                            updates.scaleMax = updates.scaleMax ?? 10;
                          }

                          updateQuestion(question.id, updates);
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                      >
                        {getAvailableQuestionTypes().map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Multiple Choice Options - Only for survey templates */}
                  {question.questionType === 'multiple_choice' && templateType === 'survey' && (
                    <div className="rounded border border-gray-200 bg-gray-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-700">
                          Answer Options
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addOption(question.id)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add Option
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {(question.options || []).map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {optIndex + 1}
                              .
                            </span>
                            <Input
                              value={option}
                              onChange={e => updateOption(question.id, optIndex, e.target.value)}
                              placeholder="Option text..."
                              maxLength={200}
                              className="flex-1"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteOption(question.id, optIndex)}
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scale Settings */}
                  {question.questionType === 'scale' && (
                    <div className="grid grid-cols-2 gap-3 rounded border border-gray-200 bg-gray-50 p-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          Min Value
                        </label>
                        <Input
                          type="number"
                          value={question.scaleMin ?? 1}
                          onChange={e =>
                            updateQuestion(question.id, {
                              scaleMin: Number.parseInt(e.target.value),
                            })}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          Max Value
                        </label>
                        <Input
                          type="number"
                          value={question.scaleMax ?? 10}
                          onChange={e =>
                            updateQuestion(question.id, {
                              scaleMax: Number.parseInt(e.target.value),
                            })}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          Min Label (optional)
                        </label>
                        <Input
                          value={question.scaleMinLabel || ''}
                          onChange={e =>
                            updateQuestion(question.id, { scaleMinLabel: e.target.value })}
                          placeholder="e.g., Not at all"
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          Max Label (optional)
                        </label>
                        <Input
                          value={question.scaleMaxLabel || ''}
                          onChange={e =>
                            updateQuestion(question.id, { scaleMaxLabel: e.target.value })}
                          placeholder="e.g., Extremely"
                          maxLength={100}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteQuestion(question.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {questions.length > 0 && (
        <p className="text-xs text-gray-500">
          {questions.length}
          {' '}
          question
          {questions.length !== 1 ? 's' : ''}
          {' '}
          in this
          {templateType}
          {' '}
          set
        </p>
      )}
    </div>
  );
}
