/**
 * Edit Therapist Modal
 * Allows org admins to edit therapist details (name, license, specialty)
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

type Therapist = {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'invited' | 'deleted' | 'pending_approval' | 'rejected';
  licenseNumber?: string | null;
  specialty?: string | null;
};

type EditTherapistModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  therapist: Therapist;
  idToken: string;
};

export function EditTherapistModal({
  isOpen,
  onClose,
  onSuccess,
  therapist,
  idToken,
}: EditTherapistModalProps) {
  const [formData, setFormData] = useState({
    name: therapist.name,
    licenseNumber: therapist.licenseNumber || '',
    specialty: therapist.specialty || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`/api/therapists/${therapist.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: formData.name,
          licenseNumber: formData.licenseNumber || null,
          specialty: formData.specialty || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Therapist updated successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
          setSuccess('');
        }, 1000);
      } else {
        setError(data.error || 'Failed to update therapist');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form to original values
      setFormData({
        name: therapist.name,
        licenseNumber: therapist.licenseNumber || '',
        specialty: therapist.specialty || '',
      });
      setError('');
      setSuccess('');
      onClose();
    }
  };

  // Check if form has changes
  const hasChanges
    = formData.name !== therapist.name
      || (formData.licenseNumber || '') !== (therapist.licenseNumber || '')
      || (formData.specialty || '') !== (therapist.specialty || '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Therapist"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Email (read-only) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            {therapist.email}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Email cannot be changed
          </p>
        </div>

        <Input
          label="Full Name"
          type="text"
          value={formData.name}
          onChange={e => handleChange('name', e.target.value)}
          placeholder="Dr. Jane Smith"
          required
          disabled={loading}
        />

        <Input
          label="License Number (Optional)"
          type="text"
          value={formData.licenseNumber}
          onChange={e => handleChange('licenseNumber', e.target.value)}
          placeholder="LIC123456"
          disabled={loading}
        />

        <Input
          label="Credentials (Optional)"
          type="text"
          value={formData.specialty}
          onChange={e => handleChange('specialty', e.target.value)}
          placeholder="e.g., APRN FNP-C PMHNP-C"
          disabled={loading}
          helperText="Credentials appear alongside the therapist's name on all locked notes."
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !formData.name || !hasChanges}
            className="flex-1"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
