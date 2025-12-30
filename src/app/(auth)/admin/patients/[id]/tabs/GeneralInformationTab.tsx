'use client';

import { Edit2, Loader2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';
import { ImageLightbox } from '../components/ImageLightbox';

type GeneralInformationTabProps = {
  patientId: string;
};

type EditSection = 'personal' | 'address' | 'contact' | 'emergency' | null;

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

  const [patientData, setPatientData] = useState<PatientData>(initialPatientData);
  const [originalData, setOriginalData] = useState<PatientData>(initialPatientData);

  // Fetch patient data from API
  useEffect(() => {
    if (!user?.uid || !patientId) return;

    const fetchPatient = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch(`/api/patients/${patientId}`, user);
        if (response.ok) {
          const data = await response.json();
          const patient = data.patient;

          // Parse name into first and last name
          const nameParts = (patient.name || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

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
            referenceImages: patient.referenceImageUrl ? [patient.referenceImageUrl] : [],
          };

          setPatientData(loadedData);
          setOriginalData(loadedData);
        }
      } catch (error) {
        console.error('Error fetching patient:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
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

      {/* Reference Image */}
      <div className="rounded-xl bg-gray-50 p-6">
        <h2 className="mb-2 font-semibold text-gray-900">Reference Image</h2>
        <p className="mb-4 text-sm text-gray-500">
          This patient reference image will be used for visual consistency.
        </p>

        <div className="flex flex-wrap gap-4">
          {patientData.referenceImages.map((image, index) => (
            <button
              key={index}
              onClick={() => openLightbox(patientData.referenceImages, index)}
              className="group relative h-24 w-24 overflow-hidden rounded-xl transition-transform hover:scale-105"
            >
              <img
                src={image}
                alt={`Reference ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}

          {/* Add More Button */}
          <button className="flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400 transition-colors hover:border-purple-600 hover:text-purple-600">
            <Plus className="h-6 w-6" />
          </button>
        </div>
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
