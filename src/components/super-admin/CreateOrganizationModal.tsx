/**
 * Create Organization Modal
 * Modal form for super admins to create new organizations
 */

'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type CreateOrganizationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  idToken: string | null;
};

export function CreateOrganizationModal({
  isOpen,
  onClose,
  onSuccess,
  idToken,
}: CreateOrganizationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contactEmail: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ name: '', slug: '', contactEmail: '' });
        onSuccess();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create organization');
      }
    } catch (err) {
      setError('Error creating organization');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }));
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        role="presentation"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Create Organization
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Organization Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={e => handleNameChange(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Acme Therapy Clinic"
            />
          </div>

          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-gray-700"
            >
              Slug (URL-friendly name)
            </label>
            <input
              type="text"
              id="slug"
              required
              value={formData.slug}
              onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="acme-therapy-clinic"
              pattern="[a-z0-9-]+"
            />
            <p className="mt-1 text-xs text-gray-500">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          <div>
            <label
              htmlFor="contactEmail"
              className="block text-sm font-medium text-gray-700"
            >
              Contact Email
            </label>
            <input
              type="email"
              id="contactEmail"
              required
              value={formData.contactEmail}
              onChange={e => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="admin@acmetherapy.com"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
