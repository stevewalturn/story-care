'use client';

/**
 * Create Prompt Modal Component
 * Modal for creating new AI prompts with JSON output structure
 */

import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';
import { PromptJSONEditor } from './PromptJSONEditor';
import { PromptPreviewPanel } from './PromptPreviewPanel';
import { GenerateJSONWithAI } from './GenerateJSONWithAI';

type PromptScope = 'system' | 'organization' | 'private';
type PromptCategory = 'analysis' | 'creative' | 'extraction' | 'reflection';

type CreatePromptModalProps = {
  scope: PromptScope;
  onClose: () => void;
  onCreated: () => void;
};

export function CreatePromptModal({ scope, onClose, onCreated }: CreatePromptModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PromptCategory>('analysis');
  const [description, setDescription] = useState('');
  const [promptText, setPromptText] = useState('');
  const [jsonOutputString, setJsonOutputString] = useState('');
  const [isJsonValid, setIsJsonValid] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [showAIModal, setShowAIModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get scope-specific labels
  const getScopeLabel = () => {
    switch (scope) {
      case 'system':
        return 'System Prompt';
      case 'organization':
        return 'Organization Prompt';
      case 'private':
        return 'Private Prompt';
    }
  };

  const getApiEndpoint = () => {
    switch (scope) {
      case 'system':
        return '/api/super-admin/prompts';
      case 'organization':
        return '/api/org-admin/prompts';
      case 'private':
        return '/api/therapist/prompts';
    }
  };

  const handleCreate = async () => {
    // Validation
    if (!name.trim()) {
      setError('Please enter a prompt name');
      return;
    }

    if (!promptText.trim()) {
      setError('Please enter prompt instructions');
      return;
    }

    if (promptText.trim().length < 50) {
      setError('Prompt instructions must be at least 50 characters');
      return;
    }

    if (!jsonOutputString.trim()) {
      setError('Please define the JSON output structure');
      return;
    }

    if (!isJsonValid) {
      setError('JSON output structure has validation errors. Please fix them before creating.');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Parse JSON to store as object
      const jsonSchema = JSON.parse(jsonOutputString);

      const requestBody: any = {
        name: name.trim(),
        promptText: promptText.trim(),
        description: description.trim() || undefined,
        category,
        icon: 'sparkles',
        outputType: 'json', // Always JSON
        jsonSchema, // Store parsed JSON
      };

      const response = await authenticatedFetch(getApiEndpoint(), user, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create prompt');
      }

      onCreated();
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        {/* Modal */}
        <div className="relative min-h-screen px-4 py-8">
          <div className="relative mx-auto max-w-6xl rounded-xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Create
                  {' '}
                  {getScopeLabel()}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {scope === 'system' && 'Create a prompt available to all organizations'}
                  {scope === 'organization' && 'Create a prompt for your organization'}
                  {scope === 'private' && 'Create a personal prompt for your use'}
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
                {/* Name */}
                <div>
                  <label htmlFor="promptName" className="mb-2 block text-sm font-medium text-gray-700">
                    Prompt Name
                    {' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="promptName"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                    placeholder="e.g., Self-Resilience Analysis"
                    disabled={isCreating}
                    maxLength={255}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    A clear, descriptive name for this prompt
                  </p>
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
                    onChange={e => setCategory(e.target.value as PromptCategory)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                    disabled={isCreating}
                  >
                    <option value="analysis">🎯 Analysis - Therapeutic analysis and insights</option>
                    <option value="creative">✨ Creative - Visual media and content generation</option>
                    <option value="extraction">📝 Extraction - Pull specific elements from text</option>
                    <option value="reflection">💭 Reflection - Patient-facing questions</option>
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
                    placeholder="What does this prompt do and when to use it..."
                    disabled={isCreating}
                    maxLength={500}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Help others understand when and how to use this prompt
                  </p>
                </div>

                {/* Prompt Text */}
                <div>
                  <label htmlFor="promptText" className="mb-2 block text-sm font-medium text-gray-700">
                    Prompt Instructions
                    {' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="promptText"
                    value={promptText}
                    onChange={e => setPromptText(e.target.value)}
                    rows={6}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 font-mono text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                    placeholder="You are a trauma-informed therapist analyzing a session transcript...&#10;&#10;Task: Analyze the selected text and identify moments of resilience and therapeutic insights.&#10;&#10;Format your response as JSON..."
                    disabled={isCreating}
                    maxLength={5000}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    The actual AI instruction (minimum 50 characters, maximum 5000)
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {promptText.length}
                    /5000 characters
                  </p>
                </div>

                {/* JSON Output Structure with Tabs */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    JSON Output Structure
                    {' '}
                    <span className="text-red-500">*</span>
                  </label>

                  {/* Tabs */}
                  <div className="flex border-b border-gray-200">
                    <button
                      type="button"
                      onClick={() => setActiveTab('edit')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'edit'
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Edit JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('preview')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'preview'
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Preview
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="mt-4">
                    {activeTab === 'edit'
                      ? (
                          <PromptJSONEditor
                            value={jsonOutputString}
                            onChange={setJsonOutputString}
                            onValidationChange={setIsJsonValid}
                            onGenerateWithAI={() => setShowAIModal(true)}
                          />
                        )
                      : (
                          <div className="h-[600px] overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                            <PromptPreviewPanel jsonString={jsonOutputString} />
                          </div>
                        )}
                  </div>
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
                    <Sparkles className="h-5 w-5 flex-shrink-0 text-indigo-600" />
                    <div>
                      <h4 className="text-sm font-semibold text-indigo-900">Writing Effective Prompts</h4>
                      <ul className="mt-2 space-y-1 text-xs text-indigo-700">
                        <li>• Be specific about the task and desired JSON output structure</li>
                        <li>• Include context about the therapeutic approach</li>
                        <li>• Use "Generate with AI" to quickly create JSON templates</li>
                        <li>• Preview how the output will render in the chat</li>
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
                disabled={isCreating || !name.trim() || !promptText.trim() || !jsonOutputString.trim() || !isJsonValid}
              >
                {isCreating ? 'Creating...' : 'Create Prompt'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Generate JSON with AI Modal */}
      <GenerateJSONWithAI
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerated={(json) => {
          setJsonOutputString(json);
          setActiveTab('edit'); // Switch to edit tab to see generated JSON
        }}
      />
    </>
  );
}
