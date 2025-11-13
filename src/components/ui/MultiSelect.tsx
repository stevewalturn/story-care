'use client';

/**
 * Multi-Select Dropdown Component
 * Allows selecting multiple items from a dropdown with checkboxes
 */

import { Check, ChevronDown, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type MultiSelectOption = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  label?: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
};

export function MultiSelect({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'Select items...',
  disabled = false,
  error,
  required = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Filter options based on search query
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Get selected option labels for display
  const selectedOptions = options.filter(option => selectedValues.includes(option.value));

  const handleToggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      // Remove from selection
      onChange(selectedValues.filter(v => v !== value));
    } else {
      // Add to selection
      onChange([...selectedValues, value]);
    }
  };

  const handleRemoveOption = (value: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onChange(selectedValues.filter(v => v !== value));
  };

  const handleSelectAll = () => {
    onChange(filteredOptions.map(opt => opt.value));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div className="relative" ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full rounded-lg border bg-white px-3 py-2 text-left transition-colors ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
          } ${disabled ? 'cursor-not-allowed bg-gray-100' : 'hover:border-gray-400'} focus:ring-opacity-20 focus:ring-2 focus:outline-none`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              {selectedOptions.length === 0 ? (
                <span className="text-gray-500">{placeholder}</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {selectedOptions.map(option => (
                    <span
                      key={option.value}
                      className="inline-flex items-center gap-1 rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"
                    >
                      {option.label}
                      {!disabled && (
                        <button
                          type="button"
                          onClick={e => handleRemoveOption(option.value, e)}
                          className="rounded hover:bg-indigo-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
            {/* Search Input */}
            <div className="border-b border-gray-200 p-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            {filteredOptions.length > 0 && (
              <div className="flex justify-between border-b border-gray-200 px-3 py-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-medium text-gray-600 hover:text-gray-700"
                >
                  Clear All
                </button>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-gray-500">
                  {searchQuery ? 'No matching options found' : 'No options available'}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleToggleOption(option.value)}
                      className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-900'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded border ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="flex-1">{option.label}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {selectedOptions.length > 0 && (
              <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500">
                {selectedOptions.length}
                {' '}
                item
                {selectedOptions.length !== 1 ? 's' : ''}
                {' '}
                selected
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
