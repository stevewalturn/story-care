'use client';

import { useState } from 'react';

type SaveQuoteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  onSave: (quoteData: {
    quoteText: string;
    priority: 'low' | 'medium' | 'high';
    tags: string[];
    notes: string;
  }) => Promise<void>;
};

export function SaveQuoteModal({
  isOpen,
  onClose,
  selectedText,
  onSave,
}: SaveQuoteModalProps) {
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [tags, setTags] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        quoteText: selectedText,
        priority,
        tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
        notes,
      });
      // Reset form
      setPriority('medium');
      setTags('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('Failed to save quote. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-lg shadow-xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Save Quote</h2>
            <p className="text-sm text-gray-500 mt-1">
              Add this quote to the patient's library with tags and notes
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Selected Quote */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected Quote
            </label>
            <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap italic">
                "{selectedText}"
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {selectedText.length} characters
            </p>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setPriority('low')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                  priority === 'low'
                    ? 'border-gray-400 bg-gray-50 text-gray-900 font-medium'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                Low
              </button>
              <button
                onClick={() => setPriority('medium')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                  priority === 'medium'
                    ? 'border-yellow-400 bg-yellow-50 text-yellow-900 font-medium'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setPriority('high')}
                className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                  priority === 'high'
                    ? 'border-red-400 bg-red-50 text-red-900 font-medium'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                High
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., breakthrough, metaphor, resistance"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple tags with commas
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this quote..."
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Quote
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
