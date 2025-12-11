/**
 * Therapist Detail Header Component
 * Displays therapist info and action buttons
 */

'use client';

import { ArrowLeft, Download, Send, User, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

type TherapistHeaderProps = {
  therapist: {
    id: string;
    name: string;
    email: string;
    status: 'active' | 'inactive' | 'invited';
    avatarUrl?: string | null;
    licenseNumber?: string | null;
    specialty?: string | null;
  };
  onResendInvitation?: () => void;
  onAssignPatients?: () => void;
  onGenerateReport?: () => void;
};

export function TherapistDetailHeader({
  therapist,
  onResendInvitation,
  onAssignPatients,
  onGenerateReport,
}: TherapistHeaderProps) {
  const router = useRouter();

  return (
    <div>
      {/* Back Button */}
      <button
        type="button"
        onClick={() => router.push('/org-admin/therapists')}
        className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Therapists
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          {/* Avatar */}
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-indigo-100">
            {therapist.avatarUrl
              ? (
                  <img
                    src={therapist.avatarUrl}
                    alt={therapist.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                )
              : (
                  <User className="h-8 w-8 text-indigo-600" />
                )}
          </div>

          {/* Name and Email */}
          <div className="ml-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{therapist.name}</h1>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                  therapist.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : therapist.status === 'invited'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                }`}
                title={
                  therapist.status === 'active'
                    ? 'User has completed account setup and can access the platform'
                    : therapist.status === 'invited'
                      ? 'User has been sent an invitation email but hasn\'t set up their account yet'
                      : 'User account is inactive'
                }
              >
                {therapist.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">{therapist.email}</p>
            {therapist.licenseNumber && (
              <p className="mt-1 text-xs text-gray-500">
                License: {therapist.licenseNumber}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {therapist.status === 'invited' && onResendInvitation && (
            <Button variant="secondary" onClick={onResendInvitation}>
              <Send className="mr-2 h-4 w-4" />
              Resend Invitation
            </Button>
          )}
          {onAssignPatients && (
            <Button variant="secondary" onClick={onAssignPatients}>
              <UserPlus className="mr-2 h-4 w-4" />
              Assign Patients
            </Button>
          )}
          {onGenerateReport && (
            <Button variant="secondary" onClick={onGenerateReport}>
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
