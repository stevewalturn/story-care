'use client';

import { useState } from 'react';

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
};

export function AnalyzeSelectionModal({
  isOpen,
  onClose,
  selectedText,
  onAnalyze,
}: AnalyzeSelectionModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  if (!isOpen) return null;

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
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-lg shadow-xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Analyze Selection</h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose a prompt to run on the selected text. The AI will use the full transcript for context.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Options */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-3">
          {ANALYZE_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleAnalyze(option.id)}
              onMouseEnter={() => setSelectedOption(option.id)}
              onMouseLeave={() => setSelectedOption(null)}
              className={`w-full text-left rounded-lg border-2 transition-all ${
                selectedOption === option.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 mt-0.5 ${
                    option.icon === 'sparkles' ? 'text-purple-500' : 'text-blue-500'
                  }`}>
                    {option.icon === 'sparkles' ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
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
                    <p className="text-xs text-gray-600 leading-relaxed">
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
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Selected: {selectedText.length} characters
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
