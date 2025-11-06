/**
 * Org Admin Templates Page
 * Approve and manage template submissions
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FileText, Check, X, Clock, Plus, Trash2 } from 'lucide-react';

interface Template {
  id: string;
  title: string;
  type: 'survey' | 'reflection';
  category: string;
  createdBy: string;
  createdAt: string;
  status: 'pending_approval' | 'active' | 'rejected';
  questionCount: number;
}

export default function TemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [templateType, setTemplateType] = useState<'reflection' | 'survey'>('reflection');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateCategory, setTemplateCategory] = useState('');
  const [questions, setQuestions] = useState<string[]>(['']);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user, activeTab]);

  const fetchTemplates = async () => {
    try {
      const idToken = await user?.getIdToken();
      const endpoint = activeTab === 'pending'
        ? '/api/templates/pending'
        : '/api/templates/reflections'; // Would need status filter

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (templateId: string, type: string) => {
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/templates/${type}/${templateId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        fetchTemplates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (templateId: string, type: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/templates/${type}/${templateId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        fetchTemplates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTemplate = async () => {
    setCreateError(null);

    // Validation
    if (!templateTitle.trim()) {
      setCreateError('Template title is required');
      return;
    }
    if (!templateCategory.trim()) {
      setCreateError('Category is required');
      return;
    }
    const validQuestions = questions.filter(q => q.trim() !== '');
    if (validQuestions.length === 0) {
      setCreateError('At least one question is required');
      return;
    }

    try {
      setCreating(true);
      const idToken = await user?.getIdToken();

      const endpoint = templateType === 'reflection'
        ? '/api/templates/reflections'
        : '/api/templates/surveys';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: templateTitle,
          category: templateCategory,
          questions: validQuestions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create template');
      }

      // Success - close modal and refresh list
      setShowCreateModal(false);
      resetForm();
      fetchTemplates();
    } catch (err) {
      console.error(err);
      setCreateError(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setTemplateTitle('');
    setTemplateCategory('');
    setQuestions(['']);
    setTemplateType('reflection');
    setCreateError(null);
  };

  const addQuestion = () => {
    setQuestions([...questions, '']);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, value: string) => {
    const updated = [...questions];
    updated[index] = value;
    setQuestions(updated);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Template Library</h1>
          <p className="mt-2 text-gray-600">
            Create and manage templates for your organization
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === 'pending'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Pending Approval
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === 'approved'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === 'rejected'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Rejected
          </button>
        </nav>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            No {activeTab} templates
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-6"
            >
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                  <FileText className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {template.title}
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                      {template.type === 'survey' ? 'Survey' : 'Reflection'}
                    </span>
                    <span>{template.category}</span>
                    <span>{template.questionCount} questions</span>
                    <span className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {activeTab === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleReject(template.id, template.type)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleApprove(template.id, template.type)}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900">Create New Template</h2>
            <p className="mt-1 text-sm text-gray-600">
              Create a {templateType} template for your organization
            </p>

            {createError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{createError}</p>
              </div>
            )}

            <div className="mt-6 space-y-4">
              {/* Template Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Template Type
                </label>
                <div className="mt-2 flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="reflection"
                      checked={templateType === 'reflection'}
                      onChange={(e) => setTemplateType(e.target.value as 'reflection' | 'survey')}
                      className="mr-2"
                    />
                    <span className="text-sm">Reflection Questions</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="survey"
                      checked={templateType === 'survey'}
                      onChange={(e) => setTemplateType(e.target.value as 'reflection' | 'survey')}
                      className="mr-2"
                    />
                    <span className="text-sm">Survey</span>
                  </label>
                </div>
              </div>

              {/* Template Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Template Title
                </label>
                <Input
                  type="text"
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  placeholder="e.g., Post-Session Reflection"
                  className="mt-1"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <Input
                  type="text"
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  placeholder="e.g., General, Anxiety, Depression"
                  className="mt-1"
                  required
                />
              </div>

              {/* Questions */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Questions
                </label>
                <div className="mt-2 space-y-2">
                  {questions.map((question, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="text"
                        value={question}
                        onChange={(e) => updateQuestion(index, e.target.value)}
                        placeholder={`Question ${index + 1}`}
                        className="flex-1"
                      />
                      {questions.length > 1 && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => removeQuestion(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addQuestion}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateTemplate}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>Create Template</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
