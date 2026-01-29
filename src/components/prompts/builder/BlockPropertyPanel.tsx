'use client';

/**
 * Block Property Panel Component
 * Right sidebar for editing selected block properties
 * Supports editable system prompts, visual output schema builder, and field prompts
 */

import type { BlockField, BlockInstance } from '@/config/PromptBuilderBlocks';
import { ChevronDown, ChevronRight, FileText, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { getBlockDefinition } from '@/config/PromptBuilderBlocks';

type BlockPropertyPanelProps = {
  block: BlockInstance | null;
  onUpdate: (blockId: string, values: Record<string, any>) => void;
  onUpdateSystemPrompt: (blockId: string, systemPrompt: string) => void;
  onClose: () => void;
};

export function BlockPropertyPanel({
  block,
  onUpdate,
  onUpdateSystemPrompt,
  onClose,
}: BlockPropertyPanelProps) {
  const [isSystemPromptExpanded, setIsSystemPromptExpanded] = useState(false);

  if (!block) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-4 text-center">
        <div className="rounded-lg bg-gray-50 p-6">
          <p className="text-sm text-gray-500">
            Select a block to edit its properties
          </p>
        </div>
      </div>
    );
  }

  const definition = getBlockDefinition(block.blockType);
  if (!definition) return null;

  const Icon = definition.icon;
  const isAIBlock = definition.category === 'ai';

  // Get the effective system prompt (custom if set, otherwise default)
  const getSystemPrompt = (): string => {
    return block.customSystemPrompt ?? definition.defaultSystemPrompt ?? '';
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    onUpdate(block.id, {
      ...block.values,
      [fieldId]: value,
    });
  };

  const handleSystemPromptChange = (prompt: string) => {
    onUpdateSystemPrompt(block.id, prompt);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${isAIBlock ? 'text-purple-600' : 'text-gray-600'}`} />
          <span className="font-medium text-gray-900">{definition.label}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* System Prompt Editor - Only for AI blocks */}
          {isAIBlock && definition.defaultSystemPrompt && (
            <div className="rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-50/50">
              <button
                type="button"
                onClick={() => setIsSystemPromptExpanded(!isSystemPromptExpanded)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">System Prompt</span>
                </div>
                {isSystemPromptExpanded ? (
                  <ChevronDown className="h-4 w-4 text-purple-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-purple-600" />
                )}
              </button>

              {isSystemPromptExpanded && (
                <div className="border-t border-purple-200 px-4 py-3">
                  <p className="mb-2 text-xs text-purple-600">
                    Full AI instructions for generating output. Edit to customize behavior:
                  </p>
                  <textarea
                    value={getSystemPrompt()}
                    onChange={e => handleSystemPromptChange(e.target.value)}
                    rows={12}
                    className="w-full rounded-lg border border-purple-300 bg-white px-3 py-2 font-mono text-xs focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                    placeholder="Enter system prompt..."
                  />
                  {block.customSystemPrompt && (
                    <button
                      type="button"
                      onClick={() => handleSystemPromptChange('')}
                      className="mt-2 text-xs text-purple-600 hover:text-purple-800"
                    >
                      Reset to default
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Divider for AI blocks */}
          {isAIBlock && definition.defaultSystemPrompt && (
            <div className="flex items-center gap-2 py-2">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs text-gray-400">
                <FileText className="mr-1 inline h-3 w-3" />
                Fields
              </span>
              <div className="flex-1 border-t border-gray-200" />
            </div>
          )}

          {/* Field Editors */}
          {definition.fields.map(field => (
            <FieldEditor
              key={field.id}
              field={field}
              value={block.values[field.id]}
              onChange={value => handleFieldChange(field.id, value)}
            />
          ))}
        </div>
      </div>

      {/* Footer with Block Info */}
      <div className="border-t border-gray-200 px-4 py-3">
        <p className="text-xs text-gray-500">{definition.description}</p>
        {definition.schemaType && (
          <p className="mt-1 text-xs text-purple-600">
            Schema:
            {' '}
            {definition.schemaType}
          </p>
        )}
      </div>
    </div>
  );
}

type FieldEditorProps = {
  field: BlockField;
  value: any;
  onChange: (value: any) => void;
};

function FieldEditor({ field, value, onChange }: FieldEditorProps) {
  const renderInput = () => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            maxLength={field.validation?.maxLength}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            maxLength={field.validation?.maxLength}
          />
        );

      case 'select':
        return (
          <select
            value={value || field.defaultValue || ''}
            onChange={e => onChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
          >
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value ?? field.defaultValue ?? ''}
            onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined)}
            min={field.validation?.min}
            max={field.validation?.max}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
          />
        );

      case 'url':
        return (
          <input
            type="url"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder || 'https://'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
          />
        );

      case 'boolean':
        return (
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={e => onChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">Enable</span>
          </label>
        );

      case 'color':
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value || field.defaultValue || '#000000'}
              onChange={e => onChange(e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border border-gray-300"
            />
            <input
              type="text"
              value={value || field.defaultValue || ''}
              onChange={e => onChange(e.target.value)}
              placeholder="#000000"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            />
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {renderInput()}
      {field.helpText && (
        <p className="text-xs text-gray-500">{field.helpText}</p>
      )}
    </div>
  );
}
