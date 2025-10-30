'use client';

import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  referenceImageUrl?: string;
  sessionCount: number;
  lastSession?: string;
  createdAt: Date;
}

interface PatientListProps {
  patients: Patient[];
  onAddClick: () => void;
  onEditClick: (patient: Patient) => void;
  onDeleteClick: (patientId: string) => void;
}

export function PatientList({
  patients,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: PatientListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Patients</h1>
          <p className="text-sm text-gray-600">
            Manage patient profiles and reference images
          </p>
        </div>
        <Button variant="primary" onClick={onAddClick}>
          <Plus className="w-4 h-4 mr-2" />
          Add Patient
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search patients..."
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Patient Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => (
          <div
            key={patient.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            {/* Avatar */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {patient.referenceImageUrl ? (
                  <img
                    src={patient.referenceImageUrl}
                    alt={patient.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                  <p className="text-sm text-gray-600">{patient.sessionCount} sessions</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditClick(patient)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete patient "${patient.name}"?`)) {
                      onDeleteClick(patient.id);
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Email:</span>
                <span className="truncate">{patient.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Phone:</span>
                <span>{patient.phone || 'N/A'}</span>
              </div>
            </div>

            {/* Last Session */}
            {patient.lastSession && (
              <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                Last session: {patient.lastSession}
              </div>
            )}
          </div>
        ))}

        {/* Empty State */}
        {filteredPatients.length === 0 && (
          <div className="col-span-full text-center py-16">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              {searchQuery ? 'No patients found' : 'No patients yet'}
            </p>
            {!searchQuery && (
              <Button variant="primary" onClick={onAddClick}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Patient
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
