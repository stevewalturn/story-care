'use client';

/**
 * Copy Template Modal
 * Allows org admins to copy system templates to their organization
 */

import type { TreatmentModule } from '@/models/Schema';
import { Copy, X } from 'lucide-react';
import { useState } from 'react';
import { ModuleBadge } from '@/components/modules/ModuleBadge';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type CopyTemplateModalProps = {
  template: TreatmentModule;
  onClose: () => void;
  onCopied: () => void;
};

export function CopyTemplateModal({ template, onClose, onCopied }: CopyTemplateModalProps) {
  const { user } = useAuth();
  const [customName, setCustomName] = useState(template.name);
  const [isCopying, setIsCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = async () => {
    setIsCopying(true);
    setError(null);

    try {
      const response = await authenticatedFetch(
        '/api/org-admin/modules',
        user,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            copyFromTemplateId: template.id,
            name: customName, // Allow custom name on copy
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to copy template');
      }

      onCopied();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsCopying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Copy Template to Organization</h2>
            <p className="mt-1 text-sm text-gray-600">
              Create a customizable copy of this template for your organization
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            type="button"
            disabled={isCopying}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Template Info */}
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <ModuleBadge domain={template.domain} moduleName={template.name} />
              <span className="text-xs font-medium text-gray-500">System Template</span>
            </div>
            <h3 className="mb-1 text-lg font-semibold text-gray-900">{template.name}</h3>
            <p className="text-sm text-gray-600">{template.description}</p>
          </div>

          {/* Custom Name Input */}
          <div className="mb-6">
            <label htmlFor="moduleName" className="mb-2 block text-sm font-medium text-gray-700">
              Module Name (you can customize this)
            </label>
            <input
              id="moduleName"
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              placeholder="Enter module name..."
              disabled={isCopying}
            />
            <p className="mt-1.5 text-xs text-gray-500">
              The template content will be copied. You can edit it after copying.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* What Happens Next */}
          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-gray-900">What happens next:</h4>
            <ul className="space-y-1.5 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>A new module will be created in your organization</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>All content, questions, and settings will be copied</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>You can edit and customize the module as needed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600">✓</span>
                <span>Changes won't affect the original template</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            type="button"
            disabled={isCopying}
          >
            Cancel
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={isCopying || !customName.trim()}
          >
            {isCopying ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Copying...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy to Organization
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
