'use client';

import { Edit2, Loader2, Plus, Trash2, UserCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';
import { ImageLightbox } from '../components/ImageLightbox';

type GeneralInformationTabProps = {
  patientId: string;
};

type EditSection = 'personal' | 'address' | 'contact' | 'emergency' | 'therapist' | null;

type Therapist = {
  id: string;
  name: string;
  patientCount: number;
};

type PatientData = {
  firstName: string;
  lastName: string;
  gender: string;
  pronouns: string;
  dateOfBirth: string;
  language: string;
  notes: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phoneNumber: string;
  email: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  emergencyContactEmail: string;
  referenceImages: string[];
};

const initialPatientData: PatientData = {
  firstName: '',
  lastName: '',
  gender: '',
  pronouns: '',
  dateOfBirth: '',
  language: '',
  notes: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: '',
  zipCode: '',
  phoneNumber: '',
  email: '',
  emergencyContactName: '',
  emergencyContactRelationship: '',
  emergencyContactPhone: '',
  emergencyContactEmail: '',
  referenceImages: [],
};

export function GeneralInformationTab({ patientId }: GeneralInformationTabProps) {
  const { user } = useAuth();
  const [editingSection, setEditingSection] = useState<EditSection>(null);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Reference image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [patientData, setPatientData] = useState<PatientData>(initialPatientData);
  const [originalData, setOriginalData] = useState<PatientData>(initialPatientData);

  // Therapist assignment state
  const [therapistId, setTherapistId] = useState<string | null>(null);
  const [therapistName, setTherapistName] = useState<string | null>(null);
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('');
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loadingTherapists, setLoadingTherapists] = useState(false);
  const [savingTherapist, setSavingTherapist] = useState(false);

  // Fetch patient data and reference images from API
  useEffect(() => {
    if (!user?.uid || !patientId) return;

    const fetchPatientData = async () => {
      try {
        setLoading(true);

        // Fetch patient data and reference images in parallel
        const [patientResponse, refImagesResponse] = await Promise.all([
          authenticatedFetch(`/api/patients/${patientId}`, user),
          authenticatedFetch(`/api/patients/${patientId}/reference-images`, user),
        ]);

        let referenceImageUrls: string[] = [];

        // Process reference images response
        if (refImagesResponse.ok) {
          const refImagesData = await refImagesResponse.json();
          referenceImageUrls = (refImagesData.images || []).map(
            (img: { imageUrl: string }) => img.imageUrl,
          );
        }

        if (patientResponse.ok) {
          const data = await patientResponse.json();
          const patient = data.patient;

          // Parse name into first and last name
          const nameParts = (patient.name || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          // Fall back to patient.referenceImageUrl if no images in reference images table
          const images = referenceImageUrls.length > 0
            ? referenceImageUrls
            : patient.referenceImageUrl
              ? [patient.referenceImageUrl]
              : [];

          const loadedData: PatientData = {
            firstName,
            lastName,
            gender: patient.gender || '',
            pronouns: patient.pronouns || '',
            dateOfBirth: patient.dateOfBirth || '',
            language: patient.language || '',
            notes: patient.notes || '',
            addressLine1: patient.addressLine1 || '',
            addressLine2: patient.addressLine2 || '',
            city: patient.city || '',
            state: patient.state || '',
            country: patient.country || '',
            zipCode: patient.zipCode || '',
            phoneNumber: patient.phoneNumber || '',
            email: patient.email || '',
            emergencyContactName: patient.emergencyContactName || '',
            emergencyContactRelationship: patient.emergencyContactRelationship || '',
            emergencyContactPhone: patient.emergencyContactPhone || '',
            emergencyContactEmail: patient.emergencyContactEmail || '',
            referenceImages: images,
          };

          setPatientData(loadedData);
          setOriginalData(loadedData);

          // Set therapist assignment data
          setTherapistId(patient.therapistId || null);
          setTherapistName(data.therapistName || null);
        }
      } catch (error) {
        console.error('Error fetching patient:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [user, patientId]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const handleSave = async (_section: EditSection) => {
    if (!user?.uid) return;

    try {
      setSaving(true);
      setSaveError(null);
      setSaveSuccess(false);

      // Combine first and last name
      const fullName = `${patientData.firstName} ${patientData.lastName}`.trim();

      const response = await authenticatedFetch(`/api/patients/${patientId}`, user, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fullName,
          email: patientData.email,
          dateOfBirth: patientData.dateOfBirth || null,
          gender: patientData.gender || null,
          pronouns: patientData.pronouns || null,
          language: patientData.language || null,
          notes: patientData.notes || null,
          phoneNumber: patientData.phoneNumber || null,
          addressLine1: patientData.addressLine1 || null,
          addressLine2: patientData.addressLine2 || null,
          city: patientData.city || null,
          state: patientData.state || null,
          country: patientData.country || null,
          zipCode: patientData.zipCode || null,
          emergencyContactName: patientData.emergencyContactName || null,
          emergencyContactRelationship: patientData.emergencyContactRelationship || null,
          emergencyContactPhone: patientData.emergencyContactPhone || null,
          emergencyContactEmail: patientData.emergencyContactEmail || null,
        }),
      });

      if (response.ok) {
        setOriginalData({ ...patientData });
        setSaveSuccess(true);
        setEditingSection(null);
        // Clear success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setSaveError(errorData.error || 'Failed to save patient information');
      }
    } catch (error) {
      console.error('Error saving patient:', error);
      setSaveError('An error occurred while saving. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (_section: EditSection) => {
    // Reset form data to original values
    setPatientData({ ...originalData });
    setSaveError(null);
    setEditingSection(null);
  };

  // Fetch org therapists when entering therapist edit mode
  const handleEditTherapist = async () => {
    setEditingSection('therapist');
    setSelectedTherapistId(therapistId || '');
    if (therapists.length === 0) {
      setLoadingTherapists(true);
      try {
        const response = await authenticatedFetch('/api/therapists', user);
        if (response.ok) {
          const data = await response.json();
          setTherapists(data.therapists || []);
        }
      } catch (error) {
        console.error('Error fetching therapists:', error);
      } finally {
        setLoadingTherapists(false);
      }
    }
  };

  const handleSaveTherapist = async () => {
    if (!user?.uid) return;

    try {
      setSavingTherapist(true);
      setSaveError(null);
      setSaveSuccess(false);

      const newTherapistId = selectedTherapistId || null;

      const response = await authenticatedFetch(`/api/patients/${patientId}`, user, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ therapistId: newTherapistId }),
      });

      if (response.ok) {
        setTherapistId(newTherapistId);
        // Find therapist name from the list
        if (newTherapistId) {
          const matched = therapists.find(t => t.id === newTherapistId);
          setTherapistName(matched?.name ?? null);
        } else {
          setTherapistName(null);
        }
        setSaveSuccess(true);
        setEditingSection(null);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setSaveError(errorData.error || 'Failed to update therapist assignment');
      }
    } catch (error) {
      console.error('Error saving therapist:', error);
      setSaveError('An error occurred while saving. Please try again.');
    } finally {
      setSavingTherapist(false);
    }
  };

  // Handle reference image upload (supports both file input and drag & drop)
  const uploadFile = async (file: File) => {
    if (!user) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setImageUploadError('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setImageUploadError('File too large. Maximum size is 10MB.');
      return;
    }

    setUploadingImage(true);
    setImageUploadError(null);

    try {
      const idToken = await user.getIdToken();
      if (!idToken) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('isPrimary', patientData.referenceImages.length === 0 ? 'true' : 'false');
      formData.append('label', 'Patient reference');

      const response = await fetch(`/api/patients/${patientId}/reference-images`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload reference image');
      }

      const data = await response.json();

      // Add the new image to the reference images array
      setPatientData(prev => ({
        ...prev,
        referenceImages: [...prev.referenceImages, data.image.imageUrl],
      }));
      setOriginalData(prev => ({
        ...prev,
        referenceImages: [...prev.referenceImages, data.image.imageUrl],
      }));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error uploading reference image:', error);
      setImageUploadError(error instanceof Error ? error.message : 'Failed to upload reference image');
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    const file = files[0];
    if (file) {
      uploadFile(file);
    }
  };

  // Handle reference image deletion
  const handleDeleteImage = async (_imageUrl: string, index: number) => {
    if (!user || !confirm('Are you sure you want to delete this reference image?')) return;

    // For now, just remove from local state
    // In a full implementation, you'd also call the DELETE API endpoint
    setPatientData(prev => ({
      ...prev,
      referenceImages: prev.referenceImages.filter((_, i) => i !== index),
    }));
    setOriginalData(prev => ({
      ...prev,
      referenceImages: prev.referenceImages.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-4">
      {/* Success/Error Messages */}
      {saveSuccess && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
          Patient information saved successfully!
        </div>
      )}
      {saveError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {saveError}
        </div>
      )}

      {/* Personal Details */}
      <div className="rounded-xl bg-gray-50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Personal Details</h2>
          {editingSection !== 'personal' && (
            <button
              type="button"
              onClick={() => setEditingSection('personal')}
              className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>

        {editingSection === 'personal' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <Input
                  value={patientData.firstName}
                  onChange={e =>
                    setPatientData({ ...patientData, firstName: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <Input
                  value={patientData.lastName}
                  onChange={e =>
                    setPatientData({ ...patientData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Gender</label>
                <select
                  value={patientData.gender}
                  onChange={e => setPatientData({ ...patientData, gender: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Pronouns
                </label>
                <Input
                  value={patientData.pronouns}
                  onChange={e =>
                    setPatientData({ ...patientData, pronouns: e.target.value })}
                  placeholder="e.g., she/her, he/him, they/them"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Date of Birth
                </label>
                <Input
                  type="date"
                  value={patientData.dateOfBirth}
                  onChange={e =>
                    setPatientData({ ...patientData, dateOfBirth: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Language
                </label>
                <select
                  value={patientData.language}
                  onChange={e => setPatientData({ ...patientData, language: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
              <Textarea
                value={patientData.notes}
                onChange={e => setPatientData({ ...patientData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes about the patient..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => handleCancel('personal')} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={() => handleSave('personal')} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <div className="text-sm text-gray-500">First Name</div>
              <div className="font-medium text-gray-900">{patientData.firstName || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Last Name</div>
              <div className="font-medium text-gray-900">{patientData.lastName || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Gender</div>
              <div className="font-medium text-gray-900">{patientData.gender || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Pronouns</div>
              <div className="font-medium text-gray-900">{patientData.pronouns || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Date of Birth</div>
              <div className="font-medium text-gray-900">{patientData.dateOfBirth || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Language</div>
              <div className="font-medium text-gray-900">{patientData.language || '-'}</div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-gray-500">Notes</div>
              <div className="font-medium text-gray-900">{patientData.notes || '-'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Address Information */}
      <div className="rounded-xl bg-gray-50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Address Information</h2>
          {editingSection !== 'address' && (
            <button
              type="button"
              onClick={() => setEditingSection('address')}
              className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>

        {editingSection === 'address' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Address Line 1
                </label>
                <Input
                  value={patientData.addressLine1}
                  onChange={e =>
                    setPatientData({ ...patientData, addressLine1: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Address Line 2
                </label>
                <Input
                  value={patientData.addressLine2}
                  onChange={e =>
                    setPatientData({ ...patientData, addressLine2: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  City
                </label>
                <Input
                  value={patientData.city}
                  onChange={e => setPatientData({ ...patientData, city: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  State
                </label>
                <Input
                  value={patientData.state}
                  onChange={e => setPatientData({ ...patientData, state: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Country</label>
                <Input
                  value={patientData.country}
                  onChange={e => setPatientData({ ...patientData, country: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  ZIP/Postal Code
                </label>
                <Input
                  value={patientData.zipCode}
                  onChange={e => setPatientData({ ...patientData, zipCode: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => handleCancel('address')} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={() => handleSave('address')} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <div className="text-sm text-gray-500">Address Line 1</div>
              <div className="font-medium text-gray-900">{patientData.addressLine1 || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Address Line 2</div>
              <div className="font-medium text-gray-900">{patientData.addressLine2 || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">City</div>
              <div className="font-medium text-gray-900">{patientData.city || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">State</div>
              <div className="font-medium text-gray-900">{patientData.state || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Country</div>
              <div className="font-medium text-gray-900">{patientData.country || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">ZIP/Postal Code</div>
              <div className="font-medium text-gray-900">{patientData.zipCode || '-'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Contact Information */}
      <div className="rounded-xl bg-gray-50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Contact Information</h2>
          {editingSection !== 'contact' && (
            <button
              type="button"
              onClick={() => setEditingSection('contact')}
              className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>

        {editingSection === 'contact' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <Input
                  value={patientData.phoneNumber}
                  onChange={e =>
                    setPatientData({ ...patientData, phoneNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <Input
                  value={patientData.email}
                  onChange={e => setPatientData({ ...patientData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => handleCancel('contact')} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={() => handleSave('contact')} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <div className="text-sm text-gray-500">Phone Number</div>
              <div className="font-medium text-gray-900">{patientData.phoneNumber || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="font-medium text-gray-900">{patientData.email || '-'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Emergency Contact */}
      <div className="rounded-xl bg-gray-50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Emergency Contact</h2>
          {editingSection !== 'emergency' && (
            <button
              type="button"
              onClick={() => setEditingSection('emergency')}
              className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>

        {editingSection === 'emergency' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <Input
                  value={patientData.emergencyContactName}
                  onChange={e =>
                    setPatientData({ ...patientData, emergencyContactName: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Relationship
                </label>
                <Input
                  value={patientData.emergencyContactRelationship}
                  onChange={e =>
                    setPatientData({ ...patientData, emergencyContactRelationship: e.target.value })}
                  placeholder="e.g., Spouse, Parent, Sibling, Friend"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <Input
                  value={patientData.emergencyContactPhone}
                  onChange={e =>
                    setPatientData({ ...patientData, emergencyContactPhone: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <Input
                  value={patientData.emergencyContactEmail}
                  onChange={e =>
                    setPatientData({ ...patientData, emergencyContactEmail: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => handleCancel('emergency')} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={() => handleSave('emergency')} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <div className="text-sm text-gray-500">Name</div>
              <div className="font-medium text-gray-900">{patientData.emergencyContactName || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Relationship</div>
              <div className="font-medium text-gray-900">
                {patientData.emergencyContactRelationship || '-'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Phone Number</div>
              <div className="font-medium text-gray-900">{patientData.emergencyContactPhone || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="font-medium text-gray-900">{patientData.emergencyContactEmail || '-'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Assigned Therapist */}
      <div className="rounded-xl bg-gray-50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Assigned Therapist</h2>
          {editingSection !== 'therapist' && (
            <button
              type="button"
              onClick={handleEditTherapist}
              className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700"
            >
              <Edit2 className="h-4 w-4" />
              Reassign
            </button>
          )}
        </div>

        {editingSection === 'therapist' ? (
          <div className="space-y-4">
            {loadingTherapists ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading therapists...
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Select Therapist
                </label>
                <select
                  value={selectedTherapistId}
                  onChange={e => setSelectedTherapistId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:outline-none"
                >
                  <option value="">Unassigned</option>
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
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingSection(null);
                  setSaveError(null);
                }}
                disabled={savingTherapist}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveTherapist} disabled={savingTherapist || loadingTherapists}>
                {savingTherapist ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
              <UserCheck className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {therapistName || 'Unassigned'}
              </div>
              {!therapistName && (
                <div className="text-sm text-gray-500">
                  No therapist assigned to this patient
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reference Image */}
      <div
        className={`rounded-xl p-6 transition-colors ${
          isDragging
            ? 'border-2 border-dashed border-purple-500 bg-purple-50'
            : 'bg-gray-50'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <h2 className="mb-2 font-semibold text-gray-900">Reference Image</h2>
        <p className="mb-4 text-sm text-gray-500">
          This patient reference image will be used for visual consistency.
        </p>

        {/* Image upload error message */}
        {imageUploadError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {imageUploadError}
          </div>
        )}

        {/* Drag overlay message */}
        {isDragging && (
          <div className="mb-4 flex items-center justify-center rounded-lg border-2 border-dashed border-purple-400 bg-purple-100 p-8">
            <p className="text-sm font-medium text-purple-600">
              Drop image here to upload
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-4">
          {patientData.referenceImages.map((image, index) => (
            <div
              key={index}
              className="group relative h-24 w-24 overflow-hidden rounded-xl"
            >
              <button
                type="button"
                onClick={() => openLightbox(patientData.referenceImages, index)}
                className="h-full w-full transition-transform hover:scale-105"
              >
                <img
                  src={image}
                  alt={`Reference ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
              {/* Delete button overlay */}
              <button
                type="button"
                onClick={() => handleDeleteImage(image, index)}
                className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                title="Delete image"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Add More Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            className={`flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              isDragging
                ? 'border-purple-500 bg-purple-100 text-purple-600'
                : 'border-gray-300 text-gray-400 hover:border-purple-600 hover:text-purple-600'
            }`}
          >
            {uploadingImage ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Plus className="h-6 w-6" />
            )}
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-400">
          Drag and drop or click to upload. Supported formats: JPEG, PNG, WebP, GIF. Max size: 10MB
        </p>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
}
