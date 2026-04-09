/**
 * Super Admin Organizations Page
 * Manage all organizations on the platform
 */

'use client';

import { AlertCircle, Archive, Building2, Calendar, CheckCircle, Plus, RotateCcw, Trash2, Users, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CreateOrganizationModal } from '@/components/super-admin/CreateOrganizationModal';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedDelete, authenticatedPatch } from '@/utils/AuthenticatedFetch';

type Organization = {
  id: string;
  name: string;
  slug: string;
  contactEmail: string;
  status: 'active' | 'suspended' | 'archived';
  joinCode: string;
  createdAt: string;
  userCount: number;
};

type ViewTab = 'active' | 'archived';

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
  const [activeTab, setActiveTab] = useState<ViewTab>('active');

  const fetchOrganizations = useCallback(async (tab?: ViewTab) => {
    try {
      setLoading(true);
      const token = await user?.getIdToken();
      setIdToken(token || null);
      const currentTab = tab ?? activeTab;
      const statusParam = currentTab === 'archived' ? '?status=archived' : '';
      const response = await fetch(`/api/organizations${statusParam}`, {
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
  }, [user, activeTab]);

  useEffect(() => {
    if (user) {
      fetchOrganizations();
    }
  }, [user, fetchOrganizations]);

  const handleTabChange = (tab: ViewTab) => {
    setActiveTab(tab);
    fetchOrganizations(tab);
  };

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
      setSuccessMessage(`Organization "${organizationToDelete.name}" has been archived successfully`);
      setDeleteModalOpen(false);
      setOrganizationToDelete(null);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive organization');
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

  const handleRestore = async (org: Organization) => {
    if (!user) return;

    try {
      setError('');
      const response = await authenticatedPatch(
        `/api/organizations/${org.id}`,
        user,
        { action: 'restore' },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to restore organization');
      }

      setOrganizations(prev => prev.filter(o => o.id !== org.id));
      setSuccessMessage(`Organization "${org.name}" has been restored successfully`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore organization');
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

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          type="button"
          onClick={() => handleTabChange('active')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'active'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('archived')}
          className={`inline-flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'archived'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          <Archive className="h-3.5 w-3.5" />
          Archived
        </button>
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
                        {activeTab === 'archived' ? 'No archived organizations' : 'No organizations found'}
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
                          {activeTab === 'archived'
                            ? (
                                <button
                                  type="button"
                                  onClick={() => handleRestore(org)}
                                  className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-900"
                                  title="Restore organization"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                  Restore
                                </button>
                              )
                            : (
                                <>
                                  <a
                                    href={`/super-admin/organizations/${org.id}`}
                                    className="text-purple-600 hover:text-purple-900"
                                  >
                                    Manage
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteClick(org)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Archive organization"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </>
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
        title="Archive Organization"
        message={
          organizationToDelete
            ? `Are you sure you want to archive "${organizationToDelete.name}"? Users in this organization will no longer be able to access the platform. You can restore it later from the Archived tab.`
            : ''
        }
        isDeleting={isDeleting}
        confirmLabel="Archive"
        deletingLabel="Archiving..."
      />
    </div>
  );
}
