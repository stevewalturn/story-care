/**
 * Therapist Overview Tab Component
 * Displays therapist details and metrics
 */

'use client';

import { Building2, Calendar, FileText, Image, Mail, Users } from 'lucide-react';

type TherapistOverviewProps = {
  therapist: {
    id: string;
    name: string;
    email: string;
    status: string;
    licenseNumber?: string | null;
    specialty?: string | null;
    createdAt: string;
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
};

export function TherapistOverviewTab({ therapist, organization, metrics }: TherapistOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Therapist Details Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Therapist Information</h2>

        <dl className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 flex items-center text-sm text-gray-900">
              <Mail className="mr-2 h-4 w-4 text-gray-400" />
              {therapist.email}
            </dd>
          </div>

          {therapist.licenseNumber && (
            <div>
              <dt className="text-sm font-medium text-gray-500">License Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{therapist.licenseNumber}</dd>
            </div>
          )}

          {therapist.specialty && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Specialty</dt>
              <dd className="mt-1 text-sm text-gray-900">{therapist.specialty}</dd>
            </div>
          )}

          {organization && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Organization</dt>
              <dd className="mt-1 flex items-center text-sm text-gray-900">
                <Building2 className="mr-2 h-4 w-4 text-gray-400" />
                {organization.name}
              </dd>
            </div>
          )}

          <div>
            <dt className="text-sm font-medium text-gray-500">Account Status</dt>
            <dd className="mt-1">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  therapist.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : therapist.status === 'invited'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                }`}
              >
                {therapist.status}
              </span>
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Account Created</dt>
            <dd className="mt-1 flex items-center text-sm text-gray-900">
              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
              {new Date(therapist.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </dd>
          </div>

          {therapist.lastLoginAt && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Login</dt>
              <dd className="mt-1 flex items-center text-sm text-gray-900">
                <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                {new Date(therapist.lastLoginAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
          )}

          {metrics.lastActivityDate && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Activity</dt>
              <dd className="mt-1 flex items-center text-sm text-gray-900">
                <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                {new Date(metrics.lastActivityDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Activity Metrics Grid */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Activity Metrics</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total Patients */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Patients</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{metrics.totalPatients}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Sessions</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{metrics.activeSessions}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Total Sessions */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{metrics.totalSessions}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Story Pages Created */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Story Pages</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{metrics.storyPagesCreated}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Media Generated */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Media Generated</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{metrics.mediaGenerated}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100">
                <Image className="h-6 w-6 text-pink-600" />
              </div>
            </div>
          </div>

          {/* Account Age */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Account Age</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {Math.floor(
                    (new Date().getTime() - new Date(therapist.createdAt).getTime())
                    / (1000 * 60 * 60 * 24),
                  )}{' '}
                  days
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
