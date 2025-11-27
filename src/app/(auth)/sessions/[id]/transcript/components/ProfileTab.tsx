'use client';

/**
 * Profile Tab Component
 * Displays patient/session profile information
 */

import type { ProfileTabProps } from '../types/transcript.types';

export function ProfileTab({ sessionData }: ProfileTabProps) {
  if (!sessionData) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="py-12 text-center">
          <p className="text-sm text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-4">
        {/* Patient/Group Info */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-start gap-4">
            {/* Avatar/Image */}
            {(sessionData.patient?.avatarUrl || sessionData.patient?.referenceImageUrl) ? (
              <img
                src={sessionData.patient.avatarUrl || sessionData.patient.referenceImageUrl}
                alt={sessionData.patient?.name || sessionData.group?.name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {sessionData.patient?.name || sessionData.group?.name || 'Unknown'}
              </h3>
              <p className="text-sm text-gray-600">
                {sessionData.sessionType === 'individual' ? 'Individual Session' : 'Group Session'}
              </p>
              {sessionData.patient?.email && (
                <p className="mt-1 text-xs text-gray-500">{sessionData.patient.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Session Info */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">Session Details</h4>
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

        {/* Patient Info (if individual session) */}
        {sessionData.patient && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-900">Patient Information</h4>
            <div className="space-y-2">
              {sessionData.patient.dateOfBirth && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Date of Birth:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(sessionData.patient.dateOfBirth).toLocaleDateString()}
                  </span>
                </div>
              )}
              {sessionData.patient.createdAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Patient Since:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(sessionData.patient.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Module Info (if assigned) */}
        {sessionData.module && (
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-900">Treatment Module</h4>
            <div className="space-y-2">
              <p className="text-sm font-medium text-indigo-600">{sessionData.module.name}</p>
              <p className="text-xs text-gray-600">{sessionData.module.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
