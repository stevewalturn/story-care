'use client';

import { Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch, authenticatedPatch } from '@/utils/AuthenticatedFetch';

type Therapist = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

type TherapistProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (therapist: Therapist) => void;
};

export function TherapistProfileModal({ isOpen, onClose, onUpdate }: TherapistProfileModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Therapist>({
    id: '',
    name: '',
    email: '',
    avatarUrl: '',
  });
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch therapist profile when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchProfile();
    }
  }, [isOpen, user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/therapists/me', user);

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setFormData({
        id: data.therapist.id,
        name: data.therapist.name,
        email: data.therapist.email || '',
        avatarUrl: data.therapist.avatarUrl || '',
      });
      setImagePreview(data.therapist.avatarUrl || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

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

      const response = await fetch('/api/therapists/upload-avatar', {
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
      setFormData({ ...formData, avatarUrl: path });
      setImagePreview(url);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload avatar');
      setImagePreview('');
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      const response = await authenticatedPatch('/api/therapists/me', user, {
        name: formData.name,
        email: formData.email,
        avatarUrl: formData.avatarUrl,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const data = await response.json();
      onUpdate(data.therapist);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
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
            My Profile
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {/* Avatar */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Profile Picture</h3>
              <p className="text-sm text-gray-600">
                Upload a profile picture to personalize your account
              </p>

              <div className="rounded-lg border-2 border-dashed border-gray-300 p-6">
                {uploadingImage
                  ? (
                      <div className="text-center">
                        <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                        <p className="text-sm text-gray-600">
                          Uploading...
                          {' '}
                          {uploadProgress}
                          %
                        </p>
                      </div>
                    )
                  : imagePreview
                    ? (
                        <div className="text-center">
                          <div className="relative mx-auto mb-4 h-32 w-32 overflow-hidden rounded-full">
                            <img
                              src={imagePreview}
                              alt="Avatar preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <label className="inline-block cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              disabled={uploadingImage}
                            />
                            Change Image
                          </label>
                        </div>
                      )
                    : (
                        <label className="flex cursor-pointer flex-col items-center justify-center">
                          <Upload className="mb-3 h-12 w-12 text-gray-400" />
                          <span className="mb-2 text-sm font-medium text-gray-700">
                            Click to upload
                          </span>
                          <span className="text-xs text-gray-500">PNG, JPG, WebP (max 10MB)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploadingImage}
                          />
                        </label>
                      )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

              <Input
                label="Full Name *"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
                minLength={2}
                maxLength={255}
                helperText="2-255 characters required"
              />

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                helperText="Valid email format required"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saving || uploadingImage}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
