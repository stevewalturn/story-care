/**
 * Therapist Detail Page
 * View comprehensive therapist information with tabs
 */

'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AssignPatientsModal } from '@/components/therapists/AssignPatientsModal';
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
  const { user } = useAuth();
  const [therapistDetails, setTherapistDetails] = useState<TherapistDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const fetchTherapistDetails = useCallback(async () => {
    try {
      const idToken = await user?.getIdToken();
      const response = await fetch(`/api/therapists/${params.id}`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
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
            onAssignPatients={() => setShowAssignModal(true)}
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
    </div>
  );
}
