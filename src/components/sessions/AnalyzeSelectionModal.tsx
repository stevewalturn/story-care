'use client';

import { useState } from 'react';
import { Target } from 'lucide-react';
import type { TreatmentModule } from '@/models/Schema';
import { ModuleBadge } from '@/components/modules/ModuleBadge';

type AnalyzeOption = {
  id: string;
  title: string;
  description: string;
  category: string;
  badge?: string;
  icon: string;
};

const ANALYZE_OPTIONS: AnalyzeOption[] = [
  {
    id: 'save-quote',
    title: 'Save as Quote',
    description: 'Save this selection to the patient\'s quote library with tags and notes.',
    category: 'library',
    icon: 'bookmark',
  },
  {
    id: 'extract-quotes',
    title: 'Extract Meaningful Quotes (AI)',
    description: 'AI will analyze the selected text and extract the most meaningful, therapeutically significant quotes.',
    category: 'ai_extraction',
    badge: 'AI',
    icon: 'sparkles',
  },
  {
    id: 'therapeutic-alliance',
    title: 'Therapeutic Alliance Analysis',
    description: 'Analyze the transcript for indicators of the therapeutic alliance. How is the relationship between therapist and patient?',
    category: 'reflection',
    icon: 'info',
  },
  {
    id: 'potential-images',
    title: 'Potential Images',
    description: 'You are a narrative therapy media assistant. Your task is to analyze the provided transcript and generate image suggestions.',
    category: 'image_suggestions',
    badge: 'JSON',
    icon: 'sparkles',
  },
  {
    id: 'clinical-note',
    title: 'Group Clinical Note',
    description: 'You are a licensed clinical professional creating a detailed Group Therapy Progress Note for a narrative therapy session.',
    category: 'analysis',
    icon: 'info',
  },
  {
    id: 'potential-scenes',
    title: 'Potential Scenes',
    description: 'You are an expert narrative therapist and filmmaker. Your task is to identify powerful, scene-worthy moments from the transcript.',
    category: 'analysis',
    badge: 'JSON',
    icon: 'sparkles',
  },
  {
    id: 'create-image',
    title: 'Create an Image from Selection',
    description: 'You are a visual artist and therapist. Based on the following text selection, create a single, compelling image prompt.',
    category: 'creative',
    icon: 'sparkles',
  },
];

type AnalyzeSelectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  onAnalyze: (optionId: string, selectedText: string) => void;
  assignedModule?: TreatmentModule | null;
};

export function AnalyzeSelectionModal({
  isOpen,
  onClose,
  selectedText,
  onAnalyze,
  assignedModule,
}: AnalyzeSelectionModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Create module-specific options if module is assigned
  const moduleOptions: AnalyzeOption[] = assignedModule
    ? [
        {
          id: 'module-analysis',
          title: `${assignedModule.name} Protocol Analysis`,
          description: assignedModule.aiPromptText.substring(0, 150) + '...',
          category: 'module',
          badge: 'Protocol',
          icon: 'target',
        },
      ]
    : [];

  if (!isOpen) {
    return null;
  }

  const handleAnalyze = (optionId: string) => {
    onAnalyze(optionId, selectedText);
    onClose();
  };

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
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
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

        {/* Options */}
        <div className="max-h-[60vh] space-y-3 overflow-y-auto p-6">
          {/* Module-Specific Options (if module assigned) */}
          {assignedModule && (
            <>
              <div className="mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-semibold text-gray-900">Treatment Protocol Options</span>
                <ModuleBadge
                  moduleName={assignedModule.name}
                  domain={assignedModule.domain as any}
                  size="sm"
                  showIcon={false}
                />
              </div>
              {moduleOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleAnalyze(option.id)}
                  onMouseEnter={() => setSelectedOption(option.id)}
                  onMouseLeave={() => setSelectedOption(null)}
                  className={`w-full rounded-lg border-2 text-left transition-all ${
                    selectedOption === option.id
                      ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50'
                      : 'border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 hover:border-indigo-400'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="mt-0.5 flex-shrink-0 text-indigo-600">
                        <Target className="h-5 w-5" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-900">{option.title}</h3>
                          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            {option.badge}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-gray-600">
                          {option.description}
                        </p>
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
              ))}

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs font-medium text-gray-500">
                    General Analysis Options
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Standard Options */}
          {ANALYZE_OPTIONS.map(option => (
            <button
              key={option.id}
              onClick={() => handleAnalyze(option.id)}
              onMouseEnter={() => setSelectedOption(option.id)}
              onMouseLeave={() => setSelectedOption(null)}
              className={`w-full rounded-lg border-2 text-left transition-all ${
                selectedOption === option.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`mt-0.5 flex-shrink-0 ${
                    option.icon === 'sparkles'
                      ? 'text-purple-500'
                      : option.icon === 'bookmark' ? 'text-green-500' : 'text-blue-500'
                  }`}
                  >
                    {option.icon === 'sparkles'
                      ? (
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                          </svg>
                        )
                      : option.icon === 'bookmark'
                        ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                          )
                        : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">{option.title}</h3>
                      {option.badge && (
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                          {option.badge}
                        </span>
                      )}
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {option.category}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-600">
                      {option.description}
                    </p>
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
          ))}
        </div>

        {/* Footer */}
        <div className="rounded-b-lg border-t border-gray-200 bg-gray-50 px-6 py-4">
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
        </div>
      </div>
    </div>
  );
}
