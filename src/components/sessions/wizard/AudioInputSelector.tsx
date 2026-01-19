'use client';

import { Link2, Mic, Upload } from 'lucide-react';

export type AudioInputMode = 'upload' | 'record' | 'link';

type AudioInputSelectorProps = {
  selectedMode: AudioInputMode;
  onModeChange: (mode: AudioInputMode) => void;
  disabled?: boolean;
};

const MODES = [
  {
    id: 'upload' as const,
    label: 'Upload File',
    icon: Upload,
    description: 'Upload an existing audio file',
  },
  {
    id: 'record' as const,
    label: 'Record',
    icon: Mic,
    description: 'Record directly in browser',
  },
  {
    id: 'link' as const,
    label: 'Share Link',
    icon: Link2,
    description: 'Generate a link for mobile recording',
  },
];

export function AudioInputSelector({
  selectedMode,
  onModeChange,
  disabled = false,
}: AudioInputSelectorProps) {
  return (
    <div className="mb-6">
      <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => !disabled && onModeChange(mode.id)}
              disabled={disabled}
              className={`
                flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all
                ${
                  isSelected
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
              `}
            >
              <Icon className="h-4 w-4" />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
