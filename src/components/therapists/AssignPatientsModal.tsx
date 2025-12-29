/**
 * Assign Patients Modal Component
 * Allows org admin to assign/reassign patients to a therapist
 */

'use client';

import { Search, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

type Patient = {
  id: string;
  name: string;
  email: string;
  therapistId?: string | null;
  therapistName?: string | null;
};

type AssignPatientsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  therapistId: string;
  therapistName: string;
  onSuccess: () => void;
};

export function AssignPatientsModal({
  isOpen,
  onClose,
  therapistId,
  therapistName,
  onSuccess,
}: AssignPatientsModalProps) {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAvailablePatients();
    }
  }, [isOpen]);

  const fetchAvailablePatients = async () => {
    setLoading(true);
    setError('');

    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/patients?unassigned=true', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
      } else {
        setError('Failed to load patients');
      }
    } catch (err) {
      console.error(err);
      setError('Error loading patients');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPatients = async () => {
    if (selectedPatients.size === 0) {
      setError('Please select at least one patient');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/therapists/${therapistId}/assign-patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          patientIds: Array.from(selectedPatients),
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        setSelectedPatients(new Set());
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to assign patients');
      }
    } catch (err) {
      console.error(err);
      setError('Error assigning patients');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePatient = (patientId: string) => {
    const newSelected = new Set(selectedPatients);
    if (newSelected.has(patientId)) {
      newSelected.delete(patientId);
    } else {
      newSelected.add(patientId);
    }
    setSelectedPatients(newSelected);
  };

  const filteredPatients = patients.filter(
    patient =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase())
      || patient.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!isOpen)
    return null;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Assign Patients</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          Select patients to assign to
          {' '}
          <span className="font-semibold">{therapistName}</span>
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        {/* Patients List */}
        <div className="mb-4 max-h-96 overflow-y-auto rounded-lg border border-gray-200">
          {loading
            ? (
                <div className="flex items-center justify-center p-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                </div>
              )
            : filteredPatients.length === 0
              ? (
                  <div className="p-12 text-center">
                    <User className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      {searchQuery ? 'No patients found' : 'No unassigned patients available'}
                    </p>
                  </div>
                )
              : (
                  <div className="divide-y divide-gray-200">
                    {filteredPatients.map(patient => (
                      <label
                        key={patient.id}
                        htmlFor={`patient-${patient.id}`}
                        className="flex cursor-pointer items-center p-4 hover:bg-gray-50"
                      >
                        <input
                          id={`patient-${patient.id}`}
                          type="checkbox"
                          checked={selectedPatients.has(patient.id)}
                          onChange={() => togglePatient(patient.id)}
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                              <User className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                              <p className="text-xs text-gray-500">{patient.email}</p>
                            </div>
                          </div>
                          {patient.therapistName && (
                            <p className="mt-1 ml-11 text-xs text-gray-500">
                              Currently assigned to:
                              {' '}
                              {patient.therapistName}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {selectedPatients.size}
            {' '}
            patient
            {selectedPatients.size !== 1 ? 's' : ''}
            {' '}
            selected
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAssignPatients}
              disabled={submitting || selectedPatients.size === 0}
            >
              {submitting ? 'Assigning...' : 'Assign Patients'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
