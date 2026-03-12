'use client';

import { Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ReferenceImageGallery } from '@/components/patients/ReferenceImageGallery';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

type Patient = {
  id?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  referenceImageUrl?: string;
  avatarUrl?: string;
  therapistId?: string;
};

type Therapist = {
  id: string;
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
  const { user } = useAuth();
  const { enablePhoneVerification } = useFeatureFlags();
  const [formData, setFormData] = useState<Patient>({
    name: '',
    email: '',
    phoneNumber: '',
    referenceImageUrl: '',
    avatarUrl: '',
    therapistId: '',
  });
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Avatar (display image) state
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Update form data when patient prop changes
  useEffect(() => {
    // Defer setState to avoid cascading renders
    queueMicrotask(() => {
      if (patient) {
        setFormData({
          name: patient.name || '',
          email: patient.email || '',
          phoneNumber: patient.phoneNumber || '',
          referenceImageUrl: patient.referenceImageUrl || '',
          avatarUrl: patient.avatarUrl || '',
          therapistId: patient.therapistId || '',
        });
        setImagePreview(patient.referenceImageUrl || '');
        setAvatarPreview(patient.avatarUrl || '');
      } else {
        setFormData({
          name: '',
          email: '',
          phoneNumber: '',
          referenceImageUrl: '',
          avatarUrl: '',
          therapistId: '',
        });
        setImagePreview('');
        setAvatarPreview('');
      }
    });
  }, [patient, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    try {
      setUploadingImage(true);
      setUploadProgress(0);

      // Create preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Get auth token
      const idToken = await user?.getIdToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      // Upload to GCS
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      setUploadProgress(50);

      const response = await fetch('/api/patients/upload-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const { url, path } = await response.json();
      setUploadProgress(100);

      // Update form data with GCS path (permanent) for database
      // Keep url for preview display (temporary presigned URL)
      setFormData({ ...formData, referenceImageUrl: path });
      setImagePreview(url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
      setImagePreview('');
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    try {
      setUploadingAvatar(true);

      // Create preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Get auth token
      const idToken = await user?.getIdToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      // Upload to GCS
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch('/api/patients/upload-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const { url, path } = await response.json();

      // Update form data with GCS path (permanent) for database
      // Keep url for preview display (temporary presigned URL)
      setFormData({ ...formData, avatarUrl: path });
      setAvatarPreview(url);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload avatar');
      setAvatarPreview('');
    } finally {
      setUploadingAvatar(false);
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
              maxLength={255}
              helperText="2-255 characters required"
            />

            <Input
              label="Email *"
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              required
              helperText="Valid email format required"
            />

            {enablePhoneVerification && (
              <Input
                label="Phone Number (Optional)"
                type="tel"
                value={formData.phoneNumber ?? ''}
                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+1 (555) 000-0000"
                helperText="If provided, the patient can also set up their account via SMS."
              />
            )}

            {/* Therapist Selection (Org Admin Only) */}
            {isOrgAdmin && therapists && therapists.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Assign to Therapist *
                </label>
                <select
                  value={formData.therapistId}
                  onChange={e => setFormData({ ...formData, therapistId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  required={isOrgAdmin}
                >
                  <option value="">Select a therapist</option>
                  {therapists.map(therapist => (
                    <option key={therapist.id} value={therapist.id}>
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

          {/* Display Image / Avatar */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Display Image</h3>
            <p className="text-sm text-gray-600">
              Patient's profile picture shown in lists and cards
            </p>

            <div className="rounded-lg border-2 border-dashed border-gray-300 p-6">
              {uploadingAvatar ? (
                <div className="space-y-4 text-center">
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                  <p className="text-sm text-gray-600">Uploading display image...</p>
                </div>
              ) : avatarPreview ? (
                <div className="space-y-4">
                  <img
                    src={avatarPreview}
                    alt="Display Image"
                    className="mx-auto h-32 w-32 rounded-lg object-cover"
                  />
                  <div className="flex items-center justify-center gap-3">
                    <label className="cursor-pointer text-sm font-medium text-purple-600 hover:text-purple-700">
                      Change Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={uploadingAvatar}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarPreview('');
                        setFormData({ ...formData, avatarUrl: '' });
                      }}
                      className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                  <label className="cursor-pointer">
                    <span className="font-medium text-purple-600 hover:text-purple-700">
                      Upload display image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>
                  <p className="mt-2 text-xs text-gray-500">
                    PNG, JPG, WebP, GIF up to 10MB
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Optional - This image will be shown in patient lists
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Reference Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Reference Images</h3>
            <p className="text-sm text-gray-600">
              Upload reference images for AI-generated content consistency
            </p>

            {/* For existing patients: Show ReferenceImageGallery */}
            {patient?.id
              ? (
                  <div className="rounded-lg border border-gray-200 p-4">
                    <ReferenceImageGallery
                      patientId={patient.id}
                      showActions={true}
                    />
                  </div>
                )
              : (
                  /* For new patients: Single image upload (can add more later) */
                  <div className="rounded-lg border-2 border-dashed border-gray-300 p-6">
                    {uploadingImage
                      ? (
                          <div className="space-y-4 text-center">
                            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                            <p className="text-sm text-gray-600">Uploading image...</p>
                            {uploadProgress > 0 && (
                              <div className="mx-auto w-48">
                                <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                                  <div
                                    className="h-full bg-purple-600 transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      : imagePreview
                        ? (
                            <div className="space-y-4">
                              <img
                                src={imagePreview}
                                alt="Reference"
                                className="mx-auto h-32 w-32 rounded-lg object-cover"
                              />
                              <div className="text-center">
                                <label className="cursor-pointer text-sm font-medium text-purple-600 hover:text-purple-700">
                                  Change Image
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploadingImage}
                                  />
                                </label>
                              </div>
                              <p className="text-center text-xs text-gray-500">
                                You can add more reference images after creating the patient
                              </p>
                            </div>
                          )
                        : (
                            <div className="text-center">
                              <Upload className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                              <label className="cursor-pointer">
                                <span className="font-medium text-purple-600 hover:text-purple-700">
                                  Upload a file
                                </span>
                                <span className="text-gray-600"> or drag and drop</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  className="hidden"
                                  disabled={uploadingImage}
                                />
                              </label>
                              <p className="mt-2 text-xs text-gray-500">
                                PNG, JPG, WebP, GIF up to 10MB
                              </p>
                              <p className="mt-2 text-xs text-gray-500">
                                Optional - You can add more reference images later
                              </p>
                            </div>
                          )}
                  </div>
                )}
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
