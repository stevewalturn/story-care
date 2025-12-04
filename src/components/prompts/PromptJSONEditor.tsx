'use client';

/**
 * Prompt JSON Editor
 * Simple textarea-based JSON editor with validation and formatting
 */

import { formatJSON, validatePromptJSON } from '@/utils/PromptJSONValidator';
import type { SchemaType } from '@/config/PromptJSONTemplates';
import { getTemplateJSON, PROMPT_JSON_TEMPLATES } from '@/config/PromptJSONTemplates';
import { AlertCircle, Check, Sparkles, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PromptJSONEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  onGenerateWithAI?: () => void;
  placeholder?: string;
}

export function PromptJSONEditor({
  value,
  onChange,
  onValidationChange,
  onGenerateWithAI,
  placeholder = '{\n  "schemaType": "image_references",\n  ...\n}',
}: PromptJSONEditorProps) {
  const [validationResult, setValidationResult] = useState<ReturnType<typeof validatePromptJSON> | null>(null);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  // Validate on change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value.trim()) {
        const result = validatePromptJSON(value);
        setValidationResult(result);
        onValidationChange?.(result.isValid);
      }
      else {
        setValidationResult(null);
        onValidationChange?.(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value, onValidationChange]);

  const handleFormat = () => {
    try {
      const formatted = formatJSON(value);
      onChange(formatted);
    }
    catch {
      // Invalid JSON, can't format
    }
  };

  const handleLoadTemplate = (schemaType: SchemaType) => {
    const templateJSON = getTemplateJSON(schemaType);
    onChange(templateJSON);
    setShowTemplateDropdown(false);
  };

  const lineCount = value.split('\n').length;
  const charCount = value.length;

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Load Template Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Wand2 className="h-4 w-4" />
              Load Template
            </button>

            {showTemplateDropdown && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowTemplateDropdown(false)}
                />

                {/* Dropdown */}
                <div className="absolute left-0 top-full z-20 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
                  <div className="max-h-96 overflow-y-auto p-2">
                    {PROMPT_JSON_TEMPLATES.map(template => (
                      <button
                        key={template.schemaType}
                        type="button"
                        onClick={() => handleLoadTemplate(template.schemaType)}
                        className="w-full rounded-lg p-3 text-left hover:bg-gray-50"
                      >
                        <div className="font-medium text-gray-900">{template.label}</div>
                        <div className="mt-1 text-xs text-gray-500">{template.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Generate with AI Button */}
          {onGenerateWithAI && (
            <button
              type="button"
              onClick={onGenerateWithAI}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Sparkles className="h-4 w-4" />
              Generate with AI
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Format Button */}
          <button
            type="button"
            onClick={handleFormat}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            disabled={!value.trim()}
          >
            Format JSON
          </button>

          {/* Validation Status */}
          {validationResult && (
            <div className="flex items-center gap-2">
              {validationResult.isValid
                ? (
                    <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                      <Check className="h-4 w-4" />
                      Valid
                    </div>
                  )
                : (
                    <div className="flex items-center gap-1 text-sm font-medium text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {validationResult.errors.length}
                      {' '}
                      Error
                      {validationResult.errors.length > 1 ? 's' : ''}
                    </div>
                  )}
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={20}
          className={`w-full rounded-lg border px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 ${
            validationResult?.isValid === false
              ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/20'
              : validationResult?.isValid === true
                ? 'border-green-300 bg-green-50 focus:border-green-500 focus:ring-green-500/20'
                : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500/20'
          }`}
          style={{
            lineHeight: '1.5',
            tabSize: 2,
          }}
        />

        {/* Character Count */}
        <div className="mt-2 text-right text-xs text-gray-500">
          {lineCount}
          {' '}
          lines ·
          {charCount.toLocaleString()}
          {' '}
          characters
        </div>
      </div>

      {/* Validation Errors */}
      {validationResult && !validationResult.isValid && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="mb-2 flex items-center gap-2 font-medium text-red-800">
            <AlertCircle className="h-4 w-4" />
            Validation Errors
          </div>
          <ul className="space-y-1 text-sm text-red-700">
            {validationResult.errors.map((error, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation Warnings */}
      {validationResult && validationResult.warnings.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="mb-2 font-medium text-yellow-800">Warnings</div>
          <ul className="space-y-1 text-sm text-yellow-700">
            {validationResult.warnings.map((warning, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Success Message */}
      {validationResult && validationResult.isValid && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-green-800">
            <Check className="h-4 w-4" />
            JSON is valid and ready to save
          </div>
        </div>
      )}
    </div>
  );
}
