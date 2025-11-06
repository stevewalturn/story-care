/**
 * Organization Detail Page
 * View and manage a specific organization
 */

'use client';

import { ArrowLeft, Building2, Calendar, Edit2, Key, Mail, Trash2, Users } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

type OrganizationDetails = {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  status: 'active' | 'trial' | 'suspended';
  joinCode: string;
  createdAt: string;
  updatedAt: string;
  trialEndsAt: string | null;
  metrics: {
    totalUsers: number;
    totalTherapists: number;
    totalPatients: number;
    totalSessions: number;
  };
};

export default function OrganizationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [organization, setOrganization] = useState<OrganizationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
    status: 'active' as 'active' | 'trial' | 'suspended',
  });

  const fetchOrganization = useCallback(async () => {
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/organizations/${params.id}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrganization(data.organization);
        setFormData({
          name: data.organization.name,
          contactEmail: data.organization.contactEmail,
          status: data.organization.status,
        });
      } else {
        setError('Failed to load organization');
      }
    } catch (err) {
      setError('Error loading organization');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, params.id]);

  useEffect(() => {
    if (user && params.id) {
      fetchOrganization();
    }
  }, [user, params.id, fetchOrganization]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/organizations/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchOrganization();
        setIsEditing(false);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update organization');
      }
    } catch (err) {
      setError('Error updating organization');
      console.error(err);
    }
  };

  const handleDelete = async () => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return;
    }

    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/organizations/${params.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        router.push('/super-admin/organizations');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete organization');
      }
    } catch (err) {
      setError('Error deleting organization');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error || 'Organization not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => router.push('/super-admin/organizations')}
          className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Organizations
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-indigo-100">
              <Building2 className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
              <p className="mt-1 text-sm text-gray-600">
                {organization.slug}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {!isEditing && (
              <>
                <Button variant="secondary" onClick={() => setIsEditing(true)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleDelete}
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Details Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Organization Details
            </h2>

            {isEditing
              ? (
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                      <label htmlFor="org-name" className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        id="org-name"
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="org-email" className="block text-sm font-medium text-gray-700">
                        Contact Email
                      </label>
                      <input
                        id="org-email"
                        type="email"
                        value={formData.contactEmail}
                        onChange={e => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="org-status" className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        id="org-status"
                        value={formData.status}
                        onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="trial">Trial</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" variant="primary">
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            name: organization.name,
                            contactEmail: organization.contactEmail,
                            status: organization.status,
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )
              : (
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Contact Email</dt>
                      <dd className="mt-1 flex items-center text-sm text-gray-900">
                        <Mail className="mr-2 h-4 w-4 text-gray-400" />
                        {organization.contactEmail}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Join Code</dt>
                      <dd className="mt-1 flex items-center text-sm text-gray-900">
                        <Key className="mr-2 h-4 w-4 text-gray-400" />
                        <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                          {organization.joinCode}
                        </code>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="mt-1 flex items-center text-sm text-gray-900">
                        <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                        {new Date(organization.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </dd>
                    </div>

                    {organization.trialEndsAt && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Trial Ends</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {new Date(organization.trialEndsAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
          </div>
        </div>

        {/* Metrics Sidebar */}
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Usage Metrics
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Users</dt>
                <dd className="mt-1 flex items-center text-2xl font-bold text-gray-900">
                  <Users className="mr-2 h-5 w-5 text-gray-400" />
                  {organization.metrics.totalUsers}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Therapists</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">
                  {organization.metrics.totalTherapists}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Patients</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">
                  {organization.metrics.totalPatients}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Total Sessions</dt>
                <dd className="mt-1 text-xl font-semibold text-gray-900">
                  {organization.metrics.totalSessions}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Status
            </h2>
            <div className="flex items-center">
              {organization.status === 'active' && (
                <span className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                  Active
                </span>
              )}
              {organization.status === 'trial' && (
                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                  Trial
                </span>
              )}
              {organization.status === 'suspended' && (
                <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                  Suspended
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
