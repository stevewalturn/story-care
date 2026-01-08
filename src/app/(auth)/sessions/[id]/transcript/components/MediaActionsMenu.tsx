'use client';

/**
 * Media Actions Menu Component
 * Dropdown menu for media item actions
 */

import { Download, Edit, Eye, Film, MoreVertical, RefreshCw, Scissors, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type MediaActionsMenuProps = {
  media: any;
  onViewDetails: () => void;
  onEdit: () => void;
  onDownload: () => void;
  onExtractFrame?: () => void; // Video only
  onRegenerate: () => void;
  onAnimate?: () => void; // Image only
  onDelete: () => void;
};

export function MediaActionsMenu({
  media,
  onViewDetails,
  onEdit,
  onDownload,
  onExtractFrame,
  onRegenerate,
  onAnimate,
  onDelete,
}: MediaActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      {/* Menu Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
      >
        <MoreVertical className="h-4 w-4 text-gray-600" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="py-1">
            {/* View Details */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onViewDetails);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-purple-50"
            >
              <Eye className="h-4 w-4 text-gray-500" />
              <span>View Details</span>
            </button>

            {/* Edit Details */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onEdit);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-purple-50"
            >
              <Edit className="h-4 w-4 text-gray-500" />
              <span>Edit Details</span>
            </button>

            {/* Download */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onDownload);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-purple-50"
            >
              <Download className="h-4 w-4 text-gray-500" />
              <span>Download</span>
            </button>

            <div className="my-1 border-t border-gray-100" />

            {/* Extract Last Frame (Video only) */}
            {media.mediaType === 'video' && onExtractFrame && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(onExtractFrame);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-purple-50"
              >
                <Scissors className="h-4 w-4 text-purple-600" />
                <span>Extract Last Frame</span>
              </button>
            )}

            {/* Animate Image → Video (Image only) */}
            {media.mediaType === 'image' && onAnimate && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(onAnimate);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-purple-50"
              >
                <Film className="h-4 w-4 text-purple-600" />
                <span>Animate → Video</span>
              </button>
            )}

            {/* Regenerate */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onRegenerate);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-purple-50"
            >
              <RefreshCw className="h-4 w-4 text-gray-500" />
              <span>Generate New Version</span>
            </button>

            <div className="my-1 border-t border-gray-100" />

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAction(onDelete);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
