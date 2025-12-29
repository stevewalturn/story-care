/**
 * Super Admin Organizations Page
 * Manage all organizations on the platform
 */

'use client';

import { AlertCircle, Building2, Calendar, CheckCircle, Plus, Trash2, Users, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CreateOrganizationModal } from '@/components/super-admin/CreateOrganizationModal';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedDelete } from '@/utils/AuthenticatedFetch';

type Organization = {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  status: 'active' | 'suspended';
  joinCode: string;
  createdAt: string;
  userCount: number;
};

export default function OrganizationsPage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [organizationToDelete, setOrganizationToDelete] = useState<Organization | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  const handleDeleteClick = (org: Organization) => {
    setOrganizationToDelete(org);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!organizationToDelete || !user) return;

    setIsDeleting(true);
    setError('');

    try {
      const response = await authenticatedDelete(
        `/api/organizations/${organizationToDelete.id}`,
        user,
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete organization');
      }

      // Remove from local state
      setOrganizations(prev => prev.filter(o => o.id !== organizationToDelete.id));
      setSuccessMessage(`Organization "${organizationToDelete.name}" has been deleted successfully`);
      setDeleteModalOpen(false);
      setOrganizationToDelete(null);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete organization');
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setDeleteModalOpen(false);
      setOrganizationToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-700 border-green-200',
      suspended: 'bg-red-100 text-red-700 border-red-200',
    };

    const icons = {
      active: CheckCircle,
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
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

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
          {successMessage}
        </div>
      )}

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
                Users
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
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                            <Building2 className="h-5 w-5 text-purple-600" />
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
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4" />
                          {org.userCount}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          {new Date(org.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3">
                          <a
                            href={`/super-admin/organizations/${org.id}`}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Manage
                          </a>
                          {org.userCount === 0
                            ? (
                                <button
                                  onClick={() => handleDeleteClick(org)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete organization"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )
                            : (
                                <button
                                  disabled
                                  className="cursor-not-allowed text-gray-400"
                                  title="Cannot delete organization with users"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationDialog
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Organization"
        message={
          organizationToDelete
            ? `Are you sure you want to delete "${organizationToDelete.name}"? This action cannot be undone and will permanently delete all related data including groups, templates, treatment modules, and workflows.`
            : ''
        }
        isDeleting={isDeleting}
      />
    </div>
  );
}
