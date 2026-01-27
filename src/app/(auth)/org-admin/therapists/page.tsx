/**
 * Org Admin Therapists Page
 * Manage therapist accounts in the organization
 */

'use client';

import { AlertTriangle, Search, User, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { InviteTherapistModal } from '@/components/org-admin/InviteTherapistModal';
import { EditTherapistModal } from '@/components/therapists/EditTherapistModal';
import { TherapistActionMenu } from '@/components/therapists/TherapistActionMenu';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';

type Therapist = {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'invited' | 'deleted';
  patientCount?: number;
  licenseNumber?: string | null;
  specialty?: string | null;
  createdAt: string;
};

export default function TherapistsPage() {
  const { user } = useAuth();
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [idToken, setIdToken] = useState('');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);

  // Confirmation dialog state
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (user) {
      fetchTherapists();
    }
  }, [user]);

  const fetchTherapists = async () => {
    try {
      const token = await user?.getIdToken();
      if (token) {
        setIdToken(token);
      }
      const response = await fetch('/api/therapists', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTherapists(data.therapists || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSuccess = () => {
    // Refresh therapist list after successful invitation
    fetchTherapists();
  };

  const handleEdit = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    fetchTherapists();
    setSelectedTherapist(null);
  };

  const handleToggleStatusClick = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    setShowStatusConfirm(true);
    setActionError('');
  };

  const handleToggleStatusConfirm = async () => {
    if (!selectedTherapist)
      return;

    setActionLoading(true);
    setActionError('');

    try {
      const newStatus = selectedTherapist.status === 'active' ? 'inactive' : 'active';
      const response = await fetch(`/api/therapists/${selectedTherapist.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTherapists();
        setShowStatusConfirm(false);
        setSelectedTherapist(null);
      } else {
        const data = await response.json();
        setActionError(data.error || 'Failed to update status');
      }
    } catch {
      setActionError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    setShowDeleteConfirm(true);
    setActionError('');
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTherapist)
      return;

    setActionLoading(true);
    setActionError('');

    try {
      const response = await fetch(`/api/therapists/${selectedTherapist.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        fetchTherapists();
        setShowDeleteConfirm(false);
        setSelectedTherapist(null);
      } else {
        const data = await response.json();
        setActionError(data.error || 'Failed to delete therapist');
      }
    } catch {
      setActionError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredTherapists = therapists.filter(
    therapist =>
      therapist.name.toLowerCase().includes(searchQuery.toLowerCase())
      || therapist.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Therapists</h1>
          <p className="mt-2 text-gray-600">
            Manage therapist accounts in your organization
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowInviteModal(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Therapist
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute top-3 left-3 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search therapists..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Therapists Grid */}
      {filteredTherapists.length === 0
        ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery ? 'No therapists found' : 'No therapists in your organization'}
              </p>
            </div>
          )
        : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTherapists.map(therapist => (
                <div
                  key={therapist.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                      <User className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {therapist.name}
                      </h3>
                      <p className="text-sm text-gray-500">{therapist.email}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Patients</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {therapist.patientCount || 0}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        therapist.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : therapist.status === 'invited'
                            ? 'bg-blue-100 text-blue-700'
                            : therapist.status === 'deleted'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {therapist.status}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Link href={`/org-admin/therapists/${therapist.id}`} className="flex-1">
                      <Button variant="secondary" className="w-full text-sm">
                        View Profile
                      </Button>
                    </Link>
                    <TherapistActionMenu
                      therapist={therapist}
                      onEdit={handleEdit}
                      onToggleStatus={handleToggleStatusClick}
                      onDelete={handleDeleteClick}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

      {/* Invite Therapist Modal */}
      <InviteTherapistModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={handleInviteSuccess}
        idToken={idToken}
      />

      {/* Edit Therapist Modal */}
      {selectedTherapist && showEditModal && (
        <EditTherapistModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTherapist(null);
          }}
          onSuccess={handleEditSuccess}
          therapist={selectedTherapist}
          idToken={idToken}
        />
      )}

      {/* Status Toggle Confirmation Dialog */}
      {showStatusConfirm && selectedTherapist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={actionLoading ? undefined : () => setShowStatusConfirm(false)}
          />
          <div className="relative z-10 mx-4 w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                  selectedTherapist.status === 'active' ? 'bg-amber-100' : 'bg-green-100'
                }`}
                >
                  <AlertTriangle className={`h-6 w-6 ${
                    selectedTherapist.status === 'active' ? 'text-amber-600' : 'text-green-600'
                  }`}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedTherapist.status === 'active' ? 'Deactivate' : 'Activate'}
                    {' '}
                    Therapist
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {selectedTherapist.status === 'active'
                      ? `Are you sure you want to deactivate ${selectedTherapist.name}? They will no longer be able to access the platform.`
                      : `Are you sure you want to activate ${selectedTherapist.name}? They will regain access to the platform.`}
                  </p>
                  {actionError && (
                    <p className="mt-2 text-sm text-red-600">{actionError}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusConfirm(false);
                    setSelectedTherapist(null);
                    setActionError('');
                  }}
                  disabled={actionLoading}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleToggleStatusConfirm}
                  disabled={actionLoading}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    selectedTherapist.status === 'active'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {actionLoading
                    ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing...
                        </>
                      )
                    : selectedTherapist.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedTherapist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={actionLoading ? undefined : () => setShowDeleteConfirm(false)}
          />
          <div className="relative z-10 mx-4 w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Therapist
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Are you sure you want to delete
                    {' '}
                    <strong>{selectedTherapist.name}</strong>
                    ? This action cannot be undone.
                  </p>
                  {selectedTherapist.patientCount && selectedTherapist.patientCount > 0 && (
                    <p className="mt-2 text-sm text-amber-600">
                      This therapist has
                      {' '}
                      {selectedTherapist.patientCount}
                      {' '}
                      assigned patient(s). You must reassign them before deleting.
                    </p>
                  )}
                  {actionError && (
                    <p className="mt-2 text-sm text-red-600">{actionError}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedTherapist(null);
                    setActionError('');
                  }}
                  disabled={actionLoading}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={actionLoading}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading
                    ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Deleting...
                        </>
                      )
                    : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
