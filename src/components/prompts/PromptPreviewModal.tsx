'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

import {
  getCategoryClasses,
  getPromptIcon,
  getSchemaTypeLabel,
  OUTPUT_TYPES,
} from '@/constants/PromptConstants';
import type { ModuleAiPrompt } from '@/models/Schema';

interface PromptPreviewModalProps {
  prompt: ModuleAiPrompt;
  isOpen: boolean;
  onClose: () => void;
}

export function PromptPreviewModal({ prompt, isOpen, onClose }: PromptPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'schema'>('details');

  if (!isOpen) return null;

  const Icon = getPromptIcon(prompt.icon);
  const categoryClasses = getCategoryClasses(prompt.category || 'analysis');
  const schemaTypeLabel = getSchemaTypeLabel(prompt.jsonSchema);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg ${categoryClasses.bg} p-2`}>
              <Icon className={`h-5 w-5 ${categoryClasses.text}`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{prompt.name}</h2>
              <div className="mt-1 flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${categoryClasses.badge}`}>
                  {prompt.category}
                </span>
                {prompt.outputType && (
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                    {OUTPUT_TYPES[prompt.outputType as keyof typeof OUTPUT_TYPES]?.icon}{' '}
                    {OUTPUT_TYPES[prompt.outputType as keyof typeof OUTPUT_TYPES]?.label || prompt.outputType}
                  </span>
                )}
                {schemaTypeLabel && (
                  <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    {schemaTypeLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-white px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Details
            </button>
            {prompt.outputType === 'json' && prompt.jsonSchema ? (
              <button
                onClick={() => setActiveTab('schema')}
                className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'schema'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                JSON Schema
              </button>
            ) : null}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-200px)] overflow-y-auto px-6 py-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Description */}
              {prompt.description && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">Description</h3>
                  <p className="text-sm text-gray-600">{prompt.description}</p>
                </div>
              )}

              {/* Prompt Text */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-700">Prompt Text</h3>
                <div className="rounded-lg bg-gray-50 p-4">
                  <pre className="whitespace-pre-wrap font-mono text-xs text-gray-800">
                    {prompt.promptText}
                  </pre>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div>
                  <p className="text-xs font-medium text-gray-500">Category</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{prompt.category}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Output Type</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {OUTPUT_TYPES[prompt.outputType as keyof typeof OUTPUT_TYPES]?.label || prompt.outputType}
                  </p>
                </div>
                {prompt.scope && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Scope</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{prompt.scope}</p>
                  </div>
                )}
                {prompt.useCount !== undefined && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Use Count</p>
                    <p className="mt-1 text-sm font-medium text-gray-900">{prompt.useCount}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'schema' && prompt.jsonSchema ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">JSON Schema</h3>
              <div className="rounded-lg bg-gray-50 p-4">
                <pre className="whitespace-pre-wrap font-mono text-xs text-gray-800">
                  {JSON.stringify(prompt.jsonSchema, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(prompt.promptText);
                // Could add a toast notification here
              }}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Copy Prompt Text
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
