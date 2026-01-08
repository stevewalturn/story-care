'use client';

/**
 * Visual Schema Builder Component
 * Provides a visual interface for building JSON schema output structure
 * with toggle between visual mode and advanced JSON mode
 */

import type { FieldMeta, SchemaFieldConfig, SchemaType } from '@/config/PromptJSONTemplates';
import { AlertCircle, Check, ChevronDown, ChevronRight, Code, Eye, Info, Sparkles, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getFieldConfigByType, SCHEMA_FIELD_CONFIGS } from '@/config/PromptJSONTemplates';
import { validatePromptJSON } from '@/utils/PromptJSONValidator';
import { PromptJSONEditor } from './PromptJSONEditor';
import { SchemaTypeSelector } from './SchemaTypeSelector';

type VisualSchemaBuilderProps = {
  value: string; // JSON string
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  onGenerateWithAI?: () => void;
  disabled?: boolean;
};

type FieldToggleState = Record<string, boolean>; // fieldName -> isEnabled

export function VisualSchemaBuilder({
  value,
  onChange,
  onValidationChange,
  onGenerateWithAI,
  disabled,
}: VisualSchemaBuilderProps) {
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [selectedSchemaType, setSelectedSchemaType] = useState<SchemaType | null>(null);
  const [optionalFieldsEnabled, setOptionalFieldsEnabled] = useState<FieldToggleState>({});
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});

  // Parse current value to detect schema type
  useEffect(() => {
    if (value) {
      try {
        const parsed = JSON.parse(value);
        const properties = parsed.properties || parsed;
        const schemaTypeEnum = properties?.schemaType?.enum?.[0];
        if (schemaTypeEnum && SCHEMA_FIELD_CONFIGS.find(c => c.schemaType === schemaTypeEnum)) {
          setSelectedSchemaType(schemaTypeEnum as SchemaType);
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Get current schema config
  const schemaConfig = selectedSchemaType ? getFieldConfigByType(selectedSchemaType) : null;

  // Generate JSON from visual builder state
  const generateJSONFromState = (
    schemaType: SchemaType,
    config: SchemaFieldConfig,
    enabledOptional: FieldToggleState,
  ): string => {
    const buildFieldSchema = (field: FieldMeta, _isArrayItem = false): any => {
      if (field.type === 'array' && field.objectFields) {
        // Array of objects
        const itemProperties: Record<string, any> = {};
        const itemRequired: string[] = [];

        for (const subField of field.objectFields) {
          // For array items, include all fields (required ones always, optional if enabled)
          if (subField.required || enabledOptional[`${field.name}.${subField.name}`] !== false) {
            itemProperties[subField.name] = buildFieldSchema(subField, true);
            if (subField.required) {
              itemRequired.push(subField.name);
            }
          }
        }

        return {
          type: 'array',
          items: {
            type: 'object',
            properties: itemProperties,
            ...(itemRequired.length > 0 ? { required: itemRequired } : {}),
          },
        };
      } else if (field.type === 'array') {
        // Simple array
        return {
          type: 'array',
          items: { type: field.arrayItemType || 'string' },
        };
      } else if (field.type === 'object' && field.objectFields) {
        // Nested object
        const objProperties: Record<string, any> = {};
        const objRequired: string[] = [];

        for (const subField of field.objectFields) {
          if (subField.required || enabledOptional[`${field.name}.${subField.name}`] !== false) {
            objProperties[subField.name] = buildFieldSchema(subField, true);
            if (subField.required) {
              objRequired.push(subField.name);
            }
          }
        }

        return {
          type: 'object',
          properties: objProperties,
          ...(objRequired.length > 0 ? { required: objRequired } : {}),
        };
      } else {
        // Primitive type
        return { type: field.type };
      }
    };

    const properties: Record<string, any> = {
      schemaType: { type: 'string', enum: [schemaType] },
    };
    const required: string[] = ['schemaType'];

    for (const field of config.fields) {
      // Include required fields always, optional fields only if enabled
      if (field.required || enabledOptional[field.name] !== false) {
        properties[field.name] = buildFieldSchema(field);
        if (field.required) {
          required.push(field.name);
        }
      }
    }

    const schema = {
      type: 'object',
      properties,
      required,
    };

    return JSON.stringify(schema, null, 2);
  };

  // Handle schema type change
  const handleSchemaTypeChange = (schemaType: SchemaType) => {
    setSelectedSchemaType(schemaType);

    // Initialize optional fields to enabled by default
    const config = getFieldConfigByType(schemaType);
    if (config) {
      const initialState: FieldToggleState = {};
      for (const field of config.fields) {
        if (!field.required) {
          initialState[field.name] = true;
        }
        // Also handle nested optional fields
        if (field.objectFields) {
          for (const subField of field.objectFields) {
            if (!subField.required) {
              initialState[`${field.name}.${subField.name}`] = true;
            }
          }
        }
      }
      setOptionalFieldsEnabled(initialState);

      // Generate and set the JSON
      const json = generateJSONFromState(schemaType, config, initialState);
      onChange(json);
    }
  };

  // Handle optional field toggle
  const handleToggleOptionalField = (fieldPath: string) => {
    const newState = {
      ...optionalFieldsEnabled,
      [fieldPath]: !optionalFieldsEnabled[fieldPath],
    };
    setOptionalFieldsEnabled(newState);

    if (selectedSchemaType && schemaConfig) {
      const json = generateJSONFromState(selectedSchemaType, schemaConfig, newState);
      onChange(json);
    }
  };

  // Toggle expanded state for nested fields
  const toggleExpanded = (fieldName: string) => {
    setExpandedFields(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  };

  // Render a single field row
  const renderField = (field: FieldMeta, parentPath = '', depth = 0): React.ReactNode => {
    const fieldPath = parentPath ? `${parentPath}.${field.name}` : field.name;
    const isExpanded = expandedFields[fieldPath] !== false; // Default expanded
    const hasChildren = field.objectFields && field.objectFields.length > 0;
    const isOptional = !field.required;
    const isEnabled = field.required || optionalFieldsEnabled[fieldPath] !== false;

    return (
      <div key={fieldPath} className={`${depth > 0 ? 'ml-6 border-l border-gray-200 pl-4' : ''}`}>
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
            isOptional && !isEnabled ? 'bg-gray-50 opacity-60' : ''
          }`}
        >
          {/* Expand/collapse for nested fields */}
          {hasChildren
            ? (
                <button
                  type="button"
                  onClick={() => toggleExpanded(fieldPath)}
                  className="flex h-5 w-5 items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )
            : (
                <div className="w-5" />
              )}

          {/* Toggle for optional fields */}
          {isOptional
            ? (
                <button
                  type="button"
                  onClick={() => handleToggleOptionalField(fieldPath)}
                  disabled={disabled}
                  className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                    isEnabled
                      ? 'border-purple-500 bg-purple-500 text-white'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  {isEnabled && <Check className="h-3 w-3" />}
                </button>
              )
            : (
                <div className="flex h-5 w-5 items-center justify-center rounded border border-purple-200 bg-purple-100">
                  <Check className="h-3 w-3 text-purple-600" />
                </div>
              )}

          {/* Field name and type */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`font-medium ${isEnabled ? 'text-gray-900' : 'text-gray-400'}`}>
                {field.displayName}
              </span>
              <span className="text-xs text-gray-400">({field.type})</span>
              {field.required && (
                <span className="text-xs font-medium text-red-500">*</span>
              )}
              {field.enablesAction && isEnabled && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                  <Zap className="h-3 w-3" />
                  {field.enablesAction}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">{field.description}</p>
          </div>
        </div>

        {/* Nested fields */}
        {hasChildren && isExpanded && isEnabled && (
          <div className="mt-1">
            {field.objectFields!.map(subField => renderField(subField, fieldPath, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render validation status
  const renderValidationStatus = () => {
    if (!value) return null;

    const result = validatePromptJSON(value);
    onValidationChange?.(result.isValid);

    if (result.isValid) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">Schema is valid</span>
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-3">
        <div className="flex items-center gap-2 font-medium text-red-800">
          <AlertCircle className="h-4 w-4" />
          Validation Errors
        </div>
        <ul className="mt-2 space-y-1 text-sm text-red-700">
          {result.errors.map((error, i) => (
            <li key={i}>• {error}</li>
          ))}
        </ul>
      </div>
    );
  };

  // Advanced mode - show JSON editor
  if (isAdvancedMode) {
    return (
      <div className="space-y-4">
        {/* Mode toggle header */}
        <div className="flex items-center justify-between rounded-lg bg-gray-100 px-4 py-2">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Advanced JSON Mode</span>
          </div>
          <button
            type="button"
            onClick={() => setIsAdvancedMode(false)}
            className="text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            Switch to Visual Builder
          </button>
        </div>

        <PromptJSONEditor
          value={value}
          onChange={onChange}
          onValidationChange={onValidationChange}
          onGenerateWithAI={onGenerateWithAI}
        />
      </div>
    );
  }

  // Visual mode
  return (
    <div className="space-y-4">
      {/* Mode toggle header */}
      <div className="flex items-center justify-between rounded-lg bg-purple-50 px-4 py-2">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-700">Visual Schema Builder</span>
        </div>
        <div className="flex items-center gap-3">
          {onGenerateWithAI && (
            <button
              type="button"
              onClick={onGenerateWithAI}
              className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700"
            >
              <Sparkles className="h-4 w-4" />
              Generate with AI
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsAdvancedMode(true)}
            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-700"
          >
            <Code className="h-4 w-4" />
            Advanced Mode
          </button>
        </div>
      </div>

      {/* Schema Type Selector */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Output Type
          {' '}
          <span className="text-red-500">*</span>
        </label>
        <SchemaTypeSelector
          value={selectedSchemaType}
          onChange={handleSchemaTypeChange}
          disabled={disabled}
        />
      </div>

      {/* Fields Section */}
      {schemaConfig && (
        <div className="space-y-4">
          {/* Info box */}
          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
            <div className="text-sm text-blue-800">
              <strong>Required fields</strong>
              {' '}
              are marked with
              {' '}
              <span className="text-red-500">*</span>
              {' '}
              and cannot be disabled.
              Toggle optional fields to include them in your output schema.
            </div>
          </div>

          {/* Fields List */}
          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
              <h4 className="text-sm font-medium text-gray-700">Output Fields</h4>
            </div>
            <div className="divide-y divide-gray-100 p-2">
              {schemaConfig.fields.map(field => renderField(field))}
            </div>
          </div>

          {/* Actions Preview */}
          {schemaConfig.actions.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                <h4 className="text-sm font-medium text-gray-700">Available Actions</h4>
              </div>
              <div className="p-4">
                <p className="mb-3 text-xs text-gray-500">
                  These action buttons will appear when this prompt generates output:
                </p>
                <div className="flex flex-wrap gap-2">
                  {schemaConfig.actions.map(action => (
                    <span
                      key={action}
                      className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700"
                    >
                      <Zap className="h-3 w-3" />
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Validation Status */}
          {renderValidationStatus()}
        </div>
      )}

      {/* Empty state */}
      {!schemaConfig && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-gray-400" />
          <p className="mt-3 text-sm text-gray-600">Select an output type to configure the schema</p>
        </div>
      )}
    </div>
  );
}
