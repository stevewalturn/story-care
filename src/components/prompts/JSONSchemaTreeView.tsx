'use client';

/**
 * JSONSchemaTreeView Component
 *
 * Beautiful, collapsible tree view for ANY JSON Schema
 * Shows structure, types, required fields in a clean visual format
 */

import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface JSONSchemaTreeViewProps {
  schema: any;
  title?: string;
}

interface SchemaNodeProps {
  name: string;
  schema: any;
  required?: boolean;
  level?: number;
  isLast?: boolean;
}

/**
 * Get color class based on type
 */
function getTypeColor(type: string): string {
  switch (type) {
    case 'string':
      return 'text-blue-600 bg-blue-50';
    case 'number':
    case 'integer':
      return 'text-green-600 bg-green-50';
    case 'boolean':
      return 'text-purple-600 bg-purple-50';
    case 'array':
      return 'text-orange-600 bg-orange-50';
    case 'object':
      return 'text-indigo-600 bg-indigo-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

/**
 * Get icon for type
 */
function getTypeIcon(type: string): string {
  switch (type) {
    case 'string':
      return '"abc"';
    case 'number':
    case 'integer':
      return '123';
    case 'boolean':
      return 'T/F';
    case 'array':
      return '[ ]';
    case 'object':
      return '{ }';
    default:
      return '?';
  }
}

/**
 * Render a single schema node (property)
 */
function SchemaNode({ name, schema, required = false, level = 0, isLast = false }: SchemaNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels

  const type = schema.type || 'any';
  const description = schema.description;
  const hasChildren = (type === 'object' && schema.properties) || (type === 'array' && schema.items);

  // For arrays, get the item type
  const arrayItemType = type === 'array' && schema.items ? schema.items.type || 'object' : null;

  return (
    <div className={`${level > 0 ? 'ml-4' : ''}`}>
      {/* Node header */}
      <div className="flex items-start gap-2 py-1.5">
        {/* Tree connector */}
        {level > 0 && (
          <div className="flex items-center">
            <div className="text-gray-300 select-none">
              {isLast ? '└─' : '├─'}
            </div>
          </div>
        )}

        {/* Expand/collapse button for nested types */}
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-0.5 hover:bg-gray-100 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>
        ) : (
          <div className="w-5" /> // Spacer
        )}

        {/* Property name */}
        <span className="font-mono text-sm font-medium text-gray-900">
          {name}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>

        {/* Type badge */}
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(type)}`}>
          {getTypeIcon(type)} {type}
          {arrayItemType && ` of ${arrayItemType}s`}
        </span>

        {/* Required indicator */}
        {required && (
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <CheckCircle2 className="h-3 w-3" />
            required
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <div className="ml-7 text-xs text-gray-600 italic mb-1">
          {description}
        </div>
      )}

      {/* Children (nested properties or array items) */}
      {hasChildren && isExpanded && (
        <div className="ml-2 border-l-2 border-gray-200 pl-2">
          {/* Object properties */}
          {type === 'object' && schema.properties && (
            <div className="space-y-0.5">
              {Object.entries(schema.properties).map(([propName, propSchema]: [string, any], index, arr) => (
                <SchemaNode
                  key={propName}
                  name={propName}
                  schema={propSchema}
                  required={schema.required?.includes(propName)}
                  level={level + 1}
                  isLast={index === arr.length - 1}
                />
              ))}
            </div>
          )}

          {/* Array items */}
          {type === 'array' && schema.items && (
            <div className="mt-1">
              <div className="text-xs text-gray-500 mb-1 ml-4">Each item:</div>
              {schema.items.type === 'object' && schema.items.properties ? (
                <div className="space-y-0.5">
                  {Object.entries(schema.items.properties).map(
                    ([propName, propSchema]: [string, any], index, arr) => (
                      <SchemaNode
                        key={propName}
                        name={propName}
                        schema={propSchema}
                        required={schema.items.required?.includes(propName)}
                        level={level + 1}
                        isLast={index === arr.length - 1}
                      />
                    )
                  )}
                </div>
              ) : (
                <div className="ml-4 text-sm text-gray-600">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(schema.items.type || 'string')}`}>
                    {getTypeIcon(schema.items.type || 'string')} {schema.items.type || 'any'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Main JSONSchemaTreeView Component
 */
export function JSONSchemaTreeView({ schema, title = 'Output Structure' }: JSONSchemaTreeViewProps) {
  if (!schema || typeof schema !== 'object') {
    return (
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-center text-sm text-gray-500">
        No schema defined
      </div>
    );
  }

  // Handle root-level schema
  const rootProperties = schema.properties || {};
  const rootRequired = schema.required || [];

  return (
    <div className="rounded-lg border border-purple-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200 px-4 py-3">
        <h4 className="font-semibold text-purple-900 text-sm">{title}</h4>
        {schema.description && (
          <p className="text-xs text-purple-700 mt-1">{schema.description}</p>
        )}
      </div>

      {/* Tree content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {Object.keys(rootProperties).length > 0 ? (
          <div className="space-y-0.5">
            {Object.entries(rootProperties).map(([propName, propSchema]: [string, any], index, arr) => (
              <SchemaNode
                key={propName}
                name={propName}
                schema={propSchema}
                required={rootRequired.includes(propName)}
                level={0}
                isLast={index === arr.length - 1}
              />
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">No properties defined</div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex flex-wrap gap-2 text-xs">
        <span className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">"abc"</span>
          <span className="text-gray-600">string</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-600 font-medium">123</span>
          <span className="text-gray-600">number</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 font-medium">[ ]</span>
          <span className="text-gray-600">array</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium">{'{ }'}</span>
          <span className="text-gray-600">object</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-red-500">*</span>
          <span className="text-gray-600">required</span>
        </span>
      </div>
    </div>
  );
}
