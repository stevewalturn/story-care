'use client';

import { Edit2, Plus, Search, Star, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { PatientReferenceImage } from '@/models/Schema';

type Patient = {
  id: string;
  name: string;
  email: string;
  referenceImageUrl?: string;
  avatarUrl?: string;
  sessionCount: number;
  lastSession?: string;
  createdAt: string | Date;
  referenceImages?: PatientReferenceImage[];
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
            {/* Avatar / Reference Images */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                {/* Reference Images Grid */}
                {patient.referenceImages && patient.referenceImages.length > 0
                  ? (
                      <div className="flex flex-col gap-1">
                        <div className="grid grid-cols-2 gap-1">
                          {patient.referenceImages.slice(0, 4).map((refImg, idx) => (
                            <div
                              key={refImg.id}
                              className="relative h-10 w-10 overflow-hidden rounded border border-gray-200 bg-gray-50"
                            >
                              <img
                                src={refImg.imageUrl.startsWith('http') ? refImg.imageUrl : `/api/media/signed-url?path=${encodeURIComponent(refImg.imageUrl)}`}
                                alt={refImg.label || `Reference ${idx + 1}`}
                                className="size-full object-cover"
                              />
                              {refImg.isPrimary && (
                                <div className="absolute left-0.5 top-0.5 rounded-full bg-yellow-400 p-0.5">
                                  <Star className="h-2 w-2 fill-white text-white" />
                                </div>
                              )}
                            </div>
                          ))}
                          {/* Show empty slots if less than 4 images */}
                          {Array.from({ length: Math.max(0, 4 - patient.referenceImages.length) }).map((_, idx) => (
                            <div
                              key={`empty-${idx}`}
                              className="flex h-10 w-10 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50"
                            >
                              <User className="h-4 w-4 text-gray-400" />
                            </div>
                          ))}
                        </div>
                        {patient.referenceImages.length > 4 && (
                          <span className="text-xs text-gray-500">
                            +{patient.referenceImages.length - 4} more
                          </span>
                        )}
                      </div>
                    )
                  : patient.avatarUrl || patient.referenceImageUrl
                    ? (
                        <img
                          src={patient.avatarUrl || patient.referenceImageUrl}
                          alt={patient.name}
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                      )
                    : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-indigo-100">
                          <User className="h-10 w-10 text-indigo-600" />
                        </div>
                      )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                  <p className="text-sm text-gray-600">
                    {patient.sessionCount}
                    {' '}
                    sessions
                  </p>
                  {patient.referenceImages && patient.referenceImages.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {patient.referenceImages.length} reference image{patient.referenceImages.length !== 1 ? 's' : ''}
                    </p>
                  )}
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
