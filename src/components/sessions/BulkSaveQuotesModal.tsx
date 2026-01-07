'use client';

import type { PatientOption } from './SaveNoteModal';
import { Check, ChevronDown, Quote, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';

export type QuoteWithPatient = {
  quoteIndex: number;
  patientId: string;
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

  // Initialize patient selections when quotes or patients change
  useEffect(() => {
    if (patients.length > 0 && quotes.length > 0) {
      const initialSelections: Record<number, string> = {};
      quotes.forEach((quote, index) => {
        // Try to match AI-suggested patient_name to actual patient
        const suggestedPatient = quote.patient_name
          ? patients.find(p => p.name.toLowerCase() === quote.patient_name.toLowerCase())
          : null;
        // Use AI suggestion if found, otherwise default to first patient
        initialSelections[index] = suggestedPatient?.id || patients[0]!.id;
      });
      setQuotePatientSelections(initialSelections);
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

  const allQuotesHavePatient = quotes.length > 0 && quotes.every((_, index) => quotePatientSelections[index]);

  const handleSave = async () => {
    if (!allQuotesHavePatient) {
      alert('Please select a patient for all quotes');
      return;
    }

    try {
      setIsSaving(true);
      const quotePatientMappings: QuoteWithPatient[] = quotes.map((_, index) => ({
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
              {quotes.length}
              {' '}
              Quotes
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
              {quotes.map((quote, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 bg-white p-3"
                >
                  <div className="flex items-start gap-2">
                    <Quote className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-600" />
                    <div className="flex-1 space-y-2">
                      {/* Quote text */}
                      <p className="text-sm text-gray-900">
                        "
                        {quote.quote_text || quote.text}
                        "
                      </p>

                      {/* Metadata row */}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>
                          Speaker:
                          {' '}
                          {quote.speaker || 'Unknown'}
                        </span>
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

                      {/* Per-quote patient selector */}
                      {patients.length > 0 && (
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
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
          <Button onClick={handleSave} disabled={isSaving || !allQuotesHavePatient || patients.length === 0}>
            {isSaving ? 'Saving...' : `Save ${quotes.length} Quotes`}
          </Button>
        </div>
      </div>
    </div>
  );
}
