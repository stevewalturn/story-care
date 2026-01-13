'use client';

/**
 * Schema Type Selector Component
 * Visual dropdown for selecting schema type with action preview
 */

import type { SchemaType } from '@/config/PromptJSONTemplates';
import {
  Check,
  ChevronDown,
  Eye,
  FileText,
  Film,
  HelpCircle,
  Image,
  Layers,
  Music,
  Quote,
  Sparkles,
  Video,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SCHEMA_FIELD_CONFIGS } from '@/config/PromptJSONTemplates';

type SchemaTypeSelectorProps = {
  value: SchemaType | null;
  onChange: (schemaType: SchemaType) => void;
  disabled?: boolean;
};

// Icon mapping for schema types
const SCHEMA_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'file-text': FileText,
  'image': Image,
  'film': Film,
  'music': Music,
  'quote': Quote,
  'help-circle': HelpCircle,
  'layers': Layers,
  'video': Video,
  'sparkles': Sparkles,
  'eye': Eye,
};

export function SchemaTypeSelector({ value, onChange, disabled }: SchemaTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedConfig = value ? SCHEMA_FIELD_CONFIGS.find(c => c.schemaType === value) : null;
  const SelectedIcon = selectedConfig ? SCHEMA_ICONS[selectedConfig.icon] || Sparkles : null;

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
          disabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
            : isOpen
              ? 'border-purple-500 bg-white ring-2 ring-purple-500/20'
              : 'border-gray-300 bg-white hover:border-gray-400'
        }`}
      >
        {selectedConfig
          ? (
              <div className="flex items-center gap-3">
                {SelectedIcon && <SelectedIcon className="h-5 w-5 text-purple-600" />}
                <div>
                  <div className="font-medium text-gray-900">{selectedConfig.label}</div>
                  <div className="text-xs text-gray-500">{selectedConfig.description}</div>
                </div>
              </div>
            )
          : (
              <span className="text-gray-500">Select an output type...</span>
            )}
        <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="max-h-96 overflow-y-auto p-2">
            {SCHEMA_FIELD_CONFIGS.map((config) => {
              const Icon = SCHEMA_ICONS[config.icon] || Sparkles;
              const isSelected = value === config.schemaType;

              return (
                <button
                  key={config.schemaType}
                  type="button"
                  onClick={() => {
                    onChange(config.schemaType);
                    setIsOpen(false);
                  }}
                  className={`w-full rounded-lg p-3 text-left transition-colors ${
                    isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${isSelected ? 'text-purple-600' : 'text-gray-400'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>
                          {config.label}
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-purple-600" />}
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">{config.description}</div>

                      {/* Action Badges */}
                      {config.actions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {config.actions.map(action => (
                            <span
                              key={action}
                              className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                            >
                              {action}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
