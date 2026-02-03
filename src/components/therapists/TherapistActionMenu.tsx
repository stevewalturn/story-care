/**
 * Therapist Action Menu Component
 * Dropdown menu for therapist management actions (edit, toggle status, delete)
 * Uses React Portal to bypass overflow-hidden clipping issues
 */

'use client';

import { MoreVertical, Pencil, Trash2, UserCheck, UserX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggleMenu = () => {
    if (showMenu) {
      setShowMenu(false);
      setMenuPosition(null);
    } else {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const menuWidth = 192; // w-48 = 12rem = 192px
        const menuHeight = 160; // approximate menu height
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        // Calculate left position - prefer right-aligned, but flip if near right edge
        let left = rect.right - menuWidth;
        if (left < 8) {
          left = rect.left;
        }
        if (left + menuWidth > viewportWidth - 8) {
          left = viewportWidth - menuWidth - 8;
        }

        // Calculate top position - prefer below, but flip if near bottom
        let top = rect.bottom + 4;
        if (top + menuHeight > viewportHeight - 8) {
          top = rect.top - menuHeight - 4;
        }

        setMenuPosition({ top, left });
        setShowMenu(true);
      }
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    setMenuPosition(null);
    onEdit(therapist);
  };

  const handleToggleStatus = () => {
    setShowMenu(false);
    setMenuPosition(null);
    onToggleStatus(therapist);
  };

  const handleDelete = () => {
    setShowMenu(false);
    setMenuPosition(null);
    onDelete(therapist);
  };

  // Close menu when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current
        && !menuRef.current.contains(e.target as Node)
        && buttonRef.current
        && !buttonRef.current.contains(e.target as Node)
      ) {
        setShowMenu(false);
        setMenuPosition(null);
      }
    };

    const handleScroll = () => {
      setShowMenu(false);
      setMenuPosition(null);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMenu(false);
        setMenuPosition(null);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showMenu]);

  // Only show status toggle for active/inactive users, not invited or deleted
  const canToggleStatus = therapist.status !== 'invited' && therapist.status !== 'deleted';
  const isActive = therapist.status === 'active';
  const isDeleted = therapist.status === 'deleted';

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggleMenu}
        disabled={disabled}
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Therapist actions"
        aria-haspopup="true"
        aria-expanded={showMenu}
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {/* Portal-based Dropdown Menu */}
      {showMenu && menuPosition && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          onClick={e => e.stopPropagation()}
        >
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
              {isActive
                ? (
                    <>
                      <UserX className="h-4 w-4" />
                      Deactivate
                    </>
                  )
                : (
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
        </div>,
        document.body,
      )}
    </div>
  );
}
