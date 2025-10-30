'use client';

import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Patient {
  id?: string;
  name: string;
  email: string;
  referenceImageUrl?: string;
  avatarUrl?: string;
}

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Patient) => void;
  patient?: Patient;
}

export function PatientModal({ isOpen, onClose, onSave, patient }: PatientModalProps) {
  const [formData, setFormData] = useState<Patient>({
    name: '',
    email: '',
    referenceImageUrl: '',
  });
  const [imagePreview, setImagePreview] = useState('');

  // Update form data when patient prop changes
  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name || '',
        email: patient.email || '',
        referenceImageUrl: patient.referenceImageUrl || patient.avatarUrl || '',
      });
      setImagePreview(patient.referenceImageUrl || patient.avatarUrl || '');
    } else {
      setFormData({
        name: '',
        email: '',
        referenceImageUrl: '',
      });
      setImagePreview('');
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {patient ? 'Edit Patient' : 'Add New Patient'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

            <Input
              label="Full Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
            />
          </div>

          {/* Reference Image */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Reference Image</h3>
            <p className="text-sm text-gray-600">
              Upload a reference image for AI-generated content consistency
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              {imagePreview ? (
                <div className="space-y-4">
                  <img
                    src={imagePreview}
                    alt="Reference"
                    className="w-32 h-32 rounded-lg object-cover mx-auto"
                  />
                  <div className="text-center">
                    <label className="cursor-pointer text-indigo-600 hover:text-indigo-700 text-sm font-medium">
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
              ) : (
                <div className="text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <label className="cursor-pointer">
                    <span className="text-indigo-600 hover:text-indigo-700 font-medium">
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
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
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
