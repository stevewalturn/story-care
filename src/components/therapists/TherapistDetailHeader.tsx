/**
 * Therapist Detail Header Component
 * Displays therapist info and action buttons
 * Management actions (Edit, Deactivate/Activate, Delete) are always visible
 */

'use client';

import { ArrowLeft, Download, Pencil, Send, Settings, Trash2, User, UserCheck, UserPlus, UserX } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

type TherapistHeaderProps = {
  therapist: {
    id: string;
    name: string;
    email: string;
    status: 'active' | 'inactive' | 'invited' | 'pending_approval' | 'rejected';
    avatarUrl?: string | null;
    licenseNumber?: string | null;
    specialty?: string | null;
  };
  onResendInvitation?: () => void;
  onAssignPatients?: () => void;
  onGenerateReport?: () => void;
  onEdit?: () => void;
  onToggleStatus?: () => void;
  onDelete?: () => void;
  patientCount?: number;
};

export function TherapistDetailHeader({
  therapist,
  onResendInvitation,
  onAssignPatients,
  onGenerateReport,
  onEdit,
  onToggleStatus,
  onDelete,
  patientCount = 0,
}: TherapistHeaderProps) {
  const router = useRouter();

  const canToggleStatus = therapist.status !== 'invited' && therapist.status !== 'pending_approval' && therapist.status !== 'rejected';
  const isActive = therapist.status === 'active';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => router.push('/org-admin/therapists')}
        className="flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Therapists
      </button>

      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start">
          {/* Avatar */}
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-purple-100">
            {therapist.avatarUrl
              ? (
                  <img
                    src={therapist.avatarUrl}
                    alt={therapist.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                )
              : (
                  <User className="h-8 w-8 text-purple-600" />
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
                      : therapist.status === 'pending_approval'
                        ? 'bg-amber-100 text-amber-700'
                        : therapist.status === 'rejected'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                }`}
                title={
                  therapist.status === 'active'
                    ? 'User has completed account setup and can access the platform'
                    : therapist.status === 'invited'
                      ? 'User has been sent an invitation email but hasn\'t set up their account yet'
                      : therapist.status === 'pending_approval'
                        ? 'Invitation is awaiting administrator approval'
                        : therapist.status === 'rejected'
                          ? 'Invitation was rejected by an administrator'
                          : 'User account is inactive'
                }
              >
                {therapist.status === 'pending_approval' ? 'Awaiting Approval' : therapist.status === 'rejected' ? 'Rejected' : therapist.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">{therapist.email}</p>
            {therapist.licenseNumber && (
              <p className="mt-1 text-xs text-gray-500">
                License:
                {' '}
                {therapist.licenseNumber}
              </p>
            )}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
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

      {/* Management Actions Section - Always visible, prominent */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Settings className="h-4 w-4" />
          Manage Therapist
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {/* Edit Details - Always visible */}
          {onEdit && (
            <Button
              variant="secondary"
              onClick={onEdit}
              className="border-gray-300 bg-white"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Details
            </Button>
          )}

          {/* Status Toggle - Only for active/inactive users, not invited */}
          {onToggleStatus && canToggleStatus && (
            <Button
              variant="secondary"
              onClick={onToggleStatus}
              className={
                isActive
                  ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
              }
            >
              {isActive
                ? (
                    <>
                      <UserX className="mr-2 h-4 w-4" />
                      Deactivate
                    </>
                  )
                : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Activate
                    </>
                  )}
            </Button>
          )}

          {/* Delete Button - Always visible */}
          {onDelete && (
            <Button
              variant="secondary"
              onClick={onDelete}
              className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
              title={patientCount > 0
                ? `Warning: ${patientCount} patient(s) assigned. Deletion will require reassigning patients.`
                : 'Delete therapist'}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Therapist
            </Button>
          )}
        </div>

        {/* Warning for patients assigned */}
        {patientCount > 0 && (
          <p className="mt-3 text-xs text-amber-600">
            This therapist has
            {' '}
            {patientCount}
            {' '}
            patient(s) assigned. Deleting will require reassigning them to another therapist.
          </p>
        )}
      </div>
    </div>
  );
}
