'use client';

import type { TreatmentModule } from '@/models/Schema';
import {
  Activity,
  Bookmark,
  Code2,
  FileText,
  Image,
  Info,
  Music,
  Sparkles,
  Target,
  Users,
  Video,
} from 'lucide-react';
import { useState } from 'react';
import { ModuleBadge } from '@/components/modules/ModuleBadge';

export type AIPromptOption = {
  id: string;
  name: string;
  promptText: string; // DEPRECATED: Use systemPrompt instead (kept for backward compatibility)
  systemPrompt?: string; // Hidden AI instructions (detailed therapeutic prompts)
  userPrompt?: string | null; // Optional user-facing prompt text
  description: string | null;
  category: string;
  icon: string;
  sortOrder?: number;
  outputType?: 'text' | 'json'; // Output type for filtering
  schemaType?: string; // JSON schema type if applicable
};

type AnalyzeSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  onAnalyze: (promptId: string, promptText: string, selectedText: string) => void;
  aiPrompts: AIPromptOption[]; // Module prompts (shown first)
  libraryPrompts: AIPromptOption[]; // All other available prompts
  moduleAiPromptText: string | null; // Module's inline prompt text
  assignedModule?: TreatmentModule | null;
  onAssignModule: () => void;
  selectedTextSource?: 'transcript' | 'ai';
  onSaveAsQuote?: () => void;
};

// Icon mapping helper
const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, any> = {
    'target': Target,
    'sparkles': Sparkles,
    'bookmark': Bookmark,
    'info': Info,
    'video': Video,
    'image': Image,
    'music': Music,
    'activity': Activity,
    'users': Users,
    'file-text': FileText,
  };
  return iconMap[iconName] || Sparkles;
};

// Icon color mapping by category
const getIconColor = (category: string) => {
  const colorMap: Record<string, string> = {
    analysis: 'text-blue-500',
    creative: 'text-purple-500',
    extraction: 'text-green-500',
    reflection: 'text-purple-500',
  };
  return colorMap[category] || 'text-gray-500';
};

// Badge color mapping by category
const getBadgeColor = (category: string) => {
  const colorMap: Record<string, string> = {
    analysis: 'bg-blue-100 text-blue-700',
    creative: 'bg-purple-100 text-purple-700',
    extraction: 'bg-green-100 text-green-700',
    reflection: 'bg-purple-100 text-purple-700',
  };
  return colorMap[category] || 'bg-gray-100 text-gray-600';
};

