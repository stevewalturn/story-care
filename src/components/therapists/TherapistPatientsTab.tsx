/**
 * Therapist Patients Tab Component
 * Displays list of patients assigned to therapist
 */

'use client';

import { Calendar, Loader2, User, Users, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

type Patient = {
  id: string;
  name: string;
  email: string;
  status: string;
  avatarUrl?: string | null;
  createdAt: string;
  lastLoginAt?: string | null;
  sessionCount: number;
  lastSessionDate?: string | null;
};

type TherapistInfo = {
  id: string;
  name: string;
  patientCount: number;
};

type TherapistPatientsTabProps = {
  patients: Patient[];
  therapistId: string;
  onAssignPatients?: () => void;
  onPatientReassigned?: () => void;
};

export function TherapistPatientsTab({ patients, therapistId, onAssignPatients, onPatientReassigned }: TherapistPatientsTabProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Reassign modal state
  const [reassignPatient, setReassignPatient] = useState<Patient | null>(null);
  const [therapists, setTherapists] = useState<TherapistInfo[]>([]);
  const [loadingTherapists, setLoadingTherapists] = useState(false);
  const [selectedTherapistId, setSelectedTherapistId] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const [reassignError, setReassignError] = useState('');

  const openReassignModal = async (patient: Patient) => {
    setReassignPatient(patient);
    setSelectedTherapistId('');
    setReassignError('');

    if (therapists.length === 0) {
      setLoadingTherapists(true);
      try {
        const idToken = await user?.getIdToken();
        const response = await fetch('/api/therapists', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (response.ok) {
          const data = await response.json();
          // Exclude current therapist from the list
          setTherapists((data.therapists || []).filter((t: TherapistInfo) => t.id !== therapistId));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTherapists(false);
      }
    }
  };

  const handleReassign = async () => {
    if (!reassignPatient || !selectedTherapistId) return;

    setReassigning(true);
    setReassignError('');

    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/patients/${reassignPatient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ therapistId: selectedTherapistId }),
      });

      if (response.ok) {
        setReassignPatient(null);
        onPatientReassigned?.();
      } else {
        const data = await response.json();
        setReassignError(data.error || 'Failed to reassign patient');
      }
    } catch (err) {
      console.error(err);
      setReassignError('Network error. Please try again.');
    } finally {
      setReassigning(false);
    }
  };

  const filteredPatients = patients.filter(
    patient =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase())
      || patient.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (patients.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No patients assigned</h3>
        <p className="mt-1 text-sm text-gray-500">
          This therapist doesn't have any patients assigned yet.
        </p>
        {onAssignPatients && (
          <div className="mt-6">
            <Button variant="primary" onClick={onAssignPatients}>
              Assign Patients
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Assign Button */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="block w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
        {onAssignPatients && (
          <Button variant="primary" onClick={onAssignPatients}>
            Assign Patients
          </Button>
        )}
      </div>

      {/* Patients Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Patient
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Sessions
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Last Session
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
              >
                Last Login
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredPatients.length === 0
              ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-sm text-gray-500">No patients found matching your search</p>
                    </td>
                  </tr>
                )
              : (
                  filteredPatients.map(patient => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
                            {patient.avatarUrl
                              ? (
                                  <img
                                    src={patient.avatarUrl}
                                    alt={patient.name}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                )
                              : (
                                  <User className="h-5 w-5 text-purple-600" />
                                )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                            <div className="text-sm text-gray-500">{patient.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            patient.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : patient.status === 'invited'
                                ? 'bg-blue-100 text-blue-700'
                                : patient.status === 'pending_approval'
                                  ? 'bg-amber-100 text-amber-700'
                                  : patient.status === 'rejected'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {patient.status === 'pending_approval' ? 'Awaiting Approval' : patient.status === 'rejected' ? 'Rejected' : patient.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                        {patient.sessionCount}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                        {patient.lastSessionDate
                          ? (
                              <div className="flex items-center">
                                <Calendar className="mr-1 h-4 w-4 text-gray-400" />
                                {new Date(patient.lastSessionDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </div>
                            )
                          : (
                              <span className="text-gray-400">No sessions</span>
                            )}
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                        {patient.lastLoginAt
                          ? new Date(patient.lastLoginAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : (
                              <span className="text-gray-400">Never</span>
                            )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openReassignModal(patient)}
                          className="mr-3 text-purple-600 hover:text-purple-900"
                        >
                          Reassign
                        </button>
                        <Link
                          href={`/org-admin/patients/${patient.id}`}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-600">
          Showing
          {' '}
          {filteredPatients.length}
          {' '}
          of
          {' '}
          {patients.length}
          {' '}
          patients
        </p>
      </div>

      {/* Reassign Modal */}
      {reassignPatient && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Reassign Patient</h3>
              <button
                type="button"
                onClick={() => setReassignPatient(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-600">
              Reassign
              {' '}
              <span className="font-semibold">{reassignPatient.name}</span>
              {' '}
              to a different therapist.
            </p>

            {reassignError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {reassignError}
              </div>
            )}

            {loadingTherapists ? (
              <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading therapists...
              </div>
            ) : (
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Select Therapist
                </label>
                <select
                  value={selectedTherapistId}
                  onChange={e => setSelectedTherapistId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="">Select a therapist</option>
                  {therapists.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {' '}
                      (
                      {t.patientCount}
                      {' '}
                      patients)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setReassignPatient(null)} disabled={reassigning}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReassign}
                disabled={reassigning || !selectedTherapistId}
              >
                {reassigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reassigning...
                  </>
                ) : 'Reassign'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
