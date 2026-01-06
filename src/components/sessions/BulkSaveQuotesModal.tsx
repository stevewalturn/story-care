'use client';

import type { PatientOption } from './SaveNoteModal';
import { ChevronDown, Quote, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';

type BulkSaveQuotesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  quotes: any[];
  patients: PatientOption[];
  onSave: (quoteData: { patientId: string }) => Promise<void>;
};

export function BulkSaveQuotesModal({
  isOpen,
  onClose,
  quotes,
  patients,
  onSave,
}: BulkSaveQuotesModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  useEffect(() => {
    if (patients.length > 0 && !selectedPatientId) {
      setSelectedPatientId(patients[0]!.id);
    }
  }, [patients, selectedPatientId]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handleSave = async () => {
    if (!selectedPatientId) {
      alert('Please select a patient');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({ patientId: selectedPatientId });
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
          {/* Patient Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Patient
              {' '}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                onClick={() => setShowPatientDropdown(!showPatientDropdown)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left text-sm transition-colors hover:border-purple-500"
              >
                <span className="text-gray-900">
                  {selectedPatient
                    ? selectedPatient.name
                    : 'Select a patient'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {/* Patient Dropdown */}
              {showPatientDropdown && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {patients.map(patient => (
                    <button
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatientId(patient.id);
                        setShowPatientDropdown(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-purple-50"
                    >
                      <div className="font-medium text-gray-900">
                        {patient.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quotes Preview */}
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
                    <div className="flex-1 space-y-1">
                      <p className="text-sm text-gray-900">
                        "
                        {quote.quote_text || quote.text}
                        "
                      </p>
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Banner */}
          <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <p>
              All
              {' '}
              {quotes.length}
              {' '}
              quotes will be saved to the selected
              patient's library. You can view and manage them in the Library
              panel.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !selectedPatientId}>
            {isSaving ? 'Saving...' : `Save ${quotes.length} Quotes`}
          </Button>
        </div>
      </div>
    </div>
  );
}