export function AnalyzeSelectionModal({
  isOpen,
  onClose,
  selectedText,
  onAnalyze,
  aiPrompts,
  libraryPrompts,
  moduleAiPromptText,
  assignedModule,
  onAssignModule,
  selectedTextSource = 'transcript',
  onSaveAsQuote,
}: AnalyzeSelectionModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAllPrompts, setShowAllPrompts] = useState(false);
  const [outputTypeFilter, setOutputTypeFilter] = useState<'all' | 'text' | 'json'>('all');

  // Filter prompts based on output type
  const filterByOutputType = (prompts: AIPromptOption[]) => {
    if (outputTypeFilter === 'all') return prompts;

    return prompts.filter((prompt) => {
      if (!prompt.outputType) return outputTypeFilter === 'text'; // Default to text if not specified
      return prompt.outputType === outputTypeFilter;
    });
  };

  const filteredAiPrompts = filterByOutputType(aiPrompts);
  const filteredLibraryPrompts = filterByOutputType(libraryPrompts);

  if (!isOpen) {
    return null;
  }

  const handleAnalyze = (promptId: string, prompt: AIPromptOption) => {
    // Use systemPrompt if available, fallback to promptText for backward compatibility
    const systemPrompt = prompt.systemPrompt || prompt.promptText;

    // Check if this is a module-linked prompt
    const isModulePrompt = aiPrompts.some(p => p.id === promptId);

    // Combine module's inline prompt with system prompt if it's a module prompt
    let finalPromptText = systemPrompt;
    if (isModulePrompt && moduleAiPromptText) {
      // Prepend module's inline prompt for module-linked prompts
      finalPromptText = `${moduleAiPromptText}\n\n---\n\n${systemPrompt}`;
    }

    onAnalyze(promptId, finalPromptText, selectedText);
    onClose();
  };

  // Auto-open Assign Module modal if no module AND no library prompts available (after filtering)
  if (filteredAiPrompts.length === 0 && filteredLibraryPrompts.length === 0 && outputTypeFilter === 'all') {
    // Trigger the Assign Module modal and close this one
    onAssignModule();
    onClose();
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Analyze Selection</h2>
              <p className="mt-1 text-sm text-gray-500">
                Choose a prompt to run on the selected text. The AI will use the full transcript for context.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 transition-colors hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Output Type Filter */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">Output Type:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setOutputTypeFilter('all')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  outputTypeFilter === 'all'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setOutputTypeFilter('text')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  outputTypeFilter === 'text'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Text
              </button>
              <button
                onClick={() => setOutputTypeFilter('json')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  outputTypeFilter === 'json'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                JSON
              </button>
            </div>
            {outputTypeFilter !== 'all' && (
              <span className="ml-2 text-xs text-gray-500">
                (
                {filteredAiPrompts.length + filteredLibraryPrompts.length}
                {' '}
                prompts)
              </span>
            )}
          </div>
        </div>

        {/* Options */}
        <div className="max-h-[60vh] space-y-4 overflow-y-auto p-6">
          {/* Module Prompts Section */}
          {filteredAiPrompts.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    Prompts for
                    {' '}
                    {assignedModule?.name || 'Module'}
                    {' '}
                    Module
                    {' '}
                    (
                    {filteredAiPrompts.length}
                    )
                  </span>
                  {assignedModule && (
                    <ModuleBadge
                      moduleName={assignedModule.name}
                      domain={assignedModule.domain as any}
                      size="sm"
                      showIcon={false}
                    />
                  )}
                </div>
                {moduleAiPromptText && (
                  <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                    <Sparkles className="h-3 w-3" />
                    + Module Context
                  </span>
                )}
              </div>
              <p className="mb-3 text-xs text-gray-600">
                {moduleAiPromptText
                  ? 'These prompts are specifically designed for this module and include its core therapeutic context for consistent analysis.'
                  : 'These prompts are specifically linked to this treatment module for targeted therapeutic analysis.'}
              </p>
              <div className="space-y-3">
                {filteredAiPrompts.map((prompt) => {
                  const IconComponent = getIconComponent(prompt.icon);
                  const iconColorClass = getIconColor(prompt.category);
                  const badgeColorClass = getBadgeColor(prompt.category);
                  const isJsonOutput = prompt.outputType === 'json';

                  return (
                    <button
                      key={prompt.id}
                      onClick={() => handleAnalyze(prompt.id, prompt)}
                      onMouseEnter={() => setSelectedOption(prompt.id)}
                      onMouseLeave={() => setSelectedOption(null)}
                      className={`w-full rounded-lg border-2 text-left transition-all ${
                        selectedOption === prompt.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`mt-0.5 flex-shrink-0 ${iconColorClass}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-semibold text-gray-900">{prompt.name}</h3>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeColorClass}`}>
                                {prompt.category}
                              </span>
                              {isJsonOutput && (
                                <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                                  <Code2 className="h-3 w-3" />
                                  JSON
                                </span>
                              )}
                              {moduleAiPromptText && (
                                <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-600">
                                  + Context
                                </span>
                              )}
                            </div>
                            {prompt.description && (
                              <p className="text-xs leading-relaxed text-gray-600">
                                {prompt.description}
                              </p>
                            )}
                          </div>

                          {/* Arrow */}
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Divider between module and library prompts */}
          {filteredAiPrompts.length > 0 && filteredLibraryPrompts.length > 0 && (
            <div className="flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-medium text-gray-500 uppercase">Other Available Prompts (General Library)</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
          )}

          {/* Library Prompts Section */}
          {filteredLibraryPrompts.length > 0 && (
            <div>
              {/* Show header only if there are no module prompts */}
              {filteredAiPrompts.length === 0 && (
                <div className="mb-3 flex items-center border-b border-gray-200 pb-2">
                  <svg className="mr-2 h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-900">
                    Prompt Library
                    {' '}
                    (
                    {filteredLibraryPrompts.length}
                    {' '}
                    available)
                  </span>
                </div>
              )}
              <div className="space-y-3">
                {(showAllPrompts ? filteredLibraryPrompts : filteredLibraryPrompts.slice(0, 5)).map((prompt) => {
                  const IconComponent = getIconComponent(prompt.icon);
                  const iconColorClass = getIconColor(prompt.category);
                  const badgeColorClass = getBadgeColor(prompt.category);
                  const isJsonOutput = prompt.outputType === 'json';

                  return (
                    <button
                      key={prompt.id}
                      onClick={() => handleAnalyze(prompt.id, prompt)}
                      onMouseEnter={() => setSelectedOption(prompt.id)}
                      onMouseLeave={() => setSelectedOption(null)}
                      className={`w-full rounded-lg border-2 text-left transition-all ${
                        selectedOption === prompt.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`mt-0.5 flex-shrink-0 ${iconColorClass}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-semibold text-gray-900">{prompt.name}</h3>
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeColorClass}`}>
                                {prompt.category}
                              </span>
                              {isJsonOutput && (
                                <span className="inline-flex items-center gap-1 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
                                  <Code2 className="h-3 w-3" />
                                  JSON
                                </span>
                              )}
                            </div>
                            {prompt.description && (
                              <p className="text-xs leading-relaxed text-gray-600">
                                {prompt.description}
                              </p>
                            )}
                          </div>

                          {/* Arrow */}
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explore All Prompts Button */}
              {filteredLibraryPrompts.length > 5 && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => setShowAllPrompts(!showAllPrompts)}
                    className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                  >
                    {showAllPrompts ? (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        Show Less
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        Explore All Prompts (+
                        {filteredLibraryPrompts.length - 5}
                        {' '}
                        more)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="rounded-b-lg border-t border-gray-200 bg-gray-50 px-6 py-4">
          {selectedTextSource === 'ai' ? (
            <div className="space-y-3">
              {/* Info banner for AI text */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-center gap-2 text-sm text-blue-900">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-medium">Extract from AI Conversation</span>
                </div>
                <p className="mt-1 text-xs text-blue-700">
                  Save this insight as a quote for the patient's record
                </p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Selected:
                  {' '}
                  {selectedText.length}
                  {' '}
                  characters
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  {onSaveAsQuote && (
                    <button
                      onClick={onSaveAsQuote}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      <Bookmark className="h-4 w-4" />
                      Save as Quote
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Selected:
                {' '}
                {selectedText.length}
                {' '}
                characters
              </p>
              <button
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
