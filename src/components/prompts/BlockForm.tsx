'use client';

/**
 * BlockForm Component
 *
 * Dynamic form for configuring a single building block instance
 * Renders fields based on block definition and handles validation
 */

import { useState, useEffect } from 'react';
import {
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Edit2,
} from 'lucide-react';
import type { BlockInstance, BlockField, ValidationError } from '@/types/BuildingBlocks';
import { getBlockDefinition } from '@/config/BlockDefinitions';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface BlockFormProps {
  blockId: string;
  instance: BlockInstance;
  onChange: (values: Record<string, any>, customLabels?: Record<string, string>) => void;
  onRemove: () => void;
  onDuplicate?: () => void;
  onCollapse?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  errors?: ValidationError[];
  isFirst?: boolean;
  isLast?: boolean;
}

export default function BlockForm({
  blockId: _blockId,
  instance,
  onChange,
  onRemove,
  onDuplicate,
  onCollapse,
  onMoveUp,
  onMoveDown,
  errors = [],
  isFirst = false,
  isLast = false,
}: BlockFormProps) {
  const definition = getBlockDefinition(instance.blockId);
  const [localValues, setLocalValues] = useState(instance.values);
  const [customLabels, setCustomLabels] = useState<Record<string, string>>(instance.customLabels || {});
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [tempLabel, setTempLabel] = useState('');

  // Update local values when instance changes
  useEffect(() => {
    setLocalValues(instance.values);
    setCustomLabels(instance.customLabels || {});
  }, [instance.values, instance.customLabels]);

  if (!definition) {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4">
        <p className="text-sm text-red-600">Unknown block type: {instance.blockId}</p>
      </div>
    );
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    const newValues = { ...localValues, [fieldId]: value };
    setLocalValues(newValues);
    onChange(newValues, customLabels);
  };

  const handleLabelEdit = (fieldId: string, currentLabel: string) => {
    setEditingLabel(fieldId);
    setTempLabel(customLabels[fieldId] || currentLabel);
  };

  const handleLabelSave = (fieldId: string) => {
    const newLabels = { ...customLabels, [fieldId]: tempLabel };
    setCustomLabels(newLabels);
    onChange(localValues, newLabels);
    setEditingLabel(null);
  };

  const handleLabelCancel = () => {
    setEditingLabel(null);
    setTempLabel('');
  };

  const getFieldLabel = (field: BlockField): string => {
    return customLabels[field.id] || field.label;
  };

  const getFieldErrors = (fieldId: string): ValidationError[] => {
    return errors.filter(error => error.field === fieldId);
  };

  const renderEditableLabel = (field: BlockField) => (
    <div className="flex items-center gap-2">
      {editingLabel === field.id ? (
        <div className="flex flex-1 items-center gap-1">
          <input
            type="text"
            value={tempLabel}
            onChange={(e) => setTempLabel(e.target.value)}
            className="flex-1 rounded border border-indigo-300 px-2 py-0.5 text-sm font-medium text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLabelSave(field.id);
              if (e.key === 'Escape') handleLabelCancel();
            }}
          />
          <button
            onClick={() => handleLabelSave(field.id)}
            className="rounded px-2 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
            type="button"
          >
            Save
          </button>
          <button
            onClick={handleLabelCancel}
            className="rounded px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
            type="button"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <label className="block text-sm font-medium text-gray-700">
            {getFieldLabel(field)}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <button
            onClick={() => handleLabelEdit(field.id, field.label)}
            className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
            type="button"
            title="Edit field label"
          >
            <Edit2 className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  );

  const renderField = (field: BlockField) => {
    const value = localValues[field.id] ?? field.defaultValue ?? '';
    const fieldErrors = getFieldErrors(field.id);
    const hasError = fieldErrors.length > 0;

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-1">
            {renderEditableLabel(field)}
            <Input
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={hasError ? 'border-red-500' : ''}
            />
            {field.helpText && !hasError && (
              <p className="text-xs text-gray-500">{field.helpText}</p>
            )}
            {hasError && fieldErrors[0] && (
              <div className="flex items-start gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{fieldErrors[0].message}</span>
              </div>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-1">
            {renderEditableLabel(field)}
            <textarea
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
              className={`w-full rounded-lg border ${
                hasError ? 'border-red-500' : 'border-gray-300'
              } px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            />
            {field.validation?.maxLength && (
              <p className="text-xs text-gray-500 text-right">
                {value.length} / {field.validation.maxLength}
              </p>
            )}
            {field.helpText && !hasError && (
              <p className="text-xs text-gray-500">{field.helpText}</p>
            )}
            {hasError && fieldErrors[0] && (
              <div className="flex items-start gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{fieldErrors[0].message}</span>
              </div>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-1">
            {renderEditableLabel(field)}
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={`w-full rounded-lg border ${
                hasError ? 'border-red-500' : 'border-gray-300'
              } px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
            >
              {!field.required && <option value="">-- Select --</option>}
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {field.helpText && !hasError && (
              <p className="text-xs text-gray-500">{field.helpText}</p>
            )}
            {hasError && fieldErrors[0] && (
              <div className="flex items-start gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{fieldErrors[0].message}</span>
              </div>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-1">
            {renderEditableLabel(field)}
            <Input
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.id, Number(e.target.value))}
              placeholder={field.placeholder}
              min={field.validation?.min}
              max={field.validation?.max}
              className={hasError ? 'border-red-500' : ''}
            />
            {field.helpText && !hasError && (
              <p className="text-xs text-gray-500">{field.helpText}</p>
            )}
            {hasError && fieldErrors[0] && (
              <div className="flex items-start gap-1 text-xs text-red-600">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{fieldErrors[0].message}</span>
              </div>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div key={field.id} className="space-y-1">
            {editingLabel === field.id ? (
              <div className="flex items-center gap-1 mb-2">
                <input
                  type="text"
                  value={tempLabel}
                  onChange={(e) => setTempLabel(e.target.value)}
                  className="flex-1 rounded border border-indigo-300 px-2 py-0.5 text-sm font-medium text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLabelSave(field.id);
                    if (e.key === 'Escape') handleLabelCancel();
                  }}
                />
                <button
                  onClick={() => handleLabelSave(field.id)}
                  className="rounded px-2 py-0.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                  type="button"
                >
                  Save
                </button>
                <button
                  onClick={handleLabelCancel}
                  className="rounded px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  type="button"
                >
                  Cancel
                </button>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value === true}
                  onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">{getFieldLabel(field)}</span>
              </label>
              {editingLabel !== field.id && (
                <button
                  onClick={() => handleLabelEdit(field.id, field.label)}
                  className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                  type="button"
                  title="Edit field label"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              )}
            </div>
            {field.helpText && (
              <p className="text-xs text-gray-500 ml-6">{field.helpText}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
            <span className="text-lg">{definition.icon === 'image' ? '🖼️' :
              definition.icon === 'video' ? '🎬' :
              definition.icon === 'music' ? '🎵' :
              definition.icon === 'quote' ? '💬' :
              definition.icon === 'file-text' ? '📝' :
              definition.icon === 'help-circle' ? '💭' :
              definition.icon === 'list-checks' ? '📋' :
              definition.icon === 'film' ? '🎬' :
              definition.icon === 'play-circle' ? '▶️' :
              definition.icon === 'layers' ? '📚' :
              '✨'}</span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{definition.label}</h4>
            <p className="text-xs text-gray-500">{definition.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Move buttons */}
          {onMoveUp && !isFirst && (
            <button
              onClick={onMoveUp}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Move up"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          )}
          {onMoveDown && !isLast && (
            <button
              onClick={onMoveDown}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Move down"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              title="Duplicate"
            >
              <Copy className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onRemove}
            className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
            title="Remove"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {definition.fields.map(field => renderField(field))}
      </div>

      {/* Footer */}
      {onCollapse && (
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            onClick={onCollapse}
            className="text-sm"
          >
            Collapse
          </Button>
        </div>
      )}
    </div>
  );
}
