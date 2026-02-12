/**
 * Therapist Detail Page
 * View comprehensive therapist information with tabs
 */

'use client';

import { AlertTriangle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AssignPatientsModal } from '@/components/therapists/AssignPatientsModal';
import { EditTherapistModal } from '@/components/therapists/EditTherapistModal';
import { TherapistActivityTab } from '@/components/therapists/TherapistActivityTab';
import { TherapistDetailHeader } from '@/components/therapists/TherapistDetailHeader';
import { TherapistOverviewTab } from '@/components/therapists/TherapistOverviewTab';
import { TherapistPatientsTab } from '@/components/therapists/TherapistPatientsTab';
import { TherapistSessionsTab } from '@/components/therapists/TherapistSessionsTab';
import { useAuth } from '@/contexts/AuthContext';

type TabType = 'overview' | 'patients' | 'sessions' | 'activity';

type TherapistDetails = {
  therapist: {
    id: string;
    name: string;
    email: string;
    status: 'active' | 'inactive' | 'invited';
    role: string;
    organizationId?: string | null;
    licenseNumber?: string | null;
    specialty?: string | null;
    avatarUrl?: string | null;
    firebaseUid?: string | null;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
  metrics: {
    totalPatients: number;
    activeSessions: number;
    totalSessions: number;
    storyPagesCreated: number;
    mediaGenerated: number;
    lastActivityDate?: string | null;
  };
  recentPatients: any[];
  recentSessions: any[];
  activityLog: any[];
};

export default function TherapistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [therapistDetails, setTherapistDetails] = useState<TherapistDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [idToken, setIdToken] = useState('');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);

  // Confirmation dialog state
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchTherapistDetails = useCallback(async () => {
    try {
      const token = await user?.getIdToken();
      if (token) {
        setIdToken(token);
      }
      const response = await fetch(`/api/therapists/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTherapistDetails(data);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to load therapist details');
      }
    } catch (err) {
      console.error(err);
      setError('Error loading therapist details');
    } finally {
      setLoading(false);
    }
  }, [user, params.id]);

  useEffect(() => {
    if (user && params.id) {
      fetchTherapistDetails();
    }
  }, [user, params.id, fetchTherapistDetails]);

  const handleResendInvitation = async () => {
    setResendLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/therapists/${params.id}/resend-invitation`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        setSuccessMessage(`Invitation email resent successfully to ${therapistDetails?.therapist.email}`);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to resend invitation');
      }
    } catch (err) {
      console.error(err);
      setError('Error resending invitation');
    } finally {
      setResendLoading(false);
    }
  };

  const handleAssignSuccess = () => {
    setSuccessMessage('Patients assigned successfully');
    fetchTherapistDetails();
  };

  const handleGenerateReport = () => {
    // Open report in new tab
    window.open(`/api/therapists/${params.id}/report?format=pdf`, '_blank');
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    fetchTherapistDetails();
    setSuccessMessage('Therapist updated successfully');
  };

  const handleToggleStatusClick = () => {
    setShowStatusConfirm(true);
    setActionError('');
  };

  const handleToggleStatusConfirm = async () => {
    if (!therapistDetails)
      return;

    setActionLoading(true);
    setActionError('');

    try {
      const newStatus = therapistDetails.therapist.status === 'active' ? 'inactive' : 'active';
      const response = await fetch(`/api/therapists/${params.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchTherapistDetails();
        setShowStatusConfirm(false);
        setSuccessMessage(`Therapist ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
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

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setActionError('');
  };

  const handleDeleteConfirm = async () => {
    if (!therapistDetails)
      return;

    setActionLoading(true);
    setActionError('');

    try {
      const response = await fetch(`/api/therapists/${params.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        // Redirect to therapist list
        router.push('/org-admin/therapists');
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
      </div>
    );
  }

  if (!therapistDetails) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error || 'Therapist not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
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

      {/* Header */}
      <TherapistDetailHeader
        therapist={therapistDetails.therapist}
        onResendInvitation={
          therapistDetails.therapist.status === 'invited' && !resendLoading
            ? handleResendInvitation
            : undefined
        }
        onAssignPatients={() => setShowAssignModal(true)}
        onGenerateReport={handleGenerateReport}
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatusClick}
        onDelete={handleDeleteClick}
        patientCount={therapistDetails.metrics.totalPatients}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('patients')}
            className={`border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap ${
              activeTab === 'patients'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Patients
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                activeTab === 'patients'
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {therapistDetails.metrics.totalPatients}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap ${
              activeTab === 'sessions'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Sessions
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                activeTab === 'sessions'
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {therapistDetails.metrics.totalSessions}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap ${
              activeTab === 'activity'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Activity Log
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                activeTab === 'activity'
                  ? 'bg-purple-100 text-purple-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {therapistDetails.activityLog.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <TherapistOverviewTab
            therapist={therapistDetails.therapist}
            organization={therapistDetails.organization}
            metrics={therapistDetails.metrics}
          />
        )}
        {activeTab === 'patients' && (
          <TherapistPatientsTab
            patients={therapistDetails.recentPatients}
            therapistId={therapistDetails.therapist.id}
            onAssignPatients={() => setShowAssignModal(true)}
            onPatientReassigned={() => {
              setSuccessMessage('Patient reassigned successfully');
              fetchTherapistDetails();
            }}
          />
        )}
        {activeTab === 'sessions' && (
          <TherapistSessionsTab sessions={therapistDetails.recentSessions} />
        )}
        {activeTab === 'activity' && (
          <TherapistActivityTab activityLog={therapistDetails.activityLog} />
        )}
      </div>

      {/* Assign Patients Modal */}
      <AssignPatientsModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        therapistId={therapistDetails.therapist.id}
        therapistName={therapistDetails.therapist.name}
        onSuccess={handleAssignSuccess}
      />

      {/* Edit Therapist Modal */}
      {showEditModal && (
        <EditTherapistModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
          therapist={therapistDetails.therapist}
          idToken={idToken}
        />
      )}

      {/* Status Toggle Confirmation Dialog */}
      {showStatusConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={actionLoading ? undefined : () => setShowStatusConfirm(false)}
          />
          <div className="relative z-10 mx-4 w-full max-w-md overflow-hidden rounded-lg bg-white shadow-xl">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                  therapistDetails.therapist.status === 'active' ? 'bg-amber-100' : 'bg-green-100'
                }`}
                >
                  <AlertTriangle className={`h-6 w-6 ${
                    therapistDetails.therapist.status === 'active' ? 'text-amber-600' : 'text-green-600'
                  }`}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {therapistDetails.therapist.status === 'active' ? 'Deactivate' : 'Activate'}
                    {' '}
                    Therapist
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {therapistDetails.therapist.status === 'active'
                      ? `Are you sure you want to deactivate ${therapistDetails.therapist.name}? They will no longer be able to access the platform.`
                      : `Are you sure you want to activate ${therapistDetails.therapist.name}? They will regain access to the platform.`}
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
                    therapistDetails.therapist.status === 'active'
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
                    : therapistDetails.therapist.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
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
                    <strong>{therapistDetails.therapist.name}</strong>
                    ? This action cannot be undone.
                  </p>
                  {therapistDetails.metrics.totalPatients > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-amber-600">
                        This therapist has
                        {' '}
                        {therapistDetails.metrics.totalPatients}
                        {' '}
                        assigned patient(s). Reassign all patients before deleting this therapist.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setActiveTab('patients');
                        }}
                        className="mt-1 text-sm font-medium text-purple-600 hover:text-purple-700"
                      >
                        View Patients
                      </button>
                    </div>
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
                  disabled={actionLoading || therapistDetails.metrics.totalPatients > 0}
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
