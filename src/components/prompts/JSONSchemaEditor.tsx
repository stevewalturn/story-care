'use client';

import { Save, X } from 'lucide-react';
import { useState } from 'react';

type JSONSchemaEditorProps = {
  promptId: string;
  promptName: string;
  currentJsonSchema?: any;
  onSave: (data: {
    jsonSchema?: any;
  }) => Promise<void>;
  onCancel: () => void;
};

export function JSONSchemaEditor({
  promptId: _promptId,
  promptName,
  currentJsonSchema,
  onSave,
  onCancel,
}: JSONSchemaEditorProps) {
  const [jsonSchema, setJsonSchema] = useState<string>(
    currentJsonSchema ? JSON.stringify(currentJsonSchema, null, 2) : '',
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleJsonSchemaChange = (value: string) => {
    setJsonSchema(value);

    // Validate JSON if not empty
    if (value.trim()) {
      try {
        JSON.parse(value);
        setJsonError(null);
      } catch (error) {
        setJsonError((error as Error).message);
      }
    } else {
      setJsonError(null);
    }
  };

  const handleSave = async () => {
    // Validate JSON schema if provided
    if (jsonSchema.trim()) {
      try {
        JSON.parse(jsonSchema);
      } catch {
        setJsonError('Invalid JSON schema');
        return;
      }
    }

    setIsSaving(true);

    try {
      const data: any = {};

      // Include JSON schema if provided
      if (jsonSchema.trim()) {
        data.jsonSchema = JSON.parse(jsonSchema);
      }

      await onSave(data);
    } catch (error) {
      console.error('Save error:', error);
      setJsonError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Edit JSON Schema
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Define the expected JSON structure for
          {' '}
          <span className="font-medium text-gray-900">{promptName}</span>
        </p>
      </div>

      {/* JSON Schema Editor */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="json-schema" className="block text-sm font-medium text-gray-700">
            JSON Schema (Optional)
          </label>
        </div>
        <textarea
          id="json-schema"
          value={jsonSchema}
          onChange={e => handleJsonSchemaChange(e.target.value)}
          placeholder='{\n  "type": "object",\n  "properties": {\n    ...\n  }\n}'
          className={`min-h-[300px] w-full rounded-lg border px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none ${
            jsonError
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
              : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
          }`}
        />
        {jsonError && (
          <p className="mt-2 text-sm text-red-600">
            {jsonError}
          </p>
        )}
        <p className="mt-2 text-xs text-gray-500">
          Define the expected JSON structure for AI responses. This helps validate outputs and enables action buttons.
        </p>
      </div>

      {/* Example Schema Link */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="mb-2 text-xs font-medium text-gray-700">Need help with JSON Schema?</p>
        <ul className="space-y-1 text-xs text-gray-600">
          <li>• Use JSON Schema draft-07 format</li>
          <li>• Define required properties and types</li>
          <li>• Add descriptions for better AI understanding</li>
          <li>
            • Reference:
            {' '}
            <a
              href="https://json-schema.org/learn/getting-started-step-by-step"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 underline hover:text-purple-700"
            >
              JSON Schema Documentation
            </a>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !!jsonError}
          className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Configuration
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default JSONSchemaEditor;
