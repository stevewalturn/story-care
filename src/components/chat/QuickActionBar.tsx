'use client';

/**
 * QuickActionBar Component
 *
 * Displays quick action buttons above chat input for common therapeutic prompts
 */

import type { QuickAction } from '@/types/BuildingBlocks';
import { useState } from 'react';
import { formatPromptTemplate, QUICK_ACTIONS } from '@/config/QuickActions';

type QuickActionBarProps = {
  onSelectAction: (prompt: string, action: QuickAction) => void;
  selectedText?: string;
  sessionId?: string;
};

export default function QuickActionBar({
  onSelectAction,
  selectedText = '',
  sessionId,
}: QuickActionBarProps) {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const handleActionClick = (action: QuickAction) => {
    if (action.promptTemplate) {
      const formattedPrompt = formatPromptTemplate(action.promptTemplate, {
        selectedText,
        sessionId,
      });
      onSelectAction(formattedPrompt, action);
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Quick Actions:</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              onMouseEnter={() => setHoveredAction(action.id)}
              onMouseLeave={() => setHoveredAction(null)}
              className="relative inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
              title={action.description}
            >
              <span className="text-base">{action.icon}</span>
              <span>{action.label}</span>

              {/* Tooltip */}
              {hoveredAction === action.id && (
                <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg">
                  {action.description}
                  <div className="absolute top-full left-1/2 h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Help text */}
      {selectedText && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-500">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Text selected. Quick actions will use the selected text as context.</span>
        </div>
      )}
    </div>
  );
}
