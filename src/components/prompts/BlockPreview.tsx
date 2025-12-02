'use client';

/**
 * BlockPreview Component
 *
 * Shows a collapsed preview of a building block with key information
 * Click to expand into full BlockForm
 */

import { ChevronRight, AlertCircle } from 'lucide-react';
import type { BlockInstance, ValidationError } from '@/types/BuildingBlocks';
import { getBlockDefinition } from '@/config/BlockDefinitions';

interface BlockPreviewProps {
  blockId: string;
  instance: BlockInstance;
  onExpand: () => void;
  errors?: ValidationError[];
}

export default function BlockPreview({
  blockId,
  instance,
  onExpand,
  errors = [],
}: BlockPreviewProps) {
  const definition = getBlockDefinition(instance.blockId);

  if (!definition) {
    return (
      <div
        onClick={onExpand}
        className="cursor-pointer rounded-lg border border-red-300 bg-red-50 p-3 hover:border-red-400"
      >
        <p className="text-sm text-red-600">Unknown block type: {instance.blockId}</p>
      </div>
    );
  }

  const hasErrors = errors.length > 0;

  // Extract preview text from values
  const getPreviewText = (): string => {
    const values = instance.values;

    // Try to find title, name, or question_text field
    if (values.title) return values.title;
    if (values.name) return values.name;
    if (values.question_text) return values.question_text;

    // Try to find prompt field and show first 60 chars
    if (values.prompt) {
      return values.prompt.length > 60
        ? `${values.prompt.substring(0, 60)}...`
        : values.prompt;
    }

    // Show first non-empty value
    const firstValue = Object.values(values).find(v => v && String(v).trim());
    if (firstValue && typeof firstValue === 'string') {
      return firstValue.length > 60
        ? `${firstValue.substring(0, 60)}...`
        : firstValue;
    }

    return 'Click to configure';
  };

  // Get summary of configured fields
  const getFieldsSummary = (): string => {
    const totalFields = definition.fields.length;
    const filledFields = definition.fields.filter(
      field => instance.values[field.id] !== undefined && instance.values[field.id] !== null && instance.values[field.id] !== '',
    ).length;

    return `${filledFields}/${totalFields} fields`;
  };

  const previewText = getPreviewText();
  const fieldsSummary = getFieldsSummary();

  return (
    <div
      onClick={onExpand}
      className={`cursor-pointer rounded-lg border ${
        hasErrors
          ? 'border-red-300 bg-red-50 hover:border-red-400'
          : 'border-gray-300 bg-white hover:border-blue-400'
      } p-3 shadow-sm transition-colors`}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
            hasErrors ? 'bg-red-100' : 'bg-indigo-100'
          }`}
        >
          <span className="text-base">
            {definition.icon === 'image' ? '🖼️' :
              definition.icon === 'video' ? '🎬' :
              definition.icon === 'music' ? '🎵' :
              definition.icon === 'quote' ? '💬' :
              definition.icon === 'file-text' ? '📝' :
              definition.icon === 'help-circle' ? '💭' :
              definition.icon === 'list-checks' ? '📋' :
              definition.icon === 'film' ? '🎬' :
              definition.icon === 'play-circle' ? '▶️' :
              definition.icon === 'layers' ? '📚' :
              definition.icon === 'square-stack' ? '📚' :
              '✨'}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`text-sm font-medium ${hasErrors ? 'text-red-900' : 'text-gray-900'}`}>
              {definition.label}
            </h4>
            {hasErrors && (
              <div className="flex items-center gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.length} error{errors.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{previewText}</p>
          <p className="text-xs text-gray-400 mt-0.5">{fieldsSummary}</p>
        </div>

        {/* Expand icon */}
        <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
      </div>

      {/* Error messages */}
      {hasErrors && (
        <div className="mt-2 space-y-1 border-t border-red-200 pt-2">
          {errors.slice(0, 2).map((error, idx) => (
            <p key={idx} className="text-xs text-red-600">
              • {error.message}
            </p>
          ))}
          {errors.length > 2 && (
            <p className="text-xs text-red-600">
              • ... and {errors.length - 2} more error{errors.length - 2 !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
