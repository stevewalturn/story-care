'use client';

import type { PatientOption } from './SaveNoteModal';
import { ChevronDown, Quote, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '../ui/Button';

type SaveQuoteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  patients: PatientOption[];
  onSave: (quoteData: {
    patientId: string;
    quoteText: string;
    speaker: string;
  }) => Promise<void>;
};

export function SaveQuoteModal({
  isOpen,
  onClose,
  selectedText,
  patients,
  onSave,
}: SaveQuoteModalProps) {
  const [quoteText, setQuoteText] = useState(selectedText);
  const [speaker, setSpeaker] = useState('AI Assistant');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || '');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // Update selected patient when patients prop changes
  useEffect(() => {
    if (patients.length > 0 && !selectedPatientId) {
      const firstPatient = patients[0];
      if (firstPatient) {
        setSelectedPatientId(firstPatient.id);
      }
    }
  }, [patients, selectedPatientId]);

  // Update quote text when selectedText changes
  useEffect(() => {
    setQuoteText(selectedText);
  }, [selectedText]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  const handleSave = async () => {
    if (!quoteText.trim()) {
      alert('Quote text cannot be empty');
      return;
    }

    if (!selectedPatientId) {
      alert('Please select a patient');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        patientId: selectedPatientId,
        quoteText: quoteText.trim(),
        speaker: speaker.trim() || 'AI Assistant',
      });
      // Reset form
      setQuoteText(selectedText);
      setSpeaker('AI Assistant');
      onClose();
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('Failed to save quote. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Quote className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Save Quote</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          {/* Patient Selector */}
          {patients.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Save under
                {' '}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPatientDropdown(!showPatientDropdown)}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-left text-sm transition-colors hover:border-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    {selectedPatient?.avatarUrl ? (
                      <img
                        src={selectedPatient.avatarUrl}
                        alt={selectedPatient.name}
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-700">
                        {selectedPatient?.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <span className="font-medium text-gray-900">{selectedPatient?.name || 'Select patient'}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showPatientDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {showPatientDropdown && (
                  <div className="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {patients.map(patient => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatientId(patient.id);
                          setShowPatientDropdown(false);
                        }}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-purple-50 ${
                          selectedPatientId === patient.id ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                        }`}
                      >
                        {patient.avatarUrl ? (
                          <img
                            src={patient.avatarUrl}
                            alt={patient.name}
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-700">
                            {patient.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <span className="font-medium">{patient.name}</span>
                        {selectedPatientId === patient.id && (
                          <svg className="ml-auto h-4 w-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No patients warning */}
          {patients.length === 0 && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex gap-3">
                <svg className="h-5 w-5 flex-shrink-0 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">No patients available</p>
                  <p className="mt-1">This session is not associated with any patients. Please add a patient to the session first.</p>
                </div>
              </div>
            </div>
          )}

          {/* Quote Text */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Quote Text
              {' '}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              value={quoteText}
              onChange={e => setQuoteText(e.target.value)}
              rows={6}
              placeholder="Enter quote text..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          {/* Speaker */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Speaker
            </label>
            <input
              type="text"
              value={speaker}
              onChange={e => setSpeaker(e.target.value)}
              placeholder="E.g., AI Assistant, Therapist, Patient"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Who said this quote
            </p>
          </div>

          {/* Info Box */}
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <div className="flex gap-3">
              <svg className="h-5 w-5 flex-shrink-0 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-purple-900">
                <p className="font-medium">Extracted from AI Conversation</p>
                <p className="mt-1 text-purple-700">
                  This quote is being saved from the AI assistant's response. It will be linked to this session and visible in the Library panel.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving || !quoteText.trim() || patients.length === 0 || !selectedPatientId}
          >
            {isSaving ? 'Saving...' : 'Save Quote'}
          </Button>
        </div>
      </div>
    </div>
  );
}
