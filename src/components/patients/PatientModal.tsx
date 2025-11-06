'use client';

import { Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Patient = {
  id?: string;
  name: string;
  email: string;
  referenceImageUrl?: string;
  avatarUrl?: string;
  therapistId?: string;
};

type Therapist = {
  firebaseUid: string;
  name: string;
  patientCount: number;
};

type PatientModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
  patient?: Patient;
  isOrgAdmin?: boolean;
  therapists?: Therapist[];
};

export function PatientModal({ isOpen, onClose, onSave, patient, isOrgAdmin, therapists }: PatientModalProps) {
  const [formData, setFormData] = useState<Patient>({
    name: '',
    email: '',
    referenceImageUrl: '',
    therapistId: '',
  });
  const [imagePreview, setImagePreview] = useState('');

  // Update form data when patient prop changes
  useEffect(() => {
    // Defer setState to avoid cascading renders
    queueMicrotask(() => {
      if (patient) {
        setFormData({
          name: patient.name || '',
          email: patient.email || '',
          referenceImageUrl: patient.referenceImageUrl || patient.avatarUrl || '',
          therapistId: patient.therapistId || '',
        });
        setImagePreview(patient.referenceImageUrl || patient.avatarUrl || '');
      } else {
        setFormData({
          name: '',
          email: '',
          referenceImageUrl: '',
          therapistId: '',
        });
        setImagePreview('');
      }
    });
  }, [patient, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormData({ ...formData, referenceImageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {patient ? 'Edit Patient' : 'Add New Patient'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

            <Input
              label="Full Name *"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
            />

            {/* Therapist Selection (Org Admin Only) */}
            {isOrgAdmin && therapists && therapists.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Assign to Therapist *
                </label>
                <select
                  value={formData.therapistId}
                  onChange={e => setFormData({ ...formData, therapistId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  required={isOrgAdmin}
                >
                  <option value="">Select a therapist</option>
                  {therapists.map(therapist => (
                    <option key={therapist.firebaseUid} value={therapist.firebaseUid}>
                      {therapist.name}
                      {' '}
                      (
                      {therapist.patientCount}
                      {' '}
                      patients)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  This patient will be assigned to the selected therapist
                </p>
              </div>
            )}
          </div>

          {/* Reference Image */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Reference Image</h3>
            <p className="text-sm text-gray-600">
              Upload a reference image for AI-generated content consistency
            </p>

            <div className="rounded-lg border-2 border-dashed border-gray-300 p-6">
              {imagePreview
                ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Reference"
                        className="mx-auto h-32 w-32 rounded-lg object-cover"
                      />
                      <div className="text-center">
                        <label className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-700">
                          Change Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )
                : (
                    <div className="text-center">
                      <Upload className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                      <label className="cursor-pointer">
                        <span className="font-medium text-indigo-600 hover:text-indigo-700">
                          Upload a file
                        </span>
                        <span className="text-gray-600"> or drag and drop</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="mt-2 text-xs text-gray-500">
                        PNG, JPG up to 10MB
                      </p>
                    </div>
                  )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {patient ? 'Update Patient' : 'Create Patient'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
