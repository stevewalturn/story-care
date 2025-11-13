'use client';

import { Edit2, Plus, Search, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Patient = {
  id: string;
  name: string;
  email: string;
  referenceImageUrl?: string;
  avatarUrl?: string;
  sessionCount: number;
  lastSession?: string;
  createdAt: string | Date;
};

type PatientListProps = {
  patients: Patient[];
  onAddClick: () => void;
  onEditClick: (patient: Patient) => void;
  onDeleteClick: (patientId: string) => void;
};

export function PatientList({
  patients,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: PatientListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
    || patient.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-sm text-gray-600">
            Manage patient profiles and reference images
          </p>
        </div>
        <Button variant="primary" onClick={onAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search patients..."
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Patient Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPatients.map(patient => (
          <div
            key={patient.id}
            className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg"
          >
            {/* Avatar */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                {patient.referenceImageUrl || patient.avatarUrl
                  ? (
                      <img
                        src={patient.referenceImageUrl || patient.avatarUrl}
                        alt={patient.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    )
                  : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                        <User className="h-6 w-6 text-indigo-600" />
                      </div>
                    )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                  <p className="text-sm text-gray-600">
                    {patient.sessionCount}
                    {' '}
                    sessions
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditClick(patient)}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete patient "${patient.name}"?`)) {
                      onDeleteClick(patient.id);
                    }
                  }}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Email:</span>
                <span className="truncate">{patient.email || 'Not provided'}</span>
              </div>
            </div>

            {/* Last Session */}
            {patient.lastSession && (
              <div className="mt-4 border-t border-gray-200 pt-4 text-sm text-gray-600">
                Last session:
                {' '}
                {patient.lastSession}
              </div>
            )}
          </div>
        ))}

        {/* Empty State */}
        {filteredPatients.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <User className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <p className="mb-4 text-gray-600">
              {searchQuery ? 'No patients found' : 'No patients yet'}
            </p>
            {!searchQuery && (
              <Button variant="primary" onClick={onAddClick}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Patient
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
