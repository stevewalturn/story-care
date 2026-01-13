'use client';

import type { PatientOption } from './SaveNoteModal';
import { Check, ChevronDown, Quote, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';

export type QuoteWithPatient = {
  quoteIndex: number;
  patientId: string;
};

// Format seconds to MM:SS
const formatTime = (seconds: number | undefined): string => {
  if (seconds === undefined) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

type BulkSaveQuotesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  quotes: any[];
  patients: PatientOption[];
  onSave: (quotePatientMappings: QuoteWithPatient[]) => Promise<void>;
};

export function BulkSaveQuotesModal({
  isOpen,
  onClose,
  quotes,
  patients,
  onSave,
}: BulkSaveQuotesModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [quotePatientSelections, setQuotePatientSelections] = useState<Record<number, string>>({});
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
  const [excludedQuotes, setExcludedQuotes] = useState<Set<number>>(new Set());

  // Initialize patient selections when quotes or patients change
  useEffect(() => {
    if (patients.length > 0 && quotes.length > 0) {
      const initialSelections: Record<number, string> = {};
      quotes.forEach((quote, index) => {
        // Try to match AI-suggested patient_name to actual patient
        let matchedPatient = quote.patient_name
          ? patients.find(p => p.name.toLowerCase() === quote.patient_name.toLowerCase())
          : null;

        // If no patient_name match, try matching speaker to patient
        if (!matchedPatient && quote.speaker) {
          matchedPatient = patients.find(p => p.name.toLowerCase() === quote.speaker.toLowerCase());
        }

        // Use matched patient if found, otherwise default to first patient
        initialSelections[index] = matchedPatient?.id || patients[0]!.id;
      });
      setQuotePatientSelections(initialSelections);
      setExcludedQuotes(new Set()); // Reset excluded quotes
    }
  }, [patients, quotes]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveDropdownIndex(null);
    }
  }, [isOpen]);

  const getSelectedPatient = (index: number) => {
    const patientId = quotePatientSelections[index];
    return patients.find(p => p.id === patientId);
  };

  const handlePatientChange = (quoteIndex: number, patientId: string) => {
    setQuotePatientSelections(prev => ({ ...prev, [quoteIndex]: patientId }));
    setActiveDropdownIndex(null);
  };

  const handleRemoveQuote = (index: number) => {
    setExcludedQuotes(prev => new Set(prev).add(index));
    setActiveDropdownIndex(null);
  };

  const handleRestoreQuote = (index: number) => {
    setExcludedQuotes((prev) => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  // Get active (non-excluded) quotes
  const activeQuoteIndices = quotes
    .map((_, index) => index)
    .filter(index => !excludedQuotes.has(index));

  const activeQuoteCount = activeQuoteIndices.length;

  const allActiveQuotesHavePatient = activeQuoteCount > 0
    && activeQuoteIndices.every(index => quotePatientSelections[index]);

  const handleSave = async () => {
    if (!allActiveQuotesHavePatient) {
      alert('Please select a patient for all quotes');
      return;
    }

    if (activeQuoteCount === 0) {
      alert('No quotes to save');
      return;
    }

    try {
      setIsSaving(true);
      const quotePatientMappings: QuoteWithPatient[] = activeQuoteIndices.map(index => ({
        quoteIndex: index,
        patientId: quotePatientSelections[index]!,
      }));
      await onSave(quotePatientMappings);
      onClose();
    }
    catch (error) {
      console.error('Error saving quotes:', error);
      alert('Failed to save quotes. Please try again.');
    }
    finally {
      setIsSaving(false);
    }
  };

  if (!isOpen)
    return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Quote className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Save
              {' '}
              {activeQuoteCount}
              {' '}
              Quote
              {activeQuoteCount !== 1 ? 's' : ''}
              {excludedQuotes.size > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (
                  {excludedQuotes.size}
                  {' '}
                  removed)
                </span>
              )}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-4">
          {/* No patients warning */}
          {patients.length === 0 && (
            <div className="rounded-lg bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
              <p>No patients available. Please add patients to this session first.</p>
            </div>
          )}

          {/* Quotes with per-quote patient selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Quotes to Save
            </label>
            <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
              {quotes.map((quote, index) => {
                const isExcluded = excludedQuotes.has(index);

                return (
                  <div
                    key={index}
                    className={`rounded-lg border bg-white p-3 transition-opacity ${
                      isExcluded
                        ? 'border-gray-100 opacity-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Quote className={`mt-0.5 h-4 w-4 flex-shrink-0 ${isExcluded ? 'text-gray-400' : 'text-purple-600'}`} />
                      <div className="flex-1 space-y-2">
                        {/* Quote text */}
                        <p className={`text-sm ${isExcluded ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          "
                          {quote.quote_text || quote.text}
                          "
                        </p>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span>
                            Speaker:
                            {' '}
                            {quote.speaker || 'Unknown'}
                          </span>
                          {/* Timestamp display */}
                          {(quote.start_time_seconds !== undefined || quote.timestamp?.start !== undefined) && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-purple-600">
                                {formatTime(quote.start_time_seconds ?? quote.timestamp?.start)}
                                {(quote.end_time_seconds !== undefined || quote.timestamp?.end !== undefined) && (
                                  <>
                                    {' - '}
                                    {formatTime(quote.end_time_seconds ?? quote.timestamp?.end)}
                                  </>
                                )}
                              </span>
                            </>
                          )}
                          {quote.tags && quote.tags.length > 0 && (
                            <>
                              <span>•</span>
                              <span>
                                Tags:
                                {' '}
                                {quote.tags.join(', ')}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Per-quote patient selector and remove button */}
                        {!isExcluded && patients.length > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <button
                                onClick={() => setActiveDropdownIndex(activeDropdownIndex === index ? null : index)}
                                className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs transition-colors hover:border-purple-300 hover:bg-purple-50"
                              >
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-600">
                                  {getSelectedPatient(index)?.name?.charAt(0) || '?'}
                                </div>
                                <span className="max-w-[120px] truncate text-gray-700">
                                  {getSelectedPatient(index)?.name || 'Select patient'}
                                </span>
                                <ChevronDown className="h-3 w-3 text-gray-400" />
                              </button>

                              {/* Patient dropdown */}
                              {activeDropdownIndex === index && (
                                <div className="absolute left-0 z-20 mt-1 min-w-[180px] rounded-lg border border-gray-200 bg-white shadow-lg">
                                  {patients.map(patient => (
                                    <button
                                      key={patient.id}
                                      onClick={() => handlePatientChange(index, patient.id)}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-purple-50"
                                    >
                                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-600">
                                        {patient.name.charAt(0)}
                                      </div>
                                      <span className="flex-1 truncate">{patient.name}</span>
                                      {quotePatientSelections[index] === patient.id && (
                                        <Check className="h-3 w-3 flex-shrink-0 text-purple-600" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Remove button */}
                            <button
                              onClick={() => handleRemoveQuote(index)}
                              className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                              title="Remove quote"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Restore button for excluded quotes */}
                        {isExcluded && (
                          <button
                            onClick={() => handleRestoreQuote(index)}
                            className="text-xs text-purple-600 hover:text-purple-700 hover:underline"
                          >
                            Restore quote
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Banner */}
          <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <p>
              Each quote will be saved to its assigned patient's library.
              You can view and manage them in the Library panel.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !allActiveQuotesHavePatient || patients.length === 0 || activeQuoteCount === 0}>
            {isSaving ? 'Saving...' : `Save ${activeQuoteCount} Quote${activeQuoteCount !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
