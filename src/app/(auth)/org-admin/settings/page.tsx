/**
 * Org Admin Settings Page
 * Organization configuration - name and contact info only
 */

'use client';

import { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';

interface Organization {
  id: string;
  name: string;
  contactEmail: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrgSettingsPage() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Fetch organization data
  useEffect(() => {
    async function fetchOrganization() {
      if (!user) {
        console.log('No authenticated user yet');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const idToken = await user.getIdToken();

        const response = await fetch('/api/org-admin/organization', {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch organization');
        }

        const data = await response.json();
        console.log('Organization data fetched:', data);

        setOrganization(data);
        setName(data.name);
        setContactEmail(data.contactEmail);
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError(err instanceof Error ? err.message : 'Failed to load organization');
      } finally {
        setLoading(false);
      }
    }

    fetchOrganization();
  }, [user]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('Not authenticated');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const idToken = await user.getIdToken();

      const response = await fetch('/api/org-admin/organization', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name,
          contactEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update organization');
      }

      const updatedOrg = await response.json();
      console.log('Organization updated:', updatedOrg);

      setOrganization(updatedOrg);
      setSuccessMessage('Organization settings saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error updating organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Reset form to original values
  const handleCancel = () => {
    if (organization) {
      setName(organization.name);
      setContactEmail(organization.contactEmail);
    }
    setError(null);
    setSuccessMessage(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading organization settings...</p>
        </div>
      </div>
    );
  }

  if (error && !organization) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure your organization's information
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Organization Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Organization Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Organization Name
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Enter organization name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact Email
                </label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  className="mt-1"
                  placeholder="contact@example.com"
                />
              </div>

              {/* Display-only fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Organization Slug
                </label>
                <Input
                  type="text"
                  value={organization?.slug || ''}
                  disabled
                  className="mt-1 bg-gray-50"
                />
                <p className="mt-1 text-sm text-gray-500">
                  This is your organization's unique identifier and cannot be changed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Info Message */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start">
          <Settings className="mr-3 h-5 w-5 text-blue-600" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Settings Note:</p>
            <p className="mt-1">
              You can update your organization name and contact email. Other settings like join code and branding are managed by system administrators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
