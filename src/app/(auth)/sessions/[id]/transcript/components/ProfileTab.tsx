'use client';

/**
 * Profile Tab Component
 * Displays patient/session profile information
 */

import type { ProfileTabProps } from '../types/transcript.types';

export function ProfileTab({ sessionData, selectedPatient }: ProfileTabProps) {
  if (!sessionData) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="py-12 text-center">
          <p className="text-sm text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Find selected patient from session data
  const getSelectedPatientData = () => {
    if (!selectedPatient || !sessionData) return null;

    // Individual session
    if (sessionData.patient?.id === selectedPatient) {
      return sessionData.patient;
    }

    // Group session - find in members
    if (sessionData.group?.members) {
      return sessionData.group.members.find((m: any) => m.id === selectedPatient);
    }

    return null;
  };

  const patientData = getSelectedPatientData();

  return (
    <div className="flex-1 overflow-y-auto bg-white p-4">
      <div className="space-y-4">
        {/* Patient Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-start gap-4">
            {/* Avatar/Image */}
            {(patientData?.avatarUrl || patientData?.referenceImageUrl) ? (
              <img
                src={patientData.avatarUrl || patientData.referenceImageUrl}
                alt={patientData.name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-2xl font-semibold text-purple-700">
                {patientData?.name?.charAt(0) || '?'}
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{patientData?.name || 'Unknown Patient'}</h3>
              <p className="text-sm text-gray-500">{patientData?.email || 'No email'}</p>
            </div>
          </div>

          {/* Patient Details */}
          <div className="space-y-2 border-t border-gray-100 pt-3">
            {patientData?.dateOfBirth && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date of Birth</span>
                <span className="font-medium text-gray-900">
                  {new Date(patientData.dateOfBirth).toLocaleDateString()}
                </span>
              </div>
            )}
            {patientData?.createdAt && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Patient Since</span>
                <span className="font-medium text-gray-900">
                  {new Date(patientData.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Session Information (Context) */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Session Information</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium text-gray-900">
                {sessionData.sessionDate ? new Date(sessionData.sessionDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium text-gray-900 capitalize">{sessionData.sessionType || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                sessionData.transcriptionStatus === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : sessionData.transcriptionStatus === 'processing'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
              }`}
              >
                {sessionData.transcriptionStatus || 'pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Module Info (if assigned) */}
        {sessionData.module && (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h4 className="mb-3 text-sm font-semibold text-gray-900">Treatment Module</h4>
            <div className="space-y-2">
              <p className="text-sm font-medium text-purple-600">{sessionData.module.name}</p>
              <p className="text-xs text-gray-600">{sessionData.module.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
