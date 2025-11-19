'use client';

/**
 * View/Edit Prompt Modal
 * Modal for viewing and editing AI prompt details
 */

import type { PromptTemplate } from '@/models/Schema';
import { Save, Sparkles, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedDelete, authenticatedPut } from '@/utils/AuthenticatedFetch';

type ViewEditPromptModalProps = {
  prompt: PromptTemplate;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
  apiEndpoint: string; // e.g., '/api/super-admin/prompts' or '/api/org-admin/prompts'
  canEdit?: boolean;
  canDelete?: boolean;
};

const categoryOptions = [
  { value: 'analysis', label: 'Analysis' },
  { value: 'creative', label: 'Creative' },
  { value: 'extraction', label: 'Extraction' },
  { value: 'reflection', label: 'Reflection' },
];

const iconOptions = [
  { value: 'sparkles', label: '✨ Sparkles' },
  { value: 'target', label: '🎯 Target' },
  { value: 'lightbulb', label: '💡 Lightbulb' },
  { value: 'brain', label: '🧠 Brain' },
  { value: 'heart', label: '❤️ Heart' },
  { value: 'star', label: '⭐ Star' },
];

export function ViewEditPromptModal({
  prompt,
  onClose,
  onSaved,
  onDeleted,
  apiEndpoint,
  canEdit = false,
  canDelete = false,
}: ViewEditPromptModalProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [name, setName] = useState(prompt.name);
  const [promptText, setPromptText] = useState(prompt.promptText);
  const [description, setDescription] = useState(prompt.description || '');
  const [category, setCategory] = useState(prompt.category);
  const [icon, setIcon] = useState(prompt.icon || 'sparkles');
  const [outputType, setOutputType] = useState(prompt.outputType || 'text');

  const handleSave = async () => {
    if (!name.trim() || !promptText.trim() || !category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    const toastId = toast.loading('Saving prompt...');

    try {
      const response = await authenticatedPut(
        `${apiEndpoint}/${prompt.id}`,
        user,
        {
          name: name.trim(),
          promptText: promptText.trim(),
          description: description.trim() || null,
          category,
          icon,
          outputType,
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save prompt');
      }

      toast.success('Prompt saved successfully!', { id: toastId });
      setIsEditing(false);
      onSaved();
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save prompt',
        { id: toastId },
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    const toastId = toast.loading('Deleting prompt...');

    try {
      const response = await authenticatedDelete(
        `${apiEndpoint}/${prompt.id}`,
        user,
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete prompt');
      }

      toast.success('Prompt deleted successfully!', { id: toastId });
      onDeleted?.();
      onClose();
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete prompt',
        { id: toastId },
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen px-4 py-8">
        <div className="relative mx-auto max-w-2xl rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {isEditing ? 'Edit Prompt' : 'View Prompt'}
                </h2>
                <p className="text-sm text-gray-500">
                  {prompt.scope === 'system' ? 'System Prompt' : prompt.scope === 'organization' ? 'Organization Prompt' : 'Private Prompt'}
                </p>
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
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Prompt Name
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={!isEditing}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-600"
                  placeholder="e.g., Self-Resilience Analysis"
                />
              </div>

              {/* Category and Icon */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Category
                    {' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    disabled={!isEditing}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-600"
                  >
                    {categoryOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Icon
                  </label>
                  <select
                    value={icon}
                    onChange={e => setIcon(e.target.value)}
                    disabled={!isEditing}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-600"
                  >
                    {iconOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Output Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Output Type
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  value={outputType}
                  onChange={e => setOutputType(e.target.value)}
                  disabled={!isEditing}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-600"
                >
                  <option value="text">📝 Text - Returns formatted text response</option>
                  <option value="image">🖼️ Image - Generates image description/prompt</option>
                  <option value="scene">🎬 Scene - Generates scene visualization/video prompt</option>
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
                  disabled={!isEditing}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-600"
                  placeholder="Brief description of what this prompt does"
                />
              </div>

              {/* Prompt Text */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Prompt Text
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={promptText}
                  onChange={e => setPromptText(e.target.value)}
                  disabled={!isEditing}
                  rows={12}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none disabled:bg-gray-50 disabled:text-gray-600"
                  placeholder="Enter the AI prompt text here..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use variables like
                  {' '}
                  {'{{transcript}}'}
                  ,
                  {' '}
                  {'{{patientName}}'}
                  , etc. in your prompt
                </p>
              </div>

              {/* Metadata */}
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Scope:</span>
                    <span className="ml-2 font-medium text-gray-900 capitalize">
                      {prompt.scope}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Use Count:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {prompt.useCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {new Date(prompt.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Updated:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {new Date(prompt.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
            <div>
              {canDelete && !isEditing && (
                <Button
                  variant="ghost"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset form
                      setName(prompt.name);
                      setPromptText(prompt.promptText);
                      setDescription(prompt.description || '');
                      setCategory(prompt.category);
                      setIcon(prompt.icon || 'sparkles');
                      setOutputType(prompt.outputType || 'text');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={onClose}>
                    Close
                  </Button>
                  {canEdit && (
                    <Button variant="primary" onClick={() => setIsEditing(true)}>
                      Edit Prompt
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
