'use client';

/**
 * Generate JSON with AI Modal
 * Helps users generate JSON output structure using AI
 */

import type { SchemaType } from '@/config/PromptJSONTemplates';
import { PROMPT_JSON_TEMPLATES } from '@/config/PromptJSONTemplates';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedPost } from '@/utils/AuthenticatedFetch';
import { AlertCircle, Loader2, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

interface GenerateJSONWithAIProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (jsonString: string) => void;
}

export function GenerateJSONWithAI({ isOpen, onClose, onGenerated }: GenerateJSONWithAIProps) {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [schemaType, setSchemaType] = useState<SchemaType | ''>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await authenticatedPost('/api/ai/generate-prompt-json', user, {
        description: description.trim(),
        schemaType: schemaType || undefined,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate JSON');
      }

      const data = await response.json();

      // Insert generated JSON
      onGenerated(data.json);

      // Close modal
      onClose();

      // Reset form
      setDescription('');
      setSchemaType('');
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate JSON');
    }
    finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      onClose();
      setDescription('');
      setSchemaType('');
      setError(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative min-h-screen px-4 py-8">
        <div className="relative mx-auto max-w-2xl rounded-xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 p-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Generate JSON with AI</h2>
                <p className="text-sm text-gray-500">Describe what you want the prompt to output</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              type="button"
              disabled={isGenerating}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6">
            <div className="space-y-4">
              {/* Schema Type Selector (Optional) */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Output Type (Optional)
                </label>
                <select
                  value={schemaType}
                  onChange={e => setSchemaType(e.target.value as SchemaType | '')}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  disabled={isGenerating}
                >
                  <option value="">Auto-detect (recommended)</option>
                  {PROMPT_JSON_TEMPLATES.map(template => (
                    <option key={template.schemaType} value={template.schemaType}>
                      {template.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Leave as "Auto-detect" and AI will choose the best output type
                </p>
              </div>

              {/* Description Input */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Description
                  {' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={8}
                  placeholder="Example: Generate 3 image suggestions that visualize the patient's journey from struggle to empowerment, with photorealistic style and therapeutic context"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  disabled={isGenerating}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Describe what you want the AI to generate. Be specific about content, style, and therapeutic purpose.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Tips */}
              <div className="rounded-lg bg-indigo-50 p-4">
                <div className="text-sm font-medium text-indigo-900">💡 Tips for better results:</div>
                <ul className="mt-2 space-y-1 text-sm text-indigo-700">
                  <li>• Be specific about the number of items (e.g., "3 images")</li>
                  <li>• Mention the therapeutic context or purpose</li>
                  <li>• Describe the style, mood, or format you want</li>
                  <li>• Include key themes or quotes if relevant</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button
              onClick={handleClose}
              type="button"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={isGenerating}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              type="button"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isGenerating || !description.trim()}
            >
              {isGenerating
                ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  )
                : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate JSON
                    </>
                  )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
