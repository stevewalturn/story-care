'use client';

/**
 * Create Quote Modal
 * Modal for creating new quotes
 */

import { useState } from 'react';

type CreateQuoteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  onSave: (quoteData: {
    quoteText: string;
    tags: string[];
    notes: string;
  }) => Promise<void>;
};

export function CreateQuoteModal({
  isOpen,
  onClose,
  patientId: _patientId,
  onSave,
}: CreateQuoteModalProps) {
  const [quoteText, setQuoteText] = useState('');
  const [tags, setTags] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSave = async () => {
    if (!quoteText.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        quoteText: quoteText.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
        notes: notes.trim(),
      });

      // Reset form
      setQuoteText('');
      setTags('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error creating quote:', error);
      alert('Failed to create quote. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setQuoteText('');
    setTags('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">New Quote</h2>
            <p className="mt-1 text-sm text-gray-500">
              Add a meaningful quote from therapy session
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 transition-colors hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {/* Quote Text */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Quote Text <span className="text-red-500">*</span>
            </label>
            <textarea
              value={quoteText}
              onChange={e => setQuoteText(e.target.value)}
              placeholder="Enter the quote text..."
              rows={6}
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">
              {quoteText.length}
              {' '}
              characters
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="e.g., breakthrough, metaphor, resistance"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Separate multiple tags with commas
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any context or notes about this quote..."
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !quoteText.trim()}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </>
                  )
                : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Quote
                    </>
                  )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
