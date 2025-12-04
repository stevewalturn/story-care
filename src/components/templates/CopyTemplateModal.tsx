'use client';

/**
 * Copy Template Modal Component
 * Allows copying organization or system templates to private templates
 */

import { Copy, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type Template = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  type: 'reflection' | 'survey';
  scope: string;
  questions: any[];
  useCount: number;
  createdAt: string;
  updatedAt: string;
};

type CopyTemplateModalProps = {
  template: Template;
  onClose: () => void;
  onCopied: () => void;
};

export function CopyTemplateModal({ template, onClose, onCopied }: CopyTemplateModalProps) {
  const { user, dbUser } = useAuth();
  const [customName, setCustomName] = useState(`${template.title} (Copy)`);
  const [customDescription, setCustomDescription] = useState(template.description || '');
  const [isCopying, setIsCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async () => {
    if (!customName.trim()) {
      setError('Please enter a template name');
      return;
    }

    setIsCopying(true);
    setError(null);

    try {
      const response = await authenticatedFetch('/api/therapist/templates', user, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: template.type,
          title: customName.trim(),
          description: customDescription.trim() || undefined,
          category: template.category,
          questions: template.questions,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to copy template');
      }

      toast.success('Template copied successfully');
      onCopied();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsCopying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen px-4 py-8">
        <div className="relative mx-auto max-w-lg rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Copy Template</h2>
              <p className="mt-1 text-sm text-gray-600">
                Create a personal copy of this
                {' '}
                {template.scope === 'system' ? 'system' : 'organization'}
                {' '}
                template
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              type="button"
              disabled={isCopying}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              {/* Original Template Info */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="mb-1 text-xs font-medium text-gray-500">Copying from:</p>
                <p className="text-sm font-medium text-gray-900">{template.title}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 ${
                      template.type === 'reflection'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {template.type}
                  </span>
                  <span>•</span>
                  <span>
                    {template.questions?.length || 0}
                    {' '}
                    questions
                  </span>
                </div>
              </div>

              {/* New Template Name */}
              <div>
                <label htmlFor="customName" className="mb-2 block text-sm font-medium text-gray-700">
                  New Template Name
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="customName"
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  placeholder="Enter a name for your copy..."
                  disabled={isCopying}
                  maxLength={255}
                />
              </div>

              {/* Custom Description */}
              <div>
                <label htmlFor="customDescription" className="mb-2 block text-sm font-medium text-gray-700">
                  Description (Optional)
                </label>
                <textarea
                  id="customDescription"
                  value={customDescription}
                  onChange={e => setCustomDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                  placeholder="Add a custom description..."
                  disabled={isCopying}
                  maxLength={500}
                />
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
                  <Copy className="h-5 w-5 flex-shrink-0 text-indigo-600" />
                  <div>
                    <h4 className="text-sm font-semibold text-indigo-900">About Copying</h4>
                    <p className="mt-1 text-xs text-indigo-700">
                      {dbUser?.role === 'org_admin'
                        ? 'This will create an organization copy that all therapists in your organization can use. All questions and settings will be copied. Changes to your copy won\'t affect the original template.'
                        : 'This will create a private copy that only you can use and edit. All questions and settings will be copied. Changes to your copy won\'t affect the original template.'}
                    </p>
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
              disabled={isCopying}
            >
              Cancel
            </button>
            <button
              onClick={handleCopy}
              type="button"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              disabled={isCopying || !customName.trim()}
            >
              <Copy className="h-4 w-4" />
              {isCopying ? 'Copying...' : 'Copy Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
