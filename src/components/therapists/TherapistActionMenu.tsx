/**
 * Therapist Action Menu Component
 * Dropdown menu for therapist management actions (edit, toggle status, delete)
 */

'use client';

import { MoreVertical, Pencil, Trash2, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';

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

type TherapistActionMenuProps = {
  therapist: Therapist;
  onEdit: (therapist: Therapist) => void;
  onToggleStatus: (therapist: Therapist) => void;
  onDelete: (therapist: Therapist) => void;
  disabled?: boolean;
};

export function TherapistActionMenu({
  therapist,
  onEdit,
  onToggleStatus,
  onDelete,
  disabled = false,
}: TherapistActionMenuProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleEdit = () => {
    setShowMenu(false);
    onEdit(therapist);
  };

  const handleToggleStatus = () => {
    setShowMenu(false);
    onToggleStatus(therapist);
  };

  const handleDelete = () => {
    setShowMenu(false);
    onDelete(therapist);
  };

  // Only show status toggle for active/inactive users, not invited or deleted
  const canToggleStatus = therapist.status !== 'invited' && therapist.status !== 'deleted';
  const isActive = therapist.status === 'active';
  const isDeleted = therapist.status === 'deleted';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled}
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Therapist actions"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
            onKeyDown={e => e.key === 'Escape' && setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {/* Edit */}
            <button
              type="button"
              onClick={handleEdit}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              <Pencil className="h-4 w-4" />
              Edit Details
            </button>

            {/* Toggle Status */}
            {canToggleStatus && (
              <button
                type="button"
                onClick={handleToggleStatus}
                className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm ${
                  isActive
                    ? 'text-amber-600 hover:bg-amber-50'
                    : 'text-green-600 hover:bg-green-50'
                }`}
              >
                {isActive ? (
                  <>
                    <UserX className="h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4" />
                    Activate
                  </>
                )}
              </button>
            )}

            {/* Separator and Delete - only show if not already deleted */}
            {!isDeleted && (
              <>
                <hr className="my-1" />
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
