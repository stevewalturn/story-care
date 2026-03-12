/**
 * Invite Therapist Modal
 * Allows org admins to invite therapists to their organization
 */

'use client';

import type { InviteTherapistInput } from '@/validations/UserValidation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

type InviteTherapistModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  idToken: string;
};

export function InviteTherapistModal({
  isOpen,
  onClose,
  onSuccess,
  idToken,
}: InviteTherapistModalProps) {
  const { enablePhoneVerification } = useFeatureFlags();
  const [formData, setFormData] = useState<InviteTherapistInput>({
    name: '',
    email: '',
    licenseNumber: '',
    specialty: '',
    phoneNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field: keyof InviteTherapistInput, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/therapists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Therapist invited successfully!');
        // Reset form
        setFormData({ name: '', email: '', licenseNumber: '', specialty: '', phoneNumber: '' });
        // Wait a moment to show success message
        setTimeout(() => {
          onSuccess();
          onClose();
          setSuccess('');
        }, 1500);
      } else {
        setError(data.error || 'Failed to invite therapist');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: '', email: '', licenseNumber: '', specialty: '', phoneNumber: '' });
      setError('');
      setSuccess('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite Therapist"
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
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={e => handleChange('email', e.target.value)}
          placeholder="jane.smith@example.com"
          required
          disabled={loading}
          helperText="The therapist can sign in using this email address"
        />

        {enablePhoneVerification && (
          <Input
            label="Phone Number (Optional)"
            type="tel"
            value={formData.phoneNumber ?? ''}
            onChange={e => handleChange('phoneNumber', e.target.value)}
            placeholder="+1 (555) 000-0000"
            disabled={loading}
            helperText="If provided, the therapist can also set up their account via SMS."
          />
        )}

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
            disabled={loading || !formData.name || !formData.email}
            className="flex-1"
          >
            {loading ? 'Sending Invitation...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
