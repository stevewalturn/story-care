'use client';

import { useEffect, useRef } from 'react';

type Patient = {
  id: string;
  name: string;
  avatarUrl?: string;
  referenceImageUrl?: string;
};

type PatientSelectorDropdownProps = {
  patients: Patient[];
  selectedPatientIds: string[];
  onTogglePatient: (patientId: string) => void;
  onClose: () => void;
  loading?: boolean;
};

export function PatientSelectorDropdown({
  patients,
  selectedPatientIds,
  onTogglePatient,
  onClose,
  loading = false,
}: PatientSelectorDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-xl"
    >
      <div className="max-h-64 overflow-y-auto p-2">
        {/* Header */}
        <div className="px-3 py-2">
          <span className="text-xs font-medium text-gray-500">Select a patient</span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-8 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
            <p className="mt-2 text-sm text-gray-500">Loading patients...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && patients.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">No patients found</p>
          </div>
        )}

        {/* Patient List */}
        {!loading && patients.length > 0 && (
          <div className="space-y-1">
            {patients.map((patient) => {
              const isSelected = selectedPatientIds.includes(patient.id);

              return (
                <button
                  key={patient.id}
                  onClick={() => onTogglePatient(patient.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
                >
                  {/* Checkbox */}
                  <div
                    className={`
                      flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-colors
                      ${isSelected ? 'border-purple-600 bg-purple-600' : 'border-gray-300 bg-white'}
                    `}
                  >
                    {isSelected && (
                      <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Avatar */}
                  {patient.avatarUrl || patient.referenceImageUrl
                    ? (
                        <img
                          src={patient.avatarUrl || patient.referenceImageUrl}
                          alt={patient.name}
                          className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                        />
                      )
                    : (
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-600">
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                  {/* Name */}
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {patient.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
