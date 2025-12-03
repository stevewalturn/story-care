'use client';

/**
 * JSONSchemaBuilder Component
 *
 * Enhanced visual builder for creating JSON schemas with full recursive nesting support
 * Supports arrays of objects, nested objects, and multi-level structures
 */

import { useState, useRef, useEffect } from 'react';
import { Plus, X, ChevronDown, ChevronUp, Copy, FileJson, Search, Zap } from 'lucide-react';
import { JSONSchemaTreeView } from './JSONSchemaTreeView';
import { SCHEMA_PRESETS, type SchemaPreset } from './SchemaPresets';
import {
  PROPERTY_NAME_OPTIONS,
  PROPERTY_CATEGORIES,
  searchProperties,
} from './PropertyNameOptions';
import {
  getPropertyTemplate,
  hasAutoPopulateTemplate,
  type PropertyTemplate,
  type PropertyTemplateItem,
} from './PropertyTemplates';

interface JSONSchemaBuilderProps {
  initialSchema?: any;
  onChange: (schema: any) => void;
}

export interface SchemaProperty {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  enum?: string[];

  // For arrays
  items?: {
    type: 'string' | 'number' | 'boolean' | 'object';
    properties?: SchemaProperty[]; // For array of objects
  };

  // For objects
  properties?: SchemaProperty[]; // For nested objects
}

const TYPE_OPTIONS = [
  { value: 'string', label: 'String (text)', color: 'blue' },
  { value: 'number', label: 'Number', color: 'green' },
  { value: 'boolean', label: 'Boolean (true/false)', color: 'purple' },
  { value: 'array', label: 'Array (list)', color: 'orange' },
  { value: 'object', label: 'Object (nested)', color: 'indigo' },
];

