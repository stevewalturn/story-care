/**
 * Super Admin Organizations Page
 * Manage all organizations on the platform
 */

'use client';

import { AlertCircle, Building2, Calendar, CheckCircle, Plus, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CreateOrganizationModal } from '@/components/super-admin/CreateOrganizationModal';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';

type Organization = {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  status: 'active' | 'trial' | 'suspended';
  joinCode: string;
  createdAt: string;
  trialEndsAt: string | null;
};

export default function OrganizationsPage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    try {
      const token = await user?.getIdToken();
      setIdToken(token || null);
      const response = await fetch('/api/organizations', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      } else {
        setError('Failed to load organizations');
      }
    } catch (err) {
      setError('Error loading organizations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchOrganizations();
    }
  }, [user, fetchOrganizations]);

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700 border-green-200',
      trial: 'bg-blue-100 text-blue-700 border-blue-200',
      suspended: 'bg-red-100 text-red-700 border-red-200',
    };

    const icons = {
      active: CheckCircle,
      trial: AlertCircle,
      suspended: XCircle,
    };

    const Icon = icons[status as keyof typeof icons] || AlertCircle;

    return (
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status as keyof typeof styles]}`}
      >
        <Icon className="mr-1 h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
          <p className="mt-2 text-gray-600">
            Manage all organizations on the platform
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </div>

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchOrganizations}
        idToken={idToken}
      />

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Organizations List */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Organization
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Join Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {organizations.length === 0
              ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">
                        No organizations found
                      </p>
                    </td>
                  </tr>
                )
              : (
                  organizations.map(org => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                            <Building2 className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {org.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {org.contactEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(org.status)}
                      </td>
                      <td className="px-6 py-4">
                        <code className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700">
                          {org.joinCode}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          {new Date(org.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                        <a
                          href={`/super-admin/organizations/${org.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Manage
                        </a>
                      </td>
                    </tr>
                  ))
                )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
