'use client';

import type { PatientOption } from './SaveNoteModal';
import type { ExtractedQuote } from '@/app/api/ai/extract-quotes/route';
import { Check, ChevronDown, Loader2, Play, Quote, RefreshCw, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedPost } from '@/utils/AuthenticatedFetch';

type AIQuoteExtractorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  messageContent: string;
  patients: PatientOption[];
  sessionId: string;
  onSave: (quotes: Array<{
    patientId: string;
    quoteText: string;
    speaker: string;
    startTimeSeconds?: number;
    endTimeSeconds?: number;
  }>) => Promise<void>;
  onJumpToTimestamp?: (timestamp: number) => void;
};

export function AIQuoteExtractorModal({
  isOpen,
  onClose,
  messageContent,
  patients,
  sessionId,
  onSave,
  onJumpToTimestamp,
}: AIQuoteExtractorModalProps) {
  const { user } = useAuth();
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedQuotes, setExtractedQuotes] = useState<ExtractedQuote[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [quotePatientSelections, setQuotePatientSelections] = useState<Record<number, string>>({});
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Extract quotes when modal opens
  const extractQuotes = useCallback(async () => {
    if (!messageContent.trim()) {
      setError('No content to extract quotes from');
      return;
    }

    if (!user) {
      setError('Authentication required');
      return;
    }

    setIsExtracting(true);
    setError(null);

    try {
      const response = await authenticatedPost('/api/ai/extract-quotes', user, {
        text: messageContent,
      });

      if (!response.ok) {
        throw new Error('Failed to extract quotes');
      }

      const data = await response.json();
      const quotes = data.quotes || [];

      setExtractedQuotes(quotes);

      // Select all quotes by default
      setSelectedIndices(new Set(quotes.map((_: ExtractedQuote, i: number) => i)));

      // Initialize patient selections
      if (patients.length > 0) {
        const initialSelections: Record<number, string> = {};
        quotes.forEach((quote: ExtractedQuote, index: number) => {
          // Try to match speaker to patient
          const matchedPatient = quote.speaker
            ? patients.find(p => p.name.toLowerCase() === quote.speaker.toLowerCase())
            : null;
          initialSelections[index] = matchedPatient?.id || patients[0]!.id;
        });
        setQuotePatientSelections(initialSelections);
      }
    } catch (err) {
      console.error('Error extracting quotes:', err);
      setError('Failed to extract quotes. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  }, [messageContent, patients, user]);

  // Extract quotes when modal opens
  useEffect(() => {
    if (isOpen && messageContent) {
      extractQuotes();
    }
  }, [isOpen, messageContent, extractQuotes]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setExtractedQuotes([]);
      setSelectedIndices(new Set());
      setQuotePatientSelections({});
      setActiveDropdownIndex(null);
      setError(null);
    }
  }, [isOpen]);

  const toggleQuoteSelection = (index: number) => {
    setSelectedIndices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getSelectedPatient = (index: number) => {
    const patientId = quotePatientSelections[index];
    return patients.find(p => p.id === patientId);
  };

  const handlePatientChange = (quoteIndex: number, patientId: string) => {
    setQuotePatientSelections(prev => ({ ...prev, [quoteIndex]: patientId }));
    setActiveDropdownIndex(null);
  };

  const handleSave = async () => {
    const selectedQuotes = extractedQuotes
      .filter((_, index) => selectedIndices.has(index))
      .map((quote, originalIndex) => {
        // Find the actual index in extractedQuotes for patient selection lookup
        const actualIndex = extractedQuotes.indexOf(quote);
        return {
          patientId: quotePatientSelections[actualIndex] || patients[0]?.id || '',
          quoteText: quote.quoteText,
          speaker: quote.speaker || 'Unknown',
          startTimeSeconds: quote.timestampSeconds,
          endTimeSeconds: undefined,
        };
      });

    if (selectedQuotes.length === 0) {
      return;
    }

    try {
      setIsSaving(true);
      await onSave(selectedQuotes);
      onClose();
    } catch (err) {
      console.error('Error saving quotes:', err);
      setError('Failed to save quotes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCount = selectedIndices.size;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Quote className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Extract Quotes from AI Response
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
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {/* Loading State */}
          {isExtracting && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <p className="mt-4 text-sm text-gray-600">Analyzing message for quotes...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isExtracting && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                  <button
                    onClick={extractQuotes}
                    className="mt-2 flex items-center gap-1 text-sm font-medium text-red-700 hover:text-red-800"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* No Quotes Found */}
          {!isExtracting && !error && extractedQuotes.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
              <Quote className="mx-auto h-8 w-8 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-900">No quotes detected</p>
              <p className="mt-1 text-xs text-gray-500">
                The AI couldn't find any quotes in this message.
              </p>
              <button
                onClick={extractQuotes}
                className="mt-4 flex items-center gap-1 mx-auto text-sm font-medium text-purple-600 hover:text-purple-700"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            </div>
          )}

          {/* No Patients Warning */}
          {!isExtracting && patients.length === 0 && extractedQuotes.length > 0 && (
            <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
              <p>No patients available. Please add patients to this session first.</p>
            </div>
          )}

          {/* Extracted Quotes */}
          {!isExtracting && !error && extractedQuotes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Found {extractedQuotes.length} quote{extractedQuotes.length !== 1 ? 's' : ''}
                </p>
                <button
                  onClick={() => {
                    if (selectedIndices.size === extractedQuotes.length) {
                      setSelectedIndices(new Set());
                    } else {
                      setSelectedIndices(new Set(extractedQuotes.map((_, i) => i)));
                    }
                  }}
                  className="text-xs font-medium text-purple-600 hover:text-purple-700"
                >
                  {selectedIndices.size === extractedQuotes.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-3">
                {extractedQuotes.map((quote, index) => {
                  const isSelected = selectedIndices.has(index);
                  const selectedPatient = getSelectedPatient(index);

                  return (
                    <div
                      key={index}
                      className={`rounded-lg border p-4 transition-colors ${
                        isSelected
                          ? 'border-purple-300 bg-purple-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleQuoteSelection(index)}
                          className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                            isSelected
                              ? 'border-purple-600 bg-purple-600 text-white'
                              : 'border-gray-300 bg-white hover:border-purple-400'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          {/* Quote Text */}
                          <p className={`text-sm leading-relaxed ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                            "{quote.quoteText}"
                          </p>

                          {/* Metadata */}
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-gray-500">
                              Speaker: <span className="font-medium text-gray-700">{quote.speaker || 'Unknown'}</span>
                            </span>

                            {/* Timestamp with Jump Button */}
                            {quote.timestampDisplay && (
                              <>
                                <span className="text-gray-300">•</span>
                                <button
                                  onClick={() => {
                                    if (onJumpToTimestamp && quote.timestampSeconds !== undefined) {
                                      onJumpToTimestamp(quote.timestampSeconds);
                                    }
                                  }}
                                  disabled={!onJumpToTimestamp || quote.timestampSeconds === undefined}
                                  className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 font-medium text-purple-700 transition-colors hover:bg-purple-200 disabled:cursor-default disabled:opacity-50"
                                >
                                  <Play className="h-3 w-3" />
                                  {quote.timestampDisplay}
                                </button>
                              </>
                            )}

                            {/* Context */}
                            {quote.context && (
                              <>
                                <span className="text-gray-300">•</span>
                                <span className="text-gray-500 italic">{quote.context}</span>
                              </>
                            )}
                          </div>

                          {/* Patient Selector */}
                          {isSelected && patients.length > 0 && (
                            <div className="mt-3 flex items-center gap-2">
                              <span className="text-xs text-gray-500">Save to:</span>
                              <div className="relative">
                                <button
                                  onClick={() => setActiveDropdownIndex(activeDropdownIndex === index ? null : index)}
                                  className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs transition-colors hover:border-purple-300"
                                >
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-600">
                                    {selectedPatient?.name?.charAt(0) || '?'}
                                  </div>
                                  <span className="max-w-[120px] truncate text-gray-700">
                                    {selectedPatient?.name || 'Select patient'}
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
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <p className="text-sm text-gray-500">
            {selectedCount > 0 ? `${selectedCount} quote${selectedCount !== 1 ? 's' : ''} selected` : 'Select quotes to save'}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isSaving || isExtracting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving || isExtracting || selectedCount === 0 || patients.length === 0}
            >
              {isSaving ? 'Saving...' : `Save ${selectedCount} Quote${selectedCount !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