export function JSONSchemaBuilder({ initialSchema, onChange }: JSONSchemaBuilderProps) {
  const [properties, setProperties] = useState<SchemaProperty[]>(() => {
    if (!initialSchema?.properties) return [];
    return parseSchemaToProperties(initialSchema);
  });

  const [showPreview, setShowPreview] = useState(true);
  const [showPresets, setShowPresets] = useState(false);
  const [templateConfirmation, setTemplateConfirmation] = useState<{
    template: PropertyTemplate;
    propertyId: string;
    onConfirm: () => void;
  } | null>(null);

  // Generate JSON schema from properties recursively
  const generateSchema = (props: SchemaProperty[]): any => {
    const schema: any = {
      type: 'object',
      properties: {},
      required: [],
    };

    props.forEach((prop) => {
      const propSchema: any = {
        type: prop.type,
      };

      if (prop.description) {
        propSchema.description = prop.description;
      }

      if (prop.enum && prop.enum.length > 0) {
        propSchema.enum = prop.enum;
      }

      // Recursive handling for arrays
      if (prop.type === 'array' && prop.items) {
        if (prop.items.type === 'object' && prop.items.properties) {
          // Array of objects - recursively generate schema
          propSchema.items = generateSchema(prop.items.properties);
        } else {
          // Array of primitives
          propSchema.items = { type: prop.items.type };
        }
      }

      // Recursive handling for objects
      if (prop.type === 'object' && prop.properties) {
        const nested = generateSchema(prop.properties);
        propSchema.properties = nested.properties;
        if (nested.required && nested.required.length > 0) {
          propSchema.required = nested.required;
        }
      }

      schema.properties[prop.name] = propSchema;

      if (prop.required) {
        schema.required.push(prop.name);
      }
    });

    if (schema.required.length === 0) {
      delete schema.required;
    }

    return schema;
  };

  // Convert PropertyTemplateItem to SchemaProperty
  const convertTemplateToSchemaProperty = (templateItem: PropertyTemplateItem): SchemaProperty => {
    const schemaProp: SchemaProperty = {
      id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: templateItem.name,
      type: templateItem.type,
      required: templateItem.required,
      description: templateItem.description,
    };

    // Handle arrays
    if (templateItem.type === 'array' && templateItem.items) {
      schemaProp.items = {
        type: templateItem.items.type,
      };

      // Array of objects - convert nested properties recursively
      if (templateItem.items.type === 'object' && templateItem.items.properties) {
        schemaProp.items.properties = templateItem.items.properties.map((nestedItem) =>
          convertTemplateToSchemaProperty(nestedItem)
        );
      }
    }

    // Handle objects - convert nested properties recursively
    if (templateItem.type === 'object' && templateItem.properties) {
      schemaProp.properties = templateItem.properties.map((nestedItem) =>
        convertTemplateToSchemaProperty(nestedItem)
      );
    }

    return schemaProp;
  };

  // Update parent whenever properties change
  const updateSchema = (newProps: SchemaProperty[]) => {
    setProperties(newProps);
    const schema = generateSchema(newProps);
    onChange(schema);
  };

  const addProperty = () => {
    const newProp: SchemaProperty = {
      id: `prop_${Date.now()}`,
      name: '',
      type: 'string',
      required: false,
    };
    updateSchema([...properties, newProp]);
  };

  const removeProperty = (id: string) => {
    updateSchema(properties.filter((p) => p.id !== id));
  };

  const updateProperty = (id: string, updates: Partial<SchemaProperty>) => {
    updateSchema(properties.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const duplicateProperty = (id: string) => {
    const prop = properties.find((p) => p.id === id);
    if (!prop) return;

    const duplicate: SchemaProperty = {
      ...JSON.parse(JSON.stringify(prop)), // Deep clone
      id: `prop_${Date.now()}`,
      name: `${prop.name}_copy`,
    };

    const index = properties.findIndex((p) => p.id === id);
    const newProps = [...properties];
    newProps.splice(index + 1, 0, duplicate);
    updateSchema(newProps);
  };

  const applyPropertyTemplate = (propertyId: string, template: PropertyTemplate) => {
    const templateProperty = convertTemplateToSchemaProperty(template.structure);

    updateSchema(properties.map((p) => {
      if (p.id === propertyId) {
        return templateProperty;
      }
      return p;
    }));

    setTemplateConfirmation(null);
  };

  const handleTemplateRequest = (propertyId: string, propertyName: string) => {
    const template = getPropertyTemplate(propertyName);
    if (template && template.autoPopulate) {
      setTemplateConfirmation({
        template,
        propertyId,
        onConfirm: () => applyPropertyTemplate(propertyId, template),
      });
    }
  };

  const applyPreset = (preset: SchemaPreset) => {
    const parsed = parseSchemaToProperties(preset.schema);
    updateSchema(parsed);
    setShowPresets(false);
  };

  return (
    <div className="space-y-4">
      {/* Preset Selector */}
      <div>
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center gap-2 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          <FileJson className="h-4 w-4" />
          {showPresets ? 'Hide Templates' : 'Start from Template'}
        </button>

        {showPresets && (
          <div className="mt-3 grid gap-2">
            {SCHEMA_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-3 hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-pointer"
                onClick={() => applyPreset(preset)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 text-sm">{preset.name}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      preset.category === 'simple' ? 'bg-green-100 text-green-700' :
                      preset.category === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {preset.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{preset.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Property Button */}
      <div>
        <button
          type="button"
          onClick={addProperty}
          className="flex items-center gap-2 rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 hover:border-indigo-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Property
        </button>
      </div>

      {/* Properties List */}
      {properties.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Properties ({properties.length})</p>

          {properties.map((prop, index) => (
            <PropertyEditor
              key={prop.id}
              property={prop}
              index={index}
              level={0}
              onUpdate={(updates) => updateProperty(prop.id, updates)}
              onRemove={() => removeProperty(prop.id)}
              onDuplicate={() => duplicateProperty(prop.id)}
              onTemplateRequest={handleTemplateRequest}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {properties.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-600 mb-2">No properties defined yet</p>
          <p className="text-xs text-gray-500">Click "Add Property" or choose a template to start building your schema</p>
        </div>
      )}

      {/* Live Preview Toggle */}
      {properties.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            {showPreview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Live Preview
          </button>

          {showPreview && (
            <div className="mt-3">
              <JSONSchemaTreeView schema={generateSchema(properties)} title="Output Structure Preview" />
            </div>
          )}
        </div>
      )}

      {/* Template Confirmation Modal */}
      {templateConfirmation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50" onClick={() => setTemplateConfirmation(null)} />

          {/* Modal */}
          <div className="relative min-h-screen px-4 py-8 flex items-center justify-center">
            <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Zap className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Auto-populate Property Structure</h3>
                    <p className="text-sm text-gray-600 mt-0.5">
                      Would you like to auto-populate the structure for <span className="font-mono text-indigo-600">{templateConfirmation.template.propertyName}</span>?
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTemplateConfirmation(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Template Info */}
              <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Category:</span> {templateConfirmation.template.category}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-medium">Description:</span> {templateConfirmation.template.description}
                </p>
              </div>

              {/* Preview */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Structure Preview:</p>
                <div className="max-h-80 overflow-auto">
                  <JSONSchemaTreeView
                    schema={generateSchema([convertTemplateToSchemaProperty(templateConfirmation.template.structure)])}
                    title={templateConfirmation.template.propertyName}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setTemplateConfirmation(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={templateConfirmation.onConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Auto-populate Structure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Recursive Property Editor Component
 */
interface PropertyEditorProps {
  property: SchemaProperty;
  index: number;
  level: number;
  onUpdate: (updates: Partial<SchemaProperty>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onTemplateRequest?: (propertyId: string, propertyName: string) => void;
}

function PropertyEditor({ property, index, level, onUpdate, onRemove, onDuplicate, onTemplateRequest }: PropertyEditorProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Auto-expand first 2 levels
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [propertySearch, setPropertySearch] = useState('');
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const indent = level * 16; // 16px per level
  const borderColor = level === 0 ? 'border-blue-200' : level === 1 ? 'border-purple-200' : level === 2 ? 'border-indigo-200' : 'border-gray-200';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowPropertyDropdown(false);
      }
    };

    if (showPropertyDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }

    return undefined;
  }, [showPropertyDropdown]);

  // Filter properties based on search
  const filteredProperties = propertySearch
    ? searchProperties(propertySearch)
    : PROPERTY_NAME_OPTIONS.sort((a, b) => b.usageCount - a.usageCount);

  // Add nested property for objects
  const addNestedProperty = () => {
    const newProp: SchemaProperty = {
      id: `prop_${Date.now()}`,
      name: '',
      type: 'string',
      required: false,
    };
    onUpdate({
      properties: [...(property.properties || []), newProp],
    });
  };

  // Update nested property for objects
  const updateNestedProperty = (id: string, updates: Partial<SchemaProperty>) => {
    const updatedProperties = (property.properties || []).map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    onUpdate({ properties: updatedProperties });
  };

  // Remove nested property for objects
  const removeNestedProperty = (id: string) => {
    onUpdate({
      properties: (property.properties || []).filter((p) => p.id !== id),
    });
  };

  // Duplicate nested property for objects
  const duplicateNestedProperty = (id: string) => {
    const prop = (property.properties || []).find((p) => p.id === id);
    if (!prop) return;

    const duplicate: SchemaProperty = {
      ...JSON.parse(JSON.stringify(prop)),
      id: `prop_${Date.now()}`,
      name: `${prop.name}_copy`,
    };

    const idx = (property.properties || []).findIndex((p) => p.id === id);
    const newProps = [...(property.properties || [])];
    newProps.splice(idx + 1, 0, duplicate);
    onUpdate({ properties: newProps });
  };

  // Update array item properties
  const updateArrayItemProperties = (properties: SchemaProperty[]) => {
    onUpdate({
      items: {
        type: 'object',
        properties,
      },
    });
  };

  const addArrayItemProperty = () => {
    const newProp: SchemaProperty = {
      id: `prop_${Date.now()}`,
      name: '',
      type: 'string',
      required: false,
    };
    onUpdate({
      items: {
        type: 'object',
        properties: [...(property.items?.properties || []), newProp],
      },
    });
  };

  const updateArrayItemProperty = (id: string, updates: Partial<SchemaProperty>) => {
    const updatedProperties = (property.items?.properties || []).map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    updateArrayItemProperties(updatedProperties);
  };

  const removeArrayItemProperty = (id: string) => {
    updateArrayItemProperties((property.items?.properties || []).filter((p) => p.id !== id));
  };

  const duplicateArrayItemProperty = (id: string) => {
    const prop = (property.items?.properties || []).find((p) => p.id === id);
    if (!prop) return;

    const duplicate: SchemaProperty = {
      ...JSON.parse(JSON.stringify(prop)),
      id: `prop_${Date.now()}`,
      name: `${prop.name}_copy`,
    };

    const idx = (property.items?.properties || []).findIndex((p) => p.id === id);
    const newProps = [...(property.items?.properties || [])];
    newProps.splice(idx + 1, 0, duplicate);
    updateArrayItemProperties(newProps);
  };

  return (
    <div className={`rounded-lg border ${borderColor} bg-white shadow-sm overflow-hidden`} style={{ marginLeft: indent }}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronUp className="h-4 w-4 text-gray-500" />}
          <span className="text-sm font-medium text-gray-900">{property.name || `Property ${index + 1}`}</span>
          {property.required && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Required</span>}
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{property.type}</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onDuplicate}
            className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
            title="Duplicate property"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Remove property"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {/* Property Name - Searchable Dropdown */}
          <div ref={dropdownRef} className="relative">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Property Name * <span className="text-gray-500 font-normal">(127 options available)</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={property.name || propertySearch}
                onChange={(e) => {
                  setPropertySearch(e.target.value);
                  if (!property.name) {
                    setShowPropertyDropdown(true);
                  }
                }}
                onFocus={() => setShowPropertyDropdown(true)}
                placeholder="Search property name... (e.g., title, description)"
                className="w-full rounded border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
              />
            </div>

            {/* Dropdown */}
            {showPropertyDropdown && filteredProperties.length > 0 && (
              <div className="absolute z-20 mt-1 w-full max-h-80 overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
                {/* Render by category */}
                {PROPERTY_CATEGORIES.map((category) => {
                  const categoryOptions = filteredProperties.filter((opt) => opt.category === category.id);
                  if (categoryOptions.length === 0) return null;

                  return (
                    <div key={category.id}>
                      <div className="sticky top-0 bg-gradient-to-r from-gray-100 to-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 border-b border-gray-200 z-10">
                        <span className="mr-1">{category.icon}</span>
                        {category.label} ({categoryOptions.length})
                      </div>
                      {categoryOptions.slice(0, 5).map((opt) => {
                        const hasTemplate = hasAutoPopulateTemplate(opt.value);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              onUpdate({ name: opt.value });
                              setPropertySearch('');
                              setShowPropertyDropdown(false);

                              // Trigger template request if available
                              if (hasTemplate && onTemplateRequest) {
                                onTemplateRequest(property.id, opt.value);
                              }
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 border-b border-gray-100 last:border-0 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-medium text-gray-900">{opt.label}</span>
                              <div className="flex items-center gap-1">
                                {hasTemplate && (
                                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    <Zap className="h-3 w-3" />
                                    Auto-fills
                                  </span>
                                )}
                                {opt.usageCount > 5 && (
                                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                                    ★ Popular
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">×{opt.usageCount}</span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">{opt.description}</div>
                          </button>
                        );
                      })}
                      {categoryOptions.length > 5 && (
                        <div className="px-3 py-1 text-xs text-gray-500 italic bg-gray-50">
                          +{categoryOptions.length - 5} more...
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Custom option */}
                {propertySearch && !PROPERTY_NAME_OPTIONS.find((opt) => opt.value === propertySearch) && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdate({ name: propertySearch });
                      setPropertySearch('');
                      setShowPropertyDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2.5 text-sm bg-yellow-50 hover:bg-yellow-100 border-t-2 border-yellow-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-700">💡 Use custom:</span>
                      <span className="font-mono font-semibold text-gray-900">{propertySearch}</span>
                    </div>
                    <div className="text-xs text-yellow-600 mt-0.5">Create a new property name (not in database)</div>
                  </button>
                )}
              </div>
            )}

            {property.name && (
              <div className="mt-1.5 flex items-start gap-2 text-xs">
                <div className="flex-1">
                  <span className="text-gray-600">Selected: </span>
                  <span className="font-mono font-medium text-indigo-600">{property.name}</span>
                  {PROPERTY_NAME_OPTIONS.find((opt) => opt.value === property.name) && (
                    <div className="text-gray-500 mt-0.5">
                      {PROPERTY_NAME_OPTIONS.find((opt) => opt.value === property.name)?.description}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUpdate({ name: '' });
                    setPropertySearch('');
                    setShowPropertyDropdown(true);
                  }}
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded px-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Type and Required */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                value={property.type}
                onChange={(e) => {
                  const newType = e.target.value as any;
                  const updates: Partial<SchemaProperty> = { type: newType };

                  // Initialize defaults for new types
                  if (newType === 'array' && !property.items) {
                    updates.items = { type: 'string' };
                  } else if (newType === 'object' && !property.properties) {
                    updates.properties = [];
                  }

                  onUpdate(updates);
                }}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={property.required}
                  onChange={(e) => onUpdate({ required: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Required</span>
              </label>
            </div>
          </div>

          {/* Array Item Type */}
          {property.type === 'array' && (
            <div className="border-t border-gray-200 pt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Array Item Type</label>
              <select
                value={property.items?.type || 'string'}
                onChange={(e) => {
                  const itemType = e.target.value as any;
                  onUpdate({
                    items: itemType === 'object' ? { type: itemType, properties: [] } : { type: itemType },
                  });
                }}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="object">Object (with properties)</option>
              </select>

              {/* Array of Objects - Nested Properties */}
              {property.items?.type === 'object' && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-700">Object Properties</p>
                    <button
                      type="button"
                      onClick={addArrayItemProperty}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                    >
                      <Plus className="h-3 w-3" />
                      Add Property
                    </button>
                  </div>

                  {(property.items.properties || []).length === 0 && (
                    <p className="text-xs text-gray-500 italic">No properties defined for array items</p>
                  )}

                  {(property.items.properties || []).map((nestedProp, idx) => (
                    <PropertyEditor
                      key={nestedProp.id}
                      property={nestedProp}
                      index={idx}
                      level={level + 1}
                      onUpdate={(updates) => updateArrayItemProperty(nestedProp.id, updates)}
                      onRemove={() => removeArrayItemProperty(nestedProp.id)}
                      onDuplicate={() => duplicateArrayItemProperty(nestedProp.id)}
                      onTemplateRequest={onTemplateRequest}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Object - Nested Properties */}
          {property.type === 'object' && (
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-700">Nested Properties</p>
                <button
                  type="button"
                  onClick={addNestedProperty}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                >
                  <Plus className="h-3 w-3" />
                  Add Property
                </button>
              </div>

              {(property.properties || []).length === 0 && (
                <p className="text-xs text-gray-500 italic">No nested properties defined</p>
              )}

              {(property.properties || []).map((nestedProp, idx) => (
                <PropertyEditor
                  key={nestedProp.id}
                  property={nestedProp}
                  index={idx}
                  level={level + 1}
                  onUpdate={(updates) => updateNestedProperty(nestedProp.id, updates)}
                  onRemove={() => removeNestedProperty(nestedProp.id)}
                  onDuplicate={() => duplicateNestedProperty(nestedProp.id)}
                  onTemplateRequest={onTemplateRequest}
                />
              ))}
            </div>
          )}

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-indigo-600 hover:text-indigo-700"
          >
            {showAdvanced ? '- Hide' : '+ Show'} advanced options
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-3 border-t border-gray-200 pt-3">
              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={property.description || ''}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  placeholder="Describe what this property contains..."
                  rows={2}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Enum Values (for string type) */}
              {property.type === 'string' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Enum Values (optional)</label>
                  <input
                    type="text"
                    value={property.enum?.join(', ') || ''}
                    onChange={(e) =>
                      onUpdate({
                        enum: e.target.value ? e.target.value.split(',').map((v) => v.trim()) : undefined,
                      })
                    }
                    placeholder="value1, value2, value3"
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                  <p className="mt-1 text-xs text-gray-500">Comma-separated allowed values</p>
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
 * Parse existing JSON schema into SchemaProperty[] recursively
 */
function parseSchemaToProperties(jsonSchema: any): SchemaProperty[] {
  if (!jsonSchema?.properties) return [];

  const properties: SchemaProperty[] = [];
  const required = jsonSchema.required || [];

  Object.entries(jsonSchema.properties).forEach(([name, propSchema]: [string, any]) => {
    const prop: SchemaProperty = {
      id: `prop_${Date.now()}_${Math.random()}`,
      name,
      type: propSchema.type || 'string',
      required: required.includes(name),
      description: propSchema.description,
      enum: propSchema.enum,
    };

    // Parse array items recursively
    if (prop.type === 'array' && propSchema.items) {
      if (propSchema.items.type === 'object' && propSchema.items.properties) {
        prop.items = {
          type: 'object',
          properties: parseSchemaToProperties(propSchema.items),
        };
      } else {
        prop.items = { type: propSchema.items.type || 'string' };
      }
    }

    // Parse nested object properties recursively
    if (prop.type === 'object' && propSchema.properties) {
      prop.properties = parseSchemaToProperties(propSchema);
    }

    properties.push(prop);
  });

  return properties;
}
